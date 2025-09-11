import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Square, Settings, AlertTriangle, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AppHeader } from "@/components/layout/AppHeader";
import { SideNavigation } from "@/components/layout/SideNavigation";
import { MachineWithWorkOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MachineOperationsPage() {
  const [selectedMachine, setSelectedMachine] = useState<MachineWithWorkOrder | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: machines = [], isLoading } = useQuery<MachineWithWorkOrder[]>({
    queryKey: ["/api/machines"],
  });

  const updateMachineStatus = useMutation({
    mutationFn: async ({ machineId, status }: { machineId: string; status: string }) => {
      return apiRequest("PATCH", `/api/machines/${machineId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      toast({
        title: "Machine Status Updated",
        description: "The machine status has been successfully updated.",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-800 border-green-200";
      case "setup": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "maintenance": return "bg-red-100 text-red-800 border-red-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      case "idle": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <Play className="h-4 w-4" />;
      case "setup": return <Settings className="h-4 w-4" />;
      case "maintenance": return <Wrench className="h-4 w-4" />;
      case "error": return <AlertTriangle className="h-4 w-4" />;
      case "idle": return <Pause className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const getMachineTypeDetails = (type: string) => {
    const details = {
      "CNC_TURNING": { name: "CNC Turning", capabilities: ["Facing", "Turning", "Threading", "Boring", "Grooving"] },
      "CONVENTIONAL_TURNING": { name: "Conv. Turning", capabilities: ["Facing", "Turning", "Threading", "Knurling"] },
      "CNC_MILLING": { name: "CNC Milling", capabilities: ["Face Mill", "End Mill", "Drilling", "Tapping", "Boring"] },
      "CONVENTIONAL_MILLING": { name: "Conv. Milling", capabilities: ["Face Mill", "End Mill", "Slotting", "Keyway"] },
      "SURFACE_GRINDING": { name: "Surface Grind", capabilities: ["Surface Grinding", "Angular Grinding"] },
      "CYLINDRICAL_GRINDING": { name: "Cylindrical Grind", capabilities: ["OD Grinding", "ID Grinding"] },
      "WIRE_CUT": { name: "Wire Cut EDM", capabilities: ["Wire Cutting", "Contouring", "Tapering"] },
      "DRILLING": { name: "Drilling", capabilities: ["Drilling", "Reaming", "Counterboring"] },
      "TAPPING": { name: "Tapping", capabilities: ["Tapping", "Thread Milling"] },
    };
    return details[type] || { name: type, capabilities: [] };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader isConnected={true} />
      
      <div className="flex">
        <SideNavigation />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Machine Operations Center</h1>
            <p className="text-gray-600">Monitor and control manufacturing equipment in real-time</p>
          </div>

          {/* Machine Status Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Production Floor Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {["running", "setup", "idle", "maintenance", "error"].map((status) => {
                  const count = machines.filter(m => m.status === status).length;
                  return (
                    <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium capitalize">{status}</span>
                      </div>
                      <div className="text-2xl font-bold mt-2">{count}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Machines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              machines.map((machine) => {
                const typeDetails = getMachineTypeDetails(machine.type);
                const efficiency = machine.efficiency || 0;
                const workOrderProgress = machine.workOrder 
                  ? ((machine.workOrder.completedQuantity || 0) / machine.workOrder.quantity) * 100 
                  : 0;

                return (
                  <Card key={machine.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-bold text-blue-600">
                            {machine.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600">
                            {typeDetails.name} | {machine.location || 'Shop Floor'}
                          </p>
                          {machine.manufacturer && (
                            <p className="text-xs text-gray-500">
                              {machine.manufacturer} {machine.model}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(machine.status)}>
                          {getStatusIcon(machine.status)}
                          <span className="ml-1 capitalize">{machine.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Current Work Order */}
                      {machine.workOrder ? (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">
                            {machine.workOrder.orderNumber}
                          </h4>
                          <p className="text-sm text-blue-700 mb-2">
                            {machine.workOrder.partNumber} - {machine.workOrder.partName}
                          </p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress:</span>
                              <span className="font-medium">
                                {machine.workOrder.completedQuantity || 0}/{machine.workOrder.quantity}
                              </span>
                            </div>
                            <Progress value={workOrderProgress} className="h-2" />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-500">
                          No Active Work Order
                        </div>
                      )}

                      {/* Machine Metrics */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Efficiency:</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={efficiency} className="flex-1 h-2" />
                            <span className="font-medium">{efficiency}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Runtime:</span>
                          <div className="font-medium">
                            {Math.floor((machine.totalRuntime || 0) / 60)}h {(machine.totalRuntime || 0) % 60}m
                          </div>
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div>
                        <span className="text-gray-600 text-sm">Capabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {typeDetails.capabilities.slice(0, 3).map((capability, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                          {typeDetails.capabilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{typeDetails.capabilities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Machine Specifications */}
                      {(machine.maxSpindleSpeed || machine.maxFeedRate) && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {machine.maxSpindleSpeed && (
                            <div>Max Speed: {machine.maxSpindleSpeed.toLocaleString()} RPM</div>
                          )}
                          {machine.maxFeedRate && (
                            <div>Max Feed: {machine.maxFeedRate} mm/min</div>
                          )}
                        </div>
                      )}

                      {/* Maintenance Alert */}
                      {machine.status === "maintenance" && machine.downtime && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex items-center text-red-700">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                              Downtime: {Math.floor(machine.downtime / 60)}h {machine.downtime % 60}m
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => setSelectedMachine(machine)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Control
                            </Button>
                          </DialogTrigger>
                        </Dialog>

                        {machine.status === "maintenance" && (
                          <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedMachine(machine)}
                              >
                                <Wrench className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Machine Control Dialog */}
          {selectedMachine && (
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Machine Control - {selectedMachine.name}</DialogTitle>
                  <DialogDescription>
                    Change the status of the selected machine to control its operation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Change Status</Label>
                    <Select
                      defaultValue={selectedMachine.status}
                      onValueChange={(value) => {
                        updateMachineStatus.mutate({
                          machineId: selectedMachine.id,
                          status: value
                        });
                        setShowStatusDialog(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="setup">Setup</SelectItem>
                        <SelectItem value="idle">Idle</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>
    </div>
  );
}