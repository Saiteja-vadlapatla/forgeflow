import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, DollarSign, MapPin, Ruler, Box, Info, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RawMaterial, InsertRawMaterial } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extended type to include currentStock which is handled in-memory
type RawMaterialWithStock = RawMaterial & { currentStock?: number };

interface RawMaterialDetailsProps {
  materialId: string;
  onEdit?: () => void;
  onClose: () => void;
}

export function RawMaterialDetails({ materialId, onEdit, onClose }: RawMaterialDetailsProps) {
  const { toast } = useToast();
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const { data: materials = [], isLoading } = useQuery<RawMaterialWithStock[]>({
    queryKey: ["/api/inventory/materials"],
  });

  const material = materials.find(m => m.id === materialId);

  const updateStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/inventory/materials/${materialId}/update-stock`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/materials'] });
      toast({
        title: "Stock Updated",
        description: "Stock level has been updated successfully.",
      });
      setIsStockDialogOpen(false);
      resetStockForm();
    },
    onError: (error: any) => {
      const errorMessage = error?.details || error?.message || "Failed to update stock";
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetStockForm = () => {
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setAdjustmentNotes('');
    setAdjustmentType('add');
  };

  const handleStockUpdate = () => {
    const quantity = parseFloat(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    updateStockMutation.mutate({
      adjustmentType,
      adjustmentQuantity: quantity,
      reason: adjustmentReason,
      notes: adjustmentNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading material details...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Material not found</p>
        <Button onClick={onClose} className="mt-4" data-testid="button-close-not-found">
          Close
        </Button>
      </div>
    );
  }

  const getStockStatus = () => {
    const current = material.currentStock || 0;
    const reorder = material.reorderPoint || 10;
    const max = material.maxStock || 100;

    if (current === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    } else if (current <= reorder) {
      return { label: "Low Stock", variant: "secondary" as const };
    } else if (current >= max * 0.9) {
      return { label: "High Stock", variant: "default" as const };
    } else {
      return { label: "In Stock", variant: "outline" as const };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold" data-testid="text-material-name">
            {material.materialType} - {material.grade}
          </h3>
          <p className="text-gray-600 mt-1">SKU: {material.sku}</p>
        </div>
        <Badge variant={stockStatus.variant} className="text-sm" data-testid="badge-stock-status">
          {stockStatus.label}
        </Badge>
      </div>

      <Separator />

      {/* Material Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Material Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Material Type</p>
            <p className="font-semibold" data-testid="text-material-type">{material.materialType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Grade</p>
            <p className="font-semibold" data-testid="text-grade">{material.grade}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Shape</p>
            <p className="font-semibold" data-testid="text-shape">{material.shape}</p>
          </div>
          {material.diameter && material.diameter > 0 && (
            <div>
              <p className="text-sm text-gray-600">Diameter</p>
              <p className="font-semibold" data-testid="text-diameter">{material.diameter} mm</p>
            </div>
          )}
          {material.thickness && material.thickness > 0 && (
            <div>
              <p className="text-sm text-gray-600">Thickness</p>
              <p className="font-semibold" data-testid="text-thickness">{material.thickness} mm</p>
            </div>
          )}
          {material.width && material.width > 0 && (
            <div>
              <p className="text-sm text-gray-600">Width</p>
              <p className="font-semibold" data-testid="text-width">{material.width} mm</p>
            </div>
          )}
          {material.length !== null && material.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600">Length</p>
              <p className="font-semibold" data-testid="text-length">{material.length} mm</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stock Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Stock Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Stock</p>
            <p className="text-2xl font-bold" data-testid="text-current-stock">
              {material.currentStock || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reorder Point</p>
            <p className="text-lg font-semibold" data-testid="text-reorder-point">
              {material.reorderPoint || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maximum Stock</p>
            <p className="text-lg font-semibold" data-testid="text-max-stock">
              {material.maxStock || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available Stock</p>
            <p className="text-lg font-semibold text-green-600" data-testid="text-available-stock">
              {material.currentStock || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supply Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Supply Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Supplier</p>
            <p className="font-semibold" data-testid="text-supplier">{material.supplier}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unit Cost</p>
            <p className="font-semibold" data-testid="text-unit-cost">
              <DollarSign className="h-4 w-4 inline" />
              {material.unitCost?.toFixed(2) || '0.00'}
            </p>
          </div>
          {material.location && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Storage Location</p>
              <p className="font-semibold flex items-center gap-2" data-testid="text-location">
                <MapPin className="h-4 w-4" />
                {material.location}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {material.specifications && material.specifications !== '' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Additional Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap" data-testid="text-specifications">
              {typeof material.specifications === 'string' 
                ? material.specifications 
                : JSON.stringify(material.specifications, null, 2)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stock Management */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Management</CardTitle>
          <CardDescription>Adjust inventory levels for this material</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setIsStockDialogOpen(true)}
            data-testid="button-adjust-stock"
          >
            <TrendingUp className="mr-2 h-4 w-4" /> Adjust Stock
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onEdit && (
          <Button onClick={onEdit} variant="outline" data-testid="button-edit-material">
            Edit Material
          </Button>
        )}
        <Button onClick={onClose} data-testid="button-close">
          Close
        </Button>
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>
              Current stock: {material.currentStock || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustment-type">Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                <SelectTrigger id="adjustment-type" data-testid="select-adjustment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                  <SelectItem value="set">Set Stock Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                data-testid="input-adjustment-quantity"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g., Received shipment, stock count correction"
                data-testid="input-adjustment-reason"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={adjustmentNotes}
                onChange={(e) => setAdjustmentNotes(e.target.value)}
                data-testid="textarea-adjustment-notes"
              />
            </div>
            <Button 
              onClick={handleStockUpdate} 
              disabled={updateStockMutation.isPending}
              className="w-full"
              data-testid="button-confirm-stock-update"
            >
              {updateStockMutation.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
