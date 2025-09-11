import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Play, 
  Pause, 
  Save, 
  Copy, 
  Trash2, 
  Compare, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  Zap,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Scenario, Machine, WorkOrder } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface ScenarioFormData {
  name: string;
  description: string;
  baselineDate: string;
  analysisType: "capacity" | "scheduling" | "cost";
  overrides: ScenarioOverride[];
}

interface ScenarioOverride {
  type: "overtime" | "extra_shift" | "temp_capacity" | "operator_efficiency" | "machine_speed";
  machineId?: string;
  value: number;
  startDate: string;
  endDate: string;
  cost?: number;
  description: string;
}

interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  kpis: {
    throughput: number;
    utilization: number;
    makespan: number;
    totalCost: number;
    efficiency: number;
    onTimeDelivery: number;
  };
  improvementPct: {
    throughput: number;
    utilization: number;
    makespan: number;
    totalCost: number;
    efficiency: number;
    onTimeDelivery: number;
  };
  details: {
    additionalHours: number;
    extraCost: number;
    bottleneckReduction: number;
    resourceUtilization: { [key: string]: number };
  };
}

const OVERRIDE_TYPES = [
  { value: "overtime", label: "Overtime Hours", icon: Clock },
  { value: "extra_shift", label: "Extra Shift", icon: Users },
  { value: "temp_capacity", label: "Temporary Capacity", icon: Zap },
  { value: "operator_efficiency", label: "Operator Efficiency", icon: TrendingUp },
  { value: "machine_speed", label: "Machine Speed", icon: BarChart3 },
];

