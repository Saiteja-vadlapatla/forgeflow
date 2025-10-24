CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"source" text NOT NULL,
	"source_id" varchar,
	"severity" text DEFAULT 'medium' NOT NULL,
	"is_read" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendars" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"shifts" jsonb NOT NULL,
	"work_days" jsonb NOT NULL,
	"exceptions" jsonb,
	"timezone" text DEFAULT 'UTC',
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capacity_buckets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"machine_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"hour" integer,
	"available_minutes" real NOT NULL,
	"planned_minutes" real DEFAULT 0,
	"actual_minutes" real DEFAULT 0,
	"utilization" real DEFAULT 0,
	"actual_utilization" real DEFAULT 0,
	"is_overloaded" boolean DEFAULT false,
	"overload_percentage" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capacity_planning" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"machine_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"planned_hours" real NOT NULL,
	"available_hours" real NOT NULL,
	"utilization" real DEFAULT 0,
	"work_orders" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consumables" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"type" text,
	"manufacturer" text NOT NULL,
	"grade" text,
	"viscosity" text,
	"capacity" real,
	"unit_of_measure" text NOT NULL,
	"current_stock" integer DEFAULT 0,
	"supplier" text NOT NULL,
	"unit_cost" real NOT NULL,
	"reorder_point" integer DEFAULT 10,
	"max_stock" integer DEFAULT 100,
	"location" text,
	"shelf_life" integer,
	"specifications" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consumables_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "downtime_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"machine_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"description" text,
	"reported_by" varchar NOT NULL,
	"resolved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fasteners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar NOT NULL,
	"fastener_type" text NOT NULL,
	"thread_type" text NOT NULL,
	"diameter" real NOT NULL,
	"pitch" real,
	"thread_description" text,
	"length" real,
	"head_type" text,
	"drive_type" text,
	"material" text NOT NULL,
	"grade" text,
	"finish" text,
	"current_stock" integer DEFAULT 0,
	"supplier" text NOT NULL,
	"unit_cost" real NOT NULL,
	"reorder_point" integer DEFAULT 100,
	"max_stock" integer DEFAULT 1000,
	"location" text,
	"specifications" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fasteners_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "general_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"sub_category" text,
	"manufacturer" text,
	"model" text,
	"description" text,
	"specifications" jsonb,
	"current_stock" integer DEFAULT 0,
	"supplier" text NOT NULL,
	"unit_cost" real NOT NULL,
	"reorder_point" integer DEFAULT 5,
	"max_stock" integer DEFAULT 50,
	"location" text,
	"condition" text DEFAULT 'new',
	"serial_number" text,
	"purchase_date" timestamp,
	"warranty_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "general_items_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"current_stock" real DEFAULT 0 NOT NULL,
	"unit" text NOT NULL,
	"min_stock_level" real DEFAULT 0 NOT NULL,
	"max_stock_level" real,
	"unit_cost" real,
	"location" text,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "inventory_tools" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar NOT NULL,
	"tool_type" text NOT NULL,
	"sub_type" text,
	"manufacturer" text NOT NULL,
	"model" text NOT NULL,
	"size" real NOT NULL,
	"length" real,
	"material" text NOT NULL,
	"coating" text,
	"geometry" text,
	"application_material" text[],
	"operation_type" text[],
	"specifications" jsonb,
	"current_stock" integer DEFAULT 0,
	"supplier" text NOT NULL,
	"unit_cost" real NOT NULL,
	"reorder_point" integer DEFAULT 5,
	"max_stock" integer DEFAULT 50,
	"location" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_tools_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"item_type" text NOT NULL,
	"adjustment_type" text NOT NULL,
	"quantity" real NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"previous_stock" real NOT NULL,
	"new_stock" real NOT NULL,
	"adjusted_by" varchar,
	"accountable_by" varchar NOT NULL,
	"cost_impact" real,
	"batch_number" text,
	"reference" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_capabilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"machine_id" varchar NOT NULL,
	"machine_types" jsonb NOT NULL,
	"operation_families" jsonb NOT NULL,
	"efficiency" real DEFAULT 1,
	"calendar_id" varchar NOT NULL,
	"preferred_operations" jsonb,
	"alternative_operations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"operation" text NOT NULL,
	"sub_operation" text,
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"location" text,
	"status" text DEFAULT 'idle' NOT NULL,
	"efficiency" real DEFAULT 0,
	"current_work_order_id" varchar,
	"last_maintenance_date" timestamp,
	"next_maintenance_due" timestamp,
	"total_runtime" integer DEFAULT 0,
	"max_spindle_speed" integer,
	"max_feed_rate" real,
	"work_envelope" jsonb,
	"tool_capacity" integer,
	"specifications" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machines_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "material_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" varchar NOT NULL,
	"work_order_id" varchar,
	"required_quantity" real NOT NULL,
	"allocated_quantity" real DEFAULT 0,
	"reserved_quantity" real DEFAULT 0,
	"available_date" timestamp,
	"expiration_date" timestamp,
	"supplier" text,
	"purchase_order_number" text,
	"unit_cost" real,
	"total_cost" real,
	"delivery_status" text DEFAULT 'pending',
	"quality_status" text DEFAULT 'approved',
	"location" text,
	"batch_lot_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operation_sequences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" varchar NOT NULL,
	"operations" jsonb NOT NULL,
	"total_lead_time" real,
	"current_operation_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" varchar NOT NULL,
	"operation_number" integer NOT NULL,
	"operation_type" text NOT NULL,
	"operation_description" text NOT NULL,
	"location" text NOT NULL,
	"vendor_name" text,
	"vendor_contact" text,
	"machine_types" jsonb,
	"assigned_machine_id" varchar,
	"setup_time_minutes" real,
	"run_time_minutes_per_unit" real,
	"batch_size" integer,
	"operation_family" text,
	"lead_time_days" real,
	"cost_per_piece" real,
	"tooling_required" jsonb,
	"required_skills" jsonb,
	"work_instructions" text,
	"special_requirements" text,
	"quality_checks" jsonb,
	"predecessor_operation_ids" jsonb,
	"successor_operation_ids" jsonb,
	"priority" integer DEFAULT 100,
	"due_date" timestamp,
	"status" text DEFAULT 'pending',
	"planned_start_date" timestamp,
	"actual_start_date" timestamp,
	"planned_end_date" timestamp,
	"actual_end_date" timestamp,
	"completed_by" varchar,
	"completed_at" timestamp,
	"scheduling_weight" real DEFAULT 1,
	"is_bottleneck" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" varchar NOT NULL,
	"machine_id" varchar NOT NULL,
	"work_order_id" varchar NOT NULL,
	"shift_id" varchar NOT NULL,
	"session_start" timestamp NOT NULL,
	"session_end" timestamp,
	"setup_time_minutes" integer DEFAULT 0,
	"run_time_minutes" integer DEFAULT 0,
	"down_time_minutes" integer DEFAULT 0,
	"quantity_produced" integer DEFAULT 0,
	"quantity_scrap" integer DEFAULT 0,
	"avg_cycle_time" real,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_skills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" varchar NOT NULL,
	"skill_type" text NOT NULL,
	"skill_level" integer NOT NULL,
	"certification_date" timestamp,
	"expiration_date" timestamp,
	"certifying_authority" text,
	"machine_types" jsonb,
	"operation_types" jsonb,
	"hourly_rate" real,
	"availability" jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"sub_category" text,
	"description" text,
	"standard_parameters" jsonb,
	"quality_standards" jsonb,
	"safety_requirements" text,
	"estimated_cycle_time" real,
	"is_standard" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"machine_id" varchar NOT NULL,
	"work_order_id" varchar NOT NULL,
	"quantity_produced" integer NOT NULL,
	"quantity_scrap" integer DEFAULT 0,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"shift_id" varchar,
	"operator_id" varchar NOT NULL,
	"cycle_time" real,
	"operator_session_id" varchar,
	"batch_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_name" text NOT NULL,
	"plan_type" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'draft',
	"total_work_orders" integer DEFAULT 0,
	"completed_work_orders" integer DEFAULT 0,
	"efficiency" real DEFAULT 0,
	"work_order_ids" jsonb,
	"scheduling_policy" jsonb,
	"notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" varchar NOT NULL,
	"machine_id" varchar NOT NULL,
	"part_number" text NOT NULL,
	"serial_number" text,
	"inspection_type" text NOT NULL,
	"result" text NOT NULL,
	"measurements" jsonb,
	"critical_dimensions" jsonb,
	"surface_finish" real,
	"hardness" real,
	"concentricity" real,
	"runout" real,
	"defect_type" text,
	"defect_location" text,
	"defect_description" text,
	"gauge_calibration_due" timestamp,
	"inspector_id" varchar NOT NULL,
	"inspection_date" timestamp DEFAULT now() NOT NULL,
	"corrective_action" text,
	"disposition_code" text,
	"rework_instructions" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_material_inventory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" varchar NOT NULL,
	"current_stock" integer DEFAULT 0,
	"reserved_stock" integer DEFAULT 0,
	"available_stock" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_materials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar NOT NULL,
	"material_type" text NOT NULL,
	"grade" text NOT NULL,
	"shape" text NOT NULL,
	"diameter" real,
	"thickness" real,
	"width" real,
	"length" real,
	"current_stock" integer DEFAULT 0,
	"supplier" text NOT NULL,
	"unit_cost" real NOT NULL,
	"reorder_point" integer DEFAULT 10,
	"max_stock" integer DEFAULT 100,
	"location" text,
	"specifications" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "raw_materials_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "reason_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text NOT NULL,
	"requires_comment" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"severity" text DEFAULT 'medium',
	"impact_type" text NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reason_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "resource_reservations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" varchar NOT NULL,
	"work_order_id" varchar NOT NULL,
	"operation_id" varchar,
	"schedule_slot_id" varchar,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"quantity" real DEFAULT 1,
	"reservation_type" text DEFAULT 'hard',
	"priority" integer DEFAULT 100,
	"status" text DEFAULT 'active',
	"conflict_resolution" text,
	"reserved_by" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"baseline_date" timestamp DEFAULT now() NOT NULL,
	"scenario_type" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"overrides" jsonb,
	"work_order_scope" jsonb,
	"date_range" jsonb,
	"results" jsonb,
	"metrics" jsonb,
	"status" text DEFAULT 'draft',
	"created_by" varchar NOT NULL,
	"last_run_at" timestamp,
	"runtime" integer,
	"version" integer DEFAULT 1,
	"is_public" boolean DEFAULT false,
	"tags" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"work_order_id" varchar NOT NULL,
	"operation_id" varchar NOT NULL,
	"machine_id" varchar NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"setup_minutes" real DEFAULT 0,
	"run_minutes" real NOT NULL,
	"quantity" integer NOT NULL,
	"priority" integer DEFAULT 100,
	"status" text DEFAULT 'scheduled',
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"actual_setup_minutes" real,
	"actual_run_minutes" real,
	"scheduling_rule" text,
	"conflict_flags" jsonb,
	"color" text DEFAULT '#3B82F6',
	"locked" boolean DEFAULT false,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrap_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_order_id" varchar NOT NULL,
	"machine_id" varchar NOT NULL,
	"operator_id" varchar NOT NULL,
	"operator_session_id" varchar,
	"shift_id" varchar,
	"quantity" integer NOT NULL,
	"reason_code_id" varchar NOT NULL,
	"reason_comment" text,
	"part_stage" text,
	"recoverable" boolean DEFAULT false,
	"cost" real,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"reported_by" varchar NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"disposition" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setup_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"machine_types" jsonb NOT NULL,
	"operation_families" jsonb NOT NULL,
	"standard_setup_minutes" real NOT NULL,
	"tool_configuration" jsonb,
	"fixtures" jsonb,
	"workholding" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "setup_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "setup_matrix" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_family" text NOT NULL,
	"to_family" text NOT NULL,
	"changeover_minutes" real NOT NULL,
	"machine_type" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"machine_id" varchar NOT NULL,
	"operator_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"shift" text NOT NULL,
	"planned_minutes" real NOT NULL,
	"run_minutes" real DEFAULT 0,
	"setup_minutes" real DEFAULT 0,
	"downtime_minutes" real DEFAULT 0,
	"maintenance_minutes" real DEFAULT 0,
	"good_quantity" integer DEFAULT 0,
	"scrap_quantity" integer DEFAULT 0,
	"rework_quantity" integer DEFAULT 0,
	"cycle_time_actual" real,
	"cycle_time_standard" real,
	"oee_availability" real DEFAULT 0,
	"oee_performance" real DEFAULT 0,
	"oee_quality" real DEFAULT 0,
	"oee_overall" real DEFAULT 0,
	"schedule_adherence" real DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_date" timestamp NOT NULL,
	"shift_type" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"supervisor_id" varchar NOT NULL,
	"operator_ids" jsonb NOT NULL,
	"machine_ids" jsonb NOT NULL,
	"work_order_ids" jsonb,
	"total_produced" integer DEFAULT 0,
	"total_scrap" integer DEFAULT 0,
	"total_downtime_minutes" integer DEFAULT 0,
	"efficiency" real DEFAULT 0,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_inventory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" varchar NOT NULL,
	"current_stock" integer DEFAULT 0,
	"reserved_stock" integer DEFAULT 0,
	"available_stock" integer DEFAULT 0,
	"condition" text DEFAULT 'new',
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" varchar NOT NULL,
	"total_quantity" integer NOT NULL,
	"available_quantity" integer NOT NULL,
	"reserved_quantity" integer DEFAULT 0,
	"in_use_quantity" integer DEFAULT 0,
	"maintenance_quantity" integer DEFAULT 0,
	"location" text NOT NULL,
	"condition" text DEFAULT 'good',
	"last_inspection_date" timestamp,
	"next_inspection_due" timestamp,
	"usage_tracking" jsonb,
	"cost_center" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_number" text NOT NULL,
	"tool_type" text NOT NULL,
	"manufacturer" text,
	"description" text NOT NULL,
	"diameter" real,
	"length" real,
	"material" text,
	"coating" text,
	"current_location" text,
	"status" text DEFAULT 'available',
	"total_usage_hours" real DEFAULT 0,
	"max_usage_hours" real,
	"last_maintenance_date" timestamp,
	"next_maintenance_hours" real,
	"cost_per_tool" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tools_tool_number_unique" UNIQUE("tool_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'operator' NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"part_number" text NOT NULL,
	"part_name" text NOT NULL,
	"customer_part_number" text,
	"drawing" text,
	"material" text,
	"material_grade" text,
	"raw_material_size" text,
	"finished_dimensions" text,
	"quantity" integer NOT NULL,
	"completed_quantity" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"operation_type" text NOT NULL,
	"assigned_machine_id" varchar,
	"operator_id" varchar,
	"setup_instructions" text,
	"tooling_required" jsonb,
	"program_number" text,
	"planned_start_date" timestamp,
	"actual_start_date" timestamp,
	"planned_end_date" timestamp,
	"actual_end_date" timestamp,
	"estimated_setup_time" real,
	"actual_setup_time" real,
	"estimated_cycle_time" real,
	"actual_cycle_time" real,
	"estimated_hours" real,
	"actual_hours" real,
	"quality_requirements" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "capacity_buckets" ADD CONSTRAINT "capacity_buckets_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_planning" ADD CONSTRAINT "capacity_planning_plan_id_production_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."production_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_adjusted_by_users_id_fk" FOREIGN KEY ("adjusted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_capabilities" ADD CONSTRAINT "machine_capabilities_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_availability" ADD CONSTRAINT "material_availability_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_availability" ADD CONSTRAINT "material_availability_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_skills" ADD CONSTRAINT "operator_skills_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_material_inventory" ADD CONSTRAINT "raw_material_inventory_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_reservations" ADD CONSTRAINT "resource_reservations_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_reservations" ADD CONSTRAINT "resource_reservations_operation_id_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_reservations" ADD CONSTRAINT "resource_reservations_schedule_slot_id_schedule_slots_id_fk" FOREIGN KEY ("schedule_slot_id") REFERENCES "public"."schedule_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_plan_id_production_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."production_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_operation_id_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_entries" ADD CONSTRAINT "shift_entries_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_inventory" ADD CONSTRAINT "tool_inventory_tool_id_inventory_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."inventory_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_resources" ADD CONSTRAINT "tool_resources_tool_id_inventory_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."inventory_tools"("id") ON DELETE no action ON UPDATE no action;