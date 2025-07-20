import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { insertHospitalSchema, updateHospitalSchema, type InsertHospital, type UpdateHospital, type Hospital, OPD_DEPARTMENTS, SPECIALIZATIONS } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Building2, Camera, Eye, Edit, Trash2, MapPin, Phone, Mail, Globe, Calendar, FileText, Shield, Bed, Users, Upload, X, Search } from "lucide-react";

export default function HospitalRegistration() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [customDepartment, setCustomDepartment] = useState("");
  const [hospitalImage, setHospitalImage] = useState<string | null>(null);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [viewingHospital, setViewingHospital] = useState<Hospital | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<InsertHospital>({
    resolver: zodResolver(insertHospitalSchema),
    defaultValues: {
      // Basic Information
      name: "",
      registrationNumber: "",
      hospitalType: "Private",
      specializations: [],
      
      // Address & Contact Details
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pinCode: "",
      contactNumber: "",
      email: "",
      website: "",
      
      // Administrator/Owner Details
      adminFullName: "",
      adminDesignation: "",
      adminMobileNumber: "",
      adminEmailId: "",
      
      // Licensing & Accreditation
      licenseNumber: "",
      issuingAuthority: "",
      licenseValidityDate: new Date(),
      nabhAccreditation: false,
      gstNumber: "",
      
      // Facilities/Infrastructure
      totalBeds: undefined,
      icuBeds: undefined,
      emergencyServices: false,
      pharmacyInside: false,
      ambulanceService: false,
      
      // Login & Access Setup
      username: "",
      password: "",
      userRole: "Hospital Admin",
      
      // Documents
      hospitalImage: "",
      registrationCertificate: "",
      licenseDocument: "",
      gstCertificate: "",
      
      // Legacy fields
      opdDepartments: [],
      description: "",
      establishedYear: undefined,
    },
  });

  const editForm = useForm<UpdateHospital>({
    resolver: zodResolver(updateHospitalSchema),
  });

  const { data: hospitals, isLoading } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const createHospitalMutation = useMutation({
    mutationFn: async (data: InsertHospital) => {
      const response = await apiRequest("POST", "/api/hospitals/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      toast({
        title: "Success",
        description: "Hospital registered successfully",
      });
      form.reset();
      setSelectedDepartments([]);
      setCustomDepartment("");
      setHospitalImage(null);
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setHospitalImage(result);
        form.setValue("hospitalImage", result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update hospital mutation
  const updateHospitalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHospital }) => {
      const response = await apiRequest("PUT", `/api/hospitals/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      toast({
        title: "Success",
        description: "Hospital updated successfully",
      });
      setEditingHospital(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete hospital mutation
  const deleteHospitalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/hospitals/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      toast({
        title: "Success",
        description: "Hospital deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertHospital) => {
    if (selectedSpecializations.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one specialization",
        variant: "destructive",
      });
      return;
    }

    const hospitalData: InsertHospital = {
      ...data,
      specializations: selectedSpecializations,
      opdDepartments: selectedDepartments,
      hospitalImage: hospitalImage || "",
    };

    createHospitalMutation.mutate(hospitalData);
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev => 
      prev.includes(dept) 
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  const addCustomDepartment = () => {
    if (customDepartment.trim() && !selectedDepartments.includes(customDepartment.trim())) {
      setSelectedDepartments(prev => [...prev, customDepartment.trim()]);
      setCustomDepartment("");
    }
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev => 
      prev.includes(spec) 
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const removeSpecialization = (spec: string) => {
    setSelectedSpecializations(prev => prev.filter(s => s !== spec));
  };

  const removeDepartment = (dept: string) => {
    setSelectedDepartments(prev => prev.filter(d => d !== dept));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Registration</h1>
          <p className="text-gray-600 mt-1">Register and manage hospital information</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Hospital</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Hospital Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">1. Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Hospital Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Enter hospital name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="registrationNumber">Hospital Registration Number *</Label>
                    <Input
                      id="registrationNumber"
                      {...form.register("registrationNumber")}
                      placeholder="Enter registration number"
                    />
                    {form.formState.errors.registrationNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.registrationNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="hospitalType">Type of Hospital *</Label>
                    <Select onValueChange={(value) => form.setValue("hospitalType", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hospital type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Trust">Trust</SelectItem>
                        <SelectItem value="Clinic">Clinic</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.hospitalType && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.hospitalType.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Specializations Offered *</Label>
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                        {SPECIALIZATIONS.map((spec) => (
                          <div key={spec} className="flex items-center space-x-2">
                            <Checkbox
                              id={spec}
                              checked={selectedSpecializations.includes(spec)}
                              onCheckedChange={() => toggleSpecialization(spec)}
                            />
                            <Label htmlFor={spec} className="text-sm cursor-pointer">{spec}</Label>
                          </div>
                        ))}
                      </div>
                      {selectedSpecializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedSpecializations.map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeSpecialization(spec)} />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">2. Address & Contact Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      {...form.register("addressLine1")}
                      placeholder="Building, Street"
                    />
                    {form.formState.errors.addressLine1 && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.addressLine1.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      {...form.register("addressLine2")}
                      placeholder="Area, Landmark"
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      placeholder="Enter city"
                    />
                    {form.formState.errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      {...form.register("state")}
                      placeholder="Enter state"
                    />
                    {form.formState.errors.state && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.state.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pinCode">PIN Code *</Label>
                    <Input
                      id="pinCode"
                      {...form.register("pinCode")}
                      placeholder="Enter PIN code"
                    />
                    {form.formState.errors.pinCode && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.pinCode.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      {...form.register("contactNumber")}
                      placeholder="+91 9999999999"
                    />
                    {form.formState.errors.contactNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.contactNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="hospital@email.com"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      {...form.register("website")}
                      placeholder="https://www.hospital.com"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Administrator or Owner Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">3. Administrator or Owner Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminFullName">Admin Full Name *</Label>
                    <Input
                      id="adminFullName"
                      {...form.register("adminFullName")}
                      placeholder="Enter admin full name"
                    />
                    {form.formState.errors.adminFullName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.adminFullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="adminDesignation">Designation *</Label>
                    <Input
                      id="adminDesignation"
                      {...form.register("adminDesignation")}
                      placeholder="e.g., Owner, Director, Admin"
                    />
                    {form.formState.errors.adminDesignation && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.adminDesignation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="adminMobileNumber">Mobile Number *</Label>
                    <Input
                      id="adminMobileNumber"
                      {...form.register("adminMobileNumber")}
                      placeholder="+91 9999999999"
                    />
                    {form.formState.errors.adminMobileNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.adminMobileNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="adminEmailId">Email ID *</Label>
                    <Input
                      id="adminEmailId"
                      type="email"
                      {...form.register("adminEmailId")}
                      placeholder="admin@hospital.com"
                    />
                    {form.formState.errors.adminEmailId && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.adminEmailId.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Licensing & Accreditation */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">4. Licensing & Accreditation</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">Hospital License Number / Certificate No. *</Label>
                    <Input
                      id="licenseNumber"
                      {...form.register("licenseNumber")}
                      placeholder="Enter license number"
                    />
                    {form.formState.errors.licenseNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.licenseNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="issuingAuthority">Issuing Authority *</Label>
                    <Input
                      id="issuingAuthority"
                      {...form.register("issuingAuthority")}
                      placeholder="Enter issuing authority"
                    />
                    {form.formState.errors.issuingAuthority && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.issuingAuthority.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="licenseValidityDate">License Validity Date *</Label>
                    <Input
                      id="licenseValidityDate"
                      type="date"
                      {...form.register("licenseValidityDate")}
                    />
                    {form.formState.errors.licenseValidityDate && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.licenseValidityDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                    <Input
                      id="gstNumber"
                      {...form.register("gstNumber")}
                      placeholder="Enter GST number"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nabhAccreditation"
                      checked={form.watch("nabhAccreditation")}
                      onCheckedChange={(checked) => form.setValue("nabhAccreditation", checked as boolean)}
                    />
                    <Label htmlFor="nabhAccreditation">NABH Accreditation</Label>
                  </div>
                </div>
              </div>

              {/* Section 5: Facilities / Infrastructure */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Bed className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">5. Facilities / Infrastructure</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalBeds">Total Beds</Label>
                    <Input
                      id="totalBeds"
                      type="number"
                      {...form.register("totalBeds", { valueAsNumber: true })}
                      placeholder="Enter total beds"
                    />
                  </div>

                  <div>
                    <Label htmlFor="icuBeds">ICU Beds</Label>
                    <Input
                      id="icuBeds"
                      type="number"
                      {...form.register("icuBeds", { valueAsNumber: true })}
                      placeholder="Enter ICU beds"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="emergencyServices"
                      checked={form.watch("emergencyServices")}
                      onCheckedChange={(checked) => form.setValue("emergencyServices", checked as boolean)}
                    />
                    <Label htmlFor="emergencyServices">Emergency Services Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pharmacyInside"
                      checked={form.watch("pharmacyInside")}
                      onCheckedChange={(checked) => form.setValue("pharmacyInside", checked as boolean)}
                    />
                    <Label htmlFor="pharmacyInside">Pharmacy Inside</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ambulanceService"
                      checked={form.watch("ambulanceService")}
                      onCheckedChange={(checked) => form.setValue("ambulanceService", checked as boolean)}
                    />
                    <Label htmlFor="ambulanceService">Ambulance Service</Label>
                  </div>
                </div>
              </div>

              {/* Section 6: Login & Access Setup */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">6. Login & Access Setup</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username / Hospital Code</Label>
                    <Input
                      id="username"
                      {...form.register("username")}
                      placeholder="Auto-generated or manual"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...form.register("password")}
                      placeholder="Enter password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userRole">User Role</Label>
                    <Input
                      id="userRole"
                      {...form.register("userRole")}
                      value="Hospital Admin"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Document Upload */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">7. Optional Documents Upload</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Hospital Logo Upload */}
                  <div className="md:col-span-2">
                    <Label>Hospital Logo (for dashboard and reports)</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center space-x-2"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Upload Logo</span>
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                        {hospitalImage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setHospitalImage(null);
                              form.setValue("hospitalImage", "");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {hospitalImage && (
                        <div className="w-32 h-32 border rounded overflow-hidden">
                          <img
                            src={hospitalImage}
                            alt="Hospital preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Hospital Registration Certificate</Label>
                    <div className="mt-2">
                      <Button type="button" variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload PDF/Image
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>License Document</Label>
                    <div className="mt-2">
                      <Button type="button" variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload PDF/Image
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>GST Certificate</Label>
                    <div className="mt-2">
                      <Button type="button" variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Upload PDF/Image
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* OPD Department Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">OPD Departments</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Select OPD Departments *</Label>
                    <p className="text-sm text-gray-600 mb-3">Choose the OPD departments your hospital offers:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {OPD_DEPARTMENTS.map((dept) => (
                        <div key={dept} className="flex items-center space-x-2">
                          <Checkbox
                            id={dept}
                            checked={selectedDepartments.includes(dept)}
                            onCheckedChange={() => toggleDepartment(dept)}
                          />
                          <Label htmlFor={dept} className="text-sm cursor-pointer">
                            {dept}
                          </Label>
                        </div>
                      ))}
                    </div>

                    {/* Custom Department Input */}
                    <div className="mt-4 flex items-center space-x-2">
                      <Input
                        value={customDepartment}
                        onChange={(e) => setCustomDepartment(e.target.value)}
                        placeholder="Add custom department"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addCustomDepartment} size="sm">
                        Add
                      </Button>
                    </div>

                    {/* Selected Departments Display */}
                    {selectedDepartments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedDepartments.map((dept) => (
                          <Badge key={dept} variant="secondary" className="text-xs">
                            {dept}
                            <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeDepartment(dept)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createHospitalMutation.isPending}
                  className="min-w-32"
                >
                  {createHospitalMutation.isPending ? "Registering..." : "Register Hospital"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Hospital Listing Section with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Registered Hospitals</span>
            </CardTitle>
            
            {/* Search Filter */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading hospitals...</div>
          ) : (
            <div className="space-y-4">
              {hospitals?.filter(hospital => 
                hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hospital.hospitalType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hospital.addressLine1.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((hospital) => (
                <div key={hospital._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{hospital.name}</h3>
                        <Badge variant="outline">{hospital.hospitalType}</Badge>
                        {hospital.nabhAccreditation && (
                          <Badge variant="secondary">NABH Accredited</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{hospital.addressLine1}, {hospital.city}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{hospital.contactNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-4 w-4" />
                          <span>{hospital.email}</span>
                        </div>
                      </div>

                      {hospital.specializations && hospital.specializations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Specializations:</p>
                          <div className="flex flex-wrap gap-1">
                            {hospital.specializations.slice(0, 5).map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {hospital.specializations.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{hospital.specializations.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {hospital.opdDepartments && hospital.opdDepartments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">OPD Departments:</p>
                          <div className="flex flex-wrap gap-1">
                            {hospital.opdDepartments.map((dept, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {dept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setViewingHospital(hospital)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{viewingHospital?.name} - Details</DialogTitle>
                          </DialogHeader>
                          {viewingHospital && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="font-medium">Hospital Type:</Label>
                                  <p>{viewingHospital.hospitalType}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Registration Number:</Label>
                                  <p>{viewingHospital.registrationNumber}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">License Number:</Label>
                                  <p>{viewingHospital.licenseNumber}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Admin:</Label>
                                  <p>{viewingHospital.adminFullName} ({viewingHospital.adminDesignation})</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Total Beds:</Label>
                                  <p>{viewingHospital.totalBeds || "Not specified"}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">ICU Beds:</Label>
                                  <p>{viewingHospital.icuBeds || "Not specified"}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <Label className="font-medium">Address:</Label>
                                  <p>{viewingHospital.addressLine1}, {viewingHospital.addressLine2 && viewingHospital.addressLine2 + ", "}{viewingHospital.city}, {viewingHospital.state} - {viewingHospital.pinCode}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Emergency Services:</Label>
                                  <p>{viewingHospital.emergencyServices ? "Available" : "Not Available"}</p>
                                </div>
                                <div>
                                  <Label className="font-medium">Pharmacy:</Label>
                                  <p>{viewingHospital.pharmacyInside ? "Available" : "Not Available"}</p>
                                </div>
                              </div>

                              {viewingHospital.opdDepartments && (
                                <div>
                                  <Label className="font-medium">OPD Departments:</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {viewingHospital.opdDepartments.map((dept, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {dept}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" onClick={() => setEditingHospital(hospital)}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Hospital</DialogTitle>
                          </DialogHeader>
                          <p>Are you sure you want to delete {hospital.name}? This action cannot be undone.</p>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline">Cancel</Button>
                            <Button variant="destructive" onClick={() => deleteHospitalMutation.mutate(hospital._id!)}>
                              Delete
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Quick Add OPD Button */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        OPD Departments: {hospital.opdDepartments?.length || 0}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Navigate to OPD management with this hospital pre-selected
                          window.location.href = `/opds?hospital=${hospital._id}`;
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add OPD
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
