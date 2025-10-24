import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertWorkOrderSchema, insertMachineSchema, insertQualityRecordSchema, 
  insertRawMaterialSchema, insertInventoryToolSchema, insertConsumableSchema, 
  insertFastenerSchema, insertGeneralItemSchema, insertProductionPlanSchema,
  insertSetupGroupSchema, insertOperatorSkillSchema, insertToolResourceSchema,
  insertMaterialAvailabilitySchema, insertResourceReservationSchema, insertScenarioSchema,
  insertScheduleSlotSchema, insertOperationSchema, insertMachineCapabilitySchema,
  insertCalendarSchema, insertSetupMatrixSchema, insertDowntimeEventSchema,
  insertShiftReportSchema, insertOperatorSessionSchema, insertReasonCodeSchema, insertScrapLogSchema,
  insertProductionLogSchema, analyticsQuerySchema, analyticsFiltersSchema
} from "@shared/schema";
import { AnalyticsEngine } from "./analytics";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected to WebSocket');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected from WebSocket');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial data
    sendRealtimeData(ws);
  });

  // Function to broadcast real-time data to all connected clients
  const broadcastRealtimeData = async () => {
    if (clients.size === 0) return;

    try {
      const data = await storage.getRealtimeData();
      const message = JSON.stringify({ type: 'realtime_update', data });

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('Error broadcasting real-time data:', error);
    }
  };

  // Function to send initial data to a specific client
  const sendRealtimeData = async (ws: WebSocket) => {
    try {
      const data = await storage.getRealtimeData();
      const message = JSON.stringify({ type: 'realtime_update', data });
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    } catch (error) {
      console.error('Error sending real-time data:', error);
    }
  };

  // Broadcast updates every 5 seconds
  setInterval(broadcastRealtimeData, 5000);

  // REST API Routes

  // Dashboard endpoints
  app.get("/api/dashboard/kpis", async (req, res) => {
    try {
      const kpis = await storage.getDashboardKPIs();
      res.json(kpis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/dashboard/realtime", async (req, res) => {
    try {
      const data = await storage.getRealtimeData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch real-time data" });
    }
  });

  // Machine endpoints
  app.get("/api/machines", async (req, res) => {
    try {
      const machines = await storage.getMachinesWithWorkOrders();
      res.json(machines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch machines" });
    }
  });

  app.get("/api/machines/:id", async (req, res) => {
    try {
      const machine = await storage.getMachine(req.params.id);
      if (!machine) {
        return res.status(404).json({ error: "Machine not found" });
      }
      res.json(machine);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch machine" });
    }
  });

  app.post("/api/machines", async (req, res) => {
    try {
      const validation = insertMachineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid machine data", details: validation.error });
      }
      
      const machine = await storage.createMachine(validation.data);
      res.status(201).json(machine);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create machine" });
    }
  });

  app.patch("/api/machines/:id", async (req, res) => {
    try {
      const machine = await storage.updateMachine(req.params.id, req.body);
      if (!machine) {
        return res.status(404).json({ error: "Machine not found" });
      }
      res.json(machine);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update machine" });
    }
  });

  // Quality records endpoints
  app.get("/api/quality/records", async (req, res) => {
    try {
      const records = await storage.getAllQualityRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quality records" });
    }
  });

  app.post("/api/quality/records", async (req, res) => {
    try {
      const parsed = insertQualityRecordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
      }
      
      const record = await storage.createQualityRecord(parsed.data);
      
      // Cross-module side-effects: quality impacts
      if (record.result === 'fail' || record.result === 'rework') {
        // Create alert for quality issue
        await storage.createAlert({
          type: "quality",
          severity: record.result === 'fail' ? "high" : "medium",
          title: `Quality Issue: ${record.result.toUpperCase()}`,
          message: `Part ${record.partNumber} failed quality inspection: ${record.defectDescription || 'Quality standard not met'}. Machine: ${record.machineId}`,
          source: "quality_inspection",
          sourceId: record.machineId,
          isRead: false
        });

        // Update work order quality statistics if available
        if (record.workOrderId) {
          const workOrder = await storage.getWorkOrder(record.workOrderId);
          if (workOrder) {
            // This would require extending work order schema for quality tracking
            // For now, log the quality event for analytics aggregation
            console.log(`Quality issue logged for work order ${record.workOrderId}: ${record.result}`);
          }
        }
      }

      res.status(201).json(record);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create quality record" });
    }
  });

  // Work Order endpoints
  app.get("/api/work-orders", async (req, res) => {
    try {
      const workOrders = await storage.getAllWorkOrders();
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/active", async (req, res) => {
    try {
      const workOrders = await storage.getActiveWorkOrders();
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active work orders" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", async (req, res) => {
    try {
      const validation = insertWorkOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid work order data", details: validation.error });
      }
      
      const workOrder = await storage.createWorkOrder(validation.data);
      res.status(201).json(workOrder);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create work order" });
    }
  });

  app.patch("/api/work-orders/:id", async (req, res) => {
    try {
      const workOrder = await storage.updateWorkOrder(req.params.id, req.body);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update work order" });
    }
  });


  // Inventory endpoints
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory items" });
    }
  });

  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock items" });
    }
  });

  // Alert endpoints
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unread alerts" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, req.body);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Inventory API routes
  app.get("/api/inventory/materials", async (req, res) => {
    try {
      const materials = await storage.getRawMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch raw materials" });
    }
  });

  app.post("/api/inventory/materials", async (req, res) => {
    try {
      console.log("Raw material request body:", req.body);
      const validatedData = insertRawMaterialSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const material = await storage.createRawMaterial(validatedData);
      res.json(material);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error("Raw material creation error:", error);
      res.status(400).json({ error: "Failed to create raw material", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/inventory/materials/:id", async (req, res) => {
    try {
      const materials = await storage.getRawMaterials();
      const material = materials.find(m => m.id === req.params.id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material" });
    }
  });

  app.patch("/api/inventory/materials/:id", async (req, res) => {
    try {
      // Extract currentStock separately as it's not in the base schema
      const { currentStock, ...materialData } = req.body;
      const validatedData = insertRawMaterialSchema.partial().parse(materialData);
      
      // Merge currentStock back if provided
      const updateData = currentStock !== undefined 
        ? { ...validatedData, currentStock } 
        : validatedData;
      
      const updated = await storage.updateRawMaterial(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(updated);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update material", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/inventory/materials/:id/update-stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { adjustmentType, adjustmentQuantity, reason, notes } = req.body;
      
      // Get current material to check stock levels
      const materials = await storage.getRawMaterials();
      const material = materials.find(m => m.id === id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }

      const currentStock = material.currentStock || 0;
      let newStock = currentStock;

      if (adjustmentType === 'add') {
        newStock = currentStock + adjustmentQuantity;
      } else if (adjustmentType === 'remove') {
        // Validate: cannot withdraw more than available stock
        if (adjustmentQuantity > currentStock) {
          return res.status(400).json({ 
            error: "Insufficient stock", 
            details: `Cannot withdraw ${adjustmentQuantity} units. Only ${currentStock} units available.` 
          });
        }
        newStock = currentStock - adjustmentQuantity;
      } else if (adjustmentType === 'set') {
        newStock = adjustmentQuantity;
      }

      // Update the stock in storage
      await storage.updateRawMaterial(id, { currentStock: newStock });

      // Create inventory transaction record for audit trail
      await storage.createInventoryTransaction({
        itemId: id,
        itemType: 'materials',
        adjustmentType: adjustmentType,
        quantity: newStock - currentStock,
        reason: req.body.reason || 'Stock adjustment',
        notes: req.body.notes,
        previousStock: currentStock,
        newStock: newStock,
        adjustedBy: req.user?.id || 'admin',
        accountableBy: req.body.accountableBy || req.user?.id || 'admin',
        costImpact: (newStock - currentStock) * (material.unitCost || 0),
        batchNumber: req.body.batchNumber,
        reference: req.body.reference,
        timestamp: new Date(),
      });

      // Cross-module side-effects: inventory alerts
      const minStockLevel = material.minStockLevel || 0;
      if (newStock <= minStockLevel && newStock < currentStock) {
        // Create low stock alert
        await storage.createAlert({
          type: "low_stock",
          severity: newStock === 0 ? "critical" : "medium", 
          title: `Low Stock Alert: ${material.name}`,
          message: `Material ${material.name} is ${newStock === 0 ? 'out of stock' : `running low (${newStock} ${material.unit} remaining)`}. Reorder recommended.`,
          source: "inventory_management",
          sourceId: id,
          isRead: false
        });
      }

      res.json({ success: true, newStock, previousStock: currentStock });
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update material stock" });
    }
  });

  app.get("/api/inventory/tools", async (req, res) => {
    try {
      const tools = await storage.getInventoryTools();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  app.post("/api/inventory/tools", async (req, res) => {
    try {
      console.log("Tool request body:", req.body);
      const validatedData = insertInventoryToolSchema.parse(req.body);
      console.log("Validated tool data:", validatedData);
      const tool = await storage.createInventoryTool(validatedData);
      res.json(tool);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error("Tool creation error:", error);
      res.status(400).json({ error: "Failed to create tool", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/inventory/tools/:id", async (req, res) => {
    try {
      const tools = await storage.getInventoryTools();
      const tool = tools.find(t => t.id === req.params.id);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      res.json(tool);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tool" });
    }
  });

  app.patch("/api/inventory/tools/:id", async (req, res) => {
    try {
      // Extract currentStock separately as it's not in the base schema
      const { currentStock, ...toolData } = req.body;
      const validatedData = insertInventoryToolSchema.partial().parse(toolData);
      
      // Merge currentStock back if provided
      const updateData = currentStock !== undefined 
        ? { ...validatedData, currentStock } 
        : validatedData;
      
      const updated = await storage.updateInventoryTool(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Tool not found" });
      }
      res.json(updated);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update tool", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/inventory/tools/:id/update-stock", async (req, res) => {
    try {
      console.log('📨 [Server] Tools update-stock received:', {
        params: req.params,
        body: req.body
      });

      const { id } = req.params;
      const { adjustmentType, adjustmentQuantity, reason, notes, accountableBy } = req.body;
      
      // Get current tool to check stock levels
      const tools = await storage.getInventoryTools();
      const tool = tools.find(t => t.id === id);
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }

      const currentStock = tool.currentStock || 0;
      let newStock = currentStock;

      if (adjustmentType === 'add') {
        newStock = currentStock + adjustmentQuantity;
      } else if (adjustmentType === 'remove') {
        // Validate: cannot withdraw more than available stock
        if (adjustmentQuantity > currentStock) {
          return res.status(400).json({ 
            error: "Insufficient stock", 
            details: `Cannot withdraw ${adjustmentQuantity} units. Only ${currentStock} units available.` 
          });
        }
        newStock = currentStock - adjustmentQuantity;
      } else if (adjustmentType === 'set') {
        newStock = adjustmentQuantity;
      }

      // Update the stock in storage
      await storage.updateInventoryTool(id, { currentStock: newStock });

      // Create inventory transaction record for audit trail
      await storage.createInventoryTransaction({
        itemId: id,
        itemType: 'tools',
        adjustmentType: adjustmentType,
        quantity: newStock - currentStock,
        reason: req.body.reason || 'Stock adjustment',
        notes: req.body.notes,
        previousStock: currentStock,
        newStock: newStock,
        adjustedBy: req.user?.id || 'admin',
        accountableBy: req.body.accountableBy,
        costImpact: (newStock - currentStock) * (tool.unitCost || 0),
        batchNumber: req.body.batchNumber,
        reference: req.body.reference,
        timestamp: new Date(),
      });

      // Cross-module side-effects: inventory alerts
      const minStockLevel = tool.minStockLevel || 0;
      if (newStock <= minStockLevel && newStock < currentStock) {
        // Create low stock alert
        await storage.createAlert({
          type: "low_stock",
          severity: newStock === 0 ? "critical" : "medium", 
          title: `Low Stock Alert: ${tool.name}`,
          message: `Tool ${tool.name} is ${newStock === 0 ? 'out of stock' : `running low (${newStock} ${tool.unit} remaining)`}. Reorder recommended.`,
          source: "inventory_management",
          sourceId: id,
          isRead: false
        });
      }

      res.json({ success: true, newStock, previousStock: currentStock });
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update tool stock" });
    }
  });

  // Consumables API routes
  app.get("/api/inventory/consumables", async (req, res) => {
    try {
      const consumables = await storage.getConsumables();
      res.json(consumables);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consumables" });
    }
  });

  app.post("/api/inventory/consumables", async (req, res) => {
    try {
      const validatedData = insertConsumableSchema.parse(req.body);
      const consumable = await storage.createConsumable(validatedData);
      res.json(consumable);
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to create consumable", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/inventory/consumables/:id", async (req, res) => {
    try {
      const consumables = await storage.getConsumables();
      const consumable = consumables.find(c => c.id === req.params.id);
      if (!consumable) {
        return res.status(404).json({ error: "Consumable not found" });
      }
      res.json(consumable);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consumable" });
    }
  });

  app.patch("/api/inventory/consumables/:id", async (req, res) => {
    try {
      const { currentStock, ...consumableData } = req.body;
      const validatedData = insertConsumableSchema.partial().parse(consumableData);
      const updateData = currentStock !== undefined ? { ...validatedData, currentStock } : validatedData;
      const updated = await storage.updateConsumable(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Consumable not found" });
      }
      res.json(updated);
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update consumable", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/inventory/consumables/:id/update-stock", async (req, res) => {
    try {
      console.log('📨 [Server] Consumables update-stock received:', {
        params: req.params,
        body: req.body
      });

      const { id } = req.params;
      const { adjustmentType, adjustmentQuantity, reason, notes, accountableBy } = req.body;
      const consumables = await storage.getConsumables();
      const consumable = consumables.find(c => c.id === id);
      if (!consumable) {
        return res.status(404).json({ error: "Consumable not found" });
      }
      const currentStock = consumable.currentStock || 0;
      let newStock = currentStock;
      if (adjustmentType === 'add') {
        newStock = currentStock + adjustmentQuantity;
      } else if (adjustmentType === 'remove') {
        if (adjustmentQuantity > currentStock) {
          return res.status(400).json({
            error: "Insufficient stock",
            details: `Cannot withdraw ${adjustmentQuantity} units. Only ${currentStock} units available.`
          });
        }
        newStock = currentStock - adjustmentQuantity;
      } else if (adjustmentType === 'set') {
        newStock = adjustmentQuantity;
      }
      await storage.updateConsumable(id, { currentStock: newStock });

      // Create inventory transaction record for audit trail
      await storage.createInventoryTransaction({
        itemId: id,
        itemType: 'consumables',
        adjustmentType: adjustmentType,
        quantity: newStock - currentStock,
        reason: reason || 'Stock adjustment',
        notes: notes,
        previousStock: currentStock,
        newStock: newStock,
        adjustedBy: req.user?.id || 'admin',
        accountableBy: accountableBy,
        costImpact: (newStock - currentStock) * (consumable.unitCost || 0),
        batchNumber: req.body.batchNumber,
        reference: req.body.reference,
        timestamp: new Date(),
      });

      res.json({ success: true, newStock, previousStock: currentStock });
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update consumable stock" });
    }
  });

  // Fasteners API routes
  app.get("/api/inventory/fasteners", async (req, res) => {
    try {
      const fasteners = await storage.getFasteners();
      res.json(fasteners);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fasteners" });
    }
  });

  app.post("/api/inventory/fasteners", async (req, res) => {
    try {
      const validatedData = insertFastenerSchema.parse(req.body);
      const fastener = await storage.createFastener(validatedData);
      res.json(fastener);
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to create fastener", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/inventory/fasteners/:id", async (req, res) => {
    try {
      const fasteners = await storage.getFasteners();
      const fastener = fasteners.find(f => f.id === req.params.id);
      if (!fastener) {
        return res.status(404).json({ error: "Fastener not found" });
      }
      res.json(fastener);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fastener" });
    }
  });

  app.patch("/api/inventory/fasteners/:id", async (req, res) => {
    try {
      const { currentStock, ...fastenerData } = req.body;
      const validatedData = insertFastenerSchema.partial().parse(fastenerData);
      const updateData = currentStock !== undefined ? { ...validatedData, currentStock } : validatedData;
      const updated = await storage.updateFastener(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Fastener not found" });
      }
      res.json(updated);
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update fastener", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/inventory/fasteners/:id/update-stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { adjustmentType, adjustmentQuantity, reason, notes, accountableBy } = req.body;
      const fasteners = await storage.getFasteners();
      const fastener = fasteners.find(f => f.id === id);
      if (!fastener) {
        return res.status(404).json({ error: "Fastener not found" });
      }
      const currentStock = fastener.currentStock || 0;
      let newStock = currentStock;
      if (adjustmentType === 'add') {
        newStock = currentStock + adjustmentQuantity;
      } else if (adjustmentType === 'remove') {
        if (adjustmentQuantity > currentStock) {
          return res.status(400).json({
            error: "Insufficient stock",
            details: `Cannot withdraw ${adjustmentQuantity} units. Only ${currentStock} units available.`
          });
        }
        newStock = currentStock - adjustmentQuantity;
      } else if (adjustmentType === 'set') {
        newStock = adjustmentQuantity;
      }
      await storage.updateFastener(id, { currentStock: newStock });

      // Create inventory transaction record for audit trail
      await storage.createInventoryTransaction({
        itemId: id,
        itemType: 'fasteners',
        adjustmentType: adjustmentType,
        quantity: newStock - currentStock,
        reason: reason || 'Stock adjustment',
        notes: notes,
        previousStock: currentStock,
        newStock: newStock,
        adjustedBy: req.user?.id || 'admin',
        accountableBy: accountableBy,
        costImpact: (newStock - currentStock) * (fastener.unitCost || 0),
        batchNumber: req.body.batchNumber,
        reference: req.body.reference,
        timestamp: new Date(),
      });

      res.json({ success: true, newStock, previousStock: currentStock });
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update fastener stock" });
    }
  });

  // General Items API routes
  app.get("/api/inventory/general-items", async (req, res) => {
    try {
      const items = await storage.getGeneralItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch general items" });
    }
  });

  app.post("/api/inventory/general-items", async (req, res) => {
    try {
      const validatedData = insertGeneralItemSchema.parse(req.body);
      const item = await storage.createGeneralItem(validatedData);
      res.json(item);
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to create general item", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/inventory/general-items/:id", async (req, res) => {
    try {
      const items = await storage.getGeneralItems();
      const item = items.find(i => i.id === req.params.id);
      if (!item) {
        return res.status(404).json({ error: "General item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch general item" });
    }
  });

  app.patch("/api/inventory/general-items/:id", async (req, res) => {
    try {
      const { currentStock, ...itemData } = req.body;
      const validatedData = insertGeneralItemSchema.partial().parse(itemData);
      const updateData = currentStock !== undefined ? { ...validatedData, currentStock } : validatedData;
      const updated = await storage.updateGeneralItem(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "General item not found" });
      }
      res.json(updated);
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update general item", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.patch("/api/inventory/general-items/:id/update-stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { adjustmentType, adjustmentQuantity, reason, notes, accountableBy } = req.body;
      const items = await storage.getGeneralItems();
      const item = items.find(i => i.id === id);
      if (!item) {
        return res.status(404).json({ error: "General item not found" });
      }
      const currentStock = item.currentStock || 0;
      let newStock = currentStock;
      if (adjustmentType === 'add') {
        newStock = currentStock + adjustmentQuantity;
      } else if (adjustmentType === 'remove') {
        if (adjustmentQuantity > currentStock) {
          return res.status(400).json({
            error: "Insufficient stock",
            details: `Cannot withdraw ${adjustmentQuantity} units. Only ${currentStock} units available.`
          });
        }
        newStock = currentStock - adjustmentQuantity;
      } else if (adjustmentType === 'set') {
        newStock = adjustmentQuantity;
      }
      await storage.updateGeneralItem(id, { currentStock: newStock });

      // Create inventory transaction record for audit trail
      await storage.createInventoryTransaction({
        itemId: id,
        itemType: 'general-items',
        adjustmentType: adjustmentType,
        quantity: newStock - currentStock,
        reason: reason || 'Stock adjustment',
        notes: notes,
        previousStock: currentStock,
        newStock: newStock,
        adjustedBy: req.user?.id || 'admin',
        accountableBy: accountableBy,
        costImpact: (newStock - currentStock) * (item.unitCost || 0),
        batchNumber: req.body.batchNumber,
        reference: req.body.reference,
        timestamp: new Date(),
        createdAt: new Date(),
      });

      res.json({ success: true, newStock, previousStock: currentStock });
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update general item stock" });
    }
  });

  // Production Planning API routes
  app.get("/api/production-plans", async (req, res) => {
    try {
      const plans = await storage.getProductionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production plans" });
    }
  });
  // Add to routes.ts after the POST /api/production-plans route:
app.get("/api/production-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await storage.getProductionPlan(id);
    if (!plan) {
      return res.status(404).json({ error: "Production plan not found" });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch production plan" });
  }
});

  app.post("/api/production-plans", async (req, res) => {
    try {
      const validatedData = insertProductionPlanSchema.parse(req.body);
      const plan = await storage.createProductionPlan(validatedData);
      res.status(201).json(plan);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to create production plan" });
    }
  });

  // Add the missing PUT endpoint for updating production plans
  app.put("/api/production-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertProductionPlanSchema.parse(req.body);
      const plan = await storage.updateProductionPlan(id, validatedData);
      
      if (!plan) {
        return res.status(404).json({ error: "Production plan not found" });
      }
      
      res.json(plan);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(400).json({ error: "Failed to update production plan" });
    }
  });

  app.get("/api/capacity-planning", async (req, res) => {
    try {
      const capacity = await storage.getCapacityPlanning();
      res.json(capacity);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capacity planning data" });
    }
  });

  // Scheduling API routes for production planning
  app.post("/api/scheduling/preview", async (req, res) => {
    try {
      const { workOrderIds, startDate, endDate, policy } = req.body;
      
      // Mock schedule preview generation for now
      // In a real implementation, this would call the ProductionScheduler
      const scheduleSlots = workOrderIds.map((woId: string, index: number) => ({
        id: `slot-${index}`,
        workOrderId: woId,
        operationId: `op-${woId}`,
        machineId: `machine-${index % 3 + 1}`,
        startTime: new Date(Date.now() + index * 8 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + (index + 1) * 8 * 60 * 60 * 1000).toISOString(),
        setupMinutes: 30,
        runMinutes: 450,
        quantity: 10,
        priority: 100,
        status: "scheduled",
        conflictFlags: []
      }));

      const capacityBuckets = [
        {
          machineId: "machine-1",
          date: startDate,
          plannedMinutes: 480,
          availableMinutes: 480,
          utilization: 100,
          isOverloaded: false
        }
      ];

      const conflicts: any[] = [];

      const metrics = {
        totalWorkOrders: workOrderIds.length,
        totalHours: scheduleSlots.reduce((sum: number, slot: any) => sum + (slot.setupMinutes + slot.runMinutes) / 60, 0),
        averageUtilization: 85.5,
        makespan: 48,
        criticalPath: 32
      };

      res.json({
        scheduleSlots,
        capacityBuckets,
        conflicts,
        metrics
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate schedule preview" });
    }
  });

  app.post("/api/scheduling/optimize", async (req, res) => {
    try {
      const { planId } = req.body;
      
      // Mock optimization response
      res.json({
        success: true,
        optimizedSchedule: {
          improvementPercentage: 15.5,
          newMakespan: 42,
          suggestions: [
            "Reorder operations to reduce setup time",
            "Balance machine utilization",
            "Prioritize critical path operations"
          ]
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to optimize schedule" });
    }
  });

  // Capacity Planning Endpoints

  // Setup Groups endpoints
  app.get("/api/capacity/setup-groups", async (req, res) => {
    try {
      const setupGroups = await storage.getAllSetupGroups();
      res.json(setupGroups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setup groups" });
    }
  });

  app.get("/api/capacity/setup-groups/:id", async (req, res) => {
    try {
      const setupGroup = await storage.getSetupGroup(req.params.id);
      if (!setupGroup) {
        return res.status(404).json({ error: "Setup group not found" });
      }
      res.json(setupGroup);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setup group" });
    }
  });

  app.post("/api/capacity/setup-groups", async (req, res) => {
    try {
      const validation = insertSetupGroupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid setup group data", details: validation.error });
      }
      
      const setupGroup = await storage.createSetupGroup(validation.data);
      res.status(201).json(setupGroup);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create setup group" });
    }
  });

  app.patch("/api/capacity/setup-groups/:id", async (req, res) => {
    try {
      const setupGroup = await storage.updateSetupGroup(req.params.id, req.body);
      if (!setupGroup) {
        return res.status(404).json({ error: "Setup group not found" });
      }
      res.json(setupGroup);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update setup group" });
    }
  });

  app.delete("/api/capacity/setup-groups/:id", async (req, res) => {
    try {
      await storage.deleteSetupGroup(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete setup group" });
    }
  });

  // Operator Skills endpoints
  app.get("/api/capacity/operator-skills", async (req, res) => {
    try {
      const { operatorId, skillType } = req.query;
      
      if (operatorId) {
        const skills = await storage.getOperatorSkillsByOperator(operatorId as string);
        res.json(skills);
      } else if (skillType) {
        const operators = await storage.getOperatorsBySkillType(skillType as string);
        res.json(operators);
      } else {
        const skills = await storage.getAllOperatorSkills();
        res.json(skills);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operator skills" });
    }
  });

  app.get("/api/capacity/operator-skills/:id", async (req, res) => {
    try {
      const skill = await storage.getOperatorSkill(req.params.id);
      if (!skill) {
        return res.status(404).json({ error: "Operator skill not found" });
      }
      res.json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operator skill" });
    }
  });

  app.post("/api/capacity/operator-skills", async (req, res) => {
    try {
      const validation = insertOperatorSkillSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid operator skill data", details: validation.error });
      }
      
      const skill = await storage.createOperatorSkill(validation.data);
      res.status(201).json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to create operator skill" });
    }
  });

  app.patch("/api/capacity/operator-skills/:id", async (req, res) => {
    try {
      const skill = await storage.updateOperatorSkill(req.params.id, req.body);
      if (!skill) {
        return res.status(404).json({ error: "Operator skill not found" });
      }
      res.json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to update operator skill" });
    }
  });

  app.delete("/api/capacity/operator-skills/:id", async (req, res) => {
    try {
      await storage.deleteOperatorSkill(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete operator skill" });
    }
  });

  // Tool Resources endpoints
  app.get("/api/capacity/tool-resources", async (req, res) => {
    try {
      const { location, toolId } = req.query;
      
      if (location) {
        const resources = await storage.getToolResourcesByLocation(location as string);
        res.json(resources);
      } else if (toolId) {
        const resources = await storage.getAvailableToolResources(toolId as string);
        res.json(resources);
      } else {
        const resources = await storage.getAllToolResources();
        res.json(resources);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tool resources" });
    }
  });

  app.get("/api/capacity/tool-resources/:id", async (req, res) => {
    try {
      const resource = await storage.getToolResource(req.params.id);
      if (!resource) {
        return res.status(404).json({ error: "Tool resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tool resource" });
    }
  });

  app.post("/api/capacity/tool-resources", async (req, res) => {
    try {
      const validation = insertToolResourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid tool resource data", details: validation.error });
      }
      
      const resource = await storage.createToolResource(validation.data);
      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to create tool resource" });
    }
  });

  app.patch("/api/capacity/tool-resources/:id", async (req, res) => {
    try {
      const resource = await storage.updateToolResource(req.params.id, req.body);
      if (!resource) {
        return res.status(404).json({ error: "Tool resource not found" });
      }
      res.json(resource);
    } catch (error) {
      res.status(500).json({ error: "Failed to update tool resource" });
    }
  });

  app.delete("/api/capacity/tool-resources/:id", async (req, res) => {
    try {
      await storage.deleteToolResource(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete tool resource" });
    }
  });

  // Material Availability endpoints
  app.get("/api/capacity/material-availability", async (req, res) => {
    try {
      const { workOrderId, materialId } = req.query;
      
      if (workOrderId) {
        const availability = await storage.getMaterialAvailabilityByWorkOrder(workOrderId as string);
        res.json(availability);
      } else if (materialId) {
        const availability = await storage.getMaterialAvailabilityByMaterial(materialId as string);
        res.json(availability);
      } else {
        const availability = await storage.getAllMaterialAvailability();
        res.json(availability);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material availability" });
    }
  });

  app.get("/api/capacity/material-availability/:id", async (req, res) => {
    try {
      const availability = await storage.getMaterialAvailability(req.params.id);
      if (!availability) {
        return res.status(404).json({ error: "Material availability not found" });
      }
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material availability" });
    }
  });

  app.post("/api/capacity/material-availability", async (req, res) => {
    try {
      const validation = insertMaterialAvailabilitySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid material availability data", details: validation.error });
      }
      
      const availability = await storage.createMaterialAvailability(validation.data);
      res.status(201).json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to create material availability" });
    }
  });

  app.patch("/api/capacity/material-availability/:id", async (req, res) => {
    try {
      const availability = await storage.updateMaterialAvailability(req.params.id, req.body);
      if (!availability) {
        return res.status(404).json({ error: "Material availability not found" });
      }
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Failed to update material availability" });
    }
  });

  app.delete("/api/capacity/material-availability/:id", async (req, res) => {
    try {
      await storage.deleteMaterialAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete material availability" });
    }
  });

  // Resource Reservations endpoints
  app.get("/api/capacity/resource-reservations", async (req, res) => {
    try {
      const { workOrderId, resourceType, resourceId } = req.query;
      
      if (workOrderId) {
        const reservations = await storage.getResourceReservationsByWorkOrder(workOrderId as string);
        res.json(reservations);
      } else if (resourceType && resourceId) {
        const reservations = await storage.getResourceReservationsByResource(resourceType as string, resourceId as string);
        res.json(reservations);
      } else {
        const reservations = await storage.getAllResourceReservations();
        res.json(reservations);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource reservations" });
    }
  });

  app.get("/api/capacity/resource-reservations/active", async (req, res) => {
    try {
      const reservations = await storage.getActiveResourceReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active resource reservations" });
    }
  });

  app.get("/api/capacity/resource-reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.getResourceReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Resource reservation not found" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resource reservation" });
    }
  });

  app.post("/api/capacity/resource-reservations", async (req, res) => {
    try {
      const validation = insertResourceReservationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid resource reservation data", details: validation.error });
      }
      
      const reservation = await storage.createResourceReservation(validation.data);
      res.status(201).json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create resource reservation" });
    }
  });

  app.patch("/api/capacity/resource-reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.updateResourceReservation(req.params.id, req.body);
      if (!reservation) {
        return res.status(404).json({ error: "Resource reservation not found" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resource reservation" });
    }
  });

  app.delete("/api/capacity/resource-reservations/:id", async (req, res) => {
    try {
      await storage.deleteResourceReservation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete resource reservation" });
    }
  });

  // Scenarios endpoints
  app.get("/api/capacity/scenarios", async (req, res) => {
    try {
      const { creatorId, isPublic } = req.query;
      
      if (creatorId) {
        const scenarios = await storage.getScenariosByCreator(creatorId as string);
        res.json(scenarios);
      } else if (isPublic === 'true') {
        const scenarios = await storage.getPublicScenarios();
        res.json(scenarios);
      } else {
        const scenarios = await storage.getAllScenarios();
        res.json(scenarios);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });

  app.get("/api/capacity/scenarios/:id", async (req, res) => {
    try {
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenario" });
    }
  });

  app.post("/api/capacity/scenarios", async (req, res) => {
    try {
      const validation = insertScenarioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenario data", details: validation.error });
      }
      
      const scenario = await storage.createScenario(validation.data);
      res.status(201).json(scenario);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scenario" });
    }
  });

  app.patch("/api/capacity/scenarios/:id", async (req, res) => {
    try {
      const scenario = await storage.updateScenario(req.params.id, req.body);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scenario" });
    }
  });

  app.post("/api/capacity/scenarios/:id/run", async (req, res) => {
    try {
      const scenario = await storage.runScenario(req.params.id);
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ error: "Failed to run scenario" });
    }
  });

  app.delete("/api/capacity/scenarios/:id", async (req, res) => {
    try {
      await storage.deleteScenario(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  // Advanced Compute Endpoints for Capacity Analysis

  // Capacity Buckets Analysis - Analyze machine capacity utilization over time
  app.get("/api/capacity/buckets", async (req, res) => {
    try {
      const { machineId, startDate, endDate, granularity = 'daily' } = req.query;
      
      // Parse date parameters
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Get capacity buckets for the specified parameters
      let buckets;
      if (machineId) {
        buckets = await storage.getCapacityBuckets(machineId as string, start, end);
      } else {
        buckets = await storage.getCapacityBuckets(undefined, start, end);
      }
      
      // Group buckets by machine and calculate utilization metrics
      const capacityAnalysis = new Map();
      
      for (const bucket of buckets) {
        if (!capacityAnalysis.has(bucket.machineId)) {
          capacityAnalysis.set(bucket.machineId, {
            machineId: bucket.machineId,
            totalAvailable: 0,
            totalPlanned: 0,
            totalActual: 0,
            averageUtilization: 0,
            averageActualUtilization: 0,
            overloadedPeriods: 0,
            buckets: [],
            constraints: []
          });
        }
        
        const analysis = capacityAnalysis.get(bucket.machineId);
        analysis.totalAvailable += bucket.availableMinutes;
        analysis.totalPlanned += bucket.plannedMinutes;
        analysis.totalActual += bucket.actualMinutes;
        if (bucket.isOverloaded) analysis.overloadedPeriods++;
        analysis.buckets.push(bucket);
      }
      
      // Calculate averages and identify constraints
      for (const [machineId, analysis] of Array.from(capacityAnalysis.entries())) {
        analysis.averageUtilization = analysis.totalAvailable > 0 
          ? (analysis.totalPlanned / analysis.totalAvailable) * 100 
          : 0;
        analysis.averageActualUtilization = analysis.totalAvailable > 0 
          ? (analysis.totalActual / analysis.totalAvailable) * 100 
          : 0;
          
        // Check for resource constraints
        const machine = await storage.getMachine(machineId);
        if (machine) {
          const skills = await storage.getOperatorsBySkillType(machine.type);
          const toolResources = await storage.getAllToolResources();
          
          if (skills.length === 0) {
            analysis.constraints.push({
              type: 'operator_shortage',
              description: `No operators certified for ${machine.type}`,
              severity: 'high'
            });
          }
          
          if (analysis.averageUtilization > 90) {
            analysis.constraints.push({
              type: 'capacity_overload',
              description: `Machine utilization at ${analysis.averageUtilization.toFixed(1)}%`,
              severity: 'critical'
            });
          }
        }
      }
      
      const result = {
        dateRange: { startDate: start, endDate: end },
        granularity,
        machineAnalysis: Array.from(capacityAnalysis.values()),
        summary: {
          totalMachines: capacityAnalysis.size,
          overloadedMachines: Array.from(capacityAnalysis.values()).filter(a => a.overloadedPeriods > 0).length,
          avgUtilization: Array.from(capacityAnalysis.values()).reduce((sum, a) => sum + a.averageUtilization, 0) / capacityAnalysis.size,
          criticalConstraints: Array.from(capacityAnalysis.values()).flatMap(a => a.constraints).filter(c => c.severity === 'critical').length
        }
      };
      
      res.json(result);
    } catch (error) {
      console.error('Capacity buckets analysis error:', error);
      res.status(500).json({ error: "Failed to analyze capacity buckets" });
    }
  });

  // Capacity Preview - Preview capacity impact of scheduling new work orders
  app.post("/api/capacity/preview", async (req, res) => {
    try {
      const { workOrderIds, schedulingPolicy, dateRange } = req.body;
      
      if (!workOrderIds || !Array.isArray(workOrderIds)) {
        return res.status(400).json({ error: "workOrderIds array is required" });
      }
      
      // Get work orders and their operations
      const workOrders = [];
      const operations = [];
      
      for (const workOrderId of workOrderIds) {
        const workOrder = await storage.getWorkOrder(workOrderId);
        if (workOrder) {
          workOrders.push(workOrder);
          const workOrderOps = await storage.getOperationsByWorkOrder(workOrderId);
          operations.push(...workOrderOps);
        }
      }
      
      if (operations.length === 0) {
        return res.status(400).json({ error: "No operations found for specified work orders" });
      }
      
      // Get current capacity state
      const machines = await storage.getAllMachines();
      const capabilities = await storage.getAllMachineCapabilities();
      const setupMatrix = await storage.getAllSetupMatrix();
      const defaultCalendar = await storage.getDefaultCalendar();
      
      if (!defaultCalendar) {
        return res.status(500).json({ error: "No default calendar found" });
      }
      
      // Simulate capacity impact
      const capacityPreview = {
        workOrderIds,
        dateRange: dateRange || {
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        machineImpact: [],
        resourceConstraints: [],
        schedulingConflicts: [],
        recommendations: []
      };
      
      // Analyze each machine's capacity impact
      for (const machine of machines) {
        const machineOps = operations.filter(op => 
          op.assignedMachineId === machine.id || 
          (op.machineTypes as string[])?.includes(machine.type)
        );
        
        if (machineOps.length === 0) continue;
        
        const totalSetupTime = machineOps.reduce((sum, op) => sum + (op.setupTimeMinutes || 0), 0);
        const totalRunTime = machineOps.reduce((sum, op) => 
          sum + ((op.runTimeMinutesPerUnit || 0) * (op.batchSize || 1)), 0);
        const totalDemand = totalSetupTime + totalRunTime;
        
        // Get current capacity buckets for this machine
        const startDate = new Date(capacityPreview.dateRange.startDate);
        const endDate = new Date(capacityPreview.dateRange.endDate);
        const buckets = await storage.getCapacityBuckets(machine.id, startDate, endDate);
        
        const totalAvailable = buckets.reduce((sum, bucket) => sum + bucket.availableMinutes, 0);
        const currentPlanned = buckets.reduce((sum, bucket) => sum + (bucket.plannedMinutes || 0), 0);
        const remainingCapacity = totalAvailable - currentPlanned;
        
        const impact = {
          machineId: machine.id,
          machineName: machine.name,
          currentUtilization: totalAvailable > 0 ? (currentPlanned / totalAvailable) * 100 : 0,
          additionalDemand: totalDemand,
          projectedUtilization: totalAvailable > 0 ? ((currentPlanned + totalDemand) / totalAvailable) * 100 : 0,
          capacityShortfall: Math.max(0, totalDemand - remainingCapacity),
          operationsCount: machineOps.length,
          requiresOverload: totalDemand > remainingCapacity
        };
        
        (capacityPreview.machineImpact as any[]).push(impact);
        
        // Check for overload
        if (impact.requiresOverload) {
          (capacityPreview.schedulingConflicts as any[]).push({
            type: 'capacity_overload',
            severity: 'high',
            machineId: machine.id,
            description: `Machine ${machine.name} would be overloaded by ${impact.capacityShortfall} minutes`,
            affectedOperations: machineOps.map(op => op.id),
            suggestedResolution: `Consider distributing work to alternative machines or extending timeline`
          });
        }
        
        // Check resource constraints
        const requiredSkills = Array.from(new Set(machineOps.flatMap(op => op.requiredSkills as string[] || [])));
        for (const skillType of requiredSkills) {
          const availableOperators = await storage.getOperatorsBySkillType(skillType);
          if (availableOperators.length === 0) {
            (capacityPreview.resourceConstraints as any[]).push({
              type: 'operator_shortage',
              resourceType: 'skill',
              resourceId: skillType,
              description: `No operators available with skill: ${skillType}`,
              severity: 'critical',
              affectedOperations: machineOps.filter(op => 
                (op.requiredSkills as string[])?.includes(skillType)
              ).map(op => op.id)
            });
          }
        }
        
        // Generate recommendations
        if (impact.projectedUtilization > 95) {
          (capacityPreview.recommendations as any[]).push({
            type: 'capacity_optimization',
            priority: 'high',
            description: `Consider alternative machines for ${machine.name} to reduce overload`,
            suggestedActions: [
              'Evaluate machine substitution options',
              'Consider extending production timeline',
              'Split large operations across multiple machines'
            ]
          });
        }
      }
      
      // Calculate summary metrics
      const summary = {
        totalOperations: operations.length,
        machinesAffected: capacityPreview.machineImpact.length,
        criticalConstraints: (capacityPreview.resourceConstraints as any[]).filter((c: any) => c.severity === 'critical').length,
        overloadedMachines: (capacityPreview.machineImpact as any[]).filter((m: any) => m.requiresOverload).length,
        feasibilityScore: Math.max(0, 100 - (capacityPreview.schedulingConflicts.length * 20))
      };
      
      res.json({ ...capacityPreview, summary });
    } catch (error) {
      console.error('Capacity preview error:', error);
      res.status(500).json({ error: "Failed to generate capacity preview" });
    }
  });

  // Scenario Simulation - Run comprehensive what-if analysis
  app.post("/api/scenarios/:id/simulate", async (req, res) => {
    try {
      const scenarioId = req.params.id;
      const scenario = await storage.getScenario(scenarioId);
      
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      
      // Mark scenario as running
      await storage.updateScenario(scenarioId, { status: 'running', lastRunAt: new Date() });
      
      const simulationStart = Date.now();
      
      // Extract scenario parameters
      const { 
        machineOverrides = {},
        calendarOverrides = {},
        workOrderScope = [],
        additionalConstraints = []
      } = scenario.parameters as any;
      
      // Get baseline data
      const workOrders = workOrderScope.length > 0 
        ? await Promise.all(workOrderScope.map((id: string) => storage.getWorkOrder(id)))
        : await storage.getAllWorkOrders();
      
      const machines = await storage.getAllMachines();
      const operations = await storage.getAllOperations();
      const capabilities = await storage.getAllMachineCapabilities();
      const setupMatrix = await storage.getAllSetupMatrix();
      const defaultCalendar = await storage.getDefaultCalendar();
      
      if (!defaultCalendar) {
        return res.status(500).json({ error: "No default calendar found for simulation" });
      }
      
      // Apply overrides to machines (efficiency, capacity, etc.)
      const modifiedMachines = machines.map(machine => {
        const override = machineOverrides[machine.id];
        return override ? { ...machine, ...override } : machine;
      });
      
      // Apply calendar overrides (shift changes, maintenance windows)
      const modifiedCalendar = calendarOverrides.shifts 
        ? { ...defaultCalendar, shifts: calendarOverrides.shifts }
        : defaultCalendar;
      
      // Run simulation with different scenarios
      const simulationResults = {
        scenarioId,
        baselineMetrics: {},
        scenarioMetrics: {},
        comparison: {},
        bottleneckAnalysis: {},
        resourceUtilization: {},
        recommendedActions: []
      };
      
      // Calculate baseline metrics (current state)
      const baselineSchedule = await storage.scheduleProduction('baseline', {
        rule: 'EDD',
        horizon: 168,
        allowOverload: false,
        maxOverloadPercentage: 10
      });
      
      // Calculate scenario metrics with overrides
      // This would involve complex scheduling simulation logic
      const scenarioMetrics = {
        totalMakespan: 0,
        averageUtilization: 0,
        resourceConstraints: 0,
        setupTimeReduction: 0,
        throughputImprovement: 0
      };
      
      // Identify bottlenecks in the scenario
      const bottlenecks = [];
      for (const machine of modifiedMachines) {
        const machineOps = operations.filter(op => op.assignedMachineId === machine.id);
        const totalTime = machineOps.reduce((sum, op) => 
          sum + (op.setupTimeMinutes || 0) + ((op.runTimeMinutesPerUnit || 0) * (op.batchSize || 1)), 0);
        
        if (totalTime > 0) {
          bottlenecks.push({
            machineId: machine.id,
            machineName: machine.name,
            utilization: Math.min(100, (totalTime / (8 * 60)) * 100), // Assuming 8-hour shifts
            criticalPath: totalTime > 8 * 60,
            recommendedActions: totalTime > 8 * 60 
              ? ['Consider parallel processing', 'Optimize setup times', 'Add capacity']
              : []
          });
        }
      }
      
      simulationResults.bottleneckAnalysis = {
        identifiedBottlenecks: bottlenecks.filter(b => b.criticalPath),
        utilizationProfile: bottlenecks,
        criticalMachines: bottlenecks.filter(b => b.utilization > 90).map(b => b.machineId)
      };
      
      // Generate recommendations based on simulation
      if (bottlenecks.some(b => b.criticalPath)) {
        (simulationResults.recommendedActions as any[]).push({
          category: 'bottleneck_resolution',
          priority: 'high',
          description: 'Address critical bottlenecks to improve overall throughput',
          specificActions: [
            'Implement parallel processing where possible',
            'Invest in setup time reduction initiatives',
            'Consider additional capacity for bottleneck operations'
          ]
        });
      }
      
      // Calculate runtime and update scenario
      const runtime = Math.floor((Date.now() - simulationStart) / 1000);
      
      const updatedScenario = await storage.updateScenario(scenarioId, {
        status: 'completed',
        results: simulationResults,
        runtime,
        metrics: {
          makespan: scenarioMetrics.totalMakespan,
          utilization: scenarioMetrics.averageUtilization,
          throughput: scenarioMetrics.throughputImprovement,
          bottlenecks: (simulationResults.bottleneckAnalysis as any)?.identifiedBottlenecks?.length || 0
        }
      });
      
      res.json({
        scenario: updatedScenario,
        simulationResults,
        executionTime: runtime
      });
      
    } catch (error) {
      console.error('Scenario simulation error:', error);
      // Mark scenario as failed
      await storage.updateScenario(req.params.id, { 
        status: 'draft',
        results: { error: error instanceof Error ? error.message : 'Simulation failed' }
      });
      res.status(500).json({ error: "Failed to simulate scenario" });
    }
  });

  // Gantt Chart Scheduling endpoints
  app.get("/api/schedule", async (req, res) => {
    try {
      const { start, end, machineId } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ error: "start and end date parameters are required" });
      }

      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      const machineIds = machineId ? (Array.isArray(machineId) ? machineId as string[] : [machineId as string]) : undefined;

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      const scheduleSlots = await storage.getScheduleSlotsByDateRange(startDate, endDate, machineIds);
      res.json(scheduleSlots);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  app.patch("/api/schedule/slots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate update data with partial schema (only require changed fields)
      const partialSchema = insertScheduleSlotSchema.partial();
      const validation = partialSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid schedule slot update data", 
          details: validation.error.format()
        });
      }
      
      const updates = validation.data;

      // Get existing slot to check if it's locked
      const existingSlot = await storage.getScheduleSlot(id);
      if (!existingSlot) {
        return res.status(404).json({ error: "Schedule slot not found" });
      }

      if (existingSlot.locked) {
        return res.status(409).json({ error: "Cannot modify locked schedule slot" });
      }

      const updatedSlot = await storage.updateScheduleSlot(id, updates);
      if (!updatedSlot) {
        return res.status(404).json({ error: "Schedule slot not found" });
      }

      // Validate for conflicts
      const conflicts = await storage.validateScheduleSlots([updatedSlot]);

      res.json({ slot: updatedSlot, conflicts });
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error updating schedule slot:', error);
      res.status(500).json({ error: "Failed to update schedule slot" });
    }
  });

  app.post("/api/schedule/validate", async (req, res) => {
    try {
      const { slots } = req.body;

      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: "slots must be an array" });
      }

      const conflicts = await storage.validateScheduleSlots(slots);
      res.json(conflicts);
    } catch (error) {
      console.error('Error validating schedule:', error);
      res.status(500).json({ error: "Failed to validate schedule" });
    }
  });

  app.post("/api/schedule/bulk-update", async (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "updates must be an array" });
      }

      // Validate each update using Zod schema
      const partialSchema = insertScheduleSlotSchema.partial();
      const validatedUpdates = [];
      
      for (const update of updates) {
        if (!update.id || typeof update.id !== 'string') {
          return res.status(400).json({ error: "Each update must have a valid id property" });
        }
        
        if (!update.updates || typeof update.updates !== 'object') {
          return res.status(400).json({ error: "Each update must have an updates property" });
        }
        
        const validation = partialSchema.safeParse(update.updates);
        if (!validation.success) {
          return res.status(400).json({ 
            error: `Invalid update data for slot ${update.id}`, 
            details: validation.error.format()
          });
        }
        
        validatedUpdates.push({
          id: update.id,
          updates: validation.data
        });
      }

      // Check for locked slots
      const lockedSlots = [];
      for (const update of updates) {
        const existingSlot = await storage.getScheduleSlot(update.id);
        if (existingSlot && existingSlot.locked) {
          lockedSlots.push(update.id);
        }
      }

      if (lockedSlots.length > 0) {
        return res.status(409).json({ 
          error: "Cannot modify locked schedule slots", 
          lockedSlots 
        });
      }

      const result = await storage.bulkUpdateScheduleSlots(validatedUpdates);
      res.json(result);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error bulk updating schedule slots:', error);
      res.status(500).json({ error: "Failed to bulk update schedule slots" });
    }
  });

  app.get("/api/schedule/conflicts/:planId", async (req, res) => {
    try {
      const { planId } = req.params;
      const slots = await storage.getScheduleSlotsByPlan(planId);
      const conflicts = await storage.validateScheduleSlots(slots);
      res.json(conflicts);
    } catch (error) {
      console.error('Error getting schedule conflicts:', error);
      res.status(500).json({ error: "Failed to get schedule conflicts" });
    }
  });

  // Data Entry Module API Routes

  // Shift Reports endpoints
  app.get("/api/data-entry/shifts", async (req, res) => {
    try {
      const shifts = await storage.getAllShiftReports();
      res.json(shifts);
    } catch (error) {
      console.error('Error fetching shift reports:', error);
      res.status(500).json({ error: "Failed to fetch shift reports" });
    }
  });

  app.get("/api/data-entry/shifts/active", async (req, res) => {
    try {
      const shifts = await storage.getActiveShiftReports();
      res.json(shifts);
    } catch (error) {
      console.error('Error fetching active shift reports:', error);
      res.status(500).json({ error: "Failed to fetch active shift reports" });
    }
  });

  app.get("/api/data-entry/shifts/:id", async (req, res) => {
    try {
      const shift = await storage.getShiftReport(req.params.id);
      if (!shift) {
        return res.status(404).json({ error: "Shift report not found" });
      }
      res.json(shift);
    } catch (error) {
      console.error('Error fetching shift report:', error);
      res.status(500).json({ error: "Failed to fetch shift report" });
    }
  });

  app.post("/api/data-entry/shifts", async (req, res) => {
    try {
      const validation = insertShiftReportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid shift report data", details: validation.error });
      }
      
      const shift = await storage.createShiftReport(validation.data);
      res.status(201).json(shift);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error creating shift report:', error);
      res.status(500).json({ error: "Failed to create shift report" });
    }
  });

  app.patch("/api/data-entry/shifts/:id", async (req, res) => {
    try {
      const shift = await storage.updateShiftReport(req.params.id, req.body);
      if (!shift) {
        return res.status(404).json({ error: "Shift report not found" });
      }
      res.json(shift);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error updating shift report:', error);
      res.status(500).json({ error: "Failed to update shift report" });
    }
  });

  app.patch("/api/data-entry/shifts/:id/close", async (req, res) => {
    try {
      const { endTime } = req.body;
      if (!endTime) {
        return res.status(400).json({ error: "End time is required" });
      }
      
      const shift = await storage.closeShiftReport(req.params.id, new Date(endTime));
      if (!shift) {
        return res.status(404).json({ error: "Shift report not found" });
      }
      res.json(shift);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error closing shift report:', error);
      res.status(500).json({ error: "Failed to close shift report" });
    }
  });

  app.get("/api/data-entry/shifts/:id/summary", async (req, res) => {
    try {
      const summary = await storage.getShiftSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching shift summary:', error);
      res.status(500).json({ error: "Failed to fetch shift summary" });
    }
  });

  // Operator Sessions endpoints
  app.get("/api/data-entry/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllOperatorSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching operator sessions:', error);
      res.status(500).json({ error: "Failed to fetch operator sessions" });
    }
  });

  app.get("/api/data-entry/sessions/active", async (req, res) => {
    try {
      const sessions = await storage.getActiveOperatorSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching active operator sessions:', error);
      res.status(500).json({ error: "Failed to fetch active operator sessions" });
    }
  });

  app.get("/api/data-entry/sessions/:id", async (req, res) => {
    try {
      const session = await storage.getOperatorSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Operator session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error('Error fetching operator session:', error);
      res.status(500).json({ error: "Failed to fetch operator session" });
    }
  });

  app.post("/api/data-entry/sessions", async (req, res) => {
    try {
      const validation = insertOperatorSessionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid operator session data", details: validation.error });
      }
      
      // Validate assignment
      const isValidAssignment = await storage.validateOperatorSession(
        validation.data.operatorId, 
        validation.data.machineId, 
        validation.data.workOrderId
      );
      
      if (!isValidAssignment) {
        return res.status(409).json({ error: "Invalid operator session assignment - conflicts detected" });
      }
      
      const session = await storage.createOperatorSession(validation.data);
      res.status(201).json(session);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error creating operator session:', error);
      res.status(500).json({ error: "Failed to create operator session" });
    }
  });

  app.patch("/api/data-entry/sessions/:id", async (req, res) => {
    try {
      const session = await storage.updateOperatorSession(req.params.id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Operator session not found" });
      }
      res.json(session);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error updating operator session:', error);
      res.status(500).json({ error: "Failed to update operator session" });
    }
  });

  app.patch("/api/data-entry/sessions/:id/end", async (req, res) => {
    try {
      const { endTime } = req.body;
      const session = await storage.endOperatorSession(req.params.id, new Date(endTime || new Date()));
      if (!session) {
        return res.status(404).json({ error: "Operator session not found" });
      }
      res.json(session);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error ending operator session:', error);
      res.status(500).json({ error: "Failed to end operator session" });
    }
  });

  // Production logs with enhanced validation
  app.post("/api/data-entry/production", async (req, res) => {
    try {
      const validation = insertProductionLogSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid production log data", details: validation.error });
      }
      
      // Validate quantity doesn't exceed work order limits
      const quantityValidation = await storage.validateProductionQuantity(
        validation.data.workOrderId,
        validation.data.quantityProduced
      );
      
      if (!quantityValidation.isValid) {
        return res.status(409).json({ 
          error: "Production quantity exceeds work order remaining quantity",
          remainingQuantity: quantityValidation.remainingQuantity
        });
      }
      
      const log = await storage.createProductionLog(validation.data);
      res.status(201).json(log);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error creating production log:', error);
      res.status(500).json({ error: "Failed to create production log" });
    }
  });

  // Reason Codes endpoints
  app.get("/api/data-entry/reason-codes", async (req, res) => {
    try {
      const reasonCodes = await storage.getAllReasonCodes();
      res.json(reasonCodes);
    } catch (error) {
      console.error('Error fetching reason codes:', error);
      res.status(500).json({ error: "Failed to fetch reason codes" });
    }
  });

  app.get("/api/data-entry/reason-codes/active", async (req, res) => {
    try {
      const reasonCodes = await storage.getActiveReasonCodes();
      res.json(reasonCodes);
    } catch (error) {
      console.error('Error fetching active reason codes:', error);
      res.status(500).json({ error: "Failed to fetch active reason codes" });
    }
  });

  app.get("/api/data-entry/reason-codes/category/:category", async (req, res) => {
    try {
      const reasonCodes = await storage.getReasonCodesByCategory(req.params.category);
      res.json(reasonCodes);
    } catch (error) {
      console.error('Error fetching reason codes by category:', error);
      res.status(500).json({ error: "Failed to fetch reason codes by category" });
    }
  });

  app.post("/api/data-entry/reason-codes", async (req, res) => {
    try {
      const validation = insertReasonCodeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid reason code data", details: validation.error });
      }
      
      const reasonCode = await storage.createReasonCode(validation.data);
      res.status(201).json(reasonCode);
    } catch (error) {
      console.error('Error creating reason code:', error);
      res.status(500).json({ error: "Failed to create reason code" });
    }
  });

  app.patch("/api/data-entry/reason-codes/:id", async (req, res) => {
    try {
      const reasonCode = await storage.updateReasonCode(req.params.id, req.body);
      if (!reasonCode) {
        return res.status(404).json({ error: "Reason code not found" });
      }
      res.json(reasonCode);
    } catch (error) {
      console.error('Error updating reason code:', error);
      res.status(500).json({ error: "Failed to update reason code" });
    }
  });

  app.delete("/api/data-entry/reason-codes/:id", async (req, res) => {
    try {
      await storage.deleteReasonCode(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting reason code:', error);
      res.status(500).json({ error: "Failed to delete reason code" });
    }
  });

  // Scrap Logs endpoints
  app.get("/api/data-entry/scrap", async (req, res) => {
    try {
      const scrapLogs = await storage.getAllScrapLogs();
      res.json(scrapLogs);
    } catch (error) {
      console.error('Error fetching scrap logs:', error);
      res.status(500).json({ error: "Failed to fetch scrap logs" });
    }
  });

  app.get("/api/data-entry/scrap/work-order/:workOrderId", async (req, res) => {
    try {
      const scrapLogs = await storage.getScrapLogsByWorkOrder(req.params.workOrderId);
      res.json(scrapLogs);
    } catch (error) {
      console.error('Error fetching scrap logs by work order:', error);
      res.status(500).json({ error: "Failed to fetch scrap logs by work order" });
    }
  });

  app.post("/api/data-entry/scrap", async (req, res) => {
    try {
      const validation = insertScrapLogSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scrap log data", details: validation.error });
      }
      
      const scrapLog = await storage.createScrapLog(validation.data);
      res.status(201).json(scrapLog);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error creating scrap log:', error);
      res.status(500).json({ error: "Failed to create scrap log" });
    }
  });

  app.patch("/api/data-entry/scrap/:id/verify", async (req, res) => {
    try {
      const { verifiedBy } = req.body;
      if (!verifiedBy) {
        return res.status(400).json({ error: "verifiedBy is required" });
      }
      
      const scrapLog = await storage.verifyScrapLog(req.params.id, verifiedBy);
      if (!scrapLog) {
        return res.status(404).json({ error: "Scrap log not found" });
      }
      res.json(scrapLog);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      console.error('Error verifying scrap log:', error);
      res.status(500).json({ error: "Failed to verify scrap log" });
    }
  });

  // Data Entry validation utilities
  app.post("/api/data-entry/validate/work-order-assignment", async (req, res) => {
    try {
      const { workOrderId, machineId } = req.body;
      if (!workOrderId || !machineId) {
        return res.status(400).json({ error: "workOrderId and machineId are required" });
      }
      
      const isValid = await storage.validateWorkOrderAssignment(workOrderId, machineId);
      res.json({ isValid });
    } catch (error) {
      console.error('Error validating work order assignment:', error);
      res.status(500).json({ error: "Failed to validate work order assignment" });
    }
  });

  app.post("/api/data-entry/validate/operator-session", async (req, res) => {
    try {
      const { operatorId, machineId, workOrderId } = req.body;
      if (!operatorId || !machineId || !workOrderId) {
        return res.status(400).json({ error: "operatorId, machineId, and workOrderId are required" });
      }
      
      const isValid = await storage.validateOperatorSession(operatorId, machineId, workOrderId);
      res.json({ isValid });
    } catch (error) {
      console.error('Error validating operator session:', error);
      res.status(500).json({ error: "Failed to validate operator session" });
    }
  });

  app.post("/api/data-entry/validate/production-quantity", async (req, res) => {
    try {
      const { workOrderId, quantityToAdd } = req.body;
      if (!workOrderId || quantityToAdd === undefined) {
        return res.status(400).json({ error: "workOrderId and quantityToAdd are required" });
      }
      
      const validation = await storage.validateProductionQuantity(workOrderId, quantityToAdd);
      res.json(validation);
    } catch (error) {
      console.error('Error validating production quantity:', error);
      res.status(500).json({ error: "Failed to validate production quantity" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/kpis", async (req, res) => {
    try {
      const validation = analyticsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: validation.error });
      }

      const { from, to, machineId, workOrderId, granularity } = validation.data;
      const period = { from, to };

      // Get all required data including scheduleSlots and operatorSessions
      const [machines, workOrders, productionLogs, downtimeEvents, qualityRecords, scheduleSlots, operatorSessions] = await Promise.all([
        storage.getAllMachines(),
        storage.getAllWorkOrders(),
        storage.getAllProductionLogs(),
        storage.getAllDowntimeEvents(),
        storage.getAllQualityRecords(),
        storage.getAllScheduleSlots(),
        storage.getAllOperatorSessions()
      ]);

      // Filter data if specific filters are provided
      const filteredMachines = machineId ? machines.filter(m => m.id === machineId) : machines;
      const filteredWorkOrders = workOrderId ? workOrders.filter(wo => wo.id === workOrderId) : workOrders;

      const kpis = AnalyticsEngine.calculateAnalyticsKPIs(
        filteredMachines,
        filteredWorkOrders,
        productionLogs,
        downtimeEvents,
        qualityRecords,
        scheduleSlots,
        operatorSessions,
        period
      );

      res.json(kpis);
    } catch (error) {
      console.error('Error calculating analytics KPIs:', error);
      res.status(500).json({ error: "Failed to calculate analytics KPIs" });
    }
  });

  app.get("/api/analytics/oee", async (req, res) => {
    try {
      const validation = analyticsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: validation.error });
      }

      const { from, to, machineId } = validation.data;
      const period = { from, to };

      const [machines, productionLogs, downtimeEvents, qualityRecords, scheduleSlots] = await Promise.all([
        storage.getAllMachines(),
        storage.getAllProductionLogs(),
        storage.getAllDowntimeEvents(),
        storage.getAllQualityRecords(),
        storage.getAllScheduleSlots()
      ]);

      const targetMachines = machineId ? machines.filter(m => m.id === machineId) : machines;

      const oeeData = targetMachines.map(machine => 
        AnalyticsEngine.calculateOEE(
          machine,
          productionLogs.filter(log => log.machineId === machine.id),
          downtimeEvents.filter(event => event.machineId === machine.id),
          qualityRecords.filter(record => record.machineId === machine.id),
          scheduleSlots.filter(slot => slot.machineId === machine.id),
          period
        )
      );

      res.json(oeeData);
    } catch (error) {
      console.error('Error calculating OEE:', error);
      res.status(500).json({ error: "Failed to calculate OEE" });
    }
  });

  app.get("/api/analytics/adherence", async (req, res) => {
    try {
      const validation = analyticsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: validation.error });
      }

      const { from, to, machineId } = validation.data;
      const period = { from, to };

      const [workOrders, scheduleSlots] = await Promise.all([
        storage.getAllWorkOrders(),
        storage.getAllScheduleSlots()
      ]);

      const filteredWorkOrders = machineId 
        ? workOrders.filter(wo => wo.assignedMachineId === machineId)
        : workOrders;

      const adherenceData = AnalyticsEngine.calculateScheduleAdherence(
        filteredWorkOrders,
        scheduleSlots,
        period
      );

      res.json(adherenceData);
    } catch (error) {
      console.error('Error calculating schedule adherence:', error);
      res.status(500).json({ error: "Failed to calculate schedule adherence" });
    }
  });

  app.get("/api/analytics/utilization", async (req, res) => {
    try {
      const validation = analyticsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: validation.error });
      }

      const { from, to, machineId } = validation.data;
      const period = { from, to };

      const [machines, productionLogs, downtimeEvents, operatorSessions] = await Promise.all([
        storage.getAllMachines(),
        storage.getAllProductionLogs(),
        storage.getAllDowntimeEvents(),
        storage.getAllOperatorSessions()
      ]);

      const targetMachines = machineId ? machines.filter(m => m.id === machineId) : machines;

      const utilizationData = AnalyticsEngine.calculateUtilizationMetrics(
        targetMachines,
        productionLogs,
        downtimeEvents,
        operatorSessions,
        period
      );

      res.json(utilizationData);
    } catch (error) {
      console.error('Error calculating utilization metrics:', error);
      res.status(500).json({ error: "Failed to calculate utilization metrics" });
    }
  });

  app.get("/api/analytics/quality", async (req, res) => {
    try {
      const validation = analyticsQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: validation.error });
      }

      const { from, to, workOrderId } = validation.data;
      const period = { from, to };

      const qualityRecords = await storage.getAllQualityRecords();
      const filteredRecords = workOrderId 
        ? qualityRecords.filter(qr => qr.workOrderId === workOrderId)
        : qualityRecords;

      const qualityData = AnalyticsEngine.calculateQualitySummary(filteredRecords, period);

      res.json(qualityData);
    } catch (error) {
      console.error('Error calculating quality metrics:', error);
      res.status(500).json({ error: "Failed to calculate quality metrics" });
    }
  });

  app.get("/api/analytics/realtime-snapshots", async (req, res) => {
    try {
      const [machines, workOrders, productionLogs, downtimeEvents, qualityRecords] = await Promise.all([
        storage.getAllMachines(),
        storage.getAllWorkOrders(),
        storage.getAllProductionLogs(),
        storage.getAllDowntimeEvents(),
        storage.getAllQualityRecords()
      ]);

      const snapshots = AnalyticsEngine.getRealtimeMachineOEE(
        machines,
        productionLogs,
        downtimeEvents,
        qualityRecords,
        workOrders
      );

      res.json(snapshots);
    } catch (error) {
      console.error('Error getting real-time snapshots:', error);
      res.status(500).json({ error: "Failed to get real-time snapshots" });
    }
  });

  // Operations endpoints (missing CRUD operations)
  app.get("/api/operations", async (req, res) => {
    try {
      const operations = await storage.getAllOperations();
      res.json(operations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operations" });
    }
  });

  app.get("/api/operations/:id", async (req, res) => {
    try {
      const operation = await storage.getOperation(req.params.id);
      if (!operation) {
        return res.status(404).json({ error: "Operation not found" });
      }
      res.json(operation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operation" });
    }
  });

  app.get("/api/operations/work-order/:workOrderId", async (req, res) => {
    try {
      const operations = await storage.getOperationsByWorkOrder(req.params.workOrderId);
      res.json(operations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch operations for work order" });
    }
  });

  app.post("/api/operations", async (req, res) => {
    try {
      const validation = insertOperationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid operation data", details: validation.error });
      }
      
      const operation = await storage.createOperation(validation.data);
      res.status(201).json(operation);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create operation" });
    }
  });

  app.patch("/api/operations/:id", async (req, res) => {
    try {
      const operation = await storage.updateOperation?.(req.params.id, req.body);
      if (!operation) {
        return res.status(404).json({ error: "Operation not found" });
      }
      res.json(operation);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update operation" });
    }
  });

  app.delete("/api/operations/:id", async (req, res) => {
    try {
      await storage.deleteOperation?.(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete operation" });
    }
  });

  // Additional Schedule Slots endpoints
  app.get("/api/schedule/slots", async (req, res) => {
    try {
      const slots = await storage.getAllScheduleSlots();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule slots" });
    }
  });

  app.get("/api/schedule/slots/:id", async (req, res) => {
    try {
      const slot = await storage.getScheduleSlot(req.params.id);
      if (!slot) {
        return res.status(404).json({ error: "Schedule slot not found" });
      }
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule slot" });
    }
  });

  app.get("/api/schedule/slots/by-plan/:planId", async (req, res) => {
    try {
      const slots = await storage.getScheduleSlotsByPlan(req.params.planId);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch schedule slots for plan" });
    }
  });

  app.post("/api/schedule/slots", async (req, res) => {
    try {
      const validation = insertScheduleSlotSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid schedule slot data", details: validation.error });
      }
      
      const slot = await storage.createScheduleSlot(validation.data);
      res.status(201).json(slot);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create schedule slot" });
    }
  });

  app.delete("/api/schedule/slots/:id", async (req, res) => {
    try {
      await storage.deleteScheduleSlot?.(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule slot" });
    }
  });

  // Production Logs endpoints (missing update/delete)
  app.get("/api/production-logs", async (req, res) => {
    try {
      const logs = await storage.getAllProductionLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production logs" });
    }
  });

  app.get("/api/production-logs/:id", async (req, res) => {
    try {
      const log = await storage.getProductionLog?.(req.params.id);
      if (!log) {
        return res.status(404).json({ error: "Production log not found" });
      }
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production log" });
    }
  });

  app.get("/api/production-logs/machine/:machineId", async (req, res) => {
    try {
      const logs = await storage.getProductionLogsByMachine(req.params.machineId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch production logs for machine" });
    }
  });

  app.post("/api/production-logs", async (req, res) => {
    try {
      const validation = insertProductionLogSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid production log data", details: validation.error });
      }
      
      const log = await storage.createProductionLog(validation.data);
      
      // Cross-module side-effects: update work order completed quantity and machine runtime
      if (log.workOrderId && log.quantityProduced) {
        const workOrder = await storage.getWorkOrder(log.workOrderId);
        if (workOrder) {
          const newCompletedQuantity = (workOrder.completedQuantity || 0) + log.quantityProduced;
          await storage.updateWorkOrder(log.workOrderId, { completedQuantity: newCompletedQuantity });
          
          // Update work order status if completed
          if (newCompletedQuantity >= workOrder.quantity) {
            await storage.updateWorkOrder(log.workOrderId, { status: "completed", actualEndDate: new Date() });
          }
        }
      }
      
      // Update machine runtime
      if (log.machineId && log.cycleTime) {
        const machine = await storage.getMachine(log.machineId);
        if (machine) {
          const newRuntime = (machine.totalRuntime || 0) + log.cycleTime;
          await storage.updateMachine(log.machineId, { totalRuntime: newRuntime });
        }
      }
      
      res.status(201).json(log);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create production log" });
    }
  });

  app.patch("/api/production-logs/:id", async (req, res) => {
    try {
      const log = await storage.updateProductionLog?.(req.params.id, req.body);
      if (!log) {
        return res.status(404).json({ error: "Production log not found" });
      }
      res.json(log);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update production log" });
    }
  });

  app.delete("/api/production-logs/:id", async (req, res) => {
    try {
      await storage.deleteProductionLog?.(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete production log" });
    }
  });

  // Downtime Events endpoints (missing update/delete)
  app.get("/api/downtime-events", async (req, res) => {
    try {
      const events = await storage.getAllDowntimeEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch downtime events" });
    }
  });

  app.get("/api/downtime-events/:id", async (req, res) => {
    try {
      const event = await storage.getDowntimeEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Downtime event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch downtime event" });
    }
  });

  app.get("/api/downtime-events/active", async (req, res) => {
    try {
      const events = await storage.getActiveDowntimeEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active downtime events" });
    }
  });

  app.post("/api/downtime-events", async (req, res) => {
    try {
      const validation = insertDowntimeEventSchema.safeParse?.(req.body);
      if (!validation?.success) {
        return res.status(400).json({ error: "Invalid downtime event data" });
      }
      
      const event = await storage.createDowntimeEvent(validation.data);
      
      // Cross-module side-effects: update machine status if downtime starts
      if (event.machineId && !event.endTime) {
        await storage.updateMachine(event.machineId, { status: "maintenance" });
        
        // Create alert for unplanned downtime
        if (event.reason.toLowerCase().includes('breakdown') || event.reason.toLowerCase().includes('failure')) {
          await storage.createAlert({
            type: "breakdown",
            severity: "high",
            title: `Unplanned Downtime: ${event.reason}`,
            message: `Machine ${event.machineId} is experiencing unplanned downtime: ${event.reason}`,
            source: "downtime_tracking",
            sourceId: event.machineId,
            isRead: false
          });
        }
      }
      
      res.status(201).json(event);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create downtime event" });
    }
  });

  app.patch("/api/downtime-events/:id", async (req, res) => {
    try {
      const existingEvent = await storage.getDowntimeEvent(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ error: "Downtime event not found" });
      }
      
      const event = await storage.updateDowntimeEvent?.(req.params.id, req.body);
      
      // Cross-module side-effects: update machine status if downtime ends
      if (event && req.body.endTime && !existingEvent.endTime) {
        await storage.updateMachine(event.machineId, { status: "idle" });
      }
      
      res.json(event);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update downtime event" });
    }
  });

  app.delete("/api/downtime-events/:id", async (req, res) => {
    try {
      await storage.deleteDowntimeEvent?.(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete downtime event" });
    }
  });

  // Machine Capabilities endpoints (missing POST, PATCH, DELETE)
  app.get("/api/machine-capabilities", async (req, res) => {
    try {
      const capabilities = await storage.getAllMachineCapabilities();
      res.json(capabilities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch machine capabilities" });
    }
  });

  app.get("/api/machine-capabilities/:id", async (req, res) => {
    try {
      const capability = await storage.getMachineCapability?.(req.params.id);
      if (!capability) {
        return res.status(404).json({ error: "Machine capability not found" });
      }
      res.json(capability);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch machine capability" });
    }
  });

  app.get("/api/machine-capabilities/machine/:machineId", async (req, res) => {
    try {
      const capabilities = await storage.getMachineCapabilitiesByMachine?.(req.params.machineId);
      res.json(capabilities || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch machine capabilities" });
    }
  });

  app.post("/api/machine-capabilities", async (req, res) => {
    try {
      const validation = insertMachineCapabilitySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid machine capability data", details: validation.error });
      }
      
      const capability = await storage.createMachineCapability?.(validation.data);
      res.status(201).json(capability);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create machine capability" });
    }
  });

  app.patch("/api/machine-capabilities/:id", async (req, res) => {
    try {
      const capability = await storage.updateMachineCapability?.(req.params.id, req.body);
      if (!capability) {
        return res.status(404).json({ error: "Machine capability not found" });
      }
      res.json(capability);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update machine capability" });
    }
  });

  app.delete("/api/machine-capabilities/:id", async (req, res) => {
    try {
      await storage.deleteMachineCapability?.(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete machine capability" });
    }
  });

  // Calendars endpoints (missing all CRUD operations)
  app.get("/api/calendars", async (req, res) => {
    try {
      const calendars = await storage.getAllCalendars?.()||[];
      res.json(calendars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendars" });
    }
  });

  app.get("/api/calendars/:id", async (req, res) => {
    try {
      const calendar = await storage.getCalendar?.(req.params.id);
      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      res.json(calendar);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  app.get("/api/calendars/default", async (req, res) => {
    try {
      const calendar = await storage.getDefaultCalendar();
      if (!calendar) {
        return res.status(404).json({ error: "Default calendar not found" });
      }
      res.json(calendar);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default calendar" });
    }
  });

  app.post("/api/calendars", async (req, res) => {
    try {
      const validation = insertCalendarSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid calendar data", details: validation.error });
      }
      
      const calendar = await storage.createCalendar?.(validation.data);
      res.status(201).json(calendar);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create calendar" });
    }
  });

  app.patch("/api/calendars/:id", async (req, res) => {
    try {
      const calendar = await storage.updateCalendar?.(req.params.id, req.body);
      if (!calendar) {
        return res.status(404).json({ error: "Calendar not found" });
      }
      res.json(calendar);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update calendar" });
    }
  });

  app.delete("/api/calendars/:id", async (req, res) => {
    try {
      await storage.deleteCalendar?.(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete calendar" });
    }
  });

  // Setup Matrix endpoints (missing all CRUD operations)
  app.get("/api/setup-matrix", async (req, res) => {
    try {
      const matrix = await storage.getAllSetupMatrix();
      res.json(matrix);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setup matrix" });
    }
  });

  app.get("/api/setup-matrix/:fromType/:toType", async (req, res) => {
    try {
      const entry = await storage.getSetupMatrixEntry?.(req.params.fromType, req.params.toType);
      if (!entry) {
        return res.status(404).json({ error: "Setup matrix entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setup matrix entry" });
    }
  });

  app.get("/api/setup-matrix/machine/:machineId", async (req, res) => {
    try {
      const entries = await storage.getSetupMatrixByMachine?.(req.params.machineId);
      res.json(entries || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch setup matrix for machine" });
    }
  });

  app.post("/api/setup-matrix", async (req, res) => {
    try {
      const validation = insertSetupMatrixSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid setup matrix data", details: validation.error });
      }
      
      const entry = await storage.createSetupMatrixEntry?.(validation.data);
      res.status(201).json(entry);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create setup matrix entry" });
    }
  });

  app.patch("/api/setup-matrix/:id", async (req, res) => {
    try {
      const entry = await storage.updateSetupMatrixEntry?.(req.params.id, req.body);
      if (!entry) {
        return res.status(404).json({ error: "Setup matrix entry not found" });
      }
      res.json(entry);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to update setup matrix entry" });
    }
  });

  app.delete("/api/setup-matrix/:id", async (req, res) => {
    try {
      await storage.deleteSetupMatrixEntry?.(req.params.id);
      res.status(204).send();
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete setup matrix entry" });
    }
  });

  // Inventory Transaction API endpoints (NEW - Phase 3)
  app.get("/api/inventory/transactions", async (req, res) => {
    try {
      const {
        itemId,
        itemType,
        adjustedBy,
        reason,
        startDate,
        endDate,
        limit,
        offset
      } = req.query;

      const filters: any = {};

      if (itemId) filters.itemId = itemId as string;
      if (itemType) filters.itemType = itemType as string;
      if (adjustedBy) filters.adjustedBy = adjustedBy as string;
      if (reason) filters.reason = reason as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      const transactions = await storage.getAllInventoryTransactions(filters);

      // Apply pagination if requested
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : 0;

      let paginatedTransactions = transactions;
      if (limitNum) {
        paginatedTransactions = transactions.slice(offsetNum, offsetNum + limitNum);
      }

      res.json({
        transactions: paginatedTransactions,
        total: transactions.length,
        limit: limitNum,
        offset: offsetNum
      });
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
      res.status(500).json({ error: "Failed to fetch inventory transactions" });
    }
  });

  app.get("/api/inventory/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getInventoryTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Inventory transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching inventory transaction:', error);
      res.status(500).json({ error: "Failed to fetch inventory transaction" });
    }
  });

  app.get("/api/inventory/:itemType/:id/transactions", async (req, res) => {
    try {
      const { itemType, id } = req.params;
      const { limit, offset } = req.query;

      // Validate itemType
      const validTypes = ['raw_materials', 'inventory_tools', 'consumables', 'fasteners', 'general_items'];
      if (!validTypes.includes(itemType)) {
        return res.status(400).json({ error: "Invalid item type", validTypes });
      }

      // Map route parameter to database itemType
      const itemTypeMapping = {
        'raw_materials': 'materials',
        'inventory_tools': 'tools',
        'consumables': 'consumables',
        'fasteners': 'fasteners',
        'general_items': 'general-items'
      };
      const dbItemType = itemTypeMapping[itemType as keyof typeof itemTypeMapping];

      const transactions = await storage.getInventoryTransactionsByItem(id, dbItemType);

      // Apply pagination if requested
      const limitNum = limit ? parseInt(limit as string) : undefined;
      const offsetNum = offset ? parseInt(offset as string) : 0;

      let paginatedTransactions = transactions;
      if (limitNum) {
        paginatedTransactions = transactions.slice(offsetNum, offsetNum + limitNum);
      }

      res.json({
        transactions: paginatedTransactions,
        total: transactions.length,
        limit: limitNum,
        offset: offsetNum
      });
    } catch (error) {
      console.error('Error fetching transactions for item:', error);
      res.status(500).json({ error: "Failed to fetch transactions for item" });
    }
  });

  app.get("/api/inventory/transactions/summary", async (req, res) => {
    try {
      const {
        itemId,
        itemType,
        startDate,
        endDate,
        adjustedBy
      } = req.query;

      const filters: any = {};
      if (itemId) filters.itemId = itemId as string;
      if (itemType) filters.itemType = itemType as string;
      if (adjustedBy) filters.adjustedBy = adjustedBy as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      const transactions = await storage.getAllInventoryTransactions(filters);

      // Calculate summary statistics
      const summary: {
        totalTransactions: number;
        totalAdjustments: number;
        adjustmentsByReason: Record<string, number>;
        adjustmentsByUser: Record<string, number>;
        itemTypesAffected: Record<string, { count: number; totalAdjustment: number }>;
        dateRange: { from: any; to: any };
        mostRecentTransaction: any;
      } = {
        totalTransactions: transactions.length,
        totalAdjustments: transactions.reduce((sum, t) => sum + (t.adjustment || 0), 0),
        adjustmentsByReason: {},
        adjustmentsByUser: {},
        itemTypesAffected: {},
        dateRange: {
          from: startDate || null,
          to: endDate || null
        },
        mostRecentTransaction: transactions.length > 0 ?
          transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null
      };

      // Group by reason
      transactions.forEach(transaction => {
        const reason = transaction.reason || 'Unknown';
        summary.adjustmentsByReason[reason] = (summary.adjustmentsByReason[reason] || 0) + (transaction.adjustment || 0);
      });

      // Group by user
      transactions.forEach(transaction => {
        const user = transaction.adjustedBy || 'System';
        summary.adjustmentsByUser[user] = (summary.adjustmentsByUser[user] || 0) + (transaction.adjustment || 0);
      });

      // Count unique item types affected
      const uniqueItemTypes = Array.from(new Set(transactions.map(t => t.itemType)));
      uniqueItemTypes.forEach(itemType => {
        const typeTransactions = transactions.filter(t => t.itemType === itemType);
        summary.itemTypesAffected[itemType] = {
          count: typeTransactions.length,
          totalAdjustment: typeTransactions.reduce((sum, t) => sum + (t.adjustment || 0), 0)
        };
      });

      res.json(summary);
    } catch (error) {
      console.error('Error generating transaction summary:', error);
      res.status(500).json({ error: "Failed to generate transaction summary" });
    }
  });

  // CSV Export endpoint
  app.get("/api/inventory/transactions/export", async (req, res) => {
    try {
      const {
        itemId,
        itemType,
        adjustedBy,
        reason,
        startDate,
        endDate,
        format = 'csv'
      } = req.query;

      const filters: any = {};
      if (itemId) filters.itemId = itemId as string;
      if (itemType) filters.itemType = itemType as string;
      if (adjustedBy) filters.adjustedBy = adjustedBy as string;
      if (reason) filters.reason = reason as string;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;

      const transactions = await storage.getAllInventoryTransactions(filters);

      if (format === 'csv') {
        // Set CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory_transactions.csv"');

        // CSV header
        const csvHeader = 'ID,Timestamp,Item ID,Item Type,Adjustment,Previous Stock,New Stock,Reason,Adjusted By,Cost Impact,Notes\n';

        // CSV rows
        const csvRows = transactions.map(t =>
          `${t.id},${t.timestamp},${t.itemId},${t.itemType},${t.quantity || 0},${t.previousStock || 0},${t.newStock || 0},"${(t.reason || '').replace(/"/g, '""')}","${(t.adjustedBy || '').replace(/"/g, '""')}",${t.costImpact || 0},"${(t.notes || '').replace(/"/g, '""')}"`
        ).join('\n');

        res.write(csvHeader + csvRows);
        res.end();
      } else {
        return res.status(400).json({ error: "Unsupported export format. Use format=csv" });
      }
    } catch (error) {
      console.error('Error exporting inventory transactions:', error);
      res.status(500).json({ error: "Failed to export inventory transactions" });
    }
  });

  return httpServer;
}
