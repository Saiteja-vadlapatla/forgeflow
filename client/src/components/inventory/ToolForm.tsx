import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollableDialogFooter } from "@/components/ui/scrollable-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { insertInventoryToolSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const toolFormSchema = insertInventoryToolSchema.omit({ 
  sku: true
});

type ToolFormData = z.infer<typeof toolFormSchema>;

interface ToolFormProps {
  onSuccess: () => void;
}

export function ToolForm({ onSuccess }: ToolFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);

  const form = useForm<ToolFormData>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      toolType: "",
      manufacturer: "",
      model: "",
      size: 0,
      material: "",
      supplier: "",
      unitCost: 0,
      currentStock: 0,
      reorderPoint: 5,
      maxStock: 50,
      location: "",
      applicationMaterial: [],
      operationType: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ToolFormData) => {
      const response = await fetch("/api/inventory/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create tool");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/tools"] });
      toast({
        title: "Success",
        description: "Tool added successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add tool",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ToolFormData) => {
    // Generate SKU based on tool properties
    const sku = generateToolSKU(data);
    const formData = {
      ...data,
      sku,
      applicationMaterial: selectedApplications,
      operationType: selectedOperations,
    };
    mutation.mutate(formData);
  };

  const generateToolSKU = (data: ToolFormData): string => {
    const typeCode = data.toolType.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const materialCode = data.material ? `-${data.material.substring(0, 3).toUpperCase()}` : '';
    const sizeCode = data.size ? `-D${data.size}` : '';
    const coatingCode = data.coating && data.coating !== 'None' ? `-${data.coating.substring(0, 3).toUpperCase()}` : '';
    
    return `${typeCode}${materialCode}${sizeCode}${coatingCode}`;
  };

  const toolTypes = [
    "End Mill", "Drill Bit", "Turning Insert", "Milling Insert", 
    "Boring Bar", "Threading Tool", "Face Mill", "Reamer", 
    "Tap", "Die", "Countersink", "Spot Drill"
  ];

  const materials = [
    "HSS", "Carbide", "Cobalt", "TiN Coated", "TiAlN Coated", 
    "Diamond", "CBN", "Ceramic", "PCD"
  ];

  const coatings = [
    "Uncoated", "TiN", "TiAlN", "TiCN", "AlCrN", "DLC", 
    "Diamond", "Other"
  ];

  const manufacturers = [
    "Sandvik", "Kennametal", "Iscar", "Seco", "Walter", 
    "Mitsubishi", "Kyocera", "Tungaloy", "Harvey Tool", 
    "Haas", "Other"
  ];

  const applicationMaterials = [
    "Steel", "Stainless Steel", "Aluminum", "Cast Iron", 
    "Titanium", "Brass", "Copper", "Plastic", "Composite"
  ];

  const operationTypes = [
    "TURNING", "MILLING", "DRILLING", "TAPPING", 
    "GRINDING", "BORING", "REAMING", "THREADING"
  ];

  const suppliers = [
    "MSC Industrial", "McMaster-Carr", "Grainger", "Fastenal", 
    "Harvey Tool", "Local Supplier", "Direct from Manufacturer"
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="toolType">Tool Type</Label>
              <Select 
                value={form.watch("toolType")} 
                onValueChange={(value) => form.setValue("toolType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tool type" />
                </SelectTrigger>
                <SelectContent>
                  {toolTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.toolType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.toolType.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="subType">Sub Type</Label>
              <Input
                id="subType"
                {...form.register("subType")}
                placeholder="e.g., Roughing, Finishing, Ball Nose"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Select 
                value={form.watch("manufacturer")} 
                onValueChange={(value) => form.setValue("manufacturer", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((mfg) => (
                    <SelectItem key={mfg} value={mfg}>
                      {mfg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.manufacturer && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.manufacturer.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                {...form.register("model")}
                placeholder="Model number or part number"
                className="mt-1"
              />
              {form.formState.errors.model && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.model.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tool Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="size">Size (mm)</Label>
              <Input
                id="size"
                type="number"
                step="0.1"
                {...form.register("size", { valueAsNumber: true })}
                placeholder="12.0"
                className="mt-1"
              />
              {form.formState.errors.size && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.size.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="length">Overall Length (mm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="75.0"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Select 
                value={form.watch("material")} 
                onValueChange={(value) => form.setValue("material", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.material && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.material.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="coating">Coating</Label>
              <Select 
                value={form.watch("coating") || ""} 
                onValueChange={(value) => form.setValue("coating", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select coating" />
                </SelectTrigger>
                <SelectContent>
                  {coatings.map((coating) => (
                    <SelectItem key={coating} value={coating}>
                      {coating}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="geometry">Geometry (for inserts)</Label>
              <Input
                id="geometry"
                {...form.register("geometry")}
                placeholder="e.g., WNMG 432, CNMG 644"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Application */}
        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Application Materials</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {applicationMaterials.map((material) => (
                  <div key={material} className="flex items-center space-x-2">
                    <Checkbox
                      id={`app-${material}`}
                      checked={selectedApplications.includes(material)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedApplications([...selectedApplications, material]);
                        } else {
                          setSelectedApplications(selectedApplications.filter(m => m !== material));
                        }
                      }}
                    />
                    <Label htmlFor={`app-${material}`} className="text-sm">
                      {material}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Operation Types</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {operationTypes.map((operation) => (
                  <div key={operation} className="flex items-center space-x-2">
                    <Checkbox
                      id={`op-${operation}`}
                      checked={selectedOperations.includes(operation)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOperations([...selectedOperations, operation]);
                        } else {
                          setSelectedOperations(selectedOperations.filter(o => o !== operation));
                        }
                      }}
                    />
                    <Label htmlFor={`op-${operation}`} className="text-sm">
                      {operation.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Supply & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select 
                value={form.watch("supplier")} 
                onValueChange={(value) => form.setValue("supplier", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier} value={supplier}>
                      {supplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.supplier && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.supplier.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="unitCost">Unit Cost ($)</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                {...form.register("unitCost", { valueAsNumber: true })}
                placeholder="45.50"
                className="mt-1"
                data-testid="input-unit-cost"
              />
              {form.formState.errors.unitCost && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.unitCost.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="currentStock">Initial Stock Quantity</Label>
              <Input
                id="currentStock"
                type="number"
                {...form.register("currentStock", { valueAsNumber: true })}
                placeholder="0"
                className="mt-1"
                data-testid="input-current-stock"
              />
              <p className="text-sm text-gray-500 mt-1">
                Starting inventory quantity (can be updated later)
              </p>
            </div>

            <div>
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input
                id="reorderPoint"
                type="number"
                {...form.register("reorderPoint", { valueAsNumber: true })}
                placeholder="5"
                className="mt-1"
                data-testid="input-reorder-point"
              />
            </div>

            <div>
              <Label htmlFor="maxStock">Maximum Stock</Label>
              <Input
                id="maxStock"
                type="number"
                {...form.register("maxStock", { valueAsNumber: true })}
                placeholder="50"
                className="mt-1"
                data-testid="input-max-stock"
              />
            </div>

            <div>
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="Tool Crib - Drawer 3"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollableDialogFooter>
        <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending} data-testid="button-submit">
          {mutation.isPending ? "Adding..." : "Add Tool"}
        </Button>
      </ScrollableDialogFooter>
    </form>
  );
}