import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ScheduleSlot, Machine, SchedulingConflict } from "@shared/schema";
import { TimelineHeader } from "./TimelineHeader";
import { MachineLanes } from "./MachineLanes";
import { NowMarker } from "./NowMarker";
import { DragLayer } from "./DragLayer";
import { ConflictBadge } from "./ConflictBadge";
import { apiRequest } from "@/lib/queryClient";

type ViewMode = "day" | "week" | "month";

interface GanttChartProps {
  scheduleSlots: ScheduleSlot[];
  machines: Machine[];
  conflicts: SchedulingConflict[];
  viewMode: ViewMode;
  currentDate: Date;
  onSlotUpdate: (id: string, updates: Partial<ScheduleSlot>) => void;
  onBulkUpdate: (updates: { id: string, updates: Partial<ScheduleSlot> }[]) => void;
  selectedSlots: string[];
  onSelectionChange: (slotIds: string[]) => void;
  isUpdating: boolean;
}

interface DragState {
  isDragging: boolean;
  draggedSlot: ScheduleSlot | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originalMachine: string;
  currentMachine: string;
  snapTime: Date | null;
  dragConflicts: SchedulingConflict[];
  isValidating: boolean;
}

const LANE_HEIGHT = 60;
const HEADER_HEIGHT = 80;
const TIME_COLUMN_WIDTH = 80;
const SNAP_MINUTES = 15;

