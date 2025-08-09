import { TrendingUp, Cog, Gauge, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardKPIs } from "@shared/schema";

interface KPICardsProps {
  data?: DashboardKPIs;
}

export function KPICards({ data }: KPICardsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl shadow-md border border-gray-100">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Overall OEE</p>
              <p className="text-3xl font-bold text-[#388e3c]">{data.overallOEE}%</p>
              <p className="text-sm text-[#388e3c] font-medium">↑ 2.1% from yesterday</p>
            </div>
            <div className="w-12 h-12 bg-[#388e3c] bg-opacity-10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-[#388e3c]" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Machines</p>
              <p className="text-3xl font-bold text-[#1976d2]">{data.activeMachines}/{data.totalMachines}</p>
              <p className="text-sm text-[#1976d2] font-medium">{Math.round((data.activeMachines / data.totalMachines) * 100)}% utilization</p>
            </div>
            <div className="w-12 h-12 bg-[#1976d2] bg-opacity-10 rounded-full flex items-center justify-center">
              <Cog className="h-6 w-6 text-[#1976d2]" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Production Rate</p>
              <p className="text-3xl font-bold text-[#f57c00]">{data.productionRate}</p>
              <p className="text-sm text-gray-600">units/hour</p>
            </div>
            <div className="w-12 h-12 bg-[#f57c00] bg-opacity-10 rounded-full flex items-center justify-center">
              <Gauge className="h-6 w-6 text-[#f57c00]" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Quality Rate</p>
              <p className="text-3xl font-bold text-[#388e3c]">{data.qualityRate}%</p>
              <p className="text-sm text-gray-600">First pass yield</p>
            </div>
            <div className="w-12 h-12 bg-[#388e3c] bg-opacity-10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[#388e3c]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