export function ScenarioPlanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparisonView, setComparisonView] = useState<"table" | "chart">("chart");

  const [scenarioFormData, setScenarioFormData] = useState<ScenarioFormData>({
    name: "",
    description: "",
    baselineDate: new Date().toISOString().split('T')[0],
    analysisType: "capacity",
    overrides: [],
  });

  const [newOverride, setNewOverride] = useState<ScenarioOverride>({
    type: "overtime",
    value: 2,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cost: 0,
    description: "",
  });

  // Fetch data
  const { data: scenarios = [], isLoading: scenariosLoading } = useQuery<Scenario[]>({
    queryKey: ["/api/capacity/scenarios"],
  });

  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: workOrders = [], isLoading: workOrdersLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: simulationResults = [], isLoading: resultsLoading } = useQuery<SimulationResult[]>({
    queryKey: ["/api/capacity/simulation-results"],
    enabled: selectedScenarios.length > 0,
  });

  const isLoading = scenariosLoading || machinesLoading || workOrdersLoading;

  // Mutations
  const createScenarioMutation = useMutation({
    mutationFn: async (data: Omit<Scenario, 'id'>) => {
      return await apiRequest("POST", "/api/capacity/scenarios", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/scenarios"] });
      toast({
        title: "Success",
        description: "Scenario created successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create scenario",
        variant: "destructive",
      });
    },
  });

  const runSimulationMutation = useMutation({
    mutationFn: async (scenarioIds: string[]) => {
      return await apiRequest("POST", "/api/capacity/run-simulation", { scenarioIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/simulation-results"] });
      toast({
        title: "Success",
        description: "Simulation completed successfully",
      });
      setIsSimulationRunning(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to run simulation",
        variant: "destructive",
      });
      setIsSimulationRunning(false);
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/capacity/scenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/scenarios"] });
      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete scenario",
        variant: "destructive",
      });
    },
  });

  // Calculate baseline metrics (mock data for demonstration)
  const baselineMetrics = useMemo(() => ({
    throughput: 85,
    utilization: 78,
    makespan: 48,
    totalCost: 15000,
    efficiency: 82,
    onTimeDelivery: 92,
  }), []);

  // Generate comparison chart data
  const comparisonChartData = useMemo(() => {
    const baseline = {
      name: "Baseline",
      throughput: baselineMetrics.throughput,
      utilization: baselineMetrics.utilization,
      makespan: baselineMetrics.makespan,
      cost: baselineMetrics.totalCost / 100, // Scale for visualization
      efficiency: baselineMetrics.efficiency,
      onTimeDelivery: baselineMetrics.onTimeDelivery,
    };

    const scenarioData = simulationResults.map(result => ({
      name: result.scenarioName,
      throughput: result.kpis.throughput,
      utilization: result.kpis.utilization,
      makespan: result.kpis.makespan,
      cost: result.kpis.totalCost / 100,
      efficiency: result.kpis.efficiency,
      onTimeDelivery: result.kpis.onTimeDelivery,
    }));

    return [baseline, ...scenarioData];
  }, [simulationResults, baselineMetrics]);

  // Dialog handlers
  const handleOpenDialog = (scenario?: Scenario) => {
    if (scenario) {
      setEditingScenario(scenario);
      setScenarioFormData({
        name: scenario.name,
        description: scenario.description || "",
        baselineDate: scenario.baselineDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        analysisType: scenario.analysisType as "capacity" | "scheduling" | "cost" || "capacity",
        overrides: scenario.overrides as ScenarioOverride[] || [],
      });
    } else {
      setEditingScenario(null);
      setScenarioFormData({
        name: "",
        description: "",
        baselineDate: new Date().toISOString().split('T')[0],
        analysisType: "capacity",
        overrides: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingScenario(null);
  };

  const handleAddOverride = () => {
    setScenarioFormData({
      ...scenarioFormData,
      overrides: [...scenarioFormData.overrides, { ...newOverride }],
    });
    setNewOverride({
      type: "overtime",
      value: 2,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cost: 0,
      description: "",
    });
  };

  const handleRemoveOverride = (index: number) => {
    const newOverrides = scenarioFormData.overrides.filter((_, i) => i !== index);
    setScenarioFormData({ ...scenarioFormData, overrides: newOverrides });
  };

  const handleSubmitScenario = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scenarioFormData.name) {
      toast({
        title: "Error",
        description: "Scenario name is required",
        variant: "destructive",
      });
      return;
    }

    const scenarioData = {
      ...scenarioFormData,
      baselineDate: new Date(scenarioFormData.baselineDate),
      status: "draft",
      createdBy: "current-user",
    };

    if (editingScenario) {
      // Update scenario (not implemented in mutation yet)
      toast({
        title: "Info",
        description: "Scenario update not yet implemented",
      });
    } else {
      createScenarioMutation.mutate(scenarioData);
    }
  };

  const handleRunSimulation = () => {
    if (selectedScenarios.length === 0) {
      toast({
        title: "Error",
        description: "Select at least one scenario to simulate",
        variant: "destructive",
      });
      return;
    }

    setIsSimulationRunning(true);
    runSimulationMutation.mutate(selectedScenarios);
  };

  const handleDeleteScenario = (id: string) => {
    if (confirm("Are you sure you want to delete this scenario?")) {
      deleteScenarioMutation.mutate(id);
    }
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return "text-green-600";
    if (improvement < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getOverrideTypeIcon = (type: string) => {
    const overrideType = OVERRIDE_TYPES.find(ot => ot.value === type);
    const Icon = overrideType?.icon || Clock;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scenario Planner</h2>
          <p className="text-gray-600">Create what-if scenarios and analyze capacity planning alternatives</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRunSimulation}
            disabled={isSimulationRunning || selectedScenarios.length === 0}
            data-testid="button-run-simulation"
          >
            {isSimulationRunning ? (
              <Pause className="h-4 w-4 mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isSimulationRunning ? "Running..." : "Run Simulation"}
          </Button>
          <Button onClick={() => handleOpenDialog()} data-testid="button-create-scenario">
            <Plus className="h-4 w-4 mr-2" />
            New Scenario
          </Button>
        </div>
      </div>

      {/* Scenarios Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Scenarios</p>
                <p className="text-2xl font-bold" data-testid="text-total-scenarios">
                  {scenarios.length}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Simulations</p>
                <p className="text-2xl font-bold" data-testid="text-active-simulations">
                  {scenarios.filter(s => s.status === "running").length}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <Play className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Improvement</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-avg-improvement">
                  +12.5%
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <Card key={scenario.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedScenarios.includes(scenario.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedScenarios([...selectedScenarios, scenario.id]);
                              } else {
                                setSelectedScenarios(selectedScenarios.filter(id => id !== scenario.id));
                              }
                            }}
                            className="mt-1"
                            data-testid={`checkbox-scenario-${scenario.id}`}
                          />
                          <div>
                            <h3 className="font-semibold" data-testid={`text-scenario-name-${scenario.id}`}>
                              {scenario.name}
                            </h3>
                            <p className="text-sm text-gray-600">{scenario.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {scenario.baselineDate ? 
                                    new Date(scenario.baselineDate).toLocaleDateString() : 
                                    "No date set"
                                  }
                                </span>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {scenario.analysisType || "capacity"}
                              </Badge>
                              <Badge className={
                                scenario.status === "completed" ? "bg-green-100 text-green-800" :
                                scenario.status === "running" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }>
                                {scenario.status || "draft"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(scenario)}
                            data-testid={`button-edit-scenario-${scenario.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Clone scenario
                              handleOpenDialog({ ...scenario, name: `${scenario.name} (Copy)` } as Scenario);
                            }}
                            data-testid={`button-clone-scenario-${scenario.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteScenario(scenario.id)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-scenario-${scenario.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Show overrides */}
                      {scenario.overrides && (scenario.overrides as ScenarioOverride[]).length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Overrides:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(scenario.overrides as ScenarioOverride[]).map((override, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-sm">
                                {getOverrideTypeIcon(override.type)}
                                <span>{override.type.replace('_', ' ')}: {override.value}</span>
                                {override.machineId && (
                                  <Badge variant="secondary" className="text-xs">
                                    {machines.find(m => m.id === override.machineId)?.name || override.machineId}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {scenarios.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No scenarios created yet. Create your first scenario to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation Tab */}
        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Simulation Results</span>
                {isSimulationRunning && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Play className="h-4 w-4 mr-1" />
                    Running...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading simulation results...</p>
                </div>
              ) : simulationResults.length > 0 ? (
                <div className="space-y-4">
                  {simulationResults.map((result) => (
                    <Card key={result.scenarioId} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold" data-testid={`text-result-name-${result.scenarioId}`}>
                            {result.scenarioName}
                          </h3>
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {result.kpis.throughput}%
                            </p>
                            <p className="text-sm text-gray-600">Throughput</p>
                            <p className={`text-xs ${getImprovementColor(result.improvementPct.throughput)}`}>
                              {result.improvementPct.throughput > 0 ? "+" : ""}{result.improvementPct.throughput.toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {result.kpis.utilization}%
                            </p>
                            <p className="text-sm text-gray-600">Utilization</p>
                            <p className={`text-xs ${getImprovementColor(result.improvementPct.utilization)}`}>
                              {result.improvementPct.utilization > 0 ? "+" : ""}{result.improvementPct.utilization.toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {result.kpis.makespan}h
                            </p>
                            <p className="text-sm text-gray-600">Makespan</p>
                            <p className={`text-xs ${getImprovementColor(-result.improvementPct.makespan)}`}>
                              {result.improvementPct.makespan > 0 ? "+" : ""}{result.improvementPct.makespan.toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">
                              ${result.kpis.totalCost.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <p className={`text-xs ${getImprovementColor(-result.improvementPct.totalCost)}`}>
                              {result.improvementPct.totalCost > 0 ? "+" : ""}{result.improvementPct.totalCost.toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-indigo-600">
                              {result.kpis.efficiency}%
                            </p>
                            <p className="text-sm text-gray-600">Efficiency</p>
                            <p className={`text-xs ${getImprovementColor(result.improvementPct.efficiency)}`}>
                              {result.improvementPct.efficiency > 0 ? "+" : ""}{result.improvementPct.efficiency.toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-teal-600">
                              {result.kpis.onTimeDelivery}%
                            </p>
                            <p className="text-sm text-gray-600">On-Time</p>
                            <p className={`text-xs ${getImprovementColor(result.improvementPct.onTimeDelivery)}`}>
                              {result.improvementPct.onTimeDelivery > 0 ? "+" : ""}{result.improvementPct.onTimeDelivery.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t text-sm text-gray-600">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>Additional Hours: {result.details.additionalHours}h</div>
                            <div>Extra Cost: ${result.details.extraCost.toLocaleString()}</div>
                            <div>Bottleneck Reduction: {result.details.bottleneckReduction.toFixed(1)}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No simulation results available. Select scenarios and run a simulation to see results.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Scenario Comparison</span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={comparisonView === "chart" ? "default" : "outline"}
                    onClick={() => setComparisonView("chart")}
                    data-testid="button-chart-view"
                  >
                    Chart View
                  </Button>
                  <Button
                    size="sm"
                    variant={comparisonView === "table" ? "default" : "outline"}
                    onClick={() => setComparisonView("table")}
                    data-testid="button-table-view"
                  >
                    Table View
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comparisonView === "chart" ? (
                <div className="space-y-6">
                  {/* KPI Comparison Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            `${typeof value === 'number' ? value.toFixed(1) : value}${name === 'cost' ? '' : name.includes('makespan') ? 'h' : '%'}`,
                            name === 'cost' ? 'Cost (x100)' : name.charAt(0).toUpperCase() + name.slice(1)
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="throughput" fill="#3B82F6" name="Throughput %" />
                        <Bar dataKey="utilization" fill="#10B981" name="Utilization %" />
                        <Bar dataKey="efficiency" fill="#8B5CF6" name="Efficiency %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Improvement Trend */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparisonChartData.slice(1)}> {/* Exclude baseline */}
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine y={baselineMetrics.throughput} stroke="#EF4444" strokeDasharray="2 2" label="Baseline" />
                        <Line type="monotone" dataKey="throughput" stroke="#3B82F6" strokeWidth={2} name="Throughput %" />
                        <Line type="monotone" dataKey="utilization" stroke="#10B981" strokeWidth={2} name="Utilization %" />
                        <Line type="monotone" dataKey="onTimeDelivery" stroke="#F59E0B" strokeWidth={2} name="On-Time %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scenario</TableHead>
                      <TableHead>Throughput</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Makespan</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>On-Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-medium">Baseline</TableCell>
                      <TableCell>{baselineMetrics.throughput}%</TableCell>
                      <TableCell>{baselineMetrics.utilization}%</TableCell>
                      <TableCell>{baselineMetrics.makespan}h</TableCell>
                      <TableCell>${baselineMetrics.totalCost.toLocaleString()}</TableCell>
                      <TableCell>{baselineMetrics.efficiency}%</TableCell>
                      <TableCell>{baselineMetrics.onTimeDelivery}%</TableCell>
                    </TableRow>
                    {simulationResults.map((result) => (
                      <TableRow key={result.scenarioId} data-testid={`row-comparison-${result.scenarioId}`}>
                        <TableCell className="font-medium">{result.scenarioName}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{result.kpis.throughput}%</span>
                            <span className={`text-sm ${getImprovementColor(result.improvementPct.throughput)}`}>
                              ({result.improvementPct.throughput > 0 ? "+" : ""}{result.improvementPct.throughput.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{result.kpis.utilization}%</span>
                            <span className={`text-sm ${getImprovementColor(result.improvementPct.utilization)}`}>
                              ({result.improvementPct.utilization > 0 ? "+" : ""}{result.improvementPct.utilization.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{result.kpis.makespan}h</span>
                            <span className={`text-sm ${getImprovementColor(-result.improvementPct.makespan)}`}>
                              ({result.improvementPct.makespan > 0 ? "+" : ""}{result.improvementPct.makespan.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>${result.kpis.totalCost.toLocaleString()}</span>
                            <span className={`text-sm ${getImprovementColor(-result.improvementPct.totalCost)}`}>
                              ({result.improvementPct.totalCost > 0 ? "+" : ""}{result.improvementPct.totalCost.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{result.kpis.efficiency}%</span>
                            <span className={`text-sm ${getImprovementColor(result.improvementPct.efficiency)}`}>
                              ({result.improvementPct.efficiency > 0 ? "+" : ""}{result.improvementPct.efficiency.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{result.kpis.onTimeDelivery}%</span>
                            <span className={`text-sm ${getImprovementColor(result.improvementPct.onTimeDelivery)}`}>
                              ({result.improvementPct.onTimeDelivery > 0 ? "+" : ""}{result.improvementPct.onTimeDelivery.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {simulationResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No simulation results to compare. Run simulations first to see comparisons.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Scenario Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScenario ? "Edit Scenario" : "Create New Scenario"}
            </DialogTitle>
            <DialogDescription>
              {editingScenario 
                ? "Modify the scenario configuration and overrides"
                : "Define a new what-if scenario with capacity and operational overrides"
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitScenario} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scenarioName">Scenario Name *</Label>
                <Input
                  id="scenarioName"
                  value={scenarioFormData.name}
                  onChange={(e) => setScenarioFormData({ ...scenarioFormData, name: e.target.value })}
                  placeholder="e.g., Overtime + Extra Shift"
                  data-testid="input-scenario-name"
                />
              </div>
              
              <div>
                <Label htmlFor="analysisType">Analysis Type</Label>
                <Select 
                  value={scenarioFormData.analysisType} 
                  onValueChange={(value) => setScenarioFormData({ 
                    ...scenarioFormData, 
                    analysisType: value as "capacity" | "scheduling" | "cost"
                  })}
                >
                  <SelectTrigger data-testid="select-analysis-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capacity">Capacity Analysis</SelectItem>
                    <SelectItem value="scheduling">Scheduling Analysis</SelectItem>
                    <SelectItem value="cost">Cost Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="scenarioDescription">Description</Label>
              <Textarea
                id="scenarioDescription"
                value={scenarioFormData.description}
                onChange={(e) => setScenarioFormData({ ...scenarioFormData, description: e.target.value })}
                placeholder="Describe the scenario and its expected outcomes..."
                rows={3}
                data-testid="textarea-scenario-description"
              />
            </div>

            <div>
              <Label htmlFor="baselineDate">Baseline Date</Label>
              <Input
                id="baselineDate"
                type="date"
                value={scenarioFormData.baselineDate}
                onChange={(e) => setScenarioFormData({ ...scenarioFormData, baselineDate: e.target.value })}
                data-testid="input-baseline-date"
              />
            </div>

            {/* Overrides Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Scenario Overrides</h3>
                <Button type="button" size="sm" onClick={handleAddOverride} data-testid="button-add-override">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Override
                </Button>
              </div>

              {/* New Override Form */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={newOverride.type} 
                        onValueChange={(value) => setNewOverride({ 
                          ...newOverride, 
                          type: value as ScenarioOverride['type']
                        })}
                      >
                        <SelectTrigger data-testid="select-override-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OVERRIDE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Value</Label>
                      <Input
                        type="number"
                        value={newOverride.value}
                        onChange={(e) => setNewOverride({ ...newOverride, value: Number(e.target.value) })}
                        placeholder="Hours/Percentage"
                        data-testid="input-override-value"
                      />
                    </div>

                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={newOverride.startDate}
                        onChange={(e) => setNewOverride({ ...newOverride, startDate: e.target.value })}
                        data-testid="input-override-start"
                      />
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={newOverride.endDate}
                        onChange={(e) => setNewOverride({ ...newOverride, endDate: e.target.value })}
                        data-testid="input-override-end"
                      />
                    </div>
                  </div>

                  {(newOverride.type === "overtime" || newOverride.type === "extra_shift" || newOverride.type === "temp_capacity") && (
                    <div className="mt-4">
                      <Label>Machine</Label>
                      <Select 
                        value={newOverride.machineId || ""} 
                        onValueChange={(value) => setNewOverride({ ...newOverride, machineId: value })}
                      >
                        <SelectTrigger data-testid="select-override-machine">
                          <SelectValue placeholder="Select machine (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Machines</SelectItem>
                          {machines.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id}>
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="mt-4">
                    <Label>Description</Label>
                    <Input
                      value={newOverride.description}
                      onChange={(e) => setNewOverride({ ...newOverride, description: e.target.value })}
                      placeholder="Describe this override..."
                      data-testid="input-override-description"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Existing Overrides */}
              {scenarioFormData.overrides.length > 0 && (
                <div className="space-y-2">
                  {scenarioFormData.overrides.map((override, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getOverrideTypeIcon(override.type)}
                            <div>
                              <p className="font-medium">
                                {OVERRIDE_TYPES.find(t => t.value === override.type)?.label}: {override.value}
                                {override.type === "overtime" && " hours"}
                                {(override.type === "operator_efficiency" || override.type === "machine_speed") && "%"}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(override.startDate).toLocaleDateString()} - {new Date(override.endDate).toLocaleDateString()}
                                {override.machineId && ` • ${machines.find(m => m.id === override.machineId)?.name}`}
                              </p>
                              {override.description && (
                                <p className="text-sm text-gray-500 italic">{override.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveOverride(index)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-override-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createScenarioMutation.isPending}
                data-testid="button-save-scenario"
              >
                {editingScenario ? "Update Scenario" : "Create Scenario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}