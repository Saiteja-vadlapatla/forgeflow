import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Line, Bar, Cell,
  ResponsiveContainer,
  LineChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Clock, Target, Gauge, BarChart3, Activity, Wrench,
  Calendar, Filter, RefreshCw, Download
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import type { AnalyticsKPIs, OEEBreakdown, AdherenceMetrics, UtilizationMetrics, QualitySummary, MachineOEESnapshot } from "@shared/schema";

interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  machineId?: string;
  workOrderId?: string;
  granularity: 'hour' | 'shift' | 'day' | 'week' | 'month';
}

function KPICard({ title, value, unit, change, trend, icon: Icon, description }: {
  title: string;
  value: number;
  unit?: string;
  change?: number;
  trend?: "up" | "down" | "stable";
  icon: any;
  description?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Activity;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500";

  return (
    <Card data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value.toFixed(1)}{unit}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {change > 0 ? "+" : ""}{change.toFixed(1)}% from last period
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function OEEBreakdownChart({ data }: { data: OEEBreakdown[] }) {
  const chartData = data.map(item => ({
    machine: item.machineName,
    availability: item.availability,
    performance: item.performance,
    quality: item.quality,
    oee: item.oeeScore
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="machine" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="availability" stackId="a" fill="#8884d8" name="Availability %" />
        <Bar dataKey="performance" stackId="b" fill="#82ca9d" name="Performance %" />
        <Bar dataKey="quality" stackId="c" fill="#ffc658" name="Quality %" />
        <Line type="monotone" dataKey="oee" stroke="#ff7300" strokeWidth={3} name="OEE %" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendChart({ data, title, yAxisLabel }: { data: any[], title: string, yAxisLabel: string }) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(value) => format(new Date(value), "MMM dd")}
          />
          <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            labelFormatter={(value) => format(new Date(value), "MMM dd, yyyy")}
            formatter={(value: any) => [`${value.toFixed(1)}%`, yAxisLabel]}
          />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ParetoChart({ data, title }: { data: any[], title: string }) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
          <Tooltip />
          <Bar yAxisId="left" dataKey="value" fill="#8884d8" />
          <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#ff7300" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Analytics() {
  const queryClient = useQueryClient();
  const { data: wsData, isConnected: wsConnected, error: wsError } = useWebSocket();
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: startOfDay(subDays(new Date(), 7)),
      to: endOfDay(new Date())
    },
    granularity: 'day'
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Build query parameters (moved before useEffect)
  const queryParams = new URLSearchParams({
    from: filters.dateRange.from.toISOString(),
    to: filters.dateRange.to.toISOString(),
    granularity: filters.granularity,
    ...(filters.machineId && { machineId: filters.machineId }),
    ...(filters.workOrderId && { workOrderId: filters.workOrderId })
  });

  // Handle WebSocket real-time data updates
  useEffect(() => {
    if (wsData) {
      // Update real-time snapshots immediately when WebSocket data arrives
      queryClient.setQueryData(['/api/analytics/realtime-snapshots'], wsData.machines || []);
      
      // If KPIs are available in WebSocket data, update the cache
      if (wsData.kpis) {
        const currentParams = queryParams.toString();
        queryClient.setQueryData(['/api/analytics/kpis', currentParams], wsData.kpis);
      }
      
      // Invalidate and refetch analytics data to get latest results
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
    }
  }, [wsData, queryClient, queryParams]);

  // Fetch analytics data (reduced polling since WebSocket provides real-time updates)
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useQuery<AnalyticsKPIs>({
    queryKey: ['/api/analytics/kpis', queryParams.toString()],
    refetchInterval: wsConnected ? false : (autoRefresh ? 60000 : false) // Only poll if WebSocket disconnected
  });

  const { data: oeeData, isLoading: oeeLoading } = useQuery<OEEBreakdown[]>({
    queryKey: ['/api/analytics/oee', queryParams.toString()],
    refetchInterval: wsConnected ? false : (autoRefresh ? 60000 : false)
  });

  const { data: adherenceData, isLoading: adherenceLoading } = useQuery<AdherenceMetrics[]>({
    queryKey: ['/api/analytics/adherence', queryParams.toString()],
    refetchInterval: wsConnected ? false : (autoRefresh ? 60000 : false)
  });

  const { data: utilizationData, isLoading: utilizationLoading } = useQuery<UtilizationMetrics[]>({
    queryKey: ['/api/analytics/utilization', queryParams.toString()],
    refetchInterval: wsConnected ? false : (autoRefresh ? 60000 : false)
  });

  const { data: qualityData, isLoading: qualityLoading } = useQuery<QualitySummary>({
    queryKey: ['/api/analytics/quality', queryParams.toString()],
    refetchInterval: wsConnected ? false : (autoRefresh ? 60000 : false)
  });

  const { data: realtimeSnapshots, isLoading: snapshotsLoading } = useQuery<MachineOEESnapshot[]>({
    queryKey: ['/api/analytics/realtime-snapshots'],
    refetchInterval: wsConnected ? false : 5000 // WebSocket handles real-time updates
  });

  // Fetch machines for filtering
  const { data: machines } = useQuery<any[]>({
    queryKey: ['/api/machines']
  });

  // Fetch work orders for filtering
  const { data: workOrders } = useQuery<any[]>({
    queryKey: ['/api/work-orders']
  });

  const handleRefresh = () => {
    refetchKpis();
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log('Export analytics data');
  };

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const averageOEE = oeeData ? oeeData.reduce((sum, item) => sum + item.oeeScore, 0) / (oeeData.length || 1) : 0;
  const averageAdherence = adherenceData ? adherenceData.reduce((sum, item) => sum + item.adherenceScore, 0) / (adherenceData.length || 1) : 0;
  const averageUtilization = utilizationData ? utilizationData.reduce((sum, item) => sum + item.utilizationRate, 0) / (utilizationData.length || 1) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="flex items-center space-x-2">
            <p className="text-muted-foreground">Manufacturing performance metrics and insights</p>
            {/* WebSocket Connection Status */}
            <Badge 
              variant={wsConnected ? "default" : "destructive"}
              className="text-xs"
              data-testid="status-websocket"
            >
              {wsConnected ? "● Live" : "● Offline"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-testid="button-export-analytics"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">From:</label>
              <DatePicker
                date={filters.dateRange.from}
                onSelect={(date) => date && setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, from: startOfDay(date) }
                }))}
                data-testid="input-date-from"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">To:</label>
              <DatePicker
                date={filters.dateRange.to}
                onSelect={(date) => date && setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, to: endOfDay(date) }
                }))}
                data-testid="input-date-to"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Machine:</label>
              <Select
                value={filters.machineId || "all"}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  machineId: value === "all" ? undefined : value
                }))}
              >
                <SelectTrigger className="w-40" data-testid="select-machine-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Machines</SelectItem>
                  {machines?.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Granularity:</label>
              <Select
                value={filters.granularity}
                onValueChange={(value: any) => setFilters(prev => ({
                  ...prev,
                  granularity: value
                }))}
              >
                <SelectTrigger className="w-32" data-testid="select-granularity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">Hour</SelectItem>
                  <SelectItem value="shift">Shift</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall OEE"
          value={kpis?.oeeOverall || averageOEE}
          unit="%"
          change={2.3}
          trend="up"
          icon={Gauge}
          description="Overall Equipment Effectiveness"
        />
        <KPICard
          title="Schedule Adherence"
          value={kpis?.scheduleAdherence || averageAdherence}
          unit="%"
          change={-1.2}
          trend="down"
          icon={Calendar}
          description="On-time production performance"
        />
        <KPICard
          title="Utilization Rate"
          value={kpis?.utilizationRate || averageUtilization}
          unit="%"
          change={0.8}
          trend="up"
          icon={Activity}
          description="Machine utilization efficiency"
        />
        <KPICard
          title="First Pass Yield"
          value={kpis?.firstPassYield || qualityData?.firstPassYield || 0}
          unit="%"
          change={1.5}
          trend="up"
          icon={CheckCircle2}
          description="Quality performance metric"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Availability"
          value={kpis?.availability || 0}
          unit="%"
          icon={Clock}
          description="Machine availability time"
        />
        <KPICard
          title="Performance"
          value={kpis?.performance || 0}
          unit="%"
          icon={TrendingUp}
          description="Speed/cycle time performance"
        />
        <KPICard
          title="Quality"
          value={kpis?.quality || 0}
          unit="%"
          icon={Target}
          description="Quality rate performance"
        />
        <KPICard
          title="MTBF"
          value={kpis?.mtbf || 0}
          unit="h"
          icon={Wrench}
          description="Mean Time Between Failures"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="oee" data-testid="tab-oee">OEE Analysis</TabsTrigger>
          <TabsTrigger value="adherence" data-testid="tab-adherence">Schedule Adherence</TabsTrigger>
          <TabsTrigger value="utilization" data-testid="tab-utilization">Utilization</TabsTrigger>
          <TabsTrigger value="quality" data-testid="tab-quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>OEE Trends</CardTitle>
                <CardDescription>Overall Equipment Effectiveness over time</CardDescription>
              </CardHeader>
              <CardContent>
                {kpis?.trendData?.oee && (
                  <TrendChart
                    data={kpis.trendData.oee}
                    title=""
                    yAxisLabel="OEE %"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Downtime Reasons</CardTitle>
                <CardDescription>Pareto analysis of downtime causes</CardDescription>
              </CardHeader>
              <CardContent>
                {kpis?.topDowntimeReasons && (
                  <ParetoChart
                    data={kpis.topDowntimeReasons}
                    title=""
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Real-time Machine Status */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Machine Status</CardTitle>
              <CardDescription>Live OEE snapshots for all machines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {realtimeSnapshots?.map((snapshot) => (
                  <Card key={snapshot.machineId} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{snapshot.machineName}</h4>
                      <Badge 
                        variant={snapshot.status === 'running' ? 'default' : 'secondary'}
                        data-testid={`machine-status-${snapshot.machineId}`}
                      >
                        {snapshot.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">OEE:</span>
                        <span className="text-sm font-medium">{snapshot.currentOEE.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Availability:</span>
                        <span className="text-sm font-medium">{snapshot.availability.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Performance:</span>
                        <span className="text-sm font-medium">{snapshot.performance.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Quality:</span>
                        <span className="text-sm font-medium">{snapshot.quality.toFixed(1)}%</span>
                      </div>
                      {snapshot.partNumber && (
                        <div className="flex justify-between">
                          <span className="text-sm">Part:</span>
                          <span className="text-sm font-medium">{snapshot.partNumber}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oee" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OEE Breakdown by Machine</CardTitle>
              <CardDescription>Availability, Performance, and Quality components</CardDescription>
            </CardHeader>
            <CardContent>
              {oeeData && <OEEBreakdownChart data={oeeData} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adherence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Adherence Metrics</CardTitle>
              <CardDescription>On-time performance and delays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adherenceData?.map((item) => (
                  <div key={item.workOrderId} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{item.partNumber}</h4>
                      <Badge 
                        variant={item.isOnTime ? 'default' : item.isLate ? 'destructive' : 'secondary'}
                        data-testid={`adherence-status-${item.workOrderId}`}
                      >
                        {item.isOnTime ? 'On Time' : item.isLate ? 'Late' : 'Early'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Adherence Score:</span>
                        <span className="ml-2 font-medium">{item.adherenceScore.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delay:</span>
                        <span className="ml-2 font-medium">{item.delayMinutes} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Machine Utilization Analysis</CardTitle>
              <CardDescription>Productive time, setup, downtime, and idle analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {utilizationData?.map((item) => (
                  <div key={item.machineId} className="border rounded p-4">
                    <h4 className="font-medium mb-3">{item.machineName}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Utilization:</span>
                        <span className="ml-2 font-medium">{item.utilizationRate.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">MTBF:</span>
                        <span className="ml-2 font-medium">{item.mtbf.toFixed(1)}h</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">MTTR:</span>
                        <span className="ml-2 font-medium">{item.mttr.toFixed(1)}h</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Efficiency:</span>
                        <span className="ml-2 font-medium">{item.efficiency.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Performance</CardTitle>
              <CardDescription>First pass yield, scrap rate, and defect analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {qualityData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold">{qualityData.totalInspected}</div>
                      <div className="text-sm text-muted-foreground">Total Inspected</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-green-500">{qualityData.totalPassed}</div>
                      <div className="text-sm text-muted-foreground">Passed</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-red-500">{qualityData.totalFailed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-yellow-500">{qualityData.totalRework}</div>
                      <div className="text-sm text-muted-foreground">Rework</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Quality Trends</h4>
                      <TrendChart
                        data={qualityData.qualityTrend}
                        title=""
                        yAxisLabel="First Pass Yield %"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Top Defect Types</h4>
                      <ParetoChart
                        data={qualityData.topDefectTypes}
                        title=""
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}