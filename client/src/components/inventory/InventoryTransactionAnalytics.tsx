function InventoryTransactionAnalytics() {
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [granularity, setGranularity] = useState<string>("weekly");

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const trendParams = new URLSearchParams({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        granularity,
      });

      const trendResponse = await fetch(
        `/api/analytics/inventory/transactions/trends?${trendParams}`
      );

      if (trendResponse.ok) {
        const trendResult = await trendResponse.json();
        setTrendData(trendResult.trends || []);
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate, granularity]);

  const trendChartData = trendData.map((item) => ({
    period: item.period,
    transactions: item.transactionCount || 0,
    quantity: item.totalQuantity || 0,
    cost: item.totalCost || 0,
    users: item.uniqueUsers || 0,
    efficiency: item.efficiencyScore || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Analytics</h2>
          <p className="text-muted-foreground">
            Stock adjustment patterns and trends
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAnalyticsData}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-pulse" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker
                date={startDate}
                onSelect={(date) => date && setStartDate(date)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker
                date={endDate}
                onSelect={(date) => date && setEndDate(date)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Granularity</label>
              <Select value={granularity} onValueChange={setGranularity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Transaction Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Cost Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `$${value?.toLocaleString()}`,
                    "Cost Impact",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Periods
                </p>
                <p className="text-2xl font-bold">{trendChartData.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Efficiency
                </p>
                <p className="text-2xl font-bold">
                  {trendChartData.length > 0
                    ? (
                        trendChartData.reduce(
                          (sum, item) => sum + (item.efficiency || 0),
                          0
                        ) / trendChartData.length
                      ).toFixed(1)
                    : "N/A"}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Cost Impact
                </p>
                <p className="text-2xl font-bold">
                  $
                  {trendChartData
                    .reduce((sum, item) => sum + (item.cost || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
