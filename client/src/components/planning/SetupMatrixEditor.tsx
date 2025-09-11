import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, RotateCcw, Info, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { SetupGroup, Machine } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SetupTime {
  fromGroupId: string;
  toGroupId: string;
  timeMinutes: number;
  notes?: string;
}

interface SetupGroupFormData {
  name: string;
  description: string;
  machineTypes: string[];
  operationTypes: string[];
  toolingRequirements: string;
  materialTypes: string[];
}

const OPERATION_TYPES = [
  "TURNING", "MILLING", "DRILLING", "GRINDING", "BORING", 
  "THREADING", "FACING", "KNURLING", "CHAMFERING", "DEBURRING"
];

export function SetupMatrixEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SetupGroup | null>(null);
  const [editingCell, setEditingCell] = useState<{ from: string; to: string } | null>(null);
  const [cellValue, setCellValue] = useState("");
  const [cellNotes, setCellNotes] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("all");

  const [groupFormData, setGroupFormData] = useState<SetupGroupFormData>({
    name: "",
    description: "",
    machineTypes: [],
    operationTypes: [],
    toolingRequirements: "",
    materialTypes: [],
  });

  // Fetch data
  const { data: setupGroups = [], isLoading: groupsLoading } = useQuery<SetupGroup[]>({
    queryKey: ["/api/capacity/setup-groups"],
  });

  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: setupTimes = [], isLoading: timesLoading } = useQuery<SetupTime[]>({
    queryKey: ["/api/capacity/setup-times"],
  });

  const isLoading = groupsLoading || machinesLoading || timesLoading;

  // Group CRUD mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: Omit<SetupGroup, 'id'>) => {
      return await apiRequest("POST", "/api/capacity/setup-groups", data);
    },
    onSuccess: () => {
      // Invalidate all related capacity queries
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/setup-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/buckets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/setup-times"] });
      toast({
        title: "Success",
        description: "Setup group created successfully",
      });
      handleCloseGroupDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create setup group",
        variant: "destructive",
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<SetupGroup> & { id: string }) => {
      return await apiRequest("PATCH", `/api/capacity/setup-groups/${id}`, data);
    },
    onSuccess: () => {
      // Invalidate all related capacity queries
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/setup-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/buckets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/setup-times"] });
      toast({
        title: "Success",
        description: "Setup group updated successfully",
      });
      handleCloseGroupDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setup group",
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/capacity/setup-groups/${id}`);
    },
    onSuccess: () => {
      // Invalidate all related capacity queries
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/setup-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/buckets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/setup-times"] });
      toast({
        title: "Success",
        description: "Setup group deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete setup group",
        variant: "destructive",
      });
    },
  });

  // Setup time mutations
  const updateSetupTimeMutation = useMutation({
    mutationFn: async (data: SetupTime) => {
      return await apiRequest("PUT", "/api/capacity/setup-times", data);
    },
    onSuccess: () => {
      // Invalidate all related capacity queries  
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/setup-times"] });
      queryClient.invalidateQueries({ queryKey: ["/api/capacity/buckets"] });
      toast({
        title: "Success",
        description: "Setup time updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setup time",
        variant: "destructive",
      });
    },
  });

  // Utility functions
  const getSetupTime = (fromId: string, toId: string): number => {
    if (fromId === toId) return 0; // Same setup group = no changeover time
    const setupTime = setupTimes.find(st => st.fromGroupId === fromId && st.toGroupId === toId);
    return setupTime?.timeMinutes || 30; // Default 30 minutes
  };

  const getSetupTimeNotes = (fromId: string, toId: string): string => {
    const setupTime = setupTimes.find(st => st.fromGroupId === fromId && st.toGroupId === toId);
    return setupTime?.notes || "";
  };

  const getTimeColor = (minutes: number): string => {
    if (minutes === 0) return "bg-green-500";
    if (minutes <= 15) return "bg-green-400";
    if (minutes <= 30) return "bg-yellow-400";
    if (minutes <= 60) return "bg-orange-400";
    return "bg-red-500";
  };

  const getTimeIntensity = (minutes: number): string => {
    if (minutes === 0) return "opacity-100";
    if (minutes <= 15) return "opacity-75";
    if (minutes <= 30) return "opacity-60";
    if (minutes <= 60) return "opacity-45";
    return "opacity-30";
  };

  // Filter groups by machine type if selected
  const filteredGroups = useMemo(() => {
    if (selectedMachine === "all") return setupGroups;
    const machine = machines.find(m => m.id === selectedMachine);
    if (!machine) return setupGroups;
    
    return setupGroups.filter(group => 
      group.machineTypes?.includes(machine.type) || 
      group.machineTypes?.length === 0
    );
  }, [setupGroups, machines, selectedMachine]);

  // Dialog handlers
  const handleOpenGroupDialog = (group?: SetupGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        name: group.name,
        description: group.description || "",
        machineTypes: group.machineTypes || [],
        operationTypes: group.operationTypes || [],
        toolingRequirements: group.toolingRequirements || "",
        materialTypes: group.materialTypes || [],
      });
    } else {
      setEditingGroup(null);
      setGroupFormData({
        name: "",
        description: "",
        machineTypes: [],
        operationTypes: [],
        toolingRequirements: "",
        materialTypes: [],
      });
    }
    setIsGroupDialogOpen(true);
  };

  const handleCloseGroupDialog = () => {
    setIsGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const handleSubmitGroup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupFormData.name) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const groupData = {
      ...groupFormData,
      createdBy: "current-user",
    };

    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, ...groupData });
    } else {
      createGroupMutation.mutate(groupData);
    }
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm("Are you sure you want to delete this setup group?")) {
      deleteGroupMutation.mutate(id);
    }
  };

  // Cell editing handlers
  const handleCellClick = (fromId: string, toId: string) => {
    if (fromId === toId) return; // Can't edit same-group cells
    
    setEditingCell({ from: fromId, to: toId });
    setCellValue(getSetupTime(fromId, toId).toString());
    setCellNotes(getSetupTimeNotes(fromId, toId));
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    
    const timeMinutes = parseInt(cellValue) || 0;
    updateSetupTimeMutation.mutate({
      fromGroupId: editingCell.from,
      toGroupId: editingCell.to,
      timeMinutes,
      notes: cellNotes,
    });
    
    setEditingCell(null);
    setCellValue("");
    setCellNotes("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setCellValue("");
    setCellNotes("");
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
          <h2 className="text-2xl font-bold">Setup Matrix Editor</h2>
          <p className="text-gray-600">Manage setup groups and changeover times between operations</p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedMachine} onValueChange={setSelectedMachine}>
            <SelectTrigger className="w-48" data-testid="select-machine-filter">
              <SelectValue placeholder="Filter by machine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Machines</SelectItem>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name} ({machine.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenGroupDialog()} data-testid="button-add-setup-group">
            <Plus className="h-4 w-4 mr-2" />
            Add Setup Group
          </Button>
        </div>
      </div>

      {/* Setup Groups Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Setup Groups ({filteredGroups.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold" data-testid={`text-group-name-${group.id}`}>
                      {group.name}
                    </h3>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenGroupDialog(group)}
                        data-testid={`button-edit-group-${group.id}`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-group-${group.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                  
                  <div className="space-y-2">
                    {group.machineTypes && group.machineTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {group.machineTypes.slice(0, 3).map((type, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                        {group.machineTypes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{group.machineTypes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {group.operationTypes && group.operationTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {group.operationTypes.slice(0, 2).map((operation, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {operation}
                          </Badge>
                        ))}
                        {group.operationTypes.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.operationTypes.length - 2} ops
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredGroups.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No setup groups found. Create some groups to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Time Matrix */}
      {filteredGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Changeover Time Matrix (minutes)</span>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span>0-15 min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded" />
                  <span>16-30 min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-400 rounded" />
                  <span>31-60 min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span>60+ min</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-sm font-medium">From / To</th>
                    {filteredGroups.map((group) => (
                      <th key={group.id} className="p-2 text-center text-sm font-medium min-w-[100px]">
                        <div className="transform -rotate-45 origin-center whitespace-nowrap">
                          {group.name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((fromGroup) => (
                    <tr key={fromGroup.id}>
                      <td className="p-2 text-sm font-medium bg-gray-50">
                        {fromGroup.name}
                      </td>
                      {filteredGroups.map((toGroup) => {
                        const minutes = getSetupTime(fromGroup.id, toGroup.id);
                        const notes = getSetupTimeNotes(fromGroup.id, toGroup.id);
                        const isEditing = editingCell?.from === fromGroup.id && editingCell?.to === toGroup.id;
                        const isSameGroup = fromGroup.id === toGroup.id;
                        
                        return (
                          <td key={toGroup.id} className="p-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  type="number"
                                  min="0"
                                  className="h-8 text-xs"
                                  placeholder="Minutes"
                                  data-testid="input-setup-time"
                                />
                                <Input
                                  value={cellNotes}
                                  onChange={(e) => setCellNotes(e.target.value)}
                                  placeholder="Notes (optional)"
                                  className="h-8 text-xs"
                                  data-testid="input-setup-notes"
                                />
                                <div className="flex space-x-1">
                                  <Button size="sm" onClick={handleCellSave} className="h-6 px-2 text-xs">
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCellCancel} className="h-6 px-2 text-xs">
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`
                                      relative h-16 w-full rounded flex items-center justify-center
                                      ${isSameGroup 
                                        ? "bg-gray-200 cursor-not-allowed" 
                                        : `${getTimeColor(minutes)} ${getTimeIntensity(minutes)} cursor-pointer hover:opacity-80`
                                      }
                                      text-white font-semibold text-sm
                                    `}
                                    onClick={() => !isSameGroup && handleCellClick(fromGroup.id, toGroup.id)}
                                    data-testid={`cell-${fromGroup.id}-${toGroup.id}`}
                                  >
                                    {isSameGroup ? "-" : `${minutes}m`}
                                    {notes && !isSameGroup && (
                                      <Info className="h-3 w-3 absolute top-1 right-1" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {fromGroup.name} → {toGroup.name}
                                    </p>
                                    <p>Setup time: {minutes} minutes</p>
                                    {notes && <p className="text-sm italic">"{notes}"</p>}
                                    {!isSameGroup && <p className="text-xs">Click to edit</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredGroups.length < 2 && (
              <div className="text-center py-8 text-gray-500">
                Add at least 2 setup groups to see the changeover time matrix.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "Edit Setup Group" : "Add New Setup Group"}
            </DialogTitle>
            <DialogDescription>
              {editingGroup 
                ? "Update the setup group configuration"
                : "Create a new setup group for organizing changeover operations"
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitGroup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="e.g., Small Turning Parts"
                  data-testid="input-group-name"
                />
              </div>
              
              <div>
                <Label htmlFor="machineTypes">Machine Types</Label>
                <Select 
                  value={groupFormData.machineTypes.join(",")} 
                  onValueChange={(value) => {
                    const types = value ? value.split(",") : [];
                    setGroupFormData({ ...groupFormData, machineTypes: types });
                  }}
                >
                  <SelectTrigger data-testid="select-machine-types">
                    <SelectValue placeholder="Select machine types" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...new Set(machines.map(m => m.type))].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={groupFormData.description}
                onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                placeholder="Describe the characteristics and purpose of this setup group..."
                rows={3}
                data-testid="textarea-group-description"
              />
            </div>

            <div>
              <Label>Operation Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {OPERATION_TYPES.map((operation) => (
                  <label key={operation} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={groupFormData.operationTypes.includes(operation)}
                      onChange={(e) => {
                        const operations = e.target.checked
                          ? [...groupFormData.operationTypes, operation]
                          : groupFormData.operationTypes.filter(op => op !== operation);
                        setGroupFormData({ ...groupFormData, operationTypes: operations });
                      }}
                      data-testid={`checkbox-operation-${operation}`}
                    />
                    <span className="text-sm">{operation}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="toolingRequirements">Tooling Requirements</Label>
              <Textarea
                id="toolingRequirements"
                value={groupFormData.toolingRequirements}
                onChange={(e) => setGroupFormData({ ...groupFormData, toolingRequirements: e.target.value })}
                placeholder="Describe required tooling, fixtures, or special equipment..."
                rows={2}
                data-testid="textarea-tooling-requirements"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCloseGroupDialog}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                data-testid="button-save-group"
              >
                {editingGroup ? "Update Group" : "Create Group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}