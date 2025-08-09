import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertWorkOrderSchema, insertMachineSchema, insertQualityRecordSchema, insertRawMaterialSchema, insertInventoryToolSchema, insertProductionPlanSchema } from "@shared/schema";

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
      res.json(record);
      
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

  // Quality endpoints
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
      const validation = insertQualityRecordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid quality record data", details: validation.error });
      }
      
      const record = await storage.createQualityRecord(validation.data);
      res.status(201).json(record);
      
      // Broadcast update
      broadcastRealtimeData();
    } catch (error) {
      res.status(500).json({ error: "Failed to create quality record" });
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
      const validatedData = insertRawMaterialSchema.parse(req.body);
      const material = await storage.createRawMaterial(validatedData);
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: "Failed to create raw material" });
    }
  });

  app.patch("/api/inventory/materials/:id/update-stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { adjustmentType, adjustmentQuantity, reason, notes } = req.body;
      // This would typically update inventory stock levels
      res.json({ success: true });
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
      const validatedData = insertInventoryToolSchema.parse(req.body);
      const tool = await storage.createInventoryTool(validatedData);
      res.json(tool);
    } catch (error) {
      res.status(400).json({ error: "Failed to create tool" });
    }
  });

  app.patch("/api/inventory/tools/:id/update-stock", async (req, res) => {
    try {
      const { id } = req.params;
      const { adjustmentType, adjustmentQuantity, reason, notes } = req.body;
      // This would typically update tool inventory stock levels
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update tool stock" });
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

  app.post("/api/production-plans", async (req, res) => {
    try {
      const validatedData = insertProductionPlanSchema.parse(req.body);
      const plan = await storage.createProductionPlan(validatedData);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Failed to create production plan" });
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

  return httpServer;
}