export function GanttChart({
  scheduleSlots,
  machines,
  conflicts,
  viewMode,
  currentDate,
  onSlotUpdate,
  onBulkUpdate,
  selectedSlots,
  onSelectionChange,
  isUpdating
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedSlot: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    originalMachine: "",
    currentMachine: "",
    snapTime: null,
    dragConflicts: [],
    isValidating: false,
  });
  
  // Ref for debouncing validation
  const validationTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate time scale based on view mode
  const timeScale = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    let pixelsPerHour = 40;
    let intervals: Date[] = [];

    switch (viewMode) {
      case "day":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        pixelsPerHour = 80;
        // Generate hourly intervals
        for (let hour = 0; hour < 24; hour++) {
          const intervalTime = new Date(start);
          intervalTime.setHours(hour);
          intervals.push(intervalTime);
        }
        break;
      case "week":
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        pixelsPerHour = 10;
        // Generate daily intervals
        for (let day = 0; day < 7; day++) {
          const intervalTime = new Date(start);
          intervalTime.setDate(start.getDate() + day);
          intervals.push(intervalTime);
        }
        break;
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        pixelsPerHour = 2;
        // Generate daily intervals
        const daysInMonth = end.getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const intervalTime = new Date(start);
          intervalTime.setDate(day);
          intervals.push(intervalTime);
        }
        break;
    }

    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalWidth = totalHours * pixelsPerHour;

    return {
      start,
      end,
      pixelsPerHour,
      intervals,
      totalWidth,
      getXPosition: (time: Date) => {
        const hours = (time.getTime() - start.getTime()) / (1000 * 60 * 60);
        return hours * pixelsPerHour;
      },
      getTimeFromX: (x: number) => {
        const hours = x / pixelsPerHour;
        return new Date(start.getTime() + hours * 1000 * 60 * 60);
      },
    };
  }, [currentDate, viewMode]);

  // Calculate position for schedule slot
  const getSlotPosition = useCallback((slot: ScheduleSlot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    const x = timeScale.getXPosition(startTime);
    const width = timeScale.getXPosition(endTime) - x;
    const machineIndex = machines.findIndex(m => m.id === slot.machineId);
    const y = machineIndex * LANE_HEIGHT;

    return { x, y, width, height: LANE_HEIGHT - 10 };
  }, [machines, timeScale]);

  // Snap time to nearest interval
  const snapToGrid = useCallback((time: Date) => {
    const minutes = time.getMinutes();
    const snappedMinutes = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
    const snappedTime = new Date(time);
    snappedTime.setMinutes(snappedMinutes, 0, 0);
    return snappedTime;
  }, []);

  // Handle pointer events for drag and drop
  const handlePointerDown = useCallback((event: React.PointerEvent, slot: ScheduleSlot) => {
    if (slot.locked || isUpdating) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      draggedSlot: slot,
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
      currentX: event.clientX - rect.left,
      currentY: event.clientY - rect.top,
      originalMachine: slot.machineId,
      currentMachine: slot.machineId,
      snapTime: null,
      dragConflicts: [],
      isValidating: false,
    });

    // Set pointer capture
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [isUpdating]);

  // Local overlap detection during drag
  const checkLocalOverlaps = useCallback((draggedSlot: ScheduleSlot, newStartTime: Date, newMachineId: string) => {
    const draggedDuration = new Date(draggedSlot.endTime).getTime() - new Date(draggedSlot.startTime).getTime();
    const newEndTime = new Date(newStartTime.getTime() + draggedDuration);
    
    const conflicts: SchedulingConflict[] = [];
    
    // Check overlaps with other slots on the same machine
    const overlappingSlots = scheduleSlots.filter(slot => {
      if (slot.id === draggedSlot.id || slot.machineId !== newMachineId) return false;
      
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      
      // Check for overlap: newStart < slotEnd AND slotStart < newEnd
      return newStartTime < slotEnd && slotStart < newEndTime;
    });
    
    if (overlappingSlots.length > 0) {
      conflicts.push({
        type: "resource_conflict",
        severity: "high",
        description: `Would overlap with ${overlappingSlots.length} operation(s) on this machine`,
        affectedOperations: [draggedSlot.operationId, ...overlappingSlots.map(s => s.operationId)],
        suggestedResolution: "Choose a different time or machine"
      });
    }
    
    // Check if moving outside calendar boundaries
    if (newStartTime < timeScale.start || newEndTime > timeScale.end) {
      conflicts.push({
        type: "deadline_missed",
        severity: "medium",
        description: "Operation would extend outside visible timeline",
        affectedOperations: [draggedSlot.operationId],
        suggestedResolution: "Adjust timeline view or choose different time"
      });
    }
    
    return conflicts;
  }, [scheduleSlots, timeScale]);
  
  // Debounced validation during drag
  const validateDragPosition = useCallback(async (draggedSlot: ScheduleSlot, newStartTime: Date, newMachineId: string) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Local checks first (immediate feedback)
    const localConflicts = checkLocalOverlaps(draggedSlot, newStartTime, newMachineId);
    
    setDragState(prev => ({
      ...prev,
      dragConflicts: localConflicts,
      isValidating: true
    }));
    
    // Debounced server validation (more comprehensive)
    validationTimeoutRef.current = setTimeout(async () => {
      try {
        const draggedDuration = new Date(draggedSlot.endTime).getTime() - new Date(draggedSlot.startTime).getTime();
        const newEndTime = new Date(newStartTime.getTime() + draggedDuration);
        
        const tempSlot: ScheduleSlot = {
          ...draggedSlot,
          startTime: newStartTime,
          endTime: newEndTime,
          machineId: newMachineId
        };
        
        const response = await apiRequest("POST", "/api/schedule/validate", { slots: [tempSlot] });
        const serverConflicts = await response.json();
        
        setDragState(prev => ({
          ...prev,
          dragConflicts: [...localConflicts, ...serverConflicts],
          isValidating: false
        }));
      } catch (error) {
        console.warn('Drag validation failed:', error);
        setDragState(prev => ({
          ...prev,
          isValidating: false
        }));
      }
    }, 300); // 300ms debounce
  }, [checkLocalOverlaps]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragState.isDragging || !dragState.draggedSlot) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = event.clientX - rect.left - TIME_COLUMN_WIDTH;
    const currentY = event.clientY - rect.top - HEADER_HEIGHT;

    // Calculate new time from X position
    const newTime = timeScale.getTimeFromX(currentX);
    const snappedTime = snapToGrid(newTime);

    // Calculate new machine from Y position
    const machineIndex = Math.max(0, Math.min(machines.length - 1, Math.floor(currentY / LANE_HEIGHT)));
    const newMachineId = machines[machineIndex]?.id || dragState.originalMachine;

    setDragState(prev => ({
      ...prev,
      currentX: event.clientX - rect.left,
      currentY: event.clientY - rect.top,
      currentMachine: newMachineId,
      snapTime: snappedTime,
    }));
    
    // Validate new position
    if (snappedTime && dragState.draggedSlot) {
      validateDragPosition(dragState.draggedSlot, snappedTime, newMachineId);
    }
  }, [dragState.isDragging, dragState.draggedSlot, machines, timeScale, snapToGrid, validateDragPosition]);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    if (!dragState.isDragging || !dragState.draggedSlot || !dragState.snapTime) {
      setDragState(prev => ({ ...prev, isDragging: false, draggedSlot: null }));
      return;
    }

    // Calculate new end time based on duration
    const originalDuration = new Date(dragState.draggedSlot.endTime).getTime() - new Date(dragState.draggedSlot.startTime).getTime();
    const newStartTime = dragState.snapTime;
    const newEndTime = new Date(newStartTime.getTime() + originalDuration);

    const updates: Partial<ScheduleSlot> = {
      startTime: newStartTime,
      endTime: newEndTime,
    };

    // If machine changed, update machine assignment
    if (dragState.currentMachine !== dragState.originalMachine) {
      updates.machineId = dragState.currentMachine;
    }

    // Apply update
    onSlotUpdate(dragState.draggedSlot.id, updates);

    setDragState({
      isDragging: false,
      draggedSlot: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      originalMachine: "",
      currentMachine: "",
      snapTime: null,
      dragConflicts: [],
      isValidating: false,
    });
    
    // Clear any pending validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Release pointer capture
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  }, [dragState, onSlotUpdate]);

  // Handle slot selection
  const handleSlotClick = useCallback((slot: ScheduleSlot, event: React.MouseEvent) => {
    if (dragState.isDragging) return;
    
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      if (selectedSlots.includes(slot.id)) {
        onSelectionChange(selectedSlots.filter(id => id !== slot.id));
      } else {
        onSelectionChange([...selectedSlots, slot.id]);
      }
    } else {
      // Single select
      onSelectionChange([slot.id]);
    }
  }, [selectedSlots, onSelectionChange, dragState.isDragging]);

  // Clear selection when clicking on empty space
  const handleContainerClick = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Get conflicts for a specific slot
  const getSlotConflicts = useCallback((slotId: string) => {
    return conflicts.filter(conflict => 
      conflict.affectedOperations && conflict.affectedOperations.includes(slotId)
    );
  }, [conflicts]);

  return (
    <div 
      ref={containerRef}
      className="relative h-full bg-gray-50 overflow-auto border rounded-lg"
      onClick={handleContainerClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Timeline Header */}
      <TimelineHeader
        timeScale={timeScale}
        viewMode={viewMode}
        className="sticky top-0 z-10 bg-white border-b"
        style={{ height: HEADER_HEIGHT, paddingLeft: TIME_COLUMN_WIDTH }}
      />

      {/* Machine Lanes */}
      <div className="relative">
        <MachineLanes
          machines={machines}
          laneHeight={LANE_HEIGHT}
          timeColumnWidth={TIME_COLUMN_WIDTH}
          totalWidth={timeScale.totalWidth}
        />

        {/* Schedule Slots */}
        {scheduleSlots.map((slot) => {
          const position = getSlotPosition(slot);
          const slotConflicts = getSlotConflicts(slot.id);
          const isSelected = selectedSlots.includes(slot.id);
          const isDraggedSlot = dragState.draggedSlot?.id === slot.id;

          if (isDraggedSlot && dragState.isDragging) {
            return null; // Hide original slot while dragging
          }

          return (
            <div
              key={slot.id}
              className={`absolute rounded shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? "border-blue-500 ring-2 ring-blue-200" 
                  : "border-transparent hover:border-gray-300"
              } ${
                slot.locked 
                  ? "cursor-not-allowed opacity-75" 
                  : "hover:shadow-md"
              } ${
                slotConflicts.length > 0 
                  ? "border-red-500 bg-red-50" 
                  : ""
              }`}
              style={{
                left: TIME_COLUMN_WIDTH + position.x,
                top: HEADER_HEIGHT + position.y + 5,
                width: Math.max(position.width, 20),
                height: position.height,
                backgroundColor: slot.color || "#3B82F6",
                color: "white",
                zIndex: isSelected ? 20 : 10,
              }}
              onPointerDown={(e) => handlePointerDown(e, slot)}
              onClick={(e) => handleSlotClick(slot, e)}
              data-testid={`task-bar-${slot.id}`}
            >
              <div className="p-2 h-full flex items-center justify-between text-xs font-medium truncate">
                <span className="truncate">WO-{slot.workOrderId.slice(-4)}</span>
                {slot.locked && <span>🔒</span>}
              </div>

              {/* Conflict indicators */}
              {slotConflicts.length > 0 && (
                <ConflictBadge
                  conflicts={slotConflicts}
                  className="absolute -top-1 -right-1"
                />
              )}
            </div>
          );
        })}

        {/* Now marker */}
        <NowMarker 
          timeScale={timeScale}
          viewMode={viewMode}
          offsetLeft={TIME_COLUMN_WIDTH}
          height={machines.length * LANE_HEIGHT}
        />

        {/* Drag layer */}
        {dragState.isDragging && dragState.draggedSlot && (
          <DragLayer
            slot={dragState.draggedSlot}
            position={{
              x: dragState.currentX,
              y: dragState.currentY,
            }}
            snapTime={dragState.snapTime}
            targetMachine={machines.find(m => m.id === dragState.currentMachine)}
            conflicts={dragState.dragConflicts}
            isValidating={dragState.isValidating}
          />
        )}
      </div>
    </div>
  );
}