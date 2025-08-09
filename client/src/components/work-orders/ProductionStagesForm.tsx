import { useState } from "react";
import { useFieldArray, Control } from "react-hook-form";
import { Plus, Minus, ArrowDown, Factory, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Machine } from "@shared/schema";

interface ProductionStage {
  operationNumber: number;
  operationType: string;
  operationDescription: string;
  location: "INTERNAL" | "EXTERNAL";
  vendorName?: string;
  vendorContact?: string;
  machineType?: string;
  assignedMachineId?: string;
  setupTime?: number;
  cycleTime?: number;
  leadTime?: number;
  costPerPiece?: number;
  workInstructions?: string;
  specialRequirements?: string;
  qualityChecks?: string[];
}

interface ProductionStagesFormProps {
  control: Control<any>;
  machines: Machine[];
}

export function ProductionStagesForm({ control, machines }: ProductionStagesFormProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "productionStages",
  });

  const internalOperations = [
    "TURNING", "MILLING", "DRILLING", "TAPPING", "GRINDING", "WIRE_CUT", 
    "ASSEMBLY", "INSPECTION", "DEBURRING", "CLEANING"
  ];

  const externalOperations = [
    "HEAT_TREATMENT", "PLATING", "ANODIZING", "POWDER_COATING", "PASSIVATION",
    "WELDING", "MACHINING_OUTSOURCE", "INSPECTION_CMM", "CERTIFICATION"
  ];

  const heatTreatmentTypes = [
    "Hardening & Tempering", "Stress Relieving", "Annealing", "Case Hardening",
    "Nitriding", "Carburizing", "Induction Hardening", "Cryogenic Treatment"
  ];

  const platingTypes = [
    "Nickel Plating", "Chrome Plating", "Zinc Plating", "Gold Plating",
    "Silver Plating", "Tin Plating", "Copper Plating", "Black Oxide"
  ];

  const addStage = (location: "INTERNAL" | "EXTERNAL") => {
    const newStage: ProductionStage = {
      operationNumber: fields.length + 1,
      operationType: location === "INTERNAL" ? "TURNING" : "HEAT_TREATMENT",
      operationDescription: "",
      location,
      setupTime: location === "INTERNAL" ? 30 : undefined,
      cycleTime: location === "INTERNAL" ? 10 : undefined,
      leadTime: location === "EXTERNAL" ? 3 : undefined,
    };
    append(newStage);
  };

  const getOperationIcon = (location: string) => {
    return location === "INTERNAL" ? 
      <Factory className="h-4 w-4 text-blue-600" /> : 
      <Truck className="h-4 w-4 text-orange-600" />;
  };

  const getLocationBadgeColor = (location: string) => {
    return location === "INTERNAL" ? 
      "bg-blue-100 text-blue-800" : 
      "bg-orange-100 text-orange-800";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Production Stages</CardTitle>
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addStage("INTERNAL")}
            >
              <Factory className="h-4 w-4 mr-2" />
              Internal Operation
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addStage("EXTERNAL")}
            >
              <Truck className="h-4 w-4 mr-2" />
              External Service
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No production stages defined</p>
            <p className="text-sm">Add internal operations or external services above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => {
              const stage = field as any;
              const isInternal = stage.location === "INTERNAL";
              
              return (
                <Card key={field.id} className="border-l-4 border-l-gray-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getOperationIcon(stage.location)}
                        <div>
                          <h4 className="font-medium">
                            Operation {stage.operationNumber}
                          </h4>
                          <Badge className={getLocationBadgeColor(stage.location)}>
                            {stage.location}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => move(index, index - 1)}
                          >
                            ↑
                          </Button>
                        )}
                        {index < fields.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => move(index, index + 1)}
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Operation Type */}
                      <div>
                        <Label>Operation Type</Label>
                        <Select
                          value={stage.operationType}
                          onValueChange={(value) => {
                            // Update form field
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(isInternal ? internalOperations : externalOperations).map((op) => (
                              <SelectItem key={op} value={op}>
                                {op.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operation Description */}
                      <div>
                        <Label>Description</Label>
                        <Input
                          placeholder="Brief operation description"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Internal Operation Fields */}
                    {isInternal && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Machine Type</Label>
                          <Input
                            placeholder="CNC Lathe"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Assigned Machine</Label>
                          <Select>
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
                          <Label>Setup Time (min)</Label>
                          <Input
                            type="number"
                            placeholder="30"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Cycle Time (min/pc)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="5.5"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* External Operation Fields */}
                    {!isInternal && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Vendor Name</Label>
                          <Input
                            placeholder="ABC Heat Treating"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Vendor Contact</Label>
                          <Input
                            placeholder="john@abcheattreat.com"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Lead Time (days)</Label>
                          <Input
                            type="number"
                            placeholder="3"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Cost per Piece</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="25.00"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Special Requirements for External Operations */}
                    {!isInternal && (
                      <div>
                        <Label>Special Requirements</Label>
                        {stage.operationType === "HEAT_TREATMENT" && (
                          <div className="mt-1 mb-2">
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select heat treatment type" />
                              </SelectTrigger>
                              <SelectContent>
                                {heatTreatmentTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {stage.operationType === "PLATING" && (
                          <div className="mt-1 mb-2">
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plating type" />
                              </SelectTrigger>
                              <SelectContent>
                                {platingTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <Textarea
                          placeholder={
                            stage.operationType === "HEAT_TREATMENT" 
                              ? "HRC 58-62, Temper at 400°F, Air cool" 
                              : stage.operationType === "PLATING"
                              ? "Thickness: 0.0002-0.0005 inches, Bright finish"
                              : "Specify requirements..."
                          }
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Work Instructions */}
                    <div>
                      <Label>Work Instructions</Label>
                      <Textarea
                        placeholder={
                          isInternal 
                            ? "Setup instructions, tooling, parameters..." 
                            : "Packaging, shipping instructions, quality requirements..."
                        }
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    {/* Quality Checks */}
                    <div>
                      <Label>Quality Checks</Label>
                      <Textarea
                        placeholder="Dimensional checks, visual inspection, testing requirements..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </CardContent>

                  {/* Flow Indicator */}
                  {index < fields.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {fields.length > 0 && (
          <Card className="mt-6 bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Production Summary:</span>
                <div className="flex space-x-4">
                  <span>
                    Internal Operations: {fields.filter(f => (f as any).location === "INTERNAL").length}
                  </span>
                  <span>
                    External Services: {fields.filter(f => (f as any).location === "EXTERNAL").length}
                  </span>
                  <span>
                    Total Stages: {fields.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}