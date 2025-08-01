import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import HospitalRegistration from "@/pages/hospital-registration";
import OPDManagement from "@/pages/opd-management";
import DoctorRegistration from "@/pages/doctor-registration";
import PatientRegistration from "@/pages/patient-registration";
import PatientEdit from "@/pages/patient-edit";
import PrescriptionManagement from "@/pages/prescription-management";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/hospitals" component={HospitalRegistration} />
      <Route path="/opds" component={OPDManagement} />
      <Route path="/doctors" component={DoctorRegistration} />
      <Route path="/patients" component={PatientRegistration} />
      <Route path="/patients/:id/edit" component={PatientEdit} />
      <Route path="/prescriptions" component={PrescriptionManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="flex h-screen pt-16">
            <Sidebar />
            <div className="flex-1 ml-64 overflow-auto">
              <div className="p-8">
                <nav className="flex mb-6" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm text-gray-500">
                    <li><a href="/" className="hover:text-gray-700">Dashboard</a></li>
                    <li><span className="mx-2">/</span></li>
                    <li className="text-gray-900 font-medium">Current Page</li>
                  </ol>
                </nav>
                <Router />
              </div>
            </div>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
