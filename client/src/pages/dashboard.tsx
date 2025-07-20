import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hospital, Building2, UserRound, Users, Activity, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  hospitals: number;
  opds: number;
  doctors: number;
  patients: number;
}

interface RecentPatient {
  _id: string;
  patientId: string;
  fullName: string;
  registrationDate: string;
}

export default function Dashboard() {
  // Fetch dashboard statistics
  const { data: hospitals = [] } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  const { data: opds = [] } = useQuery({
    queryKey: ['/api/opds'],
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['/api/doctors'],
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  });

  const { data: recentPatients = [] } = useQuery({
    queryKey: ['/api/patients/recent'],
    queryFn: () => fetch('/api/patients/recent?limit=5').then(res => res.json()),
  });

  const stats = [
    {
      title: "Total Hospitals",
      value: hospitals.length.toString(),
      icon: Hospital,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "OPD Departments",
      value: opds.length.toString(),
      icon: Building2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Doctors",
      value: doctors.length.toString(),
      icon: UserRound,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Registered Patients",
      value: patients.length.toLocaleString(),
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your OPD management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPatients.length > 0 ? (
              recentPatients.map((patient: RecentPatient) => (
                <div key={patient._id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{patient.fullName}</p>
                    <p className="text-xs text-gray-500">
                      Patient ID: {patient.patientId} • {new Date(patient.registrationDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No patients registered yet</p>
                <p className="text-xs">Start by registering a hospital and adding patients</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
