import { useState } from "react";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, BarChart3, AlertTriangle, Settings } from "lucide-react";
import { ShiftReportForm } from "@/components/data-entry/ShiftReportForm";
import { OperatorConsole } from "@/components/data-entry/OperatorConsole";
import { DowntimePanel } from "@/components/data-entry/DowntimeDialog";
import { ReasonCodeManager } from "@/components/data-entry/ReasonCodeManager";

export function DataEntryPage() {
  const [activeTab, setActiveTab] = useState("shifts");

  return (
    <ResponsiveLayout currentPath="/data-entry">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8" />
            <h1 data-testid="page-title" className="text-3xl font-bold tracking-tight">
              Production Data Entry
            </h1>
          </div>
          <p data-testid="page-description" className="text-muted-foreground">
            Manage shift reports, track production, record downtime events, and configure system settings
          </p>
        </div>

        {/* Quick Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-active-shifts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Day and Evening shifts running</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-sessions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Operators currently logged in</p>
            </CardContent>
          </Card>

          <Card data-testid="card-todays-production">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Production</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">847</div>
              <p className="text-xs text-muted-foreground">Parts completed today</p>
            </CardContent>
          </Card>

          <Card data-testid="card-downtime-events">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downtime Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Active downtime events</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList data-testid="data-entry-tabs" className="grid w-full grid-cols-5">
            <TabsTrigger value="shifts" data-testid="tab-shifts" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Shifts</span>
            </TabsTrigger>
            <TabsTrigger value="production" data-testid="tab-production" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Production</span>
            </TabsTrigger>
            <TabsTrigger value="downtime" data-testid="tab-downtime" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Downtime</span>
            </TabsTrigger>
            <TabsTrigger value="console" data-testid="tab-console" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Console</span>
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* Shift Management Tab */}
          <TabsContent value="shifts" data-testid="content-shifts">
            <ShiftReportForm />
          </TabsContent>

          {/* Production Tracking Tab */}
          <TabsContent value="production" data-testid="content-production">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Production Entry</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter production quantities, track work progress, and log scrap events with real-time validation.
                  </p>
                </CardContent>
              </Card>
              <OperatorConsole />
            </div>
          </TabsContent>

          {/* Downtime Recording Tab */}
          <TabsContent value="downtime" data-testid="content-downtime">
            <DowntimePanel />
          </TabsContent>

          {/* Operator Console Tab */}
          <TabsContent value="console" data-testid="content-console">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Mobile Operator Console</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Optimized interface for shop floor operators with large buttons and simplified workflow.
                </p>
              </CardContent>
            </Card>
            <OperatorConsole className="mt-6" />
          </TabsContent>

          {/* Admin Settings Tab */}
          <TabsContent value="settings" data-testid="content-settings">
            <ReasonCodeManager />
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}