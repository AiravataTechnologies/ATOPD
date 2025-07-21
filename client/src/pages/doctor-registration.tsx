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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertDoctorSchema, updateDoctorSchema, type InsertDoctor, type UpdateDoctor, type Doctor, type Opd, type Hospital } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, UserRound, Camera, Upload, Eye, Edit, Trash2, Phone, Mail, Award, Clock } from "lucide-react";

export default function DoctorRegistration() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedOpdId, setSelectedOpdId] = useState<string | null>(null);
  const [doctorImage, setDoctorImage] = useState<string>("");
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<Omit<InsertDoctor, "opdId" | "availableTimeSlots">>({
    resolver: zodResolver(insertDoctorSchema.omit({ opdId: true, availableTimeSlots: true })),
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      specialization: "",
      qualification: "",
      experienceYears: 0,
      doctorLicenseId: "",
    },
  });

  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: allOpds } = useQuery<Opd[]>({
    queryKey: ["/api/opds"],
  });

  // Filter OPDs by selected hospital
  const opds = allOpds?.filter(opd => opd.hospitalId === selectedHospitalId) || [];

  const { data: doctors, isLoading } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const createDoctorMutation = useMutation({
    mutationFn: async (data: InsertDoctor) => {
      const response = await apiRequest("POST", `/api/opds/${data.opdId}/doctors`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Success",
        description: "Doctor registered successfully",
      });
      form.reset();
      setTimeSlots([]);
      setSelectedHospitalId(null);
      setSelectedOpdId(null);
      setDoctorImage("");
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

  const updateDoctorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDoctor }) => {
      const response = await apiRequest("PUT", `/api/doctors/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Success",
        description: "Doctor updated successfully",
      });
      setEditingDoctor(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/doctors/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Success",
        description: "Doctor deleted successfully",
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

  const onSubmit = (data: Omit<InsertDoctor, "opdId" | "availableTimeSlots">) => {
    if (!selectedOpdId) {
      toast({
        title: "Error",
        description: "Please select an OPD department",
        variant: "destructive",
      });
      return;
    }

    if (timeSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot",
        variant: "destructive",
      });
      return;
    }

    const doctorData: InsertDoctor = {
      ...data,
      opdId: selectedOpdId,
      availableTimeSlots: timeSlots,
      doctorImage: doctorImage || "",
    };

    createDoctorMutation.mutate(doctorData);
  };

  const addTimeSlot = () => {
    if (newTimeSlot.trim() && !timeSlots.includes(newTimeSlot.trim())) {
      setTimeSlots([...timeSlots, newTimeSlot.trim()]);
      setNewTimeSlot("");
    }
  };

  const removeTimeSlot = (slot: string) => {
    setTimeSlots(timeSlots.filter(s => s !== slot));
  };

  // Image upload functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size should be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.includes('image')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setDoctorImage(result);
        toast({
          title: "Success",
          description: "Doctor image uploaded successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const captureFromCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(event);
  };

  const uploadFromFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Registration</h1>
          <p className="text-gray-600 mt-1">Register doctors under specific OPD departments</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Doctor</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserRound className="h-5 w-5 text-primary" />
              <span>Doctor Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Doctor Image Upload */}
              <div className="mb-6">
                <Label>Doctor Photo</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex-shrink-0">
                    {doctorImage ? (
                      <img
                        src={doctorImage}
                        alt="Doctor"
                        className="w-24 h-24 object-cover rounded-full border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-300">
                        <UserRound className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button type="button" variant="outline" onClick={captureFromCamera} className="flex items-center space-x-2">
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </Button>
                    <Button type="button" variant="outline" onClick={uploadFromFile} className="flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </Button>
                    {doctorImage && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => setDoctorImage("")}>
                        Remove Photo
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleCameraCapture}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload a professional photo (max 2MB)</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Doctor Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Dr. Full Name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="doctor@email.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    {...form.register("mobileNumber")}
                    placeholder="+91 9999999999"
                  />
                  {form.formState.errors.mobileNumber && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.mobileNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    {...form.register("specialization")}
                    placeholder="e.g., Cardiology, General Medicine"
                  />
                  {form.formState.errors.specialization && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.specialization.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="qualification">Qualification *</Label>
                  <Input
                    id="qualification"
                    {...form.register("qualification")}
                    placeholder="MBBS, MD, etc."
                  />
                  {form.formState.errors.qualification && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.qualification.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="experienceYears">Experience (Years) *</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    {...form.register("experienceYears", { valueAsNumber: true })}
                    placeholder="Years of experience"
                  />
                  {form.formState.errors.experienceYears && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.experienceYears.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="doctorLicenseId">License ID *</Label>
                  <Input
                    id="doctorLicenseId"
                    {...form.register("doctorLicenseId")}
                    placeholder="Medical license number"
                  />
                  {form.formState.errors.doctorLicenseId && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.doctorLicenseId.message}
                    </p>
                  )}
                </div>

                {/* Hospital Selection */}
                <div className="md:col-span-2">
                  <Label htmlFor="hospitalSelect">Select Hospital *</Label>
                  <Select value={selectedHospitalId || ""} onValueChange={(value) => {
                    setSelectedHospitalId(value);
                    setSelectedOpdId(null); // Reset OPD selection when hospital changes
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitals?.map((hospital) => (
                        <SelectItem key={hospital._id} value={hospital._id!}>
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* OPD Selection */}
                <div className="md:col-span-2">
                  <Label htmlFor="opdSelect">Select OPD Department *</Label>
                  <Select 
                    disabled={!selectedHospitalId} 
                    value={selectedOpdId || ""} 
                    onValueChange={(value) => setSelectedOpdId(value)}
                  >
                    <SelectTrigger id="opdSelect">
                      <SelectValue placeholder={selectedHospitalId ? "Choose an OPD department" : "Please select a hospital first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {opds.map((opd) => (
                        <SelectItem key={opd._id} value={opd._id!}>
                          {opd.name} - Room {opd.roomNumber} ({opd.timings})
                        </SelectItem>
                      ))}
                      {selectedHospitalId && opds.length === 0 && (
                        <SelectItem value="no-opds" disabled>
                          No OPDs found. Please create OPDs in OPD Management first.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select from existing OPD departments or available hospital departments
                  </p>
                </div>
              </div>

              <div>
                <Label>Available Time Slots *</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    placeholder="e.g., 10:00-12:00"
                  />
                  <Button type="button" onClick={addTimeSlot}>
                    Add
                  </Button>
                </div>
                {timeSlots.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm flex items-center space-x-2"
                      >
                        <span>{slot}</span>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(slot)}
                          className="text-primary hover:text-primary/70"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDoctorMutation.isPending}>
                  {createDoctorMutation.isPending ? "Registering..." : "Register Doctor"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Registered Doctors</h2>
          <p className="text-sm text-gray-500">
            {doctors?.length || 0} doctor{doctors?.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading doctors...</p>
          </div>
        ) : doctors?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <UserRound className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No doctors registered yet.</p>
              <p className="text-sm text-gray-400">Click "New Doctor" to register your first doctor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors?.map((doctor) => (
              <Card key={doctor._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    {doctor.doctorImage ? (
                      <img
                        src={doctor.doctorImage}
                        alt={doctor.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                        <UserRound className="w-16 h-16 text-primary/60" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="secondary" onClick={() => setViewingDoctor(doctor)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Doctor Details - {viewingDoctor?.name}</DialogTitle>
                          </DialogHeader>
                          {viewingDoctor && <DoctorDetailsView doctor={viewingDoctor} />}
                        </DialogContent>
                      </Dialog>
                      
                      <Button size="sm" variant="outline" onClick={() => setEditingDoctor(doctor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Doctor</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Are you sure you want to delete Dr. {doctor.name}?</p>
                            <p className="text-sm text-gray-600">This action cannot be undone.</p>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline">Cancel</Button>
                              <Button 
                                variant="destructive"
                                onClick={() => deleteDoctorMutation.mutate(doctor._id!)}
                                disabled={deleteDoctorMutation.isPending}
                              >
                                {deleteDoctorMutation.isPending ? "Deleting..." : "Delete Doctor"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{doctor.name}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2 text-primary" />
                        <span>{doctor.specialization}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        <span>{doctor.mobileNumber}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-primary" />
                        <span>{doctor.email}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <span>{doctor.experienceYears} years experience</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">Available Time Slots:</p>
                      <div className="flex flex-wrap gap-1">
                        {doctor.availableTimeSlots.slice(0, 3).map((slot) => (
                          <Badge key={slot} variant="secondary" className="text-xs">
                            {slot}
                          </Badge>
                        ))}
                        {doctor.availableTimeSlots.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{doctor.availableTimeSlots.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Doctor Dialog */}
      {editingDoctor && (
        <Dialog open={!!editingDoctor} onOpenChange={(open) => !open && setEditingDoctor(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Doctor - {editingDoctor.name}</DialogTitle>
            </DialogHeader>
            <EditDoctorForm 
              doctor={editingDoctor}
              onSave={(data) => updateDoctorMutation.mutate({ id: editingDoctor._id!, data })}
              onCancel={() => setEditingDoctor(null)}
              isLoading={updateDoctorMutation.isPending}
              hospitals={hospitals || []}
              allOpds={allOpds || []}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Doctor Details View Component
function DoctorDetailsView({ doctor }: { doctor: Doctor }) {
  const { data: allOpds } = useQuery<Opd[]>({
    queryKey: ["/api/opds"],
  });

  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const doctorOpd = allOpds?.find(opd => opd._id === doctor.opdId);
  const doctorHospital = hospitals?.find(hospital => hospital._id === doctorOpd?.hospitalId);

  return (
    <div className="space-y-6">
      {/* Doctor Image and Basic Info */}
      <div className="flex items-start space-x-6">
        {doctor.doctorImage ? (
          <img
            src={doctor.doctorImage}
            alt={doctor.name}
            className="w-32 h-32 object-cover rounded-lg border-4 border-primary/20"
          />
        ) : (
          <div className="w-32 h-32 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center border-4 border-gray-300">
            <UserRound className="w-16 h-16 text-primary/60" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{doctor.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-gray-600">
              <Award className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="font-medium">{doctor.specialization}</p>
                <p className="text-sm text-gray-500">Specialization</p>
              </div>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="font-medium">{doctor.experienceYears} Years</p>
                <p className="text-sm text-gray-500">Experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Professional Information</h4>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-500">Qualification</Label>
              <p className="text-gray-900">{doctor.qualification}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">License ID</Label>
              <p className="font-mono text-gray-900">{doctor.doctorLicenseId}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Hospital</Label>
              <p className="text-gray-900">{doctorHospital?.name || "Loading..."}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">OPD Department</Label>
              <p className="text-gray-900">{doctorOpd?.name || "Loading..."}</p>
              {doctorOpd && (
                <p className="text-sm text-gray-500">Room {doctorOpd.roomNumber} • {doctorOpd.timings}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Contact Information</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="text-gray-900">{doctor.mobileNumber}</p>
                <p className="text-sm text-gray-500">Mobile Number</p>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="text-gray-900">{doctor.email}</p>
                <p className="text-sm text-gray-500">Email Address</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Time Slots */}
      <div>
        <h4 className="font-semibold text-lg mb-3">Available Time Slots</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {doctor.availableTimeSlots.map((slot, index) => (
            <div key={index} className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-center font-medium">
              {slot}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Edit Doctor Form Component
function EditDoctorForm({ 
  doctor, 
  onSave, 
  onCancel, 
  isLoading, 
  hospitals,
  allOpds 
}: { 
  doctor: Doctor; 
  onSave: (data: UpdateDoctor) => void; 
  onCancel: () => void; 
  isLoading: boolean;
  hospitals: Hospital[];
  allOpds: Opd[];
}) {
  const { toast } = useToast();
  const editForm = useForm<UpdateDoctor>({
    resolver: zodResolver(updateDoctorSchema),
    defaultValues: {
      name: doctor.name,
      email: doctor.email,
      mobileNumber: doctor.mobileNumber,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experienceYears: doctor.experienceYears,
      doctorLicenseId: doctor.doctorLicenseId,
      availableTimeSlots: doctor.availableTimeSlots,
      doctorImage: doctor.doctorImage || "",
    }
  });

  const [editTimeSlots, setEditTimeSlots] = useState<string[]>(doctor.availableTimeSlots || []);
  const [newEditTimeSlot, setNewEditTimeSlot] = useState("");
  const [editDoctorImage, setEditDoctorImage] = useState<string>(doctor.doctorImage || "");

  const addEditTimeSlot = () => {
    if (newEditTimeSlot.trim() && !editTimeSlots.includes(newEditTimeSlot.trim())) {
      const updatedSlots = [...editTimeSlots, newEditTimeSlot.trim()];
      setEditTimeSlots(updatedSlots);
      editForm.setValue("availableTimeSlots", updatedSlots);
      setNewEditTimeSlot("");
    }
  };

  const removeEditTimeSlot = (slot: string) => {
    const updatedSlots = editTimeSlots.filter(s => s !== slot);
    setEditTimeSlots(updatedSlots);
    editForm.setValue("availableTimeSlots", updatedSlots);
  };

  const handleEditSubmit = (data: UpdateDoctor) => {
    if (editTimeSlots.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one time slot",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      ...data,
      availableTimeSlots: editTimeSlots,
      doctorImage: editDoctorImage,
    };
    onSave(updateData);
  };

  return (
    <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
      {/* Image Display */}
      <div className="flex items-center space-x-4">
        {editDoctorImage ? (
          <img
            src={editDoctorImage}
            alt="Doctor"
            className="w-20 h-20 object-cover rounded-full border-4 border-primary/20"
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-300">
            <UserRound className="w-10 h-10 text-gray-400" />
          </div>
        )}
        <div>
          <p className="text-sm text-gray-600">Current photo will be preserved</p>
          <p className="text-xs text-gray-500">Image editing will be available in future updates</p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-name">Doctor Name *</Label>
          <Input
            id="edit-name"
            {...editForm.register("name")}
          />
        </div>
        <div>
          <Label htmlFor="edit-email">Email Address *</Label>
          <Input
            id="edit-email"
            type="email"
            {...editForm.register("email")}
          />
        </div>
        <div>
          <Label htmlFor="edit-mobileNumber">Mobile Number *</Label>
          <Input
            id="edit-mobileNumber"
            {...editForm.register("mobileNumber")}
          />
        </div>
        <div>
          <Label htmlFor="edit-specialization">Specialization *</Label>
          <Input
            id="edit-specialization"
            {...editForm.register("specialization")}
          />
        </div>
        <div>
          <Label htmlFor="edit-qualification">Qualification *</Label>
          <Input
            id="edit-qualification"
            {...editForm.register("qualification")}
          />
        </div>
        <div>
          <Label htmlFor="edit-experienceYears">Experience (Years) *</Label>
          <Input
            id="edit-experienceYears"
            type="number"
            {...editForm.register("experienceYears", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="edit-doctorLicenseId">License ID *</Label>
          <Input
            id="edit-doctorLicenseId"
            {...editForm.register("doctorLicenseId")}
          />
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <Label>Available Time Slots *</Label>
        <div className="flex space-x-2 mt-2">
          <Input
            value={newEditTimeSlot}
            onChange={(e) => setNewEditTimeSlot(e.target.value)}
            placeholder="e.g., 10:00-12:00"
          />
          <Button type="button" onClick={addEditTimeSlot}>
            Add
          </Button>
        </div>
        {editTimeSlots.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {editTimeSlots.map((slot) => (
              <div
                key={slot}
                className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm flex items-center space-x-2"
              >
                <span>{slot}</span>
                <button
                  type="button"
                  onClick={() => removeEditTimeSlot(slot)}
                  className="text-primary hover:text-primary/70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
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
          {isLoading ? "Updating..." : "Update Doctor"}
        </Button>
      </div>
    </form>
  );
}
