import { 
  Gauge, 
  Cog, 
  ClipboardList, 
  TrendingUp, 
  ClipboardCheck, 
  Package, 
  Calendar, 
  BarChart3,
  Activity,
  GanttChart
} from "lucide-react";
import { Link, useLocation } from "wouter";

export function SideNavigation() {
  const [location] = useLocation();

  const navigationItems = [
    { path: "/dashboard", icon: Gauge, label: "Dashboard" },
    { path: "/machine-operations", icon: Cog, label: "Machine Operations" },
    { path: "/work-orders", icon: ClipboardList, label: "Work Orders", badge: "12" },
    { path: "/quality-control", icon: ClipboardCheck, label: "Quality Control" },
    { path: "/oee-analytics", icon: TrendingUp, label: "OEE Analytics" },
    { path: "/inventory", icon: Package, label: "Inventory" },
    { path: "/production-planning", icon: Calendar, label: "Production Planning" },
    { path: "/capacity-planning", icon: Activity, label: "Capacity Planning" },
    { path: "/gantt", icon: GanttChart, label: "Gantt Scheduler" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === path;
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center justify-between space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isActive(item.path)
                  ? "bg-[#1976d2] bg-opacity-10 text-[#1976d2]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-5 w-5 ${isActive(item.path) ? "text-[#1976d2]" : ""}`} />
                  <span className={`font-medium ${isActive(item.path) ? "text-[#1976d2]" : ""}`}>
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span className="bg-[#1976d2] text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
