import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu } from "lucide-react";
import { MachineWithWorkOrder } from "@shared/schema";

interface MachineStatusGridProps {
  machines?: MachineWithWorkOrder[];
}

export function MachineStatusGrid({ machines }: MachineStatusGridProps) {
  if (!machines) {
    return (
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Machine Status Overview</CardTitle>
            <div className="animate-pulse h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-[#388e3c] bg-opacity-10 text-[#388e3c]";
      case "setup":
        return "bg-[#f57c00] bg-opacity-10 text-[#f57c00]";
      case "maintenance":
      case "error":
        return "bg-[#d32f2f] bg-opacity-10 text-[#d32f2f]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "running":
        return "Running";
      case "setup":
        return "Setup";
      case "maintenance":
        return "Maintenance";
      case "error":
        return "Error";
      case "idle":
        return "Idle";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Card className="rounded-xl shadow-md border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Machine Status Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-[#388e3c] rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {machines.map((machine) => (
            <div 
              key={machine.id} 
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-[#1976d2]" />
                  <span className="font-medium">{machine.name}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(machine.status)}`}>
                  {formatStatus(machine.status)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Operation:</span>
                  <span className="font-medium">{machine.operation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className="font-medium">{machine.efficiency || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {machine.status === "maintenance" ? "Downtime:" : "Work Order:"}
                  </span>
                  <span className={`font-medium ${machine.status === "maintenance" ? "text-[#d32f2f]" : "text-[#1976d2]"}`}>
                    {machine.status === "maintenance" && machine.downtime 
                      ? `${Math.floor(machine.downtime / 60)}h ${machine.downtime % 60}m`
                      : machine.workOrder?.orderNumber || "None"
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
