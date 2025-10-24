import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransactionSummary {
  period: string;
  totalTransactions: number;
  totalAdjustments: number;
  totalCostImpact: number;
  adjustmentTypes: Array<{
    adjustmentType: string;
    transactionCount: number;
    totalQuantity: number;
    totalCost: number;
    averageQuantity: number;
    averageCost: number;
  }>;
  reasonAnalysis: {
    topReasons: Array<{
      reason: string;
      transactionCount: number;
      totalQuantity: number;
      totalCost: number;
      percentage: number;
      cumulativePercentage: number;
    }>;
    totalUniqueReasons: number;
    mostCommonReason: string;
  };
  userActivityMetrics: Array<{
    userId: string;
    transactionCount: number;
    totalQuantity: number;
    totalCost: number;
    averageQuantityPerTransaction: number;
    averageCostPerTransaction: number;
    uniqueItemTypesAdjusted: number;
    mostCommonReason: string;
    lastActivity: string;
  }>;
  lastUpdated: string;
}

export function InventoryTransactionReport() {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<TransactionSummary | null>(
    null
  );
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedReason, setSelectedReason] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("transactionCount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { toast } = useToast();

  const fetchSummaryData = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Range Required",
        description: "Please select both start and end dates.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      const response = await fetch(
        `/api/analytics/inventory/transactions/summary?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transaction summary");
      }

      const data: TransactionSummary = await response.json();
      setSummaryData(data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load transaction summary data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [startDate, endDate]);

  const exportToCSV = () => {
    if (!summaryData) return;

    const csvHeaders = [
      "Period",
      "Total Transactions",
      "Total Adjustments",
      "Total Cost Impact",
      "Adjustment Types",
      "Top Reasons",
      "Unique Reasons",
      "Most Common Reason",
      "Active Users",
      "Last Updated",
    ].join(",");

    // Create CSV rows for adjustment types
    const adjustmentTypeRows = summaryData.adjustmentTypes
      .map(
        (type) =>
          `"${summaryData.period}",${summaryData.totalTransactions},${summaryData.totalAdjustments},${summaryData.totalCostImpact},"${type.adjustmentType}",,,,,,${summaryData.lastUpdated}`
      )
      .join("\n");

    // Create CSV rows for reasons
    const reasonRows = summaryData.reasonAnalysis.topReasons
      .map(
        (reason) =>
          `"${summaryData.period}",${summaryData.totalTransactions},${summaryData.totalAdjustments},${summaryData.totalCostImpact},,"${reason.reason}",${reason.transactionCount},${reason.totalQuantity},${reason.totalCost},`
      )
      .join("\n");

    const csvContent = [csvHeaders, adjustmentTypeRows, reasonRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_transaction_summary_${
      startDate.toISOString().split("T")[0]
    }_${endDate.toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "add":
        return "bg-green-100 text-green-800";
      case "remove":
        return "bg-red-100 text-red-800";
      case "set":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const sortedReasonData = [
    ...(summaryData?.reasonAnalysis.topReasons || []),
  ].sort((a, b) => {
    const aVal = a[sortField as keyof typeof a];
    const bVal = b[sortField as keyof typeof b];

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);
    return sortDirection === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Transaction Report</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics on stock adjustments and inventory movements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchSummaryData()}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={exportToCSV} disabled={!summaryData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Select date range and filters for the transaction analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">Filter by Reason</label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  {summaryData?.reasonAnalysis.topReasons.map((reason) => (
                    <SelectItem key={reason.reason} value={reason.reason}>
                      {reason.reason} ({reason.transactionCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {summaryData?.userActivityMetrics.map((user) => (
                    <SelectItem key={user.userId} value={user.userId}>
                      {user.userId} ({user.transactionCount} transactions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading transaction data...</span>
            </div>
          </CardContent>
        </Card>
      ) : summaryData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Transactions
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(summaryData.totalTransactions)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Adjustments
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(summaryData.totalAdjustments)}
                    </p>
                  </div>
                  <Minus className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Cost Impact
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(summaryData.totalCostImpact)}
                    </p>
                  </div>
                  {summaryData.totalCostImpact > 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : summaryData.totalCostImpact < 0 ? (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  ) : (
                    <Minus className="h-8 w-8 text-gray-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Unique Users
                    </p>
                    <p className="text-2xl font-bold">
                      {summaryData.userActivityMetrics.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adjustment Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Adjustment Types Distribution</CardTitle>
              <CardDescription>
                How different types of adjustments are distributed across
                transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Avg Quantity</TableHead>
                    <TableHead>Avg Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.adjustmentTypes.map((type) => (
                    <TableRow key={type.adjustmentType}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getAdjustmentTypeColor(
                            type.adjustmentType
                          )}
                        >
                          {type.adjustmentType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatNumber(type.transactionCount)}
                      </TableCell>
                      <TableCell>{formatNumber(type.totalQuantity)}</TableCell>
                      <TableCell>{formatCurrency(type.totalCost)}</TableCell>
                      <TableCell>
                        {formatNumber(Math.round(type.averageQuantity))}
                      </TableCell>
                      <TableCell>{formatCurrency(type.averageCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Reason Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Reason Analysis (Top Reasons)</CardTitle>
              <CardDescription>
                Pareto analysis showing the most common adjustment reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Total Unique Reasons:{" "}
                  {summaryData.reasonAnalysis.totalUniqueReasons} • Most Common:{" "}
                  {summaryData.reasonAnalysis.mostCommonReason}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Cumulative %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReasonData.map((reason) => (
                    <TableRow key={reason.reason}>
                      <TableCell className="font-medium">
                        {reason.reason}
                      </TableCell>
                      <TableCell>
                        {formatNumber(reason.transactionCount)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(reason.totalQuantity)}
                      </TableCell>
                      <TableCell>{formatCurrency(reason.totalCost)}</TableCell>
                      <TableCell>{reason.percentage.toFixed(1)}%</TableCell>
                      <TableCell>
                        {reason.cumulativePercentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* User Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity Summary</CardTitle>
              <CardDescription>
                Transaction activity by user with performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Avg Qty/Transaction</TableHead>
                    <TableHead>Item Types Adjusted</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryData.userActivityMetrics.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">
                        {user.userId}
                      </TableCell>
                      <TableCell>
                        {formatNumber(user.transactionCount)}
                      </TableCell>
                      <TableCell>{formatNumber(user.totalQuantity)}</TableCell>
                      <TableCell>{formatCurrency(user.totalCost)}</TableCell>
                      <TableCell>
                        {formatNumber(
                          Math.round(user.averageQuantityPerTransaction)
                        )}
                      </TableCell>
                      <TableCell>{user.uniqueItemTypesAdjusted}</TableCell>
                      <TableCell>
                        {new Date(user.lastActivity).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Last Updated Info */}
          <div className="text-sm text-muted-foreground text-right">
            Last updated: {new Date(summaryData.lastUpdated).toLocaleString()}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <p>No data available for the selected date range.</p>
              <p className="text-sm">
                Try adjusting the date filters to include transaction data.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
