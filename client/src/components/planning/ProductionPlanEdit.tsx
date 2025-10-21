import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Play,
  Calendar,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollableDialogFooter } from "@/components/ui/scrollable-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  insertProductionPlanSchema,
  WorkOrder,
  Machine,
  SchedulingPolicy,
  ProductionPlan,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { WorkOrderSelector } from "./WorkOrderSelector";
import { TimelineManager } from "./TimelineManager";
import { SchedulePreview } from "./SchedulePreview";

// Enhanced form schema with work order selection and scheduling policy
const enhancedProductionPlanFormSchema = insertProductionPlanSchema
  .extend({
    workOrderIds: z
      .array(z.string())
      .min(1, "At least one work order must be selected"),
    schedulingPolicy: z.object({
      rule: z.enum(["EDD", "SPT", "CR", "FIFO", "PRIORITY"]),
      horizon: z.number().min(24).max(8760),
      allowOverload: z.boolean(),
      maxOverloadPercentage: z.number().optional(),
      rescheduleInterval: z.number().optional(),
    }),
  })
  .omit({
    startDate: true,
    endDate: true,
  })
  .extend({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  });

type EnhancedProductionPlanFormData = z.infer<
  typeof enhancedProductionPlanFormSchema
>;

interface ProductionPlanEditProps {
  planId: string;
  onSuccess: () => void;
  onCancel: () => void;
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

export function ProductionPlanEdit({
  planId,
  onSuccess,
  onCancel,
}: ProductionPlanEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>([]);
  const [totalEstimatedHours, setTotalEstimatedHours] = useState(0);
  const [resourceRequirements, setResourceRequirements] = useState<any>({});

  // Fetch existing plan data
  const { data: existingPlan, isLoading: planLoading } =
    useQuery<ProductionPlan>({
      queryKey: ["/api/production-plans", planId],
      queryFn: async () => {
        const response = await apiRequest(
          "GET",
          `/api/production-plans/${planId}`
        );
        // Parse the response data properly
        const data = await response.json();
        return data as ProductionPlan;
      },
    });

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

  // Load existing plan data when available
  useEffect(() => {
    if (existingPlan) {
      // Safe date parsing
      const parseDate = (dateValue: any): string => {
        if (!dateValue) return "";
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
      };

      form.reset({
        planName: existingPlan.planName || "",
        planType:
          (existingPlan.planType as "daily" | "weekly" | "monthly") || "weekly",
        startDate: parseDate(existingPlan.startDate),
        endDate: parseDate(existingPlan.endDate),
        status:
          (existingPlan.status as
            | "draft"
            | "active"
            | "completed"
            | "archived") || "draft",
        notes: existingPlan.notes || "",
        createdBy: existingPlan.createdBy || "current-user",
        workOrderIds: (existingPlan.workOrderIds as string[]) || [],
        schedulingPolicy:
          (existingPlan.schedulingPolicy as SchedulingPolicy) || {
            rule: "EDD",
            horizon: 168,
            allowOverload: false,
            maxOverloadPercentage: 120,
            rescheduleInterval: 60,
          },
      });

      // Set selected work orders
      setSelectedWorkOrders((existingPlan.workOrderIds as string[]) || []);
    }
  }, [existingPlan, form]);

  // Auto-generate plan name based on type and dates
  useEffect(() => {
    if (startDate && planType && !existingPlan) {
      const date = new Date(startDate);
      const month = date.toLocaleDateString("en-US", { month: "long" });
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
  }, [planType, startDate, form, existingPlan]);

  // Update form when work orders selection changes
  useEffect(() => {
    form.setValue("workOrderIds", selectedWorkOrders);
  }, [selectedWorkOrders, form]);

  const mutation = useMutation({
    mutationFn: async (data: EnhancedProductionPlanFormData) => {
      // Calculate total work orders and estimated efficiency
      const selectedWOs = workOrders.filter((wo) =>
        data.workOrderIds.includes(wo.id)
      );
      const totalWorkOrders = selectedWOs.length;
      const totalHours = selectedWOs.reduce(
        (sum, wo) => sum + (wo.estimatedHours || 0),
        0
      );

      // Calculate initial efficiency estimate based on plan duration and capacity
      const planDurationDays = Math.ceil(
        (new Date(data.endDate).getTime() -
          new Date(data.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const workingDays = Math.floor((planDurationDays * 5) / 7); // Assume 5-day work week
      const availableMachines = machines.filter(
        (m) => m.status !== "maintenance"
      ).length;
      const totalCapacityHours = workingDays * 8 * availableMachines;
      const estimatedEfficiency =
        totalCapacityHours > 0
          ? Math.min(100, (totalHours / totalCapacityHours) * 100)
          : 0;

      const enhancedData = {
        ...data,
        totalWorkOrders,
        efficiency: Math.round(estimatedEfficiency),
      };

      return await apiRequest(
        "PUT",
        `/api/production-plans/${planId}`,
        enhancedData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-plans"] });
      toast({
        title: "Success",
        description: "Production plan updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update production plan",
        variant: "destructive",
      });
    },
  });

  const handleCapacityChange = useCallback(
    (totalHours: number, requirements: any) => {
      setTotalEstimatedHours(totalHours);
      setResourceRequirements(requirements);
    },
    []
  );

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
        return (
          form.watch("planName") &&
          form.watch("startDate") &&
          form.watch("endDate")
        );
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

  if (planLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Production Plan</h2>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {FORM_STEPS.length}
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
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
                  } ${
                    isAccessible
                      ? "cursor-pointer hover:opacity-80"
                      : "cursor-not-allowed"
                  }`}
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
                      onValueChange={(value) =>
                        form.setValue(
                          "planType",
                          value as "daily" | "weekly" | "monthly"
                        )
                      }
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
                      min={new Date().toISOString().split("T")[0]}
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
                      min={startDate || new Date().toISOString().split("T")[0]}
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
            planType={planType as "daily" | "weekly" | "monthly"}
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
        <ScrollableDialogFooter className="flex items-center justify-between pt-6 border-t">
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
                  {selectedWorkOrders.length} work orders selected (
                  {totalEstimatedHours.toFixed(1)}h)
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
                onClick={onCancel}
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
                  data-testid="button-update-plan"
                  onClick={() => {
                    console.log("Updating plan");
                    mutation.mutate(form.getValues());
                  }}
                >
                  {mutation.isPending ? (
                    <>Updating...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Plan
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </ScrollableDialogFooter>
      </form>
    </div>
  );
}
