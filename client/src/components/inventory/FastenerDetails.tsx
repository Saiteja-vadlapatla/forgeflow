import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Package,
  Edit,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FastenerForm } from "./FastenerForm";
import { StockAdjustment } from "@/components/inventory/StockAdjustment";
import { StockAdjustmentHistory } from "@/components/inventory/StockAdjustmentHistory";

interface FastenerDetailsProps {
  id: string;
}

export function FastenerDetails({ id }: FastenerDetailsProps) {
  const [, navigate] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: fastener, isLoading } = useQuery<any>({
    queryKey: ["/api/inventory/fasteners", id],
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

  if (!fastener) {
    return (
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Fastener Not Found</CardTitle>
              <CardDescription>
                The requested fastener could not be found.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={() => navigate("/inventory")}
                data-testid="button-back-to-inventory"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const currentStock = fastener.currentStock || 0;
  const minStock = fastener.minStockLevel || 0;
  const stockStatus =
    currentStock === 0 ? "out" : currentStock <= minStock ? "low" : "ok";

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
              <h1
                className="text-3xl font-bold"
                data-testid="text-fastener-name"
              >
                {fastener.name}
              </h1>
              <p
                className="text-muted-foreground"
                data-testid="text-fastener-sku"
              >
                SKU: {fastener.sku}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsEditDialogOpen(true)}
            data-testid="button-edit-fastener"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit Fastener
          </Button>
        </div>

        {/* Stock Adjustment */}
        <StockAdjustment
          itemId={id}
          itemType="fasteners"
          currentStock={fastener.currentStock || 0}
          itemName={fastener.name}
        />

        {/* Stock Adjustment History */}
        <StockAdjustmentHistory itemId={id} itemType="fasteners" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Stock
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                data-testid="text-current-stock"
              >
                {currentStock} pieces
              </div>
              {stockStatus === "out" && (
                <Badge variant="destructive" className="mt-2">
                  Out of Stock
                </Badge>
              )}
              {stockStatus === "low" && (
                <Badge
                  variant="outline"
                  className="mt-2 border-orange-500 text-orange-500"
                >
                  Low Stock
                </Badge>
              )}
              {stockStatus === "ok" && (
                <Badge
                  variant="outline"
                  className="mt-2 border-green-500 text-green-500"
                >
                  In Stock
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Min Stock Level
              </CardTitle>
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
              <div className="text-2xl font-bold">${fastener.unitCost}</div>
              <p className="text-xs text-muted-foreground mt-1">per piece</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fastener Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Thread Type</Label>
                <p className="font-medium" data-testid="text-thread-type">
                  {fastener.threadType}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Size (Nominal Diameter)
                </Label>
                <p className="font-medium" data-testid="text-size">
                  {fastener.size} mm
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Thread Pitch</Label>
                <p className="font-medium" data-testid="text-pitch">
                  {fastener.pitch} mm
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Length</Label>
                <p className="font-medium" data-testid="text-length">
                  {fastener.length} mm
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Material</Label>
                <p className="font-medium" data-testid="text-material">
                  {fastener.material}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Grade/Strength</Label>
                <p className="font-medium" data-testid="text-grade">
                  {fastener.grade || "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Finish/Coating</Label>
                <p className="font-medium" data-testid="text-finish">
                  {fastener.finish || "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Head Type</Label>
                <p className="font-medium" data-testid="text-head-type">
                  {fastener.headType || "-"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Supplier</Label>
                <p className="font-medium" data-testid="text-supplier">
                  {fastener.supplier || "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Storage Location
                </Label>
                <p className="font-medium" data-testid="text-location">
                  {fastener.storageLocation || "-"}
                </p>
              </div>
            </div>

            {fastener.notes && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1" data-testid="text-notes">
                    {fastener.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Fastener</DialogTitle>
          </DialogHeader>
          <FastenerForm
            fastener={fastener}
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
