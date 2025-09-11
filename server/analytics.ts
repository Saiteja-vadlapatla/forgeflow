import {
  type AnalyticsKPIs, type OEEBreakdown, type AdherenceMetrics, 
  type UtilizationMetrics, type QualitySummary, type TrendPoint, 
  type ParetoItem, type MachineOEESnapshot, type AnalyticsFilters,
  type Machine, type WorkOrder, type ProductionLog, type DowntimeEvent,
  type QualityRecord, type ScheduleSlot, type OperatorSession
} from "@shared/schema";

export class AnalyticsEngine {
  /**
   * Calculate OEE (Overall Equipment Effectiveness) for a machine
   * OEE = Availability × Performance × Quality
   */
  static calculateOEE(
    machine: Machine,
    productionLogs: ProductionLog[],
    downtimeEvents: DowntimeEvent[],
    qualityRecords: QualityRecord[],
    scheduleSlots: ScheduleSlot[],
    period: { from: Date; to: Date }
  ): OEEBreakdown {
    // Calculate Availability = (Planned Production Time - Unplanned Downtime) / Planned Production Time
    const plannedRuntime = this.calculatePlannedRuntime(scheduleSlots, period);
    const unplannedDowntime = this.calculateUnplannedDowntime(downtimeEvents, period);
    const actualRuntime = plannedRuntime - unplannedDowntime;
    const availability = plannedRuntime > 0 ? (actualRuntime / plannedRuntime) : 0;

    // Calculate Performance = (Ideal Cycle Time × Total Count) / Run Time
    const { idealCycleTime, actualCycleTime, totalParts } = this.calculatePerformanceMetrics(
      productionLogs, 
      period
    );
    const performance = actualCycleTime > 0 && idealCycleTime > 0 
      ? (idealCycleTime * totalParts) / (actualCycleTime * totalParts) 
      : 0;

    // Calculate Quality = Good Count / Total Count
    const { goodParts, scrapParts } = this.calculateQualityMetrics(qualityRecords, period);
    const quality = totalParts > 0 ? goodParts / totalParts : 0;

    // Calculate setup time from downtime events
    const setupTime = this.calculateSetupTime(downtimeEvents, period);

    const oeeScore = availability * performance * quality;

    return {
      machineId: machine.id,
      machineName: machine.name,
      availability: Math.round(availability * 10000) / 100, // Convert to percentage with 2 decimals
      performance: Math.round(performance * 10000) / 100,
      quality: Math.round(quality * 10000) / 100,
      oeeScore: Math.round(oeeScore * 10000) / 100,
      plannedRuntime,
      actualRuntime,
      unplannedDowntime,
      setupTime,
      idealCycleTime,
      actualCycleTime,
      totalParts,
      goodParts,
      scrapParts,
      period: `${period.from.toISOString().split('T')[0]} to ${period.to.toISOString().split('T')[0]}`
    };
  }

  /**
   * Calculate schedule adherence metrics
   */
  static calculateScheduleAdherence(
    workOrders: WorkOrder[],
    scheduleSlots: ScheduleSlot[],
    period: { from: Date; to: Date }
  ): AdherenceMetrics[] {
    return workOrders
      .filter(wo => 
        wo.actualStartDate && 
        wo.actualStartDate >= period.from && 
        wo.actualStartDate <= period.to
      )
      .map(workOrder => {
        const plannedStart = workOrder.plannedStartDate || new Date();
        const actualStart = workOrder.actualStartDate || new Date();
        const plannedEnd = workOrder.plannedEndDate || new Date();
        const actualEnd = workOrder.actualEndDate || new Date();

        const delayMinutes = Math.max(0, 
          (actualStart.getTime() - plannedStart.getTime()) / (1000 * 60)
        );

        const toleranceMinutes = 30; // 30-minute tolerance
        const isOnTime = Math.abs(actualStart.getTime() - plannedStart.getTime()) <= toleranceMinutes * 60 * 1000;
        const isEarly = actualStart < plannedStart;
        const isLate = actualStart > new Date(plannedStart.getTime() + toleranceMinutes * 60 * 1000);

        // Calculate adherence score based on timing accuracy
        let adherenceScore = 100;
        if (delayMinutes > 0) {
          adherenceScore = Math.max(0, 100 - (delayMinutes / 60) * 10); // Reduce 10% per hour of delay
        }

        return {
          workOrderId: workOrder.id,
          partNumber: workOrder.partNumber,
          plannedStartDate: plannedStart,
          actualStartDate: actualStart,
          plannedEndDate: plannedEnd,
          actualEndDate: actualEnd,
          adherenceScore: Math.round(adherenceScore * 100) / 100,
          delayMinutes: Math.round(delayMinutes),
          isEarly,
          isOnTime,
          isLate,
          machineId: workOrder.assignedMachineId || '',
          operatorId: workOrder.operatorId || ''
        };
      });
  }

