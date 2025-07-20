import { useState } from "react";
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
import { insertDoctorSchema, type InsertDoctor, type Doctor, type Opd } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, UserRound } from "lucide-react";

export default function DoctorRegistration() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState("");

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

  const onSubmit = (data: Omit<InsertDoctor, "opdId" | "availableTimeSlots">) => {
    const opdId = form.watch("opdId" as any);
    
    if (!opdId) {
      toast({
        title: "Error",
        description: "Please select an OPD",
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
      opdId: parseInt(opdId),
      availableTimeSlots: timeSlots,
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

                <div>
                  <Label htmlFor="opdId">OPD Department *</Label>
                  <Input
                    id="opdId"
                    type="number"
                    {...form.register("opdId" as any, { valueAsNumber: true })}
                    placeholder="OPD ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note: In a real application, this would be a dropdown populated from OPDs API
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

      <Card>
        <CardHeader>
          <CardTitle>Registered Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading doctors...</p>
          ) : doctors?.length === 0 ? (
            <p className="text-gray-500">No doctors registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Slots
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors?.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doctor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.specialization}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.experienceYears} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.mobileNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {doctor.availableTimeSlots.slice(0, 2).map((slot) => (
                            <span
                              key={slot}
                              className="bg-gray-100 px-2 py-1 rounded text-xs"
                            >
                              {slot}
                            </span>
                          ))}
                          {doctor.availableTimeSlots.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{doctor.availableTimeSlots.length - 2} more
                            </span>
                          )}
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
