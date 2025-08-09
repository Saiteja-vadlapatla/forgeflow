import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Alert } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface RecentAlertsProps {
  alerts?: Alert[];
}

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  if (!alerts) {
    return (
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl font-semibold">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-5 w-5 text-[#d32f2f]" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-[#f57c00]" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-[#388e3c]" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case "error":
        return "bg-[#d32f2f] bg-opacity-5";
      case "warning":
        return "bg-[#f57c00] bg-opacity-5";
      case "success":
        return "bg-[#388e3c] bg-opacity-5";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <Card className="rounded-xl shadow-md border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-semibold">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className={`flex items-start space-x-3 p-3 rounded-lg ${getAlertBgColor(alert.type)}`}>
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.message}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(alert.createdAt))} ago
                </p>
              </div>
            </div>
          ))}
        </div>
        <Button 
          className="w-full mt-4" 
          variant="outline"
          onClick={() => console.log("View all alerts")}
        >
          View All Alerts
        </Button>
      </CardContent>
    </Card>
  );
}
