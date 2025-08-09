import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Download, Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WorkOrder } from "@shared/schema";
import { WorkOrderForm } from "@/components/work-orders/WorkOrderForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { SideNavigation } from "@/components/layout/SideNavigation";

export default function WorkOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [operationFilter, setOperationFilter] = useState("all");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: workOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
  });

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch = wo.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    const matchesOperation = operationFilter === "all" || wo.operationType === operationFilter;
    
    return matchesSearch && matchesStatus && matchesOperation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-green-100 text-green-800";
      case "setup": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "on_hold": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "normal": return "bg-blue-500 text-white";
      case "low": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const operationTypes = ["TURNING", "MILLING", "GRINDING", "DRILLING", "TAPPING", "WIRE_CUT"];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader isConnected={true} />
      
      <div className="flex">
        <SideNavigation />
        
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Work Order Management</h1>
            <p className="text-gray-600">Manage production work orders and track progress</p>
          </div>

          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by part number, name, or work order..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="setup">Setup</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={operationFilter} onValueChange={setOperationFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by operation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operations</SelectItem>
                    {operationTypes.map(op => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      New Work Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Work Order</DialogTitle>
                    </DialogHeader>
                    <WorkOrderForm 
                      onSuccess={() => setShowCreateDialog(false)}
                      machines={machines}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Work Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredWorkOrders.map((workOrder) => (
                <Card key={workOrder.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-semibold text-blue-600">
                          {workOrder.orderNumber}
                        </CardTitle>
                        <p className="text-sm text-gray-600">{workOrder.partNumber}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(workOrder.priority)}>
                          {workOrder.priority}
                        </Badge>
                        <Badge className={getStatusColor(workOrder.status)}>
                          {workOrder.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900">{workOrder.partName}</p>
                        <p className="text-sm text-gray-600">
                          Operation: {workOrder.operationType}
                        </p>
                        {workOrder.material && (
                          <p className="text-sm text-gray-600">
                            Material: {workOrder.material} {workOrder.materialGrade}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">
                          {workOrder.completedQuantity || 0} / {workOrder.quantity}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((workOrder.completedQuantity || 0) / workOrder.quantity) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>

                      {workOrder.plannedStartDate && (
                        <div className="text-xs text-gray-500">
                          Due: {new Date(workOrder.plannedEndDate || '').toLocaleDateString()}
                        </div>
                      )}

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredWorkOrders.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No work orders found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or create a new work order.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}