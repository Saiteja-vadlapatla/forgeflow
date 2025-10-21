import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Wrench, RefreshCw, Droplet, Hammer, Box, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollableDialog, ScrollableDialogContent, ScrollableDialogHeader, ScrollableDialogTitle, ScrollableDialogTrigger } from "@/components/ui/scrollable-dialog";
import { RawMaterial, InventoryTool } from "@shared/schema";
import { RawMaterialForm } from "@/components/inventory/RawMaterialForm";
import { ToolForm } from "@/components/inventory/ToolForm";
import { ConsumableForm } from "@/components/inventory/ConsumableForm";
import { FastenerForm } from "@/components/inventory/FastenerForm";
import { GeneralItemForm } from "@/components/inventory/GeneralItemForm";
import { RawMaterialDetails } from "@/components/inventory/RawMaterialDetails";
import { ToolDetails } from "@/components/inventory/ToolDetails";
import { ConsumableDetails } from "@/components/inventory/ConsumableDetails";
import { FastenerDetails } from "@/components/inventory/FastenerDetails";
import { GeneralItemDetails } from "@/components/inventory/GeneralItemDetails";
import { RawMaterialEdit } from "@/components/inventory/RawMaterialEdit";
import { InventoryTable, ColumnDef } from "@/components/inventory/InventoryTable";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { ExportInventoryDialog } from "@/components/inventory/ExportInventoryDialog";

