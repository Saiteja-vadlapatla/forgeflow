import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InventoryStatus() {
  const inventoryItems = [
    { name: "Steel Bar Stock", level: 25, remaining: "125 kg remaining", status: "Low" },
    { name: "Aluminum Blocks", level: 75, remaining: "890 kg remaining", status: "Good" },
    { name: "Cutting Tools", level: 60, remaining: "67 pieces remaining", status: "Good" },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "low":
        return { bg: "bg-[#f57c00]", text: "text-[#f57c00]" };
      case "good":
        return { bg: "bg-[#388e3c]", text: "text-[#388e3c]" };
      default:
        return { bg: "bg-gray-400", text: "text-gray-600" };
    }
  };

  return (
    <Card className="rounded-xl shadow-md border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-semibold">Inventory Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {inventoryItems.map((item, index) => {
            const colors = getStatusColor(item.status);
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className={`text-sm ${colors.text}`}>{item.status}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colors.bg}`}
                    style={{ width: `${item.level}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{item.remaining}</span>
              </div>
            );
          })}
        </div>
        <Button 
          className="w-full mt-4" 
          variant="outline"
          onClick={() => console.log("Manage inventory")}
        >
          Manage Inventory
        </Button>
      </CardContent>
    </Card>
  );
}
