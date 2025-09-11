import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Search, Filter, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Machine, MachineCapability } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface CapabilityFormData {
  machineId: string;
  operationType: string;
  skillLevel: number;
  throughputRating: number;
  qualityRating: number;
  costPerHour: number;
  constraints: string;
  isActive: boolean;
  notes: string;
}

const OPERATION_TYPES = [
  "TURNING", "MILLING", "DRILLING", "GRINDING", "BORING", 
  "THREADING", "FACING", "KNURLING", "CHAMFERING", "DEBURRING"
];

export function CapabilityManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMachine, setFilterMachine] = useState("all");
  const [filterOperation, setFilterOperation] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCapability, setEditingCapability] = useState<MachineCapability | null>(null);
  const [formData, setFormData] = useState<CapabilityFormData>({
    machineId: "",
    operationType: "",
    skillLevel: 3,
    throughputRating: 75,
    qualityRating: 85,
    costPerHour: 50,
    constraints: "",
    isActive: true,
    notes: "",
  });

  // Fetch data
  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: capabilities = [], isLoading: capabilitiesLoading } = useQuery<MachineCapability[]>({
    queryKey: ["/api/capacity/machine-capabilities"],
  });

  const isLoading = machinesLoading || capabilitiesLoading;

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Omit<MachineCapability, 'id'>) => {
      return await apiRequest("POST", "/api/capacity/machine-capabilities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/machine-capabilities"] });
      toast({
        title: "Success",
        description: "Machine capability created successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create capability",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MachineCapability> & { id: string }) => {
      return await apiRequest("PATCH", `/api/capacity/machine-capabilities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/machine-capabilities"] });
      toast({
        title: "Success",
        description: "Machine capability updated successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update capability",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/capacity/machine-capabilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/machine-capabilities"] });
      toast({
        title: "Success",
        description: "Machine capability deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete capability",
        variant: "destructive",
      });
    },
  });

  // Filter capabilities
  const filteredCapabilities = capabilities.filter(capability => {
    const machine = machines.find(m => m.id === capability.machineId);
    const machineName = machine?.name || "";
    
    const matchesSearch = 
      machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capability.operationType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMachine = filterMachine === "all" || capability.machineId === filterMachine;
    const matchesOperation = filterOperation === "all" || capability.operationType === filterOperation;
    
    return matchesSearch && matchesMachine && matchesOperation;
  });

  const handleOpenDialog = (capability?: MachineCapability) => {
    if (capability) {
      setEditingCapability(capability);
      setFormData({
        machineId: capability.machineId,
        operationType: capability.operationType,
        skillLevel: capability.skillLevel || 3,
        throughputRating: capability.throughputRating || 75,
        qualityRating: capability.qualityRating || 85,
        costPerHour: capability.costPerHour || 50,
        constraints: capability.constraints || "",
        isActive: capability.isActive !== false,
        notes: capability.notes || "",
      });
    } else {
      setEditingCapability(null);
      setFormData({
        machineId: "",
        operationType: "",
        skillLevel: 3,
        throughputRating: 75,
        qualityRating: 85,
        costPerHour: 50,
        constraints: "",
        isActive: true,
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCapability(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.machineId || !formData.operationType) {
      toast({
        title: "Error",
        description: "Machine and operation type are required",
        variant: "destructive",
      });
      return;
    }

    const capabilityData = {
      ...formData,
      createdBy: "current-user", // This would come from authentication context
    };

    if (editingCapability) {
      updateMutation.mutate({ id: editingCapability.id, ...capabilityData });
    } else {
      createMutation.mutate(capabilityData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this capability?")) {
      deleteMutation.mutate(id);
    }
  };

  const getSkillLevelBadge = (level: number) => {
    if (level >= 4) return <Badge className="bg-green-100 text-green-800">Expert</Badge>;
    if (level >= 3) return <Badge className="bg-blue-100 text-blue-800">Proficient</Badge>;
    if (level >= 2) return <Badge className="bg-yellow-100 text-yellow-800">Basic</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Novice</Badge>;
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 90) return "text-green-600";
    if (rating >= 75) return "text-blue-600";
    if (rating >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Machine Capabilities</h2>
          <p className="text-gray-600">Manage machine skills, throughput ratings, and operational constraints</p>
        </div>
        <Button onClick={() => handleOpenDialog()} data-testid="button-add-capability">
          <Plus className="h-4 w-4 mr-2" />
          Add Capability
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search capabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-capabilities"
              />
            </div>
            <Select value={filterMachine} onValueChange={setFilterMachine}>
              <SelectTrigger data-testid="select-filter-machine">
                <SelectValue placeholder="All Machines" />
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
            <Select value={filterOperation} onValueChange={setFilterOperation}>
              <SelectTrigger data-testid="select-filter-operation">
                <SelectValue placeholder="All Operations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                {OPERATION_TYPES.map((operation) => (
                  <SelectItem key={operation} value={operation}>
                    {operation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredCapabilities.length} capabilities
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capabilities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Capability Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>Throughput</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Cost/Hour</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCapabilities.map((capability) => {
                const machine = machines.find(m => m.id === capability.machineId);
                
                return (
                  <TableRow key={capability.id} data-testid={`row-capability-${capability.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium" data-testid={`text-machine-name-${capability.id}`}>
                          {machine?.name || "Unknown Machine"}
                        </p>
                        <p className="text-sm text-gray-600">{machine?.type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-operation-${capability.id}`}>
                        {capability.operationType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < (capability.skillLevel || 0) 
                                  ? "text-yellow-400 fill-current" 
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        {getSkillLevelBadge(capability.skillLevel || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getPerformanceColor(capability.throughputRating || 0)}`}>
                        {capability.throughputRating || 0}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getPerformanceColor(capability.qualityRating || 0)}`}>
                        {capability.qualityRating || 0}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium" data-testid={`text-cost-${capability.id}`}>
                        ${capability.costPerHour || 0}/hr
                      </span>
                    </TableCell>
                    <TableCell>
                      {capability.isActive !== false ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                      {capability.constraints && (
                        <AlertCircle className="h-4 w-4 text-orange-500 ml-2 inline" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(capability)}
                          data-testid={`button-edit-${capability.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(capability.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-${capability.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCapabilities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No capabilities found. Add some capabilities to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Capability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCapability ? "Edit Capability" : "Add New Capability"}
            </DialogTitle>
            <DialogDescription>
              {editingCapability 
                ? "Update the machine capability details below"
                : "Define a new machine capability with performance ratings and constraints"
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="machineId">Machine</Label>
                <Select 
                  value={formData.machineId} 
                  onValueChange={(value) => setFormData({ ...formData, machineId: value })}
                >
                  <SelectTrigger data-testid="select-machine">
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name} - {machine.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operationType">Operation Type</Label>
                <Select 
                  value={formData.operationType} 
                  onValueChange={(value) => setFormData({ ...formData, operationType: value })}
                >
                  <SelectTrigger data-testid="select-operation-type">
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATION_TYPES.map((operation) => (
                      <SelectItem key={operation} value={operation}>
                        {operation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Skill Level: {formData.skillLevel}</Label>
              <Slider
                value={[formData.skillLevel]}
                onValueChange={([value]) => setFormData({ ...formData, skillLevel: value })}
                max={5}
                min={1}
                step={1}
                className="mt-2"
                data-testid="slider-skill-level"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Novice</span>
                <span>Expert</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Throughput Rating: {formData.throughputRating}%</Label>
                <Slider
                  value={[formData.throughputRating]}
                  onValueChange={([value]) => setFormData({ ...formData, throughputRating: value })}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-2"
                  data-testid="slider-throughput"
                />
              </div>

              <div>
                <Label>Quality Rating: {formData.qualityRating}%</Label>
                <Slider
                  value={[formData.qualityRating]}
                  onValueChange={([value]) => setFormData({ ...formData, qualityRating: value })}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-2"
                  data-testid="slider-quality"
                />
              </div>

              <div>
                <Label htmlFor="costPerHour">Cost per Hour ($)</Label>
                <Input
                  id="costPerHour"
                  type="number"
                  value={formData.costPerHour}
                  onChange={(e) => setFormData({ ...formData, costPerHour: Number(e.target.value) })}
                  min={0}
                  step={0.01}
                  data-testid="input-cost-per-hour"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="constraints">Constraints</Label>
              <Textarea
                id="constraints"
                placeholder="Operational constraints, limitations, or special requirements..."
                value={formData.constraints}
                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                rows={3}
                data-testid="textarea-constraints"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or comments..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Active capability</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-capability"
              >
                {editingCapability ? "Update Capability" : "Create Capability"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}