import { 
  Gauge, 
  Cog, 
  ClipboardList, 
  TrendingUp, 
  ClipboardCheck, 
  Package, 
  Calendar, 
  BarChart3 
} from "lucide-react";

export function SideNavigation() {
  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 bg-[#1976d2] bg-opacity-10 rounded-lg">
            <Gauge className="h-5 w-5 text-[#1976d2]" />
            <span className="font-medium text-[#1976d2]">Dashboard</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <Cog className="h-5 w-5" />
              <span>Machine Status</span>
            </div>
            <div className="flex items-center justify-between space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <ClipboardList className="h-5 w-5" />
                <span>Work Orders</span>
              </div>
              <span className="bg-[#1976d2] text-white text-xs px-2 py-1 rounded-full">12</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <TrendingUp className="h-5 w-5" />
              <span>OEE Analytics</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <ClipboardCheck className="h-5 w-5" />
              <span>Quality Control</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <Package className="h-5 w-5" />
              <span>Inventory</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <Calendar className="h-5 w-5" />
              <span>Production Planning</span>
            </div>
            <div className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <BarChart3 className="h-5 w-5" />
              <span>Reports</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
