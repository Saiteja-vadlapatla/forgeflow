import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormLabel } from "@/components/ui/form-label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollableDialogFooter } from "@/components/ui/scrollable-dialog";
import { useToast } from "@/hooks/use-toast";
import { insertRawMaterialSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { GeometryCalculator } from "./GeometryCalculator";

const rawMaterialFormSchema = insertRawMaterialSchema.omit({
  sku: true,
});

type RawMaterialFormData = z.infer<typeof rawMaterialFormSchema>;

interface RawMaterialFormProps {
  onSuccess: () => void;
}

export function RawMaterialForm({ onSuccess }: RawMaterialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RawMaterialFormData>({
    resolver: zodResolver(rawMaterialFormSchema),
    defaultValues: {
      materialType: "",
      grade: "",
      shape: "",
      supplier: "",
      unitCost: undefined,
      currentStock: undefined,
      reorderPoint: 10,
      maxStock: 100,
      location: "",
      diameter: 0,
      thickness: 0,
      width: 0,
      length: 0,
      specifications: "",
    },
    mode: "onBlur", // Validate when fields lose focus
  });

  const mutation = useMutation({
    mutationFn: async (data: RawMaterialFormData) => {
      // Generate SKU based on material properties
      const sku = generateSKU(data);
      const formData = {
        ...data,
        sku,
      };

      const response = await fetch("/api/inventory/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details ||
            errorData.error ||
            "Failed to create raw material"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/materials"] });
      toast({
        title: "Success",
        description: "Raw material added successfully",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add raw material",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RawMaterialFormData) => {
    mutation.mutate(data);
  };

  // Debug test function (remove this eventually)
  const testSubmit = () => {
    console.log("DEBUG: Button clicked, calling form.handleSubmit");
    form.handleSubmit(onSubmit)();
  };

  // TODO: Remove onClick handler after testing and clean up debug logs
  React.useEffect(() => {
    // Clean up logging after development
    return () => {
      // This will trigger cleanup when component unmounts
    };
  }, []);

  const generateSKU = (data: RawMaterialFormData): string => {
    const materialCode = data.materialType.substring(0, 3).toUpperCase();
    const gradeCode = data.grade ? `-${data.grade}` : "";
    const shapeCode = data.shape
      .replace(/\s+/g, "")
      .substring(0, 4)
      .toUpperCase();
    const sizeCode = data.diameter
      ? `-D${data.diameter}`
      : data.width
      ? `-W${data.width}`
      : "";
    const lengthCode = data.length ? `-L${data.length}` : "";

    return `${materialCode}${gradeCode}-${shapeCode}${sizeCode}${lengthCode}`;
  };

  const materialTypes = [
    "Steel",
    "Aluminum",
    "Stainless Steel",
    "Brass",
    "Copper",
    "Titanium",
    "Plastic",
    "Carbon Steel",
    "Alloy Steel",
  ];

  const shapes = [
    "Round Bar",
    "Square Bar",
    "Rectangular Bar",
    "Flat Bar",
    "Plate",
    "Sheet",
    "Tube",
    "Pipe",
    "Angle",
    "Channel",
  ];

  const suppliers = [
    "Metal Supermarkets",
    "Ryerson",
    "Industrial Metal Supply",
    "OnlineMetals.com",
    "ThyssenKrupp",
    "Nucor Corporation",
    "Steel Dynamics",
    "Local Supplier",
  ];

  const renderDimensionFields = () => {
    const shape = form.watch("shape");

    switch (shape) {
      case "Round Bar":
        return (
          <div>
            <Label htmlFor="diameter">Diameter (mm)</Label>
            <Input
              id="diameter"
              type="number"
              step="0.1"
              {...form.register("diameter", { valueAsNumber: true })}
              placeholder="25.4"
              className="mt-1"
            />
            <div className="mt-2">
              <Label htmlFor="length">Length (mm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="3000"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "Square Bar":
        return (
          <div>
            <Label htmlFor="diameter">Side Length (mm)</Label>
            <Input
              id="diameter"
              type="number"
              step="0.1"
              {...form.register("diameter", { valueAsNumber: true })}
              placeholder="25.4"
              className="mt-1"
            />
            <div className="mt-2">
              <Label htmlFor="length">Length (mm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="3000"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "Rectangular Bar":
      case "Flat Bar":
        return (
          <>
            <div>
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                {...form.register("width", { valueAsNumber: true })}
                placeholder="50.8"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="thickness">Thickness (mm)</Label>
              <Input
                id="thickness"
                type="number"
                step="0.1"
                {...form.register("thickness", { valueAsNumber: true })}
                placeholder="6.35"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="length">Length (mm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="3000"
                className="mt-1"
              />
            </div>
          </>
        );

      case "Plate":
      case "Sheet":
        return (
          <>
            <div>
              <Label htmlFor="width">Width (mm)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                {...form.register("width", { valueAsNumber: true })}
                placeholder="1000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="thickness">Thickness (mm)</Label>
              <Input
                id="thickness"
                type="number"
                step="0.1"
                {...form.register("thickness", { valueAsNumber: true })}
                placeholder="6.35"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="length">Length (mm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="2000"
                className="mt-1"
              />
            </div>
          </>
        );

      case "Tube":
      case "Pipe":
        return (
          <>
            <div>
              <Label htmlFor="diameter">Outer Diameter (mm)</Label>
              <Input
                id="diameter"
                type="number"
                step="0.1"
                {...form.register("diameter", { valueAsNumber: true })}
                placeholder="25.4"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="thickness">Wall Thickness (mm)</Label>
              <Input
                id="thickness"
                type="number"
                step="0.1"
                {...form.register("thickness", { valueAsNumber: true })}
                placeholder="2.0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="length">Length (mm)</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="3000"
                className="mt-1"
              />
            </div>
          </>
        );

      default:
        return (
          <div className="text-gray-500 text-center py-8">
            Please select a shape to configure dimensions
          </div>
        );
    }
  };

  return (
    <form
      id="raw-material-form"
      onSubmit={(e) => {
        console.log("Form submit event triggered");
        console.log("Current form values:", form.getValues());
        console.log("Form errors before submit:", form.formState.errors);
        console.log("Form is valid:", form.formState.isValid);
        return form.handleSubmit(onSubmit)(e);
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Basic Information */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Material Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="materialType" required>
                Material Type
              </FormLabel>
              <Select
                value={form.watch("materialType")}
                onValueChange={(value) => {
                  form.setValue("materialType", value);
                  form.trigger("materialType"); // Trigger validation
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.materialType && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.materialType.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="grade" required>
                Grade
              </FormLabel>
              <Input
                id="grade"
                {...form.register("grade")}
                placeholder="e.g., 4140, 6061-T6, 316L"
                className="mt-1"
              />
              {form.formState.errors.grade && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.grade.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="shape" required>
                Shape
              </FormLabel>
              <Select
                value={form.watch("shape")}
                onValueChange={(value) => {
                  form.setValue("shape", value);
                  form.trigger("shape"); // Trigger validation
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {shapes.map((shape) => (
                    <SelectItem key={shape} value={shape}>
                      {shape}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.shape && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.shape.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Dimensions (mm)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderDimensionFields()}
          </CardContent>
        </Card>
      </div>

      {/* Weight Calculator */}
      <GeometryCalculator
        shape={form.watch("shape")}
        materialType={form.watch("materialType")}
        diameter={form.watch("diameter") || 0}
        thickness={form.watch("thickness") || 0}
        width={form.watch("width") || 0}
        length={form.watch("length") || 0}
        quantity={1}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Supply Information */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Supply & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="supplier" optional>
                Supplier
              </FormLabel>
              <Select
                value={form.watch("supplier")}
                onValueChange={(value) => {
                  form.setValue("supplier", value);
                  form.trigger("supplier"); // Trigger validation
                }}
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
              <FormLabel htmlFor="unitCost" optional>
                Unit Cost ($)
              </FormLabel>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                {...form.register("unitCost", {
                  setValueAs: (value) =>
                    !value || value === "" || isNaN(value) ? 0 : Number(value),
                })}
                placeholder="15.50 (optional)"
                className="mt-1"
              />
              {form.formState.errors.unitCost && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.unitCost.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="location" optional>
                Storage Location
              </FormLabel>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="A-1-01"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Settings */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Stock Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="currentStock" required>
                Initial Stock Quantity
              </FormLabel>
              <Input
                id="currentStock"
                type="number"
                {...form.register("currentStock", {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === "" ? 0 : Number(value)),
                })}
                placeholder="0"
                className="mt-1"
                data-testid="input-current-stock"
              />
              <p className="text-sm text-gray-500 mt-1">
                Starting inventory quantity (can be updated later)
              </p>
            </div>

            <div>
              <FormLabel htmlFor="reorderPoint" optional>
                Reorder Point
              </FormLabel>
              <Input
                id="reorderPoint"
                type="number"
                {...form.register("reorderPoint", {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === "" ? 10 : Number(value)),
                })}
                placeholder="10"
                className="mt-1"
                data-testid="input-reorder-point"
              />
            </div>

            <div>
              <FormLabel htmlFor="maxStock" optional>
                Maximum Stock
              </FormLabel>
              <Input
                id="maxStock"
                type="number"
                {...form.register("maxStock", {
                  valueAsNumber: true,
                  setValueAs: (value) => (value === "" ? 100 : Number(value)),
                })}
                placeholder="100"
                className="mt-1"
                data-testid="input-max-stock"
              />
            </div>

            <div>
              <FormLabel htmlFor="specifications" optional>
                Additional Specifications
              </FormLabel>
              <Textarea
                id="specifications"
                {...form.register("specifications")}
                placeholder="Heat treatment, surface finish, certifications, etc."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollableDialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            mutation.isPending ||
            !form.watch("materialType") ||
            !form.watch("grade") ||
            !form.watch("shape") ||
            form.watch("currentStock") === undefined
          }
          data-testid="button-submit"
          onClick={testSubmit}
        >
          {mutation.isPending ? "Adding..." : "Add Material"}
        </Button>
      </ScrollableDialogFooter>
    </form>
  );
}
