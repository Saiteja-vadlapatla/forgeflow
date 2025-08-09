import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("operator"),
  fullName: text("full_name").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const machines = pgTable("machines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // CNC_TURNING, CONVENTIONAL_TURNING, CNC_MILLING, etc.
  operation: text("operation").notNull(), // Turning, Milling, Surface Grinding, etc.
  subOperation: text("sub_operation"), // Facing, Threading, Boring, Roughing, Finishing
  manufacturer: text("manufacturer"), // Mazak, Haas, DMG Mori, etc.
  model: text("model"),
  serialNumber: text("serial_number"),
  location: text("location"), // Shop Floor A, Cell 1, etc.
  status: text("status").notNull().default("idle"), // running, idle, setup, maintenance, error
  efficiency: real("efficiency").default(0),
  currentWorkOrderId: varchar("current_work_order_id"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDue: timestamp("next_maintenance_due"),
  totalRuntime: integer("total_runtime").default(0), // in minutes
  maxSpindleSpeed: integer("max_spindle_speed"), // RPM
  maxFeedRate: real("max_feed_rate"), // mm/min or in/min
  workEnvelope: jsonb("work_envelope"), // X, Y, Z dimensions
  toolCapacity: integer("tool_capacity"), // Number of tools in carousel/turret
  specifications: jsonb("specifications"), // Machine-specific technical specs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  partNumber: text("part_number").notNull(),
  partName: text("part_name").notNull(),
  customerPartNumber: text("customer_part_number"),
  drawing: text("drawing"), // Drawing number/revision
  material: text("material"), // Steel, Aluminum, Brass, etc.
  materialGrade: text("material_grade"), // 4140, 6061-T6, etc.
  rawMaterialSize: text("raw_material_size"), // "50mm x 100mm x 200mm"
  finishedDimensions: text("finished_dimensions"),
  quantity: integer("quantity").notNull(),
  completedQuantity: integer("completed_quantity").default(0),
  status: text("status").notNull().default("pending"), // pending, in_progress, setup, completed, on_hold
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  operationType: text("operation_type").notNull(), // TURNING, MILLING, GRINDING, DRILLING, etc.
  assignedMachineId: varchar("assigned_machine_id"),
  operatorId: varchar("operator_id"),
  setupInstructions: text("setup_instructions"),
  toolingRequired: jsonb("tooling_required"), // Array of required tools
  programNumber: text("program_number"), // CNC program number
  plannedStartDate: timestamp("planned_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  estimatedSetupTime: real("estimated_setup_time"), // in minutes
  actualSetupTime: real("actual_setup_time"),
  estimatedCycleTime: real("estimated_cycle_time"), // per piece in minutes
  actualCycleTime: real("actual_cycle_time"),
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours"),
  qualityRequirements: jsonb("quality_requirements"), // Tolerances, surface finish, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const qualityRecords = pgTable("quality_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull(),
  machineId: varchar("machine_id").notNull(),
  partNumber: text("part_number").notNull(),
  serialNumber: text("serial_number"),
  inspectionType: text("inspection_type").notNull(), // first_article, in_process, final, receiving
  result: text("result").notNull(), // pass, fail, rework, hold
  measurements: jsonb("measurements"), // Dimensional measurements, surface finish, hardness
  criticalDimensions: jsonb("critical_dimensions"), // Key measurements with tolerances
  surfaceFinish: real("surface_finish"), // Ra value in micrometers
  hardness: real("hardness"), // HRC, HRB, or Brinell
  concentricity: real("concentricity"), // TIR in mm or inches
  runout: real("runout"), // TIR for cylindrical parts
  defectType: text("defect_type"), // dimensional, surface, material, geometric
  defectLocation: text("defect_location"), // Where on the part
  defectDescription: text("defect_description"),
  gaugeCalibrationDue: timestamp("gauge_calibration_due"),
  inspectorId: varchar("inspector_id").notNull(),
  inspectionDate: timestamp("inspection_date").defaultNow().notNull(),
  correctiveAction: text("corrective_action"),
  dispositionCode: text("disposition_code"), // USE_AS_IS, REWORK, SCRAP, RETURN
  reworkInstructions: text("rework_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemCode: text("item_code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // raw_material, tool, consumable, finished_good
  currentStock: real("current_stock").notNull().default(0),
  unit: text("unit").notNull(), // kg, pieces, meters, etc.
  minStockLevel: real("min_stock_level").notNull().default(0),
  maxStockLevel: real("max_stock_level"),
  unitCost: real("unit_cost"),
  location: text("location"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const downtimeEvents = pgTable("downtime_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  machineId: varchar("machine_id").notNull(),
  reason: text("reason").notNull(), // maintenance, setup, breakdown, material_shortage, etc.
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  description: text("description"),
  reportedBy: varchar("reported_by").notNull(),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productionLogs = pgTable("production_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  machineId: varchar("machine_id").notNull(),
  workOrderId: varchar("work_order_id").notNull(),
  quantityProduced: integer("quantity_produced").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  shiftId: varchar("shift_id"),
  operatorId: varchar("operator_id").notNull(),
  cycleTime: real("cycle_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // warning, error, info, success
  title: text("title").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(), // machine, system, quality, inventory
  sourceId: varchar("source_id"),
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMachineSchema = createInsertSchema(machines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQualityRecordSchema = createInsertSchema(qualityRecords).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertDowntimeEventSchema = createInsertSchema(downtimeEvents).omit({
  id: true,
  createdAt: true,
});

export const insertProductionLogSchema = createInsertSchema(productionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Machine = typeof machines.$inferSelect;
export type InsertMachine = z.infer<typeof insertMachineSchema>;

export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;

export type QualityRecord = typeof qualityRecords.$inferSelect;
export type InsertQualityRecord = z.infer<typeof insertQualityRecordSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type DowntimeEvent = typeof downtimeEvents.$inferSelect;
export type InsertDowntimeEvent = z.infer<typeof insertDowntimeEventSchema>;

export type ProductionLog = typeof productionLogs.$inferSelect;
export type InsertProductionLog = z.infer<typeof insertProductionLogSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Manufacturing Operations Tables
export const operations = pgTable("operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull(),
  operationNumber: integer("operation_number").notNull(),
  operationType: text("operation_type").notNull(), // TURNING, MILLING, DRILLING, GRINDING, HEAT_TREATMENT, PLATING, etc.
  operationDescription: text("operation_description").notNull(),
  location: text("location").notNull(), // INTERNAL, EXTERNAL
  vendorName: text("vendor_name"), // For external operations
  vendorContact: text("vendor_contact"),
  machineType: text("machine_type"), // Only for internal operations
  assignedMachineId: varchar("assigned_machine_id"), // Only for internal operations
  setupTime: real("setup_time"), // minutes
  cycleTime: real("cycle_time"), // minutes per piece
  leadTime: real("lead_time"), // days for external operations
  costPerPiece: real("cost_per_piece"),
  toolingRequired: jsonb("tooling_required"),
  workInstructions: text("work_instructions"),
  specialRequirements: text("special_requirements"), // Heat treat specs, plating thickness, etc.
  qualityChecks: jsonb("quality_checks"),
  predecessor: varchar("predecessor_operation_id"), // Previous operation dependency
  status: text("status").default("pending"), // pending, in_progress, completed, shipped, received
  plannedStartDate: timestamp("planned_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  completedBy: varchar("completed_by"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operationSequences = pgTable("operation_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull(),
  operations: jsonb("operations").notNull(), // Array of operation IDs in sequence
  totalLeadTime: real("total_lead_time"), // Total estimated time in days
  currentOperation: varchar("current_operation_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tools = pgTable("tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolNumber: text("tool_number").notNull().unique(),
  toolType: text("tool_type").notNull(), // INSERT, END_MILL, DRILL, BORING_BAR, etc.
  manufacturer: text("manufacturer"),
  description: text("description").notNull(),
  diameter: real("diameter"), // in mm
  length: real("length"), // in mm
  material: text("material"), // HSS, CARBIDE, CERAMIC, etc.
  coating: text("coating"), // TiN, TiAlN, uncoated, etc.
  currentLocation: text("current_location"),
  status: text("status").default("available"), // available, in_use, maintenance, worn_out
  totalUsageHours: real("total_usage_hours").default(0),
  maxUsageHours: real("max_usage_hours"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceHours: real("next_maintenance_hours"),
  costPerTool: real("cost_per_tool"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const processes = pgTable("processes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // TURNING, MILLING, GRINDING, etc.
  subCategory: text("sub_category"), // ROUGHING, FINISHING, THREADING, etc.
  description: text("description"),
  standardParameters: jsonb("standard_parameters"), // speeds, feeds, depths
  qualityStandards: jsonb("quality_standards"),
  safetyRequirements: text("safety_requirements"),
  estimatedCycleTime: real("estimated_cycle_time"),
  isStandard: boolean("is_standard").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dashboard data types
export interface DashboardKPIs {
  overallOEE: number;
  activeMachines: number;
  totalMachines: number;
  productionRate: number;
  qualityRate: number;
  setupEfficiency: number;
  cycleTimeVariance: number;
}

export interface MachineWithWorkOrder extends Machine {
  workOrder?: WorkOrder;
  downtime?: number;
  currentOperation?: string;
  nextMaintenance?: string;
}

export interface RealtimeData {
  kpis: DashboardKPIs;
  machines: MachineWithWorkOrder[];
  activeWorkOrders: WorkOrder[];
  alerts: Alert[];
  productionData: { timestamp: string; value: number }[];
  oeeData: { timestamp: string; value: number }[];
  qualityTrends: { timestamp: string; value: number }[];
}

// Manufacturing-specific types
export interface ManufacturingOperation {
  id: string;
  type: 'TURNING' | 'MILLING' | 'GRINDING' | 'DRILLING' | 'TAPPING' | 'WIRE_CUT';
  subType?: 'ROUGHING' | 'FINISHING' | 'THREADING' | 'BORING' | 'FACING';
  parameters: {
    spindleSpeed?: number; // RPM
    feedRate?: number; // mm/min or in/min
    depthOfCut?: number; // mm or inches
    toolNumber?: string;
    coolant?: boolean;
  };
}

export interface QualityMeasurement {
  dimension: string;
  nominal: number;
  tolerance: {
    plus: number;
    minus: number;
  };
  actual: number;
  result: 'PASS' | 'FAIL';
  unit: 'mm' | 'inch' | 'degree';
}
