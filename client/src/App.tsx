import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import WorkOrdersPage from "@/pages/work-orders";
import MachineOperationsPage from "@/pages/machine-operations";
import QualityControlPage from "@/pages/quality-control";
import { InventoryPage } from "@/pages/inventory";
import { ProductionPlanningPage } from "@/pages/production-planning";
import { CapacityPlanningPage } from "@/pages/capacity-planning";
import { GanttPage } from "@/pages/gantt";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/work-orders" component={WorkOrdersPage} />
      <Route path="/machine-operations" component={MachineOperationsPage} />
      <Route path="/quality-control" component={QualityControlPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/production-planning" component={ProductionPlanningPage} />
      <Route path="/capacity-planning" component={CapacityPlanningPage} />
      <Route path="/gantt" component={GanttPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
