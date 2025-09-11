import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { insertWorkOrderSchema, Machine } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { ProductionStagesForm } from "./ProductionStagesForm";

const productionStageSchema = z.object({
  operationNumber: z.number(),
  operationType: z.string(),
  operationDescription: z.string(),
  location: z.enum(["INTERNAL", "EXTERNAL"]),
  vendorName: z.string().optional(),
  vendorContact: z.string().optional(),
  machineType: z.string().optional(),
  assignedMachineId: z.string().optional(),
  setupTime: z.number().optional(),
  cycleTime: z.number().optional(),
  leadTime: z.number().optional(),
  costPerPiece: z.number().optional(),
  workInstructions: z.string().optional(),
  specialRequirements: z.string().optional(),
  qualityChecks: z.array(z.string()).optional(),
});

const workOrderFormSchema = insertWorkOrderSchema.extend({
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  productionStages: z.array(productionStageSchema).optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderFormSchema>;

interface WorkOrderFormProps {
  onSuccess?: () => void;
  machines: Machine[];
}

export function WorkOrderForm({ onSuccess, machines }: WorkOrderFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      orderNumber: "",
      partNumber: "",
      partName: "",
      quantity: 1,
      operationType: "TURNING",
      priority: "normal",
      status: "pending",
      material: "",
      materialGrade: "",
      productionStages: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: WorkOrderFormData) => {
      const payload = {
        ...data,
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : null,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : null,
      };
      return apiRequest("POST", "/api/work-orders", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Work Order Created",
        description: "The work order has been successfully created.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create work order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const operationTypes = [
    { value: "TURNING", label: "Turning (CNC & Conventional)" },
    { value: "MILLING", label: "Milling (CNC & Conventional)" },
    { value: "SURFACE_GRINDING", label: "Surface Grinding" },
    { value: "CYLINDRICAL_GRINDING", label: "Cylindrical Grinding" },
    { value: "WIRE_CUT", label: "Wire Cut EDM" },
    { value: "DRILLING", label: "Drilling" },
    { value: "TAPPING", label: "Tapping" },
  ];

  const materials = [
    "Steel",
    "Aluminum", 
    "Brass",
    "Stainless Steel",
    "Cast Iron",
    "Tool Steel",
    "Titanium",
    "Copper",
  ];

  const materialGrades = {
    Steel: ["1018", "1045", "4140", "4340", "8620"],
    "Stainless Steel": ["304", "316", "316L", "17-4 PH", "420"],
    Aluminum: ["6061-T6", "7075-T6", "2024-T3", "5083", "6063"],
    "Tool Steel": ["D2", "A2", "O1", "S7", "H13"],
    Brass: ["C360", "C464", "C260"],
  };

  const onSubmit = (data: WorkOrderFormData) => {
    mutation.mutate(data);
  };

  const selectedMaterial = form.watch("material");
  
  // Helper function to get error styling for inputs
  const getInputErrorClass = (fieldName: keyof WorkOrderFormData) => {
    const hasError = !!form.formState.errors[fieldName];
    return hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "";
  };
  
  // Helper function to get error styling for select triggers
  const getSelectErrorClass = (fieldName: keyof WorkOrderFormData) => {
    const hasError = !!form.formState.errors[fieldName];
    return hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "";
  };
  
  // Check if form is valid for submit button state
  const isFormValid = form.formState.isValid && !mutation.isPending;
  const formErrors = form.formState.errors;
  const hasRequiredFieldErrors = !!formErrors.orderNumber || !!formErrors.partNumber || !!formErrors.partName || !!formErrors.quantity || !!formErrors.operationType;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="manufacturing">Manufacturing</TabsTrigger>
          <TabsTrigger value="stages">Production Stages</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderNumber">Work Order Number *</Label>
              <Input
                id="orderNumber"
                data-testid="input-orderNumber"
                {...form.register("orderNumber")}
                placeholder="WO-2024-001"
                className={`mt-1 ${getInputErrorClass("orderNumber")}`}
              />
              {form.formState.errors.orderNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.orderNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="partNumber">Part Number *</Label>
              <Input
                id="partNumber"
                data-testid="input-partNumber"
                {...form.register("partNumber")}
                placeholder="HSK-A63-20-120"
                className={`mt-1 ${getInputErrorClass("partNumber")}`}
              />
              {form.formState.errors.partNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.partNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="partName">Part Name *</Label>
              <Input
                id="partName"
                data-testid="input-partName"
                {...form.register("partName")}
                placeholder="Tool Holder HSK-A63"
                className={`mt-1 ${getInputErrorClass("partName")}`}
              />
              {form.formState.errors.partName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.partName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customerPartNumber">Customer Part Number</Label>
              <Input
                id="customerPartNumber"
                data-testid="input-customerPartNumber"
                {...form.register("customerPartNumber")}
                placeholder="Customer reference"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="drawing">Drawing Number/Revision</Label>
              <Input
                id="drawing"
                data-testid="input-drawing"
                {...form.register("drawing")}
                placeholder="DRW-001 Rev C"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing Details */}
        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="operationType">Operation Type *</Label>
              <Select 
                value={form.watch("operationType")} 
                onValueChange={(value) => form.setValue("operationType", value)}
              >
                <SelectTrigger className={`mt-1 ${getSelectErrorClass("operationType")}`} data-testid="select-operationType">
                  <SelectValue placeholder="Select operation type" />
                </SelectTrigger>
                <SelectContent>
                  {operationTypes.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Select 
                value={form.watch("material") || ""} 
                onValueChange={(value) => {
                  form.setValue("material", value);
                  form.setValue("materialGrade", ""); // Reset grade when material changes
                }}
              >
                <SelectTrigger className="mt-1" data-testid="select-material">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material} value={material}>
                      {material}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="materialGrade">Material Grade</Label>
              <Select 
                value={form.watch("materialGrade") || ""} 
                onValueChange={(value) => form.setValue("materialGrade", value)}
                disabled={!selectedMaterial}
              >
                <SelectTrigger className="mt-1" data-testid="select-materialGrade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMaterial && materialGrades[selectedMaterial as keyof typeof materialGrades]?.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="rawMaterialSize">Raw Material Size</Label>
              <Input
                id="rawMaterialSize"
                data-testid="input-rawMaterialSize"
                {...form.register("rawMaterialSize")}
                placeholder="50mm x 100mm x 200mm"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="finishedDimensions">Finished Dimensions</Label>
              <Input
                id="finishedDimensions"
                data-testid="input-finishedDimensions"
                {...form.register("finishedDimensions")}
                placeholder="Ø48mm x 180mm"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="manufacturing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Production Details */}
        <Card>
          <CardHeader>
            <CardTitle>Production Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                data-testid="input-quantity"
                type="number"
                min="1"
                {...form.register("quantity", { valueAsNumber: true })}
                className={`mt-1 ${getInputErrorClass("quantity")}`}
              />
              {form.formState.errors.quantity && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={form.watch("priority")} 
                onValueChange={(value) => form.setValue("priority", value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedSetupTime">Setup Time (minutes)</Label>
              <Input
                id="estimatedSetupTime"
                data-testid="input-estimatedSetupTime"
                type="number"
                min="0"
                step="0.1"
                {...form.register("estimatedSetupTime", { valueAsNumber: true })}
                className="mt-1"
                placeholder="30"
              />
            </div>

            <div>
              <Label htmlFor="estimatedCycleTime">Cycle Time (minutes/piece)</Label>
              <Input
                id="estimatedCycleTime"
                data-testid="input-estimatedCycleTime"
                type="number"
                min="0"
                step="0.1"
                {...form.register("estimatedCycleTime", { valueAsNumber: true })}
                className="mt-1"
                placeholder="5.5"
              />
            </div>
          </CardContent>
        </Card>


          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-6">
          <ProductionStagesForm 
            control={form.control}
            machines={machines}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="plannedStartDate">Planned Start Date</Label>
                  <Input
                    id="plannedStartDate"
                    data-testid="input-plannedStartDate"
                    type="datetime-local"
                    {...form.register("plannedStartDate")}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="plannedEndDate">Planned End Date</Label>
                  <Input
                    id="plannedEndDate"
                    data-testid="input-plannedEndDate"
                    type="datetime-local"
                    {...form.register("plannedEndDate")}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="assignedMachineId">Assigned Machine</Label>
                  <Select 
                    value={form.watch("assignedMachineId") || ""} 
                    onValueChange={(value) => form.setValue("assignedMachineId", value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-assignedMachineId">
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name} - {machine.operation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Work Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="setupInstructions">Setup Instructions</Label>
                  <Textarea
                    id="setupInstructions"
                    data-testid="textarea-setupInstructions"
                    {...form.register("setupInstructions")}
                    placeholder="Special setup requirements..."
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="programNumber">CNC Program Number</Label>
                  <Input
                    id="programNumber"
                    data-testid="input-programNumber"
                    {...form.register("programNumber")}
                    placeholder="O1001"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    data-testid="textarea-notes"
                    {...form.register("notes")}
                    placeholder="Additional notes..."
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Validation Summary */}
      {hasRequiredFieldErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Required fields are missing
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Please fill in all required fields marked with an asterisk (*) to create the work order.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={mutation.isPending || hasRequiredFieldErrors}
          data-testid="button-submit"
          className={hasRequiredFieldErrors ? "opacity-50 cursor-not-allowed" : ""}
        >
          {mutation.isPending ? "Creating..." : "Create Work Order"}
        </Button>
      </div>
    </form>
  );
}