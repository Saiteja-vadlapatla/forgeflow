import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { utils, writeFile } from "xlsx";
import { format } from "date-fns";

interface ExportInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryData: {
    materials: any[];
    tools: any[];
    consumables: any[];
    fasteners: any[];
    generalItems: any[];
  };
}

export function ExportInventoryDialog({ open, onOpenChange, inventoryData }: ExportInventoryDialogProps) {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    try {
      setIsExporting(true);

      // Filter data by date range if specified
      const filterByDate = (items: any[]) => {
        if (!startDate && !endDate) return items;
        
        return items.filter(item => {
          if (!item.createdAt && !item.dateAdded) return true; // Include items without dates
          
          const itemDate = new Date(item.createdAt || item.dateAdded);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          
          return itemDate >= start && itemDate <= end;
        });
      };

      // Create workbook
      const workbook = utils.book_new();

      // Raw Materials sheet
      const materialsData = filterByDate(inventoryData.materials).map(item => ({
        SKU: item.sku,
        Name: item.name,
        Grade: item.grade,
        "Current Stock": item.currentStock,
        Unit: item.unit,
        "Unit Cost": item.unitCost,
        Supplier: item.supplier,
        Location: item.location || "",
        "Reorder Point": item.reorderPoint || "",
        "Max Stock": item.maxStock || "",
      }));
      if (materialsData.length > 0) {
        const ws1 = utils.json_to_sheet(materialsData);
        utils.book_append_sheet(workbook, ws1, "Raw Materials");
      }

      // Tools sheet
      const toolsData = filterByDate(inventoryData.tools).map(item => ({
        SKU: item.sku,
        Name: item.name,
        "Tool Type": item.toolType,
        "Current Stock": item.currentStock,
        "Unit Cost": item.unitCost,
        Supplier: item.supplier,
        Manufacturer: item.manufacturer || "",
        Model: item.model || "",
        Condition: item.condition || "",
        Location: item.location || "",
      }));
      if (toolsData.length > 0) {
        const ws2 = utils.json_to_sheet(toolsData);
        utils.book_append_sheet(workbook, ws2, "Tools");
      }

      // Consumables sheet
      const consumablesData = filterByDate(inventoryData.consumables).map(item => ({
        SKU: item.sku,
        Name: item.name,
        Category: item.category,
        "Current Stock": item.currentStock,
        Unit: item.unit,
        "Unit Cost": item.unitCost,
        Supplier: item.supplier,
        Manufacturer: item.manufacturer || "",
        Location: item.location || "",
        "Reorder Point": item.reorderPoint || "",
      }));
      if (consumablesData.length > 0) {
        const ws3 = utils.json_to_sheet(consumablesData);
        utils.book_append_sheet(workbook, ws3, "Consumables");
      }

      // Fasteners sheet
      const fastenersData = filterByDate(inventoryData.fasteners).map(item => ({
        SKU: item.sku,
        Name: item.name,
        Type: item.type,
        Size: item.size,
        Material: item.material,
        "Current Stock": item.currentStock,
        "Unit Cost": item.unitCost,
        Supplier: item.supplier,
        Grade: item.grade || "",
        Finish: item.finish || "",
      }));
      if (fastenersData.length > 0) {
        const ws4 = utils.json_to_sheet(fastenersData);
        utils.book_append_sheet(workbook, ws4, "Fasteners");
      }

      // General Items sheet
      const generalData = filterByDate(inventoryData.generalItems).map(item => ({
        SKU: item.sku,
        Name: item.name,
        Category: item.category,
        "Current Stock": item.currentStock,
        "Unit Cost": item.unitCost,
        Supplier: item.supplier,
        Manufacturer: item.manufacturer || "",
        Model: item.model || "",
        Condition: item.condition || "",
        Location: item.location || "",
      }));
      if (generalData.length > 0) {
        const ws5 = utils.json_to_sheet(generalData);
        utils.book_append_sheet(workbook, ws5, "General Items");
      }

      // Generate filename with date range
      const dateRangeStr = startDate && endDate 
        ? `_${format(new Date(startDate), "yyyy-MM-dd")}_to_${format(new Date(endDate), "yyyy-MM-dd")}`
        : "";
      const filename = `Inventory_Export${dateRangeStr}_${format(new Date(), "yyyy-MM-dd_HHmmss")}.xlsx`;

      // Download file
      writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Inventory data exported to ${filename}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export inventory data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Inventory Data</DialogTitle>
          <DialogDescription>
            Select a date range to filter inventory items, or leave empty to export all items.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <FormLabel htmlFor="startDate" optional>Start Date</FormLabel>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="input-start-date"
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="endDate" optional>End Date</FormLabel>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              data-testid="input-end-date"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-export"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export to Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
