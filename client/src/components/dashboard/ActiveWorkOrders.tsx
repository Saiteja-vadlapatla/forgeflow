import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkOrder } from "@shared/schema";

interface ActiveWorkOrdersProps {
  workOrders?: WorkOrder[];
}

export function ActiveWorkOrders({ workOrders }: ActiveWorkOrdersProps) {
  if (!workOrders) {
    return (
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl font-semibold">Active Work Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-[#388e3c] bg-opacity-10 text-[#388e3c]";
      case "setup":
        return "bg-[#f57c00] bg-opacity-10 text-[#f57c00]";
      case "pending":
        return "bg-gray-100 text-gray-600";
      case "on_hold":
        return "bg-[#d32f2f] bg-opacity-10 text-[#d32f2f]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatStatus = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-[#388e3c]";
      case "setup":
        return "bg-[#f57c00]";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <Card className="rounded-xl shadow-md border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-semibold">Active Work Orders</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {workOrders.map((order) => {
            const progress = order.quantity > 0 ? ((order.completedQuantity || 0) / order.quantity) * 100 : 0;
            
            return (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[#1976d2]">{order.orderNumber}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Part: {order.partNumber}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-medium">{Math.round(progress)}% ({order.completedQuantity || 0}/{order.quantity})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(order.status)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <Button 
          className="w-full mt-4" 
          variant="outline"
          onClick={() => console.log("View all work orders")}
        >
          View All Work Orders
        </Button>
      </CardContent>
    </Card>
  );
}
