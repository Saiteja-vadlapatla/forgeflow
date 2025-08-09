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
import { useToast } from "@/hooks/use-toast";
import { insertRawMaterialSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const rawMaterialFormSchema = insertRawMaterialSchema.omit({ 
  id: true, 
  sku: true, 
  createdAt: true, 
  updatedAt: true 
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
      unitCost: 0,
      reorderPoint: 10,
      maxStock: 100,
      location: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RawMaterialFormData) => {
      const response = await fetch("/api/inventory/materials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create raw material");
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
    onError: (error: any) => {
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

  const materialTypes = [
    "Steel", "Aluminum", "Stainless Steel", "Brass", "Copper", 
    "Titanium", "Plastic", "Carbon Steel", "Alloy Steel"
  ];

  const shapes = [
    "Round Bar", "Square Bar", "Rectangular Bar", "Flat Bar",
    "Plate", "Sheet", "Tube", "Pipe", "Angle", "Channel"
  ];

  const suppliers = [
    "Metal Supermarkets", "Ryerson", "Industrial Metal Supply",
    "OnlineMetals.com", "ThyssenKrupp", "Nucor Corporation",
    "Steel Dynamics", "Local Supplier"
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Material Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="materialType">Material Type</Label>
              <Select 
                value={form.watch("materialType")} 
                onValueChange={(value) => form.setValue("materialType", value)}
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
              <Label htmlFor="grade">Grade</Label>
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
              <Label htmlFor="shape">Shape</Label>
              <Select 
                value={form.watch("shape")} 
                onValueChange={(value) => form.setValue("shape", value)}
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
        <Card>
          <CardHeader>
            <CardTitle>Dimensions (mm)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="diameter">Diameter</Label>
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
              <Label htmlFor="thickness">Thickness</Label>
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
              <Label htmlFor="width">Width</Label>
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
              <Label htmlFor="length">Length</Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                {...form.register("length", { valueAsNumber: true })}
                placeholder="3000"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Supply Information */}
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
                placeholder="15.50"
                className="mt-1"
              />
              {form.formState.errors.unitCost && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.unitCost.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Storage Location</Label>
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
        <Card>
          <CardHeader>
            <CardTitle>Stock Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input
                id="reorderPoint"
                type="number"
                {...form.register("reorderPoint", { valueAsNumber: true })}
                placeholder="10"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="maxStock">Maximum Stock</Label>
              <Input
                id="maxStock"
                type="number"
                {...form.register("maxStock", { valueAsNumber: true })}
                placeholder="100"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="specifications">Additional Specifications</Label>
              <Textarea
                id="specifications"
                placeholder="Heat treatment, surface finish, certifications, etc."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Adding..." : "Add Material"}
        </Button>
      </div>
    </form>
  );
}