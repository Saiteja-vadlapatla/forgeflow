import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Wrench, Package, AlertTriangle, Plus, Edit2, Trash2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { OperatorSkill, ToolResource, MaterialAvailability, ResourceReservation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const SKILL_LEVELS = {
  1: "Novice",
  2: "Basic", 
  3: "Proficient",
  4: "Advanced",
  5: "Expert"
};

const AVAILABILITY_STATUS = {
  "available": "Available",
  "reserved": "Reserved", 
  "shortage": "Shortage",
  "maintenance": "Maintenance"
};

interface ReservationFormData {
  resourceType: "operator" | "tool" | "material";
  resourceId: string;
  workOrderId: string;
  startDate: string;
  endDate: string;
  quantity: number;
  priority: "low" | "normal" | "high" | "urgent";
  notes: string;
}

export function ResourceConstraintsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("operators");
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [reservationFormData, setReservationFormData] = useState<ReservationFormData>({
    resourceType: "operator",
    resourceId: "",
    workOrderId: "",
    startDate: "",
    endDate: "",
    quantity: 1,
    priority: "normal",
    notes: "",
  });

  // Fetch data
  const { data: operatorSkills = [], isLoading: skillsLoading } = useQuery<OperatorSkill[]>({
    queryKey: ["/api/capacity/operator-skills"],
  });

  const { data: toolResources = [], isLoading: toolsLoading } = useQuery<ToolResource[]>({
    queryKey: ["/api/capacity/tool-resources"],
  });

  const { data: materialAvailability = [], isLoading: materialsLoading } = useQuery<MaterialAvailability[]>({
    queryKey: ["/api/capacity/material-availability"],
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<ResourceReservation[]>({
    queryKey: ["/api/capacity/resource-reservations"],
  });

  const isLoading = skillsLoading || toolsLoading || materialsLoading || reservationsLoading;

  // Mutations
  const createReservationMutation = useMutation({
    mutationFn: async (data: Omit<ResourceReservation, 'id'>) => {
      return await apiRequest("POST", "/api/capacity/resource-reservations", data);
    },
    onSuccess: () => {
      // Invalidate all related capacity queries
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/resource-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/buckets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/tool-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/material-availability"] });
      toast({
        title: "Success",
        description: "Resource reservation created successfully",
      });
      setIsReservationDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation",
        variant: "destructive",
      });
    },
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/capacity/resource-reservations/${id}`);
    },
    onSuccess: () => {
      // Invalidate all related capacity queries
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/resource-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/buckets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/tool-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/material-availability"] });
      toast({
        title: "Success",
        description: "Resource reservation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reservation",
        variant: "destructive",
      });
    },
  });

  // Utility functions
  const getSkillLevelColor = (level: number) => {
    if (level >= 4) return "text-green-600";
    if (level >= 3) return "text-blue-600";
    if (level >= 2) return "text-yellow-600";
    return "text-red-600";
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "text-green-600";
      case "reserved": return "text-blue-600";
      case "shortage": return "text-red-600";
      case "maintenance": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "bg-red-500";
    if (utilization >= 75) return "bg-orange-500";
    if (utilization >= 50) return "bg-blue-500";
    return "bg-green-500";
  };

  const calculateResourceUtilization = (resourceId: string, resourceType: string) => {
    const resourceReservations = reservations.filter(
      r => r.resourceId === resourceId && r.resourceType === resourceType
    );
    
    if (resourceReservations.length === 0) return 0;
    
    // Simple utilization calculation based on reservation count
    // In a real system, this would consider time overlaps and capacity
    return Math.min(100, resourceReservations.length * 25);
  };

  const getResourceShortages = () => {
    const shortages = [];
    
    // Check tool shortages
    toolResources.forEach(tool => {
      const reservedQuantity = reservations
        .filter(r => r.resourceId === tool.id && r.resourceType === "tool")
        .reduce((sum, r) => sum + (r.quantity || 0), 0);
      
      if (reservedQuantity > (tool.availableQuantity || 0)) {
        shortages.push({
          type: "tool",
          resource: tool,
          shortage: reservedQuantity - (tool.availableQuantity || 0),
        });
      }
    });

    // Check material shortages
    materialAvailability.forEach(material => {
      if (material.status === "shortage") {
        shortages.push({
          type: "material",
          resource: material,
          shortage: material.shortfallQuantity || 0,
        });
      }
    });

    return shortages;
  };

  const handleCreateReservation = (resourceType: string, resourceId: string) => {
    setReservationFormData({
      ...reservationFormData,
      resourceType: resourceType as "operator" | "tool" | "material",
      resourceId,
    });
    setIsReservationDialogOpen(true);
  };

  const handleSubmitReservation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservationFormData.resourceId || !reservationFormData.workOrderId) {
      toast({
        title: "Error",
        description: "Resource and work order are required",
        variant: "destructive",
      });
      return;
    }

    const reservationData = {
      ...reservationFormData,
      createdBy: "current-user",
    };

    createReservationMutation.mutate(reservationData);
  };

  const handleDeleteReservation = (id: string) => {
    if (confirm("Are you sure you want to delete this reservation?")) {
      deleteReservationMutation.mutate(id);
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

  const shortages = getResourceShortages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resource Constraints</h2>
          <p className="text-gray-600">Manage operator skills, tool availability, and material constraints</p>
        </div>
        <Button onClick={() => setIsReservationDialogOpen(true)} data-testid="button-create-reservation">
          <Plus className="h-4 w-4 mr-2" />
          Create Reservation
        </Button>
      </div>

      {/* Resource Shortages Alert */}
      {shortages.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Resource Shortages Detected</h3>
                <div className="mt-2 space-y-1">
                  {shortages.map((shortage, idx) => (
                    <p key={idx} className="text-sm text-red-700" data-testid={`text-shortage-${idx}`}>
                      {shortage.type === "tool" && `${shortage.resource.toolName}: ${shortage.shortage} units short`}
                      {shortage.type === "material" && `${shortage.resource.materialName}: ${shortage.shortage} ${shortage.resource.unit} short`}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operators" data-testid="tab-operators">
            <Users className="h-4 w-4 mr-2" />
            Operators
          </TabsTrigger>
          <TabsTrigger value="tools" data-testid="tab-tools">
            <Wrench className="h-4 w-4 mr-2" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="materials" data-testid="tab-materials">
            <Package className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="reservations" data-testid="tab-reservations">
            <Calendar className="h-4 w-4 mr-2" />
            Reservations
          </TabsTrigger>
        </TabsList>

        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operator Skills Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Skill Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Machine Types</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorSkills.map((skill) => {
                    const utilization = calculateResourceUtilization(skill.operatorId, "operator");
                    
                    return (
                      <TableRow key={skill.id} data-testid={`row-operator-${skill.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{skill.operatorName}</p>
                            <p className="text-sm text-gray-600">{skill.operatorId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{skill.skillType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${getSkillLevelColor(skill.skillLevel)}`}>
                              {skill.skillLevel}
                            </span>
                            <span className="text-sm text-gray-600">
                              ({SKILL_LEVELS[skill.skillLevel as keyof typeof SKILL_LEVELS]})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {skill.machineTypes?.slice(0, 2).map((type, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                            {(skill.machineTypes?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(skill.machineTypes?.length || 0) - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getUtilizationColor(utilization)}`}
                                style={{ width: `${utilization}%` }}
                              />
                            </div>
                            <span className="text-sm">{utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={skill.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {skill.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateReservation("operator", skill.operatorId)}
                            data-testid={`button-reserve-operator-${skill.id}`}
                          >
                            Reserve
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {operatorSkills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No operator skills configured.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tool Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolResources.map((tool) => {
                    const reservedQty = reservations
                      .filter(r => r.resourceId === tool.id && r.resourceType === "tool")
                      .reduce((sum, r) => sum + (r.quantity || 0), 0);
                    const availableQty = (tool.availableQuantity || 0) - reservedQty;
                    
                    return (
                      <TableRow key={tool.id} data-testid={`row-tool-${tool.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tool.toolName}</p>
                            <p className="text-sm text-gray-600">{tool.toolNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tool.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${availableQty <= 0 ? "text-red-600" : "text-green-600"}`}>
                            {availableQty}
                          </span>
                          <span className="text-sm text-gray-600">/{tool.availableQuantity}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">{reservedQty}</span>
                        </TableCell>
                        <TableCell>{tool.location}</TableCell>
                        <TableCell>
                          <Badge className={
                            availableQty <= 0 ? "bg-red-100 text-red-800" :
                            availableQty <= 2 ? "bg-yellow-100 text-yellow-800" :
                            "bg-green-100 text-green-800"
                          }>
                            {availableQty <= 0 ? "Unavailable" :
                             availableQty <= 2 ? "Low Stock" : "Available"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateReservation("tool", tool.id)}
                            disabled={availableQty <= 0}
                            data-testid={`button-reserve-tool-${tool.id}`}
                          >
                            Reserve
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {toolResources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No tool resources configured.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Shortfall</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialAvailability.map((material) => (
                    <TableRow key={material.id} data-testid={`row-material-${material.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{material.materialName}</p>
                          <p className="text-sm text-gray-600">{material.materialNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {material.requiredQuantity} {material.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          (material.availableQuantity || 0) < (material.requiredQuantity || 0)
                            ? "text-red-600" : "text-green-600"
                        }`}>
                          {material.availableQuantity || 0} {material.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(material.shortfallQuantity || 0) > 0 && (
                          <span className="font-medium text-red-600">
                            -{material.shortfallQuantity} {material.unit}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {material.expectedDeliveryDate ? (
                          <span className="text-sm">
                            {new Date(material.expectedDeliveryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">TBD</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getAvailabilityColor(material.status || "available")}>
                          {AVAILABILITY_STATUS[material.status as keyof typeof AVAILABILITY_STATUS] || material.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateReservation("material", material.id)}
                          data-testid={`button-reserve-material-${material.id}`}
                        >
                          Reserve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {materialAvailability.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No material availability data.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.id} data-testid={`row-reservation-${reservation.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reservation.resourceName || reservation.resourceId}</p>
                          <p className="text-sm text-gray-600 capitalize">{reservation.resourceType}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {reservation.resourceType}
                        </Badge>
                      </TableCell>
                      <TableCell>{reservation.workOrderId}</TableCell>
                      <TableCell>{reservation.quantity || 1}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(reservation.startDate).toLocaleDateString()}</div>
                          <div className="text-gray-600">to {new Date(reservation.endDate).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          reservation.priority === "urgent" ? "bg-red-100 text-red-800" :
                          reservation.priority === "high" ? "bg-orange-100 text-orange-800" :
                          reservation.priority === "normal" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }>
                          {reservation.priority || "normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteReservation(reservation.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-reservation-${reservation.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reservations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No active reservations.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Reservation Dialog */}
      <Dialog open={isReservationDialogOpen} onOpenChange={setIsReservationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Resource Reservation</DialogTitle>
            <DialogDescription>
              Reserve resources for a specific work order and time period
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitReservation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resourceType">Resource Type</Label>
                <Select 
                  value={reservationFormData.resourceType} 
                  onValueChange={(value) => setReservationFormData({ 
                    ...reservationFormData, 
                    resourceType: value as "operator" | "tool" | "material",
                    resourceId: "" // Reset resource ID when type changes
                  })}
                >
                  <SelectTrigger data-testid="select-resource-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resourceId">Resource</Label>
                <Select 
                  value={reservationFormData.resourceId} 
                  onValueChange={(value) => setReservationFormData({ ...reservationFormData, resourceId: value })}
                >
                  <SelectTrigger data-testid="select-resource-id">
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {reservationFormData.resourceType === "operator" && 
                      operatorSkills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.operatorId}>
                          {skill.operatorName} - {skill.skillType}
                        </SelectItem>
                      ))
                    }
                    {reservationFormData.resourceType === "tool" && 
                      toolResources.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id}>
                          {tool.toolName} ({tool.availableQuantity} available)
                        </SelectItem>
                      ))
                    }
                    {reservationFormData.resourceType === "material" && 
                      materialAvailability.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.materialName} ({material.availableQuantity} {material.unit} available)
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workOrderId">Work Order ID</Label>
                <Input
                  id="workOrderId"
                  value={reservationFormData.workOrderId}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, workOrderId: e.target.value })}
                  placeholder="WO-001"
                  data-testid="input-work-order-id"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={reservationFormData.quantity}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, quantity: Number(e.target.value) })}
                  min="1"
                  data-testid="input-quantity"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={reservationFormData.startDate}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={reservationFormData.endDate}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={reservationFormData.priority} 
                onValueChange={(value) => setReservationFormData({ 
                  ...reservationFormData, 
                  priority: value as "low" | "normal" | "high" | "urgent"
                })}
              >
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={reservationFormData.notes}
                onChange={(e) => setReservationFormData({ ...reservationFormData, notes: e.target.value })}
                placeholder="Additional notes or requirements..."
                rows={2}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsReservationDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createReservationMutation.isPending}
                data-testid="button-create-reservation-submit"
              >
                Create Reservation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}