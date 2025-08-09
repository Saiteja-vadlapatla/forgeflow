import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Minus, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { insertQualityRecordSchema, WorkOrder, Machine, QualityMeasurement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const measurementSchema = z.object({
  dimension: z.string().min(1, "Dimension name required"),
  nominal: z.number().min(0, "Nominal value required"),
  tolerancePlus: z.number().min(0, "Plus tolerance required"),
  toleranceMinus: z.number().min(0, "Minus tolerance required"),
  actual: z.number().min(0, "Actual measurement required"),
  unit: z.enum(["mm", "inch", "degree"]),
});

const qualityInspectionSchema = insertQualityRecordSchema.extend({
  measurements: z.array(measurementSchema).min(1, "At least one measurement required"),
  serialNumber: z.string().optional(),
  surfaceFinish: z.number().optional(),
  hardness: z.number().optional(),
  concentricity: z.number().optional(),
  runout: z.number().optional(),
});

type QualityInspectionFormData = z.infer<typeof qualityInspectionSchema>;

interface QualityInspectionFormProps {
  onSuccess?: () => void;
  workOrders: WorkOrder[];
  machines: Machine[];
}

export function QualityInspectionForm({ onSuccess, workOrders, machines }: QualityInspectionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  const form = useForm<QualityInspectionFormData>({
    resolver: zodResolver(qualityInspectionSchema),
    defaultValues: {
      inspectionType: "in_process",
      result: "pass",
      measurements: [
        {
          dimension: "",
          nominal: 0,
          tolerancePlus: 0,
          toleranceMinus: 0,
          actual: 0,
          unit: "mm",
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "measurements",
  });

  const mutation = useMutation({
    mutationFn: async (data: QualityInspectionFormData) => {
      const { measurements, ...rest } = data;
      
      // Convert measurements to the expected format
      const processedMeasurements = measurements.reduce((acc, measurement) => {
        acc[measurement.dimension] = {
          nominal: measurement.nominal,
          tolerance: {
            plus: measurement.tolerancePlus,
            minus: measurement.toleranceMinus,
          },
          actual: measurement.actual,
          result: calculateMeasurementResult(measurement),
          unit: measurement.unit,
        };
        return acc;
      }, {} as Record<string, any>);

      const payload = {
        ...rest,
        measurements: processedMeasurements,
        inspectionDate: new Date().toISOString(),
      };

      return apiRequest("/api/quality/records", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality/records"] });
      toast({
        title: "Quality Record Created",
        description: "The quality inspection has been successfully recorded.",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quality record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const calculateMeasurementResult = (measurement: any): 'PASS' | 'FAIL' => {
    const { nominal, tolerancePlus, toleranceMinus, actual } = measurement;
    const upperLimit = nominal + tolerancePlus;
    const lowerLimit = nominal - toleranceMinus;
    return (actual >= lowerLimit && actual <= upperLimit) ? 'PASS' : 'FAIL';
  };

  const calculateOverallResult = () => {
    const measurements = form.watch("measurements");
    const hasFailedMeasurement = measurements.some(m => 
      m.actual !== undefined && m.nominal !== undefined && 
      m.tolerancePlus !== undefined && m.toleranceMinus !== undefined &&
      calculateMeasurementResult(m) === 'FAIL'
    );
    
    return hasFailedMeasurement ? "fail" : "pass";
  };

  const onSubmit = (data: QualityInspectionFormData) => {
    // Auto-calculate result based on measurements
    const result = calculateOverallResult();
    mutation.mutate({ ...data, result });
  };

  const inspectionTypes = [
    { value: "first_article", label: "First Article Inspection" },
    { value: "in_process", label: "In-Process Inspection" },
    { value: "final", label: "Final Inspection" },
    { value: "receiving", label: "Receiving Inspection" },
  ];

  const commonDimensions = [
    "Overall Length", "Diameter", "Thread Pitch", "Surface Finish", 
    "Concentricity", "Runout", "Parallelism", "Perpendicularity",
    "Hole Diameter", "Key Width", "Groove Depth", "Chamfer Size"
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inspection Details */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="workOrderId">Work Order *</Label>
              <Select 
                value={form.watch("workOrderId") || ""} 
                onValueChange={(value) => {
                  form.setValue("workOrderId", value);
                  const workOrder = workOrders.find(wo => wo.id === value);
                  setSelectedWorkOrder(workOrder || null);
                  if (workOrder) {
                    form.setValue("partNumber", workOrder.partNumber);
                    form.setValue("machineId", workOrder.assignedMachineId || "");
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select work order" />
                </SelectTrigger>
                <SelectContent>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.orderNumber} - {wo.partNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="partNumber">Part Number *</Label>
              <Input
                id="partNumber"
                {...form.register("partNumber")}
                placeholder="Part number"
                className="mt-1"
                readOnly={!!selectedWorkOrder}
              />
            </div>

            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                {...form.register("serialNumber")}
                placeholder="Serial/batch number"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="inspectionType">Inspection Type *</Label>
              <Select 
                value={form.watch("inspectionType")} 
                onValueChange={(value) => form.setValue("inspectionType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {inspectionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="machineId">Machine *</Label>
              <Select 
                value={form.watch("machineId") || ""} 
                onValueChange={(value) => form.setValue("machineId", value)}
              >
                <SelectTrigger className="mt-1">
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

            <div>
              <Label htmlFor="inspectorId">Inspector ID *</Label>
              <Input
                id="inspectorId"
                {...form.register("inspectorId")}
                placeholder="Inspector ID"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quality Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Quality Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="surfaceFinish">Surface Finish (Ra μm)</Label>
              <Input
                id="surfaceFinish"
                type="number"
                step="0.01"
                {...form.register("surfaceFinish", { valueAsNumber: true })}
                placeholder="1.6"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="hardness">Hardness (HRC)</Label>
              <Input
                id="hardness"
                type="number"
                step="0.1"
                {...form.register("hardness", { valueAsNumber: true })}
                placeholder="45"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="concentricity">Concentricity (mm)</Label>
              <Input
                id="concentricity"
                type="number"
                step="0.001"
                {...form.register("concentricity", { valueAsNumber: true })}
                placeholder="0.05"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="runout">Runout TIR (mm)</Label>
              <Input
                id="runout"
                type="number"
                step="0.001"
                {...form.register("runout", { valueAsNumber: true })}
                placeholder="0.02"
                className="mt-1"
              />
            </div>

            {/* Overall Result Preview */}
            <div className="pt-4 border-t">
              <Label>Calculated Result</Label>
              <Badge 
                className={`mt-2 ${calculateOverallResult() === 'pass' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'}`}
              >
                {calculateOverallResult().toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimensional Measurements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dimensional Measurements</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({
                dimension: "",
                nominal: 0,
                tolerancePlus: 0,
                toleranceMinus: 0,
                actual: 0,
                unit: "mm",
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Measurement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Measurement {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <Label>Dimension</Label>
                      <Select
                        value={form.watch(`measurements.${index}.dimension`)}
                        onValueChange={(value) => form.setValue(`measurements.${index}.dimension`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select dimension" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonDimensions.map((dim) => (
                            <SelectItem key={dim} value={dim}>
                              {dim}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="mt-1"
                        placeholder="Custom dimension"
                        value={form.watch(`measurements.${index}.dimension`)}
                        onChange={(e) => form.setValue(`measurements.${index}.dimension`, e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Nominal</Label>
                      <Input
                        type="number"
                        step="0.001"
                        {...form.register(`measurements.${index}.nominal`, { valueAsNumber: true })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>+ Tolerance</Label>
                      <Input
                        type="number"
                        step="0.001"
                        {...form.register(`measurements.${index}.tolerancePlus`, { valueAsNumber: true })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>- Tolerance</Label>
                      <Input
                        type="number"
                        step="0.001"
                        {...form.register(`measurements.${index}.toleranceMinus`, { valueAsNumber: true })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Actual</Label>
                      <Input
                        type="number"
                        step="0.001"
                        {...form.register(`measurements.${index}.actual`, { valueAsNumber: true })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Unit</Label>
                      <Select
                        value={form.watch(`measurements.${index}.unit`)}
                        onValueChange={(value) => form.setValue(`measurements.${index}.unit`, value as "mm" | "inch" | "degree")}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="inch">inch</SelectItem>
                          <SelectItem value="degree">degree</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Result indicator */}
                  {form.watch(`measurements.${index}.actual`) !== undefined && 
                   form.watch(`measurements.${index}.nominal`) !== undefined && (
                    <div className="mt-3">
                      <Badge 
                        className={`${calculateMeasurementResult(form.watch(`measurements.${index}`)) === 'PASS'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'}`}
                      >
                        {calculateMeasurementResult(form.watch(`measurements.${index}`))}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Defects and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Defect Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="defectType">Defect Type</Label>
              <Select 
                value={form.watch("defectType") || ""} 
                onValueChange={(value) => form.setValue("defectType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select defect type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dimensional">Dimensional</SelectItem>
                  <SelectItem value="surface">Surface</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="geometric">Geometric</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defectLocation">Defect Location</Label>
              <Input
                id="defectLocation"
                {...form.register("defectLocation")}
                placeholder="Where on the part"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="defectDescription">Defect Description</Label>
              <Textarea
                id="defectDescription"
                {...form.register("defectDescription")}
                placeholder="Detailed description of the defect"
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Corrective Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dispositionCode">Disposition</Label>
              <Select 
                value={form.watch("dispositionCode") || ""} 
                onValueChange={(value) => form.setValue("dispositionCode", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select disposition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USE_AS_IS">Use As Is</SelectItem>
                  <SelectItem value="REWORK">Rework</SelectItem>
                  <SelectItem value="SCRAP">Scrap</SelectItem>
                  <SelectItem value="RETURN">Return to Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="correctiveAction">Corrective Action</Label>
              <Textarea
                id="correctiveAction"
                {...form.register("correctiveAction")}
                placeholder="Action taken to address the issue"
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="reworkInstructions">Rework Instructions</Label>
              <Textarea
                id="reworkInstructions"
                {...form.register("reworkInstructions")}
                placeholder="Detailed rework instructions"
                className="mt-1 resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Inspection"}
        </Button>
      </div>
    </form>
  );
}