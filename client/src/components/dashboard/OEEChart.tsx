import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OEEChartProps {
  data?: { timestamp: string; value: number }[];
}

export function OEEChart({ data }: OEEChartProps) {
  if (!data) {
    return (
      <Card className="rounded-xl shadow-md border border-gray-100">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-xl font-semibold">OEE Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[200px] animate-pulse bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
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
        <CardTitle className="text-xl font-semibold">OEE Trend Analysis</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: any) => [`${value}%`, 'OEE']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#388e3c" 
              strokeWidth={2}
              fill="rgba(56, 142, 60, 0.1)"
              dot={{ fill: '#388e3c', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
