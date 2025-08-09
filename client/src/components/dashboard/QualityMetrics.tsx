import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QualityMetrics() {
  return (
    <Card className="rounded-xl shadow-md border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-semibold">Quality Metrics</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">First Pass Yield</span>
            <span className="font-semibold text-[#388e3c]">99.2%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Defect Rate</span>
            <span className="font-semibold text-[#d32f2f]">0.8%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Open NCRs</span>
            <span className="font-semibold text-[#f57c00]">3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Inspections Today</span>
            <span className="font-semibold">47</span>
          </div>
        </div>
        <Button 
          className="w-full mt-4" 
          variant="outline"
          onClick={() => console.log("View quality dashboard")}
        >
          View Quality Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
