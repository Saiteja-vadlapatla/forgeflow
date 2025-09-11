import { AlertTriangle, Clock, Zap } from "lucide-react";
import { SchedulingConflict } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ConflictBadgeProps {
  conflicts: SchedulingConflict[];
  className?: string;
}

export function ConflictBadge({ conflicts, className }: ConflictBadgeProps) {
  if (conflicts.length === 0) return null;

  const getConflictIcon = (type: string) => {
    switch (type) {
      case "resource_conflict":
        return <Zap className="h-3 w-3" />;
      case "precedence_violation":
        return <Clock className="h-3 w-3" />;
      case "capacity_overload":
        return <AlertTriangle className="h-3 w-3" />;
      case "deadline_missed":
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
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

  const highestSeverityConflict = conflicts.reduce((prev, current) => {
    const severityOrder = { "low": 1, "medium": 2, "high": 3 };
    const prevSeverity = severityOrder[prev.severity as keyof typeof severityOrder] || 0;
    const currentSeverity = severityOrder[current.severity as keyof typeof severityOrder] || 0;
    return currentSeverity > prevSeverity ? current : prev;
  });

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant={getConflictColor(highestSeverityConflict.severity)}
          className={`h-5 w-5 p-0 flex items-center justify-center ${className}`}
        >
          {getConflictIcon(highestSeverityConflict.type)}
          {conflicts.length > 1 && (
            <span className="ml-1 text-xs">{conflicts.length}</span>
          )}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          {conflicts.slice(0, 3).map((conflict, index) => (
            <div key={index} className="text-xs">
              <span className="font-medium capitalize">{conflict.type.replace('_', ' ')}:</span>{" "}
              {conflict.description}
            </div>
          ))}
          {conflicts.length > 3 && (
            <div className="text-xs text-gray-500">
              +{conflicts.length - 3} more conflicts
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}