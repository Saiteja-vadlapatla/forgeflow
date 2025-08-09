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
  type: text("type").notNull(), // CNC_TURNING, CNC_MILLING, SURFACE_GRINDING, etc.
  operation: text("operation").notNull(),
  status: text("status").notNull().default("idle"), // running, idle, setup, maintenance, error
  efficiency: real("efficiency").default(0),
  currentWorkOrderId: varchar("current_work_order_id"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  totalRuntime: integer("total_runtime").default(0), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  partNumber: text("part_number").notNull(),
  partName: text("part_name").notNull(),
  quantity: integer("quantity").notNull(),
  completedQuantity: integer("completed_quantity").default(0),
  status: text("status").notNull().default("pending"), // pending, in_progress, setup, completed, on_hold
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  assignedMachineId: varchar("assigned_machine_id"),
  plannedStartDate: timestamp("planned_start_date"),
  actualStartDate: timestamp("actual_start_date"),
  plannedEndDate: timestamp("planned_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  estimatedHours: real("estimated_hours"),
  actualHours: real("actual_hours"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const qualityRecords = pgTable("quality_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull(),
  machineId: varchar("machine_id").notNull(),
  inspectionType: text("inspection_type").notNull(), // first_article, in_process, final
  result: text("result").notNull(), // pass, fail, rework
  measurements: jsonb("measurements"), // JSON object with measurement data
  defectType: text("defect_type"),
  defectDescription: text("defect_description"),
  inspectorId: varchar("inspector_id").notNull(),
  inspectionDate: timestamp("inspection_date").defaultNow().notNull(),
  correctiveAction: text("corrective_action"),
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

// Dashboard data types
export interface DashboardKPIs {
  overallOEE: number;
  activeMachines: number;
  totalMachines: number;
  productionRate: number;
  qualityRate: number;
}

export interface MachineWithWorkOrder extends Machine {
  workOrder?: WorkOrder;
  downtime?: number;
}

export interface RealtimeData {
  kpis: DashboardKPIs;
  machines: MachineWithWorkOrder[];
  activeWorkOrders: WorkOrder[];
  alerts: Alert[];
  productionData: { timestamp: string; value: number }[];
  oeeData: { timestamp: string; value: number }[];
}
