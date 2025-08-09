// Mock data for manufacturing operations
import { Machine, WorkOrder, QualityRecord } from "@shared/schema";

export const mockMachines: Partial<Machine>[] = [
  {
    name: "CNC HAAS TL-2",
    type: "CNC_TURNING",
    operation: "CNC Turning",
    subOperation: "Facing/Turning",
    manufacturer: "Haas Automation",
    model: "TL-2",
    serialNumber: "TL2-2019-001",
    location: "Cell A-1",
    status: "running",
    efficiency: 87.5,
    maxSpindleSpeed: 4000,
    maxFeedRate: 500,
    toolCapacity: 12,
    specifications: {
      maxBarDiameter: "65mm",
      maxTurningLength: "356mm",
      chuckSize: "8 inch",
      toolholderType: "VDI-30"
    }
  },
  {
    name: "MAZAK QTN-200",
    type: "CNC_TURNING",
    operation: "CNC Turning",
    subOperation: "Threading/Boring",
    manufacturer: "Mazak",
    model: "QTN-200MS",
    serialNumber: "QTN-2020-003",
    location: "Cell A-2",
    status: "setup",
    efficiency: 82.1,
    maxSpindleSpeed: 5000,
    maxFeedRate: 1000,
    toolCapacity: 24,
    specifications: {
      maxChuckSize: "10 inch",
      maxTurningDiameter: "400mm",
      maxTurningLength: "610mm"
    }
  },
  {
    name: "DMG MORI NMV 3000",
    type: "CNC_MILLING",
    operation: "CNC Milling",
    subOperation: "Face Milling",
    manufacturer: "DMG MORI",
    model: "NMV 3000 DCG",
    serialNumber: "NMV-2021-005",
    location: "Cell B-1",
    status: "running",
    efficiency: 91.3,
    maxSpindleSpeed: 12000,
    maxFeedRate: 15000,
    toolCapacity: 40,
    workEnvelope: {
      x: 630,
      y: 630,
      z: 560
    }
  },
  {
    name: "OKAMOTO ACC-84",
    type: "SURFACE_GRINDING",
    operation: "Surface Grinding",
    manufacturer: "Okamoto",
    model: "ACC-84CA",
    serialNumber: "ACC-2018-002",
    location: "Grinding Area",
    status: "idle",
    efficiency: 78.9,
    specifications: {
      tableSize: "840 x 450mm",
      maxWorkHeight: "450mm",
      wheelSpeed: "1800 RPM"
    }
  },
  {
    name: "FANUC ROBOCUT α-C600iA",
    type: "WIRE_CUT",
    operation: "Wire Cut EDM",
    manufacturer: "FANUC",
    model: "ROBOCUT α-C600iA",
    serialNumber: "ROB-2022-001",
    location: "EDM Area",
    status: "running",
    efficiency: 88.7,
    specifications: {
      workpieceSize: "600 x 400 x 220mm",
      maxTaperAngle: "±30°",
      wireThickness: "0.1-0.3mm"
    }
  }
];

export const mockWorkOrders: Partial<WorkOrder>[] = [
  {
    orderNumber: "WO-2024-001",
    partNumber: "HSK-A63-ER32-100",
    partName: "Tool Holder HSK-A63 ER32 Collet Chuck",
    customerPartNumber: "TH-HSK63-100",
    drawing: "DRW-HSK63-001 Rev C",
    material: "Steel",
    materialGrade: "4140",
    rawMaterialSize: "Ø70mm x 120mm",
    finishedDimensions: "Ø63mm x 100mm",
    quantity: 50,
    completedQuantity: 32,
    status: "in_progress",
    priority: "high",
    operationType: "TURNING",
    setupInstructions: "Mount in 3-jaw chuck, use steady rest for length",
    toolingRequired: ["WNMG 432", "Threading Insert M12x1.75", "Boring Bar Ø25"],
    programNumber: "O1001",
    estimatedSetupTime: 45,
    actualSetupTime: 52,
    estimatedCycleTime: 12.5,
    actualCycleTime: 11.8,
    qualityRequirements: {
      keyDimensions: ["OD 63.0 ±0.02", "Length 100.0 ±0.1", "Thread M12x1.75"],
      surfaceFinish: "Ra 1.6 μm",
      concentricity: "0.05 TIR"
    }
  },
  {
    orderNumber: "WO-2024-002",
    partNumber: "BEARING-BLOCK-001",
    partName: "Bearing Block Assembly",
    material: "Aluminum",
    materialGrade: "6061-T6",
    rawMaterialSize: "100mm x 80mm x 60mm",
    finishedDimensions: "95mm x 75mm x 55mm",
    quantity: 25,
    completedQuantity: 8,
    status: "setup",
    priority: "normal",
    operationType: "MILLING",
    setupInstructions: "Use 4th axis rotary table, flood coolant required",
    programNumber: "O2001",
    estimatedSetupTime: 60,
    estimatedCycleTime: 28.5,
    qualityRequirements: {
      keyDimensions: ["Bore Ø50 H7", "Mount holes 4x M8", "Flatness 0.02"],
      surfaceFinish: "Ra 3.2 μm"
    }
  },
  {
    orderNumber: "WO-2024-003",
    partNumber: "SHAFT-PRECISION-001",
    partName: "Precision Drive Shaft",
    material: "Stainless Steel",
    materialGrade: "316L",
    rawMaterialSize: "Ø45mm x 300mm",
    finishedDimensions: "Ø42mm x 280mm",
    quantity: 15,
    completedQuantity: 0,
    status: "pending",
    priority: "urgent",
    operationType: "TURNING",
    setupInstructions: "Between centers setup, follow hardness requirements",
    estimatedSetupTime: 90,
    estimatedCycleTime: 45.0,
    qualityRequirements: {
      keyDimensions: ["OD 42.000 ±0.005", "Runout 0.01 TIR"],
      surfaceFinish: "Ra 0.8 μm",
      hardness: "HRC 35-40"
    }
  }
];

