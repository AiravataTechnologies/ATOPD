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
import { insertHospitalSchema, type InsertHospital, type Hospital, OPD_DEPARTMENTS } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Building2 } from "lucide-react";

export default function HospitalRegistration() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [customDepartment, setCustomDepartment] = useState("");

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
    },
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
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OPDs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hospitals?.map((hospital) => (
                    <tr key={hospital._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {hospital.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hospital.hospitalType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hospital.contactNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {hospital.opdDepartments.map((dept, index) => (
                            <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(hospital.createdAt).toLocaleDateString()}
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
