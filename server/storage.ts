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
  type SetupGroup, type InsertSetupGroup,
  type OperatorSkill, type InsertOperatorSkill,
  type ToolResource, type InsertToolResource,
  type MaterialAvailability, type InsertMaterialAvailability,
  type ResourceReservation, type InsertResourceReservation,
  type Scenario, type InsertScenario,
  type SchedulingPolicy, type SchedulingConflict,
  type ShiftDefinition,
  type ShiftReport, type InsertShiftReport,
  type OperatorSession, type InsertOperatorSession,
  type ReasonCode, type InsertReasonCode,
  type ScrapLog, type InsertScrapLog,
  type AnalyticsKPIs, type OEEBreakdown, type AdherenceMetrics,
  type UtilizationMetrics, type QualitySummary, type TrendPoint,
  type MachineOEESnapshot, type AnalyticsFilters
} from "@shared/schema";
import { randomUUID } from "crypto";
import { ProductionScheduler } from "./scheduling";
import { AnalyticsEngine } from "./analytics";

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
  updateScheduleSlot(id: string, updates: Partial<ScheduleSlot>): Promise<ScheduleSlot | undefined>;
  getScheduleSlotsByPlan(planId: string): Promise<ScheduleSlot[]>;
  getScheduleSlotsByDateRange(startDate: Date, endDate: Date, machineIds?: string[]): Promise<ScheduleSlot[]>;
  validateScheduleSlots(slots: ScheduleSlot[]): Promise<SchedulingConflict[]>;
  bulkUpdateScheduleSlots(updates: { id: string, updates: Partial<ScheduleSlot> }[]): Promise<{ updated: ScheduleSlot[], conflicts: SchedulingConflict[] }>;
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

  // Setup Groups operations
  getAllSetupGroups(): Promise<SetupGroup[]>;
  getSetupGroup(id: string): Promise<SetupGroup | undefined>;
  createSetupGroup(setupGroup: InsertSetupGroup): Promise<SetupGroup>;
  updateSetupGroup(id: string, updates: Partial<SetupGroup>): Promise<SetupGroup | undefined>;
  deleteSetupGroup(id: string): Promise<void>;

  // Operator Skills operations  
  getAllOperatorSkills(): Promise<OperatorSkill[]>;
  getOperatorSkill(id: string): Promise<OperatorSkill | undefined>;
  createOperatorSkill(skill: InsertOperatorSkill): Promise<OperatorSkill>;
  updateOperatorSkill(id: string, updates: Partial<OperatorSkill>): Promise<OperatorSkill | undefined>;
  getOperatorSkillsByOperator(operatorId: string): Promise<OperatorSkill[]>;
  getOperatorsBySkillType(skillType: string): Promise<OperatorSkill[]>;
  deleteOperatorSkill(id: string): Promise<void>;

  // Tool Resources operations
  getAllToolResources(): Promise<ToolResource[]>;
  getToolResource(id: string): Promise<ToolResource | undefined>;
  createToolResource(resource: InsertToolResource): Promise<ToolResource>;
  updateToolResource(id: string, updates: Partial<ToolResource>): Promise<ToolResource | undefined>;
  getToolResourcesByLocation(location: string): Promise<ToolResource[]>;
  getAvailableToolResources(toolId: string): Promise<ToolResource[]>;
  deleteToolResource(id: string): Promise<void>;

  // Material Availability operations
  getAllMaterialAvailability(): Promise<MaterialAvailability[]>;
  getMaterialAvailability(id: string): Promise<MaterialAvailability | undefined>;
  createMaterialAvailability(availability: InsertMaterialAvailability): Promise<MaterialAvailability>;
  updateMaterialAvailability(id: string, updates: Partial<MaterialAvailability>): Promise<MaterialAvailability | undefined>;
  getMaterialAvailabilityByWorkOrder(workOrderId: string): Promise<MaterialAvailability[]>;
  getMaterialAvailabilityByMaterial(materialId: string): Promise<MaterialAvailability[]>;
  deleteMaterialAvailability(id: string): Promise<void>;

  // Resource Reservations operations
  getAllResourceReservations(): Promise<ResourceReservation[]>;
  getResourceReservation(id: string): Promise<ResourceReservation | undefined>;
  createResourceReservation(reservation: InsertResourceReservation): Promise<ResourceReservation>;
  updateResourceReservation(id: string, updates: Partial<ResourceReservation>): Promise<ResourceReservation | undefined>;
  getResourceReservationsByWorkOrder(workOrderId: string): Promise<ResourceReservation[]>;
  getResourceReservationsByResource(resourceType: string, resourceId: string): Promise<ResourceReservation[]>;
  getActiveResourceReservations(): Promise<ResourceReservation[]>;
  deleteResourceReservation(id: string): Promise<void>;

  // Scenarios operations
  getAllScenarios(): Promise<Scenario[]>;
  getScenario(id: string): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario | undefined>;
  getScenariosByCreator(creatorId: string): Promise<Scenario[]>;
  getPublicScenarios(): Promise<Scenario[]>;
  runScenario(id: string): Promise<Scenario>;
  deleteScenario(id: string): Promise<void>;

  // Data Entry Module operations
  // Shift Reports operations
  getAllShiftReports(): Promise<ShiftReport[]>;
  getShiftReport(id: string): Promise<ShiftReport | undefined>;
  createShiftReport(shift: InsertShiftReport): Promise<ShiftReport>;
  updateShiftReport(id: string, updates: Partial<ShiftReport>): Promise<ShiftReport | undefined>;
  getActiveShiftReports(): Promise<ShiftReport[]>;
  getShiftReportsByDate(date: Date): Promise<ShiftReport[]>;
  closeShiftReport(id: string, endTime: Date): Promise<ShiftReport | undefined>;

  // Operator Sessions operations
  getAllOperatorSessions(): Promise<OperatorSession[]>;
  getOperatorSession(id: string): Promise<OperatorSession | undefined>;
  createOperatorSession(session: InsertOperatorSession): Promise<OperatorSession>;
  updateOperatorSession(id: string, updates: Partial<OperatorSession>): Promise<OperatorSession | undefined>;
  getActiveOperatorSessions(): Promise<OperatorSession[]>;
  getOperatorSessionsByShift(shiftId: string): Promise<OperatorSession[]>;
  getOperatorSessionsByOperator(operatorId: string): Promise<OperatorSession[]>;
  endOperatorSession(id: string, endTime: Date): Promise<OperatorSession | undefined>;

  // Reason Codes operations
  getAllReasonCodes(): Promise<ReasonCode[]>;
  getReasonCode(id: string): Promise<ReasonCode | undefined>;
  createReasonCode(reasonCode: InsertReasonCode): Promise<ReasonCode>;
  updateReasonCode(id: string, updates: Partial<ReasonCode>): Promise<ReasonCode | undefined>;
  getReasonCodesByCategory(category: string): Promise<ReasonCode[]>;
  getActiveReasonCodes(): Promise<ReasonCode[]>;
  deleteReasonCode(id: string): Promise<void>;

  // Scrap Logs operations
  getAllScrapLogs(): Promise<ScrapLog[]>;
  getScrapLog(id: string): Promise<ScrapLog | undefined>;
  createScrapLog(scrapLog: InsertScrapLog): Promise<ScrapLog>;
  updateScrapLog(id: string, updates: Partial<ScrapLog>): Promise<ScrapLog | undefined>;
  getScrapLogsByWorkOrder(workOrderId: string): Promise<ScrapLog[]>;
  getScrapLogsByShift(shiftId: string): Promise<ScrapLog[]>;
  getScrapLogsByOperator(operatorId: string): Promise<ScrapLog[]>;
  verifyScrapLog(id: string, verifiedBy: string): Promise<ScrapLog | undefined>;

  // Data Entry validation utilities
  validateWorkOrderAssignment(workOrderId: string, machineId: string): Promise<boolean>;
  validateOperatorSession(operatorId: string, machineId: string, workOrderId: string): Promise<boolean>;
  validateProductionQuantity(workOrderId: string, quantityToAdd: number): Promise<{ isValid: boolean; remainingQuantity: number; }>;
  getShiftSummary(shiftId: string): Promise<{
    totalProduced: number;
    totalScrap: number;
    totalDowntime: number;
    efficiency: number;
    activeSessions: number;
  }>;

  // Analytics operations
  getAnalyticsKPIs(filters: AnalyticsFilters): Promise<AnalyticsKPIs>;
  getOEEBreakdown(machineIds?: string[], period?: { from: Date; to: Date }): Promise<OEEBreakdown[]>;
  getScheduleAdherence(filters: AnalyticsFilters): Promise<AdherenceMetrics[]>;
  getUtilizationMetrics(machineIds?: string[], period?: { from: Date; to: Date }): Promise<UtilizationMetrics[]>;
  getQualitySummary(filters: AnalyticsFilters): Promise<QualitySummary>;
  getAnalyticsTrends(metric: string, filters: AnalyticsFilters): Promise<TrendPoint[]>;
  getMachineOEESnapshots(): Promise<MachineOEESnapshot[]>;
  getDowntimePareto(filters: AnalyticsFilters): Promise<{ category: string; value: number; percentage: number }[]>;
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
  
  // New capacity planning storage
  private setupGroups: Map<string, SetupGroup>;
  private operatorSkills: Map<string, OperatorSkill>;
  private toolResources: Map<string, ToolResource>;
  private materialAvailability: Map<string, MaterialAvailability>;
  private resourceReservations: Map<string, ResourceReservation>;
  private scenarios: Map<string, Scenario>;
  
  // Data Entry Module storage
  private shiftReports: Map<string, ShiftReport>;
  private operatorSessions: Map<string, OperatorSession>;
  private reasonCodes: Map<string, ReasonCode>;
  private scrapLogs: Map<string, ScrapLog>;

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
    
    // Initialize new capacity planning storage
    this.setupGroups = new Map();
    this.operatorSkills = new Map();
    this.toolResources = new Map();
    this.materialAvailability = new Map();
    this.resourceReservations = new Map();
    this.scenarios = new Map();
    
    // Initialize data entry storage
    this.shiftReports = new Map();
    this.operatorSessions = new Map();
    this.reasonCodes = new Map();
    this.scrapLogs = new Map();

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

    // Sample Operator Skills
    const operatorSkills: OperatorSkill[] = [
      {
        id: "skill-1",
        operatorId: "op-001",
        skillType: "CNC_OPERATOR",
        skillLevel: 4,
        certificationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 540 * 24 * 60 * 60 * 1000),
        certifyingAuthority: "trainer-001",
        machineTypes: ["CNC_TURNING", "CNC_MILLING"],
        operationTypes: ["TURNING"],
        hourlyRate: 28.50,
        availability: { "days": [1,2,3,4,5], "shifts": ["day"] },
        notes: "Certified on Mazak and Haas machines",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "skill-2",
        operatorId: "op-002",
        skillType: "CNC_OPERATOR",
        skillLevel: 5,
        certificationDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        certifyingAuthority: "trainer-001",
        machineTypes: ["CNC_TURNING", "CNC_MILLING"],
        operationTypes: ["TURNING", "MILLING"],
        hourlyRate: 32.00,
        availability: { "days": [1,2,3,4,5,6], "shifts": ["day"] },
        notes: "Expert level - can train others",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "skill-3",
        operatorId: "op-003",
        skillType: "EDM_OPERATOR",
        skillLevel: 3,
        certificationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 630 * 24 * 60 * 60 * 1000),
        certifyingAuthority: "trainer-002",
        machineTypes: ["WIRE_CUT"],
        operationTypes: ["WIRE_CUT"],
        hourlyRate: 30.00,
        availability: { "days": [1,2,3,4,5], "shifts": ["evening"] },
        notes: "Specialized in wire EDM operations",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "skill-4",
        operatorId: "op-004",
        skillType: "GRINDING_OPERATOR",
        skillLevel: 4,
        certificationDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 520 * 24 * 60 * 60 * 1000),
        certifyingAuthority: "trainer-003",
        machineTypes: ["SURFACE_GRINDING"],
        operationTypes: ["GRINDING"],
        hourlyRate: 26.00,
        availability: { "days": [1,2,3,4,5], "shifts": ["day"] },
        notes: "Surface and cylindrical grinding certified",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    operatorSkills.forEach(skill => this.operatorSkills.set(skill.id, skill));

    // Sample Tool Resources
    const toolResources: ToolResource[] = [
      {
        id: "tool-res-1",
        toolId: "T001",
        location: "Tool Crib A",
        totalQuantity: 50,
        availableQuantity: 35,
        reservedQuantity: 10,
        inUseQuantity: 5,
        maintenanceQuantity: 0,
        condition: "good",
        lastInspectionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextInspectionDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageTracking: { "totalCycles": 1250, "hoursUsed": 45.5 },
        costCenter: "Production",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "tool-res-2",
        toolId: "M012",
        location: "Tool Crib A",
        totalQuantity: 25,
        availableQuantity: 12,
        reservedQuantity: 8,
        inUseQuantity: 5,
        maintenanceQuantity: 0,
        condition: "good",
        lastInspectionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        nextInspectionDue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageTracking: { "totalCycles": 800, "hoursUsed": 32.0 },
        costCenter: "Production",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "tool-res-3",
        toolId: "WIRE-0.25",
        location: "EDM Area",
        totalQuantity: 500,
        availableQuantity: 275,
        reservedQuantity: 100,
        inUseQuantity: 125,
        maintenanceQuantity: 0,
        condition: "good",
        lastInspectionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextInspectionDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usageTracking: { "totalLength": 2500, "hoursUsed": 18.5 },
        costCenter: "EDM",
        createdAt: now,
        updatedAt: now,
      },
    ];
    toolResources.forEach(tool => this.toolResources.set(tool.id, tool));

    // Sample Material Availability
    const materialAvailability: MaterialAvailability[] = [
      {
        id: "mat-avail-1",
        workOrderId: "wo-1",
        materialId: "STL-4140-50X150X300",
        requiredQuantity: 5,
        allocatedQuantity: 5,
        reservedQuantity: 3,
        availableDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expirationDate: null,
        supplier: "Steel Supply Co",
        purchaseOrderNumber: "PO-2024-001",
        unitCost: 45.50,
        totalCost: 227.50,
        deliveryStatus: "received",
        qualityStatus: "approved",
        location: "Warehouse A-1",
        batchLotNumber: "STL-001-2024",
        notes: "Standard steel bar stock",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "mat-avail-2",
        workOrderId: "wo-2",
        materialId: "ALU-6061-60X80X220",
        requiredQuantity: 3,
        allocatedQuantity: 1,
        reservedQuantity: 1,
        availableDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        expirationDate: null,
        supplier: "Aluminum Plus",
        purchaseOrderNumber: "PO-2024-002",
        unitCost: 85.00,
        totalCost: 255.00,
        deliveryStatus: "in_transit",
        qualityStatus: "pending",
        location: "Warehouse A-2",
        batchLotNumber: "ALU-002-2024",
        notes: "Rush order placed for additional stock",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "mat-avail-3",
        workOrderId: "wo-3",
        materialId: "D2-25X100X150",
        requiredQuantity: 2,
        allocatedQuantity: 2,
        reservedQuantity: 2,
        availableDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        expirationDate: null,
        supplier: "Specialty Steels",
        purchaseOrderNumber: "PO-2024-003",
        unitCost: 125.00,
        totalCost: 250.00,
        deliveryStatus: "received",
        qualityStatus: "approved",
        location: "Tool Steel Storage",
        batchLotNumber: "D2-003-2024",
        notes: "Premium tool steel for EDM operations",
        createdAt: now,
        updatedAt: now,
      },
    ];
    materialAvailability.forEach(mat => this.materialAvailability.set(mat.id, mat));

    // Sample Resource Reservations
    const resourceReservations: ResourceReservation[] = [
      {
        id: "res-1",
        resourceType: "operator",
        resourceId: "op-001",
        workOrderId: "wo-1",
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        quantity: 1,
        priority: 100,
        status: "active",
        conflictResolution: null,
        notes: "John Smith assigned to HSK turning operation",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "res-2",
        resourceType: "tool",
        resourceId: "tool-res-1",
        workOrderId: "wo-1",
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        quantity: 10,
        priority: 100,
        status: "active",
        conflictResolution: null,
        notes: "CNMG inserts reserved for turning operation",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "res-3",
        resourceType: "material",
        resourceId: "mat-avail-1",
        workOrderId: "wo-1",
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        quantity: 3,
        priority: 100,
        status: "active",
        conflictResolution: null,
        notes: "Steel bar stock reserved for work order",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "res-4",
        resourceType: "operator",
        resourceId: "op-003",
        workOrderId: "wo-3",
        startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        quantity: 1,
        priority: 50,
        status: "pending",
        conflictResolution: null,
        notes: "Mike Chen scheduled for EDM operation",
        createdAt: now,
        updatedAt: now,
      },
    ];
    resourceReservations.forEach(res => this.resourceReservations.set(res.id, res));

    // Sample Setup Groups
    const setupGroups: SetupGroup[] = [
      {
        id: "setup-group-1",
        name: "Steel Turning Family",
        description: "Operations that can share setups for steel turning",
        machineTypes: ["CNC_TURNING", "CONVENTIONAL_TURNING"],
        operationFamilies: ["TURNING_STEEL"],
        standardSetupMinutes: 45,
        toolConfiguration: {
          "toolTypes": ["CNMG", "TNMG"],
          "toolHolders": ["MCLNR", "MTJNR"]
        },
        fixtures: ["3-jaw chuck", "4-jaw chuck", "collets"],
        workholding: "Chuck",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "setup-group-2",
        name: "Aluminum Milling Family",
        description: "Milling operations optimized for aluminum",
        machineTypes: ["CNC_MILLING"],
        operationFamilies: ["MILLING_ALUMINUM"],
        standardSetupMinutes: 60,
        toolConfiguration: {
          "toolTypes": ["End Mill", "Face Mill"],
          "coatings": ["TiAlN", "Uncoated"]
        },
        fixtures: ["vise", "fixture plate", "clamps"],
        workholding: "Vise",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "setup-group-3",
        name: "EDM Precision Group",
        description: "High-precision EDM operations",
        machineTypes: ["WIRE_CUT", "SINK_EDM"],
        operationFamilies: ["EDM_STEEL", "EDM_CARBIDE"],
        standardSetupMinutes: 120,
        toolConfiguration: {
          "wireType": ["0.25mm brass", "0.20mm brass"],
          "electrodes": ["graphite", "copper"]
        },
        fixtures: ["clamps", "supports", "ground straps"],
        workholding: "Clamps",
        createdAt: now,
        updatedAt: now,
      },
    ];
    setupGroups.forEach(group => this.setupGroups.set(group.id, group));

    // Sample Capacity Buckets - Generate realistic capacity data for testing
    this.generateSampleCapacityBuckets();
  }

  private generateSampleCapacityBuckets() {
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days ahead
    const machineIds = ["machine-1", "machine-2", "machine-3", "machine-4"];

    // Generate capacity buckets for each machine for the date range
    for (const machineId of machineIds) {
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const machine = Array.from(this.machines.values()).find(m => m.id === machineId);
        const currentDate = new Date(date);
        
        // Skip weekends for most machines (except machine-4 which runs 24/7)
        const dayOfWeek = currentDate.getDay();
        if (machineId !== "machine-4" && (dayOfWeek === 0 || dayOfWeek === 6)) {
          continue;
        }

        // Generate different scenarios based on machine status and work orders
        let availableMinutes = 480; // 8 hours default
        let plannedMinutes = 0;
        let actualMinutes = 0;
        let isOverloaded = false;
        let overloadPercentage = 0;

        if (machineId === "machine-4") { // 24/7 operation
          availableMinutes = 1440; // 24 hours
        }

        // Simulate realistic capacity scenarios
        if (machine?.status === "maintenance") {
          availableMinutes = 0;
          plannedMinutes = 0;
          actualMinutes = 0;
        } else if (machine?.status === "running" || machine?.status === "setup") {
          // Past dates - show actual utilization
          if (currentDate < now) {
            plannedMinutes = Math.floor(availableMinutes * (0.6 + Math.random() * 0.3)); // 60-90% planned
            actualMinutes = Math.floor(plannedMinutes * (0.85 + Math.random() * 0.15)); // 85-100% of planned
          } else {
            // Future dates - show planned utilization
            plannedMinutes = Math.floor(availableMinutes * (0.4 + Math.random() * 0.5)); // 40-90% planned
            actualMinutes = 0; // No actuals for future
            
            // Some machines are overloaded for demonstration
            if (Math.random() > 0.7 && machineId !== "machine-3") {
              plannedMinutes = Math.floor(availableMinutes * (1.1 + Math.random() * 0.2)); // 110-130% overload
              isOverloaded = true;
              overloadPercentage = ((plannedMinutes / availableMinutes) - 1) * 100;
            }
          }
        }

        const utilization = availableMinutes > 0 ? (plannedMinutes / availableMinutes) * 100 : 0;
        const actualUtilization = availableMinutes > 0 ? (actualMinutes / availableMinutes) * 100 : 0;

        const bucket: CapacityBucket = {
          id: `bucket-${machineId}-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`,
          machineId,
          date: currentDate,
          hour: null, // Daily buckets
          availableMinutes,
          plannedMinutes,
          actualMinutes,
          utilization,
          actualUtilization,
          isOverloaded,
          overloadPercentage,
          createdAt: now,
          updatedAt: now,
        };

        this.capacityBuckets.set(bucket.id, bucket);
      }
    }
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

    // Add comprehensive analytics data for real-time analytics dashboard
    try {
      const period = { 
        from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        to: new Date() 
      };

      const [
        allMachines,
        allWorkOrders,
        productionLogs,
        downtimeEvents,
        qualityRecords,
        scheduleSlots,
        operatorSessions
      ] = await Promise.all([
        this.getAllMachines(),
        this.getAllWorkOrders(),
        this.getAllProductionLogs(),
        this.getAllDowntimeEvents(),
        this.getAllQualityRecords(),
        this.getAllScheduleSlots(),
        this.getAllOperatorSessions()
      ]);

      // Calculate comprehensive analytics KPIs
      const analyticsKPIs = AnalyticsEngine.calculateAnalyticsKPIs(
        allMachines,
        allWorkOrders,
        productionLogs,
        downtimeEvents,
        qualityRecords,
        scheduleSlots,
        operatorSessions,
        period
      );

      // Calculate real-time machine OEE snapshots
      const machineOEESnapshots = AnalyticsEngine.getRealtimeMachineOEE(
        allMachines,
        productionLogs,
        downtimeEvents,
        qualityRecords,
        allWorkOrders
      );

      // Calculate OEE breakdowns for all machines
      const oeeBreakdowns = allMachines.map(machine => 
        AnalyticsEngine.calculateOEE(
          machine,
          productionLogs.filter(log => log.machineId === machine.id),
          downtimeEvents.filter(event => event.machineId === machine.id),
          qualityRecords.filter(record => record.machineId === machine.id),
          scheduleSlots.filter(slot => slot.machineId === machine.id),
          period
        )
      );

      // Calculate schedule adherence metrics
      const adherenceMetrics = AnalyticsEngine.calculateScheduleAdherence(
        allWorkOrders, 
        scheduleSlots, 
        period
      );

      // Calculate utilization metrics
      const utilizationMetrics = AnalyticsEngine.calculateUtilizationMetrics(
        allMachines,
        productionLogs,
        downtimeEvents,
        operatorSessions,
        period
      );

      // Calculate quality summary
      const qualitySummary = AnalyticsEngine.calculateQualitySummary(
        qualityRecords,
        period
      );

      return {
        kpis,
        machines,
        activeWorkOrders,
        alerts,
        productionData,
        oeeData,
        qualityTrends,
        // Enhanced analytics data
        analyticsKPIs,
        machineOEESnapshots,
        oeeBreakdowns,
        adherenceMetrics,
        utilizationMetrics,
        qualitySummary,
      };
    } catch (error) {
      console.error('Error calculating real-time analytics:', error);
      // Return basic data if analytics calculation fails
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
    // Generate meaningful capacity planning data based on current machines and work orders
    const machines = Array.from(this.machines.values());
    const workOrders = Array.from(this.workOrders.values());
    const capabilities = Array.from(this.machineCapabilities.values());
    
    const capacityData = machines.map(machine => {
      const machineWorkOrders = workOrders.filter(wo => wo.assignedMachineId === machine.id);
      const capability = capabilities.find(cap => cap.machineId === machine.id);
      
      // Calculate utilization over next 30 days
      const utilizationData = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Simulate varying utilization based on machine status and work orders
        let utilization = 0;
        if (machine.status === "running") {
          utilization = 75 + Math.random() * 20; // 75-95%
        } else if (machine.status === "setup") {
          utilization = 20 + Math.random() * 30; // 20-50%
        } else if (machine.status === "maintenance") {
          utilization = 0;
        } else {
          utilization = 30 + Math.random() * 40; // 30-70%
        }
        
        utilizationData.push({
          date: date.toISOString().split('T')[0],
          utilization: Math.round(utilization * 10) / 10,
          availableHours: 24,
          plannedHours: Math.round((utilization / 100) * 24 * 10) / 10,
          efficiency: capability?.efficiency || 0.85
        });
      }
      
      return {
        machineId: machine.id,
        machineName: machine.name,
        machineType: machine.type,
        currentStatus: machine.status,
        currentEfficiency: machine.efficiency || 0,
        assignedWorkOrders: machineWorkOrders.length,
        completedWorkOrders: machineWorkOrders.filter(wo => wo.status === "completed").length,
        utilizationForecast: utilizationData,
        constraints: [
          ...(machine.status === "maintenance" ? [{
            type: "maintenance",
            severity: "high",
            description: "Machine under maintenance",
            estimatedResolution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          }] : []),
          ...(machineWorkOrders.length > 5 ? [{
            type: "overload",
            severity: "medium", 
            description: `${machineWorkOrders.length} work orders assigned`,
            estimatedResolution: null
          }] : [])
        ],
        recommendations: [
          ...(machine.efficiency && machine.efficiency < 70 ? [
            "Consider maintenance to improve efficiency"
          ] : []),
          ...(machineWorkOrders.length === 0 ? [
            "Available for new work orders"
          ] : []),
          ...(machine.status === "running" && machineWorkOrders.length > 3 ? [
            "High utilization - monitor for potential overload"
          ] : [])
        ]
      };
    });
    
    return capacityData;
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
      color: insertSlot.color || "#3B82F6",
      locked: insertSlot.locked || false,
      tags: insertSlot.tags || [],
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scheduleSlots.set(id, slot);
    return slot;
  }

  async updateScheduleSlot(id: string, updates: Partial<ScheduleSlot>): Promise<ScheduleSlot | undefined> {
    const existingSlot = this.scheduleSlots.get(id);
    if (!existingSlot) {
      return undefined;
    }

    const updatedSlot: ScheduleSlot = {
      ...existingSlot,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.scheduleSlots.set(id, updatedSlot);
    return updatedSlot;
  }

  async getScheduleSlotsByDateRange(startDate: Date, endDate: Date, machineIds?: string[]): Promise<ScheduleSlot[]> {
    return Array.from(this.scheduleSlots.values())
      .filter(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        
        // Check date overlap: slot overlaps with range if slot.start < range.end AND slot.end > range.start
        const hasDateOverlap = slotStart < endDate && slotEnd > startDate;
        
        // Check machine filter
        const matchesMachine = !machineIds || machineIds.length === 0 || machineIds.includes(slot.machineId);
        
        return hasDateOverlap && matchesMachine;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async validateScheduleSlots(slots: ScheduleSlot[]): Promise<SchedulingConflict[]> {
    const conflicts: SchedulingConflict[] = [];
    const allSlots = Array.from(this.scheduleSlots.values()).concat(slots);
    
    // Get necessary data for comprehensive validation
    const defaultCalendar = await this.getDefaultCalendar();
    const setupMatrix = Array.from(this.setupMatrix.values());
    const machines = await this.getAllMachines();
    
    // Check for overlapping slots on the same machine
    for (const slot1 of slots) {
      for (const slot2 of allSlots) {
        if (slot1.id === slot2.id || slot1.machineId !== slot2.machineId) {
          continue;
        }
        
        const start1 = new Date(slot1.startTime);
        const end1 = new Date(slot1.endTime);
        const start2 = new Date(slot2.startTime);
        const end2 = new Date(slot2.endTime);
        
        // Check for overlap: start1 < end2 AND start2 < end1
        if (start1 < end2 && start2 < end1) {
          conflicts.push({
            type: "resource_conflict",
            severity: "high",
            description: `Schedule conflict: Operations overlap on machine ${slot1.machineId}`,
            affectedOperations: [slot1.operationId, slot2.operationId],
            suggestedResolution: "Adjust start/end times to eliminate overlap"
          });
        }
      }
    }
    
    // Check for precedence violations
    for (const slot of slots) {
      const operation = this.operations.get(slot.operationId);
      if (operation && operation.predecessorOperationIds) {
        const predecessorIds = operation.predecessorOperationIds as string[];
        for (const predId of predecessorIds) {
          const predSlot = allSlots.find(s => s.operationId === predId);
          if (predSlot && new Date(predSlot.endTime) > new Date(slot.startTime)) {
            conflicts.push({
              type: "precedence_violation",
              severity: "high",
              description: `Precedence violation: Operation ${operation.operationNumber} starts before predecessor completes`,
              affectedOperations: [slot.operationId, predSlot.operationId],
              suggestedResolution: "Delay successor operation until predecessor completes"
            });
          }
        }
      }
    }
    
    // Check for capacity overload violations
    if (defaultCalendar) {
      for (const slot of slots) {
        const machine = machines.find(m => m.id === slot.machineId);
        if (machine) {
          const overloadCheck = this.checkCapacityOverload(
            slot.machineId,
            new Date(slot.startTime),
            new Date(slot.endTime),
            allSlots,
            defaultCalendar
          );
          
          if (overloadCheck.isOverloaded && overloadCheck.percentage > 120) {
            conflicts.push({
              type: "capacity_overload",
              severity: overloadCheck.percentage > 150 ? "high" : "medium",
              description: `Machine ${machine.name} overloaded by ${overloadCheck.percentage.toFixed(1)}% on this day`,
              affectedOperations: [slot.operationId],
              suggestedResolution: "Consider redistributing load or extending timeline"
            });
          }
        }
      }
    }
    
    // Check for setup/changeover violations
    for (const slot of slots) {
      const machine = machines.find(m => m.id === slot.machineId);
      const operation = this.operations.get(slot.operationId);
      
      if (machine && operation) {
        // Find the previous operation on the same machine
        const previousSlot = allSlots
          .filter(s => s.machineId === slot.machineId && s.id !== slot.id && new Date(s.endTime) <= new Date(slot.startTime))
          .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0];
          
        if (previousSlot) {
          const previousOperation = this.operations.get(previousSlot.operationId);
          if (previousOperation) {
            // Find applicable setup time from matrix
            const setupRule = setupMatrix.find(rule => 
              rule.fromFamily === previousOperation.operationFamily &&
              rule.toFamily === operation.operationFamily &&
              rule.machineType === machine.type
            );
            
            if (setupRule) {
              const actualGapMinutes = (new Date(slot.startTime).getTime() - new Date(previousSlot.endTime).getTime()) / 60000;
              const requiredSetupMinutes = setupRule.changeoverMinutes;
              
              if (actualGapMinutes < requiredSetupMinutes) {
                conflicts.push({
                  type: "resource_conflict",
                  severity: "medium",
                  description: `Insufficient setup time: ${actualGapMinutes.toFixed(0)} min available, ${requiredSetupMinutes} min required for changeover from ${previousOperation.operationFamily} to ${operation.operationFamily}`,
                  affectedOperations: [slot.operationId],
                  suggestedResolution: "Increase gap between operations or adjust setup time allocation"
                });
              }
            }
          }
        }
      }
    }
    
    // Check for calendar/shift violations
    if (defaultCalendar) {
      const shifts = defaultCalendar.shifts as any[];
      const workDays = defaultCalendar.workDays as number[];
      const exceptions = (defaultCalendar.exceptions as any[]) || [];
      
      for (const slot of slots) {
        const startTime = new Date(slot.startTime);
        const endTime = new Date(slot.endTime);
        const dayOfWeek = startTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dateStr = startTime.toISOString().split('T')[0];
        
        // Check if scheduled on a non-working day
        if (workDays && !workDays.includes(dayOfWeek)) {
          conflicts.push({
            type: "deadline_missed",
            severity: "medium",
            description: `Operation scheduled on non-working day (${startTime.toLocaleDateString()})`,
            affectedOperations: [slot.operationId],
            suggestedResolution: "Reschedule to a working day"
          });
        }
        
        // Check for holiday/exception conflicts
        const exception = exceptions.find(exc => exc.date === dateStr);
        if (exception) {
          conflicts.push({
            type: "deadline_missed",
            severity: "high",
            description: `Operation scheduled during ${exception.type}: ${exception.description}`,
            affectedOperations: [slot.operationId],
            suggestedResolution: "Reschedule to avoid holiday/maintenance period"
          });
        }
        
        // Check if operation extends beyond shift hours
        if (shifts && shifts.length > 0) {
          const isWithinShiftHours = shifts.some(shift => {
            const shiftStart = new Date(`1970-01-01T${shift.startTime}:00`);
            const shiftEnd = new Date(`1970-01-01T${shift.endTime}:00`);
            const slotStart = new Date(`1970-01-01T${startTime.toTimeString().split(' ')[0]}`);
            const slotEnd = new Date(`1970-01-01T${endTime.toTimeString().split(' ')[0]}`);
            
            return slotStart >= shiftStart && slotEnd <= shiftEnd;
          });
          
          if (!isWithinShiftHours) {
            conflicts.push({
              type: "deadline_missed",
              severity: "medium",
              description: `Operation scheduled outside shift hours (${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})`,
              affectedOperations: [slot.operationId],
              suggestedResolution: "Adjust timing to fit within shift hours"
            });
          }
        }
      }
    }
    
    // Check for deadline violations
    for (const slot of slots) {
      const operation = this.operations.get(slot.operationId);
      if (operation && operation.dueDate) {
        const dueDate = new Date(operation.dueDate);
        const endTime = new Date(slot.endTime);
        
        if (endTime > dueDate) {
          const delayDays = Math.ceil((endTime.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
          conflicts.push({
            type: "deadline_missed",
            severity: delayDays > 7 ? "high" : "medium",
            description: `Operation ${operation.operationNumber} scheduled to finish ${delayDays} day(s) after due date`,
            affectedOperations: [slot.operationId],
            suggestedResolution: "Increase priority or reallocate resources to meet deadline"
          });
        }
      }
    }
    
    return conflicts;
  }
  
  // Helper method for capacity overload checking
  private checkCapacityOverload(
    machineId: string,
    startTime: Date,
    endTime: Date,
    scheduleSlots: ScheduleSlot[],
    calendar: Calendar
  ): { isOverloaded: boolean, percentage: number } {
    try {
      const shifts = calendar.shifts as any[];
      
      if (!shifts || shifts.length === 0) {
        return { isOverloaded: false, percentage: 0 };
      }
      
      const totalShiftMinutes = shifts.reduce((sum, shift) => {
        const start = new Date(`1970-01-01T${shift.startTime}:00`);
        const end = new Date(`1970-01-01T${shift.endTime}:00`);
        const shiftMinutes = (end.getTime() - start.getTime()) / 60000;
        return sum + Math.max(shiftMinutes - (shift.breakMinutes || 0), 0);
      }, 0);
      
      const date = startTime.toISOString().split('T')[0];
      const dayStart = new Date(date + 'T00:00:00');
      const dayEnd = new Date(date + 'T23:59:59');
      
      const daySlots = scheduleSlots.filter(slot => {
        return slot.machineId === machineId &&
               new Date(slot.startTime) >= dayStart &&
               new Date(slot.endTime) <= dayEnd;
      });
      
      const totalScheduledMinutes = daySlots.reduce((sum, slot) => {
        const setupMinutes = slot.setupMinutes || 0;
        const runMinutes = slot.runMinutes || 0;
        return sum + setupMinutes + runMinutes;
      }, 0);
      
      const utilizationPercentage = totalShiftMinutes > 0 ? (totalScheduledMinutes * 100) / totalShiftMinutes : 0;
      
      return {
        isOverloaded: utilizationPercentage > 100,
        percentage: Math.round(utilizationPercentage * 100) / 100
      };
    } catch (error) {
      console.error('Error checking capacity overload:', error);
      return { isOverloaded: false, percentage: 0 };
    }
  }

  async bulkUpdateScheduleSlots(updates: { id: string, updates: Partial<ScheduleSlot> }[]): Promise<{ updated: ScheduleSlot[], conflicts: SchedulingConflict[] }> {
    const updated: ScheduleSlot[] = [];
    const allUpdatedSlots: ScheduleSlot[] = [];
    
    // Apply all updates first
    for (const { id, updates: slotUpdates } of updates) {
      const updatedSlot = await this.updateScheduleSlot(id, slotUpdates);
      if (updatedSlot) {
        updated.push(updatedSlot);
        allUpdatedSlots.push(updatedSlot);
      }
    }
    
    // Validate the updated slots for conflicts
    const conflicts = await this.validateScheduleSlots(allUpdatedSlots);
    
    return { updated, conflicts };
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

  // Setup Groups operations
  async getAllSetupGroups(): Promise<SetupGroup[]> {
    return Array.from(this.setupGroups.values());
  }

  async getSetupGroup(id: string): Promise<SetupGroup | undefined> {
    return this.setupGroups.get(id);
  }

  async createSetupGroup(setupGroup: InsertSetupGroup): Promise<SetupGroup> {
    const id = randomUUID();
    const now = new Date();
    const newSetupGroup: SetupGroup = {
      ...setupGroup,
      description: setupGroup.description ?? null,
      toolConfiguration: setupGroup.toolConfiguration ?? null,
      fixtures: setupGroup.fixtures ?? null,
      workholding: setupGroup.workholding ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.setupGroups.set(id, newSetupGroup);
    return newSetupGroup;
  }

  async updateSetupGroup(id: string, updates: Partial<SetupGroup>): Promise<SetupGroup | undefined> {
    const setupGroup = this.setupGroups.get(id);
    if (!setupGroup) return undefined;
    
    const updatedSetupGroup: SetupGroup = {
      ...setupGroup,
      ...updates,
      updatedAt: new Date(),
    };
    this.setupGroups.set(id, updatedSetupGroup);
    return updatedSetupGroup;
  }

  async deleteSetupGroup(id: string): Promise<void> {
    this.setupGroups.delete(id);
  }

  // Operator Skills operations
  async getAllOperatorSkills(): Promise<OperatorSkill[]> {
    return Array.from(this.operatorSkills.values());
  }

  async getOperatorSkill(id: string): Promise<OperatorSkill | undefined> {
    return this.operatorSkills.get(id);
  }

  async createOperatorSkill(skill: InsertOperatorSkill): Promise<OperatorSkill> {
    const id = randomUUID();
    const now = new Date();
    const newSkill: OperatorSkill = {
      ...skill,
      machineTypes: skill.machineTypes ?? null,
      operationTypes: skill.operationTypes ?? null,
      certificationDate: skill.certificationDate ?? null,
      expirationDate: skill.expirationDate ?? null,
      certifyingAuthority: skill.certifyingAuthority ?? null,
      hourlyRate: skill.hourlyRate ?? null,
      availability: skill.availability ?? null,
      notes: skill.notes ?? null,
      isActive: skill.isActive ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.operatorSkills.set(id, newSkill);
    return newSkill;
  }

  async updateOperatorSkill(id: string, updates: Partial<OperatorSkill>): Promise<OperatorSkill | undefined> {
    const skill = this.operatorSkills.get(id);
    if (!skill) return undefined;
    
    const updatedSkill: OperatorSkill = {
      ...skill,
      ...updates,
      updatedAt: new Date(),
    };
    this.operatorSkills.set(id, updatedSkill);
    return updatedSkill;
  }

  async getOperatorSkillsByOperator(operatorId: string): Promise<OperatorSkill[]> {
    return Array.from(this.operatorSkills.values())
      .filter(skill => skill.operatorId === operatorId);
  }

  async getOperatorsBySkillType(skillType: string): Promise<OperatorSkill[]> {
    return Array.from(this.operatorSkills.values())
      .filter(skill => skill.skillType === skillType && skill.isActive);
  }

  async deleteOperatorSkill(id: string): Promise<void> {
    this.operatorSkills.delete(id);
  }

  // Tool Resources operations
  async getAllToolResources(): Promise<ToolResource[]> {
    return Array.from(this.toolResources.values());
  }

  async getToolResource(id: string): Promise<ToolResource | undefined> {
    return this.toolResources.get(id);
  }

  async createToolResource(resource: InsertToolResource): Promise<ToolResource> {
    const id = randomUUID();
    const now = new Date();
    const newResource: ToolResource = {
      ...resource,
      reservedQuantity: resource.reservedQuantity ?? null,
      inUseQuantity: resource.inUseQuantity ?? null,
      maintenanceQuantity: resource.maintenanceQuantity ?? null,
      condition: resource.condition ?? null,
      lastInspectionDate: resource.lastInspectionDate ?? null,
      nextInspectionDue: resource.nextInspectionDue ?? null,
      usageTracking: resource.usageTracking ?? null,
      costCenter: resource.costCenter ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.toolResources.set(id, newResource);
    return newResource;
  }

  async updateToolResource(id: string, updates: Partial<ToolResource>): Promise<ToolResource | undefined> {
    const resource = this.toolResources.get(id);
    if (!resource) return undefined;
    
    const updatedResource: ToolResource = {
      ...resource,
      ...updates,
      updatedAt: new Date(),
    };
    this.toolResources.set(id, updatedResource);
    return updatedResource;
  }

  async getToolResourcesByLocation(location: string): Promise<ToolResource[]> {
    return Array.from(this.toolResources.values())
      .filter(resource => resource.location === location);
  }

  async getAvailableToolResources(toolId: string): Promise<ToolResource[]> {
    return Array.from(this.toolResources.values())
      .filter(resource => resource.toolId === toolId && resource.availableQuantity > 0);
  }

  async deleteToolResource(id: string): Promise<void> {
    this.toolResources.delete(id);
  }

  // Material Availability operations
  async getAllMaterialAvailability(): Promise<MaterialAvailability[]> {
    return Array.from(this.materialAvailability.values());
  }

  async getMaterialAvailability(id: string): Promise<MaterialAvailability | undefined> {
    return this.materialAvailability.get(id);
  }

  async createMaterialAvailability(availability: InsertMaterialAvailability): Promise<MaterialAvailability> {
    const id = randomUUID();
    const now = new Date();
    const newAvailability: MaterialAvailability = {
      ...availability,
      workOrderId: availability.workOrderId ?? null,
      allocatedQuantity: availability.allocatedQuantity ?? null,
      reservedQuantity: availability.reservedQuantity ?? null,
      availableDate: availability.availableDate ?? null,
      expirationDate: availability.expirationDate ?? null,
      supplier: availability.supplier ?? null,
      purchaseOrderNumber: availability.purchaseOrderNumber ?? null,
      unitCost: availability.unitCost ?? null,
      totalCost: availability.totalCost ?? null,
      deliveryStatus: availability.deliveryStatus ?? null,
      qualityStatus: availability.qualityStatus ?? null,
      location: availability.location ?? null,
      batchLotNumber: availability.batchLotNumber ?? null,
      notes: availability.notes ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.materialAvailability.set(id, newAvailability);
    return newAvailability;
  }

  async updateMaterialAvailability(id: string, updates: Partial<MaterialAvailability>): Promise<MaterialAvailability | undefined> {
    const availability = this.materialAvailability.get(id);
    if (!availability) return undefined;
    
    const updatedAvailability: MaterialAvailability = {
      ...availability,
      ...updates,
      updatedAt: new Date(),
    };
    this.materialAvailability.set(id, updatedAvailability);
    return updatedAvailability;
  }

  async getMaterialAvailabilityByWorkOrder(workOrderId: string): Promise<MaterialAvailability[]> {
    return Array.from(this.materialAvailability.values())
      .filter(availability => availability.workOrderId === workOrderId);
  }

  async getMaterialAvailabilityByMaterial(materialId: string): Promise<MaterialAvailability[]> {
    return Array.from(this.materialAvailability.values())
      .filter(availability => availability.materialId === materialId);
  }

  async deleteMaterialAvailability(id: string): Promise<void> {
    this.materialAvailability.delete(id);
  }

  // Resource Reservations operations
  async getAllResourceReservations(): Promise<ResourceReservation[]> {
    return Array.from(this.resourceReservations.values());
  }

  async getResourceReservation(id: string): Promise<ResourceReservation | undefined> {
    return this.resourceReservations.get(id);
  }

  async createResourceReservation(reservation: InsertResourceReservation): Promise<ResourceReservation> {
    const id = randomUUID();
    const now = new Date();
    const newReservation: ResourceReservation = {
      ...reservation,
      operationId: reservation.operationId ?? null,
      scheduleSlotId: reservation.scheduleSlotId ?? null,
      quantity: reservation.quantity ?? null,
      reservationType: reservation.reservationType ?? null,
      priority: reservation.priority ?? null,
      status: reservation.status ?? null,
      conflictResolution: reservation.conflictResolution ?? null,
      notes: reservation.notes ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.resourceReservations.set(id, newReservation);
    return newReservation;
  }

  async updateResourceReservation(id: string, updates: Partial<ResourceReservation>): Promise<ResourceReservation | undefined> {
    const reservation = this.resourceReservations.get(id);
    if (!reservation) return undefined;
    
    const updatedReservation: ResourceReservation = {
      ...reservation,
      ...updates,
      updatedAt: new Date(),
    };
    this.resourceReservations.set(id, updatedReservation);
    return updatedReservation;
  }

  async getResourceReservationsByWorkOrder(workOrderId: string): Promise<ResourceReservation[]> {
    return Array.from(this.resourceReservations.values())
      .filter(reservation => reservation.workOrderId === workOrderId);
  }

  async getResourceReservationsByResource(resourceType: string, resourceId: string): Promise<ResourceReservation[]> {
    return Array.from(this.resourceReservations.values())
      .filter(reservation => reservation.resourceType === resourceType && reservation.resourceId === resourceId);
  }

  async getActiveResourceReservations(): Promise<ResourceReservation[]> {
    return Array.from(this.resourceReservations.values())
      .filter(reservation => reservation.status === 'active');
  }

  async deleteResourceReservation(id: string): Promise<void> {
    this.resourceReservations.delete(id);
  }

  // Scenarios operations
  async getAllScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenarios.values());
  }

  async getScenario(id: string): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }

  async createScenario(scenario: InsertScenario): Promise<Scenario> {
    const id = randomUUID();
    const now = new Date();
    const newScenario: Scenario = {
      ...scenario,
      description: scenario.description ?? null,
      baselineDate: scenario.baselineDate ?? now,
      overrides: scenario.overrides ?? null,
      workOrderScope: scenario.workOrderScope ?? null,
      dateRange: scenario.dateRange ?? null,
      results: scenario.results ?? null,
      metrics: scenario.metrics ?? null,
      status: scenario.status ?? null,
      lastRunAt: scenario.lastRunAt ?? null,
      runtime: scenario.runtime ?? null,
      version: scenario.version ?? null,
      isPublic: scenario.isPublic ?? null,
      tags: scenario.tags ?? null,
      notes: scenario.notes ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.scenarios.set(id, newScenario);
    return newScenario;
  }

  async updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario | undefined> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;
    
    const updatedScenario: Scenario = {
      ...scenario,
      ...updates,
      updatedAt: new Date(),
    };
    this.scenarios.set(id, updatedScenario);
    return updatedScenario;
  }

  async getScenariosByCreator(creatorId: string): Promise<Scenario[]> {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.createdBy === creatorId);
  }

  async getPublicScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.isPublic);
  }

  async runScenario(id: string): Promise<Scenario> {
    const scenario = this.scenarios.get(id);
    if (!scenario) throw new Error(`Scenario ${id} not found`);
    
    const now = new Date();
    const updatedScenario: Scenario = {
      ...scenario,
      status: 'running',
      lastRunAt: now,
      updatedAt: now,
    };
    
    // TODO: Implement actual scenario computation logic
    // For now, just mark as completed
    setTimeout(async () => {
      const completedScenario: Scenario = {
        ...updatedScenario,
        status: 'completed',
        runtime: 1,
        results: { message: "Scenario computation completed" },
        updatedAt: new Date(),
      };
      this.scenarios.set(id, completedScenario);
    }, 100);
    
    this.scenarios.set(id, updatedScenario);
    return updatedScenario;
  }

  async deleteScenario(id: string): Promise<void> {
    this.scenarios.delete(id);
  }

  // Data Entry Module implementations
  // Shift Reports operations
  async getAllShiftReports(): Promise<ShiftReport[]> {
    return Array.from(this.shiftReports.values());
  }

  async getShiftReport(id: string): Promise<ShiftReport | undefined> {
    return this.shiftReports.get(id);
  }

  async createShiftReport(shift: InsertShiftReport): Promise<ShiftReport> {
    const id = randomUUID();
    const now = new Date();
    const newShiftReport: ShiftReport = {
      ...shift,
      supervisor: shift.supervisor ?? null,
      totalProduced: shift.totalProduced ?? null,
      totalScrap: shift.totalScrap ?? null,
      totalDowntime: shift.totalDowntime ?? null,
      efficiency: shift.efficiency ?? null,
      notes: shift.notes ?? null,
      status: shift.status ?? 'active',
      issues: shift.issues ?? null,
      achievements: shift.achievements ?? null,
      attendanceCount: shift.attendanceCount ?? null,
      safetyIncidents: shift.safetyIncidents ?? null,
      maintenancePerformed: shift.maintenancePerformed ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.shiftReports.set(id, newShiftReport);
    return newShiftReport;
  }

  async updateShiftReport(id: string, updates: Partial<ShiftReport>): Promise<ShiftReport | undefined> {
    const shiftReport = this.shiftReports.get(id);
    if (!shiftReport) return undefined;
    
    const updatedShiftReport: ShiftReport = {
      ...shiftReport,
      ...updates,
      updatedAt: new Date(),
    };
    this.shiftReports.set(id, updatedShiftReport);
    return updatedShiftReport;
  }

  async getActiveShiftReports(): Promise<ShiftReport[]> {
    return Array.from(this.shiftReports.values())
      .filter(report => report.status === 'active');
  }

  async getShiftReportsByDate(date: Date): Promise<ShiftReport[]> {
    const dateStr = date.toISOString().split('T')[0];
    return Array.from(this.shiftReports.values())
      .filter(report => report.shiftDate.toISOString().split('T')[0] === dateStr);
  }

  async closeShiftReport(id: string, endTime: Date): Promise<ShiftReport | undefined> {
    const shiftReport = this.shiftReports.get(id);
    if (!shiftReport) return undefined;
    
    const updatedShiftReport: ShiftReport = {
      ...shiftReport,
      endTime,
      status: 'completed',
      updatedAt: new Date(),
    };
    this.shiftReports.set(id, updatedShiftReport);
    return updatedShiftReport;
  }

  // Operator Sessions operations
  async getAllOperatorSessions(): Promise<OperatorSession[]> {
    return Array.from(this.operatorSessions.values());
  }

  async getOperatorSession(id: string): Promise<OperatorSession | undefined> {
    return this.operatorSessions.get(id);
  }

  async createOperatorSession(session: InsertOperatorSession): Promise<OperatorSession> {
    const id = randomUUID();
    const now = new Date();
    const newSession: OperatorSession = {
      ...session,
      setupTime: session.setupTime ?? null,
      runTime: session.runTime ?? null,
      breakTime: session.breakTime ?? null,
      downtimeMinutes: session.downtimeMinutes ?? null,
      partCount: session.partCount ?? null,
      scrapCount: session.scrapCount ?? null,
      qualityIssues: session.qualityIssues ?? null,
      notes: session.notes ?? null,
      endTime: session.endTime ?? null,
      status: session.status ?? 'active',
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.operatorSessions.set(id, newSession);
    return newSession;
  }

  async updateOperatorSession(id: string, updates: Partial<OperatorSession>): Promise<OperatorSession | undefined> {
    const session = this.operatorSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: OperatorSession = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };
    this.operatorSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getActiveOperatorSessions(): Promise<OperatorSession[]> {
    return Array.from(this.operatorSessions.values())
      .filter(session => session.status === 'active');
  }

  async getOperatorSessionsByShift(shiftId: string): Promise<OperatorSession[]> {
    return Array.from(this.operatorSessions.values())
      .filter(session => session.shiftId === shiftId);
  }

  async getOperatorSessionsByOperator(operatorId: string): Promise<OperatorSession[]> {
    return Array.from(this.operatorSessions.values())
      .filter(session => session.operatorId === operatorId);
  }

  async endOperatorSession(id: string, endTime: Date): Promise<OperatorSession | undefined> {
    const session = this.operatorSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: OperatorSession = {
      ...session,
      endTime,
      status: 'completed',
      updatedAt: new Date(),
    };
    this.operatorSessions.set(id, updatedSession);
    return updatedSession;
  }

  // Reason Codes operations
  async getAllReasonCodes(): Promise<ReasonCode[]> {
    return Array.from(this.reasonCodes.values());
  }

  async getReasonCode(id: string): Promise<ReasonCode | undefined> {
    return this.reasonCodes.get(id);
  }

  async createReasonCode(reasonCode: InsertReasonCode): Promise<ReasonCode> {
    const id = randomUUID();
    const now = new Date();
    const newReasonCode: ReasonCode = {
      ...reasonCode,
      description: reasonCode.description ?? null,
      category: reasonCode.category ?? null,
      subcategory: reasonCode.subcategory ?? null,
      impactLevel: reasonCode.impactLevel ?? 'low',
      isActive: reasonCode.isActive ?? true,
      color: reasonCode.color ?? null,
      sortOrder: reasonCode.sortOrder ?? null,
      parentCode: reasonCode.parentCode ?? null,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.reasonCodes.set(id, newReasonCode);
    return newReasonCode;
  }

  async updateReasonCode(id: string, updates: Partial<ReasonCode>): Promise<ReasonCode | undefined> {
    const reasonCode = this.reasonCodes.get(id);
    if (!reasonCode) return undefined;
    
    const updatedReasonCode: ReasonCode = {
      ...reasonCode,
      ...updates,
      updatedAt: new Date(),
    };
    this.reasonCodes.set(id, updatedReasonCode);
    return updatedReasonCode;
  }

  async getReasonCodesByCategory(category: string): Promise<ReasonCode[]> {
    return Array.from(this.reasonCodes.values())
      .filter(code => code.category === category);
  }

  async getActiveReasonCodes(): Promise<ReasonCode[]> {
    return Array.from(this.reasonCodes.values())
      .filter(code => code.isActive);
  }

  async deleteReasonCode(id: string): Promise<void> {
    this.reasonCodes.delete(id);
  }

  // Scrap Logs operations
  async getAllScrapLogs(): Promise<ScrapLog[]> {
    return Array.from(this.scrapLogs.values());
  }

  async getScrapLog(id: string): Promise<ScrapLog | undefined> {
    return this.scrapLogs.get(id);
  }

  async createScrapLog(scrapLog: InsertScrapLog): Promise<ScrapLog> {
    const id = randomUUID();
    const now = new Date();
    const newScrapLog: ScrapLog = {
      ...scrapLog,
      reasonCodeId: scrapLog.reasonCodeId ?? null,
      description: scrapLog.description ?? null,
      materialCost: scrapLog.materialCost ?? null,
      laborCost: scrapLog.laborCost ?? null,
      batchNumber: scrapLog.batchNumber ?? null,
      notes: scrapLog.notes ?? null,
      verifiedBy: scrapLog.verifiedBy ?? null,
      verifiedAt: scrapLog.verifiedAt ?? null,
      status: scrapLog.status ?? 'pending',
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.scrapLogs.set(id, newScrapLog);
    return newScrapLog;
  }

  async updateScrapLog(id: string, updates: Partial<ScrapLog>): Promise<ScrapLog | undefined> {
    const scrapLog = this.scrapLogs.get(id);
    if (!scrapLog) return undefined;
    
    const updatedScrapLog: ScrapLog = {
      ...scrapLog,
      ...updates,
      updatedAt: new Date(),
    };
    this.scrapLogs.set(id, updatedScrapLog);
    return updatedScrapLog;
  }

  async getScrapLogsByWorkOrder(workOrderId: string): Promise<ScrapLog[]> {
    return Array.from(this.scrapLogs.values())
      .filter(log => log.workOrderId === workOrderId);
  }

  async getScrapLogsByShift(shiftId: string): Promise<ScrapLog[]> {
    return Array.from(this.scrapLogs.values())
      .filter(log => log.shiftId === shiftId);
  }

  async getScrapLogsByOperator(operatorId: string): Promise<ScrapLog[]> {
    return Array.from(this.scrapLogs.values())
      .filter(log => log.operatorId === operatorId);
  }

  async verifyScrapLog(id: string, verifiedBy: string): Promise<ScrapLog | undefined> {
    const scrapLog = this.scrapLogs.get(id);
    if (!scrapLog) return undefined;
    
    const updatedScrapLog: ScrapLog = {
      ...scrapLog,
      verifiedBy,
      verifiedAt: new Date(),
      status: 'verified',
      updatedAt: new Date(),
    };
    this.scrapLogs.set(id, updatedScrapLog);
    return updatedScrapLog;
  }

  // Data Entry validation utilities
  async validateWorkOrderAssignment(workOrderId: string, machineId: string): Promise<boolean> {
    const workOrder = this.workOrders.get(workOrderId);
    const machine = this.machines.get(machineId);
    
    if (!workOrder || !machine) return false;
    
    // Check if work order is already assigned to a different machine
    if (workOrder.assignedMachineId && workOrder.assignedMachineId !== machineId) {
      return false;
    }
    
    // Check if machine can handle the operation type
    if (workOrder.operationType && machine.type) {
      const operationTypeMapping: Record<string, string[]> = {
        'TURNING': ['CNC_TURNING', 'CONVENTIONAL_TURNING'],
        'MILLING': ['CNC_MILLING', 'CONVENTIONAL_MILLING'],
        'GRINDING': ['SURFACE_GRINDING', 'CYLINDRICAL_GRINDING'],
        'WIRE_CUT': ['WIRE_CUT'],
        'DRILLING': ['DRILLING', 'CNC_MILLING'],
      };
      
      const validMachineTypes = operationTypeMapping[workOrder.operationType] || [];
      if (!validMachineTypes.includes(machine.type)) {
        return false;
      }
    }
    
    return true;
  }

  async validateOperatorSession(operatorId: string, machineId: string, workOrderId: string): Promise<boolean> {
    // Check if operator already has an active session on a different machine
    const activeSessions = await this.getActiveOperatorSessions();
    const operatorActiveSessions = activeSessions.filter(session => 
      session.operatorId === operatorId && session.machineId !== machineId
    );
    
    if (operatorActiveSessions.length > 0) {
      return false; // Operator can only be active on one machine at a time
    }
    
    // Validate work order assignment
    const workOrderValid = await this.validateWorkOrderAssignment(workOrderId, machineId);
    if (!workOrderValid) {
      return false;
    }
    
    return true;
  }

  async validateProductionQuantity(workOrderId: string, quantityToAdd: number): Promise<{ isValid: boolean; remainingQuantity: number; }> {
    const workOrder = this.workOrders.get(workOrderId);
    if (!workOrder) {
      return { isValid: false, remainingQuantity: 0 };
    }
    
    const completedQuantity = workOrder.completedQuantity || 0;
    const remainingQuantity = workOrder.quantity - completedQuantity;
    
    const isValid = quantityToAdd <= remainingQuantity && quantityToAdd > 0;
    
    return { isValid, remainingQuantity };
  }

  async getShiftSummary(shiftId: string): Promise<{
    totalProduced: number;
    totalScrap: number;
    totalDowntime: number;
    efficiency: number;
    activeSessions: number;
  }> {
    const sessions = await this.getOperatorSessionsByShift(shiftId);
    const scrapLogs = await this.getScrapLogsByShift(shiftId);
    
    const totalProduced = sessions.reduce((sum, session) => sum + (session.partCount || 0), 0);
    const totalScrap = scrapLogs.reduce((sum, log) => sum + log.quantity, 0);
    const totalDowntime = sessions.reduce((sum, session) => sum + (session.downtimeMinutes || 0), 0);
    const activeSessions = sessions.filter(session => session.status === 'active').length;
    
    const totalRunTime = sessions.reduce((sum, session) => sum + (session.runTime || 0), 0);
    const totalTime = totalRunTime + totalDowntime;
    const efficiency = totalTime > 0 ? (totalRunTime / totalTime) * 100 : 0;
    
    return {
      totalProduced,
      totalScrap,
      totalDowntime,
      efficiency,
      activeSessions
    };
  }

  // Analytics operations (implementing missing ones)
  async getAnalyticsKPIs(filters: AnalyticsFilters): Promise<AnalyticsKPIs> {
    // Use the AnalyticsEngine to calculate KPIs
    const { AnalyticsEngine } = await import('./analytics');
    
    const machines = Array.from(this.machines.values());
    const workOrders = Array.from(this.workOrders.values());
    const productionLogs = Array.from(this.productionLogs.values());
    const downtimeEvents = Array.from(this.downtimeEvents.values());
    const qualityRecords = Array.from(this.qualityRecords.values());
    const scheduleSlots = Array.from(this.scheduleSlots.values());
    
    return AnalyticsEngine.calculateAnalyticsKPIs(
      machines,
      workOrders,
      productionLogs,
      downtimeEvents,
      qualityRecords,
      scheduleSlots,
      filters.dateRange
    );
  }

  async getOEEBreakdown(machineIds?: string[], period?: { from: Date; to: Date }): Promise<OEEBreakdown[]> {
    const { AnalyticsEngine } = await import('./analytics');
    
    const machines = Array.from(this.machines.values())
      .filter(machine => !machineIds || machineIds.includes(machine.id));
    
    const defaultPeriod = period || {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      to: new Date()
    };
    
    return machines.map(machine => {
      const productionLogs = Array.from(this.productionLogs.values())
        .filter(log => log.machineId === machine.id);
      const downtimeEvents = Array.from(this.downtimeEvents.values())
        .filter(event => event.machineId === machine.id);
      const qualityRecords = Array.from(this.qualityRecords.values())
        .filter(record => record.machineId === machine.id);
      const scheduleSlots = Array.from(this.scheduleSlots.values())
        .filter(slot => slot.machineId === machine.id);
      
      return AnalyticsEngine.calculateOEE(
        machine,
        productionLogs,
        downtimeEvents,
        qualityRecords,
        scheduleSlots,
        defaultPeriod
      );
    });
  }

  async getScheduleAdherence(filters: AnalyticsFilters): Promise<AdherenceMetrics[]> {
    const { AnalyticsEngine } = await import('./analytics');
    
    const workOrders = Array.from(this.workOrders.values());
    const scheduleSlots = Array.from(this.scheduleSlots.values());
    
    return AnalyticsEngine.calculateScheduleAdherence(
      workOrders,
      scheduleSlots,
      filters.dateRange
    );
  }

  async getUtilizationMetrics(machineIds?: string[], period?: { from: Date; to: Date }): Promise<UtilizationMetrics[]> {
    const { AnalyticsEngine } = await import('./analytics');
    
    const machines = Array.from(this.machines.values())
      .filter(machine => !machineIds || machineIds.includes(machine.id));
    const productionLogs = Array.from(this.productionLogs.values());
    const downtimeEvents = Array.from(this.downtimeEvents.values());
    const operatorSessions = Array.from(this.operatorSessions.values());
    
    const defaultPeriod = period || {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      to: new Date()
    };
    
    return AnalyticsEngine.calculateUtilizationMetrics(
      machines,
      productionLogs,
      downtimeEvents,
      operatorSessions,
      defaultPeriod
    );
  }

  async getQualitySummary(filters: AnalyticsFilters): Promise<QualitySummary> {
    const { AnalyticsEngine } = await import('./analytics');
    
    const qualityRecords = Array.from(this.qualityRecords.values());
    
    return AnalyticsEngine.calculateQualitySummary(
      qualityRecords,
      filters.dateRange
    );
  }

  async getAnalyticsTrends(metric: string, filters: AnalyticsFilters): Promise<TrendPoint[]> {
    // Simplified trend calculation - in production this would be more sophisticated
    const period = filters.dateRange;
    const days = Math.ceil((period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60 * 24));
    
    const trends: TrendPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(period.from);
      date.setDate(date.getDate() + i);
      
      // Generate sample trend data - in production this would be calculated from real data
      const value = Math.floor(Math.random() * 100) + 50;
      trends.push({
        timestamp: date,
        value,
        label: date.toISOString().split('T')[0]
      });
    }
    
    return trends;
  }

  async getMachineOEESnapshots(): Promise<MachineOEESnapshot[]> {
    const { AnalyticsEngine } = await import('./analytics');
    
    const machines = Array.from(this.machines.values());
    const workOrders = Array.from(this.workOrders.values());
    const productionLogs = Array.from(this.productionLogs.values());
    const downtimeEvents = Array.from(this.downtimeEvents.values());
    const qualityRecords = Array.from(this.qualityRecords.values());
    
    return AnalyticsEngine.getRealtimeMachineOEE(
      machines,
      productionLogs,
      downtimeEvents,
      qualityRecords,
      workOrders
    );
  }

  async getDowntimePareto(filters: AnalyticsFilters): Promise<{ category: string; value: number; percentage: number }[]> {
    const { AnalyticsEngine } = await import('./analytics');
    
    const downtimeEvents = Array.from(this.downtimeEvents.values())
      .filter(event => 
        event.startTime >= filters.dateRange.from && 
        event.startTime <= filters.dateRange.to
      );
    
    return AnalyticsEngine.generateDowntimePareto(downtimeEvents, filters.dateRange);
  }
}

export const storage = new MemStorage();
