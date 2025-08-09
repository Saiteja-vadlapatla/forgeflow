import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductionChartProps {
  data?: { timestamp: string; value: number }[];
}

export function ProductionChart({ data }: ProductionChartProps) {
  if (!data) {
    return (
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl font-semibold">Production Rate (24h)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[200px] animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(-7).map(item => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    }),
  }));

  return (
    <Card className="rounded-xl shadow-md border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-xl font-semibold">Production Rate (24h)</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: any) => [`${value}`, 'Units Produced']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Bar 
              dataKey="value" 
              fill="#1976d2" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