export const mockQualityRecords: Partial<QualityRecord>[] = [
  {
    partNumber: "HSK-A63-ER32-100",
    serialNumber: "HSK001-032",
    inspectionType: "in_process",
    result: "pass",
    measurements: {
      "Overall Length": {
        nominal: 100.0,
        tolerance: { plus: 0.1, minus: 0.1 },
        actual: 99.97,
        result: "PASS",
        unit: "mm"
      },
      "Major Diameter": {
        nominal: 63.0,
        tolerance: { plus: 0.02, minus: 0.02 },
        actual: 62.985,
        result: "PASS",
        unit: "mm"
      },
      "Thread Pitch": {
        nominal: 1.75,
        tolerance: { plus: 0.0, minus: 0.0 },
        actual: 1.748,
        result: "PASS",
        unit: "mm"
      }
    },
    surfaceFinish: 1.4,
    concentricity: 0.035,
    runout: 0.018,
    inspectionDate: new Date("2024-01-15T10:30:00"),
    inspectorId: "QC001"
  },
  {
    partNumber: "BEARING-BLOCK-001",
    serialNumber: "BB001-008",
    inspectionType: "first_article",
    result: "rework",
    measurements: {
      "Bore Diameter": {
        nominal: 50.0,
        tolerance: { plus: 0.025, minus: 0.0 },
        actual: 49.985,
        result: "FAIL",
        unit: "mm"
      },
      "Mount Hole 1": {
        nominal: 8.0,
        tolerance: { plus: 0.2, minus: 0.0 },
        actual: 8.05,
        result: "PASS",
        unit: "mm"
      }
    },
    defectType: "dimensional",
    defectLocation: "Main bore - undersize",
    defectDescription: "Bore diameter 0.015mm undersize, requires honing operation",
    correctiveAction: "Send to honing station for bore correction",
    dispositionCode: "REWORK",
    reworkInstructions: "Hone bore to 50.010-50.025mm, verify with plug gauge",
    inspectionDate: new Date("2024-01-15T14:15:00"),
    inspectorId: "QC002"
  },
  {
    partNumber: "SHAFT-PRECISION-001",
    serialNumber: "SP001-001",
    inspectionType: "final",
    result: "pass",
    measurements: {
      "Shaft Diameter": {
        nominal: 42.0,
        tolerance: { plus: 0.005, minus: 0.005 },
        actual: 41.998,
        result: "PASS",
        unit: "mm"
      },
      "Total Length": {
        nominal: 280.0,
        tolerance: { plus: 0.2, minus: 0.2 },
        actual: 279.95,
        result: "PASS",
        unit: "mm"
      }
    },
    surfaceFinish: 0.7,
    hardness: 37.5,
    runout: 0.008,
    inspectionDate: new Date("2024-01-15T16:45:00"),
    inspectorId: "QC001"
  }
];

// Manufacturing operation templates for different machine types
export const operationTemplates = {
  TURNING: {
    ROUGHING: {
      parameters: {
        spindleSpeed: 1200,
        feedRate: 0.3,
        depthOfCut: 2.0,
        coolant: true
      },
      tools: ["WNMG 432", "CNMG 432"]
    },
    FINISHING: {
      parameters: {
        spindleSpeed: 2400,
        feedRate: 0.15,
        depthOfCut: 0.5,
        coolant: true
      },
      tools: ["WNMG 332", "VCGT 331"]
    },
    THREADING: {
      parameters: {
        spindleSpeed: 800,
        feedRate: 1.75,
        coolant: false
      },
      tools: ["Threading Insert M12x1.75"]
    }
  },
  MILLING: {
    FACE_MILLING: {
      parameters: {
        spindleSpeed: 3000,
        feedRate: 1500,
        depthOfCut: 1.0,
        coolant: true
      },
      tools: ["Face Mill Ø100", "Carbide Inserts APKT1604"]
    },
    SLOTTING: {
      parameters: {
        spindleSpeed: 5000,
        feedRate: 800,
        depthOfCut: 3.0,
        coolant: true
      },
      tools: ["End Mill Ø12", "Slot Drill Ø8"]
    }
  },
  GRINDING: {
    SURFACE: {
      parameters: {
        wheelSpeed: 1800,
        tableSpeed: 15,
        depthOfCut: 0.01,
        coolant: true
      },
      tools: ["Grinding Wheel A60-K8-V"]
    }
  }
};

export const commonTolerances = {
  H7: { plus: 0.025, minus: 0.0 },
  h6: { plus: 0.0, minus: 0.016 },
  "±0.1": { plus: 0.1, minus: 0.1 },
  "±0.05": { plus: 0.05, minus: 0.05 },
  "±0.02": { plus: 0.02, minus: 0.02 },
  "+0.2/-0": { plus: 0.2, minus: 0.0 }
};

export const materialProperties = {
  "Steel 4140": {
    density: 7.85,
    hardness: "28-32 HRC",
    tensileStrength: "655-850 MPa",
    machinability: "65%"
  },
  "Aluminum 6061-T6": {
    density: 2.70,
    hardness: "95 HB",
    tensileStrength: "310 MPa",
    machinability: "90%"
  },
  "Stainless Steel 316L": {
    density: 8.00,
    hardness: "79 HRB",
    tensileStrength: "485-620 MPa",
    machinability: "45%"
  }
};