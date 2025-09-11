import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Save, Play, Calendar, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { insertProductionPlanSchema, WorkOrder, Machine, SchedulingPolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { WorkOrderSelector } from "./WorkOrderSelector";
import { TimelineManager } from "./TimelineManager";
import { SchedulePreview } from "./SchedulePreview";

// Enhanced form schema with work order selection and scheduling policy
const enhancedProductionPlanFormSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  planType: z.enum(["daily", "weekly", "monthly"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["draft", "active", "completed"]),
  notes: z.string().optional(),
  createdBy: z.string(),
  workOrderIds: z.array(z.string()).min(1, "At least one work order must be selected"),
  schedulingPolicy: z.object({
    rule: z.enum(["EDD", "SPT", "CR", "FIFO", "PRIORITY"]),
    horizon: z.number().min(24).max(8760),
    allowOverload: z.boolean(),
    maxOverloadPercentage: z.number().optional(),
    rescheduleInterval: z.number().optional(),
  }),
});

type EnhancedProductionPlanFormData = z.infer<typeof enhancedProductionPlanFormSchema>;

interface ProductionPlanFormProps {
  onSuccess: () => void;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FORM_STEPS: FormStep[] = [
  {
    id: "basic",
    title: "Plan Details",
    description: "Basic plan information and timeline",
    icon: Calendar,
  },
  {
    id: "workorders",
    title: "Work Orders",
    description: "Select and configure work orders",
    icon: Users,
  },
  {
    id: "scheduling",
    title: "Scheduling",
    description: "Configure scheduling policies and timeline",
    icon: Settings,
  },
  {
    id: "preview",
    title: "Preview",
    description: "Review and validate the production plan",
    icon: Play,
  },
];

export function ProductionPlanForm({ onSuccess }: ProductionPlanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);
  const [totalEstimatedHours, setTotalEstimatedHours] = useState(0);
  const [resourceRequirements, setResourceRequirements] = useState<any>({});

  // Get work orders and machines for capacity calculations
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const form = useForm<EnhancedProductionPlanFormData>({
    resolver: zodResolver(enhancedProductionPlanFormSchema),
    defaultValues: {
      planName: "",
      planType: "weekly" as const,
      startDate: "",
      endDate: "",
      status: "draft" as const,
      notes: "",
      createdBy: "current-user",
      workOrderIds: [],
      schedulingPolicy: {
        rule: "EDD" as const,
        horizon: 168, // 1 week default
        allowOverload: false,
        maxOverloadPercentage: 120,
        rescheduleInterval: 60,
      },
    },
  });

  // Watch form values for real-time updates
  const planType = form.watch("planType");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const schedulingPolicy = form.watch("schedulingPolicy");

  // Auto-generate plan name based on type and dates
  useEffect(() => {
    if (startDate && planType) {
      const date = new Date(startDate);
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      let generatedName = "";
      switch (planType) {
        case "daily":
          generatedName = `Daily Plan - ${date.toLocaleDateString()}`;
          break;
        case "weekly":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          generatedName = `Weekly Plan - ${weekStart.toLocaleDateString()}`;
          break;
        case "monthly":
          generatedName = `Monthly Plan - ${month} ${year}`;
          break;
      }
      
      if (generatedName && !form.getValues("planName")) {
        form.setValue("planName", generatedName);
      }
    }
  }, [planType, startDate, form]);

  // Update form when work orders selection changes
  useEffect(() => {
    form.setValue("workOrderIds", selectedWorkOrders);
  }, [selectedWorkOrders, form]);

  const mutation = useMutation({
    mutationFn: async (data: EnhancedProductionPlanFormData) => {
      // Calculate total work orders and estimated efficiency
      const selectedWOs = workOrders.filter(wo => data.workOrderIds.includes(wo.id));
      const totalWorkOrders = selectedWOs.length;
      const totalHours = selectedWOs.reduce((sum, wo) => sum + (wo.estimatedHours || 0), 0);
      
      // Calculate initial efficiency estimate based on plan duration and capacity
      const planDurationDays = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const workingDays = Math.floor(planDurationDays * 5/7); // Assume 5-day work week
      const availableMachines = machines.filter(m => m.status !== "maintenance").length;
      const totalCapacityHours = workingDays * 8 * availableMachines;
      const estimatedEfficiency = totalCapacityHours > 0 ? Math.min(100, (totalHours / totalCapacityHours) * 100) : 0;

      const enhancedData = {
        ...data,
        totalWorkOrders,
        completedWorkOrders: 0,
        efficiency: Math.round(estimatedEfficiency),
        // Convert workOrderIds array to JSON for storage
        workOrderIds: data.workOrderIds,
        // Convert schedulingPolicy to JSON for storage
        schedulingPolicy: data.schedulingPolicy,
      };

      const response = await fetch("/api/production-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enhancedData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create production plan");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      toast({
        title: "Success",
        description: "Production plan created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create production plan",
        variant: "destructive",
      });
    },
  });

