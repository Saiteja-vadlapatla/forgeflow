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
import { insertGeneralItemSchema } from "@shared/schema";
import { StockAdjustment } from "./StockAdjustment";

const generalItemFormSchema = insertGeneralItemSchema.omit({ sku: true });

type GeneralItemFormData = z.infer<typeof generalItemFormSchema>;

interface GeneralItemFormProps {
  item?: any;
  isEditing?: boolean;
  onSuccess: () => void;
}

export function GeneralItemForm({
  item,
  isEditing: isEditingProp,
  onSuccess,
}: GeneralItemFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = isEditingProp ?? !!item;

  const form = useForm<GeneralItemFormData>({
    resolver: zodResolver(generalItemFormSchema),
    defaultValues: item
      ? {
          name: item.name || "",
          category: item.category || "",
          subCategory: item.subCategory || "",
          manufacturer: item.manufacturer || "",
          model: item.model || "",
          description: item.description || "",
          specifications: item.specifications || {},
          currentStock: item.currentStock || 0,
          supplier: item.supplier || "",
          unitCost: item.unitCost || 0,
          reorderPoint: item.reorderPoint || 5,
          maxStock: item.maxStock || 50,
          location: item.location || "",
          condition: item.condition || "new",
          serialNumber: item.serialNumber || "",
          purchaseDate: item.purchaseDate,
          warrantyExpiry: item.warrantyExpiry,
        }
      : {
          name: "",
          category: "",
          subCategory: "",
          manufacturer: "",
          model: "",
          description: "",
          specifications: {},
          currentStock: 0,
          supplier: "",
          unitCost: 0,
          reorderPoint: 5,
          maxStock: 50,
          location: "",
          condition: "new",
          serialNumber: "",
          purchaseDate: undefined,
          warrantyExpiry: undefined,
        },
  });

  const mutation = useMutation({
    mutationFn: async (data: GeneralItemFormData) => {
      const url = isEditing
        ? `/api/inventory/general-items/${item.id}`
        : "/api/inventory/general-items";
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
            `Failed to ${isEditing ? "update" : "create"} general item`
        );
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/inventory/general-items"],
      });
      toast({
        title: "Success",
        description: `General item ${
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
          `Failed to ${isEditing ? "update" : "add"} general item`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GeneralItemFormData) => {
    if (isEditing) {
      mutation.mutate(data);
    } else {
      const sku = generateSKU(data);
      mutation.mutate({ ...data, sku } as GeneralItemFormData);
    }
  };

  const generateSKU = (data: GeneralItemFormData): string => {
    const categoryCode = data.category.substring(0, 3).toUpperCase();
    const nameCode = data.name
      .replace(/\s+/g, "")
      .substring(0, 4)
      .toUpperCase();
    return `${categoryCode}-${nameCode}`;
  };

  const categories = [
    "Hand Tools",
    "Power Tools",
    "Measuring Equipment",
    "Material Handling",
    "Safety Equipment",
    "Cleaning Equipment",
    "Workshop Equipment",
    "Storage",
    "Other",
  ];

  const subCategories = [
    "Deburring",
    "Clamping",
    "Cutting",
    "Grinding",
    "Polishing",
    "Assembly",
    "Inspection",
    "General Purpose",
  ];

  const conditions = ["new", "used", "refurbished"];

  const suppliers = [
    "Grainger",
    "MSC Industrial",
    "McMaster-Carr",
    "Amazon Business",
    "Harbor Freight",
    "Uline",
    "Local Supplier",
  ];

  return (
    <form
      id="general-item-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* Stock Adjustment - Only shown when editing */}
      {isEditing && item && (
        <StockAdjustment
          itemId={item.id}
          itemType="general-items"
          currentStock={item.currentStock || 0}
          itemName={item.name}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="name" required>
                Item Name
              </FormLabel>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Air Gun Set, Deburring Tool Kit"
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
              <FormLabel htmlFor="subCategory" optional>
                Sub Category
              </FormLabel>
              <Select
                value={form.watch("subCategory") || ""}
                onValueChange={(value) => form.setValue("subCategory", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select sub category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel htmlFor="manufacturer" optional>
                Manufacturer
              </FormLabel>
              <Input
                id="manufacturer"
                {...form.register("manufacturer")}
                placeholder="e.g., Stanley, DeWalt, Mitutoyo"
                className="mt-1"
              />
            </div>

            <div>
              <FormLabel htmlFor="model" optional>
                Model Number
              </FormLabel>
              <Input
                id="model"
                {...form.register("model")}
                placeholder="Model or part number"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Description & Specs */}
        <Card>
          <CardHeader>
            <CardTitle>Description & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel htmlFor="description" optional>
                Description
              </FormLabel>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Detailed item description"
                className="mt-1 resize-none"
                rows={4}
              />
            </div>

            <div>
              <FormLabel htmlFor="condition" optional>
                Condition
              </FormLabel>
              <Select
                value={form.watch("condition") || ""}
                onValueChange={(value) => form.setValue("condition", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {cond.charAt(0).toUpperCase() + cond.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel htmlFor="serialNumber" optional>
                Serial Number
              </FormLabel>
              <Input
                id="serialNumber"
                {...form.register("serialNumber")}
                placeholder="For traceable items"
                className="mt-1"
              />
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
              <FormLabel htmlFor="supplier" required>
                Supplier
              </FormLabel>
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
              <FormLabel htmlFor="unitCost" required>
                Unit Cost ($)
              </FormLabel>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                {...form.register("unitCost", { valueAsNumber: true })}
                placeholder="45.00"
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
              <FormLabel htmlFor="location" optional>
                Storage Location
              </FormLabel>
              <Input
                id="location"
                {...form.register("location")}
                placeholder="Tool Room - Cabinet 5"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel htmlFor="purchaseDate" optional>
                  Purchase Date
                </FormLabel>
                <Input
                  id="purchaseDate"
                  type="date"
                  {...form.register("purchaseDate")}
                  className="mt-1"
                />
              </div>

              <div>
                <FormLabel htmlFor="warrantyExpiry" optional>
                  Warranty Expiry
                </FormLabel>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  {...form.register("warrantyExpiry")}
                  className="mt-1"
                />
              </div>
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
              <FormLabel htmlFor="currentStock" optional>
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
            </div>

            <div>
              <FormLabel htmlFor="reorderPoint" optional>
                Reorder Point
              </FormLabel>
              <Input
                id="reorderPoint"
                type="number"
                {...form.register("reorderPoint", { valueAsNumber: true })}
                placeholder="5"
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
                {...form.register("maxStock", { valueAsNumber: true })}
                placeholder="50"
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
          form="general-item-form"
          disabled={mutation.isPending || !form.formState.isValid}
          data-testid="button-submit"
          onClick={() => {
            console.log(
              "DEBUG: General Item button clicked, calling form.handleSubmit"
            );
            form.handleSubmit(onSubmit)();
          }}
        >
          {mutation.isPending
            ? isEditing
              ? "Updating..."
              : "Adding..."
            : isEditing
            ? "Update General Item"
            : "Add General Item"}
        </Button>
      </ScrollableDialogFooter>
    </form>
  );
}
