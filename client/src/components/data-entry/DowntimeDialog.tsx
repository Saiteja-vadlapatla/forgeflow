import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertDowntimeEventSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Clock, Play, Square, Timer, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const downtimeFormSchema = insertDowntimeEventSchema.extend({
  reasonCodeId: z.string().min(1, "Reason code is required"),
});

type DowntimeFormData = z.infer<typeof downtimeFormSchema>;

interface DowntimeDialogProps {
  machineId?: string;
  onClose?: () => void;
  trigger?: React.ReactNode;
}

export function DowntimeDialog({ machineId, onClose, trigger }: DowntimeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDowntime, setActiveDowntime] = useState<any>(null);
  const [timer, setTimer] = useState(0);
  const [selectedMachine, setSelectedMachine] = useState(machineId || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Timer effect for active downtime
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeDowntime) {
      interval = setInterval(() => {
        const startTime = new Date(activeDowntime.startTime);
        const now = new Date();
        setTimer(Math.floor((now.getTime() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeDowntime]);

  // Fetch data
  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: reasonCodes = [] } = useQuery({
    queryKey: ["/api/data-entry/reason-codes/active"],
  });

  const { data: activeDowntimeEvents = [] } = useQuery({
    queryKey: ["/api/downtime/active"],
    refetchInterval: 5000,
  });

  // Find active downtime for selected machine
  useEffect(() => {
    if (selectedMachine) {
      const currentDowntime = activeDowntimeEvents.find((event: any) => 
        event.machineId === selectedMachine && !event.endTime
      );
      setActiveDowntime(currentDowntime);
    }
  }, [selectedMachine, activeDowntimeEvents]);

  const form = useForm<DowntimeFormData>({
    resolver: zodResolver(downtimeFormSchema),
    defaultValues: {
      machineId: selectedMachine,
      reason: "",
      reasonCodeId: "",
      description: "",
      reportedBy: "current-user", // This would come from auth context
    },
  });

  // Start downtime mutation
  const startDowntimeMutation = useMutation({
    mutationFn: async (data: DowntimeFormData) => {
      const downtimeData = {
        ...data,
        machineId: selectedMachine,
        startTime: new Date(),
      };
      return apiRequest("downtime", {
        method: "POST",
        body: downtimeData,
      });
    },
    onSuccess: (data) => {
      setActiveDowntime(data);
      queryClient.invalidateQueries({ queryKey: ["/api/downtime/active"] });
      toast({
        title: "Downtime Started",
        description: "Downtime event has been recorded and timer started.",
        variant: "destructive",
      });
      form.reset();
    },
  });

  // End downtime mutation
  const endDowntimeMutation = useMutation({
    mutationFn: async (downtimeId: string) => {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(activeDowntime.startTime).getTime()) / (1000 * 60));
      
      return apiRequest(`downtime/${downtimeId}`, {
        method: "PATCH",
        body: { 
          endTime: endTime,
          duration: duration,
          resolvedBy: "current-user"
        },
      });
    },
    onSuccess: () => {
      setActiveDowntime(null);
      setTimer(0);
      queryClient.invalidateQueries({ queryKey: ["/api/downtime"] });
      queryClient.invalidateQueries({ queryKey: ["/api/downtime/active"] });
      toast({
        title: "Downtime Ended",
        description: "Downtime event has been resolved successfully.",
      });
      setIsOpen(false);
      onClose?.();
    },
  });

  const onSubmit = (data: DowntimeFormData) => {
    startDowntimeMutation.mutate(data);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downtimeReasonCodes = reasonCodes.filter((code: any) => code.category === "downtime");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="destructive" 
            data-testid="button-record-downtime"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Record Downtime</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Downtime Recording</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Machine Selection */}
          {!machineId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Machine</label>
              <Select value={selectedMachine} onValueChange={setSelectedMachine} data-testid="select-machine">
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
          )}

          {/* Active Downtime Display */}
          {activeDowntime ? (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                  <Timer className="h-5 w-5" />
                  <span>Active Downtime</span>
                  <Badge variant="destructive">Running</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reason</p>
                      <p className="font-medium">{activeDowntime.reason}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-bold text-xl text-red-600">{formatTime(timer)}</p>
                    </div>
                  </div>
                  
                  {activeDowntime.description && (
                    <div>
                      <p className="text-muted-foreground text-sm">Description</p>
                      <p className="text-sm">{activeDowntime.description}</p>
                    </div>
                  )}

                  <Button
                    onClick={() => endDowntimeMutation.mutate(activeDowntime.id)}
                    disabled={endDowntimeMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-end-downtime"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Downtime
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Start Downtime Form */
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reasonCodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason Code</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-reason-code">
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason code" />
                          </SelectTrigger>
                          <SelectContent>
                            {downtimeReasonCodes.map((code: any) => (
                              <SelectItem key={code.id} value={code.id}>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{code.code}</Badge>
                                  <span>{code.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason Summary</FormLabel>
                      <FormControl>
                        <input
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Brief reason for downtime"
                          data-testid="input-reason"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Detailed description of the issue..."
                          rows={3}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive"
                    disabled={startDowntimeMutation.isPending || !selectedMachine}
                    data-testid="button-start-downtime"
                  >
                    {startDowntimeMutation.isPending ? (
                      "Starting..."
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Downtime
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick Downtime Panel for active monitoring
export function DowntimePanel() {
  const { data: activeDowntimeEvents = [] } = useQuery({
    queryKey: ["/api/downtime/active"],
    refetchInterval: 3000,
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
  });

  if (activeDowntimeEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Active Downtime Events</span>
            <Badge variant="outline">0</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active downtime events</p>
            <p className="text-sm">All machines are operational</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span>Active Downtime Events</span>
          <Badge variant="destructive">{activeDowntimeEvents.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeDowntimeEvents.map((event: any) => {
            const machine = machines.find((m: any) => m.id === event.machineId);
            const startTime = new Date(event.startTime);
            const now = new Date();
            const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            
            return (
              <div
                key={event.id}
                data-testid={`downtime-event-${event.id}`}
                className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950/20"
              >
                <div className="flex items-center space-x-4">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">{machine?.name || "Unknown Machine"}</p>
                    <p className="text-sm text-muted-foreground">{event.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    {Math.floor(duration / 3600).toString().padStart(2, '0')}:
                    {Math.floor((duration % 3600) / 60).toString().padStart(2, '0')}:
                    {(duration % 60).toString().padStart(2, '0')}
                  </p>
                  <DowntimeDialog 
                    machineId={event.machineId}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}