import { 
  type User, type InsertUser,
  type Machine, type InsertMachine,
  type WorkOrder, type InsertWorkOrder,
  type QualityRecord, type InsertQualityRecord,
  type InventoryItem, type InsertInventoryItem,
  type DowntimeEvent, type InsertDowntimeEvent,
  type ProductionLog, type InsertProductionLog,
  type Alert, type InsertAlert,
  type DashboardKPIs, type MachineWithWorkOrder, type RealtimeData,
  type Operation, type InsertOperation,
  type ScheduleSlot, type InsertScheduleSlot,
  type MachineCapability, type InsertMachineCapability,
  type Calendar, type InsertCalendar,
  type SetupMatrix, type InsertSetupMatrix,
  type CapacityBucket, type InsertCapacityBucket,
  type ShiftEntry, type InsertShiftEntry,
  type SchedulingPolicy, type SchedulingConflict,
  type ShiftDefinition
} from "@shared/schema";
import { randomUUID } from "crypto";
import { ProductionScheduler } from "./scheduling";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Machine operations
  getAllMachines(): Promise<Machine[]>;
  getMachine(id: string): Promise<Machine | undefined>;
  createMachine(machine: InsertMachine): Promise<Machine>;
  updateMachine(id: string, updates: Partial<Machine>): Promise<Machine | undefined>;
  getMachinesWithWorkOrders(): Promise<MachineWithWorkOrder[]>;

  // Work Order operations
  getAllWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrder(id: string): Promise<WorkOrder | undefined>;
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder | undefined>;
  getActiveWorkOrders(): Promise<WorkOrder[]>;

  // Quality operations
  getAllQualityRecords(): Promise<QualityRecord[]>;
  getQualityRecord(id: string): Promise<QualityRecord | undefined>;
  createQualityRecord(record: InsertQualityRecord): Promise<QualityRecord>;
  getQualityRecordsByWorkOrder(workOrderId: string): Promise<QualityRecord[]>;

  // Inventory operations
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  getLowStockItems(): Promise<InventoryItem[]>;

  // Downtime operations
  getAllDowntimeEvents(): Promise<DowntimeEvent[]>;
  getDowntimeEvent(id: string): Promise<DowntimeEvent | undefined>;
  createDowntimeEvent(event: InsertDowntimeEvent): Promise<DowntimeEvent>;
  getActiveDowntimeEvents(): Promise<DowntimeEvent[]>;

  // Production operations
  getAllProductionLogs(): Promise<ProductionLog[]>;
  createProductionLog(log: InsertProductionLog): Promise<ProductionLog>;
  getProductionLogsByMachine(machineId: string): Promise<ProductionLog[]>;

  // Alert operations
  getAllAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined>;
  getUnreadAlerts(): Promise<Alert[]>;

  // Dashboard operations
  getDashboardKPIs(): Promise<DashboardKPIs>;
  getRealtimeData(): Promise<RealtimeData>;

  // Raw Materials operations
  getRawMaterials(): Promise<any[]>;
  createRawMaterial(material: any): Promise<any>;

  // Inventory Tools operations
  getInventoryTools(): Promise<any[]>;
  createInventoryTool(tool: any): Promise<any>;

  // Production Planning operations
  getProductionPlans(): Promise<any[]>;
  createProductionPlan(plan: any): Promise<any>;
  getCapacityPlanning(): Promise<any[]>;

  // Scheduling operations
  getAllOperations(): Promise<Operation[]>;
  getOperation(id: string): Promise<Operation | undefined>;
  createOperation(operation: InsertOperation): Promise<Operation>;
  getOperationsByWorkOrder(workOrderId: string): Promise<Operation[]>;
  
  // Schedule Slots operations
  getAllScheduleSlots(): Promise<ScheduleSlot[]>;
  getScheduleSlot(id: string): Promise<ScheduleSlot | undefined>;
  createScheduleSlot(slot: InsertScheduleSlot): Promise<ScheduleSlot>;
  getScheduleSlotsByPlan(planId: string): Promise<ScheduleSlot[]>;
  deleteScheduleSlotsByPlan(planId: string): Promise<void>;
  
  // Machine Capabilities operations
  getAllMachineCapabilities(): Promise<MachineCapability[]>;
  getMachineCapability(machineId: string): Promise<MachineCapability | undefined>;
  createMachineCapability(capability: InsertMachineCapability): Promise<MachineCapability>;
  
  // Calendar operations
  getAllCalendars(): Promise<Calendar[]>;
  getCalendar(id: string): Promise<Calendar | undefined>;
  createCalendar(calendar: InsertCalendar): Promise<Calendar>;
  getDefaultCalendar(): Promise<Calendar | undefined>;
  
  // Setup Matrix operations
  getAllSetupMatrix(): Promise<SetupMatrix[]>;
  createSetupMatrix(setup: InsertSetupMatrix): Promise<SetupMatrix>;
  
  // Capacity Buckets operations
  getCapacityBuckets(machineId?: string, startDate?: Date, endDate?: Date): Promise<CapacityBucket[]>;
  createCapacityBucket(bucket: InsertCapacityBucket): Promise<CapacityBucket>;
  
  // Shift Entries operations
  getAllShiftEntries(): Promise<ShiftEntry[]>;
  createShiftEntry(entry: InsertShiftEntry): Promise<ShiftEntry>;
  getShiftEntriesByMachine(machineId: string): Promise<ShiftEntry[]>;
  
  // Scheduling service operations
  scheduleProduction(planId: string, policy: SchedulingPolicy): Promise<{
    scheduleSlots: ScheduleSlot[],
    conflicts: SchedulingConflict[]
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private machines: Map<string, Machine>;
  private workOrders: Map<string, WorkOrder>;
  private qualityRecords: Map<string, QualityRecord>;
  private inventoryItems: Map<string, InventoryItem>;
  private rawMaterials: Map<string, any>;
  private inventoryTools: Map<string, any>;
  private productionPlans: Map<string, any>;
  private downtimeEvents: Map<string, DowntimeEvent>;
  private productionLogs: Map<string, ProductionLog>;
  private alerts: Map<string, Alert>;
  
  // Scheduling-related storage
  private operations: Map<string, Operation>;
  private scheduleSlots: Map<string, ScheduleSlot>;
  private machineCapabilities: Map<string, MachineCapability>;
  private calendars: Map<string, Calendar>;
  private setupMatrix: Map<string, SetupMatrix>;
  private capacityBuckets: Map<string, CapacityBucket>;
  private shiftEntries: Map<string, ShiftEntry>;

  constructor() {
    this.users = new Map();
    this.machines = new Map();
    this.workOrders = new Map();
    this.qualityRecords = new Map();
    this.inventoryItems = new Map();
    this.rawMaterials = new Map();
    this.inventoryTools = new Map();
    this.productionPlans = new Map();
    this.downtimeEvents = new Map();
    this.productionLogs = new Map();
    this.alerts = new Map();
    
    // Initialize scheduling storage
    this.operations = new Map();
    this.scheduleSlots = new Map();
    this.machineCapabilities = new Map();
    this.calendars = new Map();
    this.setupMatrix = new Map();
    this.capacityBuckets = new Map();
    this.shiftEntries = new Map();

    this.initializeTestData();
  }

  private initializeTestData() {
    // Initialize with some sample data for demonstration
    const now = new Date();
    
    // Sample machines
    const machines: Machine[] = [
      {
        id: "machine-1",
        name: "CNC-001",
        type: "CNC_TURNING",
        operation: "CNC Turning",
        subOperation: null,
        manufacturer: "Mazak",
        model: "MT-2000",
        serialNumber: "MAZ-001-2023",
        location: "Shop Floor A",
        status: "running",
        efficiency: 94,
        currentWorkOrderId: "wo-1",
        lastMaintenanceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextMaintenanceDue: null,
        totalRuntime: 1440,
        maxSpindleSpeed: 5000,
        maxFeedRate: 500.0,
        workEnvelope: { x: 300, y: 200, z: 150 },
        toolCapacity: 12,
        specifications: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "machine-2",
        name: "MILL-003",
        type: "CNC_MILLING",
        operation: "CNC Milling",
        subOperation: null,
        manufacturer: "Haas",
        model: "VF-3",
        serialNumber: "HAS-003-2023",
        location: "Shop Floor B",
        status: "setup",
        efficiency: 0,
        currentWorkOrderId: "wo-2",
        lastMaintenanceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        nextMaintenanceDue: null,
        totalRuntime: 960,
        maxSpindleSpeed: 8000,
        maxFeedRate: 800.0,
        workEnvelope: { x: 400, y: 300, z: 250 },
        toolCapacity: 20,
        specifications: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "machine-3",
        name: "GRIND-002",
        type: "SURFACE_GRINDING",
        operation: "Surface Grinding",
        subOperation: null,
        manufacturer: "Okamoto",
        model: "ACC-64",
        serialNumber: "OKA-002-2022",
        location: "Grinding Cell",
        status: "maintenance",
        efficiency: 0,
        currentWorkOrderId: null,
        lastMaintenanceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        nextMaintenanceDue: null,
        totalRuntime: 2880,
        maxSpindleSpeed: 3000,
        maxFeedRate: 300.0,
        workEnvelope: { x: 600, y: 300, z: 100 },
        toolCapacity: null,
        specifications: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "machine-4",
        name: "WIRE-001",
        type: "WIRE_CUT",
        operation: "Wire Cut EDM",
        subOperation: null,
        manufacturer: "Fanuc",
        model: "ROBOCUT α-C600iA",
        serialNumber: "FAN-001-2024",
        location: "EDM Cell",
        status: "running",
        efficiency: 89,
        currentWorkOrderId: "wo-3",
        lastMaintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextMaintenanceDue: null,
        totalRuntime: 1920,
        maxSpindleSpeed: null,
        maxFeedRate: 150.0,
        workEnvelope: { x: 600, y: 400, z: 250 },
        toolCapacity: null,
        specifications: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    machines.forEach(machine => this.machines.set(machine.id, machine));

    // Sample work orders
    const workOrders: WorkOrder[] = [
      {
        id: "wo-1",
        orderNumber: "WO-2024-001",
        partNumber: "HSK-A63-20-120",
        partName: "Tool Holder HSK-A63",
        customerPartNumber: "HSK-A63-STD",
        drawing: "DWG-HSK-A63-Rev-C",
        material: "Steel",
        materialGrade: "4140",
        rawMaterialSize: "50mm x 150mm x 300mm",
        finishedDimensions: "40mm x 120mm x 250mm",
        quantity: 120,
        completedQuantity: 80,
        status: "in_progress",
        priority: "normal",
        operationType: "TURNING",
        assignedMachineId: "machine-1",
        operatorId: null,
        setupInstructions: "Use standard HSK turning setup",
        toolingRequired: ["T001", "T015", "T022"],
        programNumber: "HSK-TURN-001",
        plannedStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        actualEndDate: null,
        estimatedSetupTime: 120,
        actualSetupTime: 95,
        estimatedCycleTime: 12,
        actualCycleTime: 11.5,
        estimatedHours: 24,
        actualHours: 16,
        qualityRequirements: { tolerances: "±0.05mm", surfaceFinish: "1.6Ra" },
        notes: "Standard production run",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "wo-2",
        orderNumber: "WO-2024-007",
        partNumber: "BT-50-25-200",
        partName: "BT-50 Tool Holder",
        customerPartNumber: "BT-50-CUSTOM",
        drawing: "DWG-BT50-Rev-B",
        material: "Aluminum",
        materialGrade: "6061-T6",
        rawMaterialSize: "60mm x 80mm x 220mm",
        finishedDimensions: "50mm x 75mm x 200mm",
        quantity: 50,
        completedQuantity: 0,
        status: "setup",
        priority: "high",
        operationType: "MILLING",
        assignedMachineId: "machine-2",
        operatorId: null,
        setupInstructions: "Use 4-axis milling setup with custom fixture",
        toolingRequired: ["M001", "M008", "M012"],
        programNumber: "BT50-MILL-002",
        plannedStartDate: new Date(),
        actualStartDate: null,
        plannedEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        actualEndDate: null,
        estimatedSetupTime: 180,
        actualSetupTime: null,
        estimatedCycleTime: 18,
        actualCycleTime: null,
        estimatedHours: 15,
        actualHours: 0,
        qualityRequirements: { tolerances: "±0.025mm", surfaceFinish: "0.8Ra" },
        notes: "Rush order - priority setup",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "wo-3",
        orderNumber: "WO-2024-012",
        partNumber: "EDM-PLT-001",
        partName: "EDM Cutting Plate",
        customerPartNumber: "PLATE-EDM-SPEC",
        drawing: "DWG-EDM-PLT-Rev-A",
        material: "Tool Steel",
        materialGrade: "D2",
        rawMaterialSize: "25mm x 100mm x 150mm",
        finishedDimensions: "20mm x 95mm x 145mm",
        quantity: 20,
        completedQuantity: 9,
        status: "in_progress",
        priority: "normal",
        operationType: "WIRE_CUT",
        assignedMachineId: "machine-4",
        operatorId: null,
        setupInstructions: "0.25mm brass wire, submerged cutting",
        toolingRequired: ["WIRE-0.25", "CLAMP-EDM"],
        programNumber: "EDM-PLATE-003",
        plannedStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        actualEndDate: null,
        estimatedSetupTime: 240,
        actualSetupTime: 210,
        estimatedCycleTime: 120,
        actualCycleTime: 115,
        estimatedHours: 40,
        actualHours: 18,
        qualityRequirements: { tolerances: "±0.01mm", surfaceFinish: "0.4Ra" },
        notes: "Precision wire cutting required",
        createdAt: now,
        updatedAt: now,
      },
    ];

    workOrders.forEach(wo => this.workOrders.set(wo.id, wo));

    // Sample inventory items
    const inventoryItems: InventoryItem[] = [
      {
        id: "inv-1",
        itemCode: "STL-BAR-001",
        name: "Steel Bar Stock",
        category: "raw_material",
        currentStock: 125,
        unit: "kg",
        minStockLevel: 200,
        maxStockLevel: 1000,
        unitCost: 3.5,
        location: "Warehouse A-1",
        lastUpdated: now,
        createdAt: now,
      },
      {
        id: "inv-2",
        itemCode: "ALU-BLK-001",
        name: "Aluminum Blocks",
        category: "raw_material",
        currentStock: 890,
        unit: "kg",
        minStockLevel: 300,
        maxStockLevel: 1200,
        unitCost: 7.2,
        location: "Warehouse A-2",
        lastUpdated: now,
        createdAt: now,
      },
      {
        id: "inv-3",
        itemCode: "CUT-TL-001",
        name: "Cutting Tools",
        category: "tool",
        currentStock: 67,
        unit: "pieces",
        minStockLevel: 50,
        maxStockLevel: 200,
        unitCost: 25.0,
        location: "Tool Crib B-1",
        lastUpdated: now,
        createdAt: now,
      },
    ];

    inventoryItems.forEach(item => this.inventoryItems.set(item.id, item));

    // Sample alerts
    const alerts: Alert[] = [
      {
        id: "alert-1",
        type: "error",
        title: "Machine Maintenance Required",
        message: "GRIND-002 requires maintenance",
        source: "machine",
        sourceId: "machine-3",
        severity: "high",
        isRead: false,
        isResolved: false,
        resolvedBy: null,
        resolvedAt: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "alert-2",
        type: "warning",
        title: "Low Stock Alert",
        message: "Steel bar stock running low",
        source: "inventory",
        sourceId: "inv-1",
        severity: "medium",
        isRead: false,
        isResolved: false,
        resolvedBy: null,
        resolvedAt: null,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        id: "alert-3",
        type: "success",
        title: "Work Order Completed",
        message: "WO-2024-005 completed successfully",
        source: "system",
        sourceId: "wo-5",
        severity: "low",
        isRead: false,
        isResolved: true,
        resolvedBy: "user-1",
        resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ];

    alerts.forEach(alert => this.alerts.set(alert.id, alert));

    // Sample calendars
    const defaultCalendar: Calendar = {
      id: "calendar-1",
      name: "Standard Production Schedule",
      shifts: [
        { name: "Day Shift", startTime: "07:00", endTime: "15:00", breakMinutes: 30 },
        { name: "Evening Shift", startTime: "15:00", endTime: "23:00", breakMinutes: 30 },
        { name: "Night Shift", startTime: "23:00", endTime: "07:00", breakMinutes: 30 }
      ],
      workDays: [1, 2, 3, 4, 5], // Monday to Friday
      exceptions: [],
      timezone: "UTC",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };
    this.calendars.set(defaultCalendar.id, defaultCalendar);

    // Sample machine capabilities
    const machineCapabilities: MachineCapability[] = [
      {
        id: "cap-1",
        machineId: "machine-1",
        machineTypes: ["CNC_TURNING", "CONVENTIONAL_TURNING"],
        operationFamilies: ["TURNING_STEEL", "TURNING_ALUMINUM"],
        efficiency: 0.95,
        calendarId: "calendar-1",
        preferredOperations: ["TURNING", "THREADING", "BORING"],
        alternativeOperations: ["FACING"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cap-2",
        machineId: "machine-2",
        machineTypes: ["CNC_MILLING", "CONVENTIONAL_MILLING"],
        operationFamilies: ["MILLING_ALUMINUM", "MILLING_STEEL"],
        efficiency: 0.92,
        calendarId: "calendar-1",
        preferredOperations: ["MILLING", "DRILLING", "TAPPING"],
        alternativeOperations: ["BORING"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cap-3",
        machineId: "machine-3",
        machineTypes: ["SURFACE_GRINDING", "CYLINDRICAL_GRINDING"],
        operationFamilies: ["GRINDING_STEEL", "GRINDING_CARBIDE"],
        efficiency: 0.88,
        calendarId: "calendar-1",
        preferredOperations: ["SURFACE_GRINDING", "CYLINDRICAL_GRINDING"],
        alternativeOperations: [],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "cap-4",
        machineId: "machine-4",
        machineTypes: ["WIRE_CUT", "SINK_EDM"],
        operationFamilies: ["EDM_STEEL", "EDM_CARBIDE"],
        efficiency: 0.90,
        calendarId: "calendar-1",
        preferredOperations: ["WIRE_CUT", "SINK_EDM"],
        alternativeOperations: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
    machineCapabilities.forEach(cap => this.machineCapabilities.set(cap.id, cap));

    // Sample setup matrix
    const setupMatrix: SetupMatrix[] = [
      {
        id: "setup-1",
        fromFamily: "TURNING_STEEL",
        toFamily: "TURNING_STEEL",
        changeoverMinutes: 15,
        machineType: "CNC_TURNING",
        description: "Same material family - minimal setup",
        createdAt: now,
      },
      {
        id: "setup-2",
        fromFamily: "TURNING_STEEL",
        toFamily: "TURNING_ALUMINUM",
        changeoverMinutes: 45,
        machineType: "CNC_TURNING",
        description: "Material change - coolant switch required",
        createdAt: now,
      },
      {
        id: "setup-3",
        fromFamily: "TURNING_ALUMINUM",
        toFamily: "TURNING_STEEL",
        changeoverMinutes: 60,
        machineType: "CNC_TURNING",
        description: "Material change - thorough cleaning required",
        createdAt: now,
      },
      {
        id: "setup-4",
        fromFamily: "MILLING_ALUMINUM",
        toFamily: "MILLING_ALUMINUM",
        changeoverMinutes: 20,
        machineType: "CNC_MILLING",
        description: "Same material family - tool change only",
        createdAt: now,
      },
      {
        id: "setup-5",
        fromFamily: "MILLING_ALUMINUM",
        toFamily: "MILLING_STEEL",
        changeoverMinutes: 75,
        machineType: "CNC_MILLING",
        description: "Material change - significant setup time",
        createdAt: now,
      },
    ];
    setupMatrix.forEach(setup => this.setupMatrix.set(setup.id, setup));

    // Sample operations
    const operations: Operation[] = [
      {
        id: "op-1",
        workOrderId: "wo-1",
        operationNumber: 10,
        operationType: "TURNING",
        operationDescription: "Rough turn OD to 40mm",
        location: "INTERNAL",
        vendorName: null,
        vendorContact: null,
        machineTypes: ["CNC_TURNING", "CONVENTIONAL_TURNING"],
        assignedMachineId: "machine-1",
        setupTimeMinutes: 120,
        runTimeMinutesPerUnit: 11.5,
        batchSize: 1,
        operationFamily: "TURNING_STEEL",
        leadTimeDays: null,
        costPerPiece: 12.50,
        toolingRequired: ["T001", "T015"],
        requiredSkills: ["CNC_OPERATOR"],
        workInstructions: "Use standard HSK turning setup with flood coolant",
        specialRequirements: null,
        qualityChecks: [{ "dimension": "OD", "tolerance": "±0.05mm" }],
        predecessorOperationIds: [],
        successorOperationIds: ["op-2"],
        priority: 100,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: "in_progress",
        plannedStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        actualEndDate: null,
        completedBy: null,
        completedAt: null,
        schedulingWeight: 1.0,
        isBottleneck: false,
        notes: "Standard production operation",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "op-2",
        workOrderId: "wo-1",
        operationNumber: 20,
        operationType: "TURNING",
        operationDescription: "Finish turn and thread M12x1.5",
        location: "INTERNAL",
        vendorName: null,
        vendorContact: null,
        machineTypes: ["CNC_TURNING"],
        assignedMachineId: null,
        setupTimeMinutes: 30,
        runTimeMinutesPerUnit: 8.0,
        batchSize: 1,
        operationFamily: "TURNING_STEEL",
        leadTimeDays: null,
        costPerPiece: 8.75,
        toolingRequired: ["T022", "T030"],
        requiredSkills: ["CNC_OPERATOR"],
        workInstructions: "Finish turn to final dimensions then thread",
        specialRequirements: "Check thread pitch gauge",
        qualityChecks: [{ "dimension": "Thread", "tolerance": "Class 6H" }],
        predecessorOperationIds: ["op-1"],
        successorOperationIds: [],
        priority: 100,
        dueDate: new Date(Date.now() + 36 * 60 * 60 * 1000),
        status: "pending",
        plannedStartDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        actualStartDate: null,
        plannedEndDate: new Date(Date.now() + 36 * 60 * 60 * 1000),
        actualEndDate: null,
        completedBy: null,
        completedAt: null,
        schedulingWeight: 1.2,
        isBottleneck: true,
        notes: "Critical threading operation",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "op-3",
        workOrderId: "wo-2",
        operationNumber: 10,
        operationType: "MILLING",
        operationDescription: "Rough mill pockets and slots",
        location: "INTERNAL",
        vendorName: null,
        vendorContact: null,
        machineTypes: ["CNC_MILLING"],
        assignedMachineId: "machine-2",
        setupTimeMinutes: 180,
        runTimeMinutesPerUnit: 18.0,
        batchSize: 1,
        operationFamily: "MILLING_ALUMINUM",
        leadTimeDays: null,
        costPerPiece: 25.00,
        toolingRequired: ["M001", "M008"],
        requiredSkills: ["CNC_OPERATOR", "SETUP_SPECIALIST"],
        workInstructions: "Use 4-axis setup with custom fixture",
        specialRequirements: "High pressure coolant required",
        qualityChecks: [{ "dimension": "Pocket depth", "tolerance": "±0.025mm" }],
        predecessorOperationIds: [],
        successorOperationIds: ["op-4"],
        priority: 50,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: "setup",
        plannedStartDate: new Date(),
        actualStartDate: null,
        plannedEndDate: new Date(Date.now() + 18 * 60 * 60 * 1000),
        actualEndDate: null,
        completedBy: null,
        completedAt: null,
        schedulingWeight: 1.5,
        isBottleneck: false,
        notes: "Rush order - high priority setup",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "op-4",
        workOrderId: "wo-2",
        operationNumber: 20,
        operationType: "MILLING",
        operationDescription: "Finish mill all surfaces",
        location: "INTERNAL",
        vendorName: null,
        vendorContact: null,
        machineTypes: ["CNC_MILLING"],
        assignedMachineId: null,
        setupTimeMinutes: 45,
        runTimeMinutesPerUnit: 12.0,
        batchSize: 1,
        operationFamily: "MILLING_ALUMINUM",
        leadTimeDays: null,
        costPerPiece: 18.50,
        toolingRequired: ["M012", "M020"],
        requiredSkills: ["CNC_OPERATOR"],
        workInstructions: "Finish all surfaces to drawing specs",
        specialRequirements: "Surface finish 0.8Ra required",
        qualityChecks: [{ "dimension": "Surface finish", "tolerance": "0.8Ra max" }],
        predecessorOperationIds: ["op-3"],
        successorOperationIds: [],
        priority: 50,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: "pending",
        plannedStartDate: new Date(Date.now() + 18 * 60 * 60 * 1000),
        actualStartDate: null,
        plannedEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        actualEndDate: null,
        completedBy: null,
        completedAt: null,
        schedulingWeight: 1.0,
        isBottleneck: false,
        notes: "Precision finishing required",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "op-5",
        workOrderId: "wo-3",
        operationNumber: 10,
        operationType: "WIRE_CUT",
        operationDescription: "Wire cut complex profile",
        location: "INTERNAL",
        vendorName: null,
        vendorContact: null,
        machineTypes: ["WIRE_CUT"],
        assignedMachineId: "machine-4",
        setupTimeMinutes: 240,
        runTimeMinutesPerUnit: 115.0,
        batchSize: 1,
        operationFamily: "EDM_STEEL",
        leadTimeDays: null,
        costPerPiece: 85.00,
        toolingRequired: ["WIRE-0.25", "CLAMP-EDM"],
        requiredSkills: ["EDM_OPERATOR"],
        workInstructions: "0.25mm brass wire, submerged cutting",
        specialRequirements: "±0.01mm tolerance critical",
        qualityChecks: [{ "dimension": "Profile", "tolerance": "±0.01mm" }],
        predecessorOperationIds: [],
        successorOperationIds: [],
        priority: 100,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: "in_progress",
        plannedStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        actualEndDate: null,
        completedBy: null,
        completedAt: null,
        schedulingWeight: 2.0,
        isBottleneck: true,
        notes: "Precision wire cutting required",
        createdAt: now,
        updatedAt: now,
      },
    ];
    operations.forEach(op => this.operations.set(op.id, op));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "operator",
      email: insertUser.email || null,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Machine operations
  async getAllMachines(): Promise<Machine[]> {
    return Array.from(this.machines.values());
  }

  async getMachine(id: string): Promise<Machine | undefined> {
    return this.machines.get(id);
  }

  async createMachine(insertMachine: InsertMachine): Promise<Machine> {
    const id = randomUUID();
    const machine: Machine = { 
      ...insertMachine,
      status: insertMachine.status || "idle",
      efficiency: insertMachine.efficiency || 0,
      currentWorkOrderId: insertMachine.currentWorkOrderId || null,
      totalRuntime: insertMachine.totalRuntime || 0,
      lastMaintenanceDate: insertMachine.lastMaintenanceDate || null,
      nextMaintenanceDue: insertMachine.nextMaintenanceDue || null,
      subOperation: insertMachine.subOperation || null,
      manufacturer: insertMachine.manufacturer || null,
      model: insertMachine.model || null,
      serialNumber: insertMachine.serialNumber || null,
      location: insertMachine.location || null,
      maxSpindleSpeed: insertMachine.maxSpindleSpeed || null,
      maxFeedRate: insertMachine.maxFeedRate || null,
      workEnvelope: insertMachine.workEnvelope || null,
      toolCapacity: insertMachine.toolCapacity || null,
      specifications: insertMachine.specifications || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.machines.set(id, machine);
    return machine;
  }

  async updateMachine(id: string, updates: Partial<Machine>): Promise<Machine | undefined> {
    const machine = this.machines.get(id);
    if (!machine) return undefined;
    
    const updatedMachine = { ...machine, ...updates, updatedAt: new Date() };
    this.machines.set(id, updatedMachine);
    return updatedMachine;
  }

  async getMachinesWithWorkOrders(): Promise<MachineWithWorkOrder[]> {
    const machines = Array.from(this.machines.values());
    return machines.map(machine => {
      const workOrder = machine.currentWorkOrderId ? 
        this.workOrders.get(machine.currentWorkOrderId) : undefined;
      
      // Calculate downtime for maintenance status
      let downtime = 0;
      if (machine.status === "maintenance") {
        const downtimeEvent = Array.from(this.downtimeEvents.values())
          .find(event => event.machineId === machine.id && !event.endTime);
        if (downtimeEvent) {
          downtime = Math.floor((Date.now() - downtimeEvent.startTime.getTime()) / (1000 * 60));
        }
      }

      return { ...machine, workOrder, downtime };
    });
  }

  // Work Order operations
  async getAllWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values());
  }

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = randomUUID();
    const workOrder: WorkOrder = { 
      ...insertWorkOrder,
      status: insertWorkOrder.status || "pending",
      priority: insertWorkOrder.priority || "normal",
      completedQuantity: insertWorkOrder.completedQuantity || 0,
      assignedMachineId: insertWorkOrder.assignedMachineId || null,
      operatorId: insertWorkOrder.operatorId || null,
      customerPartNumber: insertWorkOrder.customerPartNumber || null,
      drawing: insertWorkOrder.drawing || null,
      material: insertWorkOrder.material || null,
      materialGrade: insertWorkOrder.materialGrade || null,
      rawMaterialSize: insertWorkOrder.rawMaterialSize || null,
      finishedDimensions: insertWorkOrder.finishedDimensions || null,
      setupInstructions: insertWorkOrder.setupInstructions || null,
      programNumber: insertWorkOrder.programNumber || null,
      plannedStartDate: insertWorkOrder.plannedStartDate || null,
      actualStartDate: insertWorkOrder.actualStartDate || null,
      plannedEndDate: insertWorkOrder.plannedEndDate || null,
      actualEndDate: insertWorkOrder.actualEndDate || null,
      estimatedSetupTime: insertWorkOrder.estimatedSetupTime || null,
      actualSetupTime: insertWorkOrder.actualSetupTime || null,
      estimatedCycleTime: insertWorkOrder.estimatedCycleTime || null,
      actualCycleTime: insertWorkOrder.actualCycleTime || null,
      estimatedHours: insertWorkOrder.estimatedHours || null,
      actualHours: insertWorkOrder.actualHours || null,
      qualityRequirements: insertWorkOrder.qualityRequirements || null,
      notes: insertWorkOrder.notes || null,
      toolingRequired: insertWorkOrder.toolingRequired || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workOrders.set(id, workOrder);
    return workOrder;
  }

  async updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder | undefined> {
    const workOrder = this.workOrders.get(id);
    if (!workOrder) return undefined;
    
    const updatedWorkOrder = { ...workOrder, ...updates, updatedAt: new Date() };
    this.workOrders.set(id, updatedWorkOrder);
    return updatedWorkOrder;
  }

  async getActiveWorkOrders(): Promise<WorkOrder[]> {
    return Array.from(this.workOrders.values())
      .filter(wo => wo.status === "in_progress" || wo.status === "setup")
      .slice(0, 10);
  }

  // Quality operations
  async getAllQualityRecords(): Promise<QualityRecord[]> {
    return Array.from(this.qualityRecords.values());
  }

  async getQualityRecord(id: string): Promise<QualityRecord | undefined> {
    return this.qualityRecords.get(id);
  }

  async createQualityRecord(insertRecord: InsertQualityRecord): Promise<QualityRecord> {
    const id = randomUUID();
    const record: QualityRecord = { 
      ...insertRecord,
      serialNumber: insertRecord.serialNumber || null,
      measurements: insertRecord.measurements || null,
      criticalDimensions: insertRecord.criticalDimensions || null,
      surfaceFinish: insertRecord.surfaceFinish || null,
      hardness: insertRecord.hardness || null,
      concentricity: insertRecord.concentricity || null,
      runout: insertRecord.runout || null,
      defectType: insertRecord.defectType || null,
      defectLocation: insertRecord.defectLocation || null,
      defectDescription: insertRecord.defectDescription || null,
      gaugeCalibrationDue: insertRecord.gaugeCalibrationDue || null,
      correctiveAction: insertRecord.correctiveAction || null,
      dispositionCode: insertRecord.dispositionCode || null,
      reworkInstructions: insertRecord.reworkInstructions || null,
      inspectionDate: insertRecord.inspectionDate || new Date(),
      id,
      createdAt: new Date(),
    };
    this.qualityRecords.set(id, record);
    return record;
  }

  async getQualityRecordsByWorkOrder(workOrderId: string): Promise<QualityRecord[]> {
    return Array.from(this.qualityRecords.values())
      .filter(record => record.workOrderId === workOrderId);
  }

  // Inventory operations
  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const item: InventoryItem = { 
      ...insertItem,
      currentStock: insertItem.currentStock || 0,
      minStockLevel: insertItem.minStockLevel || 0,
      maxStockLevel: insertItem.maxStockLevel || null,
      unitCost: insertItem.unitCost || null,
      location: insertItem.location || null,
      id,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates, lastUpdated: new Date() };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.currentStock <= item.minStockLevel);
  }

  // Downtime operations
  async getAllDowntimeEvents(): Promise<DowntimeEvent[]> {
    return Array.from(this.downtimeEvents.values());
  }

  async getDowntimeEvent(id: string): Promise<DowntimeEvent | undefined> {
    return this.downtimeEvents.get(id);
  }

  async createDowntimeEvent(insertEvent: InsertDowntimeEvent): Promise<DowntimeEvent> {
    const id = randomUUID();
    const event: DowntimeEvent = { 
      ...insertEvent,
      endTime: insertEvent.endTime || null,
      duration: insertEvent.duration || null,
      description: insertEvent.description || null,
      resolvedBy: insertEvent.resolvedBy || null,
      id,
      createdAt: new Date(),
    };
    this.downtimeEvents.set(id, event);
    return event;
  }

  async getActiveDowntimeEvents(): Promise<DowntimeEvent[]> {
    return Array.from(this.downtimeEvents.values())
      .filter(event => !event.endTime);
  }

  // Production operations
  async getAllProductionLogs(): Promise<ProductionLog[]> {
    return Array.from(this.productionLogs.values());
  }

  async createProductionLog(insertLog: InsertProductionLog): Promise<ProductionLog> {
    const id = randomUUID();
    const log: ProductionLog = { 
      ...insertLog,
      timestamp: insertLog.timestamp || new Date(),
      shiftId: insertLog.shiftId || null,
      cycleTime: insertLog.cycleTime || null,
      id,
      createdAt: new Date(),
    };
    this.productionLogs.set(id, log);
    return log;
  }

  async getProductionLogsByMachine(machineId: string): Promise<ProductionLog[]> {
    return Array.from(this.productionLogs.values())
      .filter(log => log.machineId === machineId);
  }

  // Alert operations
  async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = { 
      ...insertAlert,
      sourceId: insertAlert.sourceId || null,
      severity: insertAlert.severity || "medium",
      isRead: insertAlert.isRead ?? false,
      isResolved: insertAlert.isResolved ?? false,
      resolvedBy: insertAlert.resolvedBy || null,
      resolvedAt: insertAlert.resolvedAt || null,
      id,
      createdAt: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert = { ...alert, ...updates };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);
  }

  // Dashboard operations
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const machines = Array.from(this.machines.values());
    const workOrders = Array.from(this.workOrders.values());
    const qualityRecords = Array.from(this.qualityRecords.values());
    
    const totalMachines = machines.length;
    const activeMachines = machines.filter(m => m.status === "running").length;
    
    // Calculate overall OEE (simplified)
    const runningMachines = machines.filter(m => m.status === "running");
    const overallOEE = runningMachines.length > 0 ? 
      runningMachines.reduce((sum, m) => sum + (m.efficiency || 0), 0) / runningMachines.length : 0;
    
    // Calculate production rate (units/hour)
    const recentLogs = Array.from(this.productionLogs.values())
      .filter(log => log.timestamp.getTime() > Date.now() - 60 * 60 * 1000); // Last hour
    const productionRate = recentLogs.reduce((sum, log) => sum + log.quantityProduced, 0);
    
    // Calculate quality rate
    const recentQualityRecords = qualityRecords
      .filter(record => record.inspectionDate.getTime() > Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const passedRecords = recentQualityRecords.filter(record => record.result === "pass");
    const qualityRate = recentQualityRecords.length > 0 ? 
      (passedRecords.length / recentQualityRecords.length) * 100 : 99.2;
    
    // Calculate setup efficiency and cycle time variance for enhanced KPIs
    const setupTime = workOrders
      .filter(wo => wo.actualSetupTime && wo.estimatedSetupTime)
      .reduce((sum, wo) => sum + ((wo.estimatedSetupTime || 0) / (wo.actualSetupTime || 1)), 0);
    const setupEfficiency = setupTime > 0 ? (setupTime / workOrders.length) * 100 : 95;

    const cycleTimeVariance = workOrders
      .filter(wo => wo.actualCycleTime && wo.estimatedCycleTime)
      .reduce((sum, wo) => {
        const variance = Math.abs((wo.actualCycleTime || 0) - (wo.estimatedCycleTime || 0));
        return sum + (variance / (wo.estimatedCycleTime || 1));
      }, 0);

    return {
      overallOEE: Math.round(overallOEE * 10) / 10,
      activeMachines,
      totalMachines,
      productionRate,
      qualityRate: Math.round(qualityRate * 10) / 10,
      setupEfficiency: Math.round(setupEfficiency * 10) / 10,
      cycleTimeVariance: Math.round(cycleTimeVariance * 10) / 10,
    };
  }

  async getRealtimeData(): Promise<RealtimeData> {
    const kpis = await this.getDashboardKPIs();
    const machines = await this.getMachinesWithWorkOrders();
    const activeWorkOrders = await this.getActiveWorkOrders();
    const alerts = await this.getUnreadAlerts();
    
    // Generate mock time series data
    const now = Date.now();
    const productionData = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now - (23 - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 200) + 600,
    }));
    
    const oeeData = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now - (23 - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 15) + 75,
    }));
    
    const qualityTrends = Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now - (23 - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 5) + 95,
    }));
    
    return {
      kpis,
      machines,
      activeWorkOrders,
      alerts,
      productionData,
      oeeData,
      qualityTrends,
    };
  }

  // Raw Materials operations
  async getRawMaterials(): Promise<any[]> {
    return Array.from(this.rawMaterials.values());
  }

  async createRawMaterial(material: any): Promise<any> {
    const id = randomUUID();
    const sku = `RM-${material.materialType.substring(0,2).toUpperCase()}-${material.grade}-${Date.now()}`;
    const newMaterial = {
      ...material,
      id,
      sku,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rawMaterials.set(id, newMaterial);
    return newMaterial;
  }

  // Inventory Tools operations
  async getInventoryTools(): Promise<any[]> {
    return Array.from(this.inventoryTools.values());
  }

  async createInventoryTool(tool: any): Promise<any> {
    const id = randomUUID();
    const sku = `TL-${tool.toolType.substring(0,2).toUpperCase()}-${tool.size}-${Date.now()}`;
    const newTool = {
      ...tool,
      id,
      sku,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.inventoryTools.set(id, newTool);
    return newTool;
  }

  // Production Planning operations
  async getProductionPlans(): Promise<any[]> {
    return Array.from(this.productionPlans.values());
  }

  async createProductionPlan(plan: any): Promise<any> {
    const id = randomUUID();
    const newPlan = {
      ...plan,
      id,
      totalWorkOrders: 0,
      completedWorkOrders: 0,
      efficiency: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.productionPlans.set(id, newPlan);
    return newPlan;
  }

  async getCapacityPlanning(): Promise<any[]> {
    // Return mock capacity planning data for demonstration
    return [];
  }

  // Operations methods
  async getAllOperations(): Promise<Operation[]> {
    return Array.from(this.operations.values())
      .sort((a, b) => a.operationNumber - b.operationNumber);
  }

  async getOperation(id: string): Promise<Operation | undefined> {
    return this.operations.get(id);
  }

  async createOperation(insertOperation: InsertOperation): Promise<Operation> {
    const id = randomUUID();
    const operation: Operation = {
      ...insertOperation,
      vendorName: insertOperation.vendorName || null,
      vendorContact: insertOperation.vendorContact || null,
      machineTypes: insertOperation.machineTypes || null,
      assignedMachineId: insertOperation.assignedMachineId || null,
      setupTimeMinutes: insertOperation.setupTimeMinutes || null,
      runTimeMinutesPerUnit: insertOperation.runTimeMinutesPerUnit || null,
      batchSize: insertOperation.batchSize || null,
      operationFamily: insertOperation.operationFamily || null,
      leadTimeDays: insertOperation.leadTimeDays || null,
      costPerPiece: insertOperation.costPerPiece || null,
      toolingRequired: insertOperation.toolingRequired || null,
      requiredSkills: insertOperation.requiredSkills || null,
      workInstructions: insertOperation.workInstructions || null,
      specialRequirements: insertOperation.specialRequirements || null,
      qualityChecks: insertOperation.qualityChecks || null,
      predecessorOperationIds: insertOperation.predecessorOperationIds || null,
      successorOperationIds: insertOperation.successorOperationIds || null,
      priority: insertOperation.priority || 100,
      dueDate: insertOperation.dueDate || null,
      status: insertOperation.status || "pending",
      plannedStartDate: insertOperation.plannedStartDate || null,
      actualStartDate: insertOperation.actualStartDate || null,
      plannedEndDate: insertOperation.plannedEndDate || null,
      actualEndDate: insertOperation.actualEndDate || null,
      completedBy: insertOperation.completedBy || null,
      completedAt: insertOperation.completedAt || null,
      schedulingWeight: insertOperation.schedulingWeight || 1.0,
      isBottleneck: insertOperation.isBottleneck || false,
      notes: insertOperation.notes || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.operations.set(id, operation);
    return operation;
  }

  async getOperationsByWorkOrder(workOrderId: string): Promise<Operation[]> {
    return Array.from(this.operations.values())
      .filter(op => op.workOrderId === workOrderId)
      .sort((a, b) => a.operationNumber - b.operationNumber);
  }

  // Schedule Slots methods
  async getAllScheduleSlots(): Promise<ScheduleSlot[]> {
    return Array.from(this.scheduleSlots.values())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async getScheduleSlot(id: string): Promise<ScheduleSlot | undefined> {
    return this.scheduleSlots.get(id);
  }

  async createScheduleSlot(insertSlot: InsertScheduleSlot): Promise<ScheduleSlot> {
    const id = randomUUID();
    const slot: ScheduleSlot = {
      ...insertSlot,
      setupMinutes: insertSlot.setupMinutes || 0,
      priority: insertSlot.priority || 100,
      status: insertSlot.status || "scheduled",
      actualStartTime: insertSlot.actualStartTime || null,
      actualEndTime: insertSlot.actualEndTime || null,
      actualSetupMinutes: insertSlot.actualSetupMinutes || null,
      actualRunMinutes: insertSlot.actualRunMinutes || null,
      schedulingRule: insertSlot.schedulingRule || null,
      conflictFlags: insertSlot.conflictFlags || [],
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scheduleSlots.set(id, slot);
    return slot;
  }

  async getScheduleSlotsByPlan(planId: string): Promise<ScheduleSlot[]> {
    return Array.from(this.scheduleSlots.values())
      .filter(slot => slot.planId === planId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async deleteScheduleSlotsByPlan(planId: string): Promise<void> {
    const slotsToDelete = Array.from(this.scheduleSlots.entries())
      .filter(([id, slot]) => slot.planId === planId)
      .map(([id]) => id);
    
    slotsToDelete.forEach(id => this.scheduleSlots.delete(id));
  }

  // Machine Capabilities methods
  async getAllMachineCapabilities(): Promise<MachineCapability[]> {
    return Array.from(this.machineCapabilities.values());
  }

  async getMachineCapability(machineId: string): Promise<MachineCapability | undefined> {
    return Array.from(this.machineCapabilities.values())
      .find(cap => cap.machineId === machineId);
  }

  async createMachineCapability(insertCapability: InsertMachineCapability): Promise<MachineCapability> {
    const id = randomUUID();
    const capability: MachineCapability = {
      ...insertCapability,
      efficiency: insertCapability.efficiency || 1.0,
      preferredOperations: insertCapability.preferredOperations || null,
      alternativeOperations: insertCapability.alternativeOperations || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.machineCapabilities.set(id, capability);
    return capability;
  }

  // Calendar methods
  async getAllCalendars(): Promise<Calendar[]> {
    return Array.from(this.calendars.values());
  }

  async getCalendar(id: string): Promise<Calendar | undefined> {
    return this.calendars.get(id);
  }

  async createCalendar(insertCalendar: InsertCalendar): Promise<Calendar> {
    const id = randomUUID();
    const calendar: Calendar = {
      ...insertCalendar,
      exceptions: insertCalendar.exceptions || null,
      timezone: insertCalendar.timezone || "UTC",
      isDefault: insertCalendar.isDefault || false,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.calendars.set(id, calendar);
    return calendar;
  }

  async getDefaultCalendar(): Promise<Calendar | undefined> {
    return Array.from(this.calendars.values())
      .find(calendar => calendar.isDefault);
  }

  // Setup Matrix methods
  async getAllSetupMatrix(): Promise<SetupMatrix[]> {
    return Array.from(this.setupMatrix.values());
  }

  async createSetupMatrix(insertSetup: InsertSetupMatrix): Promise<SetupMatrix> {
    const id = randomUUID();
    const setup: SetupMatrix = {
      ...insertSetup,
      description: insertSetup.description || null,
      id,
      createdAt: new Date(),
    };
    this.setupMatrix.set(id, setup);
    return setup;
  }

  // Capacity Buckets methods
  async getCapacityBuckets(machineId?: string, startDate?: Date, endDate?: Date): Promise<CapacityBucket[]> {
    let buckets = Array.from(this.capacityBuckets.values());
    
    if (machineId) {
      buckets = buckets.filter(bucket => bucket.machineId === machineId);
    }
    
    if (startDate) {
      buckets = buckets.filter(bucket => new Date(bucket.date) >= startDate);
    }
    
    if (endDate) {
      buckets = buckets.filter(bucket => new Date(bucket.date) <= endDate);
    }
    
    return buckets.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createCapacityBucket(insertBucket: InsertCapacityBucket): Promise<CapacityBucket> {
    const id = randomUUID();
    const bucket: CapacityBucket = {
      ...insertBucket,
      hour: insertBucket.hour || null,
      plannedMinutes: insertBucket.plannedMinutes || 0,
      actualMinutes: insertBucket.actualMinutes || 0,
      utilization: insertBucket.utilization || 0,
      actualUtilization: insertBucket.actualUtilization || 0,
      isOverloaded: insertBucket.isOverloaded || false,
      overloadPercentage: insertBucket.overloadPercentage || 0,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.capacityBuckets.set(id, bucket);
    return bucket;
  }

  // Shift Entries methods
  async getAllShiftEntries(): Promise<ShiftEntry[]> {
    return Array.from(this.shiftEntries.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createShiftEntry(insertEntry: InsertShiftEntry): Promise<ShiftEntry> {
    const id = randomUUID();
    const entry: ShiftEntry = {
      ...insertEntry,
      runMinutes: insertEntry.runMinutes || 0,
      setupMinutes: insertEntry.setupMinutes || 0,
      downtimeMinutes: insertEntry.downtimeMinutes || 0,
      maintenanceMinutes: insertEntry.maintenanceMinutes || 0,
      goodQuantity: insertEntry.goodQuantity || 0,
      scrapQuantity: insertEntry.scrapQuantity || 0,
      reworkQuantity: insertEntry.reworkQuantity || 0,
      cycleTimeActual: insertEntry.cycleTimeActual || null,
      cycleTimeStandard: insertEntry.cycleTimeStandard || null,
      oeeAvailability: insertEntry.oeeAvailability || 0,
      oeePerformance: insertEntry.oeePerformance || 0,
      oeeQuality: insertEntry.oeeQuality || 0,
      oeeOverall: insertEntry.oeeOverall || 0,
      scheduleAdherence: insertEntry.scheduleAdherence || 0,
      notes: insertEntry.notes || null,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.shiftEntries.set(id, entry);
    return entry;
  }

  async getShiftEntriesByMachine(machineId: string): Promise<ShiftEntry[]> {
    return Array.from(this.shiftEntries.values())
      .filter(entry => entry.machineId === machineId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Scheduling service operations
  async scheduleProduction(planId: string, policy: SchedulingPolicy): Promise<{
    scheduleSlots: ScheduleSlot[],
    conflicts: SchedulingConflict[]
  }> {
    try {
      // Get all required data for scheduling
      const operations = await this.getAllOperations();
      const workOrders = await this.getAllWorkOrders();
      const machines = await this.getAllMachines();
      const capabilities = await this.getAllMachineCapabilities();
      const setupMatrix = await this.getAllSetupMatrix();
      const defaultCalendar = await this.getDefaultCalendar();
      const existingSlots = await this.getScheduleSlotsByPlan(planId);

      if (!defaultCalendar) {
        throw new Error("No default calendar found for scheduling");
      }

      // Filter operations for pending/scheduled work orders only
      const activeOperations = operations.filter(op => {
        const workOrder = workOrders.find(wo => wo.id === op.workOrderId);
        return workOrder && ['pending', 'in_progress', 'setup'].includes(workOrder.status);
      });

      // Use ProductionScheduler to generate schedule
      const result = await ProductionScheduler.scheduleOperations(
        activeOperations,
        workOrders,
        machines,
        capabilities,
        defaultCalendar,
        setupMatrix,
        policy,
        existingSlots
      );

      // Clear existing schedule slots for this plan
      await this.deleteScheduleSlotsByPlan(planId);

      // Create new schedule slots
      const createdSlots: ScheduleSlot[] = [];
      for (const insertSlot of result.scheduleSlots) {
        const slotWithPlan = { ...insertSlot, planId };
        const createdSlot = await this.createScheduleSlot(slotWithPlan);
        createdSlots.push(createdSlot);
      }

      // Create capacity buckets
      for (const insertBucket of result.capacityBuckets) {
        await this.createCapacityBucket(insertBucket);
      }

      return {
        scheduleSlots: createdSlots,
        conflicts: result.conflicts
      };
    } catch (error) {
      console.error('Error in scheduleProduction:', error);
      throw new Error(`Failed to schedule production: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const storage = new MemStorage();
