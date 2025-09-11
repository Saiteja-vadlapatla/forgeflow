import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Users, Settings, Timer, AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OperatorConsoleProps {
  className?: string;
}

export function OperatorConsole({ className }: OperatorConsoleProps) {
  const [selectedOperator, setSelectedOperator] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState("");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [productionCount, setProductionCount] = useState(1);
  const [scrapCount, setScrapCount] = useState(1);
  const [sessionTimer, setSessionTimer] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: operators = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["/api/work-orders"],
  });

  const { data: activeSessions = [] } = useQuery({
    queryKey: ["/api/data-entry/sessions/active"],
    refetchInterval: 5000,
  });

  // Session timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession) {
      interval = setInterval(() => {
        const startTime = new Date(activeSession.sessionStart);
        const now = new Date();
        setSessionTimer(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  // Find current operator's active session
  useEffect(() => {
    if (selectedOperator) {
      const session = activeSessions.find((s: any) => s.operatorId === selectedOperator && s.isActive);
      setActiveSession(session);
      if (session) {
        setSelectedMachine(session.machineId);
        setSelectedWorkOrder(session.workOrderId);
      }
    }
  }, [selectedOperator, activeSessions]);

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        operatorId: selectedOperator,
        machineId: selectedMachine,
        workOrderId: selectedWorkOrder,
        shiftId: "current-shift", // This would come from active shift
        sessionStart: new Date(),
      };
      return apiRequest("data-entry/sessions", {
        method: "POST",
        body: sessionData,
      });
    },
    onSuccess: (data) => {
      setActiveSession(data);
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/sessions/active"] });
      toast({
        title: "Session Started",
        description: "Operator session has been started successfully.",
      });
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`data-entry/sessions/${activeSession.id}/end`, {
        method: "PATCH",
        body: { endTime: new Date() },
      });
    },
    onSuccess: () => {
      setActiveSession(null);
      setSessionTimer(0);
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/sessions/active"] });
      toast({
        title: "Session Ended",
        description: "Operator session has been ended successfully.",
      });
    },
  });

  // Production entry mutation
  const logProductionMutation = useMutation({
    mutationFn: async (isScrap: boolean) => {
      const productionData = {
        machineId: selectedMachine,
        workOrderId: selectedWorkOrder,
        operatorId: selectedOperator,
        quantityProduced: isScrap ? 0 : productionCount,
        quantityScrap: isScrap ? scrapCount : 0,
        operatorSessionId: activeSession?.id,
        timestamp: new Date(),
      };
      return apiRequest("data-entry/production", {
        method: "POST",
        body: productionData,
      });
    },
    onSuccess: (data, isScrap) => {
      setProductionCount(1);
      setScrapCount(1);
      toast({
        title: isScrap ? "Scrap Logged" : "Production Logged",
        description: `${isScrap ? "Scrap" : "Good parts"} have been recorded successfully.`,
        variant: isScrap ? "destructive" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-logs"] });
    },
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const operatorOptions = operators.filter((user: any) => user.role === "operator");
  const activeWorkOrdersForMachine = workOrders.filter((wo: any) => 
    wo.assignedMachineId === selectedMachine && 
    ["pending", "in_progress", "setup"].includes(wo.status)
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Operator Console</span>
            {activeSession && <Badge variant="default">Active</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeSession ? (
            /* Session Setup */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operator-select">Operator</Label>
                  <Select 
                    value={selectedOperator} 
                    onValueChange={setSelectedOperator}
                    data-testid="select-operator"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map((operator: any) => (
                        <SelectItem key={operator.id} value={operator.id}>
                          {operator.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="machine-select">Machine</Label>
                  <Select 
                    value={selectedMachine} 
                    onValueChange={setSelectedMachine}
                    data-testid="select-machine"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine: any) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name} ({machine.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workorder-select">Work Order</Label>
                  <Select 
                    value={selectedWorkOrder} 
                    onValueChange={setSelectedWorkOrder}
                    disabled={!selectedMachine}
                    data-testid="select-workorder"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select work order" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeWorkOrdersForMachine.map((wo: any) => (
                        <SelectItem key={wo.id} value={wo.id}>
                          {wo.orderNumber} - {wo.partName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={() => startSessionMutation.mutate()}
                disabled={!selectedOperator || !selectedMachine || !selectedWorkOrder || startSessionMutation.isPending}
                className="w-full"
                size="lg"
                data-testid="button-start-session"
              >
                <Timer className="h-5 w-5 mr-2" />
                Start Production Session
              </Button>
            </div>
          ) : (
            /* Active Session Display */
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Operator</p>
                  <p className="font-medium">
                    {operators.find((op: any) => op.id === selectedOperator)?.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Machine</p>
                  <p className="font-medium">
                    {machines.find((m: any) => m.id === selectedMachine)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Work Order</p>
                  <p className="font-medium">
                    {workOrders.find((wo: any) => wo.id === selectedWorkOrder)?.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Session Time</p>
                  <p className="font-medium text-lg">{formatTime(sessionTimer)}</p>
                </div>
              </div>

              <Button
                onClick={() => endSessionMutation.mutate()}
                variant="destructive"
                className="w-full"
                data-testid="button-end-session"
              >
                End Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Entry Buttons - Only show when session is active */}
      {activeSession && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Good Parts Entry */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="bg-green-50 dark:bg-green-950/50">
              <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-6 w-6" />
                <span>Good Parts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="good-quantity" className="text-lg">Quantity:</Label>
                  <Input
                    id="good-quantity"
                    type="number"
                    min="1"
                    value={productionCount}
                    onChange={(e) => setProductionCount(parseInt(e.target.value) || 1)}
                    className="text-center text-lg font-bold"
                    data-testid="input-good-quantity"
                  />
                </div>
                <Button
                  onClick={() => logProductionMutation.mutate(false)}
                  disabled={logProductionMutation.isPending}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8"
                  data-testid="button-log-good"
                >
                  <CheckCircle className="h-8 w-8 mr-3" />
                  Log Good Parts
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scrap Parts Entry */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="bg-red-50 dark:bg-red-950/50">
              <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                <XCircle className="h-6 w-6" />
                <span>Scrap Parts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="scrap-quantity" className="text-lg">Quantity:</Label>
                  <Input
                    id="scrap-quantity"
                    type="number"
                    min="1"
                    value={scrapCount}
                    onChange={(e) => setScrapCount(parseInt(e.target.value) || 1)}
                    className="text-center text-lg font-bold"
                    data-testid="input-scrap-quantity"
                  />
                </div>
                <Button
                  onClick={() => logProductionMutation.mutate(true)}
                  disabled={logProductionMutation.isPending}
                  size="lg"
                  variant="destructive"
                  className="w-full text-xl py-8"
                  data-testid="button-log-scrap"
                >
                  <XCircle className="h-8 w-8 mr-3" />
                  Log Scrap Parts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Statistics */}
      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Session Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {activeSession.quantityProduced || 0}
                </p>
                <p className="text-sm text-muted-foreground">Good Parts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {activeSession.quantityScrap || 0}
                </p>
                <p className="text-sm text-muted-foreground">Scrap Parts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {activeSession.avgCycleTime?.toFixed(1) || "0.0"}
                </p>
                <p className="text-sm text-muted-foreground">Avg Cycle (min)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(((activeSession.quantityProduced || 0) / Math.max(sessionTimer / 60, 1)) * 60) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Parts/Hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}