import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, Download, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { utils, read, writeFile } from "xlsx";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

const INVENTORY_TYPES = [
  { value: "materials", label: "Raw Materials", icon: "📦" },
  { value: "tools", label: "Tools", icon: "🔧" },
  { value: "consumables", label: "Consumables", icon: "💧" },
  { value: "fasteners", label: "Fasteners", icon: "🛠️" },
  { value: "general-items", label: "General Items", icon: "📦" },
];

export function BulkImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: BulkImportDialogProps) {
  const [step, setStep] = useState<
    "select-type" | "upload" | "processing" | "results"
  >("select-type");
  const [selectedType, setSelectedType] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateSampleTemplate = (type: string) => {
    let headers: string[] = [];
    let sampleData: any[] = [];

    switch (type) {
      case "materials":
        headers = [
          "quantity*", // Always first and required
          "materialType*",
          "grade*",
          "shape*",
          "diameter",
          "thickness",
          "width",
          "length",
          "supplier",
          "unitCost",
          "reorderPoint",
          "maxStock",
          "location",
          "specifications",
        ];
        sampleData = [
          {
            "materialType*": "Steel",
            "grade*": "4140",
            "shape*": "Round Bar",
            diameter: 25,
            thickness: null,
            width: null,
            length: 3000,
            "quantity*": 100,
            supplier: "SteelCorp Ltd",
            unitCost: 45.5,
            reorderPoint: 10,
            maxStock: 100,
            location: "Warehouse A",
            specifications: "ASTM A29",
          },
        ];
        break;

      case "tools":
        headers = [
          "toolType*",
          "subType",
          "material*",
          "manufacturer",
          "model*",
          "size*",
          "length*",
          "quantity*", // Always first and required
          "coating",
          "applicationMaterial",
          "operationType",
          "supplier",
          "unitCost",
          "reorderPoint",
          "maxStock",
          "location",
        ];
        sampleData = [
          {
            "toolType*": "End Mill",
            "material*": "Carbide",
            "size*": 10,
            "length*": 75,
            "quantity*": 25,
            subType: "Roughing",
            manufacturer: "Sandvik",
            model: "Coromill",
            coating: "TiAlN",
            applicationMaterial: "Steel",
            operationType: "MILLING",
            supplier: "ToolMaster Inc",
            unitCost: 125.0,
            reorderPoint: 5,
            maxStock: 50,
            location: "Tool Room 1",
          },
        ];
        break;

      case "consumables":
        headers = [
          "category*",
          "type",
          "name*",
          "manufacturer",
          "grade",
          "capacity*",
          "unitOfMeasure*",
          "quantity*", // Always first and required
          "viscosity",
          "supplier",
          "unitCost",
          "reorderPoint",
          "maxStock",
          "location",
          "shelfLife",
          "specifications",
        ];
        sampleData = [
          {
            "quantity*": 50,
            "name*": "Hydraulic Oil",
            "category*": "Hydraulic Oil",
            "capacity*": 200,
            "unitOfMeasure*": "liters",
            type: "Synthetic",
            manufacturer: "Mobil",
            grade: "AW-46",
            viscosity: "ISO VG 46",
            supplier: "OilCorp",
            unitCost: 85.0,
            reorderPoint: 10,
            maxStock: 100,
            location: "Maintenance Store",
            shelfLife: 24,
            specifications: "API CJ-4",
          },
        ];
        break;

      case "fasteners":
        headers = [
          "material*",
          "fastenerType*",
          "threadType*",
          "diameter*",
          "pitch*",
          "length",
          "quantity*", // Always first and required
          "threadDescription",
          "grade",
          "headType",
          "finish",
          "supplier",
          "unitCost",
          "reorderPoint",
          "maxStock",
          "location",
          "specifications",
        ];
        sampleData = [
          {
            "quantity*": 200,
            "fastenerType*": "Bolt",
            "threadType*": "Metric",
            "diameter*": 10,
            "pitch*": 1.5,
            "material*": "Steel",
            threadDescription: "M10x1.5",
            length: 50,
            grade: "8.8",
            headType: "Hex",
            finish: "Zinc Plated",
            supplier: "FastenerSupply",
            unitCost: 2.5,
            reorderPoint: 100,
            maxStock: 1000,
            location: "Bolt Rack A1",
            specifications: "DIN 931",
          },
        ];
        break;

      case "general-items":
        headers = [
          "name*",
          "category*",
          "subCategory",
          "model",
          "supplier*",
          "quantity*", // Always first and required
          "unitCost*",
          "manufacturer",
          "description",
          "reorderPoint",
          "maxStock",
          "location",
          "condition",
        ];
        sampleData = [
          {
            "quantity*": 50,
            "name*": "Safety Gloves",
            "category*": "Personal Protective Equipment",
            "supplier*": "SafetyFirst Supplies",
            "unitCost*": 15.0,
            subCategory: "Safety",
            manufacturer: "ProtectAll",
            model: "Cut Resistant",
            description: "Cut-resistant gloves for material handling",
            reorderPoint: 20,
            maxStock: 200,
            location: "PPE Station",
            condition: "new",
          },
        ];
        break;

      default:
        break;
    }

    // Create worksheet
    const ws = utils.json_to_sheet(sampleData, { header: headers });

    // Create workbook
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sample Template");

    // Add instructions sheet
    const instructionsData = [
      { Instructions: "Follow these guidelines for bulk import:" },
      { Instructions: "" },
      { Instructions: "1. Fill in ALL fields marked as required" },
      { Instructions: "2. Use consistent casing and format" },
      { Instructions: "3. For numbers, use only digits (no text)" },
      { Instructions: "4. For dates, use YYYY-MM-DD format" },
      { Instructions: "5. Do not modify column headers" },
      { Instructions: "6. One row per item" },
      { Instructions: "7. Save as .xlsx format before uploading" },
      { Instructions: "" },
      { Instructions: "Required fields are marked with * in sample data" },
      { Instructions: "" },
    ];

    const instructionWs = utils.json_to_sheet(instructionsData);
    utils.book_append_sheet(wb, instructionWs, "Instructions");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${type}_bulk_import_template_${timestamp}.xlsx`;

    // Download file
    writeFile(wb, filename);

    toast({
      title: "Template Downloaded",
      description: `Sample template saved as ${filename}`,
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedType) return;

    setUploadProgress(10);
    setStep("processing");

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = read(data, { type: "array" });

      setUploadProgress(30);

      // Get first sheet data
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json(worksheet);

      setUploadProgress(60);

      // Validate and process data
      const validationResults = validateImportData(jsonData, selectedType);
      setUploadProgress(100);

      setStep("results");
      setResults(validationResults);

      if (
        validationResults.isValid &&
        validationResults.validItems.length > 0
      ) {
        // Submit valid items to server
        await submitBulkImport(selectedType, validationResults.validItems);
      }
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "Import Failed",
        description:
          "Failed to process the uploaded file. Please check the format and try again.",
        variant: "destructive",
      });
      setStep("upload");
      setUploadProgress(0);
    }
  };

  const normalizeImportData = (item: any, type: string) => {
    const normalized: any = {};

    // Map fields and remove * markers
    Object.keys(item).forEach((key) => {
      let cleanKey = key.replace(/\*$/, ""); // Remove trailing *

      // Map quantity to currentStock
      if (cleanKey === "quantity") {
        cleanKey = "currentStock";
      }

      normalized[cleanKey] = item[key];
    });

    return normalized;
  };

  const validateImportData = (data: any[], type: string) => {
    const results = {
      isValid: true,
      validItems: [] as any[],
      invalidItems: [] as any[],
      errors: [] as string[],
    };

    // Basic validation - check if data exists
    if (!data || data.length === 0) {
      results.isValid = false;
      results.errors.push("No data found in the uploaded file");
      return results;
    }

    // Normalize field names and type-specific validation
    for (let i = 0; i < data.length; i++) {
      const rawItem = data[i];
      const rowNumber = i + 2; // +2 because of 0-indexed array + header row

      try {
        // Normalize field names (remove * and map quantity to currentStock)
        const item = normalizeImportData(rawItem, type);

        const validation = validateSingleItem(item, type);
        if (validation.isValid) {
          results.validItems.push(validation.validatedItem);
        } else {
          results.invalidItems.push({
            row: rowNumber,
            item: rawItem,
            errors: validation.errors,
          });
          results.errors.push(
            `Row ${rowNumber}: ${validation.errors.join(", ")}`
          );
        }
      } catch (error) {
        results.invalidItems.push({
          row: rowNumber,
          item: rawItem,
          errors: [`Validation error: ${error}`],
        });
        results.errors.push(`Row ${rowNumber}: Validation failed`);
      }
    }

    if (results.validItems.length === 0) {
      results.isValid = false;
    }

    return results;
  };

  const validateSingleItem = (item: any, type: string) => {
    const result = {
      isValid: true,
      validatedItem: { ...item },
      errors: [] as string[],
    };

    // Type-specific identifier validations
    switch (type) {
      case "materials":
        if (!item.materialType) {
          result.isValid = false;
          result.errors.push("Material type is required for materials");
        }
        if (!item.grade) {
          result.isValid = false;
          result.errors.push("Grade is required for materials");
        }
        if (!item.shape) {
          result.isValid = false;
          result.errors.push("Shape is required for materials");
        }
        break;
      case "tools":
        if (!item.toolType) {
          result.isValid = false;
          result.errors.push("Tool type is required for tools");
        }
        if (!item.material) {
          result.isValid = false;
          result.errors.push("Material is required for tools");
        }
        if (item.size === undefined || item.size === null) {
          result.isValid = false;
          result.errors.push("Size is required for tools");
        }
        if (item.length === undefined || item.length === null) {
          result.isValid = false;
          result.errors.push("Length is required for tools");
        }
        break;
      case "consumables":
        if (!item.name) {
          result.isValid = false;
          result.errors.push("Name is required for consumables");
        }
        if (!item.category) {
          result.isValid = false;
          result.errors.push("Category is required for consumables");
        }
        if (item.capacity === undefined || item.capacity === null) {
          result.isValid = false;
          result.errors.push("Capacity is required for consumables");
        }
        if (!item.unitOfMeasure) {
          result.isValid = false;
          result.errors.push("Unit of measure is required for consumables");
        }
        break;
      case "fasteners":
        if (!item.fastenerType) {
          result.isValid = false;
          result.errors.push("Fastener type is required for fasteners");
        }
        if (!item.threadType) {
          result.isValid = false;
          result.errors.push("Thread type is required for fasteners");
        }
        if (item.diameter === undefined || item.diameter === null) {
          result.isValid = false;
          result.errors.push("Diameter is required for fasteners");
        }
        if (!item.material) {
          result.isValid = false;
          result.errors.push("Material is required for fasteners");
        }
        break;
      case "general-items":
        if (!item.name) {
          result.isValid = false;
          result.errors.push("Name is required for general items");
        }
        if (!item.category) {
          result.isValid = false;
          result.errors.push("Category is required for general items");
        }
        if (!item.supplier) {
          result.isValid = false;
          result.errors.push("Supplier is required for general items");
        }
        if (item.unitCost === undefined || item.unitCost === null) {
          result.isValid = false;
          result.errors.push("Unit cost is required for general items");
        }
        break;
    }

    // Check for currentStock/current quantity
    if (item.currentStock === undefined || item.currentStock === null) {
      result.isValid = false;
      result.errors.push("Current stock (quantity) is required");
    } else if (isNaN(parseInt(item.currentStock))) {
      result.isValid = false;
      result.errors.push("Current stock must be a valid number");
    }

    return result;
  };

  const submitBulkImport = async (type: string, items: any[]) => {
    try {
      const response = await fetch(`/api/inventory/bulk-import/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvData: JSON.stringify(items) }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`Failed to submit bulk import: ${response.status}`);
      }

      const bulkResult = await response.json();

      toast({
        title: "Bulk Import Completed",
        description: `${bulkResult.validItems || 0} items ready for import`,
      });

      if (bulkResult.canProceed && bulkResult.importId) {
        // Auto-confirm the import
        try {
          const confirmResponse = await fetch(
            `/api/inventory/bulk-import/confirm/${bulkResult.importId}`,
            {
              method: "POST",
            }
          );

          if (confirmResponse.ok) {
            const confirmResult = await confirmResponse.json();

            // Create combined results with validation and confirmation details
            const finalResults = {
              ...bulkResult,
              ...confirmResult,
              successCount: confirmResult.summary?.successfulImports || 0,
              errors:
                confirmResult.results
                  ?.filter((r: any) => !r.success)
                  .map((r: any) => r.error) || [],
            };

            toast({
              title: "Import Successful",
              description: `${finalResults.successCount} items imported successfully`,
            });

            setStep("results");
            setResults(finalResults);

            // Call success callback to refetch data
            onImportSuccess?.();

            // Auto-close dialog after successful import
            setTimeout(() => {
              onOpenChange(false);
              resetDialog();
            }, 3000); // Show results for 3 seconds before auto-close
          } else {
            // Confirmation failed
            setResults({
              ...bulkResult,
              successCount: 0,
              errors: [`Confirmation failed: ${confirmResponse.statusText}`],
            });
            toast({
              title: "Import Confirmation Failed",
              description: "Items were validated but could not be imported.",
              variant: "destructive",
            });
          }
        } catch (confirmError) {
          console.error("Auto-confirm failed:", confirmError);
          setResults({
            ...bulkResult,
            successCount: 0,
            errors: [`Confirmation failed: ${confirmError}`],
          });
          toast({
            title: "Import Confirmation Failed",
            description: "Items were validated but could not be imported.",
            variant: "destructive",
          });
        }
      } else {
        // Set validation results for display
        setResults(bulkResult);
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      toast({
        title: "Import Failed",
        description: "Failed to import items. Please try again.",
        variant: "destructive",
      });

      // Set error results
      setResults({
        successCount: 0,
        errors: ["Failed to process bulk import request"],
      });
    }
  };

  const resetDialog = () => {
    setStep("select-type");
    setSelectedType("");
    setUploadProgress(0);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetDialog, 300); // Wait for dialog animation
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import Inventory
          </DialogTitle>
          <DialogDescription>
            {step === "select-type" &&
              "Select an inventory type and download the sample format"}
            {step === "upload" &&
              "Upload your filled Excel template to import multiple items"}
            {step === "processing" && "Processing your import..."}
            {step === "results" &&
              "Import completed. Review the results below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === "select-type" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Inventory Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select inventory type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          {type.icon} {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <Button
                  onClick={() => generateSampleTemplate(selectedType)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample Format
                </Button>
              )}
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Upload File</label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only Excel files (.xlsx, .xls) are accepted
                </p>
              </div>

              <Button
                onClick={() => setStep("select-type")}
                variant="ghost"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Type Selection
              </Button>
            </div>
          )}

          {step === "processing" && (
            <div className="space-y-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-center text-sm text-gray-600">
                Processing your import file...
              </p>
            </div>
          )}

          {step === "results" && results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-700 font-medium">
                    Successfully Imported
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {results?.successCount || 0}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-red-700 font-medium">Failed to Import</p>
                  <p className="text-2xl font-bold text-red-800">
                    {results?.errors?.length || 0}
                  </p>
                </div>
              </div>

              {results?.errors && results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">
                    Import Errors:
                  </h4>
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {results.errors.map((error: string, index: number) => (
                      <p key={index} className="text-sm text-red-600">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {(step === "select-type" || step === "results") && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              {step === "select-type" && selectedType && (
                <Button onClick={() => setStep("upload")}>
                  Next: Upload File
                </Button>
              )}
            </>
          )}

          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
