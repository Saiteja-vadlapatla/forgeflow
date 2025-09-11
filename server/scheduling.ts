import { 
  Operation, WorkOrder, Machine, ScheduleSlot, CapacityBucket, 
  SetupMatrix, Calendar, MachineCapability, ShiftDefinition,
  SchedulingPolicy, SchedulingConflict, InsertScheduleSlot,
  InsertCapacityBucket
} from "@shared/schema";

// Industry-standard scheduling algorithms implementation
export class ProductionScheduler {
  
  // Input validation for scheduling parameters
  static validateSchedulingInputs(
    operations: Operation[],
    workOrders: WorkOrder[],
    machines: Machine[],
    capabilities: MachineCapability[],
    calendar: Calendar,
    policy: SchedulingPolicy
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate operations
    if (!operations || operations.length === 0) {
      errors.push('No operations provided for scheduling');
    }
    
    // Validate work orders
    if (!workOrders || workOrders.length === 0) {
      errors.push('No work orders provided for scheduling');
    }
    
    // Validate machines
    if (!machines || machines.length === 0) {
      errors.push('No machines available for scheduling');
    }
    
    // Validate machine capabilities
    if (!capabilities || capabilities.length === 0) {
      errors.push('No machine capabilities defined');
    }
    
    // Validate calendar
    if (!calendar || !calendar.shifts || (calendar.shifts as any[]).length === 0) {
      errors.push('Invalid calendar: no shifts defined');
    }
    
    const shifts = calendar.shifts as ShiftDefinition[];
    for (const shift of shifts) {
      if (!shift.startTime || !shift.endTime) {
        errors.push(`Invalid shift definition: ${shift.name || 'unnamed shift'}`);
      }
    }
    
    // Validate policy
    if (!policy || !policy.rule) {
      errors.push('Invalid scheduling policy: no rule specified');
    }
    
    const validRules = ['EDD', 'SPT', 'CR', 'FIFO', 'PRIORITY'];
    if (!validRules.includes(policy.rule)) {
      errors.push(`Invalid scheduling rule: ${policy.rule}`);
    }
    
    if (policy.horizon !== undefined && policy.horizon <= 0) {
      errors.push('Planning horizon must be positive');
    }
    
    if (policy.maxOverloadPercentage !== undefined && policy.maxOverloadPercentage < 0) {
      errors.push('Max overload percentage cannot be negative');
    }
    
    // Cross-validation
    const workOrderIds = new Set(workOrders.map(wo => wo.id));
    const invalidOperations = operations.filter(op => !workOrderIds.has(op.workOrderId));
    if (invalidOperations.length > 0) {
      errors.push(`Operations found with invalid work order IDs: ${invalidOperations.map(op => op.id).join(', ')}`);
    }
    
    const machineIds = new Set(machines.map(m => m.id));
    const invalidCapabilities = capabilities.filter(cap => !machineIds.has(cap.machineId));
    if (invalidCapabilities.length > 0) {
      errors.push(`Capabilities found for non-existent machines: ${invalidCapabilities.map(cap => cap.machineId).join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Validate operation dependencies for circular references
  static validateOperationDependencies(operations: Operation[]): { isValid: boolean; cycles: string[] } {
    const cycles: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (opId: string, operationMap: Map<string, Operation>) => {
      if (visiting.has(opId)) {
        cycles.push(`Circular dependency detected involving operation ${opId}`);
        return;
      }
      
      if (visited.has(opId)) {
        return;
      }
      
      const operation = operationMap.get(opId);
      if (!operation) return;
      
      visiting.add(opId);
      
      const successors = (operation.successorOperationIds as string[]) || [];
      successors.forEach(succId => visit(succId, operationMap));
      
      visiting.delete(opId);
      visited.add(opId);
    };
    
    const operationMap = new Map(operations.map(op => [op.id, op]));
    operations.forEach(op => visit(op.id, operationMap));
    
    return {
      isValid: cycles.length === 0,
      cycles
    };
  }
  
  // Safe division with fallback
  static safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
    if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) {
      return fallback;
    }
    return numerator / denominator;
  }
  
  // Enhanced operation dependency tracking
  static buildOperationDependencyGraph(operations: Operation[]): Map<string, { predecessors: Set<string>, successors: Set<string> }> {
    const dependencyGraph = new Map<string, { predecessors: Set<string>, successors: Set<string> }>();
    
    // Initialize graph
    operations.forEach(op => {
      dependencyGraph.set(op.id, {
        predecessors: new Set<string>(),
        successors: new Set<string>()
      });
    });
    
    // Build dependency relationships
    operations.forEach(op => {
      const predecessorIds = (op.predecessorOperationIds as string[]) || [];
      const successorIds = (op.successorOperationIds as string[]) || [];
      
      const opNode = dependencyGraph.get(op.id)!;
      
      for (const predId of predecessorIds) {
        if (dependencyGraph.has(predId)) {
          opNode.predecessors.add(predId);
          dependencyGraph.get(predId)!.successors.add(op.id);
        }
      }
      
      for (const succId of successorIds) {
        if (dependencyGraph.has(succId)) {
          opNode.successors.add(succId);
          dependencyGraph.get(succId)!.predecessors.add(op.id);
        }
      }
    });
    
    return dependencyGraph;
  }
  
  // Topological sort for operation scheduling
  static topologicalSort(operations: Operation[], dependencyGraph: Map<string, { predecessors: Set<string>, successors: Set<string> }>): Operation[] {
    const sortedOps: Operation[] = [];
    const remainingOps = new Map(operations.map(op => [op.id, op]));
    const inDegree = new Map<string, number>();
    
    // Calculate in-degrees
    operations.forEach(op => {
      inDegree.set(op.id, dependencyGraph.get(op.id)?.predecessors.size || 0);
    });
    
    // Process operations with no dependencies first
    const queue: string[] = [];
    operations.forEach(op => {
      if (inDegree.get(op.id) === 0) {
        queue.push(op.id);
      }
    });
    
    while (queue.length > 0) {
      const currentOpId = queue.shift()!;
      const currentOp = remainingOps.get(currentOpId);
      if (currentOp) {
        sortedOps.push(currentOp);
        remainingOps.delete(currentOpId);
        
        // Reduce in-degree for successor operations
        const successors = dependencyGraph.get(currentOpId)?.successors || new Set();
        for (const succId of Array.from(successors)) {
          const currentInDegree = inDegree.get(succId) || 0;
          const newInDegree = currentInDegree - 1;
          inDegree.set(succId, newInDegree);
          
          if (newInDegree === 0 && remainingOps.has(succId)) {
            queue.push(succId);
          }
        }
      }
    }
    
    // If there are remaining operations, there's a cycle
    if (remainingOps.size > 0) {
      // For now, append remaining operations (in practice, this indicates a dependency cycle)
      console.warn('Circular dependency detected in operations:', Array.from(remainingOps.keys()));
      sortedOps.push(...Array.from(remainingOps.values()));
    }
    
    return sortedOps;
  }
  
  // Check if predecessor operations are completed
  static arePredecessorsCompleted(
    operation: Operation,
    dependencyGraph: Map<string, { predecessors: Set<string>, successors: Set<string> }>,
    scheduledOperations: Map<string, { endTime: Date }>
  ): boolean {
    const predecessors = dependencyGraph.get(operation.id)?.predecessors || new Set();
    
    for (const predId of Array.from(predecessors)) {
      if (!scheduledOperations.has(predId)) {
        return false;
      }
    }
    
    return true;
  }
  
  // Get earliest start time considering predecessor completion
  static getEarliestStartTime(
    operation: Operation,
    dependencyGraph: Map<string, { predecessors: Set<string>, successors: Set<string> }>,
    scheduledOperations: Map<string, { endTime: Date }>,
    transferTimeMinutes: number = 0
  ): Date {
    let earliestStart = new Date(); // Default to current time
    
    const predecessors = dependencyGraph.get(operation.id)?.predecessors || new Set();
    
    for (const predId of Array.from(predecessors)) {
      const scheduledPred = scheduledOperations.get(predId);
      if (scheduledPred) {
        const predEndWithTransfer = new Date(scheduledPred.endTime.getTime() + transferTimeMinutes * 60000);
        if (predEndWithTransfer > earliestStart) {
          earliestStart = predEndWithTransfer;
        }
      }
    }
    
    return earliestStart;
  }
  
  // Priority calculation methods for different scheduling rules
  static calculatePriority(
    operation: Operation, 
    workOrder: WorkOrder, 
    policy: SchedulingPolicy,
    planStartTime?: Date
  ): number {
    const referenceTime = planStartTime || new Date();
    
    switch (policy.rule) {
      case 'EDD': // Earliest Due Date
        if (!workOrder.plannedEndDate) return 999999;
        return new Date(workOrder.plannedEndDate).getTime() - referenceTime.getTime();
        
      case 'SPT': // Shortest Processing Time
        const totalTime = (operation.setupTimeMinutes || 0) + 
                          (operation.runTimeMinutesPerUnit || 0) * workOrder.quantity;
        return totalTime;
        
      case 'CR': // Critical Ratio
        if (!workOrder.plannedEndDate || !operation.runTimeMinutesPerUnit) return 999999;
        const timeRemaining = new Date(workOrder.plannedEndDate).getTime() - referenceTime.getTime();
        const workRemaining = operation.runTimeMinutesPerUnit * workOrder.quantity;
        return timeRemaining / (workRemaining * 60000); // Convert to milliseconds
        
      case 'PRIORITY':
        return workOrder.priority === 'urgent' ? 1 : 
               workOrder.priority === 'high' ? 2 :
               workOrder.priority === 'normal' ? 3 : 4;
               
      case 'FIFO':
      default:
        return new Date(workOrder.createdAt).getTime();
    }
  }

  // Find feasible machines for an operation based on capabilities
  static findFeasibleMachines(
    operation: Operation, 
    machines: Machine[], 
    capabilities: MachineCapability[]
  ): Machine[] {
    const feasibleMachines: Machine[] = [];
    
    for (const machine of machines) {
      const capability = capabilities.find(c => c.machineId === machine.id);
      if (!capability) continue;
      
      // Check if machine can handle this operation type
      const machineTypes = capability.machineTypes as string[];
      const operationTypes = operation.machineTypes as string[];
      
      if (machineTypes.some(type => operationTypes.includes(type))) {
        feasibleMachines.push(machine);
      }
    }
    
    return feasibleMachines;
  }

  // Calculate actual runtime considering machine efficiency and specifications
  static calculateAdjustedRuntime(
    operation: Operation,
    workOrder: WorkOrder,
    machine: Machine,
    machineCapability: MachineCapability
  ): number {
    try {
      const baseRuntime = (operation.runTimeMinutesPerUnit || 0) * workOrder.quantity;
      
      if (baseRuntime <= 0) {
        console.warn(`Invalid base runtime for operation ${operation.operationNumber}: ${baseRuntime}`);
        return 1; // Minimum 1 minute
      }
      
      const efficiency = Math.max(machineCapability.efficiency || machine.efficiency || 1.0, 0.01);
      
      // Apply efficiency factor (lower efficiency = longer runtime)
      const adjustedRuntime = this.safeDivide(baseRuntime, efficiency, baseRuntime);
      
      // Consider machine-specific constraints
      const operationTypes = (operation.machineTypes as string[]) || [];
      const machineTypes = (machineCapability.machineTypes as string[]) || [];
      
      // Apply penalty if machine is not optimal for this operation
      let efficiencyPenalty = 1.0;
      const isOptimal = operationTypes.some(opType => machineTypes.includes(opType));
      if (!isOptimal && operationTypes.length > 0 && machineTypes.length > 0) {
        efficiencyPenalty = 1.2; // 20% penalty for non-optimal assignment
      }
      
      const finalRuntime = Math.ceil(adjustedRuntime * efficiencyPenalty);
      return Math.max(finalRuntime, 1); // Ensure minimum 1 minute
      
    } catch (error) {
      console.error(`Error calculating runtime for operation ${operation.operationNumber}:`, error);
      return Math.max(Math.ceil((operation.runTimeMinutesPerUnit || 1) * workOrder.quantity), 1);
    }
  }
  
  // Calculate setup time between operations using setup matrix
  static calculateSetupTime(
    previousOperation: Operation | null,
    currentOperation: Operation,
    setupMatrix: SetupMatrix[],
    machineType: string
  ): number {
    if (!previousOperation) {
      return currentOperation.setupTimeMinutes || 0; // Initial setup
    }
    
    const setup = setupMatrix.find(s => 
      s.fromFamily === previousOperation.operationFamily &&
      s.toFamily === currentOperation.operationFamily &&
      s.machineType === machineType
    );
    
    return setup ? setup.changeoverMinutes : (currentOperation.setupTimeMinutes || 0);
  }

  // Check machine availability during a time window
  static isMachineAvailable(
    machineId: string,
    startTime: Date,
    endTime: Date,
    existingSlots: ScheduleSlot[],
    calendar: Calendar
  ): boolean {
    // Check existing schedule conflicts
    const conflicts = existingSlots.filter(slot => 
      slot.machineId === machineId &&
      slot.status !== 'cancelled' &&
      (
        (new Date(slot.startTime) <= startTime && new Date(slot.endTime) > startTime) ||
        (new Date(slot.startTime) < endTime && new Date(slot.endTime) >= endTime) ||
        (new Date(slot.startTime) >= startTime && new Date(slot.endTime) <= endTime)
      )
    );
    
    if (conflicts.length > 0) return false;
    
    // Check calendar availability
    return this.isTimeWithinWorkingHours(startTime, endTime, calendar);
  }

  // Enhanced time window checking that supports operations spanning multiple shifts
  static isTimeWithinWorkingHours(startTime: Date, endTime: Date, calendar: Calendar): boolean {
    const shifts = calendar.shifts as ShiftDefinition[];
    const workDays = calendar.workDays as number[];
    const exceptions = calendar.exceptions as any[];
    
    // Check each day the operation spans
    const currentDate = new Date(startTime);
    
    while (currentDate <= endTime) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if this day is a working day
      if (!workDays.includes(dayOfWeek)) {
        return false;
      }
      
      // Check for exceptions on this day
      if (exceptions.some(ex => ex.date === dateStr)) {
        return false;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
    
    return true; // All days are working days
  }
  
  // Check if a specific time window fits within available shifts for that day
  static fitsWithinShifts(
    startTime: Date,
    endTime: Date,
    calendar: Calendar,
    allowSpanningShifts: boolean = true
  ): boolean {
    const shifts = calendar.shifts as ShiftDefinition[];
    
    if (allowSpanningShifts) {
      // Operation can span multiple shifts - check if all time is covered
      return this.isTimeCoveredByShifts(startTime, endTime, shifts);
    } else {
      // Operation must fit within a single shift
      return this.fitsWithinSingleShift(startTime, endTime, shifts);
    }
  }
  
  // Check if time is covered by shifts (allowing spans)
  static isTimeCoveredByShifts(startTime: Date, endTime: Date, shifts: ShiftDefinition[]): boolean {
    const dateStr = startTime.toISOString().split('T')[0];
    
    // Convert shifts to actual Date objects for the specific day
    const shiftRanges = shifts.map(shift => {
      let shiftStart = new Date(`${dateStr}T${shift.startTime}:00`);
      let shiftEnd = new Date(`${dateStr}T${shift.endTime}:00`);
      
      // Handle overnight shifts
      if (shiftEnd <= shiftStart) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }
      
      return { start: shiftStart, end: shiftEnd };
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Check if the entire operation time is covered by shifts
    let coveredUntil = startTime;
    
    for (const shiftRange of shiftRanges) {
      if (shiftRange.start <= coveredUntil && shiftRange.end > coveredUntil) {
        coveredUntil = new Date(Math.min(shiftRange.end.getTime(), endTime.getTime()));
        if (coveredUntil >= endTime) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Check if operation fits within a single shift
  static fitsWithinSingleShift(startTime: Date, endTime: Date, shifts: ShiftDefinition[]): boolean {
    const dateStr = startTime.toISOString().split('T')[0];
    
    for (const shift of shifts) {
      let shiftStart = new Date(`${dateStr}T${shift.startTime}:00`);
      let shiftEnd = new Date(`${dateStr}T${shift.endTime}:00`);
      
      // Handle overnight shifts
      if (shiftEnd <= shiftStart) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }
      
      if (startTime >= shiftStart && endTime <= shiftEnd) {
        return true;
      }
    }
    
    return false;
  }

  // Enhanced Main scheduling algorithm - Forward Scheduling with Precedence and Priority Rules
  static async scheduleOperations(
    operations: Operation[],
    workOrders: WorkOrder[],
    machines: Machine[],
    capabilities: MachineCapability[],
    calendar: Calendar,
    setupMatrix: SetupMatrix[],
    policy: SchedulingPolicy,
    existingSlots: ScheduleSlot[] = [],
    planId: string = '',
    planStartTime?: Date
  ): Promise<{
    scheduleSlots: InsertScheduleSlot[],
    capacityBuckets: InsertCapacityBucket[],
    conflicts: SchedulingConflict[]
  }> {
    
    // Input validation
    const validation = this.validateSchedulingInputs(operations, workOrders, machines, capabilities, calendar, policy);
    if (!validation.isValid) {
      throw new Error(`Scheduling validation failed: ${validation.errors.join('; ')}`);
    }
    
    // Validate operation dependencies
    const dependencyValidation = this.validateOperationDependencies(operations);
    if (!dependencyValidation.isValid) {
      console.warn('Dependency validation warnings:', dependencyValidation.cycles);
    }
    
    try {
    const scheduleSlots: InsertScheduleSlot[] = [];
    const capacityBuckets: InsertCapacityBucket[] = [];
    const conflicts: SchedulingConflict[] = [];
    const machineLastOperations: Map<string, Operation> = new Map();
    const scheduledOperations: Map<string, { endTime: Date, machineId: string }> = new Map();
    
    // Build operation dependency graph
    const dependencyGraph = this.buildOperationDependencyGraph(operations);
    
    // Sort operations considering both dependencies and priority
    const workOrderMap = new Map(workOrders.map(wo => [wo.id, wo]));
    
    // First, get topologically sorted operations (respecting dependencies)
    const topologicallySorted = this.topologicalSort(operations, dependencyGraph);
    
    // Then sort by priority within dependency constraints
    // Group operations by "batch" - operations that have no dependencies on each other
    const operationBatches = this.groupOperationsByBatch(topologicallySorted, dependencyGraph);
    
    const sortedOperations: Operation[] = [];
    operationBatches.forEach(batch => {
      // Sort each batch by priority
      const sortedBatch = batch.sort((a, b) => {
        const woA = workOrderMap.get(a.workOrderId);
        const woB = workOrderMap.get(b.workOrderId);
        if (!woA || !woB) return 0;
        
        const priorityA = this.calculatePriority(a, woA, policy, planStartTime);
        const priorityB = this.calculatePriority(b, woB, policy, planStartTime);
        return priorityA - priorityB;
      });
      sortedOperations.push(...sortedBatch);
    });

    // Schedule each operation
    for (const operation of sortedOperations) {
      const workOrder = workOrderMap.get(operation.workOrderId);
      if (!workOrder) continue;
      
      // Check if predecessors are completed
      if (!this.arePredecessorsCompleted(operation, dependencyGraph, scheduledOperations)) {
        conflicts.push({
          type: 'precedence_violation',
          severity: 'critical',
          description: `Operation ${operation.operationNumber} scheduled before its predecessors`,
          affectedOperations: [operation.id],
          suggestedResolution: 'Check operation dependencies and scheduling order'
        });
        continue;
      }
      
      // Find feasible machines
      const feasibleMachines = this.findFeasibleMachines(operation, machines, capabilities);
      if (feasibleMachines.length === 0) {
        conflicts.push({
          type: 'resource_conflict',
          severity: 'high',
          description: `No feasible machines found for operation ${operation.operationNumber}`,
          affectedOperations: [operation.id],
          suggestedResolution: 'Check machine capabilities or operation requirements'
        });
        continue;
      }

      // Get earliest start time considering predecessors
      const predecessorConstrainedStart = this.getEarliestStartTime(
        operation,
        dependencyGraph,
        scheduledOperations,
        10 // 10 minutes transfer time between operations
      );
      
      // Try to schedule on each feasible machine (earliest finish time)
      let bestSchedule: {
        machine: Machine,
        startTime: Date,
        endTime: Date,
        setupTime: number,
        runTime: number,
        capability: MachineCapability
      } | null = null;

      for (const machine of feasibleMachines) {
        const capability = capabilities.find(c => c.machineId === machine.id);
        if (!capability) continue;

        const lastOperation = machineLastOperations.get(machine.id) || null;
        const setupTime = this.calculateSetupTime(lastOperation, operation, setupMatrix, machine.type);
        const runTime = this.calculateAdjustedRuntime(operation, workOrder, machine, capability);
        const totalDuration = setupTime + runTime;
        
        // Find earliest available start time considering machine availability and predecessors
        const machineAvailableStart = this.findEarliestAvailableTime(
          machine.id,
          totalDuration,
          [...existingSlots, ...scheduleSlots.map(slot => ({
            ...slot,
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            updatedAt: new Date()
          } as ScheduleSlot))],
          calendar,
          policy.horizon || 168 // Default 1 week horizon
        );
        
        // Use the later of machine availability or predecessor constraint
        const startTime = new Date(Math.max(
          machineAvailableStart.getTime(),
          predecessorConstrainedStart.getTime()
        ));
        
        const endTime = new Date(startTime.getTime() + totalDuration * 60000);
        
        // Validate that the operation fits within working hours
        if (this.fitsWithinShifts(startTime, endTime, calendar, true)) {
          if (!bestSchedule || endTime < bestSchedule.endTime) {
            bestSchedule = { machine, startTime, endTime, setupTime, runTime, capability };
          }
        }
      }

      if (bestSchedule) {
        const scheduleSlot: InsertScheduleSlot = {
          planId: planId,
          workOrderId: operation.workOrderId,
          operationId: operation.id,
          machineId: bestSchedule.machine.id,
          startTime: bestSchedule.startTime,
          endTime: bestSchedule.endTime,
          setupMinutes: bestSchedule.setupTime,
          runMinutes: bestSchedule.runTime,
          quantity: workOrder.quantity,
          priority: this.calculatePriority(operation, workOrder, policy, planStartTime),
          schedulingRule: policy.rule,
          conflictFlags: [],
          status: 'scheduled'
        };
        
        scheduleSlots.push(scheduleSlot as any);
        machineLastOperations.set(bestSchedule.machine.id, operation);
        scheduledOperations.set(operation.id, {
          endTime: bestSchedule.endTime,
          machineId: bestSchedule.machine.id
        });
        
        // Check for overloading
        if (policy.allowOverload) {
          const overloadCheck = this.checkCapacityOverload(
            bestSchedule.machine.id,
            bestSchedule.startTime,
            bestSchedule.endTime,
            scheduleSlots,
            calendar
          );
          
          if (overloadCheck.isOverloaded && overloadCheck.percentage > (policy.maxOverloadPercentage || 20)) {
            conflicts.push({
              type: 'capacity_overload',
              severity: 'medium',
              description: `Machine ${bestSchedule.machine.name} overloaded by ${overloadCheck.percentage.toFixed(1)}%`,
              affectedOperations: [operation.id],
              suggestedResolution: 'Consider redistributing load or extending timeline'
            });
          }
        }
        
        // Check for deadline violations
        if (operation.dueDate && bestSchedule.endTime > new Date(operation.dueDate)) {
          conflicts.push({
            type: 'deadline_missed',
            severity: 'high',
            description: `Operation ${operation.operationNumber} scheduled to finish after due date`,
            affectedOperations: [operation.id],
            suggestedResolution: 'Consider increasing priority or reallocating resources'
          });
        }
      } else {
        conflicts.push({
          type: 'resource_conflict',
          severity: 'critical',
          description: `Unable to schedule operation ${operation.operationNumber} within constraints`,
          affectedOperations: [operation.id],
          suggestedResolution: 'Extend planning horizon or relax constraints'
        });
      }
    }

    // Generate capacity buckets
    const capacityBucketsMap = this.generateCapacityBuckets(scheduleSlots, machines, calendar);
    capacityBuckets.push(...Array.from(capacityBucketsMap.values()));

    return { scheduleSlots, capacityBuckets, conflicts };
    
    } catch (error) {
      console.error('Scheduling error:', error);
      throw new Error(`Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Group operations into batches that can be scheduled in parallel
  static groupOperationsByBatch(
    operations: Operation[],
    dependencyGraph: Map<string, { predecessors: Set<string>, successors: Set<string> }>
  ): Operation[][] {
    const batches: Operation[][] = [];
    const processed = new Set<string>();
    const remaining = [...operations];
    
    while (remaining.length > 0) {
      const currentBatch: Operation[] = [];
      
      // Find operations with no unprocessed dependencies
      const availableOps = remaining.filter(op => {
        const predecessors = dependencyGraph.get(op.id)?.predecessors || new Set();
        return Array.from(predecessors).every(predId => processed.has(predId));
      });
      
      if (availableOps.length === 0) {
        // Circular dependency or logic error - add remaining operations
        currentBatch.push(...remaining);
        remaining.length = 0;
      } else {
        currentBatch.push(...availableOps);
        availableOps.forEach(op => {
          processed.add(op.id);
          const index = remaining.indexOf(op);
          if (index > -1) remaining.splice(index, 1);
        });
      }
      
      batches.push(currentBatch);
    }
    
    return batches;
  }
  
  // Enhanced earliest available time finder with timeout protection
  static findEarliestAvailableTime(
    machineId: string,
    durationMinutes: number,
    existingSlots: (ScheduleSlot | InsertScheduleSlot)[],
    calendar: Calendar,
    planningHorizonHours: number = 168 // Default 1 week
  ): Date {
    const shifts = calendar.shifts as ShiftDefinition[];
    const now = new Date();
    const maxTime = new Date(now.getTime() + planningHorizonHours * 60 * 60 * 1000);
    
    // Start from current time, rounded to next 15-minute increment
    let candidateTime = new Date(now);
    candidateTime.setMinutes(Math.ceil(candidateTime.getMinutes() / 15) * 15, 0, 0);
    
    // Get machine's existing schedule
    const machineSlots = existingSlots
      .filter(slot => 
        slot.machineId === machineId && 
        slot.status !== 'cancelled' &&
        new Date(slot.endTime) > candidateTime
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    let iterationCount = 0;
    const maxIterations = (planningHorizonHours * 60) / 15; // 15-minute increments
    
    while (candidateTime <= maxTime && iterationCount < maxIterations) {
      iterationCount++;
      
      const endTime = new Date(candidateTime.getTime() + durationMinutes * 60000);
      
      // Skip if operation would extend beyond planning horizon
      if (endTime > maxTime) {
        break;
      }
      
      // Check if time window is within working hours
      if (this.isTimeWithinWorkingHours(candidateTime, endTime, calendar) &&
          this.fitsWithinShifts(candidateTime, endTime, calendar, true)) {
        
        // Check for conflicts with existing slots
        const hasConflict = machineSlots.some(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          return (slotStart < endTime && slotEnd > candidateTime);
        });
        
        if (!hasConflict) {
          return candidateTime;
        }
        
        // If there's a conflict, jump to the end of the conflicting slot
        const conflictingSlot = machineSlots.find(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          return (slotStart < endTime && slotEnd > candidateTime);
        });
        
        if (conflictingSlot) {
          candidateTime = new Date(conflictingSlot.endTime);
          // Round up to next 15-minute increment
          candidateTime.setMinutes(Math.ceil(candidateTime.getMinutes() / 15) * 15, 0, 0);
          continue;
        }
      }
      
      // Move to next 15-minute slot
      candidateTime = new Date(candidateTime.getTime() + 15 * 60000);
    }
    
    // If we couldn't find a time within the horizon, return the end of horizon
    console.warn(`Could not find available time for machine ${machineId} within planning horizon`);
    return maxTime;
  }

  // Check capacity overload for a machine during a time period
  static checkCapacityOverload(
    machineId: string,
    startTime: Date,
    endTime: Date,
    scheduleSlots: (ScheduleSlot | InsertScheduleSlot)[],
    calendar: Calendar
  ): { isOverloaded: boolean, percentage: number } {
    try {
      const shifts = calendar.shifts as ShiftDefinition[];
      
      if (!shifts || shifts.length === 0) {
        console.warn('No shifts defined in calendar for capacity check');
        return { isOverloaded: false, percentage: 0 };
      }
      
      const totalShiftMinutes = shifts.reduce((sum, shift) => {
        try {
          const start = new Date(`1970-01-01T${shift.startTime}:00`);
          const end = new Date(`1970-01-01T${shift.endTime}:00`);
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn(`Invalid shift times: ${shift.startTime} - ${shift.endTime}`);
            return sum;
          }
          
          const shiftMinutes = (end.getTime() - start.getTime()) / 60000;
          return sum + Math.max(shiftMinutes - (shift.breakMinutes || 0), 0);
        } catch (error) {
          console.warn(`Error processing shift ${shift.name}:`, error);
          return sum;
        }
      }, 0);
      
      if (totalShiftMinutes <= 0) {
        console.warn('Total available shift minutes is zero or negative');
        return { isOverloaded: false, percentage: 0 };
      }
      
      const date = startTime.toISOString().split('T')[0];
      const dayStart = new Date(date + 'T00:00:00');
      const dayEnd = new Date(date + 'T23:59:59');
      
      const daySlots = scheduleSlots.filter(slot => {
        try {
          return slot.machineId === machineId &&
                 new Date(slot.startTime) >= dayStart &&
                 new Date(slot.endTime) <= dayEnd;
        } catch (error) {
          console.warn('Error filtering day slots:', error);
          return false;
        }
      });
      
      const totalScheduledMinutes = daySlots.reduce((sum, slot) => {
        const setupMinutes = Math.max(slot.setupMinutes || 0, 0);
        const runMinutes = Math.max(slot.runMinutes || 0, 0);
        return sum + setupMinutes + runMinutes;
      }, 0);
      
      const utilizationPercentage = this.safeDivide(totalScheduledMinutes * 100, totalShiftMinutes, 0);
      
      return {
        isOverloaded: utilizationPercentage > 100,
        percentage: Math.round(utilizationPercentage * 100) / 100 // Round to 2 decimal places
      };
      
    } catch (error) {
      console.error('Error checking capacity overload:', error);
      return { isOverloaded: false, percentage: 0 };
    }
  }

  // Generate capacity buckets for visualization
  static generateCapacityBuckets(
    scheduleSlots: (ScheduleSlot | InsertScheduleSlot)[],
    machines: Machine[],
    calendar: Calendar
  ): Map<string, InsertCapacityBucket> {
    const buckets = new Map<string, InsertCapacityBucket>();
    const shifts = calendar.shifts as ShiftDefinition[];
    
    // Calculate daily available minutes
    const dailyAvailableMinutes = shifts.reduce((sum, shift) => {
      const start = new Date(`1970-01-01T${shift.startTime}:00`);
      const end = new Date(`1970-01-01T${shift.endTime}:00`);
      return sum + (end.getTime() - start.getTime()) / 60000 - shift.breakMinutes;
    }, 0);
    
    for (const machine of machines) {
      const machineSlots = scheduleSlots.filter(slot => slot.machineId === machine.id);
      
      // Group by date
      const dateGroups = new Map<string, (ScheduleSlot | InsertScheduleSlot)[]>();
      machineSlots.forEach(slot => {
        const date = new Date(slot.startTime).toISOString().split('T')[0];
        if (!dateGroups.has(date)) dateGroups.set(date, []);
        dateGroups.get(date)!.push(slot);
      });
      
      dateGroups.forEach((slots, date) => {
        const plannedMinutes = slots.reduce((sum, slot) => 
          sum + (slot.setupMinutes || 0) + slot.runMinutes, 0
        );
        const utilization = plannedMinutes / dailyAvailableMinutes;
        const isOverloaded = utilization > 1.0;
        
        const bucketKey = `${machine.id}-${date}`;
        buckets.set(bucketKey, {
          machineId: machine.id,
          date: new Date(date),
          availableMinutes: dailyAvailableMinutes,
          plannedMinutes,
          utilization,
          isOverloaded,
          overloadPercentage: isOverloaded ? (utilization - 1.0) * 100 : 0
        });
      });
    }
    
    return buckets;
  }
}