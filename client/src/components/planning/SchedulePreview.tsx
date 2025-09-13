import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WorkOrder,
  Machine,
  SchedulingPolicy,
  SchedulingConflict,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SchedulePreviewProps {
  selectedWorkOrders: string[];
  startDate: string;
  endDate: string;
  schedulingPolicy: SchedulingPolicy;
  workOrders: WorkOrder[];
  machines: Machine[];
  planType?: "daily" | "weekly" | "monthly";
}

interface ScheduleSlot {
  id: string;
  workOrderId: string;
  operationId: string;
  machineId: string;
  startTime: string;
  endTime: string;
  setupMinutes: number;
  runMinutes: number;
  quantity: number;
  priority: number;
  status: string;
  conflictFlags: string[];
}

interface CapacityBucket {
  machineId: string;
  date: string;
  plannedMinutes: number;
  availableMinutes: number;
  utilization: number;
  isOverloaded: boolean;
}

interface SchedulePreviewData {
  scheduleSlots: ScheduleSlot[];
  capacityBuckets: CapacityBucket[];
  conflicts: SchedulingConflict[];
  metrics: {
    totalWorkOrders: number;
    totalHours: number;
    averageUtilization: number;
    criticalPath: number;
    makespan: number;
  };
}

export function SchedulePreview({
  selectedWorkOrders,
  startDate,
  endDate,
  schedulingPolicy,
  workOrders,
  machines,
  planType = "weekly",
}: SchedulePreviewProps) {
  const [scheduleData, setScheduleData] = useState<SchedulePreviewData | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const generateScheduleMutation = useMutation({
    mutationFn: async (data: {
      workOrderIds: string[];
      startDate: string;
      endDate: string;
      policy: SchedulingPolicy;
    }): Promise<SchedulePreviewData> => {
      const response = await apiRequest(
        "POST",
        "/api/scheduling/preview",
        data
      );
      return response as unknown as SchedulePreviewData;
    },
    onSuccess: (data: SchedulePreviewData) => {
      setScheduleData(data);
      setPreviewError(null);
    },
    onError: (error: any) => {
      setPreviewError(error.message || "Failed to generate schedule preview");
      setScheduleData(null);
    },
  });

  // Auto-generate preview when inputs change
  useEffect(() => {
    if (selectedWorkOrders.length > 0 && startDate && endDate) {
      generatePreview();
    } else {
      setScheduleData(null);
    }
  }, [selectedWorkOrders, startDate, endDate, schedulingPolicy]);

  const generatePreview = async () => {
    if (selectedWorkOrders.length === 0) return;

    setIsGenerating(true);
    try {
      await generateScheduleMutation.mutateAsync({
        workOrderIds: selectedWorkOrders,
        startDate,
        endDate,
        policy: schedulingPolicy,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getWorkOrderById = (id: string) => {
    return workOrders.find((wo) => wo.id === id);
  };

  const getMachineById = (id: string) => {
    return machines.find((m) => m.id === id);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getCapacityGroupKey = (
    date: string,
    planType: "daily" | "weekly" | "monthly"
  ) => {
    const dateObj = new Date(date);
    switch (planType) {
      case "daily":
        return date; // Keep individual dates
      case "weekly":
        const weekStart = new Date(dateObj);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday
        weekStart.setDate(diff);
        return `${weekStart.getFullYear()}-W${Math.ceil(
          (weekStart.getTime() -
            new Date(weekStart.getFullYear(), 0, 1).getTime()) /
            (7 * 24 * 60 * 60 * 1000)
        )}`;
      case "monthly":
        return `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}`;
      default:
        return date;
    }
  };

  const formatGroupKey = (
    groupKey: string,
    planType: "daily" | "weekly" | "monthly"
  ) => {
    switch (planType) {
      case "daily":
        return new Date(groupKey).toLocaleDateString();
      case "weekly":
        const [year, week] = groupKey.split("-W");
        return `Week ${week}, ${year}`;
      case "monthly":
        const [monthYear, month] = groupKey.split("-");
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return `${monthNames[parseInt(month) - 1]} ${monthYear}`;
      default:
        return groupKey;
    }
  };

  const exportSchedule = () => {
    if (!scheduleData?.scheduleSlots) return;

    const csvContent = [
      ["Work Order", "Machine", "Start Time", "End Time", "Duration", "Status"],
      ...scheduleData.scheduleSlots.map((slot) => {
        const workOrder = getWorkOrderById(slot.workOrderId);
        const machine = getMachineById(slot.machineId);
        return [
          workOrder?.orderNumber || "Unknown",
          machine?.name || "Unknown",
          formatDateTime(slot.startTime),
          formatDateTime(slot.endTime),
          formatDuration(slot.setupMinutes + slot.runMinutes),
          slot.status,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-preview-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (selectedWorkOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select work orders to generate schedule preview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Schedule Preview</h3>
          <p className="text-sm text-gray-600">
            Generated using {schedulingPolicy.rule} scheduling rule
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreview}
            disabled={isGenerating}
            data-testid="button-regenerate-preview"
          >
            {isGenerating ? (
              <Clock className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? "Generating..." : "Regenerate"}
          </Button>
          {scheduleData && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportSchedule}
              data-testid="button-export-schedule"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {previewError && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{previewError}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p>Generating schedule preview...</p>
            <p className="text-sm text-gray-600 mt-2">
              Analyzing {selectedWorkOrders.length} work orders across{" "}
              {machines.length} machines
            </p>
          </CardContent>
        </Card>
      )}

      {/* Schedule Results */}
      {scheduleData && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="conflicts">Issues</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold text-blue-600"
                      data-testid="metric-total-workorders"
                    >
                      {scheduleData.metrics?.totalWorkOrders ?? 0}
                    </div>
                    <div className="text-sm text-gray-600">Work Orders</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold text-green-600"
                      data-testid="metric-total-hours"
                    >
                      {(scheduleData.metrics?.totalHours ?? 0).toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold text-purple-600"
                      data-testid="metric-avg-utilization"
                    >
                      {(scheduleData.metrics?.averageUtilization ?? 0).toFixed(
                        1
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Avg Utilization</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold text-orange-600"
                      data-testid="metric-makespan"
                    >
                      {(scheduleData.metrics?.makespan ?? 0).toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Makespan</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold text-red-600"
                      data-testid="metric-critical-path"
                    >
                      {(scheduleData.metrics?.criticalPath ?? 0).toFixed(1)}h
                    </div>
                    <div className="text-sm text-gray-600">Critical Path</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Machine Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Machine Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {machines.map((machine) => {
                      const machineBuckets = (
                        scheduleData.capacityBuckets ?? []
                      ).filter((b) => b.machineId === machine.id);
                      const avgUtilization =
                        machineBuckets.length > 0
                          ? machineBuckets.reduce(
                              (sum, b) => sum + b.utilization,
                              0
                            ) / machineBuckets.length
                          : 0;
                      const isOverloaded = machineBuckets.some(
                        (b) => b.isOverloaded
                      );

                      return (
                        <div
                          key={machine.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Cpu className="h-5 w-5 text-gray-400" />
                            <div>
                              <div
                                className="font-medium"
                                data-testid={`machine-name-${machine.id}`}
                              >
                                {machine.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {machine.operation}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div
                                className={`font-medium ${
                                  isOverloaded
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                                data-testid={`utilization-${machine.id}`}
                              >
                                {avgUtilization.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {machineBuckets.length} periods
                              </div>
                            </div>
                            {isOverloaded && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {(scheduleData.scheduleSlots ?? [])
                      .sort(
                        (a, b) =>
                          new Date(a.startTime).getTime() -
                          new Date(b.startTime).getTime()
                      )
                      .map((slot, index) => {
                        const workOrder = getWorkOrderById(slot.workOrderId);
                        const machine = getMachineById(slot.machineId);
                        const hasConflicts =
                          (slot.conflictFlags ?? []).length > 0;

                        return (
                          <div
                            key={slot.id}
                            className={`p-3 border rounded-lg ${
                              hasConflicts
                                ? "border-red-200 bg-red-50"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-8 bg-blue-500 rounded"></div>
                                <div>
                                  <div
                                    className="font-medium"
                                    data-testid={`timeline-workorder-${index}`}
                                  >
                                    {workOrder?.orderNumber || "Unknown"}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {machine?.name || "Unknown"} •{" "}
                                    {workOrder?.partNumber}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className="text-sm font-medium"
                                  data-testid={`timeline-schedule-${index}`}
                                >
                                  {formatDateTime(slot.startTime)} -{" "}
                                  {formatDateTime(slot.endTime)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDuration(
                                    slot.setupMinutes + slot.runMinutes
                                  )}
                                </div>
                              </div>
                            </div>
                            {hasConflicts && (
                              <div className="mt-2 text-sm text-red-600">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                Conflicts:{" "}
                                {(slot.conflictFlags ?? []).join(", ")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Capacity Tab */}
          <TabsContent value="capacity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {planType.charAt(0).toUpperCase() + planType.slice(1)}{" "}
                    Capacity Overview
                  </span>
                  <Badge className="text-xs">
                    {
                      Object.keys(
                        (scheduleData.capacityBuckets ?? []).reduce(
                          (acc, bucket) => {
                            const groupKey = getCapacityGroupKey(
                              bucket.date,
                              planType
                            );
                            if (!acc[groupKey]) acc[groupKey] = [];
                            acc[groupKey].push(bucket);
                            return acc;
                          },
                          {} as Record<string, CapacityBucket[]>
                        )
                      ).length
                    }{" "}
                    {planType === "daily"
                      ? "Days"
                      : planType === "weekly"
                      ? "Weeks"
                      : "Months"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {Object.entries(
                      (scheduleData.capacityBuckets ?? []).reduce(
                        (acc, bucket) => {
                          const groupKey = getCapacityGroupKey(
                            bucket.date,
                            planType
                          );
                          if (!acc[groupKey]) acc[groupKey] = [];
                          acc[groupKey].push(bucket);
                          return acc;
                        },
                        {} as Record<string, CapacityBucket[]>
                      )
                    ).map(([groupKey, buckets]) => {
                      const totalPlanned = buckets.reduce(
                        (sum, b) => sum + b.plannedMinutes,
                        0
                      );
                      const totalAvailable = buckets.reduce(
                        (sum, b) => sum + b.availableMinutes,
                        0
                      );
                      const groupUtilization =
                        totalAvailable > 0
                          ? (totalPlanned / totalAvailable) * 100
                          : 0;
                      const hasOverload = buckets.some((b) => b.isOverloaded);

                      return (
                        <div
                          key={groupKey}
                          className={`border rounded-lg p-4 ${
                            hasOverload
                              ? "border-red-200 bg-red-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-medium">
                              {formatGroupKey(groupKey, planType)}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`text-sm font-medium ${
                                  hasOverload
                                    ? "text-red-600"
                                    : groupUtilization > 90
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {groupUtilization.toFixed(1)}% Overall
                              </div>
                              {hasOverload && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>

                          {/* Group utilization bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                hasOverload
                                  ? "bg-red-500"
                                  : groupUtilization > 90
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(100, groupUtilization)}%`,
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            {buckets.map((bucket) => {
                              const machine = getMachineById(bucket.machineId);
                              return (
                                <div
                                  key={`${bucket.date}-${bucket.machineId}`}
                                  className="flex items-center justify-between p-2 bg-white rounded border"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Cpu className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-sm">
                                      {machine?.name || "Unknown"}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-xs text-gray-600">
                                      {formatDuration(bucket.plannedMinutes)} /{" "}
                                      {formatDuration(bucket.availableMinutes)}
                                    </div>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          bucket.isOverloaded
                                            ? "bg-red-500"
                                            : bucket.utilization > 90
                                            ? "bg-orange-500"
                                            : "bg-green-500"
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            bucket.utilization
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                    <div
                                      className={`text-xs font-medium w-12 text-right ${
                                        bucket.isOverloaded
                                          ? "text-red-600"
                                          : bucket.utilization > 90
                                          ? "text-orange-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {bucket.utilization.toFixed(0)}%
                                    </div>
                                    {bucket.isOverloaded && (
                                      <AlertTriangle className="h-3 w-3 text-red-500" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Scheduling Issues</span>
                  {(scheduleData.conflicts?.length ?? 0) > 0 ? (
                    <Badge className="bg-red-100 text-red-800">
                      {scheduleData.conflicts.length}
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Clean
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(scheduleData.conflicts?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No conflicts detected in the schedule</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {(scheduleData.conflicts ?? []).map((conflict, index) => (
                        <Alert
                          key={index}
                          className={getConflictSeverityColor(
                            conflict.severity
                          )}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium mb-1">
                              {conflict.type.replace(/_/g, " ").toUpperCase()} -{" "}
                              {conflict.severity.toUpperCase()}
                            </div>
                            <div className="mb-2">{conflict.description}</div>
                            {conflict.suggestedResolution && (
                              <div className="text-sm">
                                <strong>Suggestion:</strong>{" "}
                                {conflict.suggestedResolution}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
