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



// Manufacturing Operations Tables - Enhanced for Scheduling
export const operations = pgTable("operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull(),
  operationNumber: integer("operation_number").notNull(),
  operationType: text("operation_type").notNull(), // TURNING, MILLING, DRILLING, GRINDING, HEAT_TREATMENT, PLATING, etc.
  operationDescription: text("operation_description").notNull(),
  location: text("location").notNull(), // INTERNAL, EXTERNAL
  vendorName: text("vendor_name"), // For external operations
  vendorContact: text("vendor_contact"),
  machineTypes: jsonb("machine_types"), // Array of machine types that can handle this operation
  assignedMachineId: varchar("assigned_machine_id"), // Assigned machine for internal operations
  setupTimeMinutes: real("setup_time_minutes"), // Setup time in minutes
  runTimeMinutesPerUnit: real("run_time_minutes_per_unit"), // Run time per unit in minutes
  batchSize: integer("batch_size"), // Minimum batch size for setup efficiency
  operationFamily: text("operation_family"), // For setup matrix (e.g., "TURNING_STEEL", "MILLING_ALUMINUM")
  leadTimeDays: real("lead_time_days"), // days for external operations
  costPerPiece: real("cost_per_piece"),
  toolingRequired: jsonb("tooling_required"), // Array of required tool IDs
  requiredSkills: jsonb("required_skills"), // Array of operator skill requirements
  workInstructions: text("work_instructions"),
  specialRequirements: text("special_requirements"), // Heat treat specs, plating thickness, etc.
  qualityChecks: jsonb("quality_checks"),
  predecessorOperationIds: jsonb("predecessor_operation_ids"), // Array of operation dependencies
  successorOperationIds: jsonb("successor_operation_ids"), // Array of operations that depend on this one
  priority: integer("priority").default(100), // Lower number = higher priority
  dueDate: timestamp("due_date"), // Individual operation due date for scheduling
  status: text("status").default("pending"), // pending, scheduled, in_progress, completed, shipped, received
  plannedStartDate: timestamp("planned_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  completedBy: varchar("completed_by"),
  completedAt: timestamp("completed_at"),
  schedulingWeight: real("scheduling_weight").default(1.0), // Weight for priority calculation
  isBottleneck: boolean("is_bottleneck").default(false), // Mark as bottleneck operation
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Inventory Management Tables
export const rawMaterials = pgTable("raw_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku").unique().notNull(), // Auto-generated based on material + grade + diameter + shape
  materialType: text("material_type").notNull(), // Steel, Aluminum, Stainless Steel, etc.
  grade: text("grade").notNull(), // 4140, 6061-T6, 316L, etc.
  shape: text("shape").notNull(), // Round Bar, Square Bar, Plate, etc.
  diameter: real("diameter"), // in mm
  thickness: real("thickness"), // in mm for plates
  width: real("width"), // in mm for plates/squares
  length: real("length"), // in mm - can vary
  supplier: text("supplier").notNull(),
  unitCost: real("unit_cost").notNull(),
  reorderPoint: integer("reorder_point").default(10),
  maxStock: integer("max_stock").default(100),
  location: text("location"), // Warehouse location/bin
  specifications: jsonb("specifications"), // Additional material specs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rawMaterialInventory = pgTable("raw_material_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").notNull().references(() => rawMaterials.id),
  currentStock: integer("current_stock").default(0),
  reservedStock: integer("reserved_stock").default(0),
  availableStock: integer("available_stock").default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const inventoryTools = pgTable("inventory_tools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku").unique().notNull(), // Auto-generated based on type + size + material + coating
  toolType: text("tool_type").notNull(), // End Mill, Drill Bit, Insert, etc.
  subType: text("sub_type"), // Roughing, Finishing, etc.
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
  size: real("size").notNull(), // Diameter in mm
  length: real("length"), // Overall length in mm
  material: text("material").notNull(), // HSS, Carbide, etc.
  coating: text("coating"), // TiN, TiAlN, etc.
  geometry: text("geometry"), // For inserts: WNMG, CNMG, etc.
  applicationMaterial: text("application_material").array(), // Steel, Aluminum, etc.
  operationType: text("operation_type").array(), // TURNING, MILLING, DRILLING
  specifications: jsonb("specifications"), // Cutting parameters, angles, etc.
  supplier: text("supplier").notNull(),
  unitCost: real("unit_cost").notNull(),
  reorderPoint: integer("reorder_point").default(5),
  maxStock: integer("max_stock").default(50),
  location: text("location"), // Tool crib location
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const toolInventory = pgTable("tool_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => inventoryTools.id),
  currentStock: integer("current_stock").default(0),
  reservedStock: integer("reserved_stock").default(0),
  availableStock: integer("available_stock").default(0),
  condition: text("condition").default("new"), // new, used, worn, damaged
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Production Planning Tables - Enhanced for Industry Standards
export const productionPlans = pgTable("production_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planName: text("plan_name").notNull(),
  planType: text("plan_type").notNull(), // daily, weekly, monthly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("draft"), // draft, active, completed, archived
  totalWorkOrders: integer("total_work_orders").default(0),
  completedWorkOrders: integer("completed_work_orders").default(0),
  efficiency: real("efficiency").default(0),
  workOrderIds: jsonb("work_order_ids"), // Array of selected work order IDs
  schedulingPolicy: jsonb("scheduling_policy"), // {rule: EDD|SPT|CR, horizon: hours, allowOverload: boolean}
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const capacityPlanning = pgTable("capacity_planning", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => productionPlans.id),
  machineId: varchar("machine_id").notNull(),
  date: timestamp("date").notNull(),
  plannedHours: real("planned_hours").notNull(),
  availableHours: real("available_hours").notNull(),
  utilization: real("utilization").default(0),
  workOrders: jsonb("work_orders"), // Array of work order IDs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Machine Capabilities and Calendars
export const machineCapabilities = pgTable("machine_capabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  machineId: varchar("machine_id").notNull().references(() => machines.id),
  machineTypes: jsonb("machine_types").notNull(), // Array of operation types this machine can handle
  operationFamilies: jsonb("operation_families").notNull(), // Array of operation families for setup matrix
  efficiency: real("efficiency").default(1.0), // Machine efficiency factor (0.0-1.0)
  calendarId: varchar("calendar_id").notNull(),
  preferredOperations: jsonb("preferred_operations"), // Operations this machine excels at
  alternativeOperations: jsonb("alternative_operations"), // Operations possible with lower efficiency
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendars = pgTable("calendars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shifts: jsonb("shifts").notNull(), // Array of shift definitions with start/end times
  workDays: jsonb("work_days").notNull(), // Array of working days [1,2,3,4,5] for Mon-Fri
  exceptions: jsonb("exceptions"), // Array of holiday/maintenance dates
  timezone: text("timezone").default("UTC"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Setup Time Matrix for Sequence-Dependent Changeovers
export const setupMatrix = pgTable("setup_matrix", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromFamily: text("from_family").notNull(), // Operation family transitioning from
  toFamily: text("to_family").notNull(), // Operation family transitioning to
  changeoverMinutes: real("changeover_minutes").notNull(), // Setup time in minutes
  machineType: text("machine_type").notNull(), // Which type of machine this applies to
  description: text("description"), // Details about the changeover process
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schedule Slots - Core Scheduling Output
export const scheduleSlots = pgTable("schedule_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  planId: varchar("plan_id").notNull().references(() => productionPlans.id),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id),
  operationId: varchar("operation_id").notNull().references(() => operations.id),
  machineId: varchar("machine_id").notNull().references(() => machines.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  setupMinutes: real("setup_minutes").default(0),
  runMinutes: real("run_minutes").notNull(),
  quantity: integer("quantity").notNull(),
  priority: integer("priority").default(100), // Lower number = higher priority
  status: text("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  actualSetupMinutes: real("actual_setup_minutes"),
  actualRunMinutes: real("actual_run_minutes"),
  schedulingRule: text("scheduling_rule"), // EDD, SPT, CR, etc.
  conflictFlags: jsonb("conflict_flags"), // Array of detected conflicts
  color: text("color").default("#3B82F6"), // Hex color code for visual differentiation in Gantt chart
  locked: boolean("locked").default(false), // Prevents drag/drop modifications for critical tasks
  tags: jsonb("tags"), // Array of tags for categorization/filtering (e.g., ["urgent", "outsourced"])
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Capacity Buckets - Daily/Hourly Resource Utilization
export const capacityBuckets = pgTable("capacity_buckets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  machineId: varchar("machine_id").notNull().references(() => machines.id),
  date: timestamp("date").notNull(),
  hour: integer("hour"), // 0-23 for hourly buckets, null for daily buckets
  availableMinutes: real("available_minutes").notNull(),
  plannedMinutes: real("planned_minutes").default(0),
  actualMinutes: real("actual_minutes").default(0),
  utilization: real("utilization").default(0), // planned/available
  actualUtilization: real("actual_utilization").default(0), // actual/available
  isOverloaded: boolean("is_overloaded").default(false),
  overloadPercentage: real("overload_percentage").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shift Entries for Data Collection and Analytics
export const shiftEntries = pgTable("shift_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  machineId: varchar("machine_id").notNull().references(() => machines.id),
  operatorId: varchar("operator_id").notNull(),
  date: timestamp("date").notNull(),
  shift: text("shift").notNull(), // day, evening, night
  plannedMinutes: real("planned_minutes").notNull(),
  runMinutes: real("run_minutes").default(0),
  setupMinutes: real("setup_minutes").default(0),
  downtimeMinutes: real("downtime_minutes").default(0),
  maintenanceMinutes: real("maintenance_minutes").default(0),
  goodQuantity: integer("good_quantity").default(0),
  scrapQuantity: integer("scrap_quantity").default(0),
  reworkQuantity: integer("rework_quantity").default(0),
  cycleTimeActual: real("cycle_time_actual"), // Average cycle time for the shift
  cycleTimeStandard: real("cycle_time_standard"), // Standard/target cycle time
  oeeAvailability: real("oee_availability").default(0), // A = (planned - downtime) / planned
  oeePerformance: real("oee_performance").default(0), // P = (standard * good) / run_minutes
  oeeQuality: real("oee_quality").default(0), // Q = good / (good + scrap + rework)
  oeeOverall: real("oee_overall").default(0), // A * P * Q
  scheduleAdherence: real("schedule_adherence").default(0), // Adherence to planned schedule
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Setup Groups for Similar Operations
export const setupGroups = pgTable("setup_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  machineTypes: jsonb("machine_types").notNull(), // Array of machine types this setup group applies to
  operationFamilies: jsonb("operation_families").notNull(), // Array of operation families in this group
  standardSetupMinutes: real("standard_setup_minutes").notNull(),
  toolConfiguration: jsonb("tool_configuration"), // Standard tool setup for this group
  fixtures: jsonb("fixtures"), // Required fixtures
  workholding: text("workholding"), // Chuck, vise, collet, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Operator Skills and Certifications
export const operatorSkills = pgTable("operator_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: varchar("operator_id").notNull().references(() => users.id),
  skillType: text("skill_type").notNull(), // TURNING, MILLING, GRINDING, SETUP, INSPECTION, etc.
  skillLevel: integer("skill_level").notNull(), // 1-5 skill rating
  certificationDate: timestamp("certification_date"),
  expirationDate: timestamp("expiration_date"),
  certifyingAuthority: text("certifying_authority"),
  machineTypes: jsonb("machine_types"), // Array of machine types certified for
  operationTypes: jsonb("operation_types"), // Array of operations certified for
  hourlyRate: real("hourly_rate"), // Hourly rate for this skill level
  availability: jsonb("availability"), // Working hours/shifts available
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tool Resource Availability
export const toolResources = pgTable("tool_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  toolId: varchar("tool_id").notNull().references(() => inventoryTools.id),
  totalQuantity: integer("total_quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  reservedQuantity: integer("reserved_quantity").default(0),
  inUseQuantity: integer("in_use_quantity").default(0),
  maintenanceQuantity: integer("maintenance_quantity").default(0),
  location: text("location").notNull(), // Tool crib, machine carousel, etc.
  condition: text("condition").default("good"), // good, fair, needs_maintenance, worn_out
  lastInspectionDate: timestamp("last_inspection_date"),
  nextInspectionDue: timestamp("next_inspection_due"),
  usageTracking: jsonb("usage_tracking"), // Track usage hours, cycles, etc.
  costCenter: text("cost_center"), // For accounting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Material Availability Constraints
export const materialAvailability = pgTable("material_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  materialId: varchar("material_id").notNull().references(() => rawMaterials.id),
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  requiredQuantity: real("required_quantity").notNull(),
  allocatedQuantity: real("allocated_quantity").default(0),
  reservedQuantity: real("reserved_quantity").default(0),
  availableDate: timestamp("available_date"), // When material will be available
  expirationDate: timestamp("expiration_date"), // Material shelf life
  supplier: text("supplier"),
  purchaseOrderNumber: text("purchase_order_number"),
  unitCost: real("unit_cost"),
  totalCost: real("total_cost"),
  deliveryStatus: text("delivery_status").default("pending"), // pending, in_transit, received, delayed
  qualityStatus: text("quality_status").default("approved"), // approved, hold, rejected
  location: text("location"), // Warehouse location
  batchLotNumber: text("batch_lot_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Resource Reservations
export const resourceReservations = pgTable("resource_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceType: text("resource_type").notNull(), // machine, operator, tool, material
  resourceId: varchar("resource_id").notNull(), // ID of the resource being reserved
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id),
  operationId: varchar("operation_id").references(() => operations.id),
  scheduleSlotId: varchar("schedule_slot_id").references(() => scheduleSlots.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  quantity: real("quantity").default(1), // For materials/tools
  reservationType: text("reservation_type").default("hard"), // hard, soft, preference
  priority: integer("priority").default(100), // Lower number = higher priority
  status: text("status").default("active"), // active, cancelled, expired, fulfilled
  conflictResolution: text("conflict_resolution"), // How conflicts should be resolved
  reservedBy: varchar("reserved_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// What-If Scenarios
export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  baselineDate: timestamp("baseline_date").defaultNow().notNull(),
  scenarioType: text("scenario_type").notNull(), // capacity_what_if, schedule_optimization, constraint_analysis
  parameters: jsonb("parameters").notNull(), // Scenario-specific parameters
  overrides: jsonb("overrides"), // Machine capacity, calendar, efficiency overrides
  workOrderScope: jsonb("work_order_scope"), // Array of work order IDs to include
  dateRange: jsonb("date_range"), // {startDate, endDate} for scenario
  results: jsonb("results"), // Computed results when scenario is run
  metrics: jsonb("metrics"), // Performance metrics for comparison
  status: text("status").default("draft"), // draft, running, completed, archived
  createdBy: varchar("created_by").notNull().references(() => users.id),
  lastRunAt: timestamp("last_run_at"),
  runtime: integer("runtime"), // Computation time in seconds
  version: integer("version").default(1), // Scenario version for change tracking
  isPublic: boolean("is_public").default(false), // Can other users view this scenario
  tags: jsonb("tags"), // Array of tags for organization
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

// Schema exports - Enhanced with new planning tables
export const insertOperationSchema = createInsertSchema(operations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOperationSequenceSchema = createInsertSchema(operationSequences).omit({
  id: true,
  createdAt: true,
});
export const insertRawMaterialSchema = createInsertSchema(rawMaterials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertRawMaterialInventorySchema = createInsertSchema(rawMaterialInventory);
export const insertInventoryToolSchema = createInsertSchema(inventoryTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make some fields optional that might be generated client-side
  sku: z.string().optional(),
  currentStock: z.number().optional(),
});
export const insertToolInventorySchema = createInsertSchema(toolInventory);
export const insertProductionPlanSchema = createInsertSchema(productionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str))
});
export const insertCapacityPlanningSchema = createInsertSchema(capacityPlanning).omit({
  id: true,
  createdAt: true,
});

// New planning schema exports
export const insertMachineCapabilitySchema = createInsertSchema(machineCapabilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCalendarSchema = createInsertSchema(calendars).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSetupMatrixSchema = createInsertSchema(setupMatrix).omit({
  id: true,
  createdAt: true,
});
export const insertScheduleSlotSchema = createInsertSchema(scheduleSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCapacityBucketSchema = createInsertSchema(capacityBuckets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertShiftEntrySchema = createInsertSchema(shiftEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSetupGroupSchema = createInsertSchema(setupGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOperatorSkillSchema = createInsertSchema(operatorSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertToolResourceSchema = createInsertSchema(toolResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertMaterialAvailabilitySchema = createInsertSchema(materialAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertResourceReservationSchema = createInsertSchema(resourceReservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertScenarioSchema = createInsertSchema(scenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports - Complete with new planning types
export type Operation = typeof operations.$inferSelect;
export type InsertOperation = z.infer<typeof insertOperationSchema>;
export type OperationSequence = typeof operationSequences.$inferSelect;
export type InsertOperationSequence = z.infer<typeof insertOperationSequenceSchema>;
export type RawMaterial = typeof rawMaterials.$inferSelect;
export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;
export type RawMaterialInventory = typeof rawMaterialInventory.$inferSelect;
export type InsertRawMaterialInventory = z.infer<typeof insertRawMaterialInventorySchema>;
export type InventoryTool = typeof inventoryTools.$inferSelect;
export type InsertInventoryTool = z.infer<typeof insertInventoryToolSchema>;
export type ToolInventory = typeof toolInventory.$inferSelect;
export type InsertToolInventory = z.infer<typeof insertToolInventorySchema>;
export type ProductionPlan = typeof productionPlans.$inferSelect;
export type InsertProductionPlan = z.infer<typeof insertProductionPlanSchema>;
export type CapacityPlanning = typeof capacityPlanning.$inferSelect;
export type InsertCapacityPlanning = z.infer<typeof insertCapacityPlanningSchema>;

// New planning type exports
export type MachineCapability = typeof machineCapabilities.$inferSelect;
export type InsertMachineCapability = z.infer<typeof insertMachineCapabilitySchema>;
export type Calendar = typeof calendars.$inferSelect;
export type InsertCalendar = z.infer<typeof insertCalendarSchema>;
export type SetupMatrix = typeof setupMatrix.$inferSelect;
export type InsertSetupMatrix = z.infer<typeof insertSetupMatrixSchema>;
export type ScheduleSlot = typeof scheduleSlots.$inferSelect;
export type InsertScheduleSlot = z.infer<typeof insertScheduleSlotSchema>;
export type CapacityBucket = typeof capacityBuckets.$inferSelect;
export type InsertCapacityBucket = z.infer<typeof insertCapacityBucketSchema>;
export type ShiftEntry = typeof shiftEntries.$inferSelect;
export type InsertShiftEntry = z.infer<typeof insertShiftEntrySchema>;
export type SetupGroup = typeof setupGroups.$inferSelect;
export type InsertSetupGroup = z.infer<typeof insertSetupGroupSchema>;
export type OperatorSkill = typeof operatorSkills.$inferSelect;
export type InsertOperatorSkill = z.infer<typeof insertOperatorSkillSchema>;
export type ToolResource = typeof toolResources.$inferSelect;
export type InsertToolResource = z.infer<typeof insertToolResourceSchema>;
export type MaterialAvailability = typeof materialAvailability.$inferSelect;
export type InsertMaterialAvailability = z.infer<typeof insertMaterialAvailabilitySchema>;
export type ResourceReservation = typeof resourceReservations.$inferSelect;
export type InsertResourceReservation = z.infer<typeof insertResourceReservationSchema>;
export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;

// Extended interfaces for production planning
export interface SchedulingPolicy {
  rule: 'EDD' | 'SPT' | 'CR' | 'FIFO' | 'PRIORITY'; // Earliest Due Date, Shortest Processing Time, Critical Ratio
  horizon: number; // Planning horizon in hours
  allowOverload: boolean; // Allow machine overloading
  maxOverloadPercentage?: number; // Maximum allowed overload percentage
  rescheduleInterval?: number; // Auto-reschedule interval in minutes
}

export interface ShiftDefinition {
  name: string;
  startTime: string; // "08:00"
  endTime: string; // "16:00"
  breakMinutes: number;
}

export interface CalendarException {
  date: string; // ISO date
  type: 'holiday' | 'maintenance' | 'shutdown';
  description: string;
}

export interface OperationCapability {
  operationType: string;
  efficiency: number; // 0.0 - 1.0
  setupTimeMinutes: number;
  maxCycleTimeMinutes?: number;
}

export interface SchedulingConflict {
  type: 'resource_conflict' | 'precedence_violation' | 'capacity_overload' | 'deadline_missed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedOperations: string[]; // Operation IDs
  suggestedResolution?: string;
}

export interface ProductionMetrics {
  oeeOverall: number;
  scheduleAdherence: number;
  throughputRate: number;
  utilizationRate: number;
  qualityRate: number;
  bottleneckMachines: string[];
  criticalWorkOrders: string[];
}
