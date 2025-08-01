import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updatePatientSchema, type UpdatePatient, type Patient, type Doctor, type Hospital } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, User, ArrowLeft, Upload, Camera, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PatientEdit() {
  const [match, params] = useRoute("/patients/:id/edit");
  const { toast } = useToast();
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<UpdatePatient>({
    resolver: zodResolver(updatePatientSchema),
  });

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", params?.id],
    enabled: !!params?.id,
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: UpdatePatient) => {
      const response = await apiRequest("PUT", `/api/patients/${params?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id] });
      toast({
        title: "Success",
        description: "Patient updated successfully",
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

  useEffect(() => {
    if (patient) {
      form.reset({
        fullName: patient.fullName,
        gender: patient.gender,
        dob: patient.dob,
        bloodGroup: patient.bloodGroup,
        mobileNumber: patient.mobileNumber,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        state: patient.state,
        pinCode: patient.pinCode,
        weight: patient.weight,
        height: patient.height,
        existingConditions: patient.existingConditions,
        allergies: patient.allergies,
        medications: patient.medications,
        pastDiseases: patient.pastDiseases,
        familyHistory: patient.familyHistory,
        visitType: patient.visitType,
        doctorId: patient.doctorId,
        appointmentDate: patient.appointmentDate,
        symptoms: patient.symptoms,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactNumber: patient.emergencyContactNumber,
        relationWithPatient: patient.relationWithPatient,
        photo: patient.photo,
      });
      if (patient.photo) {
        setPreviewImage(patient.photo);
      }
    }
  }, [patient, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreviewImage(base64);
      form.setValue("photo", base64);
    };
    reader.readAsDataURL(file);
    setShowImageDialog(false);
  };

  const handleCameraCapture = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        video.addEventListener('canplay', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context?.drawImage(video, 0, 0);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          setPreviewImage(base64);
          form.setValue("photo", base64);
          
          stream.getTracks().forEach(track => track.stop());
          setShowImageDialog(false);
        });
      })
      .catch(error => {
        toast({
          title: "Camera Error",
          description: "Unable to access camera",
          variant: "destructive",
        });
      });
  };

  const onSubmit = (data: UpdatePatient) => {
    const submitData = {
      ...data,
      dob: new Date(data.dob!),
      appointmentDate: new Date(data.appointmentDate!),
    };
    updatePatientMutation.mutate(submitData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="h-6 w-6" />
            Edit Patient: {patient.fullName}
          </h1>
          <p className="text-gray-600 mt-1">Update patient information and medical details</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => form.setValue("gender", value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    {...form.register("dob")}
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
                <div>
                  <Label htmlFor="mobileNumber">Mobile Number *</Label>
                  <Input
                    id="mobileNumber"
                    {...form.register("mobileNumber")}
                    placeholder="Enter mobile number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            </div>

            {/* Patient Photo */}
            <div>
              <h3 className="text-lg font-medium mb-4">Patient Photo</h3>
              <div className="flex items-center space-x-4">
                {previewImage && (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Patient"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                      onClick={() => {
                        setPreviewImage(null);
                        form.setValue("photo", undefined);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      {previewImage ? "Change Photo" : "Add Photo"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Patient Photo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="photoFile">Upload from Device</Label>
                        <Input
                          id="photoFile"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum size: 2MB</p>
                      </div>
                      <div className="flex justify-center">
                        <Button type="button" onClick={handleCameraCapture} variant="outline">
                          <Camera className="h-4 w-4 mr-2" />
                          Capture from Camera
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    {...form.register("address")}
                    placeholder="Enter complete address"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <Label htmlFor="pinCode">Pin Code *</Label>
                  <Input
                    id="pinCode"
                    {...form.register("pinCode")}
                    placeholder="Enter pin code"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-medium mb-4">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    {...form.register("weight", { valueAsNumber: true })}
                    placeholder="Enter weight"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    {...form.register("height", { valueAsNumber: true })}
                    placeholder="Enter height"
                  />
                </div>
                <div>
                  <Label htmlFor="existingConditions">Existing Conditions (comma-separated)</Label>
                  <Textarea
                    id="existingConditions"
                    {...form.register("existingConditions")}
                    placeholder="diabetes, hypertension"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <Textarea
                    id="allergies"
                    {...form.register("allergies")}
                    placeholder="penicillin, nuts"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
                  <Textarea
                    id="currentMedications"
                    {...form.register("medications")}
                    placeholder="aspirin, metformin"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="pastDiseases">Past Diseases (comma-separated)</Label>
                  <Textarea
                    id="pastDiseases"
                    {...form.register("pastDiseases")}
                    placeholder="malaria, typhoid"
                    rows={2}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="familyHistory">Family History</Label>
                  <Textarea
                    id="familyHistory"
                    {...form.register("familyHistory")}
                    placeholder="Family medical history, genetic conditions, etc."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="emergencyContactName">Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    {...form.register("emergencyContactName")}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContactNumber">Contact Number *</Label>
                  <Input
                    id="emergencyContactNumber"
                    {...form.register("emergencyContactNumber")}
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <Label htmlFor="relationWithPatient">Relation with Patient *</Label>
                  <Select onValueChange={(value) => form.setValue("relationWithPatient", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Relation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Son">Son</SelectItem>
                      <SelectItem value="Daughter">Daughter</SelectItem>
                      <SelectItem value="Brother">Brother</SelectItem>
                      <SelectItem value="Sister">Sister</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePatientMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updatePatientMutation.isPending ? "Updating..." : "Update Patient"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}