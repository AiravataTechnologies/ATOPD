import { Button } from "@/components/ui/button";
import { Bell, Hospital, User } from "lucide-react";

interface NavigationProps {
  hospitalName?: string;
}

export default function Navigation({ hospitalName = "Apollo Hospital" }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Hospital className="text-primary-foreground text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AT OPD</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span>{hospitalName}</span>
            </div>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="text-primary-foreground text-sm" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
