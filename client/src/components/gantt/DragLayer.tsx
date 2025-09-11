import React from "react";
import { ScheduleSlot, Machine, SchedulingConflict } from "@shared/schema";
import { format } from "date-fns";
import { AlertTriangle, Clock, Zap, Loader } from "lucide-react";

interface DragLayerProps {
  slot: ScheduleSlot;
  position: { x: number; y: number };
  snapTime: Date | null;
  targetMachine: Machine | undefined;
  conflicts?: SchedulingConflict[];
  isValidating?: boolean;
}

export function DragLayer({ slot, position, snapTime, targetMachine, conflicts = [], isValidating = false }: DragLayerProps) {
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
        return "bg-red-600";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-yellow-500";
      default:
        return "bg-red-600";
    }
  };
  
  const hasConflicts = conflicts.length > 0;
  const highSeverityConflicts = conflicts.filter(c => c.severity === "high");
  return (
    <div className="fixed z-50 pointer-events-none">
      {/* Dragged task preview */}
      <div
        className={`absolute rounded shadow-lg border-2 ${
          hasConflicts 
            ? "border-red-500 animate-pulse" 
            : "border-blue-500"
        }`}
        style={{
          left: position.x - 50, // Offset to center on cursor
          top: position.y - 15,
          width: 100,
          height: 30,
          backgroundColor: hasConflicts ? "#DC2626" : (slot.color || "#3B82F6"),
          color: "white",
        }}
      >
        <div className="p-1 h-full flex items-center justify-between text-xs font-medium truncate">
          <span className="truncate">WO-{slot.workOrderId.slice(-4)}</span>
          {isValidating && <Loader className="h-3 w-3 animate-spin" />}
          {hasConflicts && !isValidating && (
            <div className="flex items-center">
              <AlertTriangle className="h-3 w-3" />
              <span className="ml-1">{conflicts.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Snap time indicator */}
      {snapTime && (
        <div
          className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg"
          style={{
            left: position.x + 10,
            top: position.y - 40,
          }}
        >
          {format(snapTime, "MMM d, HH:mm")}
        </div>
      )}

      {/* Target machine indicator */}
      {targetMachine && (
        <div
          className={`absolute text-white text-xs px-2 py-1 rounded shadow-lg ${
            hasConflicts ? "bg-red-600" : "bg-blue-600"
          }`}
          style={{
            left: position.x + 10,
            top: position.y - 20,
          }}
        >
          → {targetMachine.name}
          {hasConflicts && (
            <span className="ml-1 text-yellow-300">⚠</span>
          )}
        </div>
      )}
      
      {/* Conflict warnings */}
      {hasConflicts && (
        <div
          className="absolute bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg max-w-xs z-50"
          style={{
            left: position.x + 10,
            top: position.y + 10,
          }}
        >
          <div className="font-semibold mb-1 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
          </div>
          <div className="space-y-1">
            {conflicts.slice(0, 3).map((conflict, index) => (
              <div key={index} className="flex items-start space-x-1">
                <div className={`w-2 h-2 rounded-full mt-1 ${getConflictColor(conflict.severity)}`} />
                <div className="text-xs">
                  <div className="font-medium capitalize">
                    {conflict.type.replace('_', ' ')}
                  </div>
                  <div className="text-gray-300 leading-tight">
                    {conflict.description}
                  </div>
                </div>
              </div>
            ))}
            {conflicts.length > 3 && (
              <div className="text-gray-400 text-xs">
                +{conflicts.length - 3} more conflicts
              </div>
            )}
          </div>
          {highSeverityConflicts.length > 0 && (
            <div className="mt-2 text-red-300 text-xs font-medium">
              Drop not recommended - {highSeverityConflicts.length} critical conflict{highSeverityConflicts.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
      
      {/* Validation indicator */}
      {isValidating && (
        <div
          className="absolute bg-blue-900 text-white text-xs px-2 py-1 rounded shadow-lg flex items-center"
          style={{
            left: position.x - 60,
            top: position.y + 10,
          }}
        >
          <Loader className="h-3 w-3 animate-spin mr-1" />
          Validating...
        </div>
      )}
    </div>
  );
}