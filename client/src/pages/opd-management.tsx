import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertOpdSchema, type InsertOpd, type Opd, type Hospital } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Building2, Stethoscope } from "lucide-react";

const daysOfWeek = [
  { id: "Mon", label: "Monday" },
  { id: "Tue", label: "Tuesday" },
  { id: "Wed", label: "Wednesday" },
  { id: "Thu", label: "Thursday" },
  { id: "Fri", label: "Friday" },
  { id: "Sat", label: "Saturday" },
  { id: "Sun", label: "Sunday" },
];

export default function OPDManagement() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [availableOpdNames, setAvailableOpdNames] = useState<string[]>([]);

  const form = useForm<Omit<InsertOpd, "hospitalId" | "operationDays">>({
    resolver: zodResolver(insertOpdSchema.omit({ hospitalId: true, operationDays: true })),
    defaultValues: {
      name: "",
      roomNumber: "",
      timings: "",
      departmentHead: "",
    },
  });

  const { data: hospitals } = useQuery<Hospital[]>({
    queryKey: ["/api/hospitals"],
  });

  const { data: opds, isLoading } = useQuery<Opd[]>({
    queryKey: ["/api/hospitals", selectedHospitalId, "opds"],
    enabled: !!selectedHospitalId,
  });

  // Effect to update available OPD names when hospital is selected
  useEffect(() => {
    if (selectedHospital && selectedHospital.specializations) {
      setAvailableOpdNames(selectedHospital.specializations);
    } else {
      setAvailableOpdNames([]);
    }
  }, [selectedHospital]);

  const createOpdMutation = useMutation({
    mutationFn: async (data: InsertOpd) => {
      const response = await apiRequest("POST", `/api/hospitals/${data.hospitalId}/opds`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals", selectedHospitalId, "opds"] });
      toast({
        title: "Success",
        description: "OPD department registered successfully",
      });
      form.reset();
      setSelectedDays([]);
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

  const onSubmit = (data: Omit<InsertOpd, "hospitalId" | "operationDays">) => {
    if (!selectedHospitalId) {
      toast({
        title: "Error",
        description: "Please select a hospital",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one operation day",
        variant: "destructive",
      });
      return;
    }

    const opdData: InsertOpd = {
      ...data,
      hospitalId: selectedHospitalId,
      operationDays: selectedDays,
    };

    createOpdMutation.mutate(opdData);
  };

  const handleDayChange = (dayId: string, checked: boolean) => {
    if (checked) {
      setSelectedDays([...selectedDays, dayId]);
    } else {
      setSelectedDays(selectedDays.filter(day => day !== dayId));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OPD Management</h1>
          <p className="text-gray-600 mt-1">Manage OPD departments under hospitals</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New OPD</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Hospital</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => {
              setSelectedHospitalId(value);
              const hospital = hospitals?.find(h => h._id === value);
              setSelectedHospital(hospital || null);
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
            
            {selectedHospital && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Available OPD Specializations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {availableOpdNames.length > 0 ? (
                    availableOpdNames.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-blue-700">No specializations found for this hospital</p>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  These are the specializations from hospital registration. Select one below to create an OPD department.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>OPD Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">OPD Name *</Label>
                      {availableOpdNames.length > 0 ? (
                        <Select onValueChange={(value) => form.setValue("name", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select from hospital specializations" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableOpdNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="name"
                          {...form.register("name")}
                          placeholder="Please select a hospital first"
                          disabled={!selectedHospitalId}
                        />
                      )}
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                      {availableOpdNames.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          OPD names are automatically loaded from {selectedHospital?.name}'s specializations
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="roomNumber">Room Number *</Label>
                      <Input
                        id="roomNumber"
                        {...form.register("roomNumber")}
                        placeholder="e.g., Room 101"
                      />
                      {form.formState.errors.roomNumber && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.roomNumber.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="timings">Timings *</Label>
                      <Input
                        id="timings"
                        {...form.register("timings")}
                        placeholder="e.g., 9:00 AM - 5:00 PM"
                      />
                      {form.formState.errors.timings && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.timings.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="departmentHead">Department Head</Label>
                      <Input
                        id="departmentHead"
                        {...form.register("departmentHead")}
                        placeholder="Dr. Name (Optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Operation Days *</Label>
                    <div className="grid grid-cols-4 gap-4 mt-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.id}
                            checked={selectedDays.includes(day.id)}
                            onCheckedChange={(checked) => handleDayChange(day.id, !!checked)}
                          />
                          <Label htmlFor={day.id} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createOpdMutation.isPending}>
                      {createOpdMutation.isPending ? "Creating..." : "Create OPD"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedHospitalId && (
        <Card>
          <CardHeader>
            <CardTitle>OPD Departments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading OPD departments...</p>
            ) : opds?.length === 0 ? (
              <p className="text-gray-500">No OPD departments found for selected hospital.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operation Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Head
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {opds?.map((opd) => (
                      <tr key={opd.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {opd.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {opd.roomNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {opd.timings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {opd.operationDays.join(", ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {opd.departmentHead || "Not assigned"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
