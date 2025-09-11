import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Calendar, Clock, Wrench, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { WorkOrder, Machine, MachineCapability } from "@shared/schema";

interface WorkOrderSelectorProps {
  selectedWorkOrders: string[];
  onSelectionChange: (workOrderIds: string[]) => void;
  onCapacityChange?: (totalHours: number, resourceRequirements: any) => void;
}

interface FilterState {
  search: string;
  priority: string;
  status: string;
  operationType: string;
  dueDateRange: string;
  machineType: string;
}

export function WorkOrderSelector({ 
  selectedWorkOrders, 
  onSelectionChange,
  onCapacityChange 
}: WorkOrderSelectorProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priority: "all",
    status: "all", 
    operationType: "all",
    dueDateRange: "all",
    machineType: "all"
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: machineCapabilities = [] } = useQuery<MachineCapability[]>({
    queryKey: ["/api/machine-capabilities"],
  });

  // Filter and sort work orders based on current filters
  const filteredWorkOrders = useMemo(() => {
    let filtered = workOrders.filter(wo => {
      // Search filter
      if (filters.search && !wo.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
          !wo.partNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
          !wo.partName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Priority filter
      if (filters.priority !== "all" && wo.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status !== "all" && wo.status !== filters.status) {
        return false;
      }

      // Operation type filter
      if (filters.operationType !== "all" && wo.operationType !== filters.operationType) {
        return false;
      }

      // Due date filter
      if (filters.dueDateRange !== "all" && wo.plannedEndDate) {
        const dueDate = new Date(wo.plannedEndDate);
        const now = new Date();
        const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dueDateRange) {
          case "overdue":
            if (daysDiff >= 0) return false;
            break;
          case "this_week":
            if (daysDiff < 0 || daysDiff > 7) return false;
            break;
          case "this_month":
            if (daysDiff < 0 || daysDiff > 30) return false;
            break;
          case "future":
            if (daysDiff <= 30) return false;
            break;
        }
      }

      // Machine capability filter
      if (filters.machineType !== "all") {
        const capableMachines = machineCapabilities.filter(cap => {
          const machineTypes = cap.machineTypes as string[];
          return machineTypes && machineTypes.includes(wo.operationType);
        });
        
        if (filters.machineType === "available") {
          // Filter to work orders that have at least one available machine capable of the operation
          const availableMachineIds = machines
            .filter(m => m.status !== "maintenance" && m.status !== "error")
            .map(m => m.id);
          
          const hasAvailableCapableMachine = capableMachines.some(cap => 
            availableMachineIds.includes(cap.machineId)
          );
          
          if (!hasAvailableCapableMachine) return false;
        } else {
          // Filter by specific machine type
          const machineWithType = machines.find(m => m.type === filters.machineType);
          if (!machineWithType) return false;
          
          const hasCapableMachine = capableMachines.some(cap => 
            cap.machineId === machineWithType.id
          );
          
          if (!hasCapableMachine) return false;
        }
      }

      return true;
    });

    // Sort by priority and due date
    return filtered.sort((a, b) => {
      const priorityOrder = { urgent: 1, high: 2, normal: 3, low: 4 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Secondary sort by due date
      if (a.plannedEndDate && b.plannedEndDate) {
        return new Date(a.plannedEndDate).getTime() - new Date(b.plannedEndDate).getTime();
      }
      
      return 0;
    });
  }, [workOrders, filters]);

  // Calculate total capacity impact
  const capacityImpact = useMemo(() => {
    const selectedWOs = workOrders.filter(wo => selectedWorkOrders.includes(wo.id));
    const totalHours = selectedWOs.reduce((sum, wo) => sum + (wo.estimatedHours || 0), 0);
    const totalQuantity = selectedWOs.reduce((sum, wo) => sum + wo.quantity, 0);
    
    // Group by operation type for resource requirements with machine utilization
    const resourceRequirements = selectedWOs.reduce((acc, wo) => {
      const opType = wo.operationType;
      if (!acc[opType]) {
        acc[opType] = { count: 0, hours: 0, quantity: 0, capableMachines: [], utilizationByMachine: {} };
      }
      acc[opType].count += 1;
      acc[opType].hours += wo.estimatedHours || 0;
      acc[opType].quantity += wo.quantity;
      
      // Find machines capable of this operation
      const capableMachineIds = machineCapabilities
        .filter(cap => {
          const machineTypes = cap.machineTypes as string[];
          return machineTypes && machineTypes.includes(opType);
        })
        .map(cap => cap.machineId);
      
      const capableMachines = machines.filter(m => 
        capableMachineIds.includes(m.id) && 
        m.status !== "maintenance" && 
        m.status !== "error"
      );
      
      acc[opType].capableMachines = capableMachines;
      
      // Calculate utilization per machine (distribute hours equally for now)
      const hoursPerMachine = capableMachines.length > 0 ? (wo.estimatedHours || 0) / capableMachines.length : 0;
      capableMachines.forEach(machine => {
        if (!acc[opType].utilizationByMachine[machine.id]) {
          acc[opType].utilizationByMachine[machine.id] = {
            machineName: machine.name,
            hours: 0,
            workOrders: 0
          };
        }
        acc[opType].utilizationByMachine[machine.id].hours += hoursPerMachine;
        acc[opType].utilizationByMachine[machine.id].workOrders += 1;
      });
      
      return acc;
    }, {} as Record<string, { 
      count: number; 
      hours: number; 
      quantity: number; 
      capableMachines: Machine[];
      utilizationByMachine: Record<string, { machineName: string; hours: number; workOrders: number }>;
    }>);

    return {
      totalHours,
      totalQuantity,
      workOrderCount: selectedWOs.length,
      resourceRequirements
    };
  }, [selectedWorkOrders, workOrders]);

  // Notify parent of capacity changes (separate useEffect to prevent infinite loop)
  useEffect(() => {
    if (onCapacityChange) {
      onCapacityChange(capacityImpact.totalHours, capacityImpact.resourceRequirements);
    }
  }, [capacityImpact.totalHours, capacityImpact.workOrderCount]); // Removed onCapacityChange and resourceRequirements from deps

  const handleWorkOrderToggle = (workOrderId: string) => {
    const newSelection = selectedWorkOrders.includes(workOrderId)
      ? selectedWorkOrders.filter(id => id !== workOrderId)
      : [...selectedWorkOrders, workOrderId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredWorkOrders.map(wo => wo.id);
    onSelectionChange(allFilteredIds);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-800">Normal</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case "setup":
        return <Badge className="bg-purple-100 text-purple-800">Setup</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "on_hold":
        return <Badge className="bg-red-100 text-red-800">On Hold</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getDueDateIndicator = (plannedEndDate: string | null) => {
    if (!plannedEndDate) return null;
    
    const dueDate = new Date(plannedEndDate);
    const now = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else if (daysDiff <= 7) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header with selection summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Work Orders</h3>
          <p className="text-sm text-gray-600">
            {selectedWorkOrders.length} of {filteredWorkOrders.length} work orders selected
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            data-testid="button-select-all-workorders"
          >
            Select All Filtered
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAll}
            data-testid="button-clear-all-workorders"
          >
            Clear All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Capacity Impact Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-selected-count">
                {capacityImpact.workOrderCount}
              </div>
              <div className="text-sm text-gray-600">Work Orders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-hours">
                {capacityImpact.totalHours.toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600" data-testid="text-total-quantity">
                {capacityImpact.totalQuantity}
              </div>
              <div className="text-sm text-gray-600">Total Pieces</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-operation-types">
                {Object.keys(capacityImpact.resourceRequirements).length}
              </div>
              <div className="text-sm text-gray-600">Operation Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter Work Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Order number, part number..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                    data-testid="input-workorder-search"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={filters.priority} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger data-testid="select-priority-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="setup">Setup</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operationType">Operation Type</Label>
                <Select 
                  value={filters.operationType} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, operationType: value }))}
                >
                  <SelectTrigger data-testid="select-operation-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operations</SelectItem>
                    <SelectItem value="TURNING">Turning</SelectItem>
                    <SelectItem value="MILLING">Milling</SelectItem>
                    <SelectItem value="GRINDING">Grinding</SelectItem>
                    <SelectItem value="DRILLING">Drilling</SelectItem>
                    <SelectItem value="TAPPING">Tapping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dueDateRange">Due Date</Label>
                <Select 
                  value={filters.dueDateRange} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, dueDateRange: value }))}
                >
                  <SelectTrigger data-testid="select-duedate-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                    <SelectItem value="future">Future</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="machineType">Machine Capability</Label>
                <Select 
                  value={filters.machineType} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, machineType: value }))}
                >
                  <SelectTrigger data-testid="select-machine-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Machines</SelectItem>
                    <SelectItem value="available">Available Machines Only</SelectItem>
                    {Array.from(new Set(machines.map(m => m.type))).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Available Work Orders
            <span className="text-sm text-gray-500 font-normal">
              {filteredWorkOrders.length} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredWorkOrders.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No work orders match the current filters
              </div>
            ) : (
              <div className="divide-y">
                {filteredWorkOrders.map((workOrder, index) => (
                  <div 
                    key={workOrder.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      selectedWorkOrders.includes(workOrder.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedWorkOrders.includes(workOrder.id)}
                        onCheckedChange={() => handleWorkOrderToggle(workOrder.id)}
                        className="mt-1"
                        data-testid={`checkbox-workorder-${index}`}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900" data-testid={`text-workorder-number-${index}`}>
                                {workOrder.orderNumber}
                              </h4>
                              {getDueDateIndicator(workOrder.plannedEndDate?.toString() || null)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2" data-testid={`text-part-info-${index}`}>
                              {workOrder.partNumber} - {workOrder.partName}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1">
                            {getPriorityBadge(workOrder.priority)}
                            {getStatusBadge(workOrder.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Package className="h-3 w-3" />
                            <span data-testid={`text-quantity-${index}`}>Qty: {workOrder.quantity}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span data-testid={`text-estimated-hours-${index}`}>
                              Est: {workOrder.estimatedHours?.toFixed(1) || "TBD"}h
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Wrench className="h-3 w-3" />
                            <span data-testid={`text-operation-type-${index}`}>{workOrder.operationType}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span data-testid={`text-due-date-${index}`}>
                              Due: {workOrder.plannedEndDate 
                                ? new Date(workOrder.plannedEndDate).toLocaleDateString() 
                                : "TBD"
                              }
                            </span>
                          </div>
                        </div>

                        {workOrder.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">
                            {workOrder.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Resource Requirements Summary */}
      {Object.keys(capacityImpact.resourceRequirements).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resource Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(capacityImpact.resourceRequirements).map(([opType, requirements]) => (
                <div key={opType} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm mb-2">{opType}</div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Work Orders: {requirements.count}</div>
                    <div>Total Hours: {requirements.hours.toFixed(1)}h</div>
                    <div>Total Pieces: {requirements.quantity}</div>
                    <div>Capable Machines: {requirements.capableMachines.length}</div>
                    
                    {requirements.capableMachines.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="font-medium mb-1">Machine Utilization:</div>
                        {Object.entries(requirements.utilizationByMachine).map(([machineId, util]) => (
                          <div key={machineId} className="flex justify-between text-xs">
                            <span>{util.machineName}:</span>
                            <span>{util.hours.toFixed(1)}h ({util.workOrders} WO)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {requirements.capableMachines.length === 0 && (
                      <div className="text-red-600 text-xs font-medium">⚠ No capable machines available</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}