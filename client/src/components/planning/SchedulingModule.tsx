import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Users, AlertTriangle, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleItem {
  id: string;
  workOrderId: string;
  machineId: string;
  operationId: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "in_progress" | "completed" | "delayed";
  priority: "low" | "medium" | "high" | "critical";
  estimatedDuration: number;
  actualDuration?: number;
  assignedOperator?: string;
  notes?: string;
}

interface Machine {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  partNumber: string;
  quantity: number;
  dueDate: string;
  priority: string;
  operations: Array<{
    id: string;
    operationType: string;
    estimatedTime: number;
    machineType: string;
  }>;
}

export function SchedulingModule() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMachine, setSelectedMachine] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for demonstration
  const { data: schedule = [] } = useQuery({
    queryKey: ["/api/schedule", selectedDate, selectedMachine],
    queryFn: () => generateMockSchedule(),
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: pendingWorkOrders = [] } = useQuery({
    queryKey: ["/api/work-orders", "pending"],
    queryFn: () => generateMockWorkOrders(),
  });

  const generateMockSchedule = (): ScheduleItem[] => {
    const baseDate = new Date(selectedDate);
    const scheduleItems: ScheduleItem[] = [];
    
    // Generate schedule items for the selected date
    for (let hour = 6; hour < 22; hour += 2) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(hour + 2, 0, 0, 0);
      
      scheduleItems.push({
        id: `sched-${hour}`,
        workOrderId: `WO-${1000 + hour}`,
        machineId: `machine-${(hour % 4) + 1}`,
        operationId: `op-${hour}`,
        startTime,
        endTime,
        status: hour < 14 ? "completed" : hour < 18 ? "in_progress" : "scheduled",
        priority: hour % 3 === 0 ? "high" : hour % 2 === 0 ? "medium" : "low",
        estimatedDuration: 120,
        assignedOperator: `Operator ${String.fromCharCode(65 + (hour % 6))}`,
      });
    }
    
    return scheduleItems;
  };

  const generateMockWorkOrders = (): WorkOrder[] => {
    return [
      {
        id: "wo-1001",
        workOrderNumber: "WO-1001",
        partNumber: "SHAFT-001",
        quantity: 50,
        dueDate: "2024-01-20",
        priority: "high",
        operations: [
          { id: "op-1", operationType: "TURNING", estimatedTime: 120, machineType: "CNC" },
          { id: "op-2", operationType: "MILLING", estimatedTime: 90, machineType: "CNC" },
        ]
      },
      {
        id: "wo-1002",
        workOrderNumber: "WO-1002",
        partNumber: "BRACKET-002",
        quantity: 25,
        dueDate: "2024-01-22",
        priority: "medium",
        operations: [
          { id: "op-3", operationType: "MILLING", estimatedTime: 180, machineType: "CNC" },
          { id: "op-4", operationType: "DRILLING", estimatedTime: 60, machineType: "DRILL" },
        ]
      },
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "scheduled":
        return "bg-gray-500";
      case "delayed":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleReschedule = (scheduleItem: ScheduleItem) => {
    toast({
      title: "Rescheduling",
      description: `Rescheduling operation for ${scheduleItem.workOrderId}`,
    });
  };

  const handleAutoSchedule = () => {
    toast({
      title: "Auto Scheduling",
      description: "Optimizing schedule based on priorities and machine availability",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Production Scheduling
            </div>
            <Button onClick={handleAutoSchedule} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Auto Schedule
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="machine">Machine</Label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger className="w-48 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  {machines.map((machine: Machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="view">View</Label>
              <Select value={viewMode} onValueChange={(value: "day" | "week" | "month") => setViewMode(value)}>
                <SelectTrigger className="w-32 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Timeline - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.map((item) => (
                  <div key={item.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} 
                        />
                        <span className="font-medium">{item.workOrderId}</span>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Machine: CNC-{item.machineId.slice(-1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {item.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {item.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {item.assignedOperator && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {item.assignedOperator}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleReschedule(item)}
                    >
                      Reschedule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Work Orders */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Pending Work Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingWorkOrders.map((wo) => (
                  <div key={wo.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{wo.workOrderNumber}</span>
                      <Badge className={getPriorityColor(wo.priority)}>
                        {wo.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Part: {wo.partNumber}</p>
                      <p>Qty: {wo.quantity}</p>
                      <p>Due: {new Date(wo.dueDate).toLocaleDateString()}</p>
                      <p>Operations: {wo.operations.length}</p>
                    </div>
                    <Button size="sm" className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}