import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { Calendar, Clock, TrendingUp, Filter, Download, Settings, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Machine, WorkOrder, CapacityPlanning, CapacityBucket } from "@shared/schema";

// Using CapacityBucket type from @shared/schema
interface CapacityBucketWithMachineName extends CapacityBucket {
  machineName: string;
  status: "underutilized" | "optimal" | "overloaded" | "maintenance";
}

interface CapacityMetrics {
  totalCapacity: number;
  totalReserved: number;
  averageUtilization: number;
  overloadedMachines: number;
  underutilizedMachines: number;
  efficiencyRating: number;
  criticalConstraints: number;
}

type ViewGranularity = "shift" | "daily" | "weekly";
type ViewMode = "chart" | "table" | "heatmap";

export function CapacityBucketsView() {
  const [selectedMachine, setSelectedMachine] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("week");
  const [viewGranularity, setViewGranularity] = useState<ViewGranularity>("daily");
  const [viewMode, setViewMode] = useState<ViewMode>("chart");

  // Fetch data
  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  // Fetch capacity buckets from server with filters
  const { data: capacityBucketsResponse, isLoading: bucketsLoading } = useQuery({
    queryKey: ["/api/capacity/buckets", selectedMachine, selectedDateRange, viewGranularity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMachine !== "all") {
        params.append("machineId", selectedMachine);
      }
      const startDate = new Date();
      const endDate = new Date(Date.now() + (selectedDateRange === "week" ? 7 : selectedDateRange === "month" ? 30 : 14) * 24 * 60 * 60 * 1000);
      params.append("startDate", startDate.toISOString());
      params.append("endDate", endDate.toISOString());
      params.append("granularity", viewGranularity);
      
      const response = await fetch(`/api/capacity/buckets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch capacity buckets");
      return response.json();
    },
  });

  const isLoading = machinesLoading || bucketsLoading;

  // Process capacity buckets data from server
  const capacityBuckets = useMemo((): CapacityBucketWithMachineName[] => {
    if (!capacityBucketsResponse?.capacityAnalysis) return [];

    const buckets: CapacityBucketWithMachineName[] = [];
    
    for (const [machineId, analysis] of Object.entries(capacityBucketsResponse.capacityAnalysis || {})) {
      const machine = machines.find(m => m.id === machineId);
      const machineName = machine?.name || machineId;
      
      for (const bucket of (analysis as any).buckets || []) {
        // Convert minutes to hours for display compatibility
        const availableHours = bucket.availableMinutes / 60;
        const plannedHours = bucket.plannedMinutes / 60;
        const utilization = bucket.utilization * 100; // Convert to percentage
        
        buckets.push({
          ...bucket,
          machineName,
          availableHours,
          reservedHours: plannedHours,
          utilization,
          status: bucket.isOverloaded ? "overloaded" : 
                 utilization > 80 ? "optimal" : 
                 machine?.status === "maintenance" ? "maintenance" : "underutilized",
          workOrders: [], // TODO: Add work order info from server response
        });
      }
    }

    return buckets;
  }, [capacityBucketsResponse, machines]);

  // Calculate capacity metrics from server response
  const capacityMetrics = useMemo((): CapacityMetrics => {
    if (!capacityBucketsResponse) {
      return {
        totalCapacity: 0,
        totalReserved: 0,
        averageUtilization: 0,
        overloadedMachines: 0,
        underutilizedMachines: 0,
        efficiencyRating: 0,
        criticalConstraints: 0,
      };
    }

    const summary = capacityBucketsResponse.summary || {};
    const totalCapacity = capacityBuckets.reduce((sum, bucket) => sum + bucket.availableHours, 0);
    const totalReserved = capacityBuckets.reduce((sum, bucket) => sum + bucket.reservedHours, 0);
    
    const overloadedMachines = new Set(
      capacityBuckets.filter(bucket => bucket.status === "overloaded").map(b => b.machineId)
    ).size;
    
    const underutilizedMachines = new Set(
      capacityBuckets.filter(bucket => bucket.status === "underutilized").map(b => b.machineId)
    ).size;

    // Use server-calculated metrics when available
    const averageUtilization = summary.averageUtilization || (totalCapacity > 0 ? (totalReserved / totalCapacity) * 100 : 0);
    const efficiencyRating = summary.efficiencyRating || 85; // Default efficiency

    return {
      totalCapacity,
      totalReserved,
      averageUtilization,
      overloadedMachines,
      underutilizedMachines, 
      efficiencyRating,
      criticalConstraints: summary.criticalConstraints || 0,
    };
  }, [capacityBucketsResponse, capacityBuckets]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const groupedData: { [key: string]: any } = {};

    capacityBuckets.forEach((bucket) => {
      const date = new Date(bucket.date).toISOString().split('T')[0];
      const key = viewGranularity === "shift" && bucket.hour !== null
        ? `${date}-${Math.floor(bucket.hour / 8)}` // Group hours into shifts
        : date;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          date: date,
          availableHours: 0,
          reservedHours: 0,
          machines: [],
        };
      }

      groupedData[key].availableHours += bucket.availableHours || (bucket.availableMinutes / 60) || 0;
      groupedData[key].reservedHours += bucket.reservedHours || (bucket.plannedMinutes / 60) || 0;
      groupedData[key].machines.push(bucket);
    });

    return Object.values(groupedData).map((item: any) => ({
      ...item,
      utilization: item.availableHours > 0 ? (item.reservedHours / item.availableHours) * 100 : 0,
      overallCapacity: item.availableHours,
      unusedCapacity: Math.max(0, item.availableHours - item.reservedHours),
    }));
  }, [capacityBuckets, viewGranularity]);

  // Heatmap data for machine utilization
  const heatmapData = useMemo(() => {
    const machineUtilization: { [machineId: string]: { [date: string]: number } } = {};
    
    capacityBuckets.forEach((bucket) => {
      if (!machineUtilization[bucket.machineId]) {
        machineUtilization[bucket.machineId] = {};
      }
      const date = new Date(bucket.date).toISOString().split('T')[0];
      machineUtilization[bucket.machineId][date] = bucket.utilization;
    });

    return machineUtilization;
  }, [capacityBuckets]);

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return "bg-red-500";
    if (utilization > 90) return "bg-orange-500";
    if (utilization > 75) return "bg-yellow-500";
    if (utilization > 50) return "bg-blue-500";
    return "bg-green-500";
  };

  const getUtilizationFromBucket = (bucket: CapacityBucketWithMachineName) => {
    return bucket.utilization || (bucket.plannedMinutes && bucket.availableMinutes ? (bucket.plannedMinutes / bucket.availableMinutes) * 100 : 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overloaded": return "text-red-600";
      case "optimal": return "text-green-600";
      case "underutilized": return "text-blue-600";
      case "maintenance": return "text-orange-600";
      default: return "text-gray-600";
    }
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
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Capacity Buckets View</h2>
          <p className="text-gray-600">Visualize machine capacity utilization across time periods</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" data-testid="button-export-capacity">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" data-testid="button-capacity-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Capacity Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Capacity</p>
                <p className="text-2xl font-bold" data-testid="text-total-capacity">
                  {Math.round(capacityMetrics.totalCapacity)}h
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {Math.round(capacityMetrics.totalReserved)}h reserved
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold" data-testid="text-avg-utilization">
                  {Math.round(capacityMetrics.averageUtilization)}%
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress 
              value={capacityMetrics.averageUtilization} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overloaded</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-overloaded-machines">
                  {capacityMetrics.overloadedMachines}
                </p>
              </div>
              <div className="bg-red-100 p-2 rounded">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {capacityMetrics.underutilizedMachines} underutilized
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold" data-testid="text-efficiency-rating">
                  {Math.round(capacityMetrics.efficiencyRating)}%
                </p>
              </div>
              <div className="bg-purple-100 p-2 rounded">
                <BarChart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <Badge className={
                capacityMetrics.efficiencyRating >= 85 ? "bg-green-100 text-green-800" :
                capacityMetrics.efficiencyRating >= 70 ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }>
                {capacityMetrics.efficiencyRating >= 85 ? "Excellent" :
                 capacityMetrics.efficiencyRating >= 70 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                <SelectTrigger className="w-48" data-testid="select-machine-filter">
                  <SelectValue />
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

            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-32" data-testid="select-date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">1 Week</SelectItem>
                <SelectItem value="2weeks">2 Weeks</SelectItem>
                <SelectItem value="month">1 Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={viewGranularity} onValueChange={(value) => setViewGranularity(value as ViewGranularity)}>
              <SelectTrigger className="w-32" data-testid="select-granularity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shift">By Shift</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded">
              <Button
                variant={viewMode === "chart" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
                data-testid="button-view-chart"
              >
                Chart
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                data-testid="button-view-table"
              >
                Table
              </Button>
              <Button
                variant={viewMode === "heatmap" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("heatmap")}
                data-testid="button-view-heatmap"
              >
                Heatmap
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Visualization */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        {/* Chart View */}
        <TabsContent value="chart" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capacity Utilization Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Capacity Utilization Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (viewGranularity === "shift") {
                          const [date, shift] = value.split('-');
                          return `${date.split('-').slice(1).join('/')} ${shift?.charAt(0).toUpperCase()}`;
                        }
                        return new Date(value).toLocaleDateString();
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `Period: ${value}`}
                      formatter={(value: any, name: string) => [
                        `${Math.round(value)}${name === 'utilization' ? '%' : 'h'}`, 
                        name === 'utilization' ? 'Utilization' : 
                        name === 'reservedHours' ? 'Reserved' : 'Available'
                      ]}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="availableHours"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#DBEAFE"
                      name="Available Hours"
                    />
                    <Area
                      type="monotone"
                      dataKey="reservedHours"
                      stackId="1"
                      stroke="#10B981"
                      fill="#D1FAE5"
                      name="Reserved Hours"
                    />
                    <Line
                      type="monotone"
                      dataKey="utilization"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      name="Utilization %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Machine Utilization Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Machine Utilization Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${Math.round(value)}${name === 'utilization' ? '%' : 'h'}`, 
                        name === 'utilization' ? 'Utilization' : 
                        name === 'reservedHours' ? 'Used' : 'Unused'
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="reservedHours"
                      fill="#10B981"
                      name="Used Capacity"
                    />
                    <Bar
                      dataKey="unusedCapacity"
                      fill="#E5E7EB"
                      name="Unused Capacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Date</TableHead>
                    {viewGranularity === "shift" && <TableHead>Shift</TableHead>}
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Work Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capacityBuckets.slice(0, 20).map((bucket, idx) => (
                    <TableRow key={`${bucket.machineId}-${bucket.date}-${bucket.shift || ''}`} data-testid={`row-capacity-${idx}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{bucket.machineName}</p>
                          <p className="text-sm text-gray-600">{bucket.machineId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(bucket.date).toLocaleDateString()}</TableCell>
                      {viewGranularity === "shift" && (
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {bucket.shift}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>{bucket.availableHours}h</TableCell>
                      <TableCell>
                        <span className="font-medium">{bucket.reservedHours.toFixed(1)}h</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getUtilizationColor(bucket.utilization)}`}
                              style={{ width: `${Math.min(100, bucket.utilization)}%` }}
                            />
                          </div>
                          <span className="text-sm">{Math.round(bucket.utilization)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(bucket.status)} variant="outline">
                          {bucket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {bucket.workOrders.slice(0, 2).map((wo, woIdx) => (
                            <div key={woIdx}>{wo}</div>
                          ))}
                          {bucket.workOrders.length > 2 && (
                            <div className="text-gray-500">+{bucket.workOrders.length - 2} more</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {capacityBuckets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No capacity data available for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap View */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Machine Utilization Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 gap-4">
                  {machines.filter(machine => selectedMachine === "all" || machine.id === selectedMachine)
                    .map((machine) => (
                    <div key={machine.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{machine.name}</h3>
                        <Badge variant="outline">{machine.type}</Badge>
                      </div>
                      <div className="flex space-x-1">
                        {Array.from({length: parseInt(selectedDateRange === "week" ? "7" : selectedDateRange === "month" ? "30" : "14")}, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() + i);
                          const dateStr = date.toISOString().split('T')[0];
                          const utilization = heatmapData[machine.id]?.[dateStr] || 0;
                          
                          return (
                            <div
                              key={dateStr}
                              className={`w-8 h-8 rounded ${getUtilizationColor(utilization)} flex items-center justify-center text-xs font-medium text-white`}
                              title={`${dateStr}: ${Math.round(utilization)}% utilization`}
                              data-testid={`heatmap-cell-${machine.id}-${dateStr}`}
                            >
                              {Math.round(utilization)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Utilization levels (%)
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded" />
                      <span className="text-sm">0-50%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      <span className="text-sm">51-75%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded" />
                      <span className="text-sm">76-90%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-500 rounded" />
                      <span className="text-sm">91-100%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded" />
                      <span className="text-sm">100%+</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}