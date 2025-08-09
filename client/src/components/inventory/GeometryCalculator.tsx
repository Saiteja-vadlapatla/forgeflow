import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";

interface GeometryCalculatorProps {
  shape: string;
  materialType: string;
  diameter?: number;
  thickness?: number;
  width?: number;
  length?: number;
  quantity?: number;
}

// Material density in kg/m³
const materialDensities: Record<string, number> = {
  "Steel": 7850,
  "Aluminum": 2700,
  "Stainless Steel": 8000,
  "Brass": 8500,
  "Copper": 8960,
  "Titanium": 4500,
  "Plastic": 1200,
  "Carbon Steel": 7850,
  "Alloy Steel": 7850,
};

export function GeometryCalculator({ 
  shape, 
  materialType, 
  diameter, 
  thickness, 
  width, 
  length,
  quantity = 1 
}: GeometryCalculatorProps) {
  const [unitWeight, setUnitWeight] = useState<number>(0);
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);

  useEffect(() => {
    if (!shape || !materialType || !length) return;

    const density = materialDensities[materialType] || 7850; // Default to steel
    let calculatedVolume = 0;

    // Calculate volume based on shape (in m³)
    switch (shape.toLowerCase()) {
      case "round bar":
        if (diameter) {
          const radiusM = (diameter / 1000) / 2; // Convert mm to m
          const lengthM = length / 1000; // Convert mm to m
          calculatedVolume = Math.PI * Math.pow(radiusM, 2) * lengthM;
        }
        break;
        
      case "square bar":
        if (diameter) { // Using diameter as side length for square
          const sideM = diameter / 1000; // Convert mm to m
          const lengthM = length / 1000;
          calculatedVolume = Math.pow(sideM, 2) * lengthM;
        }
        break;
        
      case "rectangular bar":
        if (width && thickness) {
          const widthM = width / 1000;
          const thicknessM = thickness / 1000;
          const lengthM = length / 1000;
          calculatedVolume = widthM * thicknessM * lengthM;
        }
        break;
        
      case "flat bar":
        if (width && thickness) {
          const widthM = width / 1000;
          const thicknessM = thickness / 1000;
          const lengthM = length / 1000;
          calculatedVolume = widthM * thicknessM * lengthM;
        }
        break;
        
      case "plate":
      case "sheet":
        if (width && thickness) {
          const widthM = width / 1000;
          const thicknessM = thickness / 1000;
          const lengthM = length / 1000;
          calculatedVolume = widthM * thicknessM * lengthM;
        }
        break;
        
      case "tube":
      case "pipe":
        if (diameter && thickness) {
          const outerRadiusM = (diameter / 1000) / 2;
          const innerRadiusM = outerRadiusM - (thickness / 1000);
          const lengthM = length / 1000;
          calculatedVolume = Math.PI * (Math.pow(outerRadiusM, 2) - Math.pow(innerRadiusM, 2)) * lengthM;
        }
        break;
    }

    const calculatedUnitWeight = calculatedVolume * density; // kg
    setVolume(calculatedVolume);
    setUnitWeight(calculatedUnitWeight);
    setTotalWeight(calculatedUnitWeight * quantity);
  }, [shape, materialType, diameter, thickness, width, length, quantity]);

  if (!shape || !materialType) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-blue-600" />
          Weight Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Unit Weight</p>
            <Badge variant="secondary" className="text-base font-mono">
              {unitWeight.toFixed(2)} kg
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Weight ({quantity} pcs)</p>
            <Badge variant="secondary" className="text-base font-mono">
              {totalWeight.toFixed(2)} kg
            </Badge>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 border-t pt-2">
          <p>Volume: {(volume * 1000000).toFixed(1)} cm³</p>
          <p>Density: {materialDensities[materialType] || 7850} kg/m³</p>
        </div>
      </CardContent>
    </Card>
  );
}