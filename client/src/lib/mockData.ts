// This file contains mock data utilities for development and fallback purposes
// In production, all data comes from the WebSocket and REST API

export const mockKPIs = {
  overallOEE: 82.4,
  activeMachines: 14,
  totalMachines: 16,
  productionRate: 847,
  qualityRate: 99.2,
};

export const mockMachines = [
  {
    id: "1",
    name: "CNC-001",
    type: "CNC_TURNING",
    operation: "CNC Turning",
    status: "running",
    efficiency: 94,
    workOrder: { orderNumber: "WO-2024-001" },
  },
  {
    id: "2", 
    name: "MILL-003",
    type: "CNC_MILLING",
    operation: "CNC Milling", 
    status: "setup",
    efficiency: 0,
    workOrder: { orderNumber: "WO-2024-007" },
  },
  {
    id: "3",
    name: "GRIND-002", 
    type: "SURFACE_GRINDING",
    operation: "Surface Grinding",
    status: "maintenance",
    efficiency: 0,
    downtime: 165,
  },
  {
    id: "4",
    name: "WIRE-001",
    type: "WIRE_CUT", 
    operation: "Wire Cut EDM",
    status: "running",
    efficiency: 89,
    workOrder: { orderNumber: "WO-2024-012" },
  },
];

export const mockOEEData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
  value: Math.floor(Math.random() * 15) + 75,
}));

export const mockProductionData = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
  value: Math.floor(Math.random() * 200) + 600,
}));