  /**
   * Calculate utilization metrics for machines
   */
  static calculateUtilizationMetrics(
    machines: Machine[],
    productionLogs: ProductionLog[],
    downtimeEvents: DowntimeEvent[],
    operatorSessions: OperatorSession[],
    period: { from: Date; to: Date }
  ): UtilizationMetrics[] {
    const periodHours = (period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60);

    return machines.map(machine => {
      const machineLogs = productionLogs.filter(log => 
        log.machineId === machine.id &&
        log.timestamp >= period.from &&
        log.timestamp <= period.to
      );

      const machineDowntime = downtimeEvents.filter(event =>
        event.machineId === machine.id &&
        event.startTime >= period.from &&
        event.startTime <= period.to
      );

      const machineSessions = operatorSessions.filter(session =>
        session.machineId === machine.id &&
        session.sessionStart >= period.from &&
        session.sessionStart <= period.to
      );

      // Calculate time metrics
      const totalAvailableTime = periodHours * 60; // in minutes
      const downtime = machineDowntime.reduce((sum, event) => sum + (event.duration || 0), 0);
      const setupTime = machineSessions.reduce((sum, session) => sum + (session.setupTime || 0), 0);
      const runTime = machineSessions.reduce((sum, session) => sum + (session.runTime || 0), 0);
      const productiveTime = runTime;
      const idleTime = Math.max(0, totalAvailableTime - productiveTime - setupTime - downtime);

      const utilizationRate = totalAvailableTime > 0 ? (productiveTime / totalAvailableTime) * 100 : 0;
      const efficiency = machine.efficiency || 0;

      // Calculate MTBF and MTTR
      const failures = machineDowntime.filter(event => 
        event.reason === 'breakdown' || event.reason === 'equipment_failure'
      );
      const mtbf = failures.length > 0 ? (productiveTime / 60) / failures.length : 0; // hours
      const mttr = failures.length > 0 
        ? failures.reduce((sum, f) => sum + (f.duration || 0), 0) / (60 * failures.length) 
        : 0; // hours

      return {
        machineId: machine.id,
        machineName: machine.name,
        totalAvailableTime,
        productiveTime,
        setupTime,
        downtime,
        idleTime,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        efficiency: Math.round(efficiency * 100) / 100,
        mtbf: Math.round(mtbf * 100) / 100,
        mttr: Math.round(mttr * 100) / 100,
        period: `${period.from.toISOString().split('T')[0]} to ${period.to.toISOString().split('T')[0]}`
      };
    });
  }

  /**
   * Calculate quality summary and metrics
   */
  static calculateQualitySummary(
    qualityRecords: QualityRecord[],
    period: { from: Date; to: Date }
  ): QualitySummary {
    const periodRecords = qualityRecords.filter(record =>
      record.inspectionDate >= period.from &&
      record.inspectionDate <= period.to
    );

    const totalInspected = periodRecords.length;
    const totalPassed = periodRecords.filter(r => r.result === 'pass').length;
    const totalFailed = periodRecords.filter(r => r.result === 'fail').length;
    const totalRework = periodRecords.filter(r => r.result === 'rework').length;

    const firstPassYield = totalInspected > 0 ? (totalPassed / totalInspected) * 100 : 0;
    const scrapRate = totalInspected > 0 ? (totalFailed / totalInspected) * 100 : 0;
    const reworkRate = totalInspected > 0 ? (totalRework / totalInspected) * 100 : 0;

    // Generate Pareto analysis for defect types
    const defectCounts: Record<string, number> = {};
    periodRecords.forEach(record => {
      if (record.defectType) {
        defectCounts[record.defectType] = (defectCounts[record.defectType] || 0) + 1;
      }
    });

    const topDefectTypes = this.generateParetoAnalysis(defectCounts);

    // Generate quality trend (daily FPY)
    const qualityTrend = this.generateQualityTrend(periodRecords, period);

    return {
      totalInspected,
      totalPassed,
      totalFailed,
      totalRework,
      firstPassYield: Math.round(firstPassYield * 100) / 100,
      scrapRate: Math.round(scrapRate * 100) / 100,
      reworkRate: Math.round(reworkRate * 100) / 100,
      topDefectTypes,
      qualityTrend,
      period: `${period.from.toISOString().split('T')[0]} to ${period.to.toISOString().split('T')[0]}`
    };
  }

