import { AppHeader } from "@/components/layout/AppHeader";
import { SideNavigation } from "@/components/layout/SideNavigation";
import { KPICards } from "@/components/dashboard/KPICards";
import { MachineStatusGrid } from "@/components/dashboard/MachineStatusGrid";
import { ActiveWorkOrders } from "@/components/dashboard/ActiveWorkOrders";
import { OEEChart } from "@/components/dashboard/OEEChart";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { QualityMetrics } from "@/components/dashboard/QualityMetrics";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function Dashboard() {
  const { data: realtimeData, isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-['Roboto']">
      <AppHeader isConnected={isConnected} />
      
      <div className="flex h-screen">
        <SideNavigation />
        
        <main className="flex-1 overflow-y-auto bg-[#f5f5f5]">
          <div className="p-6">
            {/* Dashboard Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-[#212121] mb-2">Production Dashboard</h2>
              <p className="text-gray-600">Real-time monitoring and control - Plant A, Shift 2</p>
            </div>
            
            {/* KPI Cards */}
            <KPICards data={realtimeData?.kpis} />
            
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <MachineStatusGrid machines={realtimeData?.machines} />
              </div>
              <ActiveWorkOrders workOrders={realtimeData?.activeWorkOrders} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <OEEChart data={realtimeData?.oeeData} />
              <ProductionChart data={realtimeData?.productionData} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <QualityMetrics />
              <InventoryStatus />
              <RecentAlerts alerts={realtimeData?.alerts} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
