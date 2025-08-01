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
import { useToast } from "@/hooks/use-toast";
import { insertPrescriptionSchema, type InsertPrescription, type Prescription, type Patient, type Doctor, type Hospital } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Stethoscope, FileText, Calendar, User, Pill, TestTube, Save, Eye, Edit } from "lucide-react";
import { Canvas, type CanvasRef } from "@/components/ui/canvas";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { z } from "zod";

type PrescriptionFormData = Omit<InsertPrescription, 'visitDate' | 'followUpDate' | 'medications' | 'labTests' | 'symptoms' | 'diagnosis'> & {
  visitDate: string;
  followUpDate?: string;
  medications: string; // Comma-separated
  labTests: string; // Comma-separated
  symptoms: string; // Comma-separated
  diagnosis: string; // Comma-separated
};

export default function PrescriptionManagement() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const canvasRef = useRef<CanvasRef>(null);

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(
      insertPrescriptionSchema
        .omit({ 
          visitDate: true, 
          followUpDate: true,
          medications: true,
          labTests: true,
          symptoms: true,
          diagnosis: true,
        })
        .extend({
          visitDate: z.string(),
          followUpDate: z.string().optional(),
          medications: z.string().optional(),
          labTests: z.string().optional(),
          symptoms: z.string().optional(),
          diagnosis: z.string().optional(),
        })
    ),
    defaultValues: {
      patientId: "",
      doctorId: "",
      hospitalId: "",
      opdId: "",
      visitDate: new Date().toISOString().slice(0, 16),
      visitType: "New Consultation",
      chiefComplaint: "",
      symptoms: "",
      diagnosis: "",
      clinicalNotes: "",
      medications: "",
      prescriptionText: "",
      labTests: "",
      followUpInstructions: "",
      status: "Active",
    },
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: InsertPrescription) => {
      const response = await apiRequest("POST", "/api/prescriptions/create", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Success",
        description: "Prescription created successfully",
      });
      form.reset();
      setSelectedPatient(null);
      setSelectedDoctor(null);
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

  const updatePrescriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPrescription> }) => {
      const response = await apiRequest("PUT", `/api/prescriptions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Success",
        description: "Prescription updated successfully",
      });
      form.reset();
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setEditingPrescription(null);
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

  const onSubmit = (data: PrescriptionFormData) => {
    if (!selectedPatient || !selectedDoctor) {
      toast({
        title: "Error",
        description: "Please select both patient and doctor",
        variant: "destructive",
      });
      return;
    }

    // Get canvas data if available
    const canvasData = canvasRef.current?.getCanvasData() || "";

    const prescriptionData: InsertPrescription = {
      ...data,
      patientId: selectedPatient._id!,
      doctorId: selectedDoctor._id!,
      hospitalId: selectedPatient.hospitalId,
      opdId: selectedDoctor.opdId,
      visitDate: new Date(data.visitDate),
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
      symptoms: data.symptoms ? data.symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      diagnosis: data.diagnosis ? data.diagnosis.split(',').map(d => d.trim()).filter(d => d.length > 0) : [],
      medications: data.medications ? data.medications.split(';').map(med => {
        const parts = med.trim().split('|');
        return {
          medicineName: parts[0] || '',
          dosage: parts[1] || '',
          frequency: parts[2] || '',
          duration: parts[3] || '',
          instructions: parts[4] || '',
          quantity: parts[5] ? parseInt(parts[5]) : undefined,
        };
      }).filter(med => med.medicineName.length > 0) : [],
      labTests: data.labTests ? data.labTests.split(',').map(test => {
        const parts = test.trim().split('|');
        return {
          testName: parts[0] || '',
          instructions: parts[1] || '',
          urgency: (parts[2] as "Routine" | "Urgent" | "STAT") || "Routine",
        };
      }).filter(test => test.testName.length > 0) : [],
      prescriptionCanvas: canvasData,
      vitalSigns: {
        temperature: form.watch("vitalSigns.temperature") ? parseFloat(String(form.watch("vitalSigns.temperature"))) : undefined,
        bloodPressure: form.watch("vitalSigns.bloodPressure") || undefined,
        pulse: form.watch("vitalSigns.pulse") ? parseFloat(String(form.watch("vitalSigns.pulse"))) : undefined,
        respiratoryRate: form.watch("vitalSigns.respiratoryRate") ? parseFloat(String(form.watch("vitalSigns.respiratoryRate"))) : undefined,
        oxygenSaturation: form.watch("vitalSigns.oxygenSaturation") ? parseFloat(String(form.watch("vitalSigns.oxygenSaturation"))) : undefined,
        weight: form.watch("vitalSigns.weight") ? parseFloat(String(form.watch("vitalSigns.weight"))) : undefined,
        height: form.watch("vitalSigns.height") ? parseFloat(String(form.watch("vitalSigns.height"))) : undefined,
      },
    };

    if (editingPrescription) {
      updatePrescriptionMutation.mutate({
        id: editingPrescription._id!,
        data: prescriptionData
      });
    } else {
      createPrescriptionMutation.mutate(prescriptionData);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p._id === patientId);
    return patient ? patient.fullName : 'Unknown Patient';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d._id === doctorId);
    return doctor ? doctor.name : 'Unknown Doctor';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-gray-600 mt-1">Create and manage digital prescriptions with tablet support</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Reports</span>
          </Button>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Prescription</span>
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              {editingPrescription ? "Edit Prescription" : "New Prescription"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Patient & Doctor Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Select Patient *</Label>
                  <Select 
                    onValueChange={(value) => {
                      const patient = patients.find(p => p._id === value);
                      setSelectedPatient(patient || null);
                      form.setValue("patientId", value);
                    }}
                    value={selectedPatient?._id || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient._id} value={patient._id!}>
                          {patient.fullName} (ID: {patient.patientId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Doctor *</Label>
                  <Select 
                    onValueChange={(value) => {
                      const doctor = doctors.find(d => d._id === value);
                      setSelectedDoctor(doctor || null);
                      form.setValue("doctorId", value);
                    }}
                    value={selectedDoctor?._id || ""}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id!}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Visit Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Visit Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="visitDate">Visit Date & Time *</Label>
                    <Input
                      id="visitDate"
                      type="datetime-local"
                      {...form.register("visitDate")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="visitType">Visit Type</Label>
                    <Select onValueChange={(value) => form.setValue("visitType", value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Visit Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New Consultation">New Consultation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Check-up">Check-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="followUpDate">Follow-up Date</Label>
                    <Input
                      id="followUpDate"
                      type="datetime-local"
                      {...form.register("followUpDate")}
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Clinical Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                    <Textarea
                      id="chiefComplaint"
                      {...form.register("chiefComplaint")}
                      placeholder="Patient's main concern or reason for visit"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="symptoms">Symptoms (comma-separated)</Label>
                      <Textarea
                        id="symptoms"
                        {...form.register("symptoms")}
                        placeholder="fever, headache, cough"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="diagnosis">Diagnosis (comma-separated)</Label>
                      <Textarea
                        id="diagnosis"
                        {...form.register("diagnosis")}
                        placeholder="upper respiratory infection, viral fever"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="clinicalNotes">Clinical Notes</Label>
                    <Textarea
                      id="clinicalNotes"
                      {...form.register("clinicalNotes")}
                      placeholder="Additional clinical observations and notes"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Prescription Canvas */}
              <div>
                <h3 className="text-lg font-medium mb-4">Digital Prescription Canvas</h3>
                <Canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  className="mb-4"
                />
                <div>
                  <Label htmlFor="prescriptionText">Prescription Text (Alternative/OCR)</Label>
                  <Textarea
                    id="prescriptionText"
                    {...form.register("prescriptionText")}
                    placeholder="Type prescription details or use OCR from canvas"
                    rows={4}
                  />
                </div>
              </div>

              {/* Medications */}
              <div>
                <h3 className="text-lg font-medium mb-4">Medications</h3>
                <div>
                  <Label htmlFor="medications">
                    Medications (Format: Medicine|Dosage|Frequency|Duration|Instructions|Quantity; separated)
                  </Label>
                  <Textarea
                    id="medications"
                    {...form.register("medications")}
                    placeholder="Paracetamol|500mg|Twice daily|7 days|Take after meals|14; Amoxicillin|250mg|Three times daily|5 days|Take with water|15"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use pipe (|) to separate medicine details and semicolon (;) to separate different medicines
                  </p>
                </div>
              </div>

              {/* Lab Tests */}
              <div>
                <h3 className="text-lg font-medium mb-4">Lab Tests</h3>
                <div>
                  <Label htmlFor="labTests">
                    Lab Tests (Format: TestName|Instructions|Urgency, separated)
                  </Label>
                  <Textarea
                    id="labTests"
                    {...form.register("labTests")}
                    placeholder="Complete Blood Count|Fasting|Routine, Blood Sugar|Fasting required|Urgent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Follow-up Instructions */}
              <div>
                <Label htmlFor="followUpInstructions">Follow-up Instructions</Label>
                <Textarea
                  id="followUpInstructions"
                  {...form.register("followUpInstructions")}
                  placeholder="Instructions for next visit, care instructions, etc."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingPrescription(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPrescription 
                    ? (updatePrescriptionMutation.isPending ? "Updating..." : "Update Prescription")
                    : (createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription")
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading prescriptions...</div>
          ) : prescriptions.length > 0 ? (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{getPatientName(prescription.patientId)}</h4>
                        <Badge variant="outline">ID: {prescription.prescriptionId}</Badge>
                        <Badge variant={prescription.status === "Active" ? "default" : "secondary"}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Doctor: {getDoctorName(prescription.doctorId)} • 
                        Visit: {new Date(prescription.visitDate).toLocaleDateString()} •
                        Type: {prescription.visitType}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Chief Complaint: {prescription.chiefComplaint}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setViewingPrescription(prescription)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle>Prescription Details - {prescription.prescriptionId}</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[70vh] overflow-y-auto">
                            {viewingPrescription && (
                              <div className="space-y-6 pr-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Patient Information</h4>
                                    <p className="text-sm">{getPatientName(viewingPrescription.patientId)}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Doctor Information</h4>
                                    <p className="text-sm">{getDoctorName(viewingPrescription.doctorId)}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Visit Details</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>Visit Date: {new Date(viewingPrescription.visitDate).toLocaleDateString()}</div>
                                    <div>Visit Type: {viewingPrescription.visitType}</div>
                                    <div>Status: {viewingPrescription.status}</div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Chief Complaint</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{viewingPrescription.chiefComplaint}</p>
                                </div>

                                {viewingPrescription.symptoms && viewingPrescription.symptoms.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Symptoms</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {viewingPrescription.symptoms.map((symptom, index) => (
                                        <Badge key={index} variant="secondary">{symptom}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {viewingPrescription.diagnosis && viewingPrescription.diagnosis.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Diagnosis</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {viewingPrescription.diagnosis.map((diag, index) => (
                                        <Badge key={index} variant="default">{diag}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {viewingPrescription.clinicalNotes && (
                                  <div>
                                    <h4 className="font-medium mb-2">Clinical Notes</h4>
                                    <p className="text-sm bg-blue-50 p-3 rounded">{viewingPrescription.clinicalNotes}</p>
                                  </div>
                                )}
                                
                                {viewingPrescription.medications.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Medications</h4>
                                    <div className="space-y-2">
                                      {viewingPrescription.medications.map((med, index) => (
                                        <div key={index} className="border rounded p-3">
                                          <p className="font-medium">{med.medicineName}</p>
                                          <p className="text-sm text-gray-600">
                                            {med.dosage} • {med.frequency} • {med.duration}
                                          </p>
                                          {med.instructions && (
                                            <p className="text-sm text-gray-500 mt-1">{med.instructions}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {viewingPrescription.labTests && viewingPrescription.labTests.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Lab Tests</h4>
                                    <div className="space-y-2">
                                      {viewingPrescription.labTests.map((test, index) => (
                                        <div key={index} className="border rounded p-3 bg-amber-50">
                                          <p className="font-medium">{test.testName}</p>
                                          <p className="text-sm text-gray-600">{test.instructions}</p>
                                          <Badge variant="outline" className="mt-1">{test.urgency}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {viewingPrescription.prescriptionCanvas && (
                                  <div>
                                    <h4 className="font-medium mb-2">Digital Prescription</h4>
                                    <img 
                                      src={viewingPrescription.prescriptionCanvas} 
                                      alt="Prescription Canvas"
                                      className="border rounded max-w-full h-auto"
                                    />
                                  </div>
                                )}

                                {viewingPrescription.followUpInstructions && (
                                  <div>
                                    <h4 className="font-medium mb-2">Follow-up Instructions</h4>
                                    <p className="text-sm bg-green-50 p-3 rounded">{viewingPrescription.followUpInstructions}</p>
                                  </div>
                                )}

                                {viewingPrescription.followUpDate && (
                                  <div>
                                    <h4 className="font-medium mb-2">Follow-up Date</h4>
                                    <p className="text-sm">{new Date(viewingPrescription.followUpDate).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingPrescription(prescription);
                          
                          // Pre-populate form with existing data
                          const patient = patients.find(p => p._id === prescription.patientId);
                          const doctor = doctors.find(d => d._id === prescription.doctorId);
                          
                          if (patient) setSelectedPatient(patient);
                          if (doctor) setSelectedDoctor(doctor);
                          
                          form.reset({
                            patientId: prescription.patientId,
                            doctorId: prescription.doctorId,
                            hospitalId: prescription.hospitalId,
                            opdId: prescription.opdId,
                            visitDate: new Date(prescription.visitDate).toISOString().slice(0, 16),
                            followUpDate: prescription.followUpDate ? new Date(prescription.followUpDate).toISOString().slice(0, 16) : "",
                            visitType: prescription.visitType,
                            chiefComplaint: prescription.chiefComplaint,
                            symptoms: prescription.symptoms?.join(", ") || "",
                            diagnosis: prescription.diagnosis?.join(", ") || "",
                            clinicalNotes: prescription.clinicalNotes || "",
                            medications: prescription.medications?.map(m => `${m.medicineName}|${m.dosage}|${m.frequency}|${m.duration}|${m.instructions || ''}`).join(", ") || "",
                            prescriptionText: prescription.prescriptionText || "",
                            labTests: prescription.labTests?.map(t => `${t.testName}|${t.instructions}|${t.urgency}`).join(", ") || "",
                            followUpInstructions: prescription.followUpInstructions || "",
                            status: prescription.status,
                          });
                          
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Stethoscope className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No prescriptions found</p>
              <p className="text-xs">Start by creating a new prescription</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}