import { 
  type User, type InsertUser,
  type Machine, type InsertMachine,
  type WorkOrder, type InsertWorkOrder,
  type QualityRecord, type InsertQualityRecord,
  type InventoryItem, type InsertInventoryItem,
  type DowntimeEvent, type InsertDowntimeEvent,
  type ProductionLog, type InsertProductionLog,
  type Alert, type InsertAlert,
  type DashboardKPIs, type MachineWithWorkOrder, type RealtimeData
} from "@shared/schema";
import { randomUUID } from "crypto";

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
        status: "running",
        efficiency: 94,
        currentWorkOrderId: "wo-1",
        lastMaintenanceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        totalRuntime: 1440,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "machine-2",
        name: "MILL-003",
        type: "CNC_MILLING",
        operation: "CNC Milling",
        status: "setup",
        efficiency: 0,
        currentWorkOrderId: "wo-2",
        lastMaintenanceDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        totalRuntime: 960,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "machine-3",
        name: "GRIND-002",
        type: "SURFACE_GRINDING",
        operation: "Surface Grinding",
        status: "maintenance",
        efficiency: 0,
        currentWorkOrderId: null,
        lastMaintenanceDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        totalRuntime: 2880,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "machine-4",
        name: "WIRE-001",
        type: "WIRE_CUT",
        operation: "Wire Cut EDM",
        status: "running",
        efficiency: 89,
        currentWorkOrderId: "wo-3",
        lastMaintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        totalRuntime: 1920,
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
        quantity: 120,
        completedQuantity: 80,
        status: "in_progress",
        priority: "normal",
        assignedMachineId: "machine-1",
        plannedStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        actualEndDate: null,
        estimatedHours: 24,
        actualHours: 16,
        notes: "Standard production run",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "wo-2",
        orderNumber: "WO-2024-007",
        partNumber: "BT-50-25-200",
        partName: "BT-50 Tool Holder",
        quantity: 50,
        completedQuantity: 0,
        status: "setup",
        priority: "high",
        assignedMachineId: "machine-2",
        plannedStartDate: new Date(),
        actualStartDate: null,
        plannedEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        actualEndDate: null,
        estimatedHours: 15,
        actualHours: 0,
        notes: "Rush order - priority setup",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "wo-3",
        orderNumber: "WO-2024-012",
        partNumber: "EDM-PLT-001",
        partName: "EDM Cutting Plate",
        quantity: 20,
        completedQuantity: 9,
        status: "in_progress",
        priority: "normal",
        assignedMachineId: "machine-4",
        plannedStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actualStartDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        actualEndDate: null,
        estimatedHours: 40,
        actualHours: 18,
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
      plannedStartDate: insertWorkOrder.plannedStartDate || null,
      actualStartDate: insertWorkOrder.actualStartDate || null,
      plannedEndDate: insertWorkOrder.plannedEndDate || null,
      actualEndDate: insertWorkOrder.actualEndDate || null,
      estimatedHours: insertWorkOrder.estimatedHours || null,
      actualHours: insertWorkOrder.actualHours || null,
      notes: insertWorkOrder.notes || null,
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
      measurements: insertRecord.measurements || null,
      defectType: insertRecord.defectType || null,
      defectDescription: insertRecord.defectDescription || null,
      correctiveAction: insertRecord.correctiveAction || null,
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
}

export const storage = new MemStorage();
