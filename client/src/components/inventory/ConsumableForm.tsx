import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { insertConsumableSchema } from "@shared/schema";
import { StockAdjustment } from "./StockAdjustment";

const consumableFormSchema = insertConsumableSchema.omit({ sku: true });

type ConsumableFormData = z.infer<typeof consumableFormSchema>;

interface ConsumableFormProps {
  consumable?: any;
  isEditing?: boolean;
  onSuccess: () => void;
}

export function ConsumableForm({
  consumable,
  isEditing: isEditingProp,
  onSuccess,
}: ConsumableFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = isEditingProp ?? !!consumable;

  const form = useForm<ConsumableFormData>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues: consumable
      ? {
          name: consumable.name || "",
          category: consumable.category || "",
          type: consumable.type || "",
          manufacturer: consumable.manufacturer || "",
          grade: consumable.grade || "",
          viscosity: consumable.viscosity || "",
          capacity: consumable.capacity || 0,
          unitOfMeasure: consumable.unitOfMeasure || "",
          currentStock: consumable.currentStock || 0,
          supplier: consumable.supplier || "",
          unitCost: consumable.unitCost || undefined,
          reorderPoint: consumable.reorderPoint || 10,
          maxStock: consumable.maxStock || 100,
          location: consumable.location || "",
          shelfLife: consumable.shelfLife || 0,
          specifications: consumable.specifications || "",
          safetyDataSheet: consumable.safetyDataSheet || "",
        }
      : {
          name: "",
          category: "",
          type: "",
          manufacturer: "",
          grade: "",
          viscosity: "",
          capacity: 0,
          unitOfMeasure: "",
          currentStock: undefined,
          supplier: "",
          unitCost: undefined,
          reorderPoint: 10,
          maxStock: 100,
          location: "",
          shelfLife: 0,
          specifications: "",
          safetyDataSheet: "",
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      const url = isEditing
        ? `/api/inventory/consumables/${consumable.id}`
        : "/api/inventory/consumables";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details ||
            errorData.error ||
            `Failed to ${isEditing ? "update" : "create"} consumable`
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/inventory/consumables"],
      });
      toast({
        title: "Success",
        description: `Consumable ${
          isEditing ? "updated" : "added"
        } successfully`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message ||
          `Failed to ${isEditing ? "update" : "add"} consumable`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConsumableFormData) => {
    if (isEditing) {
      mutation.mutate(data);
    } else {
      const sku = generateSKU(data);
      mutation.mutate({ ...data, sku } as any);
    }
  };

  const generateSKU = (data: ConsumableFormData): string => {
    const categoryCode = data.category.substring(0, 3).toUpperCase();
    const nameCode = data.name
      .replace(/\s+/g, "")
      .substring(0, 4)
      .toUpperCase();
    const capacityCode = data.capacity
      ? `-${data.capacity}${data.unitOfMeasure.substring(0, 1)}`
      : "";
    return `${categoryCode}-${nameCode}${capacityCode}`;
  };

  const categories = [
    "Hydraulic Oil",
    "Coolant",
    "Cutting Fluid",
    "Lubricant",
    "Grease",
    "Cleaning Supplies",
    "Rust Preventive",
    "Degreaser",
    "Other",
  ];

  const unitsOfMeasure = [
    "liters",
    "gallons",
    "kg",
    "lbs",
    "pieces",
    "bottles",
    "drums",
  ];

  const suppliers = [
    "Shell",
    "Mobil",
    "Castrol",
    "Fuchs",
    "Blaser",
    "Master Chemical",
    "Grainger",
    "MSC Industrial",
    "Local Supplier",
  ];

  return (
    <form
      id="consumable-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Stock Adjustment - Only shown when editing */}
      {isEditing && consumable && (
        <StockAdjustment
          itemId={consumable.id}
          itemType="consumables"
          currentStock={consumable.currentStock || 0}
          itemName={consumable.name}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="name" required>
                Product Name
              </FormLabel>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Mobil DTE 25"
                className="mt-1"
                data-testid="input-name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="category" required>
                Category
              </FormLabel>
              <Select
                value={form.watch("category")}
                onValueChange={(value) => form.setValue("category", value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            <div>
              <FormLabel htmlFor="type" optional>
                Type
              </FormLabel>
              <Input
                id="type"
                {...form.register("type")}
                placeholder="e.g., Synthetic, Mineral"
                className="mt-1"
              />
            </div>

            <div>
              <FormLabel htmlFor="manufacturer" optional>
                Manufacturer
              </FormLabel>
              <Input
                id="manufacturer"
                {...form.register("manufacturer")}
                placeholder="e.g., Shell, Mobil, Castrol (optional)"
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
              <FormLabel htmlFor="grade" optional>
                Grade/Standard
              </FormLabel>
              <Input
                id="grade"
                {...form.register("grade")}
                placeholder="e.g., ISO VG 46, SAE 10W-30"
                className="mt-1"
              />
            </div>

            <div>
              <FormLabel htmlFor="viscosity" optional>
                Viscosity
              </FormLabel>
              <Input
                id="viscosity"
                {...form.register("viscosity")}
                placeholder="e.g., 46 cSt @40°C"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel htmlFor="capacity" required>
                  Capacity/Size
                </FormLabel>
                <Input
                  id="capacity"
                  type="number"
                  step="0.1"
                  {...form.register("capacity", { valueAsNumber: true })}
                  placeholder="20"
                  className="mt-1"
                />
                {form.formState.errors.capacity && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.capacity.message}
                  </p>
                )}
              </div>

              <div>
                <FormLabel htmlFor="unitOfMeasure" required>
                  Unit
                </FormLabel>
                <Select
                  value={form.watch("unitOfMeasure")}
                  onValueChange={(value) =>
                    form.setValue("unitOfMeasure", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsOfMeasure.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.unitOfMeasure && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.unitOfMeasure.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <FormLabel htmlFor="currentStock" required>
                Initial Stock Quantity
              </FormLabel>
              <Input
                id="currentStock"
                type="number"
                {...form.register("currentStock", { valueAsNumber: true })}
                placeholder="0"
                className="mt-1"
                data-testid="input-current-stock"
              />
              {form.formState.errors.currentStock && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.currentStock.message}
                </p>
              )}
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
              />
            </div>

            <div>
              <FormLabel htmlFor="shelfLife" optional>
                Shelf Life (months)
              </FormLabel>
              <Input
                id="shelfLife"
                type="number"
                {...form.register("shelfLife", {
                  valueAsNumber: true,
                  setValueAs: (value) =>
                    !value || value === "" || isNaN(value) ? 0 : Number(value),
                })}
                placeholder="24"
                className="mt-1"
              />
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
                placeholder="125.00 (optional)"
                className="mt-1"
                data-testid="input-unit-cost"
              />
            </div>

            <div>
              <FormLabel htmlFor="location" optional>
                Storage Location
              </FormLabel>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="Chemical Storage - Bay 2"
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
              />
            </div>

            <div>
              <FormLabel htmlFor="specifications" optional>
                Additional Specifications
              </FormLabel>
              <Textarea
                id="specifications"
                {...form.register("specifications")}
                placeholder="Additional product details"
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            <div>
              <FormLabel htmlFor="safetyDataSheet" optional>
                Safety Data Sheet
              </FormLabel>
              <Input
                id="safetyDataSheet"
                {...form.register("safetyDataSheet")}
                placeholder="SDS reference or link"
                className="mt-1"
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
          disabled={mutation.isPending || !form.formState.isValid}
          data-testid="button-submit"
          onClick={() => {
            console.log(
              "DEBUG: Consumable button clicked, calling form.handleSubmit"
            );
            form.handleSubmit(onSubmit)();
          }}
        >
          {mutation.isPending ? "Adding..." : "Add Consumable"}
        </Button>
      </ScrollableDialogFooter>
    </form>
  );
}
