import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Edit, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GeneralItemForm } from "./GeneralItemForm";

interface GeneralItemDetailsProps {
  id: string;
}

export function GeneralItemDetails({ id }: GeneralItemDetailsProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const { data: item, isLoading } = useQuery<any>({
    queryKey: ['/api/inventory/general-items', id],
    enabled: !!id,
  });

  const updateStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/inventory/general-items/${id}/update-stock`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/general-items'] });
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
    const quantity = parseInt(adjustmentQuantity);
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
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>General Item Not Found</CardTitle>
              <CardDescription>The requested general item could not be found.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/inventory")} data-testid="button-back-to-inventory">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const currentStock = item.currentStock || 0;
  const minStock = item.minStockLevel || 0;
  const stockStatus = currentStock === 0 ? 'out' : currentStock <= minStock ? 'low' : 'ok';

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/inventory")}
              data-testid="button-back-to-inventory"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-item-name">{item.name}</h1>
              <p className="text-muted-foreground" data-testid="text-item-sku">SKU: {item.sku}</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsEditDialogOpen(true)}
            data-testid="button-edit-item"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Item
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-current-stock">
                {currentStock} pieces
              </div>
              {stockStatus === 'out' && (
                <Badge variant="destructive" className="mt-2">Out of Stock</Badge>
              )}
              {stockStatus === 'low' && (
                <Badge variant="outline" className="mt-2 border-orange-500 text-orange-500">Low Stock</Badge>
              )}
              {stockStatus === 'ok' && (
                <Badge variant="outline" className="mt-2 border-green-500 text-green-500">In Stock</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Min Stock Level</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{minStock} pieces</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unit Cost</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${item.unitCost}</div>
              <p className="text-xs text-muted-foreground mt-1">per piece</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium" data-testid="text-category">{item.category}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Model/Part Number</Label>
                <p className="font-medium" data-testid="text-model">{item.model || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Manufacturer</Label>
                <p className="font-medium" data-testid="text-manufacturer">{item.manufacturer || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Condition</Label>
                <p className="font-medium" data-testid="text-condition">{item.condition || '-'}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Supplier</Label>
                <p className="font-medium" data-testid="text-supplier">{item.supplier || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Storage Location</Label>
                <p className="font-medium" data-testid="text-location">{item.storageLocation || '-'}</p>
              </div>
            </div>

            {item.notes && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1" data-testid="text-notes">{item.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Management</CardTitle>
            <CardDescription>Adjust inventory levels for this item</CardDescription>
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
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit General Item</DialogTitle>
            <DialogDescription>Update item information</DialogDescription>
          </DialogHeader>
          <GeneralItemForm 
            item={item}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['/api/inventory/general-items'] });
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock Level</DialogTitle>
            <DialogDescription>
              Current stock: {currentStock} pieces
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
              <Label htmlFor="quantity">Quantity (pieces)</Label>
              <Input
                id="quantity"
                type="number"
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
                placeholder="e.g., Received shipment, item returned"
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
