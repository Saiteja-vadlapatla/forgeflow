import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  Settings, 
  Users, 
  Wrench, 
  Package, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  Plus,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Machine, SetupGroup, OperatorSkill, ToolResource } from "@shared/schema";

// Import the capacity planning components (to be implemented)
import { CapabilityManager } from "@/components/planning/CapabilityManager";
import { SetupMatrixEditor } from "@/components/planning/SetupMatrixEditor";  
import { ResourceConstraintsPanel } from "@/components/planning/ResourceConstraintsPanel";
import { CapacityBucketsView } from "@/components/planning/CapacityBucketsView";
import { ScenarioPlanner } from "@/components/planning/ScenarioPlanner";

interface CapacityOverview {
  totalMachines: number;
  availableMachines: number;
  averageUtilization: number;
  setupGroups: number;
  operatorSkills: number;
  toolResources: number;
  capacityAlerts: number;
}

export function CapacityPlanningPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch capacity planning data
  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: setupGroups = [], isLoading: setupGroupsLoading } = useQuery<SetupGroup[]>({
    queryKey: ["/api/capacity/setup-groups"],
  });

  const { data: operatorSkills = [], isLoading: skillsLoading } = useQuery<OperatorSkill[]>({
    queryKey: ["/api/capacity/operator-skills"],
  });

  const { data: toolResources = [], isLoading: toolsLoading } = useQuery<ToolResource[]>({
    queryKey: ["/api/capacity/tool-resources"],
  });

  // Calculate capacity overview
  const capacityOverview: CapacityOverview = {
    totalMachines: machines.length,
    availableMachines: machines.filter(m => m.status !== "maintenance" && m.status !== "error").length,
    averageUtilization: machines.length > 0 
      ? Math.round(machines.reduce((sum, m) => sum + (m.efficiency || 0), 0) / machines.length)
      : 0,
    setupGroups: setupGroups.length,
    operatorSkills: operatorSkills.length,
    toolResources: toolResources.length,
    capacityAlerts: machines.filter(m => m.status === "error" || (m.efficiency || 0) < 50).length,
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "bg-red-100 text-red-800";
    if (utilization >= 75) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <ResponsiveLayout isConnected={true}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Capacity Planning</h1>
            <p className="text-gray-600">Optimize resource allocation and production capacity</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" data-testid="button-export-capacity">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button data-testid="button-create-scenario">
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Machines</p>
                  <p className="text-2xl font-bold" data-testid="text-total-machines">
                    {capacityOverview.totalMachines}
                  </p>
                </div>
                <div className="bg-blue-100 p-2 rounded">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {capacityOverview.availableMachines} available
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Utilization</p>
                  <p className="text-2xl font-bold" data-testid="text-avg-utilization">
                    {capacityOverview.averageUtilization}%
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <Badge className={getUtilizationColor(capacityOverview.averageUtilization)}>
                  {capacityOverview.averageUtilization >= 90 ? "High" : 
                   capacityOverview.averageUtilization >= 75 ? "Optimal" : "Low"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Setup Groups</p>
                  <p className="text-2xl font-bold" data-testid="text-setup-groups">
                    {capacityOverview.setupGroups}
                  </p>
                </div>
                <div className="bg-purple-100 p-2 rounded">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {capacityOverview.operatorSkills} operator skills
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Capacity Alerts</p>
                  <p className="text-2xl font-bold" data-testid="text-capacity-alerts">
                    {capacityOverview.capacityAlerts}
                  </p>
                </div>
                <div className="bg-red-100 p-2 rounded">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Requires attention
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="capabilities" data-testid="tab-capabilities">
              <Settings className="h-4 w-4 mr-2" />
              Capabilities
            </TabsTrigger>
            <TabsTrigger value="setup-matrix" data-testid="tab-setup-matrix">
              <Clock className="h-4 w-4 mr-2" />
              Setup Matrix
            </TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources">
              <Users className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="capacity-view" data-testid="tab-capacity-view">
              <BarChart3 className="h-4 w-4 mr-2" />
              Capacity View
            </TabsTrigger>
            <TabsTrigger value="scenarios" data-testid="tab-scenarios">
              <TrendingUp className="h-4 w-4 mr-2" />
              Scenarios
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Machine Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Machine Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {machines.slice(0, 5).map((machine) => (
                      <div key={machine.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            machine.status === "running" ? "bg-green-500" :
                            machine.status === "idle" ? "bg-yellow-500" :
                            machine.status === "maintenance" ? "bg-orange-500" :
                            "bg-red-500"
                          }`} />
                          <div>
                            <p className="font-medium" data-testid={`text-machine-name-${machine.id}`}>
                              {machine.name}
                            </p>
                            <p className="text-sm text-gray-600">{machine.operation}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium" data-testid={`text-machine-efficiency-${machine.id}`}>
                            {machine.efficiency || 0}%
                          </p>
                          <p className="text-sm text-gray-600 capitalize">{machine.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {machines.length > 5 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        View All Machines ({machines.length})
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resource Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>Operator Skills</span>
                      </div>
                      <span className="font-medium" data-testid="text-operator-skills-count">
                        {capacityOverview.operatorSkills}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wrench className="h-4 w-4 text-green-500" />
                        <span>Tool Resources</span>
                      </div>
                      <span className="font-medium" data-testid="text-tool-resources-count">
                        {capacityOverview.toolResources}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-orange-500" />
                        <span>Setup Groups</span>
                      </div>
                      <span className="font-medium" data-testid="text-setup-groups-count">
                        {capacityOverview.setupGroups}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => setActiveTab("capabilities")}
                    data-testid="button-manage-capabilities"
                  >
                    <Settings className="h-6 w-6 mb-2" />
                    Manage Capabilities
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => setActiveTab("setup-matrix")}
                    data-testid="button-edit-setup-matrix"
                  >
                    <Clock className="h-6 w-6 mb-2" />
                    Edit Setup Matrix
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col"
                    onClick={() => setActiveTab("scenarios")}
                    data-testid="button-create-scenario-quick"
                  >
                    <TrendingUp className="h-6 w-6 mb-2" />
                    Create Scenario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-4">
            <CapabilityManager />
          </TabsContent>

          {/* Setup Matrix Tab */}
          <TabsContent value="setup-matrix" className="space-y-4">
            <SetupMatrixEditor />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <ResourceConstraintsPanel />
          </TabsContent>

          {/* Capacity View Tab */}
          <TabsContent value="capacity-view" className="space-y-4">
            <CapacityBucketsView />
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            <ScenarioPlanner />
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}