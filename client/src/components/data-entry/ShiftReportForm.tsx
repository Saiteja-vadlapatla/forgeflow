import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { insertShiftReportSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { CalendarIcon, Clock, Users, Settings, Plus, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const shiftFormSchema = insertShiftReportSchema.extend({
  shiftDate: z.string().min(1, "Shift date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  selectedOperatorIds: z.array(z.string()).min(1, "At least one operator is required"),
  selectedMachineIds: z.array(z.string()).min(1, "At least one machine is required"),
});

type ShiftFormData = z.infer<typeof shiftFormSchema>;

interface ShiftReportFormProps {
  onSuccess?: () => void;
  existingShift?: any;
  mode?: "create" | "edit";
}

export function ShiftReportForm({ onSuccess, existingShift, mode = "create" }: ShiftReportFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    existingShift?.shiftDate ? new Date(existingShift.shiftDate) : new Date()
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch operators and machines for selection
  const { data: operators = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: activeShifts = [] } = useQuery({
    queryKey: ["/api/data-entry/shifts/active"],
  });

  const form = useForm<ShiftFormData>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      shiftType: existingShift?.shiftType || "day",
      shiftDate: existingShift?.shiftDate ? format(new Date(existingShift.shiftDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      startTime: existingShift?.startTime ? format(new Date(existingShift.startTime), "HH:mm") : "06:00",
      endTime: existingShift?.endTime ? format(new Date(existingShift.endTime), "HH:mm") : "",
      supervisorId: existingShift?.supervisorId || "",
      selectedOperatorIds: existingShift?.operatorIds || [],
      selectedMachineIds: existingShift?.machineIds || [],
      notes: existingShift?.notes || "",
    },
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: ShiftFormData) => {
      const { selectedOperatorIds, selectedMachineIds, shiftDate, startTime, endTime, ...shiftData } = data;
      
      const shiftDateTime = new Date(`${shiftDate}T${startTime}:00`);
      const endDateTime = endTime ? new Date(`${shiftDate}T${endTime}:00`) : undefined;

      const payload = {
        ...shiftData,
        shiftDate: shiftDateTime,
        startTime: shiftDateTime,
        endTime: endDateTime,
        operatorIds: selectedOperatorIds,
        machineIds: selectedMachineIds,
      };

      return apiRequest(mode === "edit" ? `shifts/${existingShift.id}` : "shifts", {
        method: mode === "edit" ? "PATCH" : "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/shifts/active"] });
      toast({
        title: mode === "edit" ? "Shift Updated" : "Shift Created",
        description: `Shift has been ${mode === "edit" ? "updated" : "created"} successfully.`,
      });
      form.reset();
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || `Failed to ${mode === "edit" ? "update" : "create"} shift`,
      });
    },
  });

  const closeShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      return apiRequest(`shifts/${shiftId}/close`, {
        method: "PATCH",
        body: { endTime: new Date() },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/data-entry/shifts/active"] });
      toast({
        title: "Shift Closed",
        description: "Shift has been closed successfully.",
      });
    },
  });

  const onSubmit = (data: ShiftFormData) => {
    createShiftMutation.mutate(data);
  };

  const operatorOptions = operators.filter((user: any) => user.role === "operator");

  return (
    <div className="space-y-6">
      {/* Active Shifts Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Active Shifts</span>
            <Badge variant="secondary">{activeShifts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeShifts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active shifts found</p>
              <p className="text-sm">Create a new shift to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeShifts.map((shift: any) => (
                <div
                  key={shift.id}
                  data-testid={`active-shift-${shift.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant={shift.shiftType === "day" ? "default" : shift.shiftType === "evening" ? "secondary" : "outline"}
                    >
                      {shift.shiftType.charAt(0).toUpperCase() + shift.shiftType.slice(1)} Shift
                    </Badge>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">
                        {format(new Date(shift.startTime), "MMM d, yyyy HH:mm")}
                      </p>
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{shift.operatorIds?.length || 0} operators</span>
                        </span>
                        <span>Efficiency: {(shift.efficiency * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => closeShiftMutation.mutate(shift.id)}
                      disabled={closeShiftMutation.isPending}
                      data-testid={`button-close-shift-${shift.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Close Shift
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Shift Form */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-create-shift" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {mode === "edit" ? "Edit Shift" : "Create New Shift"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>{mode === "edit" ? "Edit Shift" : "Create New Shift"}</span>
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Shift Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shiftType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-shift-type">
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Day Shift (06:00-14:00)</SelectItem>
                            <SelectItem value="evening">Evening Shift (14:00-22:00)</SelectItem>
                            <SelectItem value="night">Night Shift (22:00-06:00)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shiftDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Date</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                              data-testid="button-select-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                setSelectedDate(date);
                                field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                          data-testid="input-start-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                          placeholder="Leave blank for open-ended"
                          data-testid="input-end-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Supervisor Selection */}
              <FormField
                control={form.control}
                name="supervisorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Supervisor</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-supervisor">
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.filter((user: any) => user.role === "supervisor" || user.role === "manager").map((supervisor: any) => (
                            <SelectItem key={supervisor.id} value={supervisor.id}>
                              {supervisor.fullName} ({supervisor.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Operator Selection */}
              <FormField
                control={form.control}
                name="selectedOperatorIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Operators</FormLabel>
                    <FormControl>
                      <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                        {operatorOptions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No operators available</p>
                        ) : (
                          <div className="space-y-2">
                            {operatorOptions.map((operator: any) => (
                              <div key={operator.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`operator-${operator.id}`}
                                  checked={field.value.includes(operator.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, operator.id]);
                                    } else {
                                      field.onChange(field.value.filter((id: string) => id !== operator.id));
                                    }
                                  }}
                                  data-testid={`checkbox-operator-${operator.id}`}
                                />
                                <Label htmlFor={`operator-${operator.id}`} className="text-sm">
                                  {operator.fullName} ({operator.username})
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Machine Selection */}
              <FormField
                control={form.control}
                name="selectedMachineIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Machines</FormLabel>
                    <FormControl>
                      <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                        {machines.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No machines available</p>
                        ) : (
                          <div className="space-y-2">
                            {machines.map((machine: any) => (
                              <div key={machine.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`machine-${machine.id}`}
                                  checked={field.value.includes(machine.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, machine.id]);
                                    } else {
                                      field.onChange(field.value.filter((id: string) => id !== machine.id));
                                    }
                                  }}
                                  data-testid={`checkbox-machine-${machine.id}`}
                                />
                                <Label htmlFor={`machine-${machine.id}`} className="text-sm">
                                  {machine.name} ({machine.type})
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Optional shift notes..."
                        rows={3}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
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
                  disabled={createShiftMutation.isPending}
                  data-testid="button-submit"
                >
                  {createShiftMutation.isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      {mode === "edit" ? "Update Shift" : "Create Shift"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}