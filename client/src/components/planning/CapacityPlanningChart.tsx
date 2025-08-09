import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CapacityPlanning } from "@shared/schema";

interface CapacityPlanningChartProps {
  data: CapacityPlanning[];
}

export function CapacityPlanningChart({ data }: CapacityPlanningChartProps) {
  // Transform the data for the chart
  const chartData = data.slice(0, 7).map((item, index) => ({
    day: `Day ${index + 1}`,
    planned: item.plannedHours || 0,
    available: item.availableHours || 0,
    utilization: item.utilization || 0,
  }));

  // If no data, show mock data for visualization
  const mockData = [
    { day: "Mon", planned: 16, available: 20, utilization: 80 },
    { day: "Tue", planned: 18, available: 20, utilization: 90 },
    { day: "Wed", planned: 15, available: 20, utilization: 75 },
    { day: "Thu", planned: 20, available: 20, utilization: 100 },
    { day: "Fri", planned: 14, available: 20, utilization: 70 },
    { day: "Sat", planned: 8, available: 10, utilization: 80 },
    { day: "Sun", planned: 0, available: 0, utilization: 0 },
  ];

  const displayData = chartData.length > 0 ? chartData : mockData;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="available" fill="#e5e7eb" name="Available Hours" />
        <Bar dataKey="planned" fill="#3b82f6" name="Planned Hours" />
      </BarChart>
    </ResponsiveContainer>
  );
}