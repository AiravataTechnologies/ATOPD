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
  
  // PDF upload refs
  const registrationCertRef = useRef<HTMLInputElement>(null);
  const licenseDocRef = useRef<HTMLInputElement>(null);
  const gstCertRef = useRef<HTMLInputElement>(null);

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
      contactNumber: "+91 ",
      email: "",
      website: "",
      
      // Administrator/Owner Details
      adminFullName: "",
      adminDesignation: "",
      adminMobileNumber: "+91 ",
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
    onSuccess: (hospital) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals"] });
      toast({
        title: "Hospital Registered Successfully!",
        description: `Hospital ID: ${hospital.hospitalId} | Code: ${hospital.hospitalCode} | Username: ${hospital.username} | Password: ${hospital.password}`,
      });
      form.reset();
      setSelectedDepartments([]);
      setSelectedSpecializations([]);
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

  // Handle specialization change and auto-populate OPD departments
  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    const currentSpecializations = form.getValues("specializations") || [];
    let updatedSpecializations: string[];
    
    if (checked) {
      updatedSpecializations = [...currentSpecializations, specialization];
    } else {
      updatedSpecializations = currentSpecializations.filter(s => s !== specialization);
    }
    
    form.setValue("specializations", updatedSpecializations);
    setSelectedSpecializations(updatedSpecializations);
    
    // Auto-populate OPD departments based on specializations
    const opdMapping: { [key: string]: string } = {
      "General": "General",
      "Cardiology": "Cardio", 
      "ENT": "ENT",
      "Gynecology": "Gyno",
      "Orthopedic": "Orthopedic",
      "Pediatrics": "Pediatrics",
      "Dermatology": "Dermatology",
      "Ophthalmology": "Ophthalmology",
      "Neurology": "Neurology",
      "Emergency Medicine": "Emergency"
    };
    
    const autoOpdDepartments = updatedSpecializations
      .map(spec => opdMapping[spec] || spec)
      .filter(Boolean);
    
    // Combine auto-populated departments with manually selected ones
    const combinedDepartments = [...selectedDepartments, ...autoOpdDepartments];
    const allDepartments = Array.from(new Set(combinedDepartments));
    setSelectedDepartments(allDepartments);
    form.setValue("opdDepartments", allDepartments);
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit
        toast({
          title: "Error",
          description: "Image size must be less than 500KB",
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

  // Handle PDF file uploads
  const handlePdfUpload = (fileType: 'registration' | 'license' | 'gst') => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 500 * 1024) { // 500KB limit for PDFs
          toast({
            title: "Error",
            description: "File size must be less than 500KB",
            variant: "destructive",
          });
          return;
        }

        if (!file.type.includes('pdf') && !file.type.includes('image')) {
          toast({
            title: "Error",
            description: "Please upload a PDF or image file",
            variant: "destructive",
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const fieldName = fileType === 'registration' ? 'registrationCertificate' : 
                           fileType === 'license' ? 'licenseDocument' : 'gstCertificate';
          form.setValue(fieldName, result);
          
          toast({
            title: "Success",
            description: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} document uploaded successfully`,
          });
        };
        reader.readAsDataURL(file);
      }
    };
  };



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
      // Combine address fields for legacy compatibility
      address: `${data.addressLine1}, ${data.addressLine2 ? data.addressLine2 + ', ' : ''}${data.city}, ${data.state} - ${data.pinCode}`,
      // Keep date as-is since it's already a Date object
      licenseValidityDate: data.licenseValidityDate,
      // Remove manual username/password as they will be auto-generated
      username: "",
      password: "",
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
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
              
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

                  {/* Specializations Selection */}
                  <div className="md:col-span-2">
                    <Label>Specializations Offered *</Label>
                    <p className="text-sm text-gray-600 mb-3">Select the medical specializations your hospital offers (this will auto-populate OPD departments):</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                      {SPECIALIZATIONS.map((specialization) => (
                        <div key={specialization} className="flex items-center space-x-2">
                          <Checkbox
                            id={specialization}
                            checked={selectedSpecializations.includes(specialization)}
                            onCheckedChange={(checked) => handleSpecializationChange(specialization, checked as boolean)}
                          />
                          <Label htmlFor={specialization} className="text-sm cursor-pointer">
                            {specialization}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Selected Specializations Display */}
                    {selectedSpecializations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedSpecializations.map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                            <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleSpecializationChange(spec, false)} />
                          </Badge>
                        ))}
                      </div>
                    )}
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
                      {...form.register("licenseValidityDate", { 
                        setValueAs: (value) => value ? new Date(value) : new Date()
                      })}
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
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Hospital credentials will be automatically generated upon registration:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    <li>Username: Based on hospital code (e.g., ath_mh_001)</li>
                    <li>Password: Auto-generated secure password</li>
                    <li>Role: Hospital Admin</li>
                  </ul>
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
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => registrationCertRef.current?.click()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Upload PDF/Image
                      </Button>
                      <input
                        type="file"
                        ref={registrationCertRef}
                        onChange={handlePdfUpload('registration')}
                        accept=".pdf,image/*"
                        className="hidden"
                      />
                      {form.watch("registrationCertificate") && (
                        <Badge variant="secondary" className="ml-2">File uploaded</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>License Document</Label>
                    <div className="mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => licenseDocRef.current?.click()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Upload PDF/Image
                      </Button>
                      <input
                        type="file"
                        ref={licenseDocRef}
                        onChange={handlePdfUpload('license')}
                        accept=".pdf,image/*"
                        className="hidden"
                      />
                      {form.watch("licenseDocument") && (
                        <Badge variant="secondary" className="ml-2">File uploaded</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>GST Certificate</Label>
                    <div className="mt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => gstCertRef.current?.click()}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Upload PDF/Image
                      </Button>
                      <input
                        type="file"
                        ref={gstCertRef}
                        onChange={handlePdfUpload('gst')}
                        accept=".pdf,image/*"
                        className="hidden"
                      />
                      {form.watch("gstCertificate") && (
                        <Badge variant="secondary" className="ml-2">File uploaded</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-populated OPD Department Display */}
              {selectedDepartments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Auto-populated OPD Departments</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>OPD Departments (Based on Specializations)</Label>
                      <p className="text-sm text-gray-600 mb-3">These departments are automatically created based on your selected specializations:</p>
                      
                      {/* Selected Departments Display */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedDepartments.map((dept) => (
                          <Badge key={dept} variant="secondary" className="text-xs">
                            {dept}
                          </Badge>
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
                    </div>
                  </div>
                </div>
              )}

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

                              {/* Login Credentials Section */}
                              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-semibold text-blue-900 mb-3">🔐 Hospital Login Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div className="bg-white p-3 rounded border">
                                    <Label className="font-medium text-blue-700">Hospital ID:</Label>
                                    <p className="font-mono text-blue-900">{viewingHospital.hospitalId || "Not available"}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border">
                                    <Label className="font-medium text-blue-700">Hospital Code:</Label>
                                    <p className="font-mono text-blue-900">{viewingHospital.hospitalCode || "Not available"}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border">
                                    <Label className="font-medium text-blue-700">Username:</Label>
                                    <p className="font-mono text-blue-900">{viewingHospital.username || "Not available"}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border md:col-span-2">
                                    <Label className="font-medium text-blue-700">Password:</Label>
                                    <p className="font-mono text-blue-900">{viewingHospital.password || "Not available"}</p>
                                  </div>
                                  <div className="bg-white p-3 rounded border">
                                    <Label className="font-medium text-blue-700">Role:</Label>
                                    <p className="font-mono text-blue-900">Hospital Admin</p>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Hospital Details */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Complete Hospital Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Label className="font-medium">Website:</Label>
                                    <p>{viewingHospital.website || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">GST Number:</Label>
                                    <p>{viewingHospital.gstNumber || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Issuing Authority:</Label>
                                    <p>{viewingHospital.issuingAuthority || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">License Validity:</Label>
                                    <p>{viewingHospital.licenseValidityDate ? new Date(viewingHospital.licenseValidityDate).toLocaleDateString() : "Not provided"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Established Year:</Label>
                                    <p>{viewingHospital.establishedYear || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <Label className="font-medium">Hospital Image:</Label>
                                    {viewingHospital.hospitalImage ? (
                                      <img src={viewingHospital.hospitalImage} alt="Hospital" className="w-20 h-20 object-cover rounded border" />
                                    ) : (
                                      <p>No image uploaded</p>
                                    )}
                                  </div>
                                </div>

                                {/* Administrator Details */}
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Administrator Details</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <Label className="font-medium">Admin Mobile:</Label>
                                      <p>{viewingHospital.adminMobileNumber || "Not provided"}</p>
                                    </div>
                                    <div>
                                      <Label className="font-medium">Admin Email:</Label>
                                      <p>{viewingHospital.adminEmailId || "Not provided"}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Documents Section */}
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Uploaded Documents</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="border p-3 rounded">
                                      <Label className="font-medium">Registration Certificate:</Label>
                                      {viewingHospital.registrationCertificate ? (
                                        <div className="mt-2">
                                          <a href={viewingHospital.registrationCertificate} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            View Document
                                          </a>
                                        </div>
                                      ) : (
                                        <p className="text-gray-500">Not uploaded</p>
                                      )}
                                    </div>
                                    <div className="border p-3 rounded">
                                      <Label className="font-medium">License Document:</Label>
                                      {viewingHospital.licenseDocument ? (
                                        <div className="mt-2">
                                          <a href={viewingHospital.licenseDocument} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            View Document
                                          </a>
                                        </div>
                                      ) : (
                                        <p className="text-gray-500">Not uploaded</p>
                                      )}
                                    </div>
                                    <div className="border p-3 rounded">
                                      <Label className="font-medium">GST Certificate:</Label>
                                      {viewingHospital.gstCertificate ? (
                                        <div className="mt-2">
                                          <a href={viewingHospital.gstCertificate} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            View Document
                                          </a>
                                        </div>
                                      ) : (
                                        <p className="text-gray-500">Not uploaded</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Complete Address */}
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Complete Address</h5>
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p>{viewingHospital.addressLine1}</p>
                                    {viewingHospital.addressLine2 && <p>{viewingHospital.addressLine2}</p>}
                                    <p>{viewingHospital.city}, {viewingHospital.state} - {viewingHospital.pinCode}</p>
                                  </div>
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

                      <Dialog open={editingHospital?._id === hospital._id} onOpenChange={(open) => !open && setEditingHospital(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingHospital(hospital)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Hospital - {editingHospital?.name}</DialogTitle>
                          </DialogHeader>
                          {editingHospital && (
                            <EditHospitalForm 
                              hospital={editingHospital} 
                              onSave={(updatedHospital) => {
                                updateHospitalMutation.mutate({ 
                                  id: editingHospital._id!, 
                                  data: updatedHospital 
                                });
                              }}
                              onCancel={() => setEditingHospital(null)}
                              isLoading={updateHospitalMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

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

// Edit Hospital Form Component
function EditHospitalForm({ 
  hospital, 
  onSave, 
  onCancel, 
  isLoading 
}: { 
  hospital: Hospital; 
  onSave: (data: UpdateHospital) => void; 
  onCancel: () => void; 
  isLoading: boolean; 
}) {
  const { toast } = useToast();
  const editForm = useForm<UpdateHospital>({
    resolver: zodResolver(updateHospitalSchema),
    defaultValues: {
      name: hospital.name,
      registrationNumber: hospital.registrationNumber,
      hospitalType: hospital.hospitalType,
      specializations: hospital.specializations || [],
      addressLine1: hospital.addressLine1,
      addressLine2: hospital.addressLine2 || "",
      city: hospital.city,
      state: hospital.state,
      pinCode: hospital.pinCode,
      contactNumber: hospital.contactNumber,
      email: hospital.email,
      website: hospital.website || "",
      adminFullName: hospital.adminFullName,
      adminDesignation: hospital.adminDesignation,
      adminMobileNumber: hospital.adminMobileNumber || "",
      adminEmailId: hospital.adminEmailId || "",
      licenseNumber: hospital.licenseNumber,
      issuingAuthority: hospital.issuingAuthority,
      licenseValidityDate: hospital.licenseValidityDate ? new Date(hospital.licenseValidityDate) : new Date(),
      nabhAccreditation: hospital.nabhAccreditation || false,
      gstNumber: hospital.gstNumber || "",
      totalBeds: hospital.totalBeds,
      icuBeds: hospital.icuBeds,
      emergencyServices: hospital.emergencyServices || false,
      pharmacyInside: hospital.pharmacyInside || false,
      opdDepartments: hospital.opdDepartments || [],
      establishedYear: hospital.establishedYear,
    }
  });

  const [editSelectedSpecializations, setEditSelectedSpecializations] = useState<string[]>(hospital.specializations || []);
  const [editSelectedDepartments, setEditSelectedDepartments] = useState<string[]>(hospital.opdDepartments || []);

  const handleEditSpecializationChange = (specialization: string, checked: boolean) => {
    const currentSpecs = editSelectedSpecializations;
    let updatedSpecs: string[];
    
    if (checked) {
      updatedSpecs = [...currentSpecs, specialization];
    } else {
      updatedSpecs = currentSpecs.filter(s => s !== specialization);
    }
    
    setEditSelectedSpecializations(updatedSpecs);
    editForm.setValue("specializations", updatedSpecs);
  };

  const handleEditSubmit = (data: UpdateHospital) => {
    const updateData = {
      ...data,
      specializations: editSelectedSpecializations,
      opdDepartments: editSelectedDepartments,
      address: `${data.addressLine1}, ${data.addressLine2 ? data.addressLine2 + ', ' : ''}${data.city}, ${data.state} - ${data.pinCode}`,
    };
    onSave(updateData);
  };

  return (
    <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-name">Hospital Name *</Label>
            <Input
              id="edit-name"
              {...editForm.register("name")}
            />
          </div>
          <div>
            <Label htmlFor="edit-registrationNumber">Registration Number *</Label>
            <Input
              id="edit-registrationNumber"
              {...editForm.register("registrationNumber")}
            />
          </div>
          <div>
            <Label htmlFor="edit-hospitalType">Hospital Type *</Label>
            <Select 
              value={editForm.watch("hospitalType")} 
              onValueChange={(value) => editForm.setValue("hospitalType", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="Government">Government</SelectItem>
                <SelectItem value="Trust">Trust</SelectItem>
                <SelectItem value="Clinic">Clinic</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-contactNumber">Contact Number *</Label>
            <Input
              id="edit-contactNumber"
              {...editForm.register("contactNumber")}
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              {...editForm.register("email")}
            />
          </div>
          <div>
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              {...editForm.register("website")}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Address Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-addressLine1">Address Line 1 *</Label>
            <Input
              id="edit-addressLine1"
              {...editForm.register("addressLine1")}
            />
          </div>
          <div>
            <Label htmlFor="edit-addressLine2">Address Line 2</Label>
            <Input
              id="edit-addressLine2"
              {...editForm.register("addressLine2")}
            />
          </div>
          <div>
            <Label htmlFor="edit-city">City *</Label>
            <Input
              id="edit-city"
              {...editForm.register("city")}
            />
          </div>
          <div>
            <Label htmlFor="edit-state">State *</Label>
            <Input
              id="edit-state"
              {...editForm.register("state")}
            />
          </div>
          <div>
            <Label htmlFor="edit-pinCode">Pin Code *</Label>
            <Input
              id="edit-pinCode"
              {...editForm.register("pinCode")}
            />
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Specializations</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPECIALIZATIONS.map((specialization) => (
            <div key={specialization} className="flex items-center space-x-2">
              <Checkbox
                id={`edit-spec-${specialization}`}
                checked={editSelectedSpecializations.includes(specialization)}
                onCheckedChange={(checked) => handleEditSpecializationChange(specialization, checked as boolean)}
              />
              <Label htmlFor={`edit-spec-${specialization}`} className="text-sm">
                {specialization}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? "Updating..." : "Update Hospital"}
        </Button>
      </div>
    </form>
  );
}
