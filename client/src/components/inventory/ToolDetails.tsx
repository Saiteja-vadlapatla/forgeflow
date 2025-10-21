import { useQuery } from "@tanstack/react-query";
import { Wrench, DollarSign, MapPin, Ruler, Box, Info, AlertCircle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InventoryTool, InsertInventoryTool } from "@shared/schema";

// Extended type to include currentStock which is handled in-memory
type InventoryToolWithStock = InventoryTool & { currentStock?: number };
import { Button } from "@/components/ui/button";

interface ToolDetailsProps {
  toolId: string;
  onEdit?: () => void;
  onClose: () => void;
}

export function ToolDetails({ toolId, onEdit, onClose }: ToolDetailsProps) {
  const { data: tools = [], isLoading } = useQuery<InventoryToolWithStock[]>({
    queryKey: ["/api/inventory/tools"],
  });

  const tool = tools.find(t => t.id === toolId);

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading tool details...</p>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Tool not found</p>
        <Button onClick={onClose} className="mt-4" data-testid="button-close-not-found">
          Close
        </Button>
      </div>
    );
  }

  const getStockStatus = () => {
    const current = tool.currentStock || 0;
    const reorder = tool.reorderPoint || 5;
    const max = tool.maxStock || 50;

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
          <h3 className="text-2xl font-bold" data-testid="text-tool-name">
            {tool.toolType} - {tool.manufacturer} {tool.model}
          </h3>
          <p className="text-gray-600 mt-1">SKU: {tool.sku}</p>
        </div>
        <Badge variant={stockStatus.variant} className="text-sm" data-testid="badge-stock-status">
          {stockStatus.label}
        </Badge>
      </div>

      <Separator />

      {/* Tool Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Tool Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tool Type</p>
            <p className="font-semibold" data-testid="text-tool-type">{tool.toolType}</p>
          </div>
          {tool.subType && (
            <div>
              <p className="text-sm text-gray-600">Sub Type</p>
              <p className="font-semibold" data-testid="text-sub-type">{tool.subType}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Manufacturer</p>
            <p className="font-semibold" data-testid="text-manufacturer">{tool.manufacturer}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Model</p>
            <p className="font-semibold" data-testid="text-model">{tool.model}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Size</p>
            <p className="font-semibold" data-testid="text-size">{tool.size} mm</p>
          </div>
          {tool.length && tool.length > 0 && (
            <div>
              <p className="text-sm text-gray-600">Length</p>
              <p className="font-semibold" data-testid="text-length">{tool.length} mm</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Material</p>
            <p className="font-semibold" data-testid="text-material">{tool.material}</p>
          </div>
          {tool.coating && (
            <div>
              <p className="text-sm text-gray-600">Coating</p>
              <p className="font-semibold" data-testid="text-coating">{tool.coating}</p>
            </div>
          )}
          {tool.geometry && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Geometry</p>
              <p className="font-semibold" data-testid="text-geometry">{tool.geometry}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Information */}
      {((tool.applicationMaterial && tool.applicationMaterial.length > 0) || 
       (tool.operationType && tool.operationType.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Application Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tool.applicationMaterial && tool.applicationMaterial.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Application Materials</p>
                <div className="flex flex-wrap gap-2" data-testid="list-application-materials">
                  {tool.applicationMaterial.map((material) => (
                    <Badge key={material} variant="outline">{material}</Badge>
                  ))}
                </div>
              </div>
            )}
            {tool.operationType && tool.operationType.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Operation Types</p>
                <div className="flex flex-wrap gap-2" data-testid="list-operation-types">
                  {tool.operationType.map((operation) => (
                    <Badge key={operation} variant="secondary">{operation}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              {tool.currentStock || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Reorder Point</p>
            <p className="text-lg font-semibold" data-testid="text-reorder-point">
              {tool.reorderPoint || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maximum Stock</p>
            <p className="text-lg font-semibold" data-testid="text-max-stock">
              {tool.maxStock || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Available Stock</p>
            <p className="text-lg font-semibold text-green-600" data-testid="text-available-stock">
              {tool.currentStock || 0}
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
            <p className="font-semibold" data-testid="text-supplier">{tool.supplier}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unit Cost</p>
            <p className="font-semibold" data-testid="text-unit-cost">
              <DollarSign className="h-4 w-4 inline" />
              {tool.unitCost?.toFixed(2) || '0.00'}
            </p>
          </div>
          {tool.location && (
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Storage Location</p>
              <p className="font-semibold flex items-center gap-2" data-testid="text-location">
                <MapPin className="h-4 w-4" />
                {tool.location}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {tool.specifications && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Additional Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap" data-testid="text-specifications">
              {typeof tool.specifications === 'string' 
                ? tool.specifications 
                : JSON.stringify(tool.specifications, null, 2)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onEdit && (
          <Button onClick={onEdit} variant="outline" data-testid="button-edit-tool">
            Edit Tool
          </Button>
        )}
        <Button onClick={onClose} data-testid="button-close">
          Close
        </Button>
      </div>
    </div>
  );
}
