import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertRawMaterialSchema, RawMaterial } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollableDialogFooter } from "@/components/ui/scrollable-dialog";
import { z } from "zod";
import { StockAdjustment } from "./StockAdjustment";

// Extended type to include currentStock which is handled in-memory
type RawMaterialWithStock = RawMaterial & { currentStock?: number };

const materialEditSchema = insertRawMaterialSchema.extend({
  currentStock: z.coerce.number().min(0).default(0),
});

type MaterialEditFormData = z.infer<typeof materialEditSchema>;

interface RawMaterialEditProps {
  materialId: string;
  onSuccess?: () => void;
}

export function RawMaterialEdit({ materialId, onSuccess }: RawMaterialEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: material, isLoading } = useQuery<RawMaterialWithStock>({
    queryKey: [`/api/inventory/materials/${materialId}`],
  });

  const form = useForm<MaterialEditFormData>({
    resolver: zodResolver(materialEditSchema),
    defaultValues: {
      sku: "",
      materialType: "",
      grade: "",
      shape: "",
      diameter: null,
      thickness: null,
      width: null,
      length: null,
      supplier: "",
      unitCost: 0,
      location: "",
      reorderPoint: 0,
      maxStock: 0,
      currentStock: 0,
    },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        sku: material.sku || "",
        materialType: material.materialType || "",
        grade: material.grade || "",
        shape: material.shape || "",
        diameter: material.diameter,
        thickness: material.thickness,
        width: material.width,
        length: material.length,
        supplier: material.supplier || "",
        unitCost: material.unitCost || 0,
        location: material.location || "",
        reorderPoint: material.reorderPoint || 0,
        maxStock: material.maxStock || 0,
        currentStock: material.currentStock || 0,
      });
    }
  }, [material, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: MaterialEditFormData) => {
      return await apiRequest(`/api/inventory/materials/${materialId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/materials"] });
      queryClient.invalidateQueries({ queryKey: [`/api/inventory/materials/${materialId}`] });
      toast({
        title: "Success",
        description: "Raw material updated successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update raw material",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-6 text-center">Loading material data...</div>;
  }

  if (!material) {
    return <div className="p-6 text-center text-red-600">Material not found</div>;
  }

  return (
    <Form {...form}>
      <form 
        id="edit-material-form" 
        onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
        className="space-y-6 px-6 pb-6"
      >
        {/* Stock Adjustment */}
        <StockAdjustment
          itemId={materialId}
          itemType="materials"
          currentStock={material.currentStock || 0}
          itemName={`${material.materialType} ${material.grade} ${material.shape}`.trim()}
        />

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., MAT-001" data-testid="input-sku" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="materialType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-material-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Steel">Steel</SelectItem>
                      <SelectItem value="Aluminum">Aluminum</SelectItem>
                      <SelectItem value="Brass">Brass</SelectItem>
                      <SelectItem value="Copper">Copper</SelectItem>
                      <SelectItem value="Titanium">Titanium</SelectItem>
                      <SelectItem value="Stainless Steel">Stainless Steel</SelectItem>
                      <SelectItem value="Cast Iron">Cast Iron</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 304, 6061-T6" data-testid="input-grade" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shape"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shape</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-shape">
                        <SelectValue placeholder="Select shape" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Round">Round</SelectItem>
                      <SelectItem value="Square">Square</SelectItem>
                      <SelectItem value="Rectangular">Rectangular</SelectItem>
                      <SelectItem value="Hexagonal">Hexagonal</SelectItem>
                      <SelectItem value="Flat">Flat</SelectItem>
                      <SelectItem value="Tube">Tube</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Dimensions (mm)</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="diameter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diameter</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-diameter" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thickness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thickness</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-thickness" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-width" 
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
                  <FormLabel>Length</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-length" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Supply Chain */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Supply Chain</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Supplier name" data-testid="input-supplier" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unitCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-unit-cost" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Stock Management */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Stock Management</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Warehouse A-1-3" data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stock</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-current-stock" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reorderPoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Point</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-reorder-point" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxStock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Stock</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-max-stock" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <ScrollableDialogFooter form="edit-material-form">
          <Button 
            type="submit" 
            disabled={updateMutation.isPending}
            data-testid="button-save-material"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </ScrollableDialogFooter>
      </form>
    </Form>
  );
}