  const handleCapacityChange = (totalHours: number, requirements: any) => {
    setTotalEstimatedHours(totalHours);
    setResourceRequirements(requirements);
  };

  const handleTimelineChange = (start: string, end: string) => {
    form.setValue("startDate", start);
    form.setValue("endDate", end);
  };

  const handleSchedulingPolicyChange = (policy: SchedulingPolicy) => {
    form.setValue("schedulingPolicy", policy);
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, FORM_STEPS.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // Basic info
        return form.watch("planName") && form.watch("startDate") && form.watch("endDate");
      case 1: // Work orders
        return selectedWorkOrders.length > 0;
      case 2: // Scheduling
        return true; // Scheduling policy has defaults
      case 3: // Preview
        return true;
      default:
        return false;
    }
  };

  const onSubmit = (data: EnhancedProductionPlanFormData) => {
    mutation.mutate(data);
  };

  const getStepProgress = () => {
    return ((currentStep + 1) / FORM_STEPS.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create Production Plan</h2>
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {FORM_STEPS.length}
          </div>
        </div>
        
        <Progress value={getStepProgress()} className="h-2" />
        
        {/* Step Navigation */}
        <div className="flex items-center space-x-4">
          {FORM_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isAccessible = index <= currentStep;

            return (
              <div key={step.id} className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => isAccessible && setCurrentStep(index)}
                  disabled={!isAccessible}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : isCompleted
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-500 border border-gray-300"
                  } ${isAccessible ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"}`}
                  data-testid={`step-${step.id}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </button>
                {index < FORM_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Plan Information */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Plan Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input
                      id="planName"
                      {...form.register("planName")}
                      placeholder="Weekly Production Plan - Week 3"
                      data-testid="input-plan-name"
                    />
                    {form.formState.errors.planName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.planName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="planType">Plan Type</Label>
                    <Select 
                      value={form.watch("planType")} 
                      onValueChange={(value) => form.setValue("planType", value)}
                    >
                      <SelectTrigger data-testid="select-plan-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Plan</SelectItem>
                        <SelectItem value="weekly">Weekly Plan</SelectItem>
                        <SelectItem value="monthly">Monthly Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...form.register("startDate")}
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="input-start-date"
                    />
                    {form.formState.errors.startDate && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.startDate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...form.register("endDate")}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      data-testid="input-end-date"
                    />
                    {form.formState.errors.endDate && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Plan Description</Label>
                  <Textarea
                    id="notes"
                    {...form.register("notes")}
                    placeholder="Plan objectives, special requirements, constraints..."
                    className="resize-none"
                    rows={3}
                    data-testid="textarea-plan-notes"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Work Order Selection */}
        {currentStep === 1 && (
          <WorkOrderSelector
            selectedWorkOrders={selectedWorkOrders}
            onSelectionChange={setSelectedWorkOrders}
            onCapacityChange={handleCapacityChange}
          />
        )}

        {/* Step 3: Scheduling Configuration */}
        {currentStep === 2 && startDate && endDate && (
          <TimelineManager
            planType={planType}
            startDate={startDate}
            endDate={endDate}
            onTimelineChange={handleTimelineChange}
            selectedWorkOrders={selectedWorkOrders}
            totalEstimatedHours={totalEstimatedHours}
            schedulingPolicy={schedulingPolicy}
            onSchedulingPolicyChange={handleSchedulingPolicyChange}
          />
        )}

        {/* Step 4: Schedule Preview */}
        {currentStep === 3 && (
          <SchedulePreview
            selectedWorkOrders={selectedWorkOrders}
            startDate={startDate}
            endDate={endDate}
            schedulingPolicy={schedulingPolicy}
            workOrders={workOrders}
            machines={machines}
          />
        )}

        {/* Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              data-testid="button-previous-step"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Step-specific info */}
            <div className="text-sm text-gray-600">
              {currentStep === 1 && selectedWorkOrders.length > 0 && (
                <span data-testid="text-selected-workorders">
                  {selectedWorkOrders.length} work orders selected ({totalEstimatedHours.toFixed(1)}h)
                </span>
              )}
              {currentStep === 2 && (
                <span data-testid="text-scheduling-rule">
                  Using {schedulingPolicy.rule} scheduling rule
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
                data-testid="button-cancel-plan"
              >
                Cancel
              </Button>
              
              {currentStep < FORM_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  data-testid="button-next-step"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={mutation.isPending || !canProceedToNext()}
                  data-testid="button-create-plan"
                >
                  {mutation.isPending ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Plan
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}