import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ZoomIn, 
  ZoomOut,
  Play,
  RotateCcw,
  Filter,
  Settings,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ScheduleSlot, Machine, SchedulingConflict } from "@shared/schema";
import { GanttChart } from "@/components/gantt/GanttChart";
import { ConflictPanel } from "@/components/gantt/ConflictPanel";
import { apiRequest } from "@/lib/queryClient";

type ViewMode = "day" | "week" | "month";

interface GanttFilters {
  machines: string[];
  statuses: string[];
  priorities: string[];
  tags: string[];
}

export function GanttPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showConflicts, setShowConflicts] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [filters, setFilters] = useState<GanttFilters>({
    machines: [],
    statuses: [],
    priorities: [],
    tags: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate date range based on current date and view mode
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case "day":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6); // End of week (Saturday)
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }, [currentDate, viewMode]);

  const { start: startDate, end: endDate } = getDateRange();

  // Fetch machines for filtering
  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  // Fetch schedule slots for the current date range
  const { data: scheduleSlots = [], isLoading: slotsLoading, refetch: refetchSlots } = useQuery<ScheduleSlot[]>({
    queryKey: ["/api/schedule", startDate.toISOString(), endDate.toISOString(), filters.machines],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });
      
      // Add machine filters
      filters.machines.forEach((machineId: string) => {
        params.append('machineId', machineId);
      });

      const response = await fetch(`/api/schedule?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      return response.json();
    },
  });

  // Fetch conflicts for current schedule
  const { data: conflicts = [], refetch: refetchConflicts } = useQuery<SchedulingConflict[]>({
    queryKey: ["/api/schedule/conflicts", "gantt-view"],
    queryFn: async () => {
      if (scheduleSlots.length === 0) return [];
      const response = await apiRequest("POST", "/api/schedule/validate", { slots: scheduleSlots });
      return response.json();
    },
    enabled: scheduleSlots.length > 0 && showConflicts,
  });

  // Update schedule slot mutation
  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<ScheduleSlot> }) => {
      const response = await apiRequest("PATCH", `/api/schedule/slots/${id}`, updates);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.conflicts && data.conflicts.length > 0) {
        toast({
          title: "Schedule Updated",
          description: `${data.conflicts.length} conflicts detected`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Schedule Updated",
          description: "Changes saved successfully"
        });
      }
      
      // Refetch data
      refetchSlots();
      refetchConflicts();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update schedule",
        variant: "destructive"
      });
    }
  });

  // Bulk update mutation for drag-and-drop operations
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: { id: string, updates: Partial<ScheduleSlot> }[]) => {
      const response = await apiRequest("POST", "/api/schedule/bulk-update", { updates });
      return response.json();
    },
    onSuccess: (data) => {
      const { updated, conflicts } = data;
      
      if (conflicts && conflicts.length > 0) {
        toast({
          title: "Schedule Updated",
          description: `${updated.length} tasks updated, ${conflicts.length} conflicts detected`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Schedule Updated", 
          description: `${updated.length} tasks updated successfully`
        });
      }
      
      // Refetch data
      refetchSlots();
      refetchConflicts();
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update schedule",
        variant: "destructive"
      });
    }
  });

  // Navigation functions
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle machine filter changes
  const toggleMachineFilter = (machineId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      machines: checked 
        ? [...prev.machines, machineId]
        : prev.machines.filter(id => id !== machineId)
    }));
  };

  // Format date range for display
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: "short", 
      day: "numeric",
      year: currentDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
    };
    
    switch (viewMode) {
      case "day":
        return currentDate.toLocaleDateString("en-US", { 
          ...options, 
          weekday: "long" 
        });
      case "week":
        return `${startDate.toLocaleDateString("en-US", options)} - ${endDate.toLocaleDateString("en-US", options)}`;
      case "month":
        return currentDate.toLocaleDateString("en-US", { 
          month: "long", 
          year: "numeric" 
        });
    }
  };

  // Filter schedule slots based on current filters
  const filteredSlots = scheduleSlots.filter(slot => {
    // Status filter
    if (filters.statuses.length > 0 && slot.status && !filters.statuses.includes(slot.status)) {
      return false;
    }
    
    // Priority filter  
    if (filters.priorities.length > 0 && slot.priority !== null) {
      const priorityRange = slot.priority <= 50 ? "high" : slot.priority <= 100 ? "medium" : "low";
      if (!filters.priorities.includes(priorityRange)) {
        return false;
      }
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      const slotTags = (slot.tags as string[]) || [];
      const hasMatchingTag = filters.tags.some(tag => slotTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <ResponsiveLayout isConnected={true}>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex-none border-b bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Gantt Scheduler</h1>
              <p className="text-gray-600">Visual production scheduling and planning</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={goToToday}
                data-testid="button-today"
              >
                <Play className="h-4 w-4 mr-2" />
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm" 
                onClick={() => setShowConflicts(!showConflicts)}
                data-testid="button-toggle-conflicts"
              >
                {showConflicts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation and Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Date Navigation */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateDate("prev")}
                  data-testid="button-prev-period"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="min-w-48 text-center">
                  <span className="font-medium" data-testid="text-current-period">
                    {formatDateRange()}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateDate("next")}
                  data-testid="button-next-period"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* View Mode Selector */}
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger className="w-32" data-testid="select-view-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats and Filters */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {filteredSlots.length} tasks
                {conflicts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {conflicts.length} conflicts
                  </Badge>
                )}
              </div>
              
              <Button variant="outline" size="sm" data-testid="button-filters">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          {/* Machine Filter Sidebar */}
          <Card className="flex-none w-64 m-4 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Machines</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-2">
                {machinesLoading ? (
                  <div className="text-sm text-gray-500">Loading machines...</div>
                ) : (
                  machines.map((machine) => (
                    <div key={machine.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`machine-${machine.id}`}
                        checked={filters.machines.length === 0 || filters.machines.includes(machine.id)}
                        onCheckedChange={(checked) => toggleMachineFilter(machine.id, !!checked)}
                        data-testid={`checkbox-machine-${machine.id}`}
                      />
                      <label 
                        htmlFor={`machine-${machine.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {machine.name}
                      </label>
                      <div className={`w-2 h-2 rounded-full ${
                        machine.status === "running" ? "bg-green-500" :
                        machine.status === "idle" ? "bg-yellow-500" :
                        "bg-red-500"
                      }`} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gantt Chart Area */}
          <div className="flex-1 flex flex-col min-w-0 p-4">
            {slotsLoading ? (
              <Card className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading schedule...</p>
                </div>
              </Card>
            ) : (
              <GanttChart
                scheduleSlots={filteredSlots}
                machines={machines.filter(m => 
                  filters.machines.length === 0 || filters.machines.includes(m.id)
                )}
                conflicts={conflicts}
                viewMode={viewMode}
                currentDate={currentDate}
                onSlotUpdate={(id, updates) => updateSlotMutation.mutate({ id, updates })}
                onBulkUpdate={(updates) => bulkUpdateMutation.mutate(updates)}
                selectedSlots={selectedSlots}
                onSelectionChange={setSelectedSlots}
                isUpdating={updateSlotMutation.isPending || bulkUpdateMutation.isPending}
              />
            )}
          </div>
        </div>

        {/* Conflict Panel */}
        {showConflicts && conflicts.length > 0 && (
          <ConflictPanel 
            conflicts={conflicts}
            onResolveConflict={(conflictId: string, resolution: string) => {
              // Handle conflict resolution
              console.log("Resolving conflict:", conflictId, resolution);
            }}
          />
        )}
      </div>
    </ResponsiveLayout>
  );
}