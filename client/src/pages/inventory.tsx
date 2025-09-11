import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Package, Wrench, Filter, RefreshCw } from "lucide-react";
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
import { InventoryUpdateDialog } from "@/components/inventory/InventoryUpdateDialog";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAddingTool, setIsAddingTool] = useState(false);

  const { data: rawMaterials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ["/api/inventory/materials"],
  });

  const { data: tools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ["/api/inventory/tools"],
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">
            <Package className="h-4 w-4 mr-2" />
            Raw Materials ({rawMaterials.length})
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Wrench className="h-4 w-4 mr-2" />
            Tools ({tools.length})
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
                      <Button size="sm" variant="outline" className="flex-1">
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
                      <Button size="sm" variant="outline" className="flex-1">
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
      </div>
    </ResponsiveLayout>
  );
}