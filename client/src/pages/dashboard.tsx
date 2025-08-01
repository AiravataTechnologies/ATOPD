import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hospital, Building2, UserRound, Users, Activity, Clock, Eye, Settings, ArrowRight, Plus, MapPin, Phone, Stethoscope } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

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

interface Hospital {
  _id: string;
  hospitalId: string;
  name: string;
  city: string;
  state: string;
  specializations: string[];
  totalBeds?: number;
  emergencyServices: boolean;
}

interface Opd {
  _id: string;
  hospitalId: string;
  name: string;
  headDoctorName?: string;
}

interface Doctor {
  _id: string;
  opdId: string;
  fullName: string;
  specialization: string;
}

export default function Dashboard() {
  // Fetch dashboard statistics
  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['/api/hospitals'],
  });

  const { data: opds = [] } = useQuery<Opd[]>({
    queryKey: ['/api/opds'],
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
  });

  const { data: patients = [] } = useQuery<any[]>({
    queryKey: ['/api/patients'],
  });

  const { data: recentPatients = [] } = useQuery<RecentPatient[]>({
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OPD Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete overview and management of your healthcare system</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reports
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
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
                <p className="text-xs text-gray-500 mt-1">Active in system</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/hospitals" className="block">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Hospital className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-medium">Register Hospital</h3>
                <p className="text-xs text-gray-500">Add new healthcare facility</p>
              </div>
            </Link>
            <Link href="/opds" className="block">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Building2 className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium">Manage OPDs</h3>
                <p className="text-xs text-gray-500">Setup departments</p>
              </div>
            </Link>
            <Link href="/doctors" className="block">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <UserRound className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium">Add Doctors</h3>
                <p className="text-xs text-gray-500">Register medical staff</p>
              </div>
            </Link>
            <Link href="/patients" className="block">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Users className="h-8 w-8 text-orange-600 mb-2" />
                <h3 className="font-medium">Register Patients</h3>
                <p className="text-xs text-gray-500">Add patient records</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hospitals Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hospital className="h-5 w-5" />
              Registered Hospitals
            </CardTitle>
            <Link href="/hospitals">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hospitals.length > 0 ? (
                hospitals.slice(0, 3).map((hospital) => (
                  <div key={hospital._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{hospital.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{hospital.city}, {hospital.state}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {hospital.specializations.slice(0, 2).map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs px-2 py-0">
                            {spec}
                          </Badge>
                        ))}
                        {hospital.specializations.length > 2 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            +{hospital.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">ID: {hospital.hospitalId}</p>
                      {hospital.totalBeds && (
                        <p className="text-xs text-gray-500">{hospital.totalBeds} beds</p>
                      )}
                      {hospital.emergencyServices && (
                        <Badge variant="destructive" className="text-xs mt-1">Emergency</Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Hospital className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hospitals registered</p>
                  <Link href="/hospitals">
                    <Button size="sm" className="mt-2">Register First Hospital</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Patients
            </CardTitle>
            <Link href="/patients">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient) => (
                  <div key={patient._id} className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{patient.fullName}</p>
                      <p className="text-xs text-gray-500">
                        ID: {patient.patientId} • {new Date(patient.registrationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No patients registered yet</p>
                  <p className="text-xs">Start by registering hospitals and patients</p>
                  <Link href="/patients">
                    <Button size="sm" className="mt-2">Register First Patient</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            System Hierarchy Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{hospitals.length}</div>
              <p className="text-sm text-gray-500">Hospitals</p>
              <div className="mt-2">
                <div className="text-xs text-green-600">✓ Active</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{opds.length}</div>
              <p className="text-sm text-gray-500">OPD Departments</p>
              <div className="mt-2">
                <div className="text-xs text-gray-500">
                  Across {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{doctors.length}</div>
              <p className="text-sm text-gray-500">Doctors</p>
              <div className="mt-2">
                <div className="text-xs text-gray-500">
                  Serving {patients.length} patient{patients.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
