import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertToolSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollableDialogFooter } from "@/components/ui/scrollable-dialog";
import { z } from "zod";
import { StockAdjustment } from "./StockAdjustment";

type Tool = typeof import("@shared/schema").tools.\$inferSelect;

const toolEditSchema = insertToolSchema;

type ToolEditFormData = z.infer<typeof toolEditSchema>;

interface ToolEditProps {
  toolId: string;
  onSuccess?: () => void;
}

export function ToolEdit({ toolId, onSuccess }: ToolEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: tool, isLoading } = useQuery<Tool>({
    queryKey: [\`/api/inventory/tools/\${toolId}\`],
  });

  const form = useForm<ToolEditFormData>({
    resolver: zodResolver(toolEditSchema),
    defaultValues: {
      toolNumber: "",
      toolType: "",
      manufacturer: "",
      description: "",
      diameter: null,
      length: null,
      material: "",
      coating: "",
      currentLocation: "",
      status: "available",
      totalUsageHours: 0,
      maxUsageHours: null,
      lastMaintenanceDate: null,
      nextMaintenanceHours: null,
      costPerTool: null,
    },
  });

  useEffect(() => {
    if (tool) {
      form.reset({
        toolNumber: tool.toolNumber || "",
        toolType: tool.toolType || "",
        manufacturer: tool.manufacturer || "",
        description: tool.description || "",
        diameter: tool.diameter,
        length: tool.length,
        material: tool.material || "",
        coating: tool.coating || "",
        currentLocation: tool.currentLocation || "",
        status: tool.status || "available",
        totalUsageHours: tool.totalUsageHours || 0,
        maxUsageHours: tool.maxUsageHours,
        lastMaintenanceDate: tool.lastMaintenanceDate,
        nextMaintenanceHours: tool.nextMaintenanceHours,
        costPerTool: tool.costPerTool,
      });
    }
  }, [tool, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ToolEditFormData) => {
      return await apiRequest(\`/api/inventory/tools/\${toolId}\`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/tools"] });
      queryClient.invalidateQueries({ queryKey: [\`/api/inventory/tools/\${toolId}\`] });
      toast({
        title: "Success",
        description: "Tool updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tool",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-6 text-center">Loading tool data...</div>;
  }

  if (!tool) {
    return <div className="p-6 text-center text-red-600">Tool not found</div>;
  }

  const toolTypes = [
    "INSERT", "END_MILL", "DRILL", "BORING_BAR", "REAMER", 
    "TAP", "FACE_MILL", "GROOVING_TOOL", "THREADING_TOOL"
  ];

  const materials = [
    "HSS", "CARBIDE", "CERAMIC", "CBN", "PCD", "DIAMOND"
  ];

  const coatings = [
    "Uncoated", "TiN", "TiAlN", "TiCN", "AlTiN", "AlCrN", "DLC"
  ];

  const statuses = [
    "available", "in_use", "maintenance", "worn_out"
  ];

  return (
    <Form {...form}>
      <form 
        id="edit-tool-form" 
        onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
        className="space-y-6 px-6 pb-6"
      >
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="toolNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-tool-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toolType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-tool-type">
                        <SelectValue placeholder="Select tool type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {toolTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manufacturer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-manufacturer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "available"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Specifications */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Specifications</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="diameter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diameter (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      data-testid="input-diameter"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (mm)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      data-testid="input-length"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-material">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map((mat) => (
                        <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coating</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-coating">
                        <SelectValue placeholder="Select coating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {coatings.map((coat) => (
                        <SelectItem key={coat} value={coat}>{coat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Location and Usage */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Location & Usage</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currentLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Location</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="costPerTool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost per Tool</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      data-testid="input-cost"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalUsageHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Usage Hours</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      data-testid="input-usage-hours"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxUsageHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Usage Hours</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      data-testid="input-max-hours"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextMaintenanceHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Maintenance (hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      data-testid="input-next-maintenance"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <ScrollableDialogFooter>
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            data-testid="button-save-tool"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </ScrollableDialogFooter>
      </form>
    </Form>
  );
}
