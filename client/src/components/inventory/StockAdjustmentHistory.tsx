import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  History,
  Download,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  itemId: string;
  itemType: string;
  adjustment: number;
  previousStock: number;
  newStock: number;
  reason: string;
  adjustedBy: string;
  costImpact: number;
  notes?: string;
}

interface StockAdjustmentHistoryProps {
  itemId: string;
  itemType:
    | "raw_materials"
    | "inventory_tools"
    | "consumables"
    | "fasteners"
    | "general_items";
  className?: string;
}

type SortField = "timestamp" | "adjustment" | "reason" | "adjustedBy";
type SortDirection = "asc" | "desc";

export function StockAdjustmentHistory({
  itemId,
  itemType,
  className = "",
}: StockAdjustmentHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: transactionsData, isLoading } = useQuery<{
    transactions: InventoryTransaction[];
    total: number;
  }>({
    queryKey: ["/api/inventory", itemType, itemId, "transactions"],
    queryFn: async () => {
      const response = await fetch(
        `/api/inventory/${itemType}/${itemId}/transactions?limit=100`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transaction history");
      }
      return response.json();
    },
  });

  const transactions = transactionsData || { transactions: [], total: 0 };

  const handleExport = async () => {
    try {
      const url = `/api/inventory/transactions/export?itemId=${itemId}&itemType=${itemType}`;
      const link = document.createElement("a");
      link.href = url;
      link.download = `stock_adjustment_history_${itemType}_${itemId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export:", error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions =
    transactions.transactions
      ?.filter((transaction) => {
        const matchesSearch =
          !searchQuery ||
          transaction.reason
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          transaction.adjustedBy
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (transaction.notes &&
            transaction.notes
              .toLowerCase()
              .includes(searchQuery.toLowerCase()));

        const matchesReason =
          reasonFilter === "all" || transaction.reason === reasonFilter;

        return matchesSearch && matchesReason;
      })
      .sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        if (sortField === "timestamp") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }) || [];

  // Get unique reasons for filter dropdown
  const uniqueReasons = Array.from(
    new Set(
      transactions.transactions?.map((t) => t.reason).filter(Boolean) || []
    )
  ).sort();

  const getAdjustmentIcon = (adjustment: number) => {
    if (adjustment > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (adjustment < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getAdjustmentBadgeVariant = (adjustment: number) => {
    if (adjustment > 0) return "default" as const;
    if (adjustment < 0) return "secondary" as const;
    return "outline" as const;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Adjustment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600">Loading transaction history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Adjustment History
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>

            {/* Reason Filter */}
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {uniqueReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={!transactions.transactions?.length}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredAndSortedTransactions.length ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No adjustment history found</p>
            <p className="text-sm text-gray-500 mt-1">
              Stock adjustments will appear here once they are made
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("timestamp")}
                  >
                    Date & Time
                    {sortField === "timestamp" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("adjustment")}
                  >
                    Adjustment
                    {sortField === "adjustment" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("reason")}
                  >
                    Reason
                    {sortField === "reason" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort("adjustedBy")}
                  >
                    Adjusted By
                    {sortField === "adjustedBy" && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">
                          {format(
                            new Date(transaction.timestamp),
                            "MMM dd, yyyy"
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transaction.timestamp), "HH:mm:ss")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getAdjustmentBadgeVariant(
                          transaction.adjustment
                        )}
                        className="font-mono font-medium"
                      >
                        {getAdjustmentIcon(transaction.adjustment)}
                        <span className="ml-1">
                          {transaction.adjustment > 0 ? "+" : ""}
                          {transaction.adjustment}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        <div className="text-gray-500">
                          Before: {transaction.previousStock}
                        </div>
                        <div className="font-medium">
                          After: {transaction.newStock}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="max-w-32 truncate"
                        title={transaction.reason}
                      >
                        {transaction.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {transaction.adjustedBy}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredAndSortedTransactions.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Showing {filteredAndSortedTransactions.length} of{" "}
                {transactions.total} transactions
              </span>
              <span>
                Total adjustments:{" "}
                {filteredAndSortedTransactions.reduce(
                  (sum, t) => sum + t.adjustment,
                  0
                )}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
