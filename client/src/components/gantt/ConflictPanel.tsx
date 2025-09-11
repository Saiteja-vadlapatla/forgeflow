import { useState } from "react";
import { AlertTriangle, Clock, Zap, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SchedulingConflict } from "@shared/schema";

interface ConflictPanelProps {
  conflicts: SchedulingConflict[];
  onResolveConflict: (conflictId: string, resolution: string) => void;
  onClose?: () => void;
}

interface GroupedConflicts {
  resource_conflict: SchedulingConflict[];
  precedence_violation: SchedulingConflict[];
  capacity_overload: SchedulingConflict[];
  deadline_missed: SchedulingConflict[];
}

export function ConflictPanel({ conflicts, onResolveConflict, onClose }: ConflictPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["resource_conflict", "precedence_violation"]));

  // Group conflicts by type
  const groupedConflicts: GroupedConflicts = conflicts.reduce(
    (acc, conflict) => {
      const type = conflict.type as keyof GroupedConflicts;
      if (acc[type]) {
        acc[type].push(conflict);
      } else {
        acc.resource_conflict.push(conflict); // Default to resource_conflict for unknown types
      }
      return acc;
    },
    { resource_conflict: [], precedence_violation: [], capacity_overload: [], deadline_missed: [] } as GroupedConflicts
  );

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case "resource_conflict":
        return <Zap className="h-4 w-4 text-red-500" />;
      case "precedence_violation":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "capacity_overload":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "deadline_missed":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "destructive";
    }
  };

  const getGroupTitle = (type: string, count: number) => {
    const titles = {
      resource_conflict: `Resource Conflicts (${count})`,
      precedence_violation: `Precedence Violations (${count})`,
      capacity_overload: `Capacity Overloads (${count})`,
      deadline_missed: `Deadline Missed (${count})`,
    };
    return titles[type as keyof typeof titles] || `${type.replace('_', ' ')} Conflicts (${count})`;
  };

  const getResolutionActions = (conflict: SchedulingConflict) => {
    switch (conflict.type) {
      case "resource_conflict":
        return [
          { label: "Split Earlier", action: "split_earlier" },
          { label: "Delay Later", action: "delay_later" },
          { label: "Move to Different Machine", action: "reassign_machine" },
        ];
      case "precedence_violation":
        return [
          { label: "Reschedule Successor", action: "reschedule_successor" },
          { label: "Advance Predecessor", action: "advance_predecessor" },
        ];
      case "capacity_overload":
        return [
          { label: "Spread to Available Capacity", action: "spread_capacity" },
          { label: "Reschedule to Off-Peak", action: "reschedule_off_peak" },
        ];
      default:
        return [
          { label: "Manual Resolution Required", action: "manual" },
        ];
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-hidden shadow-lg z-40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            Schedule Conflicts ({conflicts.length})
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="overflow-y-auto max-h-64">
        <div className="space-y-3">
          {Object.entries(groupedConflicts).map(([type, typeConflicts]) => {
            if (typeConflicts.length === 0) return null;
            
            const isExpanded = expandedGroups.has(type);
            
            return (
              <Collapsible key={type} open={isExpanded}>
                <CollapsibleTrigger
                  className="flex items-center justify-between w-full p-2 text-left bg-gray-50 rounded hover:bg-gray-100"
                  onClick={() => toggleGroup(type)}
                >
                  <div className="flex items-center space-x-2">
                    {getConflictIcon(type)}
                    <span className="text-sm font-medium">
                      {getGroupTitle(type, typeConflicts.length)}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-2 space-y-2">
                  {typeConflicts.map((conflict: SchedulingConflict, conflictIndex: number) => (
                    <div
                      key={`${conflict.type}-${conflictIndex}`}
                      className="p-3 bg-white border rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge
                            variant={getConflictColor(conflict.severity)}
                            className="mb-1"
                          >
                            {conflict.severity.toUpperCase()}
                          </Badge>
                          <p className="text-gray-700 mb-2">{conflict.description}</p>
                          {conflict.affectedOperations && conflict.affectedOperations.length > 0 && (
                            <p className="text-gray-500">
                              Affects: {conflict.affectedOperations.length} operation(s)
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Resolution actions */}
                      <div className="flex flex-wrap gap-1">
                        {getResolutionActions(conflict).map((action) => (
                          <Button
                            key={action.action}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6"
                            onClick={() => onResolveConflict(`${conflict.type}-${conflictIndex}`, action.action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}