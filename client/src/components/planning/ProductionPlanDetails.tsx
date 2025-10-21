import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Users,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Play,
  Pause,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ProductionPlan,
  WorkOrder,
  Machine,
  SchedulingPolicy,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { SchedulePreview } from "./SchedulePreview";

interface ProductionPlanDetailsProps {
  planId: string;
  onEdit: () => void;
  onClose: () => void;
}

export function ProductionPlanDetails({
  planId,
  onEdit,
  onClose,
}: ProductionPlanDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch production plan details
  const { data: plan, isLoading: planLoading } = useQuery<ProductionPlan>({
    queryKey: ["/api/production-plans", planId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/production-plans/${planId}`
      );
      return response.json();
    },
  });

  // Fetch work orders
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  // Fetch machines
  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const getStatusBadge = (status: string | null | undefined) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", icon: Edit },
      active: { color: "bg-green-100 text-green-800", icon: Play },
      completed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      archived: { color: "bg-orange-100 text-orange-800", icon: Archive },
      paused: { color: "bg-yellow-100 text-yellow-800", icon: Pause },
    };

    const safeStatus = String(status || "draft");
    const config =
      statusConfig[safeStatus as keyof typeof statusConfig] ||
      statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </Badge>
    );
  };

  const getPlanTypeIcon = (planType: string) => {
    switch (planType) {
      case "daily":
        return <Clock className="h-4 w-4" />;
      case "weekly":
        return <Calendar className="h-4 w-4" />;
      case "monthly":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProgressPercentage = () => {
    if (!plan) return 0;
    const total = plan.totalWorkOrders || 0;
    const completed = plan.completedWorkOrders || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-green-600";
    if (efficiency >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getWorkOrdersForPlan = () => {
    if (!plan?.workOrderIds || !Array.isArray(plan.workOrderIds)) return [];
    return workOrders.filter((wo) => plan.workOrderIds.includes(wo.id));
  };

  const getSchedulingPolicy = (): SchedulingPolicy | null => {
    if (!plan?.schedulingPolicy) return null;
    return plan.schedulingPolicy as SchedulingPolicy;
  };

  const exportPlanDetails = () => {
    if (!plan) return;

    const planData = {
      planName: plan.planName,
      planType: plan.planType,
      status: plan.status,
      startDate: formatDate(plan.startDate),
      endDate: formatDate(plan.endDate),
      totalWorkOrders: plan.totalWorkOrders,
      completedWorkOrders: plan.completedWorkOrders,
      efficiency: plan.efficiency,
      createdBy: plan.createdBy,
      createdAt: formatDateTime(plan.createdAt),
      updatedAt: formatDateTime(plan.updatedAt),
      notes: plan.notes,
      workOrders: getWorkOrdersForPlan().map((wo) => ({
        orderNumber: wo.orderNumber,
        partNumber: wo.partNumber,
        quantity: wo.quantity,
        priority: wo.priority,
        status: wo.status,
      })),
      schedulingPolicy: getSchedulingPolicy(),
    };

    const blob = new Blob([JSON.stringify(planData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `production-plan-${plan.planName.replace(/\s+/g, "-")}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (!plan) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Production plan not found.</AlertDescription>
      </Alert>
    );
  }

  const selectedWorkOrders = getWorkOrdersForPlan();
  const schedulingPolicy = getSchedulingPolicy();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getPlanTypeIcon(plan.planType)}
          <div>
            <h2 className="text-2xl font-bold">{plan.planName}</h2>
            <p className="text-gray-600 capitalize">
              {plan.planType} Production Plan
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(plan.status || "draft")}
          <Button variant="outline" size="sm" onClick={exportPlanDetails}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Plan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold">{getProgressPercentage()}%</p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Work Orders</p>
                <p className="text-2xl font-bold">
                  {plan.completedWorkOrders || 0} / {plan.totalWorkOrders || 0}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Efficiency</p>
                <p
                  className={`text-2xl font-bold ${getEfficiencyColor(
                    plan.efficiency || 0
                  )}`}
                >
                  {plan.efficiency || 0}%
                </p>
              </div>
              <div className="bg-orange-100 p-2 rounded">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold">
                  {Math.ceil(
                    (new Date(plan.endDate).getTime() -
                      new Date(plan.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workorders">Work Orders</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Information */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Plan Type
                    </label>
                    <p className="text-sm capitalize">{plan.planType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <div className="mt-1">
                      {getStatusBadge(plan.status || "draft")}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Start Date
                    </label>
                    <p className="text-sm">{formatDate(plan.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      End Date
                    </label>
                    <p className="text-sm">{formatDate(plan.endDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Created By
                    </label>
                    <p className="text-sm">{plan.createdBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Last Updated
                    </label>
                    <p className="text-sm">{formatDateTime(plan.updatedAt)}</p>
                  </div>
                </div>
                {plan.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Notes
                    </label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                      {plan.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduling Policy */}
            {schedulingPolicy && (
              <Card>
                <CardHeader>
                  <CardTitle>Scheduling Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Rule:</span>
                    <Badge variant="outline">{schedulingPolicy.rule}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Horizon:</span>
                    <span className="text-sm">
                      {schedulingPolicy.horizon} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Allow Overload:</span>
                    <span className="text-sm">
                      {schedulingPolicy.allowOverload ? "Yes" : "No"}
                    </span>
                  </div>
                  {schedulingPolicy.maxOverloadPercentage && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Max Overload:</span>
                      <span className="text-sm">
                        {schedulingPolicy.maxOverloadPercentage}%
                      </span>
                    </div>
                  )}
                  {schedulingPolicy.rescheduleInterval && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        Reschedule Interval:
                      </span>
                      <span className="text-sm">
                        {schedulingPolicy.rescheduleInterval} min
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Selected Work Orders ({selectedWorkOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {selectedWorkOrders.map((workOrder) => (
                    <div
                      key={workOrder.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-8 bg-blue-500 rounded"></div>
                        <div>
                          <div className="font-medium">
                            {workOrder.orderNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {workOrder.partNumber} • Qty: {workOrder.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            workOrder.priority === "high"
                              ? "destructive"
                              : workOrder.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {workOrder.priority}
                        </Badge>
                        <Badge
                          variant={
                            workOrder.status === "completed"
                              ? "default"
                              : workOrder.status === "in_progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {workOrder.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {schedulingPolicy ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Scheduling Rule</h4>
                      <p className="text-sm text-gray-600">
                        {schedulingPolicy.rule === "EDD" &&
                          "Earliest Due Date - Prioritizes work orders by due date"}
                        {schedulingPolicy.rule === "SPT" &&
                          "Shortest Processing Time - Prioritizes shorter jobs"}
                        {schedulingPolicy.rule === "CR" &&
                          "Critical Ratio - Balances due date and processing time"}
                        {schedulingPolicy.rule === "FIFO" &&
                          "First In, First Out - Processes in arrival order"}
                        {schedulingPolicy.rule === "PRIORITY" &&
                          "Priority-based - Uses work order priority levels"}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Planning Horizon</h4>
                      <p className="text-sm text-gray-600">
                        {schedulingPolicy.horizon} hours (
                        {Math.round(schedulingPolicy.horizon / 24)} days)
                      </p>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Overload Settings</h4>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm">
                        Allow Overload:{" "}
                        {schedulingPolicy.allowOverload ? "Yes" : "No"}
                      </span>
                      {schedulingPolicy.maxOverloadPercentage && (
                        <span className="text-sm">
                          Max Overload: {schedulingPolicy.maxOverloadPercentage}
                          %
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No scheduling policy configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          {selectedWorkOrders.length > 0 && schedulingPolicy ? (
            <SchedulePreview
              selectedWorkOrders={selectedWorkOrders.map((wo) => wo.id)}
              startDate={new Date(plan.startDate).toISOString().split("T")[0]}
              endDate={new Date(plan.endDate).toISOString().split("T")[0]}
              schedulingPolicy={schedulingPolicy}
              workOrders={selectedWorkOrders}
              machines={machines}
              planType={plan.planType as "daily" | "weekly" | "monthly"}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  No work orders or scheduling policy available for timeline
                  preview
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