  /**
   * Calculate comprehensive analytics KPIs
   */
  static calculateAnalyticsKPIs(
    machines: Machine[],
    workOrders: WorkOrder[],
    productionLogs: ProductionLog[],
    downtimeEvents: DowntimeEvent[],
    qualityRecords: QualityRecord[],
    scheduleSlots: ScheduleSlot[],
    operatorSessions: OperatorSession[],
    period: { from: Date; to: Date }
  ): AnalyticsKPIs {
    // Calculate overall OEE across all machines
    const oeeBreakdowns = machines.map(machine => 
      this.calculateOEE(
        machine,
        productionLogs.filter(log => log.machineId === machine.id),
        downtimeEvents.filter(event => event.machineId === machine.id),
        qualityRecords.filter(record => record.machineId === machine.id),
        scheduleSlots.filter(slot => slot.machineId === machine.id),
        period
      )
    );

    const oeeOverall = oeeBreakdowns.length > 0 
      ? oeeBreakdowns.reduce((sum, oee) => sum + oee.oeeScore, 0) / oeeBreakdowns.length 
      : 0;

    const availability = oeeBreakdowns.length > 0
      ? oeeBreakdowns.reduce((sum, oee) => sum + oee.availability, 0) / oeeBreakdowns.length
      : 0;

    const performance = oeeBreakdowns.length > 0
      ? oeeBreakdowns.reduce((sum, oee) => sum + oee.performance, 0) / oeeBreakdowns.length
      : 0;

    const quality = oeeBreakdowns.length > 0
      ? oeeBreakdowns.reduce((sum, oee) => sum + oee.quality, 0) / oeeBreakdowns.length
      : 0;

    // Calculate schedule adherence
    const adherenceMetrics = this.calculateScheduleAdherence(workOrders, scheduleSlots, period);
    const scheduleAdherence = adherenceMetrics.length > 0
      ? adherenceMetrics.reduce((sum, metric) => sum + metric.adherenceScore, 0) / adherenceMetrics.length
      : 0;

    // Calculate utilization rate
    const utilizationMetrics = this.calculateUtilizationMetrics(
      machines, productionLogs, downtimeEvents, operatorSessions, period
    );
    const utilizationRate = utilizationMetrics.length > 0
      ? utilizationMetrics.reduce((sum, metric) => sum + metric.utilizationRate, 0) / utilizationMetrics.length
      : 0;

    // Calculate quality metrics
    const qualitySummary = this.calculateQualitySummary(qualityRecords, period);
    const scrapRate = qualitySummary.scrapRate;
    const firstPassYield = qualitySummary.firstPassYield;

    // Calculate throughput rate (parts per hour)
    const totalParts = productionLogs.reduce((sum, log) => sum + log.quantityProduced, 0);
    const periodHours = (period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60);
    const throughputRate = periodHours > 0 ? totalParts / periodHours : 0;

    // Calculate planned vs actual hours
    const plannedHours = workOrders.reduce((sum, wo) => sum + (wo.estimatedHours || 0), 0);
    const actualHours = workOrders.reduce((sum, wo) => sum + (wo.actualHours || 0), 0);
    const plannedVsActualHours = plannedHours > 0 ? (actualHours / plannedHours) * 100 : 0;

    // Determine trends (simplified - in real implementation, this would compare with previous periods)
    const cycleTrend: 'up' | 'down' | 'stable' = 'stable';
    const qualityTrend: 'improving' | 'declining' | 'stable' = 'stable';

    return {
      period: `${period.from.toISOString().split('T')[0]} to ${period.to.toISOString().split('T')[0]}`,
      oeeOverall: Math.round(oeeOverall * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      performance: Math.round(performance * 100) / 100,
      quality: Math.round(quality * 100) / 100,
      scheduleAdherence: Math.round(scheduleAdherence * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      firstPassYield: Math.round(firstPassYield * 100) / 100,
      scrapRate: Math.round(scrapRate * 100) / 100,
      throughputRate: Math.round(throughputRate * 100) / 100,
      plannedVsActualHours: Math.round(plannedVsActualHours * 100) / 100,
      cycleTrend,
      qualityTrend,
      timestamp: new Date(),
      mtbf: utilizationMetrics.length > 0 ? utilizationMetrics.reduce((sum, m) => sum + m.mtbf, 0) / utilizationMetrics.length : 0,
      mttr: utilizationMetrics.length > 0 ? utilizationMetrics.reduce((sum, m) => sum + m.mttr, 0) / utilizationMetrics.length : 0,
      machineOEESnapshots: this.getRealtimeMachineOEE(machines, productionLogs, downtimeEvents, qualityRecords, workOrders),
      trendData: {
        oee: this.generateTrendData(oeeBreakdowns.map(oee => ({ timestamp: new Date(), value: oee.oeeScore }))),
        quality: qualitySummary.qualityTrend,
        utilization: this.generateTrendData(utilizationMetrics.map(util => ({ timestamp: new Date(), value: util.utilizationRate }))),
        adherence: this.generateTrendData(adherenceMetrics.map(adh => ({ timestamp: new Date(), value: adh.adherenceScore })))
      },
      topDowntimeReasons: this.generateDowntimePareto(downtimeEvents, period),
      topDefectTypes: qualitySummary.topDefectTypes,
      bottleneckMachines: machines.filter(m => m.efficiency && m.efficiency < 70).map(m => m.id),
      criticalWorkOrders: workOrders.filter(wo => wo.priority === 'urgent' || wo.priority === 'high').map(wo => wo.id)
    };
  }

  /**
   * Generate machine OEE snapshots for real-time monitoring
   */
  static getRealtimeMachineOEE(
    machines: Machine[],
    productionLogs: ProductionLog[],
    downtimeEvents: DowntimeEvent[],
    qualityRecords: QualityRecord[],
    workOrders: WorkOrder[]
  ): MachineOEESnapshot[] {
    const now = new Date();
    const shiftStart = new Date(now);
    shiftStart.setHours(8, 0, 0, 0); // Assume 8 AM shift start

    return machines.map(machine => {
      const currentWorkOrder = workOrders.find(wo => wo.assignedMachineId === machine.id && wo.status === 'in_progress');
      
      // Calculate current shift OEE
      const oeeBreakdown = this.calculateOEE(
        machine,
        productionLogs.filter(log => log.machineId === machine.id),
        downtimeEvents.filter(event => event.machineId === machine.id),
        qualityRecords.filter(record => record.machineId === machine.id),
        [], // No schedule slots for real-time calculation
        { from: shiftStart, to: now }
      );

      return {
        machineId: machine.id,
        machineName: machine.name,
        status: machine.status,
        currentOEE: oeeBreakdown.oeeScore,
        availability: oeeBreakdown.availability,
        performance: oeeBreakdown.performance,
        quality: oeeBreakdown.quality,
        currentWorkOrderId: currentWorkOrder?.id,
        partNumber: currentWorkOrder?.partNumber,
        cycleProgress: currentWorkOrder 
          ? ((currentWorkOrder.completedQuantity || 0) / currentWorkOrder.quantity) * 100 
          : undefined,
        lastUpdated: now
      };
    });
  }

  // Helper methods

  private static calculatePlannedRuntime(scheduleSlots: ScheduleSlot[], period: { from: Date; to: Date }): number {
    return scheduleSlots
      .filter(slot => slot.startTime >= period.from && slot.endTime <= period.to)
      .reduce((sum, slot) => {
        const duration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
        return sum + duration;
      }, 0);
  }

  private static calculateUnplannedDowntime(downtimeEvents: DowntimeEvent[], period: { from: Date; to: Date }): number {
    return downtimeEvents
      .filter(event => 
        event.startTime >= period.from && 
        event.startTime <= period.to &&
        event.reason !== 'setup' && // Exclude planned setup time
        event.reason !== 'maintenance' // Exclude planned maintenance
      )
      .reduce((sum, event) => sum + (event.duration || 0), 0);
  }

  private static calculateSetupTime(downtimeEvents: DowntimeEvent[], period: { from: Date; to: Date }): number {
    return downtimeEvents
      .filter(event => 
        event.startTime >= period.from && 
        event.startTime <= period.to &&
        event.reason === 'setup'
      )
      .reduce((sum, event) => sum + (event.duration || 0), 0);
  }

  private static calculatePerformanceMetrics(productionLogs: ProductionLog[], period: { from: Date; to: Date }) {
    const periodLogs = productionLogs.filter(log =>
      log.timestamp >= period.from && log.timestamp <= period.to
    );

    const totalParts = periodLogs.reduce((sum, log) => sum + log.quantityProduced, 0);
    const totalCycleTime = periodLogs.reduce((sum, log) => sum + (log.cycleTime || 0), 0);
    const actualCycleTime = periodLogs.length > 0 ? totalCycleTime / periodLogs.length : 0;
    
    // Ideal cycle time would typically come from work order or machine specifications
    // For this example, we'll assume 90% of actual is ideal
    const idealCycleTime = actualCycleTime * 0.9;

    return { idealCycleTime, actualCycleTime, totalParts };
  }

  private static calculateQualityMetrics(qualityRecords: QualityRecord[], period: { from: Date; to: Date }) {
    const periodRecords = qualityRecords.filter(record =>
      record.inspectionDate >= period.from && record.inspectionDate <= period.to
    );

    const goodParts = periodRecords.filter(record => record.result === 'pass').length;
    const scrapParts = periodRecords.filter(record => record.result === 'fail').length;

    return { goodParts, scrapParts };
  }

  private static generateParetoAnalysis(data: Record<string, number>): ParetoItem[] {
    const sorted = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10

    const total = sorted.reduce((sum, [, count]) => sum + count, 0);
    let cumulative = 0;

    return sorted.map(([category, value]) => {
      const percentage = total > 0 ? (value / total) * 100 : 0;
      cumulative += percentage;
      
      return {
        category,
        value,
        percentage: Math.round(percentage * 100) / 100,
        cumulativePercentage: Math.round(cumulative * 100) / 100
      };
    });
  }

  private static generateQualityTrend(qualityRecords: QualityRecord[], period: { from: Date; to: Date }): TrendPoint[] {
    const dailyData: Record<string, { total: number; passed: number }> = {};

    qualityRecords.forEach(record => {
      const day = record.inspectionDate.toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = { total: 0, passed: 0 };
      }
      dailyData[day].total++;
      if (record.result === 'pass') {
        dailyData[day].passed++;
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        timestamp: new Date(date),
        value: data.total > 0 ? (data.passed / data.total) * 100 : 0,
        label: date
      }));
  }

  // Additional helper methods
  private static generateTrendData(data: Array<{ timestamp: Date; value: number }>): TrendPoint[] {
    return data.map(item => ({
      timestamp: item.timestamp,
      value: item.value,
      label: item.timestamp.toISOString().split('T')[0]
    }));
  }

  private static generateDowntimePareto(downtimeEvents: DowntimeEvent[], period: { from: Date; to: Date }): ParetoItem[] {
    const reasonCounts: Record<string, number> = {};
    
    downtimeEvents
      .filter(event => 
        event.startTime >= period.from && 
        event.startTime <= period.to
      )
      .forEach(event => {
        const duration = event.duration || 0;
        reasonCounts[event.reason] = (reasonCounts[event.reason] || 0) + duration;
      });

    return this.generateParetoAnalysis(reasonCounts);
  }
}