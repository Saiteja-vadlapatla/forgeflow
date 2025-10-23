import { useQuery } from "@tanstack/react-query";
import {
  Package,
  DollarSign,
  MapPin,
  Ruler,
  Box,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RawMaterial } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { StockAdjustment } from "@/components/inventory/StockAdjustment";
import { StockAdjustmentHistory } from "@/components/inventory/StockAdjustmentHistory";

// Extended type to include currentStock which is handled in-memory
type RawMaterialWithStock = RawMaterial & { currentStock?: number };

interface RawMaterialDetailsProps {
  materialId: string;
  onEdit?: () => void;
  onClose: () => void;
}

export function RawMaterialDetails({
  materialId,
  onEdit,
  onClose,
}: RawMaterialDetailsProps) {
  const { data: materials = [], isLoading } = useQuery<RawMaterialWithStock[]>({
    queryKey: ["/api/inventory/materials"],
  });

  const material = materials.find((m) => m.id === materialId);

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
        <Button
          onClick={onClose}
          className="mt-4"
          data-testid="button-close-not-found"
        >
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
    <div className="space-y-4 lg:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className="text-xl sm:text-2xl font-bold break-words"
            data-testid="text-material-name"
          >
            {material.materialType} - {material.grade}
          </h3>
          <p className="text-gray-600 mt-1 text-sm sm:text-base break-all">
            SKU: {material.sku}
          </p>
        </div>
        <Badge
          variant={stockStatus.variant}
          className="text-sm w-fit shrink-0"
          data-testid="badge-stock-status"
        >
          {stockStatus.label}
        </Badge>
      </div>

      <Separator />

      {/* Stock Adjustment */}
      <StockAdjustment
        itemId={materialId}
        itemType="materials"
        currentStock={material.currentStock || 0}
        itemName={`${material.materialType} - ${material.grade}`}
      />

      {/* Transaction History */}
      <div className="mt-6">
        <StockAdjustmentHistory itemId={materialId} itemType="raw_materials" />
      </div>

      {/* Material Specifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ruler className="h-4 w-4 sm:h-5 sm:w-5" />
            Material Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Material Type</p>
            <p className="font-semibold" data-testid="text-material-type">
              {material.materialType}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Grade</p>
            <p className="font-semibold" data-testid="text-grade">
              {material.grade}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Shape</p>
            <p className="font-semibold" data-testid="text-shape">
              {material.shape}
            </p>
          </div>
          {material.diameter && material.diameter > 0 && (
            <div>
              <p className="text-sm text-gray-600">Diameter</p>
              <p className="font-semibold" data-testid="text-diameter">
                {material.diameter} mm
              </p>
            </div>
          )}
          {material.thickness && material.thickness > 0 && (
            <div>
              <p className="text-sm text-gray-600">Thickness</p>
              <p className="font-semibold" data-testid="text-thickness">
                {material.thickness} mm
              </p>
            </div>
          )}
          {material.width && material.width > 0 && (
            <div>
              <p className="text-sm text-gray-600">Width</p>
              <p className="font-semibold" data-testid="text-width">
                {material.width} mm
              </p>
            </div>
          )}
          {material.length !== null && material.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600">Length</p>
              <p className="font-semibold" data-testid="text-length">
                {material.length} mm
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stock Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Box className="h-4 w-4 sm:h-5 sm:w-5" />
            Stock Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Stock</p>
            <p className="text-2xl font-bold" data-testid="text-current-stock">
              {material.currentStock || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reorder Point</p>
            <p
              className="text-lg font-semibold"
              data-testid="text-reorder-point"
            >
              {material.reorderPoint || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maximum Stock</p>
            <p className="text-lg font-semibold" data-testid="text-max-stock">
              {material.maxStock || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available Stock</p>
            <p
              className="text-lg font-semibold text-green-600"
              data-testid="text-available-stock"
            >
              {material.currentStock || 0}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supply Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Supply Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Supplier</p>
            <p className="font-semibold" data-testid="text-supplier">
              {material.supplier}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unit Cost</p>
            <p className="font-semibold" data-testid="text-unit-cost">
              <DollarSign className="h-4 w-4 inline" />
              {material.unitCost?.toFixed(2) || "0.00"}
            </p>
          </div>
          {material.location && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Storage Location</p>
              <p
                className="font-semibold flex items-center gap-2"
                data-testid="text-location"
              >
                <MapPin className="h-4 w-4" />
                {material.location}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {material.specifications && material.specifications !== "" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Additional Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className="text-gray-700 whitespace-pre-wrap"
              data-testid="text-specifications"
            >
              {typeof material.specifications === "string"
                ? material.specifications
                : JSON.stringify(material.specifications, null, 2)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onEdit && (
          <Button
            onClick={onEdit}
            variant="outline"
            data-testid="button-edit-material"
          >
            Edit Material
          </Button>
        )}
        <Button onClick={onClose} data-testid="button-close">
          Close
        </Button>
      </div>
    </div>
  );
}
