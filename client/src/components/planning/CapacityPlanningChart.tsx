import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Clock, TrendingUp, AlertTriangle } from "lucide-react";

interface CapacityData {
  machineId: string;
  machineName: string;
  date: string;
  plannedHours: number;
  availableHours: number;
  utilization: number;
  workOrders: string[];
  status: "optimal" | "overloaded" | "underutilized";
}

interface CapacityPlanningChartProps {
  data: CapacityData[];
  timeRange: "week" | "month";
}

export function CapacityPlanningChart({ data, timeRange }: CapacityPlanningChartProps) {
  // Group data by machine for better visualization
  const machineGroups = data.reduce((acc, item) => {
    if (!acc[item.machineId]) {
      acc[item.machineId] = [];
    }
    acc[item.machineId].push(item);
    return acc;
  }, {} as Record<string, CapacityData[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "optimal":
        return "bg-green-500";
      case "overloaded":
        return "bg-red-500";
      case "underutilized":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (utilization: number) => {
    if (utilization > 100) {
      return <Badge variant="destructive">Overloaded</Badge>;
    } else if (utilization > 80) {
      return <Badge className="bg-green-500">Optimal</Badge>;
    } else if (utilization > 50) {
      return <Badge variant="secondary">Good</Badge>;
    } else {
      return <Badge variant="outline">Under-utilized</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Machine Capacity Utilization - {timeRange === "week" ? "This Week" : "This Month"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(machineGroups).map(([machineId, machineData]) => {
              const avgUtilization = machineData.reduce((sum, d) => sum + d.utilization, 0) / machineData.length;
              const totalPlannedHours = machineData.reduce((sum, d) => sum + d.plannedHours, 0);
              const totalAvailableHours = machineData.reduce((sum, d) => sum + d.availableHours, 0);
              
              return (
                <div key={machineId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{machineData[0].machineName}</h3>
                      <p className="text-sm text-gray-600">Machine ID: {machineId}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(avgUtilization)}
                      <p className="text-sm text-gray-600 mt-1">{avgUtilization.toFixed(1)}% avg utilization</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Planned Hours</p>
                        <p className="font-semibold">{totalPlannedHours.toFixed(1)}h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Available Hours</p>
                        <p className="font-semibold">{totalAvailableHours.toFixed(1)}h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Efficiency</p>
                        <p className="font-semibold">{((totalPlannedHours / totalAvailableHours) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacity Utilization</span>
                      <span>{avgUtilization.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(avgUtilization, 100)} 
                      className="h-2"
                    />
                    {avgUtilization > 100 && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Machine is overloaded by {(avgUtilization - 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Daily breakdown for weekly view */}
                  {timeRange === "week" && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Daily Breakdown</p>
                      <div className="grid grid-cols-7 gap-2">
                        {machineData.slice(0, 7).map((dayData, index) => (
                          <div key={index} className="text-center">
                            <div className="text-xs text-gray-500 mb-1">
                              {new Date(dayData.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div 
                              className={`h-16 rounded flex items-center justify-center text-white text-xs font-medium ${getStatusColor(dayData.status)}`}
                            >
                              {dayData.utilization.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {dayData.workOrders.length} WO
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}