export function InventoryPage() {
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
  const [editingConsumableId, setEditingConsumableId] = useState<string | null>(null);
  const [editingFastenerId, setEditingFastenerId] = useState<string | null>(null);
  const [editingGeneralItemId, setEditingGeneralItemId] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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

  // Column definitions for Raw Materials
  const materialColumns: ColumnDef<any>[] = [
    { header: "SKU", accessor: "sku", sortable: true },
    { header: "Material Type", accessor: "materialType", sortable: true },
    { header: "Grade", accessor: "grade", sortable: true },
    { header: "Shape", accessor: "shape", sortable: true },
    { 
      header: "Stock", 
      accessor: "currentStock",
      sortable: true,
      cell: (value) => value || 0
    },
    { header: "Supplier", accessor: "supplier", sortable: true },
  ];

  // Column definitions for Tools
  const toolColumns: ColumnDef<any>[] = [
    { header: "SKU", accessor: "sku", sortable: true },
    { header: "Tool Type", accessor: "toolType", sortable: true },
    { header: "Manufacturer", accessor: "manufacturer", sortable: true },
    { header: "Model", accessor: "model", sortable: true },
    { 
      header: "Size (mm)", 
      accessor: "size",
      sortable: true
    },
    {
      header: "Stock",
      accessor: "currentStock",
      sortable: true,
      cell: (value) => value || 0
    },
    { header: "Supplier", accessor: "supplier", sortable: true },
  ];

  // Column definitions for Consumables
  const consumableColumns: ColumnDef<any>[] = [
    { header: "SKU", accessor: "sku", sortable: true },
    { header: "Name", accessor: "name", sortable: true },
    { header: "Category", accessor: "category", sortable: true },
    { header: "Manufacturer", accessor: "manufacturer", sortable: true },
    {
      header: "Stock",
      accessor: "currentStock",
      sortable: true,
      cell: (value) => value || 0
    },
    { header: "Supplier", accessor: "supplier", sortable: true },
  ];

  // Column definitions for Fasteners
  const fastenerColumns: ColumnDef<any>[] = [
    { header: "SKU", accessor: "sku", sortable: true },
    { header: "Type", accessor: "fastenerType", sortable: true },
    { header: "Thread", accessor: "threadDescription", sortable: true },
    { header: "Material", accessor: "material", sortable: true },
    {
      header: "Stock",
      accessor: "currentStock",
      sortable: true,
      cell: (value) => value || 0
    },
    { header: "Supplier", accessor: "supplier", sortable: true },
  ];

  // Column definitions for General Items
  const generalItemColumns: ColumnDef<any>[] = [
    { header: "SKU", accessor: "sku", sortable: true },
    { header: "Name", accessor: "name", sortable: true },
    { header: "Category", accessor: "category", sortable: true },
    { header: "Manufacturer", accessor: "manufacturer", sortable: true },
    {
      header: "Stock",
      accessor: "currentStock",
      sortable: true,
      cell: (value) => value || 0
    },
    { header: "Supplier", accessor: "supplier", sortable: true },
  ];

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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            data-testid="button-export-inventory"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Inventory
          </Button>
        </div>
      </div>


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
            <div className="text-center py-8">Loading materials...</div>
          ) : (
            <InventoryTable
              data={rawMaterials}
              columns={materialColumns}
              onView={(item) => setViewingMaterialId(item.id)}
              onEdit={(item) => setEditingMaterialId(item.id)}
              searchPlaceholder="Search materials by SKU, type, grade, supplier..."
            />
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
            <div className="text-center py-8">Loading tools...</div>
          ) : (
            <InventoryTable
              data={tools}
              columns={toolColumns}
              onView={(item) => setViewingToolId(item.id)}
              onEdit={(item) => window.alert('Tool edit coming soon - use view details for now')}
              searchPlaceholder="Search tools by SKU, type, manufacturer, model..."
            />
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
            <div className="text-center py-8">Loading consumables...</div>
          ) : (
            <InventoryTable
              data={consumables}
              columns={consumableColumns}
              onView={(item) => setViewingConsumableId(item.id)}
              onEdit={(item) => setEditingConsumableId(item.id)}
              searchPlaceholder="Search consumables by SKU, name, category, supplier..."
            />
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
            <div className="text-center py-8">Loading fasteners...</div>
          ) : (
            <InventoryTable
              data={fasteners}
              columns={fastenerColumns}
              onView={(item) => setViewingFastenerId(item.id)}
              onEdit={(item) => setEditingFastenerId(item.id)}
              searchPlaceholder="Search fasteners by SKU, type, thread, material, supplier..."
            />
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
            <div className="text-center py-8">Loading general items...</div>
          ) : (
            <InventoryTable
              data={generalItems}
              columns={generalItemColumns}
              onView={(item) => setViewingGeneralItemId(item.id)}
              onEdit={(item) => setEditingGeneralItemId(item.id)}
              searchPlaceholder="Search general items by SKU, name, category, manufacturer..."
            />
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

      {/* Consumable Edit Dialog */}
      <ScrollableDialog 
        open={editingConsumableId !== null} 
        onOpenChange={(open) => !open && setEditingConsumableId(null)}
      >
        <ScrollableDialogContent className="max-w-4xl">
          <ScrollableDialogHeader>
            <ScrollableDialogTitle>Edit Consumable</ScrollableDialogTitle>
          </ScrollableDialogHeader>
          {editingConsumableId && (
            <ConsumableForm
              consumable={consumables.find((c: any) => c.id === editingConsumableId)}
              onSuccess={() => setEditingConsumableId(null)}
            />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      {/* Fastener Edit Dialog */}
      <ScrollableDialog 
        open={editingFastenerId !== null} 
        onOpenChange={(open) => !open && setEditingFastenerId(null)}
      >
        <ScrollableDialogContent className="max-w-4xl">
          <ScrollableDialogHeader>
            <ScrollableDialogTitle>Edit Fastener</ScrollableDialogTitle>
          </ScrollableDialogHeader>
          {editingFastenerId && (
            <FastenerForm
              fastener={fasteners.find((f: any) => f.id === editingFastenerId)}
              onSuccess={() => setEditingFastenerId(null)}
            />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      {/* General Item Edit Dialog */}
      <ScrollableDialog 
        open={editingGeneralItemId !== null} 
        onOpenChange={(open) => !open && setEditingGeneralItemId(null)}
      >
        <ScrollableDialogContent className="max-w-4xl">
          <ScrollableDialogHeader>
            <ScrollableDialogTitle>Edit General Item</ScrollableDialogTitle>
          </ScrollableDialogHeader>
          {editingGeneralItemId && (
            <GeneralItemForm
              item={generalItems.find((i: any) => i.id === editingGeneralItemId)}
              onSuccess={() => setEditingGeneralItemId(null)}
            />
          )}
        </ScrollableDialogContent>
      </ScrollableDialog>

      {/* Export Inventory Dialog */}
      <ExportInventoryDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        inventoryData={{
          materials: rawMaterials,
          tools: tools,
          consumables: consumables,
          fasteners: fasteners,
          generalItems: generalItems,
        }}
      />
      </div>
    </ResponsiveLayout>
  );
}