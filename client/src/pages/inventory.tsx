import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Package, Wrench, Filter, RefreshCw, Droplet, Hammer, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollableDialog, ScrollableDialogContent, ScrollableDialogHeader, ScrollableDialogTitle, ScrollableDialogTrigger } from "@/components/ui/scrollable-dialog";
import { RawMaterial, InventoryTool } from "@shared/schema";
import { RawMaterialForm } from "@/components/inventory/RawMaterialForm";
import { ToolForm } from "@/components/inventory/ToolForm";
import { ConsumableForm } from "@/components/inventory/ConsumableForm";
import { FastenerForm } from "@/components/inventory/FastenerForm";
import { GeneralItemForm } from "@/components/inventory/GeneralItemForm";
import { InventoryUpdateDialog } from "@/components/inventory/InventoryUpdateDialog";
import { RawMaterialDetails } from "@/components/inventory/RawMaterialDetails";
import { ToolDetails } from "@/components/inventory/ToolDetails";
import { ConsumableDetails } from "@/components/inventory/ConsumableDetails";
import { FastenerDetails } from "@/components/inventory/FastenerDetails";
import { GeneralItemDetails } from "@/components/inventory/GeneralItemDetails";
import { RawMaterialEdit } from "@/components/inventory/RawMaterialEdit";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [isAddingConsumable, setIsAddingConsumable] = useState(false);
  const [isAddingFastener, setIsAddingFastener] = useState(false);
  const [isAddingGeneralItem, setIsAddingGeneralItem] = useState(false);
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);
  const [viewingToolId, setViewingToolId] = useState<string | null>(null);
  const [viewingConsumableId, setViewingConsumableId] = useState<string | null>(null);
  const [viewingFastenerId, setViewingFastenerId] = useState<string | null>(null);
  const [viewingGeneralItemId, setViewingGeneralItemId] = useState<string | null>(null);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  const { data: rawMaterials = [], isLoading: materialsLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory/materials"],
  });

  const { data: tools = [], isLoading: toolsLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory/tools"],
  });

  const { data: consumables = [], isLoading: consumablesLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory/consumables"],
  });

  const { data: fasteners = [], isLoading: fastenersLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory/fasteners"],
  });

  const { data: generalItems = [], isLoading: generalItemsLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory/general-items"],
  });

  const filteredMaterials = rawMaterials.filter((material: RawMaterial) => {
    const matchesSearch = material.materialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === "all" || material.materialType === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const filteredTools = tools.filter((tool: InventoryTool) => {
    const matchesSearch = tool.toolType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStockStatusBadge = (current: number, reorder: number, max: number) => {
    if (current === 0) {
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    } else if (current <= reorder) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    } else if (current >= max * 0.9) {
      return <Badge className="bg-blue-100 text-blue-800">High Stock</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
    }
  };

  return (
    <ResponsiveLayout isConnected={true}>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Manage raw materials and tools inventory</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Inventory
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by SKU, material type, or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Steel">Steel</SelectItem>
                  <SelectItem value="Aluminum">Aluminum</SelectItem>
                  <SelectItem value="Stainless Steel">Stainless Steel</SelectItem>
                  <SelectItem value="Brass">Brass</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Tabs */}
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="materials">
            <Package className="h-4 w-4 mr-2" />
            Raw Materials ({rawMaterials.length})
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Wrench className="h-4 w-4 mr-2" />
            Tools ({tools.length})
          </TabsTrigger>
          <TabsTrigger value="consumables">
            <Droplet className="h-4 w-4 mr-2" />
            Consumables ({consumables.length})
          </TabsTrigger>
          <TabsTrigger value="fasteners">
            <Hammer className="h-4 w-4 mr-2" />
            Fasteners ({fasteners.length})
          </TabsTrigger>
          <TabsTrigger value="general">
            <Box className="h-4 w-4 mr-2" />
            General ({generalItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Raw Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Raw Materials Inventory</h2>
            <ScrollableDialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
              <ScrollableDialogTrigger asChild>
                <Button data-testid="button-add-material">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </ScrollableDialogTrigger>
              <ScrollableDialogContent className="max-w-4xl">
                <ScrollableDialogHeader>
                  <ScrollableDialogTitle>Add Raw Material</ScrollableDialogTitle>
                </ScrollableDialogHeader>
                <RawMaterialForm onSuccess={() => setIsAddingMaterial(false)} />
              </ScrollableDialogContent>
            </ScrollableDialog>
          </div>

          {materialsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material: RawMaterial & { currentStock?: number; reorderPoint?: number }) => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{material.materialType}</h3>
                        <p className="text-sm text-gray-600">{material.grade}</p>
                        <p className="text-xs text-gray-500">SKU: {material.sku}</p>
                      </div>
                      {getStockStatusBadge(
                        material.currentStock || 0,
                        material.reorderPoint || 10,
                        material.maxStock || 100
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Shape:</span>
                        <span className="font-medium">{material.shape}</span>
                      </div>
                      {material.diameter && (
                        <div className="flex justify-between">
                          <span>Diameter:</span>
                          <span className="font-medium">{material.diameter}mm</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Supplier:</span>
                        <span className="font-medium">{material.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className="font-medium">{material.currentStock || 0} pcs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-medium">{material.location || "N/A"}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t flex space-x-2">
                      <InventoryUpdateDialog
                        type="material"
                        item={material}
                        trigger={
                          <Button size="sm" variant="outline" className="flex-1">
                            Update Stock
                          </Button>
                        }
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setViewingMaterialId(material.id)}
                        data-testid={`button-details-material-${material.id}`}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tools Inventory</h2>
            <ScrollableDialog open={isAddingTool} onOpenChange={setIsAddingTool}>
              <ScrollableDialogTrigger asChild>
                <Button data-testid="button-add-tool">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </ScrollableDialogTrigger>
              <ScrollableDialogContent className="max-w-4xl">
                <ScrollableDialogHeader>
                  <ScrollableDialogTitle>Add Tool</ScrollableDialogTitle>
                </ScrollableDialogHeader>
                <ToolForm onSuccess={() => setIsAddingTool(false)} />
              </ScrollableDialogContent>
            </ScrollableDialog>
          </div>

          {toolsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool: InventoryTool & { currentStock?: number; condition?: string }) => (
                <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{tool.toolType}</h3>
                        <p className="text-sm text-gray-600">{tool.manufacturer} {tool.model}</p>
                        <p className="text-xs text-gray-500">SKU: {tool.sku}</p>
                      </div>
                      {getStockStatusBadge(
                        tool.currentStock || 0,
                        tool.reorderPoint || 5,
                        tool.maxStock || 50
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="font-medium">Ø{tool.size}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Material:</span>
                        <span className="font-medium">{tool.material}</span>
                      </div>
                      {tool.coating && (
                        <div className="flex justify-between">
                          <span>Coating:</span>
                          <span className="font-medium">{tool.coating}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className="font-medium">{tool.currentStock || 0} pcs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Condition:</span>
                        <Badge 
                          className={
                            tool.condition === "new" ? "bg-green-100 text-green-800" :
                            tool.condition === "used" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          {tool.condition || "new"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="font-medium">{tool.location || "Tool Crib"}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t flex space-x-2">
                      <InventoryUpdateDialog
                        type="tool"
                        item={tool}
                        trigger={
                          <Button size="sm" variant="outline" className="flex-1">
                            Update Stock
                          </Button>
                        }
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setViewingToolId(tool.id)}
                        data-testid={`button-details-tool-${tool.id}`}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Consumables Tab */}
        <TabsContent value="consumables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Consumables Inventory</h2>
            <ScrollableDialog open={isAddingConsumable} onOpenChange={setIsAddingConsumable}>
              <ScrollableDialogTrigger asChild>
                <Button data-testid="button-add-consumable">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Consumable
                </Button>
              </ScrollableDialogTrigger>
              <ScrollableDialogContent className="max-w-4xl">
                <ScrollableDialogHeader>
                  <ScrollableDialogTitle>Add Consumable</ScrollableDialogTitle>
                </ScrollableDialogHeader>
                <ConsumableForm onSuccess={() => setIsAddingConsumable(false)} />
              </ScrollableDialogContent>
            </ScrollableDialog>
          </div>

          {consumablesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consumables.map((consumable: any) => (
                <Card key={consumable.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{consumable.name}</h3>
                        <p className="text-sm text-gray-600">{consumable.category}</p>
                        <p className="text-xs text-gray-500">SKU: {consumable.sku}</p>
                      </div>
                      {getStockStatusBadge(
                        consumable.currentStock || 0,
                        consumable.minStockLevel || 10,
                        consumable.maxStockLevel || 100
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Grade:</span>
                        <span className="font-medium">{consumable.grade || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <span className="font-medium">{consumable.volumePerUnit} {consumable.volumeUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className="font-medium">{consumable.currentStock || 0} {consumable.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Supplier:</span>
                        <span className="font-medium">{consumable.supplier || '-'}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setViewingConsumableId(consumable.id)}
                        data-testid={`button-details-consumable-${consumable.id}`}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Fasteners Tab */}
        <TabsContent value="fasteners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Fasteners Inventory</h2>
            <ScrollableDialog open={isAddingFastener} onOpenChange={setIsAddingFastener}>
              <ScrollableDialogTrigger asChild>
                <Button data-testid="button-add-fastener">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fastener
                </Button>
              </ScrollableDialogTrigger>
              <ScrollableDialogContent className="max-w-4xl">
                <ScrollableDialogHeader>
                  <ScrollableDialogTitle>Add Fastener</ScrollableDialogTitle>
                </ScrollableDialogHeader>
                <FastenerForm onSuccess={() => setIsAddingFastener(false)} />
              </ScrollableDialogContent>
            </ScrollableDialog>
          </div>

          {fastenersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fasteners.map((fastener: any) => (
                <Card key={fastener.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{fastener.name}</h3>
                        <p className="text-sm text-gray-600">{fastener.threadType} {fastener.size}mm</p>
                        <p className="text-xs text-gray-500">SKU: {fastener.sku}</p>
                      </div>
                      {getStockStatusBadge(
                        fastener.currentStock || 0,
                        fastener.minStockLevel || 100,
                        fastener.maxStockLevel || 1000
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Pitch:</span>
                        <span className="font-medium">{fastener.pitch}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Length:</span>
                        <span className="font-medium">{fastener.length}mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Material:</span>
                        <span className="font-medium">{fastener.material}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className="font-medium">{fastener.currentStock || 0} pcs</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setViewingFastenerId(fastener.id)}
                        data-testid={`button-details-fastener-${fastener.id}`}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* General Items Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">General Items Inventory</h2>
            <ScrollableDialog open={isAddingGeneralItem} onOpenChange={setIsAddingGeneralItem}>
              <ScrollableDialogTrigger asChild>
                <Button data-testid="button-add-general-item">
                  <Plus className="h-4 w-4 mr-2" />
                  Add General Item
                </Button>
              </ScrollableDialogTrigger>
              <ScrollableDialogContent className="max-w-4xl">
                <ScrollableDialogHeader>
                  <ScrollableDialogTitle>Add General Item</ScrollableDialogTitle>
                </ScrollableDialogHeader>
                <GeneralItemForm onSuccess={() => setIsAddingGeneralItem(false)} />
              </ScrollableDialogContent>
            </ScrollableDialog>
          </div>

          {generalItemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generalItems.map((item: any) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      </div>
                      {getStockStatusBadge(
                        item.currentStock || 0,
                        item.minStockLevel || 5,
                        item.maxStockLevel || 50
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="font-medium">{item.model || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Manufacturer:</span>
                        <span className="font-medium">{item.manufacturer || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Condition:</span>
                        <Badge className="bg-green-100 text-green-800">{item.condition}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Stock:</span>
                        <span className="font-medium">{item.currentStock || 0} pcs</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setViewingGeneralItemId(item.id)}
                        data-testid={`button-details-general-item-${item.id}`}
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Details Dialogs */}
      <ScrollableDialog 
        open={viewingMaterialId !== null} 
        onOpenChange={(open) => !open && setViewingMaterialId(null)}
      >
        <ScrollableDialogContent className="max-w-4xl">
          <ScrollableDialogHeader>
            <ScrollableDialogTitle>Raw Material Details</ScrollableDialogTitle>
          </ScrollableDialogHeader>
          {viewingMaterialId && (
            <RawMaterialDetails
              materialId={viewingMaterialId}
              onEdit={() => {
                setEditingMaterialId(viewingMaterialId);
                setViewingMaterialId(null);
              }}
              onClose={() => setViewingMaterialId(null)}
            />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      {/* Edit Dialogs */}
      <ScrollableDialog 
        open={editingMaterialId !== null} 
        onOpenChange={(open) => !open && setEditingMaterialId(null)}
      >
        <ScrollableDialogContent className="max-w-4xl">
          <ScrollableDialogHeader>
            <ScrollableDialogTitle>Edit Raw Material</ScrollableDialogTitle>
          </ScrollableDialogHeader>
          {editingMaterialId && (
            <RawMaterialEdit
              materialId={editingMaterialId}
              onSuccess={() => setEditingMaterialId(null)}
            />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      <ScrollableDialog 
        open={viewingToolId !== null} 
        onOpenChange={(open) => !open && setViewingToolId(null)}
      >
        <ScrollableDialogContent className="max-w-4xl">
          <ScrollableDialogHeader>
            <ScrollableDialogTitle>Tool Details</ScrollableDialogTitle>
          </ScrollableDialogHeader>
          {viewingToolId && (
            <ToolDetails
              toolId={viewingToolId}
              onClose={() => setViewingToolId(null)}
            />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      <ScrollableDialog 
        open={viewingConsumableId !== null} 
        onOpenChange={(open) => !open && setViewingConsumableId(null)}
      >
        <ScrollableDialogContent className="max-w-5xl max-h-[90vh]">
          {viewingConsumableId && (
            <ConsumableDetails id={viewingConsumableId} />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      <ScrollableDialog 
        open={viewingFastenerId !== null} 
        onOpenChange={(open) => !open && setViewingFastenerId(null)}
      >
        <ScrollableDialogContent className="max-w-5xl max-h-[90vh]">
          {viewingFastenerId && (
            <FastenerDetails id={viewingFastenerId} />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      <ScrollableDialog 
        open={viewingGeneralItemId !== null} 
        onOpenChange={(open) => !open && setViewingGeneralItemId(null)}
      >
        <ScrollableDialogContent className="max-w-5xl max-h-[90vh]">
          {viewingGeneralItemId && (
            <GeneralItemDetails id={viewingGeneralItemId} />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>
      </div>
    </ResponsiveLayout>
  );
}