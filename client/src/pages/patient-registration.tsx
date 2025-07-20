import { useState, useEffect } from "react";
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
import { insertPatientSchema, type InsertPatient, type Patient, type Doctor } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, User, Phone, Heart, Calendar, PhoneCall, Camera, Eye, Edit } from "lucide-react";

type PatientFormData = Omit<InsertPatient, "existingConditions" | "allergies" | "medications" | "pastDiseases"> & {
  existingConditions: string;
  allergies: string;
  medications: string;
  pastDiseases: string;
};

export default function PatientRegistration() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(
      insertPatientSchema
        .omit({ existingConditions: true, allergies: true, medications: true, pastDiseases: true })
        .extend({
          existingConditions: insertPatientSchema.shape.existingConditions.optional().or(insertPatientSchema.shape.existingConditions.transform(v => typeof v === 'string' ? v : '')),
          allergies: insertPatientSchema.shape.allergies.optional().or(insertPatientSchema.shape.allergies.transform(v => typeof v === 'string' ? v : '')),
          medications: insertPatientSchema.shape.medications.optional().or(insertPatientSchema.shape.medications.transform(v => typeof v === 'string' ? v : '')),
          pastDiseases: insertPatientSchema.shape.pastDiseases.optional().or(insertPatientSchema.shape.pastDiseases.transform(v => typeof v === 'string' ? v : '')),
        }).partial({
          existingConditions: true,
          allergies: true,
          medications: true,
          pastDiseases: true,
        })
    ),
    defaultValues: {
      fullName: "",
      gender: "",
      dob: new Date(),
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
      visitType: "",
      doctorId: 0,
      appointmentDate: new Date(),
      symptoms: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      relationWithPatient: "",
      photo: "",
    },
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients", "recent"],
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

  const onSubmit = (data: PatientFormData) => {
    // Convert comma-separated strings to arrays
    const patientData: InsertPatient = {
      ...data,
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

    createPatientMutation.mutate(patientData);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    <Select onValueChange={(value) => form.setValue("gender", value)}>
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
                    <Select onValueChange={(value) => form.setValue("visitType", value)}>
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
                    <Label htmlFor="doctorId">Doctor *</Label>
                    <Select onValueChange={(value) => form.setValue("doctorId", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors?.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            {doctor.name} - {doctor.specialization}
                          </SelectItem>
                        ))}
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <div className="flex flex-col items-center space-y-3">
                    <Camera className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      {...form.register("photo")}
                    />
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

      {/* Recent Patients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Registrations</CardTitle>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading recent patients...</p>
          ) : patients?.length === 0 ? (
            <p className="text-gray-500">No patients registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age/Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients?.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.patientId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.age}/{patient.gender.charAt(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.mobileNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(patient.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          Registered
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
