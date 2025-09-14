import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  Filter,
  Edit,
  Play,
  CheckCircle,
  Archive,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScrollableDialog,
  ScrollableDialogContent,
  ScrollableDialogHeader,
  ScrollableDialogTitle,
  ScrollableDialogTrigger,
} from "@/components/ui/scrollable-dialog";
import { ProductionPlan, CapacityPlanning, Machine } from "@shared/schema";
import { ProductionPlanForm } from "@/components/planning/ProductionPlanForm";
import { ProductionPlanDetails } from "@/components/planning/ProductionPlanDetails";
import { ProductionPlanEdit } from "@/components/planning/ProductionPlanEdit";
import { CapacityPlanningChart } from "@/components/planning/CapacityPlanningChart";
import { SchedulingModule } from "@/components/planning/SchedulingModule";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";

interface CapacityData {
  machineId: string;
  machineName: string;
  date: string;
  plannedHours: number;
  availableHours: number;
  utilization: number;
  workOrders: string[];
  status: "overloaded" | "optimal" | "underutilized";
}

export function ProductionPlanningPage() {
  const [selectedPlanType, setSelectedPlanType] = useState<string>("all");
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);

  const { data: productionPlans = [], isLoading: plansLoading } = useQuery<
    ProductionPlan[]
  >({
    queryKey: ["/api/production-plans"],
  });

  const { data: capacityData = [], isLoading: capacityLoading } = useQuery<
    CapacityPlanning[]
  >({
    queryKey: ["/api/capacity-planning"],
  });

  // Generate mock capacity data for charts
  const generateMockCapacityData = (): CapacityData[] => {
    const today = new Date();
    const mockData: CapacityData[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      mockData.push({
        machineId: "machine-1",
        machineName: "CNC-001",
        date: date.toISOString().split("T")[0],
        plannedHours: Math.random() * 8,
        availableHours: 8,
        utilization: Math.random() * 100,
        workOrders: ["WO-001", "WO-002"],
        status:
          Math.random() > 0.7
            ? "overloaded"
            : Math.random() > 0.3
            ? "optimal"
            : "underutilized",
      });
    }

    return mockData;
  };

  const machines: Machine[] = [
    {
      id: "machine-1",
      name: "CNC-001",
      type: "CNC",
      operation: "Milling",
      subOperation: null,
      manufacturer: "Haas",
      model: "VF-2",
      serialNumber: "H001",
      location: "Shop Floor A",
      status: "active",
      efficiency: 85,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "machine-2",
      name: "CNC-002",
      type: "CNC",
      operation: "Turning",
      subOperation: null,
      manufacturer: "Mazak",
      model: "QT-200",
      serialNumber: "M001",
      location: "Shop Floor A",
      status: "active",
      efficiency: 92,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "machine-3",
      name: "Press-001",
      type: "Press",
      operation: "Pressing",
      subOperation: null,
      manufacturer: "Amada",
      model: "HFE-100",
      serialNumber: "A001",
      location: "Shop Floor B",
      status: "maintenance",
      efficiency: 78,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "machine-4",
      name: "Welder-001",
      type: "Welder",
      operation: "Welding",
      subOperation: null,
      manufacturer: "Miller",
      model: "MIG-200",
      serialNumber: "W001",
      location: "Shop Floor B",
      status: "active",
      efficiency: 88,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const filteredPlans = productionPlans.filter(
    (plan: ProductionPlan) =>
      selectedPlanType === "all" || plan.planType === selectedPlanType
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800" },
      active: { color: "bg-green-100 text-green-800" },
      completed: { color: "bg-blue-100 text-blue-800" },
      archived: { color: "bg-orange-100 text-orange-800" },
    };

    return (
      <Badge
        className={
          statusConfig[status as keyof typeof statusConfig]?.color ||
          statusConfig.draft.color
        }
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
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

  const handleViewDetails = (planId: string) => {
    setSelectedPlanId(planId);
    setIsViewingDetails(true);
  };

  const handleEditPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsEditingPlan(true);
  };

  const handleCloseDetails = () => {
    setIsViewingDetails(false);
    setSelectedPlanId(null);
  };

  const handleCloseEdit = () => {
    setIsEditingPlan(false);
    setSelectedPlanId(null);
  };

  return (
    <ResponsiveLayout isConnected={true}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Production Planning</h1>
            <p className="text-gray-600">
              Plan and optimize manufacturing schedules and capacity
            </p>
          </div>
          <ScrollableDialog
            open={isCreatingPlan}
            onOpenChange={setIsCreatingPlan}
          >
            <ScrollableDialogTrigger asChild>
              <Button data-testid="button-create-plan">
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </ScrollableDialogTrigger>
            <ScrollableDialogContent className="max-w-4xl">
              <ScrollableDialogHeader>
                <ScrollableDialogTitle>
                  Create Production Plan
                </ScrollableDialogTitle>
              </ScrollableDialogHeader>
              <ProductionPlanForm onSuccess={() => setIsCreatingPlan(false)} />
            </ScrollableDialogContent>
          </ScrollableDialog>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Plans</p>
                  <p className="text-2xl font-bold">
                    {
                      productionPlans.filter(
                        (p: ProductionPlan) => p.status === "active"
                      ).length
                    }
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Work Orders</p>
                  <p className="text-2xl font-bold">
                    {productionPlans.reduce(
                      (sum: number, plan: ProductionPlan) =>
                        sum + (plan.totalWorkOrders || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Efficiency</p>
                  <p className="text-2xl font-bold">
                    {productionPlans.length > 0
                      ? Math.round(
                          productionPlans.reduce(
                            (sum: number, plan: ProductionPlan) =>
                              sum + (plan.efficiency || 0),
                            0
                          ) / productionPlans.length
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="bg-orange-100 p-2 rounded">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Capacity Alerts</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div className="bg-red-100 p-2 rounded">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Production Plans</TabsTrigger>
            <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
            <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          </TabsList>

          {/* Production Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Production Plans</h2>
              <Select
                value={selectedPlanType}
                onValueChange={setSelectedPlanType}
              >
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="daily">Daily Plans</SelectItem>
                  <SelectItem value="weekly">Weekly Plans</SelectItem>
                  <SelectItem value="monthly">Monthly Plans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {plansLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlans.map((plan: ProductionPlan) => (
                  <Card
                    key={plan.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getPlanTypeIcon(plan.planType)}
                          <div>
                            <h3 className="font-semibold">{plan.planName}</h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {plan.planType} Plan
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(plan.status || "draft")}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {new Date(plan.startDate).toLocaleDateString()} -{" "}
                            {new Date(plan.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Work Orders:</span>
                          <span className="font-medium">
                            {plan.completedWorkOrders || 0} /{" "}
                            {plan.totalWorkOrders || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Efficiency:</span>
                          <span className="font-medium">
                            {plan.efficiency || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {Math.round(
                              ((plan.completedWorkOrders || 0) /
                                (plan.totalWorkOrders || 1)) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                ((plan.completedWorkOrders || 0) /
                                  (plan.totalWorkOrders || 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleViewDetails(plan.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEditPlan(plan.id)}
                        >
                          Edit Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Capacity Planning Tab */}
          <TabsContent value="capacity" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Machine Capacity Overview
              </h2>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Plan Capacity
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Capacity Chart */}
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Weekly Capacity Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <CapacityPlanningChart
                    data={generateMockCapacityData()}
                    timeRange="week"
                  />
                </CardContent>
              </Card>

              {/* Machine Utilization Cards */}
              {machines.slice(0, 4).map((machine: Machine) => {
                const utilization = Math.random() * 100; // Mock utilization data
                const isOverCapacity = utilization > 90;

                return (
                  <Card key={machine.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{machine.name}</h3>
                          <p className="text-sm text-gray-600">
                            {machine.operation}
                          </p>
                        </div>
                        {isOverCapacity && (
                          <Badge className="bg-red-100 text-red-800">
                            Over Capacity
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utilization</span>
                          <span className="font-medium">
                            {Math.round(utilization)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              isOverCapacity
                                ? "bg-red-500"
                                : utilization > 75
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Efficiency: {machine.efficiency}%</span>
                          <span>Status: {machine.status}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-4">
            <SchedulingModule />
          </TabsContent>
        </Tabs>

        {/* View Details Dialog */}
        <ScrollableDialog
          open={isViewingDetails}
          onOpenChange={setIsViewingDetails}
        >
          <ScrollableDialogContent className="max-w-6xl">
            <ScrollableDialogHeader>
              <ScrollableDialogTitle>
                Production Plan Details
              </ScrollableDialogTitle>
            </ScrollableDialogHeader>
            {selectedPlanId && (
              <ProductionPlanDetails
                planId={selectedPlanId}
                onEdit={() => {
                  setIsViewingDetails(false);
                  setIsEditingPlan(true);
                }}
                onClose={handleCloseDetails}
              />
            )}
          </ScrollableDialogContent>
        </ScrollableDialog>

        {/* Edit Plan Dialog */}
        <ScrollableDialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
          <ScrollableDialogContent className="max-w-4xl">
            <ScrollableDialogHeader>
              <ScrollableDialogTitle>
                Edit Production Plan
              </ScrollableDialogTitle>
            </ScrollableDialogHeader>
            {selectedPlanId && (
              <ProductionPlanEdit
                planId={selectedPlanId}
                onSuccess={handleCloseEdit}
                onCancel={handleCloseEdit}
              />
            )}
          </ScrollableDialogContent>
        </ScrollableDialog>
      </div>
    </ResponsiveLayout>
  );
}
