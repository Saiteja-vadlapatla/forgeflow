import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SchedulingPolicy } from "@shared/schema";

interface TimelineManagerProps {
  planType: "daily" | "weekly" | "monthly";
  startDate: string;
  endDate: string;
  onTimelineChange: (startDate: string, endDate: string) => void;
  selectedWorkOrders: string[];
  totalEstimatedHours: number;
  schedulingPolicy: SchedulingPolicy;
  onSchedulingPolicyChange: (policy: SchedulingPolicy) => void;
}

interface CapacityValidation {
  isValid: boolean;
  totalCapacityHours: number;
  utilizationPercentage: number;
  conflicts: string[];
  warnings: string[];
  suggestions: string[];
}

export function TimelineManager({
  planType,
  startDate,
  endDate,
  onTimelineChange,
  selectedWorkOrders,
  totalEstimatedHours,
  schedulingPolicy,
  onSchedulingPolicyChange
}: TimelineManagerProps) {
  const [capacityValidation, setCapacityValidation] = useState<CapacityValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Get machine data for capacity calculation
  const { data: machines = [] } = useQuery<any[]>({
    queryKey: ["/api/machines"],
  });

  // Get existing production plans for conflict detection
  const { data: existingPlans = [] } = useQuery<any[]>({
    queryKey: ["/api/production-plans"],
  });

  // Calculate smart date ranges based on plan type
  const getSuggestedDateRange = (type: "daily" | "weekly" | "monthly") => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (type) {
      case "daily":
        // Start tomorrow
        start.setDate(now.getDate() + 1);
        end.setDate(start.getDate());
        break;
      case "weekly":
        // Start next Monday
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        start.setDate(now.getDate() + daysUntilMonday);
        end.setDate(start.getDate() + 6);
        break;
      case "monthly":
        // Start next month
        start.setMonth(now.getMonth() + 1, 1);
        end.setMonth(start.getMonth() + 1, 0); // Last day of month
        break;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  // Auto-suggest dates when plan type changes
  useEffect(() => {
    if (!startDate || !endDate) {
      const suggested = getSuggestedDateRange(planType);
      onTimelineChange(suggested.start, suggested.end);
    }
  }, [planType]);

  // Validate capacity when timeline or work orders change
  useEffect(() => {
    if (startDate && endDate && selectedWorkOrders.length > 0) {
      validateCapacity();
    }
  }, [startDate, endDate, selectedWorkOrders, totalEstimatedHours]);

  const validateCapacity = async () => {
    setIsValidating(true);
    
    try {
      // Calculate working days between start and end date
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      // Assume 8 hours per working day per machine (standard manufacturing schedule)
      const workingDaysInPeriod = Math.floor(daysDiff * 5/7); // Assume 5-day work week
      const availableMachines = machines.filter(m => m.status !== "maintenance" && m.status !== "error").length;
      const totalCapacityHours = workingDaysInPeriod * 8 * availableMachines;
      
      const utilizationPercentage = totalCapacityHours > 0 
        ? (totalEstimatedHours / totalCapacityHours) * 100 
        : 100;

      // Check for conflicts with existing plans
      const conflicts: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];

      // Conflict detection with existing plans
      existingPlans.forEach((plan: any) => {
        if (plan.status === "active" || plan.status === "draft") {
          const planStart = new Date(plan.startDate);
          const planEnd = new Date(plan.endDate);
          
          if ((start >= planStart && start <= planEnd) || 
              (end >= planStart && end <= planEnd) ||
              (start <= planStart && end >= planEnd)) {
            conflicts.push(`Overlaps with existing plan: ${plan.planName}`);
          }
        }
      });

      // Capacity warnings
      if (utilizationPercentage > 100) {
        warnings.push(`Overloaded: ${utilizationPercentage.toFixed(1)}% capacity utilization`);
        suggestions.push("Consider extending the timeline or reducing work orders");
      } else if (utilizationPercentage > 90) {
        warnings.push(`High utilization: ${utilizationPercentage.toFixed(1)}% capacity`);
        suggestions.push("Schedule may be tight - monitor closely");
      } else if (utilizationPercentage < 50) {
        suggestions.push("Low utilization - consider adding more work orders or shortening timeline");
      }

      // Weekend and holiday warnings
      const startDay = start.getDay();
      const endDay = end.getDay();
      if (startDay === 0 || startDay === 6) {
        warnings.push("Plan starts on weekend");
      }
      if (endDay === 0 || endDay === 6) {
        warnings.push("Plan ends on weekend");
      }

      setCapacityValidation({
        isValid: conflicts.length === 0 && utilizationPercentage <= 100,
        totalCapacityHours,
        utilizationPercentage,
        conflicts,
        warnings,
        suggestions
      });
    } catch (error) {
      console.error("Error validating capacity:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDateChange = (field: "start" | "end", value: string) => {
    if (field === "start") {
      onTimelineChange(value, endDate);
    } else {
      onTimelineChange(startDate, value);
    }
  };

  const applyQuickDateRange = (type: "daily" | "weekly" | "monthly") => {
    const suggested = getSuggestedDateRange(type);
    onTimelineChange(suggested.start, suggested.end);
  };

  const getValidationIcon = () => {
    if (isValidating) return <Clock className="h-4 w-4 animate-spin" />;
    if (!capacityValidation) return null;
    
    if (capacityValidation.conflicts.length > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (capacityValidation.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Timeline Management</span>
            {getValidationIcon()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Date Range Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickDateRange("daily")}
              data-testid="button-quick-daily"
            >
              Tomorrow
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickDateRange("weekly")}
              data-testid="button-quick-weekly"
            >
              Next Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickDateRange("monthly")}
              data-testid="button-quick-monthly"
            >
              Next Month
            </Button>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange("start", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-plan-start-date"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange("end", e.target.value)}
                min={startDate || new Date().toISOString().split('T')[0]}
                data-testid="input-plan-end-date"
              />
            </div>
          </div>

          {/* Timeline Duration Summary */}
          {startDate && endDate && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="font-medium" data-testid="text-plan-duration">
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Working Days</div>
                  <div className="font-medium" data-testid="text-working-days">
                    {Math.floor(((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) + 1) * 5/7)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Work Orders</div>
                  <div className="font-medium" data-testid="text-workorder-count">
                    {selectedWorkOrders.length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduling Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedulingRule">Scheduling Rule</Label>
              <Select
                value={schedulingPolicy.rule}
                onValueChange={(value) => 
                  onSchedulingPolicyChange({ 
                    ...schedulingPolicy, 
                    rule: value as SchedulingPolicy["rule"]
                  })
                }
              >
                <SelectTrigger data-testid="select-scheduling-rule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDD">Earliest Due Date (EDD)</SelectItem>
                  <SelectItem value="SPT">Shortest Processing Time (SPT)</SelectItem>
                  <SelectItem value="CR">Critical Ratio (CR)</SelectItem>
                  <SelectItem value="PRIORITY">Priority Based</SelectItem>
                  <SelectItem value="FIFO">First In, First Out (FIFO)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="horizon">Planning Horizon (hours)</Label>
              <Input
                id="horizon"
                type="number"
                value={schedulingPolicy.horizon}
                onChange={(e) => 
                  onSchedulingPolicyChange({ 
                    ...schedulingPolicy, 
                    horizon: parseInt(e.target.value) || 168
                  })
                }
                min="24"
                max="8760"
                data-testid="input-planning-horizon"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowOverload"
                checked={schedulingPolicy.allowOverload}
                onChange={(e) => 
                  onSchedulingPolicyChange({ 
                    ...schedulingPolicy, 
                    allowOverload: e.target.checked
                  })
                }
                data-testid="checkbox-allow-overload"
              />
              <Label htmlFor="allowOverload">Allow Machine Overloading</Label>
            </div>

            {schedulingPolicy.allowOverload && (
              <div>
                <Label htmlFor="maxOverload">Max Overload (%)</Label>
                <Input
                  id="maxOverload"
                  type="number"
                  value={schedulingPolicy.maxOverloadPercentage || 120}
                  onChange={(e) => 
                    onSchedulingPolicyChange({ 
                      ...schedulingPolicy, 
                      maxOverloadPercentage: parseInt(e.target.value) || 120
                    })
                  }
                  min="100"
                  max="200"
                  data-testid="input-max-overload"
                />
              </div>
            )}
          </div>

          {/* Scheduling Rule Descriptions */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <div className="font-medium mb-2">Selected Rule: {schedulingPolicy.rule}</div>
            <div className="text-gray-600">
              {schedulingPolicy.rule === "EDD" && "Prioritizes jobs with the earliest due dates"}
              {schedulingPolicy.rule === "SPT" && "Prioritizes jobs with the shortest processing times"}
              {schedulingPolicy.rule === "CR" && "Prioritizes jobs based on critical ratio (time remaining / work remaining)"}
              {schedulingPolicy.rule === "PRIORITY" && "Prioritizes jobs based on assigned priority levels"}
              {schedulingPolicy.rule === "FIFO" && "Processes jobs in the order they were received"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Validation Results */}
      {capacityValidation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Capacity Validation</span>
              {capacityValidation.isValid ? (
                <Badge className="bg-green-100 text-green-800">Valid</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Issues Found</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Capacity Summary */}
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-600">Required Hours</div>
                <div className="text-xl font-bold text-blue-600" data-testid="text-required-hours">
                  {totalEstimatedHours.toFixed(1)}h
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Available Hours</div>
                <div className="text-xl font-bold text-green-600" data-testid="text-available-hours">
                  {capacityValidation.totalCapacityHours.toFixed(1)}h
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Utilization</div>
                <div className={`text-xl font-bold ${
                  capacityValidation.utilizationPercentage > 100 ? 'text-red-600' :
                  capacityValidation.utilizationPercentage > 90 ? 'text-orange-600' :
                  'text-green-600'
                }`} data-testid="text-utilization-percentage">
                  {capacityValidation.utilizationPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Conflicts */}
            {capacityValidation.conflicts.length > 0 && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Conflicts Detected:</div>
                  <ul className="list-disc pl-4" data-testid="list-conflicts">
                    {capacityValidation.conflicts.map((conflict, index) => (
                      <li key={index}>{conflict}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {capacityValidation.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Warnings:</div>
                  <ul className="list-disc pl-4" data-testid="list-warnings">
                    {capacityValidation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Suggestions */}
            {capacityValidation.suggestions.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Suggestions:</div>
                  <ul className="list-disc pl-4" data-testid="list-suggestions">
                    {capacityValidation.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}