import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Edit, TrendingDown, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConsumableForm } from "./ConsumableForm";
import { StockAdjustment } from "@/components/inventory/StockAdjustment";

interface ConsumableDetailsProps {
  id: string;
}

export function ConsumableDetails({ id }: ConsumableDetailsProps) {
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: consumable, isLoading } = useQuery<any>({
    queryKey: ['/api/inventory/consumables', id],
    enabled: !!id,
  });

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

  if (!consumable) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Consumable Not Found</CardTitle>
              <CardDescription>The requested consumable could not be found.</CardDescription>
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

  const currentStock = consumable.currentStock || 0;
  const minStock = consumable.minStockLevel || 0;
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
              <h1 className="text-3xl font-bold" data-testid="text-consumable-name">{consumable.name}</h1>
              <p className="text-muted-foreground" data-testid="text-consumable-sku">SKU: {consumable.sku}</p>
            </div>
          </div>
          <Button 
            onClick={() => setIsEditDialogOpen(true)}
            data-testid="button-edit-consumable"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Consumable
          </Button>
        </div>

        {/* Stock Adjustment */}
        <StockAdjustment
          itemId={id}
          itemType="consumables"
          currentStock={consumable.currentStock || 0}
          itemName={consumable.name}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-current-stock">
                {currentStock} {consumable.unit}
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
              <div className="text-2xl font-bold">{minStock} {consumable.unit}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unit Cost</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${consumable.unitCost}</div>
              <p className="text-xs text-muted-foreground mt-1">per {consumable.unit}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Consumable Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium" data-testid="text-category">{consumable.category}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Grade/Specification</Label>
                <p className="font-medium" data-testid="text-grade">{consumable.grade || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Viscosity</Label>
                <p className="font-medium" data-testid="text-viscosity">{consumable.viscosity || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Volume Per Unit</Label>
                <p className="font-medium" data-testid="text-volume">{consumable.volumePerUnit} {consumable.volumeUnit}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Supplier</Label>
                <p className="font-medium" data-testid="text-supplier">{consumable.supplier || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Storage Location</Label>
                <p className="font-medium" data-testid="text-location">{consumable.storageLocation || '-'}</p>
              </div>
            </div>

            {consumable.notes && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1" data-testid="text-notes">{consumable.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Consumable</DialogTitle>
          </DialogHeader>
          <ConsumableForm 
            consumable={consumable}
            isEditing={true}
            onSuccess={() => {
              setIsEditDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
