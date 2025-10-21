import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RawMaterial, InventoryTool } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const inventoryUpdateSchema = z.object({
  currentStock: z.number().min(0),
  adjustmentType: z.enum(["add", "remove", "set"]),
  adjustmentQuantity: z.number().min(0),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type InventoryUpdateData = z.infer<typeof inventoryUpdateSchema>;

interface InventoryUpdateDialogProps {
  type: "material" | "tool";
  item: (RawMaterial | InventoryTool) & { currentStock?: number };
  trigger: React.ReactNode;
}

export function InventoryUpdateDialog({ type, item, trigger }: InventoryUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InventoryUpdateData>({
    resolver: zodResolver(inventoryUpdateSchema),
    defaultValues: {
      currentStock: item.currentStock || 0,
      adjustmentType: "add",
      adjustmentQuantity: 0,
      reason: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InventoryUpdateData) => {
      const endpoint = type === "material" 
        ? `/api/inventory/materials/${item.id}/update-stock`
        : `/api/inventory/tools/${item.id}/update-stock`;
      
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || "Failed to update stock");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: type === "material" 
          ? ["/api/inventory/materials"] 
          : ["/api/inventory/tools"] 
      });
      toast({
        title: "Success",
        description: `${type === "material" ? "Material" : "Tool"} stock updated successfully`,
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InventoryUpdateData) => {
    mutation.mutate(data);
  };

  const adjustmentType = form.watch("adjustmentType");
  const adjustmentQuantity = form.watch("adjustmentQuantity");
  const currentStock = form.watch("currentStock");

  const calculateNewStock = () => {
    switch (adjustmentType) {
      case "add":
        return currentStock + adjustmentQuantity;
      case "remove":
        return Math.max(0, currentStock - adjustmentQuantity);
      case "set":
        return adjustmentQuantity;
      default:
        return currentStock;
    }
  };

  const reasons = [
    "Received shipment", "Physical count adjustment", "Damaged/scrapped",
    "Used in production", "Returned to supplier", "Transfer to other location",
    "Found inventory", "Lost/missing", "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Update {type === "material" ? "Material" : "Tool"} Stock
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium">
              {type === "material" 
                ? `${(item as RawMaterial).materialType} ${(item as RawMaterial).grade}`
                : `${(item as InventoryTool).toolType} - ${(item as InventoryTool).manufacturer}`
              }
            </h4>
            <p className="text-sm text-gray-600">SKU: {item.sku}</p>
            <p className="text-sm text-gray-600">
              Current Stock: <span className="font-medium">{item.currentStock || 0}</span>
            </p>
          </div>

          {/* Adjustment Type */}
          <div>
            <Label htmlFor="adjustmentType">Adjustment Type</Label>
            <Select 
              value={form.watch("adjustmentType")} 
              onValueChange={(value: "add" | "remove" | "set") => form.setValue("adjustmentType", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add to Stock</SelectItem>
                <SelectItem value="remove">Remove from Stock</SelectItem>
                <SelectItem value="set">Set Stock Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Quantity */}
          <div>
            <Label htmlFor="adjustmentQuantity">
              {adjustmentType === "set" ? "New Stock Level" : "Quantity"}
            </Label>
            <Input
              id="adjustmentQuantity"
              type="number"
              min="0"
              {...form.register("adjustmentQuantity", { valueAsNumber: true })}
              className="mt-1"
            />
            {form.formState.errors.adjustmentQuantity && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.adjustmentQuantity.message}
              </p>
            )}
          </div>

          {/* New Stock Preview */}
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm">
              <span className="text-gray-600">New Stock Level: </span>
              <span className="font-medium text-blue-700">
                {calculateNewStock()} pieces
              </span>
            </p>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Select 
              value={form.watch("reason") || ""} 
              onValueChange={(value) => form.setValue("reason", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Additional notes about this stock adjustment..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}