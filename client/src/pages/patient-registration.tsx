import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertPatientSchema, updatePatientSchema, type InsertPatient, type UpdatePatient, type Patient, type Doctor, type Hospital, type Opd } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, User, Phone, Heart, Calendar, PhoneCall, Camera, Eye, Edit, Trash2, Upload, UserCircle, MapPin, Activity, Clock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type PatientFormData = Omit<InsertPatient, "existingConditions" | "allergies" | "medications" | "pastDiseases" | "dob" | "appointmentDate" | "hospitalId" | "opdId" | "doctorId"> & {
  existingConditions: string;
  allergies: string;
  medications: string;
  pastDiseases: string;
  dob: string;
  appointmentDate: string;
  hospitalId?: string;
  opdId?: string;
  doctorId?: string;
};

export default function PatientRegistration() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedOpdId, setSelectedOpdId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(
      insertPatientSchema
        .omit({ 
          existingConditions: true, 
          allergies: true, 
          medications: true, 
          pastDiseases: true, 
          doctorId: true,
          hospitalId: true,
          opdId: true 
        })
        .extend({
          existingConditions: z.string().optional(),
          allergies: z.string().optional(),
          medications: z.string().optional(),
          pastDiseases: z.string().optional(),
          doctorId: z.string().optional(),
          hospitalId: z.string().optional(),
          opdId: z.string().optional(),
          dob: z.string(),
          appointmentDate: z.string(),
        })
    ),
    defaultValues: {
      fullName: "",
      gender: "Male" as const,
      dob: new Date().toISOString().split('T')[0], // Use string format for input
      bloodGroup: "",
      mobileNumber: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
      weight: undefined,
      height: undefined,
      existingConditions: "",
      allergies: "",
      medications: "",
      pastDiseases: "",
      familyHistory: "",
      visitType: "New" as const,
      doctorId: "",
      appointmentDate: new Date().toISOString().split('T')[0], // Use string format for input
      symptoms: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      relationWithPatient: "",
      photo: "",
    },
  });

  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: allDoctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: allOpds } = useQuery<Opd[]>({
    queryKey: ["/api/opds"],
  });

  // Filter OPDs by selected hospital
  const filteredOpds = allOpds?.filter(opd => opd.hospitalId === selectedHospitalId) || [];
  
  // Filter doctors by selected OPD
  const filteredDoctors = allDoctors?.filter(doctor => doctor.opdId === selectedOpdId) || [];

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients/register", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient registered successfully",
      });
      form.reset();
      setSelectedHospitalId(null);
      setSelectedOpdId(null);
      setSelectedDoctorId(null);
      setPhotoPreview(null);
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

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePatient }) => {
      const response = await apiRequest("PUT", `/api/patients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient updated successfully",
      });
      setEditingPatient(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/patients/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient deleted successfully",
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

  // Auto-calculate age from DOB
  const watchedDob = form.watch("dob");
  useEffect(() => {
    if (watchedDob) {
      const dobDate = new Date(watchedDob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      
      if (age >= 0) {
        form.setValue("age", age);
      }
    }
  }, [watchedDob, form]);

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Error",
          description: "File size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        form.setValue("photo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // For simplicity, we'll just trigger the file input for now
      // In a real app, you'd implement camera capture with canvas
      fileInputRef.current?.click();
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast({
        title: "Camera Error", 
        description: "Unable to access camera. Please upload a photo instead.",
        variant: "destructive",
      });
      fileInputRef.current?.click();
    }
  };

  const onSubmit = (data: PatientFormData) => {
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    
    if (!selectedHospitalId) {
      toast({
        title: "Error",
        description: "Please select a hospital",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOpdId) {
      toast({
        title: "Error",
        description: "Please select an OPD department",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDoctorId) {
      toast({
        title: "Error",
        description: "Please select a doctor",
        variant: "destructive",
      });
      return;
    }

    // Convert dates to proper Date objects and handle arrays
    const patientData: InsertPatient = {
      ...data,
      hospitalId: selectedHospitalId,
      opdId: selectedOpdId,
      doctorId: selectedDoctorId,
      dob: new Date(data.dob),
      appointmentDate: new Date(data.appointmentDate),
      existingConditions: data.existingConditions
        ? data.existingConditions.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : [],
      allergies: data.allergies
        ? data.allergies.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : [],
      medications: data.medications
        ? data.medications.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : [],
      pastDiseases: data.pastDiseases
        ? data.pastDiseases.split(',').map(item => item.trim()).filter(item => item.length > 0)
        : [],
    };

    console.log("Patient data to submit:", patientData);
    createPatientMutation.mutate(patientData);
  };

  const onError = (errors: any) => {
    console.log("Form validation errors:", errors);
    const firstError = Object.keys(errors)[0];
    toast({
      title: "Validation Error",
      description: `Please check: ${errors[firstError]?.message || firstError}`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Registration</h1>
          <p className="text-gray-600 mt-1">Register new patients and manage medical records</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Patient</span>
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Patient Registration</CardTitle>
            <p className="text-sm text-gray-600">Complete the form to register a new patient</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Personal Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      {...form.register("fullName")}
                      placeholder="Enter patient's full name"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select onValueChange={(value) => form.setValue("gender", value as "Male" | "Female" | "Other")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.gender && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.gender.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      {...form.register("dob", { valueAsDate: true })}
                    />
                    {form.formState.errors.dob && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.dob.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      {...form.register("age", { valueAsNumber: true })}
                      placeholder="Auto-calculated"
                      className="bg-gray-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select onValueChange={(value) => form.setValue("bloodGroup", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="patient@email.com"
                    />
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
                </div>
              </div>

              {/* Medical Information Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Medical Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      {...form.register("weight", { valueAsNumber: true })}
                      placeholder="65.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      {...form.register("height", { valueAsNumber: true })}
                      placeholder="170"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="existingConditions">Existing Conditions</Label>
                    <Input
                      id="existingConditions"
                      {...form.register("existingConditions")}
                      placeholder="Diabetes, Hypertension (comma separated)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="allergies">Known Allergies</Label>
                    <Input
                      id="allergies"
                      {...form.register("allergies")}
                      placeholder="Penicillin, Peanuts (comma separated)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Input
                      id="medications"
                      {...form.register("medications")}
                      placeholder="Metformin, Lisinopril (comma separated)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="pastDiseases">Past Diseases</Label>
                    <Input
                      id="pastDiseases"
                      {...form.register("pastDiseases")}
                      placeholder="Typhoid, Malaria (comma separated)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="familyHistory">Family History</Label>
                    <Textarea
                      id="familyHistory"
                      {...form.register("familyHistory")}
                      placeholder="Relevant family medical history"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Information Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Appointment Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="visitType">Visit Type *</Label>
                    <Select onValueChange={(value) => form.setValue("visitType", value as "New" | "Follow-up")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Visit Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New Patient</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.visitType && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.visitType.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="hospital">Select Hospital *</Label>
                    <Select 
                      onValueChange={(value) => {
                        setSelectedHospitalId(value);
                        setSelectedOpdId(null);
                        setSelectedDoctorId(null);
                      }}
                      value={selectedHospitalId || ""}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals?.map((hospital) => (
                          <SelectItem key={hospital._id} value={hospital._id!}>
                            {hospital.name} - {hospital.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="opd">Select OPD Department *</Label>
                    <Select 
                      onValueChange={(value) => {
                        setSelectedOpdId(value);
                        setSelectedDoctorId(null);
                      }}
                      value={selectedOpdId || ""}
                      disabled={!selectedHospitalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose OPD Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredOpds.map((opd) => (
                          <SelectItem key={opd._id} value={opd._id!}>
                            {opd.name} - Room {opd.roomNumber}
                          </SelectItem>
                        ))}
                        {selectedHospitalId && filteredOpds.length === 0 && (
                          <SelectItem value="no-opds" disabled>
                            No OPD departments found. Please create them first.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="doctor">Select Doctor *</Label>
                    <Select 
                      onValueChange={(value) => {
                        setSelectedDoctorId(value);
                        form.setValue("doctorId", value);
                      }}
                      value={selectedDoctorId || ""}
                      disabled={!selectedOpdId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDoctors.map((doctor) => (
                          <SelectItem key={doctor._id} value={doctor._id!}>
                            {doctor.name} - {doctor.specialization}
                          </SelectItem>
                        ))}
                        {selectedOpdId && filteredDoctors.length === 0 && (
                          <SelectItem value="no-doctors" disabled>
                            No doctors found in this OPD. Please register doctors first.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.doctorId && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.doctorId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="appointmentDate">Appointment Date *</Label>
                    <Input
                      id="appointmentDate"
                      type="datetime-local"
                      {...form.register("appointmentDate", { valueAsDate: true })}
                    />
                    {form.formState.errors.appointmentDate && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.appointmentDate.message}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="symptoms">Symptoms/Chief Complaint *</Label>
                    <Textarea
                      id="symptoms"
                      {...form.register("symptoms")}
                      placeholder="Describe current symptoms or reason for visit"
                      rows={3}
                    />
                    {form.formState.errors.symptoms && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.symptoms.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <PhoneCall className="h-5 w-5 text-primary" />
                  <span>Emergency Contact</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="emergencyContactName">Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      {...form.register("emergencyContactName")}
                      placeholder="Emergency contact name"
                    />
                    {form.formState.errors.emergencyContactName && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.emergencyContactName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactNumber">Contact Number *</Label>
                    <Input
                      id="emergencyContactNumber"
                      {...form.register("emergencyContactNumber")}
                      placeholder="+91 9999999999"
                    />
                    {form.formState.errors.emergencyContactNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.emergencyContactNumber.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="relationWithPatient">Relationship *</Label>
                    <Select onValueChange={(value) => form.setValue("relationWithPatient", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.relationWithPatient && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.relationWithPatient.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Photo Upload */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-primary" />
                  <span>Patient Photo (Optional)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    {photoPreview ? (
                      <div className="space-y-3">
                        <img 
                          src={photoPreview} 
                          alt="Patient photo preview" 
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <div className="flex justify-center space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change Photo
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setPhotoPreview(null);
                              form.setValue("photo", "");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-3">
                        <Camera className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Upload patient photo</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Upload Photo
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleCameraCapture}
                          >
                            Take Photo
                          </Button>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <div className="text-center">
                      <p>Photo helps in:</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• Patient identification</li>
                        <li>• Medical record verification</li>
                        <li>• Security and safety</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="secondary">
                  Save as Draft
                </Button>
                <Button type="submit" disabled={createPatientMutation.isPending} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>{createPatientMutation.isPending ? "Registering..." : "Register Patient"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Patient Cards Display */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Registered Patients</h2>
            <p className="text-gray-600">Manage patient records with complete information</p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {patients?.length || 0} patients
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : patients?.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients registered yet</h3>
              <p className="text-gray-600 mb-6">Start by registering your first patient using the form above.</p>
              <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Register First Patient</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients?.map((patient) => {
              const doctor = allDoctors?.find(d => d._id === patient.doctorId);
              const opd = allOpds?.find(o => o._id === patient.opdId);
              const hospital = hospitals?.find(h => h._id === patient.hospitalId);
              
              return (
                <Card key={patient._id} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {patient.photo ? (
                          <img
                            src={patient.photo}
                            alt={patient.fullName}
                            className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircle className="h-8 w-8 text-primary/60" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{patient.fullName}</h3>
                          <Badge variant="outline" className="text-xs">
                            ID: {patient.patientId}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setViewingPatient(patient)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Patient Details</DialogTitle>
                            </DialogHeader>
                            {viewingPatient && (
                              <PatientDetailsView
                                patient={viewingPatient}
                                doctor={allDoctors?.find(d => d._id === viewingPatient.doctorId)}
                                opd={allOpds?.find(o => o._id === viewingPatient.opdId)}
                                hospital={hospitals?.find(h => h._id === viewingPatient.hospitalId)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingPatient(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this patient record?")) {
                              deletePatientMutation.mutate(patient._id!);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{patient.age} years • {patient.gender}</span>
                        {patient.bloodGroup && (
                          <>
                            <span>•</span>
                            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                              {patient.bloodGroup}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{patient.mobileNumber}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{patient.city}, {patient.state}</span>
                      </div>
                      
                      {doctor && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Dr. {doctor.name}</span>
                        </div>
                      )}
                      
                      {opd && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Activity className="h-4 w-4" />
                          <span>{opd.name} - Room {opd.roomNumber}</span>
                        </div>
                      )}
                      
                      {hospital && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Heart className="h-4 w-4" />
                          <span>{hospital.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Registered: {new Date(patient.registrationDate).toLocaleDateString()}</span>
                      </div>
                      
                      {patient.visitType && (
                        <Badge variant={patient.visitType === 'New' ? 'default' : 'secondary'} className="text-xs">
                          {patient.visitType} Patient
                        </Badge>
                      )}
                      
                      {patient.symptoms && (
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                          <p className="text-xs font-medium text-amber-800 mb-1">Chief Complaint:</p>
                          <p className="text-xs text-amber-700">{patient.symptoms.substring(0, 100)}{patient.symptoms.length > 100 ? '...' : ''}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// Patient Details View Component
function PatientDetailsView({ 
  patient, 
  doctor, 
  opd, 
  hospital 
}: { 
  patient: Patient; 
  doctor?: Doctor; 
  opd?: Opd; 
  hospital?: Hospital; 
}) {
  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="flex items-start space-x-4 pb-6 border-b">
        {patient.photo ? (
          <img
            src={patient.photo}
            alt={patient.fullName}
            className="h-24 w-24 rounded-full object-cover border-4 border-primary/20"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="h-16 w-16 text-primary/60" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{patient.fullName}</h2>
            <Badge variant="outline">ID: {patient.patientId}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>Age: {patient.age} years</div>
            <div>Gender: {patient.gender}</div>
            <div>Blood Group: {patient.bloodGroup || 'Not specified'}</div>
            <div>Visit Type: {patient.visitType}</div>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-medium">Date of Birth</Label>
              <p className="text-sm text-gray-600">{new Date(patient.dob).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="font-medium">Mobile Number</Label>
              <p className="text-sm text-gray-600">{patient.mobileNumber}</p>
            </div>
            {patient.email && (
              <div>
                <Label className="font-medium">Email</Label>
                <p className="text-sm text-gray-600">{patient.email}</p>
              </div>
            )}
            <div>
              <Label className="font-medium">Address</Label>
              <p className="text-sm text-gray-600">
                {patient.address}, {patient.city}, {patient.state} - {patient.pinCode}
              </p>
            </div>
            {patient.weight && (
              <div>
                <Label className="font-medium">Weight</Label>
                <p className="text-sm text-gray-600">{patient.weight} kg</p>
              </div>
            )}
            {patient.height && (
              <div>
                <Label className="font-medium">Height</Label>
                <p className="text-sm text-gray-600">{patient.height} cm</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Medical History</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient.existingConditions.length > 0 && (
              <div>
                <Label className="font-medium">Existing Conditions</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.existingConditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {patient.allergies.length > 0 && (
              <div>
                <Label className="font-medium">Allergies</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {patient.medications.length > 0 && (
              <div>
                <Label className="font-medium">Current Medications</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.medications.map((medication, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {medication}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {patient.pastDiseases.length > 0 && (
              <div>
                <Label className="font-medium">Past Diseases</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {patient.pastDiseases.map((disease, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {disease}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {patient.familyHistory && (
              <div>
                <Label className="font-medium">Family History</Label>
                <p className="text-sm text-gray-600">{patient.familyHistory}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hospital & Doctor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Healthcare Team</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hospital && (
              <div>
                <Label className="font-medium">Hospital</Label>
                <p className="text-sm text-gray-600">{hospital.name}</p>
                <p className="text-xs text-gray-500">{hospital.city}, {hospital.state}</p>
              </div>
            )}
            {opd && (
              <div>
                <Label className="font-medium">OPD Department</Label>
                <p className="text-sm text-gray-600">{opd.name} - Room {opd.roomNumber}</p>
                <p className="text-xs text-gray-500">Timings: {opd.timings}</p>
              </div>
            )}
            {doctor && (
              <div>
                <Label className="font-medium">Assigned Doctor</Label>
                <p className="text-sm text-gray-600">Dr. {doctor.name}</p>
                <p className="text-xs text-gray-500">{doctor.specialization} • {doctor.experienceYears} years exp.</p>
                <p className="text-xs text-gray-500">{doctor.qualification}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PhoneCall className="h-5 w-5" />
              <span>Emergency Contact</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="font-medium">Contact Name</Label>
              <p className="text-sm text-gray-600">{patient.emergencyContactName}</p>
            </div>
            <div>
              <Label className="font-medium">Contact Number</Label>
              <p className="text-sm text-gray-600">{patient.emergencyContactNumber}</p>
            </div>
            <div>
              <Label className="font-medium">Relationship</Label>
              <p className="text-sm text-gray-600">{patient.relationWithPatient}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Current Appointment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">Appointment Date</Label>
              <p className="text-sm text-gray-600">
                {new Date(patient.appointmentDate).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="font-medium">Registration Date</Label>
              <p className="text-sm text-gray-600">
                {new Date(patient.registrationDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          {patient.symptoms && (
            <div>
              <Label className="font-medium">Chief Complaint</Label>
              <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">{patient.symptoms}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
