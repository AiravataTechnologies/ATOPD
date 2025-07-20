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
import { useToast } from "@/hooks/use-toast";
import { insertHospitalSchema, updateHospitalSchema, type InsertHospital, type UpdateHospital, type Hospital, OPD_DEPARTMENTS } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Building2, Camera, Eye, Edit, Trash2, MapPin, Phone, Mail, Globe, Calendar } from "lucide-react";

export default function HospitalRegistration() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [customDepartment, setCustomDepartment] = useState("");
  const [hospitalImage, setHospitalImage] = useState<string | null>(null);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [viewingHospital, setViewingHospital] = useState<Hospital | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InsertHospital>({
    resolver: zodResolver(insertHospitalSchema),
    defaultValues: {
      name: "",
      address: "",
      contactNumber: "",
      email: "",
      licenseNumber: "",
      hospitalType: "",
      opdDepartments: [],
      hospitalImage: "",
      description: "",
      website: "",
      establishedYear: undefined,
      totalBeds: undefined,
      emergencyServices: false,
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

  const onSubmit = (data: Omit<InsertHospital, "opdDepartments">) => {
    if (selectedDepartments.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one OPD department",
        variant: "destructive",
      });
      return;
    }

    const hospitalData: InsertHospital = {
      ...data,
      hospitalImage: hospitalImage || "",
      opdDepartments: selectedDepartments,
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Label htmlFor="hospitalType">Hospital Type *</Label>
                  <Select onValueChange={(value) => form.setValue("hospitalType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Multispecialty">Multispecialty</SelectItem>
                      <SelectItem value="Specialized">Specialized</SelectItem>
                      <SelectItem value="Teaching">Teaching Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.hospitalType && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.hospitalType.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    {...form.register("address")}
                    placeholder="Enter complete address"
                    rows={3}
                  />
                  {form.formState.errors.address && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.address.message}
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
                  <Label htmlFor="licenseNumber">License Number *</Label>
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

                {/* OPD Department Selection */}
                <div className="md:col-span-2">
                  <Label>OPD Departments *</Label>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Select the OPD departments your hospital offers:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {OPD_DEPARTMENTS.map((dept) => (
                          <div key={dept} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={dept}
                              checked={selectedDepartments.includes(dept)}
                              onChange={() => toggleDepartment(dept)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={dept} className="text-sm font-normal cursor-pointer">
                              {dept}
                            </Label>
                          </div>
                        ))}
                      </div>

                      {/* Hospital Image Upload */}
                      <div className="space-y-3">
                        <Label>Hospital Image</Label>
                        <div className="flex items-center space-x-4">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center space-x-2"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Upload Image</span>
                          </Button>
                          {hospitalImage && (
                            <div className="relative">
                              <img 
                                src={hospitalImage} 
                                alt="Hospital preview" 
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => {
                                  setHospitalImage(null);
                                  form.setValue("hospitalImage", "");
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <p className="text-sm text-gray-500">Upload an image of the hospital (Max 5MB)</p>
                      </div>

                      {/* Additional Information */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Additional Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="establishedYear">Established Year</Label>
                            <Input
                              id="establishedYear"
                              type="number"
                              {...form.register("establishedYear", { 
                                valueAsNumber: true,
                                setValueAs: (v) => v === "" ? undefined : Number(v)
                              })}
                              placeholder="e.g., 2020"
                            />
                          </div>

                          <div>
                            <Label htmlFor="totalBeds">Total Beds</Label>
                            <Input
                              id="totalBeds"
                              type="number"
                              {...form.register("totalBeds", { 
                                valueAsNumber: true,
                                setValueAs: (v) => v === "" ? undefined : Number(v)
                              })}
                              placeholder="e.g., 100"
                            />
                          </div>

                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              {...form.register("website")}
                              placeholder="https://www.hospital.com"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="emergencyServices"
                              checked={form.watch("emergencyServices")}
                              onCheckedChange={(checked) => form.setValue("emergencyServices", checked)}
                            />
                            <Label htmlFor="emergencyServices">24/7 Emergency Services</Label>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            {...form.register("description")}
                            placeholder="Brief description about the hospital"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Department Input */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Or add a custom department:</p>
                      <div className="flex space-x-2">
                        <Input
                          value={customDepartment}
                          onChange={(e) => setCustomDepartment(e.target.value)}
                          placeholder="Enter custom department name"
                          className="flex-1"
                        />
                        <Button type="button" onClick={addCustomDepartment} variant="outline" size="sm">
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Selected Departments */}
                    {selectedDepartments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Selected Departments:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDepartments.map((dept) => (
                            <span
                              key={dept}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {dept}
                              <button
                                type="button"
                                onClick={() => removeDepartment(dept)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHospitalMutation.isPending}>
                  {createHospitalMutation.isPending ? "Registering..." : "Register Hospital"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Registered Hospitals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading hospitals...</p>
          ) : hospitals?.length === 0 ? (
            <p className="text-gray-500">No hospitals registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospitals?.map((hospital) => (
                  <Card key={hospital._id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {hospital.hospitalImage ? (
                            <img 
                              src={hospital.hospitalImage} 
                              alt={hospital.name}
                              className="w-12 h-12 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              {hospital.hospitalId && <Badge variant="outline">{hospital.hospitalId}</Badge>}
                              {hospital.hospitalCode && <Badge variant="secondary">{hospital.hospitalCode}</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setViewingHospital(hospital)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Hospital Details</DialogTitle>
                              </DialogHeader>
                              {viewingHospital && (
                                <div className="space-y-6">
                                  <div className="flex items-center space-x-4">
                                    {viewingHospital.hospitalImage ? (
                                      <img 
                                        src={viewingHospital.hospitalImage} 
                                        alt={viewingHospital.name}
                                        className="w-24 h-24 object-cover rounded-lg border"
                                      />
                                    ) : (
                                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Building2 className="h-12 w-12 text-gray-400" />
                                      </div>
                                    )}
                                    <div>
                                      <h3 className="text-xl font-bold">{viewingHospital.name}</h3>
                                      <p className="text-gray-600">{viewingHospital.hospitalType}</p>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Badge>{viewingHospital.hospitalId}</Badge>
                                        <Badge variant="secondary">{viewingHospital.hospitalCode}</Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm">{viewingHospital.address}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm">{viewingHospital.contactNumber}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm">{viewingHospital.email}</span>
                                      </div>
                                      {viewingHospital.website && (
                                        <div className="flex items-center space-x-2">
                                          <Globe className="h-4 w-4 text-gray-400" />
                                          <a href={viewingHospital.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                            {viewingHospital.website}
                                          </a>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-3">
                                      {viewingHospital.establishedYear && (
                                        <div className="flex items-center space-x-2">
                                          <Calendar className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm">Est. {viewingHospital.establishedYear}</span>
                                        </div>
                                      )}
                                      {viewingHospital.totalBeds && (
                                        <div className="text-sm">
                                          <span className="font-medium">Beds:</span> {viewingHospital.totalBeds}
                                        </div>
                                      )}
                                      <div className="text-sm">
                                        <span className="font-medium">License:</span> {viewingHospital.licenseNumber}
                                      </div>
                                      {viewingHospital.emergencyServices && (
                                        <Badge className="bg-red-100 text-red-800">24/7 Emergency</Badge>
                                      )}
                                    </div>
                                  </div>

                                  {viewingHospital.description && (
                                    <div>
                                      <h4 className="font-medium mb-2">Description</h4>
                                      <p className="text-sm text-gray-600">{viewingHospital.description}</p>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="font-medium mb-2">OPD Departments</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {viewingHospital.opdDepartments?.map((dept, index) => (
                                        <Badge key={index} variant="outline">{dept}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingHospital(hospital)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this hospital?')) {
                                deleteHospitalMutation.mutate(hospital._id!);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="font-medium">{hospital.hospitalType}</span>
                          {hospital.emergencyServices && (
                            <Badge className="ml-2 bg-red-100 text-red-800 text-xs">Emergency</Badge>
                          )}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{hospital.contactNumber}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{hospital.email}</span>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">OPD Departments:</p>
                          <div className="flex flex-wrap gap-1">
                            {hospital.opdDepartments?.slice(0, 3).map((dept, index) => (
                              <Badge key={index} variant="outline" className="text-xs">{dept}</Badge>
                            ))}
                            {(hospital.opdDepartments?.length || 0) > 3 && (
                              <Badge variant="outline" className="text-xs">+{(hospital.opdDepartments?.length || 0) - 3} more</Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(hospital.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Hospital Dialog */}
      {editingHospital && (
        <Dialog open={!!editingHospital} onOpenChange={() => setEditingHospital(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Hospital</DialogTitle>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit((data) => {
              updateHospitalMutation.mutate({ 
                id: editingHospital._id!, 
                data: { ...data, opdDepartments: selectedDepartments } 
              });
            })} className="space-y-6">
              {/* Similar form fields as creation but with pre-filled values */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Hospital Name *</Label>
                  <Input
                    id="edit-name"
                    {...editForm.register("name")}
                    defaultValue={editingHospital.name}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Hospital Type *</Label>
                  <Select onValueChange={(value) => editForm.setValue("hospitalType", value)} defaultValue={editingHospital.hospitalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Multispecialty">Multispecialty</SelectItem>
                      <SelectItem value="Specialized">Specialized</SelectItem>
                      <SelectItem value="Teaching">Teaching Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Add more fields as needed */}
              </div>
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setEditingHospital(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateHospitalMutation.isPending}>
                  {updateHospitalMutation.isPending ? "Updating..." : "Update Hospital"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
