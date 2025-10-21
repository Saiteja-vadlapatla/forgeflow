import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollableDialogFooter } from "@/components/ui/scrollable-dialog";
import { useToast } from "@/hooks/use-toast";
import { insertFastenerSchema } from "@shared/schema";

const fastenerFormSchema = insertFastenerSchema.omit({ sku: true });

type FastenerFormData = z.infer<typeof fastenerFormSchema>;

interface FastenerFormProps {
  fastener?: any;
  onSuccess: () => void;
}

export function FastenerForm({ fastener, onSuccess }: FastenerFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!fastener;

  const form = useForm<FastenerFormData>({
    resolver: zodResolver(fastenerFormSchema),
    defaultValues: fastener ? {
      fastenerType: fastener.fastenerType || "",
      threadType: fastener.threadType || "",
      diameter: fastener.diameter || 0,
      pitch: fastener.pitch,
      threadDescription: fastener.threadDescription || "",
      length: fastener.length,
      headType: fastener.headType || "",
      driveType: fastener.driveType || "",
      material: fastener.material || "",
      grade: fastener.grade || "",
      finish: fastener.finish || "",
      currentStock: fastener.currentStock || 0,
      supplier: fastener.supplier || "",
      unitCost: fastener.unitCost || 0,
      reorderPoint: fastener.reorderPoint || 100,
      maxStock: fastener.maxStock || 1000,
      location: fastener.location || "",
      specifications: fastener.specifications || "",
    } : {
      fastenerType: "",
      threadType: "",
      diameter: 0,
      pitch: undefined,
      threadDescription: "",
      length: undefined,
      headType: "",
      driveType: "",
      material: "",
      grade: "",
      finish: "",
      currentStock: 0,
      supplier: "",
      unitCost: 0,
      reorderPoint: 100,
      maxStock: 1000,
      location: "",
      specifications: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FastenerFormData) => {
      const url = isEditing ? `/api/inventory/fasteners/${fastener.id}` : "/api/inventory/fasteners";
      const method = isEditing ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `Failed to ${isEditing ? 'update' : 'create'} fastener`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/fasteners"] });
      toast({
        title: "Success",
        description: `Fastener ${isEditing ? 'updated' : 'added'} successfully`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${isEditing ? 'update' : 'add'} fastener`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FastenerFormData) => {
    if (isEditing) {
      mutation.mutate(data);
    } else {
      const sku = generateSKU(data);
      mutation.mutate({ ...data, sku });
    }
  };

  const generateSKU = (data: FastenerFormData): string => {
    const typeCode = data.fastenerType.substring(0, 3).toUpperCase();
    const threadCode = data.threadType.substring(0, 3).toUpperCase();
    const sizeCode = data.threadDescription || `D${data.diameter}`;
    return `${typeCode}-${threadCode}-${sizeCode}`;
  };

  const fastenerTypes = [
    "Bolt", "Screw", "Nut", "Washer", "Stud", "Threaded Rod",
    "Set Screw", "Cap Screw", "Machine Screw"
  ];

  const threadTypes = [
    "Metric", "UNC", "UNF", "BSP", "BSPT", "NPT", "NPTF"
  ];

  const headTypes = [
    "Hex", "Socket Cap", "Button Head", "Flat Head", "Pan Head",
    "Truss Head", "Round Head", "Countersunk"
  ];

  const driveTypes = [
    "Hex", "Allen/Hex Socket", "Torx", "Phillips", "Slotted",
    "Robertson", "Pozidriv"
  ];

  const materials = [
    "Steel", "Stainless Steel 304", "Stainless Steel 316",
    "Brass", "Aluminum", "Nylon", "Titanium"
  ];

  const grades = [
    "8.8", "10.9", "12.9", "A2-70", "A4-80", "Grade 5", "Grade 8"
  ];

  const finishes = [
    "Zinc Plated", "Black Oxide", "Plain", "Galvanized",
    "Passivated", "Chrome Plated", "Nickel Plated"
  ];

  const suppliers = [
    "Fastenal", "Grainger", "McMaster-Carr", "Bossard",
    "Würth", "Stanley", "Local Supplier"
  ];

  return (
    <form id="fastener-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Fastener Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="fastenerType" required>Fastener Type</FormLabel>
              <Select
                value={form.watch("fastenerType")}
                onValueChange={(value) => form.setValue("fastenerType", value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-fastener-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {fastenerTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.fastenerType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.fastenerType.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="threadType" required>Thread Type</FormLabel>
              <Select
                value={form.watch("threadType")}
                onValueChange={(value) => form.setValue("threadType", value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-thread-type">
                  <SelectValue placeholder="Select thread type" />
                </SelectTrigger>
                <SelectContent>
                  {threadTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.threadType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.threadType.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="threadDescription" optional>Thread Description</FormLabel>
              <Input
                id="threadDescription"
                {...form.register("threadDescription")}
                placeholder="e.g., M10x1.5, 1/4-20 UNF, G1/4 BSP"
                className="mt-1"
                data-testid="input-thread-description"
              />
              <p className="text-xs text-gray-500 mt-1">
                Complete thread designation (e.g., M10x1.5 for Metric)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel htmlFor="diameter" required>Diameter (mm)</FormLabel>
                <Input
                  id="diameter"
                  type="number"
                  step="0.1"
                  {...form.register("diameter", { valueAsNumber: true })}
                  placeholder="10"
                  className="mt-1"
                  data-testid="input-diameter"
                />
                {form.formState.errors.diameter && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.diameter.message}
                  </p>
                )}
              </div>

              <div>
                <FormLabel htmlFor="pitch" optional>Pitch (mm)</FormLabel>
                <Input
                  id="pitch"
                  type="number"
                  step="0.1"
                  {...form.register("pitch", { valueAsNumber: true })}
                  placeholder="1.5"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="length" optional>Length (mm)</FormLabel>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="30"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="headType" optional>Head Type</FormLabel>
              <Select
                value={form.watch("headType")}
                onValueChange={(value) => form.setValue("headType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select head type" />
                </SelectTrigger>
                <SelectContent>
                  {headTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel htmlFor="driveType" optional>Drive Type</FormLabel>
              <Select
                value={form.watch("driveType")}
                onValueChange={(value) => form.setValue("driveType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select drive type" />
                </SelectTrigger>
                <SelectContent>
                  {driveTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel htmlFor="material" required>Material</FormLabel>
              <Select
                value={form.watch("material")}
                onValueChange={(value) => form.setValue("material", value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-material">
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
              <FormLabel htmlFor="grade" optional>Grade/Class</FormLabel>
              <Select
                value={form.watch("grade")}
                onValueChange={(value) => form.setValue("grade", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel htmlFor="finish" optional>Finish/Coating</FormLabel>
              <Select
                value={form.watch("finish")}
                onValueChange={(value) => form.setValue("finish", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select finish" />
                </SelectTrigger>
                <SelectContent>
                  {finishes.map((finish) => (
                    <SelectItem key={finish} value={finish}>
                      {finish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supply Information */}
        <Card>
          <CardHeader>
            <CardTitle>Supply & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="supplier" required>Supplier</FormLabel>
              <Select
                value={form.watch("supplier")}
                onValueChange={(value) => form.setValue("supplier", value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-supplier">
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
              <FormLabel htmlFor="unitCost" required>Unit Cost ($)</FormLabel>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                {...form.register("unitCost", { valueAsNumber: true })}
                placeholder="0.25"
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
              <FormLabel htmlFor="location" optional>Storage Location</FormLabel>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="Fastener Rack - Row 3"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Management */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="currentStock" optional>Initial Stock Quantity</FormLabel>
              <Input
                id="currentStock"
                type="number"
                {...form.register("currentStock", { valueAsNumber: true })}
                placeholder="0"
                className="mt-1"
                data-testid="input-current-stock"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of individual fasteners
              </p>
            </div>

            <div>
              <FormLabel htmlFor="reorderPoint" optional>Reorder Point</FormLabel>
              <Input
                id="reorderPoint"
                type="number"
                {...form.register("reorderPoint", { valueAsNumber: true })}
                placeholder="100"
                className="mt-1"
              />
            </div>

            <div>
              <FormLabel htmlFor="maxStock" optional>Maximum Stock</FormLabel>
              <Input
                id="maxStock"
                type="number"
                {...form.register("maxStock", { valueAsNumber: true })}
                placeholder="1000"
                className="mt-1"
              />
            </div>

            <div>
              <FormLabel htmlFor="specifications" optional>Additional Specifications</FormLabel>
              <Textarea
                id="specifications"
                {...form.register("specifications")}
                placeholder="Additional details, standards, etc."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollableDialogFooter form="fastener-form">
        <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
          Cancel
        </Button>
        <Button
          type="submit"
          form="fastener-form"
          disabled={mutation.isPending}
          data-testid="button-submit"
        >
          {mutation.isPending ? "Adding..." : "Add Fastener"}
        </Button>
      </ScrollableDialogFooter>
    </form>
  );
}
