import { Link, useLocation } from "wouter";
import { Home, Hospital, Building2, UserRound, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavigationItem, QuickStat } from "@/lib/types";

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    icon: "home",
    label: "Dashboard",
  },
  {
    href: "/hospitals",
    icon: "hospital",
    label: "Hospital Registration",
  },
  {
    href: "/opds",
    icon: "building2",
    label: "OPD Management",
  },
  {
    href: "/doctors",
    icon: "userMd",
    label: "Doctor Registration",
  },
  {
    href: "/patients",
    icon: "users",
    label: "Patient Registration",
  },
  {
    href: "/prescriptions",
    icon: "fileText",
    label: "Prescription Management",
  },
];

const iconMap = {
  home: Home,
  hospital: Hospital,
  building2: Building2,
  userMd: UserRound,
  users: Users,
  fileText: FileText,
};

interface SidebarProps {
  quickStats?: QuickStat[];
}

export default function Sidebar({ 
  quickStats = [
    { label: "Today's Patients", value: 47 },
    { label: "Active Doctors", value: 12 },
    { label: "OPD Departments", value: 8 },
  ]
}: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full pt-0">
      <div className="p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = location === item.href;
            
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors",
                isActive && "bg-primary/10 text-primary font-medium"
              )}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="border-t border-gray-200 mt-6 pt-6 px-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Stats
        </h3>
        <div className="space-y-3">
          {quickStats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
