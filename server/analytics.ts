import {
  type AnalyticsKPIs, type OEEBreakdown, type AdherenceMetrics,
  type UtilizationMetrics, type QualitySummary, type TrendPoint,
  type ParetoItem, type MachineOEESnapshot, type AnalyticsFilters,
  type Machine, type WorkOrder, type ProductionLog, type DowntimeEvent,
  type QualityRecord, type ScheduleSlot, type OperatorSession
} from "@shared/schema";

// Import inventory transaction analytics types
import {
  type InventoryTransaction,
  type InventoryAnalyticsSummary,
  type AdjustmentTypeBreakdown,
  type ReasonAnalysis,
  type ReasonParetoItem,
  type UserActivityMetrics,
  type InventoryTypeMetrics,
  type InventoryTrendPoint,
  type CostImpactAnalysis,
  type CostRangeAnalysis,
  type InventoryAnomaly,
  type TurnoverEfficiency,
  type TurnoverItem,
  type StagnantItem
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

/**
 * InventoryTransactionAnalytics Class
 * Provides comprehensive analytics for inventory transaction data
 * Analyzes adjustment patterns, cost impacts, user behaviors, and operational insights
 */
export class InventoryTransactionAnalytics {
  /**
   * Calculate comprehensive inventory analytics summary
   */
  static calculateInventoryAnalyticsSummary(
    transactions: InventoryTransaction[],
    period: { from: Date; to: Date }
  ): InventoryAnalyticsSummary {
    // Filter transactions by period
    const periodTransactions = transactions.filter(t =>
      t.timestamp >= period.from && t.timestamp <= period.to
    );

    // Basic metrics
    const totalTransactions = periodTransactions.length;
    const totalAdjustments = periodTransactions.reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const totalCostImpact = periodTransactions.reduce((sum, t) => sum + (t.costImpact || 0), 0);

    // Adjustment type distribution
    const adjustmentTypes = this.calculateAdjustmentTypeDistribution(periodTransactions);

    // Reason analysis
    const reasonAnalysis = this.calculateReasonAnalysis(periodTransactions);

    // User activity metrics
    const userActivityMetrics = this.calculateUserActivityMetrics(periodTransactions);

    // Inventory type metrics
    const inventoryTypeMetrics = this.calculateInventoryTypeMetrics(periodTransactions);

    // Trend analysis
    const adjustmentTrends = this.calculateAdjustmentTrends(periodTransactions, period);

    // Cost impact analysis
    const costImpactAnalysis = this.calculateCostImpactAnalysis(periodTransactions);

    // Anomaly detection
    const anomalies = this.detectAnomalies(periodTransactions);

    // Turnover efficiency
    const turnoverEfficiency = this.calculateTurnoverEfficiency(periodTransactions);

    return {
      period: `${period.from.toISOString().split('T')[0]} to ${period.to.toISOString().split('T')[0]}`,
      totalTransactions,
      totalAdjustments,
      totalCostImpact: Math.round(totalCostImpact * 100) / 100,
      adjustmentTypes,
      reasonAnalysis,
      userActivityMetrics,
      inventoryTypeMetrics,
      adjustmentTrends,
      costImpactAnalysis,
      anomalies,
      turnoverEfficiency,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate adjustment type distribution (add/remove/set operations)
   */
  static calculateAdjustmentTypeDistribution(transactions: InventoryTransaction[]): AdjustmentTypeBreakdown[] {
    const typeCounts: Record<string, { count: number; totalQuantity: number; totalCost: number }> = {};

    transactions.forEach(t => {
      if (!typeCounts[t.adjustmentType]) {
        typeCounts[t.adjustmentType] = { count: 0, totalQuantity: 0, totalCost: 0 };
      }

      typeCounts[t.adjustmentType].count++;
      typeCounts[t.adjustmentType].totalQuantity += Math.abs(t.quantity);
      typeCounts[t.adjustmentType].totalCost += t.costImpact || 0;
    });

    return Object.entries(typeCounts).map(([type, data]) => ({
      adjustmentType: type,
      transactionCount: data.count,
      totalQuantity: Math.round(data.totalQuantity * 100) / 100,
      totalCost: Math.round(data.totalCost * 100) / 100,
      averageQuantity: Math.round((data.totalQuantity / data.count) * 100) / 100,
      averageCost: Math.round((data.totalCost / data.count) * 100) / 100
    }));
  }

  /**
   * Calculate reason analysis with Pareto distribution
   */
  static calculateReasonAnalysis(transactions: InventoryTransaction[]): ReasonAnalysis {
    const reasonCounts: Record<string, { count: number; totalQuantity: number; totalCost: number }> = {};

    transactions.forEach(t => {
      const reason = t.reason || 'Unknown';
      if (!reasonCounts[reason]) {
        reasonCounts[reason] = { count: 0, totalQuantity: 0, totalCost: 0 };
      }

      reasonCounts[reason].count++;
      reasonCounts[reason].totalQuantity += Math.abs(t.quantity);
      reasonCounts[reason].totalCost += t.costImpact || 0;
    });

    // Convert to Pareto items
    const items: ReasonParetoItem[] = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([reason, data]) => ({
        reason,
        transactionCount: data.count,
        totalQuantity: Math.round(data.totalQuantity * 100) / 100,
        totalCost: Math.round(data.totalCost * 100) / 100,
        percentage: 0, // Will be calculated below
        cumulativePercentage: 0 // Will be calculated below
      }));

    // Calculate percentages and cumulative
    const totalTransactions = items.reduce((sum, item) => sum + item.transactionCount, 0);
    let cumulative = 0;

    items.forEach(item => {
      const percentage = totalTransactions > 0 ? (item.transactionCount / totalTransactions) * 100 : 0;
      cumulative += percentage;

      item.percentage = Math.round(percentage * 100) / 100;
      item.cumulativePercentage = Math.round(cumulative * 100) / 100;
    });

    return {
      topReasons: items,
      totalUniqueReasons: Object.keys(reasonCounts).length,
      mostCommonReason: items.length > 0 ? items[0].reason : 'None'
    };
  }

  /**
   * Calculate user activity metrics
   */
  static calculateUserActivityMetrics(transactions: InventoryTransaction[]): UserActivityMetrics[] {
    const userStats: Record<string, {
      transactionCount: number;
      totalQuantity: number;
      totalCost: number;
      itemTypesAdjusted: Set<string>;
      mostCommonReason: string;
      lastActivity: Date;
    }> = {};

    transactions.forEach(t => {
      const userId = t.adjustedBy || 'Unknown';
      if (!userStats[userId]) {
        userStats[userId] = {
          transactionCount: 0,
          totalQuantity: 0,
          totalCost: 0,
          itemTypesAdjusted: new Set(),
          mostCommonReason: '',
          lastActivity: t.timestamp
        };
      }

      userStats[userId].transactionCount++;
      userStats[userId].totalQuantity += Math.abs(t.quantity);
      userStats[userId].totalCost += t.costImpact || 0;
      userStats[userId].itemTypesAdjusted.add(t.itemType);

      if (t.timestamp > userStats[userId].lastActivity) {
        userStats[userId].lastActivity = t.timestamp;
      }
    });

    return Object.entries(userStats)
      .sort(([,a], [,b]) => b.transactionCount - a.transactionCount)
      .slice(0, 20) // Top 20 active users
      .map(([userId, stats]) => ({
        userId,
        transactionCount: stats.transactionCount,
        totalQuantity: Math.round(stats.totalQuantity * 100) / 100,
        totalCost: Math.round(stats.totalCost * 100) / 100,
        averageQuantityPerTransaction: Math.round((stats.totalQuantity / stats.transactionCount) * 100) / 100,
        averageCostPerTransaction: Math.round((stats.totalCost / stats.transactionCount) * 100) / 100,
        uniqueItemTypesAdjusted: stats.itemTypesAdjusted.size,
        mostCommonReason: this.findMostCommonReason(transactions.filter(t => t.adjustedBy === userId)),
        lastActivity: stats.lastActivity
      }));
  }

  /**
   * Calculate inventory type metrics
   */
  static calculateInventoryTypeMetrics(transactions: InventoryTransaction[]): InventoryTypeMetrics[] {
    const typeStats: Record<string, {
      transactionCount: number;
      totalQuantity: number;
      totalCost: number;
      adjustments: number;
      reductions: number;
    }> = {};

    transactions.forEach(t => {
      if (!typeStats[t.itemType]) {
        typeStats[t.itemType] = {
          transactionCount: 0,
          totalQuantity: 0,
          totalCost: 0,
          adjustments: 0,
          reductions: 0
        };
      }

      typeStats[t.itemType].transactionCount++;
      typeStats[t.itemType].totalQuantity += Math.abs(t.quantity);
      typeStats[t.itemType].totalCost += t.costImpact || 0;

      if (t.adjustmentType === 'add' || (t.adjustmentType === 'set' && t.quantity > 0)) {
        typeStats[t.itemType].adjustments++;
      } else {
        typeStats[t.itemType].reductions++;
      }
    });

    return Object.entries(typeStats).map(([itemType, stats]) => ({
      itemType,
      transactionCount: stats.transactionCount,
      totalQuantity: Math.round(stats.totalQuantity * 100) / 100,
      totalCost: Math.round(stats.totalCost * 100) / 100,
      adjustments: stats.adjustments,
      reductions: stats.reductions,
      netChange: Math.round((stats.adjustments - stats.reductions) * 100) / 100,
      adjustmentRatio: stats.transactionCount > 0 ? Math.round((stats.adjustments / stats.transactionCount) * 100) : 0
    }));
  }

  /**
   * Calculate adjustment trends over time
   */
  static calculateAdjustmentTrends(
    transactions: InventoryTransaction[],
    period: { from: Date; to: Date }
  ): InventoryTrendPoint[] {
    const dailyData: Record<string, {
      transactionCount: number;
      totalQuantity: number;
      totalCost: number;
      byType: Record<string, number>;
    }> = {};

    // Group by date
    transactions.forEach(t => {
      const dateKey = t.timestamp.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          transactionCount: 0,
          totalQuantity: 0,
          totalCost: 0,
          byType: {}
        };
      }

      dailyData[dateKey].transactionCount++;
      dailyData[dateKey].totalQuantity += Math.abs(t.quantity);
      dailyData[dateKey].totalCost += t.costImpact || 0;

      dailyData[dateKey].byType[t.adjustmentType] =
        (dailyData[dateKey].byType[t.adjustmentType] || 0) + Math.abs(t.quantity);
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        timestamp: new Date(date),
        transactionCount: data.transactionCount,
        totalQuantity: Math.round(data.totalQuantity * 100) / 100,
        totalCost: Math.round(data.totalCost * 100) / 100,
        addQuantity: Math.round(data.byType['add'] || 0),
        removeQuantity: Math.round(data.byType['remove'] || 0),
        setQuantity: Math.round(data.byType['set'] || 0)
      }));
  }

  /**
   * Calculate cost impact analysis
   */
  static calculateCostImpactAnalysis(transactions: InventoryTransaction[]): CostImpactAnalysis {
    const costTransactions = transactions.filter(t => t.costImpact !== null && t.costImpact !== undefined);

    const positiveCosts = costTransactions.filter(t => (t.costImpact || 0) > 0);
    const negativeCosts = costTransactions.filter(t => (t.costImpact || 0) < 0);

    const totalPositiveCost = positiveCosts.reduce((sum, t) => sum + (t.costImpact || 0), 0);
    const totalNegativeCost = negativeCosts.reduce((sum, t) => sum + (t.costImpact || 0), 0);

    const costRanges = this.analyzeCostRanges(costTransactions);

    return {
      totalPositiveCost: Math.round(totalPositiveCost * 100) / 100,
      totalNegativeCost: Math.round(totalNegativeCost * 100) / 100,
      netCostImpact: Math.round((totalPositiveCost + totalNegativeCost) * 100) / 100,
      positiveTransactions: positiveCosts.length,
      negativeTransactions: negativeCosts.length,
      zeroCostTransactions: costTransactions.filter(t => t.costImpact === 0).length,
      costRanges,
      averageCostPerTransaction: costTransactions.length > 0
        ? Math.round(((totalPositiveCost + totalNegativeCost) / costTransactions.length) * 100) / 100
        : 0
    };
  }

  /**
   * Detect anomalies in transaction patterns
   */
  static detectAnomalies(transactions: InventoryTransaction[]): InventoryAnomaly[] {
    const anomalies: InventoryAnomaly[] = [];

    // Anomaly 1: Large quantity adjustments
    const allQuantities = transactions.map(t => Math.abs(t.quantity)).sort((a, b) => a - b);
    if (allQuantities.length > 10) {
      const q3 = allQuantities[Math.floor(allQuantities.length * 0.75)];
      const iqr = q3 - allQuantities[Math.floor(allQuantities.length * 0.25)];
      const upperFence = q3 + (iqr * 1.5);

      transactions
        .filter(t => Math.abs(t.quantity) > upperFence)
        .slice(0, 10) // Limit to top 10
        .forEach(t => {
          anomalies.push({
            type: 'large_quantity',
            description: `Unusually large quantity adjustment: ${Math.abs(t.quantity)} units`,
            severity: 'medium',
            transactionId: t.id,
            itemId: t.itemId,
            itemType: t.itemType,
            value: Math.abs(t.quantity),
            timestamp: t.timestamp,
            userId: t.adjustedBy || undefined
          });
        });
    }

    // Anomaly 2: High cost impact transactions
    const allCosts = transactions.map(t => Math.abs(t.costImpact || 0)).filter(c => c > 0);
    if (allCosts.length > 10) {
      const sortedCosts = allCosts.sort((a, b) => a - b);
      const costQ3 = sortedCosts[Math.floor(sortedCosts.length * 0.75)];
      const costIqr = costQ3 - sortedCosts[Math.floor(sortedCosts.length * 0.25)];
      const costUpperFence = costQ3 + (costIqr * 1.5);

      transactions
        .filter(t => (t.costImpact || 0) > costUpperFence)
        .slice(0, 10)
        .forEach(t => {
          anomalies.push({
            type: 'high_cost_impact',
            description: `High cost impact: $${(t.costImpact || 0).toFixed(2)}`,
            severity: 'high',
            transactionId: t.id,
            itemId: t.itemId,
            itemType: t.itemType,
            value: t.costImpact || 0,
            timestamp: t.timestamp,
            userId: t.adjustedBy
          });
        });
    }

    // Anomaly 3: Frequent adjustments of same item by same user
    const userItemFrequency: Record<string, Record<string, number>> = {};
    transactions.forEach(t => {
      const key = `${t.adjustedBy || 'unknown'}_${t.itemId}`;
      if (!userItemFrequency[t.adjustedBy || 'unknown']) {
        userItemFrequency[t.adjustedBy || 'unknown'] = {};
      }
      userItemFrequency[t.adjustedBy || 'unknown'][t.itemId] =
        (userItemFrequency[t.adjustedBy || 'unknown'][t.itemId] || 0) + 1;
    });

    Object.entries(userItemFrequency).forEach(([userId, itemCounts]) => {
      Object.entries(itemCounts).forEach(([itemId, count]) => {
        if (count > 10) { // More than 10 adjustments of same item by same user
          const userTransactions = transactions.filter(t =>
            t.adjustedBy === userId && t.itemId === itemId
          );

          if (userTransactions.length > 0) {
            anomalies.push({
              type: 'frequent_user_item_adjustments',
              description: `Frequent adjustments: User ${userId} adjusted item ${itemId} ${count} times`,
              severity: 'low',
              transactionId: userTransactions[0].id, // Just reference first transaction
              itemId,
              itemType: userTransactions[0].itemType,
              value: count,
              timestamp: userTransactions[userTransactions.length - 1].timestamp,
              userId
            });
          }
        }
      });
    });

    return anomalies.slice(0, 25); // Limit to top 25 anomalies
  }

  /**
   * Calculate inventory turnover efficiency
   */
  static calculateTurnoverEfficiency(transactions: InventoryTransaction[]): TurnoverEfficiency {
    const itemTurnover: Record<string, {
      additions: number;
      removals: number;
      netChange: number;
      transactionCount: number;
    }> = {};

    transactions.forEach(t => {
      if (!itemTurnover[t.itemId]) {
        itemTurnover[t.itemId] = {
          additions: 0,
          removals: 0,
          netChange: 0,
          transactionCount: 0
        };
      }

      itemTurnover[t.itemId].transactionCount++;

      if (t.adjustmentType === 'add' || (t.adjustmentType === 'set' && t.quantity > 0)) {
        itemTurnover[t.itemId].additions += t.quantity;
      } else if (t.adjustmentType === 'remove' || (t.adjustmentType === 'set' && t.quantity < 0)) {
        itemTurnover[t.itemId].removals += Math.abs(t.quantity);
      }

      itemTurnover[t.itemId].netChange += t.quantity;
    });

    const frequentItems = Object.entries(itemTurnover)
      .filter(([, data]) => data.transactionCount > 5)
      .sort(([,a], [,b]) => b.transactionCount - a.transactionCount);

    const turnoverRate = frequentItems.length > 0
      ? frequentItems.reduce((sum, [, data]) => sum + (data.removals / (data.additions || 1)), 0) / frequentItems.length
      : 0;

    return {
      overallTurnoverRate: Math.round(turnoverRate * 100) / 100,
      highTurnoverItems: frequentItems
        .filter(([, data]) => data.removals / (data.additions || 1) > 1.5)
        .slice(0, 10)
        .map(([itemId, data]) => ({
          itemId,
          turnoverRate: Math.round((data.removals / (data.additions || 1)) * 100) / 100,
          transactionCount: data.transactionCount,
          netChange: Math.round(data.netChange * 100) / 100
        })),
      lowTurnoverItems: frequentItems
        .filter(([, data]) => data.removals / (data.additions || 1) < 0.5)
        .slice(0, 10)
        .map(([itemId, data]) => ({
          itemId,
          turnoverRate: Math.round((data.removals / (data.additions || 1)) * 100) / 100,
          transactionCount: data.transactionCount,
          netChange: Math.round(data.netChange * 100) / 100
        })),
      stagnantItems: Object.entries(itemTurnover)
        .filter(([, data]) => data.transactionCount < 3)
        .slice(0, 20)
        .map(([itemId, data]) => ({
          itemId,
          daysSinceLastAdjustment: 0, // Would need actual last adjustment date
          transactionCount: data.transactionCount
        }))
    };
  }

  /**
   * Advanced trend analysis with weekly and monthly aggregation
   */
  static calculateAdvancedTrendAnalysis(
    transactions: InventoryTransaction[],
    period: { from: Date; to: Date },
    granularity: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): AdvancedTrendAnalysis {
    const trends: AdvancedTrendPoint[] = [];

    if (granularity === 'weekly') {
      // Group by week
      const weeklyData: Record<string, {
        week: string;
        startDate: Date;
        transactionCount: number;
        totalQuantity: number;
        totalCost: number;
        addCount: number;
        removeCount: number;
        setCount: number;
        uniqueUsers: Set<string>;
        topReason: string;
      }> = {};

      transactions.forEach(t => {
        const startOfWeek = new Date(t.timestamp);
        startOfWeek.setDate(t.timestamp.getDate() - t.timestamp.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const weekKey = startOfWeek.toISOString().split('T')[0];
        const weekLabel = `Week of ${startOfWeek.toLocaleDateString()}`;

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            week: weekLabel,
            startDate: startOfWeek,
            transactionCount: 0,
            totalQuantity: 0,
            totalCost: 0,
            addCount: 0,
            removeCount: 0,
            setCount: 0,
            uniqueUsers: new Set(),
            topReason: ''
          };
        }

        weeklyData[weekKey].transactionCount++;
        weeklyData[weekKey].totalQuantity += Math.abs(t.quantity);
        weeklyData[weekKey].totalCost += t.costImpact || 0;
        weeklyData[weekKey].uniqueUsers.add(t.adjustedBy || 'Unknown');

        if (t.adjustmentType === 'add') weeklyData[weekKey].addCount++;
        else if (t.adjustmentType === 'remove') weeklyData[weekKey].removeCount++;
        else if (t.adjustmentType === 'set') weeklyData[weekKey].setCount++;
      });

      Object.values(weeklyData).forEach(week => {
        const userCount = week.uniqueUsers.size;
        trends.push({
          period: week.week,
          timestamp: week.startDate,
          transactionCount: week.transactionCount,
          totalQuantity: Math.round(week.totalQuantity * 100) / 100,
          totalCost: Math.round(week.totalCost * 100) / 100,
          uniqueUsers: userCount,
          avgTransactionsPerUser: userCount > 0 ? Math.round((week.transactionCount / userCount) * 100) / 100 : 0,
          operationDistribution: {
            addPercentage: week.transactionCount > 0 ? Math.round((week.addCount / week.transactionCount) * 100) : 0,
            removePercentage: week.transactionCount > 0 ? Math.round((week.removeCount / week.transactionCount) * 100) : 0,
            setPercentage: week.transactionCount > 0 ? Math.round((week.setCount / week.transactionCount) * 100) : 0
          },
          topReason: this.findMostCommonReason(transactions.filter(t =>
            new Date(t.timestamp).toISOString().split('T')[0] >= week.startDate.toISOString().split('T')[0] &&
            new Date(t.timestamp).getTime() < week.startDate.getTime() + 7 * 24 * 60 * 60 * 1000
          )),
          efficiencyScore: userCount > 0 ? Math.round((week.transactionCount / userCount) * 100) / 100 : 0
        });
      });

    } else if (granularity === 'monthly') {
      // Monthly aggregation
      const monthlyData: Record<string, {
        month: string;
        year: number;
        monthNum: number;
        transactionCount: number;
        totalQuantity: number;
        totalCost: number;
        addCount: number;
        removeCount: number;
        setCount: number;
        uniqueUsers: Set<string>;
        itemTypes: Set<string>;
      }> = {};

      transactions.forEach(t => {
        const year = t.timestamp.getFullYear();
        const month = t.timestamp.getMonth();
        const monthKey = `${year}-${month}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: t.timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
            year,
            monthNum: month,
            transactionCount: 0,
            totalQuantity: 0,
            totalCost: 0,
            addCount: 0,
            removeCount: 0,
            setCount: 0,
            uniqueUsers: new Set(),
            itemTypes: new Set()
          };
        }

        monthlyData[monthKey].transactionCount++;
        monthlyData[monthKey].totalQuantity += Math.abs(t.quantity);
        monthlyData[monthKey].totalCost += t.costImpact || 0;
        monthlyData[monthKey].uniqueUsers.add(t.adjustedBy || 'Unknown');
        monthlyData[monthKey].itemTypes.add(t.itemType);

        if (t.adjustmentType === 'add') monthlyData[monthKey].addCount++;
        else if (t.adjustmentType === 'remove') monthlyData[monthKey].removeCount++;
        else if (t.adjustmentType === 'set') monthlyData[monthKey].setCount++;
      });

      Object.values(monthlyData).forEach(month => {
        const userCount = month.uniqueUsers.size;
        trends.push({
          period: month.month,
          timestamp: new Date(month.year, month.monthNum),
          transactionCount: month.transactionCount,
          totalQuantity: Math.round(month.totalQuantity * 100) / 100,
          totalCost: Math.round(month.totalCost * 100) / 100,
          uniqueUsers: userCount,
          avgTransactionsPerUser: userCount > 0 ? Math.round((month.transactionCount / userCount) * 100) / 100 : 0,
          operationDistribution: {
            addPercentage: month.transactionCount > 0 ? Math.round((month.addCount / month.transactionCount) * 100) : 0,
            removePercentage: month.transactionCount > 0 ? Math.round((month.removeCount / month.transactionCount) * 100) : 0,
            setPercentage: month.transactionCount > 0 ? Math.round((month.setCount / month.transactionCount) * 100) : 0
          },
          topReason: this.findMostCommonReason(transactions.filter(t =>
            t.timestamp.getFullYear() === month.year && t.timestamp.getMonth() === month.monthNum
          )),
          efficiencyScore: userCount > 0 ? Math.round((month.transactionCount / userCount) * 100) / 100 : 0
        });
      });
    } else {
      // Daily trends (reuse existing logic but with enhanced metrics)
      const dailyTrends = this.calculateAdjustmentTrends(transactions, period);
      dailyTrends.forEach(trend => {
        trends.push({
          period: trend.date,
          timestamp: trend.timestamp,
          transactionCount: trend.transactionCount,
          totalQuantity: trend.totalQuantity,
          totalCost: trend.totalCost,
          uniqueUsers: 0, // Would need user analysis
          avgTransactionsPerUser: 0,
          operationDistribution: {
            addPercentage: trend.transactionCount > 0 ? Math.round((trend.addQuantity / trend.transactionCount) * 100) : 0,
            removePercentage: trend.transactionCount > 0 ? Math.round((trend.removeQuantity / trend.transactionCount) * 100) : 0,
            setPercentage: trend.transactionCount > 0 ? Math.round((trend.setQuantity / trend.transactionCount) * 100) : 0
          },
          topReason: 'Unknown', // Would need analysis
          efficiencyScore: 0
        });
      });
    }

    // Sort trends chronologically
    trends.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate growth rates
    const growthRates: number[] = [];
    for (let i = 1; i < trends.length; i++) {
      const prev = trends[i-1].transactionCount;
      const curr = trends[i].transactionCount;
      const growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      growthRates.push(Math.round(growth * 100) / 100);
    }

    const avgGrowthRate = growthRates.length > 0
      ? Math.round((growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length) * 100) / 100
      : 0;

    const peakPeriod = trends.reduce((max, current) =>
      current.transactionCount > max.transactionCount ? current : max, trends[0]);

    return {
      granularity,
      trends,
      summary: {
        totalPeriods: trends.length,
        totalTransactions: trends.reduce((sum, t) => sum + t.transactionCount, 0),
        avgTransactionsPerPeriod: trends.length > 0
          ? Math.round((trends.reduce((sum, t) => sum + t.transactionCount, 0) / trends.length) * 100) / 100
          : 0,
        totalCostImpact: trends.reduce((sum, t) => sum + t.totalCost, 0),
        averageUniqueUsers: trends.length > 0
          ? Math.round((trends.reduce((sum, t) => sum + t.uniqueUsers, 0) / trends.length) * 100) / 100
          : 0,
        growthRate: avgGrowthRate,
        peakPeriod: peakPeriod?.period || 'None',
        mostEfficientPeriod: trends.reduce((max, current) =>
          current.efficiencyScore > max.efficiencyScore ? current : max, trends[0])?.period || 'None'
      },
      trendIndicators: {
        increasingTrend: growthRates.filter(r => r > 0).length > growthRates.filter(r => r < 0).length,
        consistentGrowth: growthRates.filter(r => Math.abs(r) < 10).length > growthRates.length * 0.7,
        seasonalPattern: this.detectSeasonalPatterns(trends),
        automationPotential: trends.some(t => t.efficiencyScore > 50) // High efficiency periods suggest automation opportunities
      }
    };
  }

  /**
   * User performance analysis and behavioral patterns
   */
  static calculateUserPerformanceAnalysis(
    transactions: InventoryTransaction[],
    period: { from: Date; to: Date }
  ): UserPerformanceAnalysis {
    const userStats: Record<string, {
      userId: string;
      totalTransactions: number;
      totalQuantity: number;
      totalCost: number;
      reasons: Record<string, number>;
      itemTypes: Record<string, number>;
      timeDistribution: Record<string, number>; // hour of day
      adjustmentTypes: Record<string, number>;
      errorPatterns: any[];
      qualityScore: number;
      productivityScore: number;
      consistencyScore: number;
    }> = {};

    // Analyze user behavior patterns
    transactions.forEach(t => {
      const userId = t.adjustedBy || 'Unknown';

      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          totalTransactions: 0,
          totalQuantity: 0,
          totalCost: 0,
          reasons: {},
          itemTypes: {},
          timeDistribution: {},
          adjustmentTypes: {},
          errorPatterns: [],
          qualityScore: 0,
          productivityScore: 0,
          consistencyScore: 0
        };
      }

      userStats[userId].totalTransactions++;
      userStats[userId].totalQuantity += Math.abs(t.quantity);
      userStats[userId].totalCost += t.costImpact || 0;

      // Reason frequency
      const reason = t.reason || 'Unknown';
      userStats[userId].reasons[reason] = (userStats[userId].reasons[reason] || 0) + 1;

      // Item type preferences
      userStats[userId].itemTypes[t.itemType] = (userStats[userId].itemTypes[t.itemType] || 0) + 1;

      // Time distribution (hour of day)
      const hour = t.timestamp.getHours().toString();
      userStats[userId].timeDistribution[hour] = (userStats[userId].timeDistribution[hour] || 0) + 1;

      // Adjustment type preferences
      userStats[userId].adjustmentTypes[t.adjustmentType] = (userStats[userId].adjustmentTypes[t.adjustmentType] || 0) + 1;
    });

    // Calculate performance metrics for each user
    const performanceProfiles: UserPerformanceProfile[] = Object.values(userStats).map(stats => {
      const totalTransactions = stats.totalTransactions;

      // Calculate quality score (consistency in reasons used)
      const reasonDistribution = Object.values(stats.reasons);
      const avgReasonFreq = reasonDistribution.reduce((sum, freq) => sum + freq, 0) / reasonDistribution.length;
      const reasonVariance = reasonDistribution.reduce((sum, freq) =>
        sum + Math.pow(freq - avgReasonFreq, 2), 0) / reasonDistribution.length;
      const qualityScore = Math.round((1 - Math.sqrt(reasonVariance) / avgReasonFreq) * 100); // Lower variance = higher consistency

      // Productivity score (transactions per day active)
      const activeDays = new Set(transactions
        .filter(t => (t.adjustedBy || 'Unknown') === stats.userId)
        .map(t => t.timestamp.toDateString())).size;
      const productivityScore = activeDays > 0 ? Math.round((totalTransactions / activeDays) * 100) / 100 : 0;

      // Consistency score (regular transaction frequency)
      const consistencyScore = Math.min(100, Math.round((totalTransactions / Math.max(activeDays, 1)) * 10));

      // Identify preferred working hours
      const preferredHours = Object.entries(stats.timeDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => hour);

      // Check for error patterns (large adjustments, frequent corrections)
      const errorPatterns = this.detectUserErrorPatterns(transactions.filter(t =>
        (t.adjustedBy || 'Unknown') === stats.userId));

      return {
        userId: stats.userId,
        performanceMetrics: {
          totalTransactions,
          totalQuantity: Math.round(stats.totalQuantity * 100) / 100,
          totalCost: Math.round(stats.totalCost * 100) / 100,
          qualityScore,
          productivityScore,
          consistencyScore
        },
        behavioralPatterns: {
          preferredAdjustmentTypes: Object.entries(stats.adjustmentTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type]) => type),
          commonReasons: Object.entries(stats.reasons)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([reason]) => reason),
          itemTypePreferences: Object.entries(stats.itemTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type]) => type),
          preferredHours,
          avgTransactionsPerHour: preferredHours.length > 0
            ? Math.round((totalTransactions / activeDays / preferredHours.length) * 100) / 100
            : 0
        },
        riskIndicators: {
          errorPatterns: errorPatterns.length,
          highValueTransactions: transactions
            .filter(t => (t.adjustedBy || 'Unknown') === stats.userId && Math.abs(t.costImpact || 0) > 500)
            .length,
          unusualHourTransactions: transactions
            .filter(t => {
              const hour = t.timestamp.getHours();
              return (t.adjustedBy || 'Unknown') === stats.userId && (hour < 6 || hour > 20);
            }).length,
          correctionFrequency: transactions
            .filter(t => (t.adjustedBy || 'Unknown') === stats.userId && t.reason?.toLowerCase().includes('correction'))
            .length
        },
        recommendations: this.generateUserRecommendations({
          qualityScore,
          productivityScore,
          consistencyScore,
          errorPatterns: errorPatterns.length
        })
      };
    });

    const overallStats = {
      totalUsers: performanceProfiles.length,
      avgQualityScore: performanceProfiles.length > 0
        ? Math.round(performanceProfiles.reduce((sum, p) => sum + p.performanceMetrics.qualityScore, 0) / performanceProfiles.length)
        : 0,
      avgProductivityScore: performanceProfiles.length > 0
        ? Math.round(performanceProfiles.reduce((sum, p) => sum + p.performanceMetrics.productivityScore, 0) / performanceProfiles.length)
        : 0,
      totalTransactions: transactions.length,
      efficiencyDistribution: {
        highPerformers: performanceProfiles.filter(p => p.performanceMetrics.qualityScore > 80 && p.performanceMetrics.productivityScore > 10).length,
        mediumPerformers: performanceProfiles.filter(p => p.performanceMetrics.qualityScore > 60 && p.performanceMetrics.productivityScore > 5).length,
        needsTraining: performanceProfiles.filter(p => p.performanceMetrics.qualityScore < 50 || p.riskIndicators.errorPatterns > 5).length
      }
    };

    return {
      userProfiles: performanceProfiles,
      overallStatistics: overallStats,
      insights: this.generateTeamInsights(performanceProfiles)
    };
  }

  /**
   * Reason categorization and advanced analysis
   */
  static calculateAdvancedReasonAnalysis(
    transactions: InventoryTransaction[],
    period: { from: Date; to: Date }
  ): AdvancedReasonAnalysis {
    // Categorize reasons
    const reasonCategories = this.categorizeReasons(transactions);

    // Analyze reason effectiveness (leading to stockouts, corrections, etc.)
    const reasonEffectiveness = this.analyzeReasonEffectiveness(transactions);

    // Trend analysis by reason
    const reasonTrends = this.analyzeReasonTrends(transactions, period);

    // Cross-analysis with user performance
    const userReasonPatterns = this.analyzeUserReasonPatterns(transactions);

    return {
      categories: reasonCategories,
      effectiveness: reasonEffectiveness,
      trends: reasonTrends,
      userPatterns: userReasonPatterns,
      insights: this.generateReasonInsights(reasonCategories, reasonEffectiveness)
    };
  }

  /**
   * Predictive analytics for inventory adjustments
   */
  static calculatePredictiveAnalytics(
    transactions: InventoryTransaction[],
    lookAheadDays: number = 30
  ): PredictiveAnalytics {
    // Simple forecasting based on recent patterns
    const recentTransactions = transactions
      .filter(t => t.timestamp > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Last 90 days
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (recentTransactions.length < 14) { // Need at least 2 weeks of data
      return {
        forecasts: [],
        confidence: 0,
        seasonality: 'insufficient_data',
        recommendations: ['Need more historical data for accurate predictions']
      };
    }

    // Calculate daily averages
    const dailyStats = this.calculateDailyAverages(recentTransactions);

    // Generate forecasts
    const forecasts: InventoryForecast[] = [];
    const baseDate = new Date();

    for (let i = 1; i <= lookAheadDays; i++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(baseDate.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const dayStats = dailyStats.find(d => d.dayOfWeek === dayOfWeek);

      if (dayStats) {
        const predictedTransactions = Math.round(dayStats.averageTransactions);
        const predictedCost = Math.round(dayStats.averageCost * 100) / 100;

        forecasts.push({
          date: forecastDate.toISOString().split('T')[0],
          predictedTransactions,
          confidence: dayStats.confidence, // Based on data variance
          expectedCost: predictedCost,
          seasonalityFactor: dayStats.seasonalityIndex
        });
      }
    }

    // Calculate overall confidence
    const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

    // Detect seasonality
    const seasonality = this.detectDetailedSeasonality(dailyStats);

    // Generate recommendations
    const recommendations = this.generatePredictiveRecommendations(forecasts, seasonality);

    return {
      forecasts,
      confidence: Math.round(avgConfidence),
      seasonality,
      recommendations
    };
  }

  // Helper methods for advanced analytics

  private static findMostCommonReason(transactions: InventoryTransaction[]): string {
    const reasonCounts: Record<string, number> = {};
    transactions.forEach(t => {
      const reason = t.reason || 'Unknown';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    const mostCommon = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mostCommon ? mostCommon[0] : 'None';
  }

  private static detectSeasonalPatterns(trends: AdvancedTrendPoint[]): boolean {
    // Simple seasonality detection based on repeating patterns
    if (trends.length < 7) return false; // Need at least a week

    // Check for weekly patterns (compare same days of week)
    const byDayOfWeek: Record<number, number[]> = {};
    trends.forEach(trend => {
      const day = trend.timestamp.getDay();
      if (!byDayOfWeek[day]) byDayOfWeek[day] = [];
      byDayOfWeek[day].push(trend.transactionCount);
    });

    // Check variance within each day group
    let seasonalScore = 0;
    Object.values(byDayOfWeek).forEach(counts => {
      if (counts.length > 1) {
        const avg = counts.reduce((sum, c) => sum + c, 0) / counts.length;
        const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
        const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
        if (cv < 0.5) seasonalScore += 0.1; // Low coefficient of variation suggests consistency
      }
    });

    return seasonalScore > 0.3; // Threshold for seasonality
  }

  private static analyzeCostRanges(transactions: InventoryTransaction[]): CostRangeAnalysis {
    const costRanges = {
      low: transactions.filter(t => Math.abs(t.costImpact || 0) < 100).length,
      medium: transactions.filter(t => Math.abs(t.costImpact || 0) >= 100 && Math.abs(t.costImpact || 0) < 1000).length,
      high: transactions.filter(t => Math.abs(t.costImpact || 0) >= 1000).length
    };

    return {
      lowCostTransactions: costRanges.low,
      mediumCostTransactions: costRanges.medium,
      highCostTransactions: costRanges.high,
      lowCostPercentage: transactions.length > 0 ? Math.round((costRanges.low / transactions.length) * 100) : 0,
      mediumCostPercentage: transactions.length > 0 ? Math.round((costRanges.medium / transactions.length) * 100) : 0,
      highCostPercentage: transactions.length > 0 ? Math.round((costRanges.high / transactions.length) * 100) : 0
    };
  }

  private static detectUserErrorPatterns(userTransactions: InventoryTransaction[]): any[] {
    const patterns: any[] = [];

    // Large adjustments in short time spans
    const rapidLargeAdjustments = userTransactions.filter(t =>
      Math.abs(t.quantity) > 100 &&
      userTransactions.some(other =>
        other.id !== t.id &&
        other.itemId === t.itemId &&
        Math.abs(other.timestamp.getTime() - t.timestamp.getTime()) < 3600000 // Within 1 hour
      )
    );

    if (rapidLargeAdjustments.length > 0) {
      patterns.push({
        type: 'rapid_large_adjustments',
        count: rapidLargeAdjustments.length,
        description: 'Multiple large adjustments to same item within short time spans'
      });
    }

    // Frequent corrections (suggesting errors)
    const correctionRate = userTransactions.filter(t =>
      t.reason?.toLowerCase().includes('correct') ||
      t.reason?.toLowerCase().includes('error') ||
      t.reason?.toLowerCase().includes('mistake')
    ).length / userTransactions.length;

    if (correctionRate > 0.1) { // More than 10% corrections
      patterns.push({
        type: 'high_correction_rate',
        rate: Math.round(correctionRate * 100) / 100,
        description: 'High frequency of corrective adjustments'
      });
    }

    return patterns;
  }

  private static generateUserRecommendations(metrics: {
    qualityScore: number;
    productivityScore: number;
    consistencyScore: number;
    errorPatterns: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.qualityScore < 50) {
      recommendations.push('Consider additional training on inventory adjustment procedures');
    }

    if (metrics.productivityScore < 5) {
      recommendations.push('Review workload balance - consider process automation');
    }

    if (metrics.errorPatterns > 3) {
      recommendations.push('Address error patterns through additional verification steps');
    }

    if (metrics.consistencyScore < 30) {
      recommendations.push('Establish more regular adjustment patterns and procedures');
    }

    return recommendations;
  }

  private static generateTeamInsights(profiles: UserPerformanceProfile[]): string[] {
    const insights: string[] = [];

    const highPerformers = profiles.filter(p => p.performanceMetrics.qualityScore > 80);
    if (highPerformers.length > 0) {
      insights.push(`${highPerformers.length} high-performing users identified - consider as mentors`);
    }

    const lowPerformers = profiles.filter(p => p.performanceMetrics.qualityScore < 50);
    if (lowPerformers.length > profiles.length * 0.3) {
      insights.push('Significant portion of team needs training on inventory procedures');
    }

    const errorProneUsers = profiles.filter(p => p.riskIndicators.errorPatterns > 5);
    if (errorProneUsers.length > 0) {
      insights.push(`${errorProneUsers.length} users show error patterns - implement additional controls`);
    }

    return insights;
  }

  private static categorizeReasons(transactions: InventoryTransaction[]): ReasonCategory[] {
    const categories: Record<string, {
      category: string;
      reasons: string[];
      totalTransactions: number;
      totalCost: number;
      frequency: number;
    }> = {};

    transactions.forEach(t => {
      const reason = (t.reason || '').toLowerCase();
      let category = 'Other';

      // Categorize reasons
      if (reason.includes('receive') || reason.includes('purchase') || reason.includes('delivery')) {
        category = 'Inbound';
      } else if (reason.includes('consume') || reason.includes('production') || reason.includes('use')) {
        category = 'Consumption';
      } else if (reason.includes('correct') || reason.includes('error') || reason.includes('mistake')) {
        category = 'Corrections';
      } else if (reason.includes('damage') || reason.includes('scrap') || reason.includes('lose')) {
        category = 'Loss/Damage';
      } else if (reason.includes('return') || reason.includes('supplier')) {
        category = 'Returns';
      } else if (reason.includes('audit') || reason.includes('count') || reason.includes('physical')) {
        category = 'Inventory Audits';
      }

      if (!categories[category]) {
        categories[category] = {
          category,
          reasons: [],
          totalTransactions: 0,
          totalCost: 0,
          frequency: 0
        };
      }

      categories[category].totalTransactions++;
      categories[category].totalCost += t.costImpact || 0;

      if (!categories[category].reasons.includes(t.reason || '')) {
        categories[category].reasons.push(t.reason || '');
      }
    });

    return Object.values(categories).map(cat => ({
      category: cat.category,
      transactionCount: cat.totalTransactions,
      totalCost: Math.round(cat.totalCost * 100) / 100,
      reasons: cat.reasons.slice(0, 5), // Top 5 reasons per category
      percentage: transactions.length > 0 ? Math.round((cat.totalTransactions / transactions.length) * 100) : 0,
      avgCostPerTransaction: cat.totalTransactions > 0 ? Math.round((cat.totalCost / cat.totalTransactions) * 100) / 100 : 0
    }));
  }

  private static analyzeReasonEffectiveness(transactions: InventoryTransaction[]): ReasonEffectiveness[] {
    // This would analyze whether certain adjustment reasons lead to better outcomes
    const reasonStats: Record<string, {
      reason: string;
      followedByCorrections: number;
      avgQuantity: number;
      consistency: number;
      effectiveness: number;
    }> = {};

    // Group by reason and analyze patterns
    const reasonGroups = this.groupByReason(transactions);

    Object.entries(reasonGroups).forEach(([reason, trans]) => {
      const avgQuantity = trans.reduce((sum, t) => sum + Math.abs(t.quantity), 0) / trans.length;
      const followedByCorrections = this.checkCorrectionPatterns(trans, transactions);

      reasonStats[reason] = {
        reason,
        followedByCorrections,
        avgQuantity: Math.round(avgQuantity * 100) / 100,
        consistency: this.calculateReasonConsistency(trans),
        effectiveness: this.calculateReasonEffectiveness(trans)
      };
    });

    return Object.values(reasonStats);
  }

  private static analyzeReasonTrends(transactions: InventoryTransaction[], period: { from: Date; to: Date }): ReasonTrend[] {
    const weeklyTrends: Record<string, Record<string, number>> = {};

    transactions.forEach(t => {
      const week = Math.floor((t.timestamp.getTime() - period.from.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const reason = t.reason || 'Unknown';

      if (!weeklyTrends[week]) weeklyTrends[week] = {};
      weeklyTrends[week][reason] = (weeklyTrends[week][reason] || 0) + 1;
    });

    const trends: ReasonTrend[] = [];
    Object.entries(weeklyTrends).forEach(([week, reasons]) => {
      Object.entries(reasons).forEach(([reason, count]) => {
        trends.push({
          week: parseInt(week),
          reason,
          transactionCount: count,
          percentage: Object.values(reasons).reduce((sum, c) => sum + c, 0) > 0
            ? Math.round((count / Object.values(reasons).reduce((sum, c) => sum + c, 0)) * 100)
            : 0
        });
      });
    });

    return trends;
  }

  private static analyzeUserReasonPatterns(transactions: InventoryTransaction[]): UserReasonPattern[] {
    const userReasonStats: Record<string, Record<string, number>> = {};

    transactions.forEach(t => {
      const userId = t.adjustedBy || 'Unknown';
      const reason = t.reason || 'Unknown';

      if (!userReasonStats[userId]) userReasonStats[userId] = {};
      userReasonStats[userId][reason] = (userReasonStats[userId][reason] || 0) + 1;
    });

    const patterns: UserReasonPattern[] = [];
    Object.entries(userReasonStats).forEach(([userId, reasons]) => {
      const total = Object.values(reasons).reduce((sum, count) => sum + count, 0);
      const sortedReasons = Object.entries(reasons).sort(([,a], [,b]) => b - a);

      patterns.push({
        userId,
        primaryReason: sortedReasons[0]?.[0] || 'None',
        primaryReasonCount: sortedReasons[0]?.[1] || 0,
        secondaryReasons: sortedReasons.slice(1, 4).map(([reason]) => reason),
        reasonDiversity: Object.keys(reasons).length,
        consistencyIndex: sortedReasons.length > 0 ? Math.round((sortedReasons[0][1] / total) * 100) : 0
      });
    });

    return patterns;
  }

  private static generateReasonInsights(categories: ReasonCategory[], effectiveness: ReasonEffectiveness[]): string[] {
    const insights: string[] = [];

    // Analyze category distribution
    const dominantCategory = categories.reduce((max, cat) =>
      cat.transactionCount > max.transactionCount ? cat : max, categories[0]);

    if (dominantCategory) {
      insights.push(`${dominantCategory.category} is the dominant adjustment category (${dominantCategory.percentage}%)`);
    }

    // Check for high correction rates
    const correctionCategory = categories.find(c => c.category === 'Corrections');
    if (correctionCategory && correctionCategory.percentage > 20) {
      insights.push('High correction rate detected - consider improving initial adjustment accuracy');
    }

    return insights;
  }

  private static calculateDailyAverages(transactions: InventoryTransaction[]): DailyAverage[] {
    const dailyStats: Record<number, {
      dayOfWeek: number;
      totalTransactions: number;
      totalCost: number;
      counts: number[];
    }> = {};

    transactions.forEach(t => {
      const dayOfWeek = t.timestamp.getDay();

      if (!dailyStats[dayOfWeek]) {
        dailyStats[dayOfWeek] = {
          dayOfWeek,
          totalTransactions: 0,
          totalCost: 0,
          counts: []
        };
      }

      dailyStats[dayOfWeek].totalTransactions++;
      dailyStats[dayOfWeek].totalCost += t.costImpact || 0;
    });

    return Object.values(dailyStats).map(stat => {
      const avgTransactions = stat.totalTransactions / 90; // 90 days assumption
      const avgCost = stat.totalCost / 90;
      const variance = this.calculateVariance(stat.counts);
      const stdDev = Math.sqrt(variance);
      const cv = avgTransactions > 0 ? stdDev / avgTransactions : 0;
      const confidence = Math.max(0, Math.min(100, 100 - cv * 50));

      return {
        dayOfWeek: stat.dayOfWeek,
        averageTransactions: Math.round(avgTransactions * 100) / 100,
        averageCost: Math.round(avgCost * 100) / 100,
        confidence,
        seasonalityIndex: 1.0 // Placeholder - would calculate based on historical patterns
      };
    });
  }

  private static detectDetailedSeasonality(dailyStats: DailyAverage[]): 'strong' | 'moderate' | 'weak' | 'none' {
    const variances = dailyStats.map(d => d.averageTransactions);
    const avg = variances.reduce((sum, v) => sum + v, 0) / variances.length;
    const variance = variances.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / variances.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;

    if (cv < 0.2) return 'strong';
    if (cv < 0.4) return 'moderate';
    if (cv < 0.6) return 'weak';
    return 'none';
  }

  private static generatePredictiveRecommendations(forecasts: InventoryForecast[], seasonality: string): string[] {
    const recommendations: string[] = [];

    const avgPredicted = forecasts.reduce((sum, f) => sum + f.predictedTransactions, 0) / forecasts.length;
    const highVolumeDays = forecasts.filter(f => f.predictedTransactions > avgPredicted * 1.5);
    const lowVolumeDays = forecasts.filter(f => f.predictedTransactions < avgPredicted * 0.5);

    if (highVolumeDays.length > 0) {
      recommendations.push(`Plan for ${highVolumeDays.length} high-volume adjustment days - consider additional staffing`);
    }

    if (seasonality === 'strong') {
      recommendations.push('Strong seasonal patterns detected - implement staffing schedules that match peak periods');
    }

    if (forecasts.some(f => f.confidence < 50)) {
      recommendations.push('Low confidence in some predictions - consider increasing data collection frequency');
    }

    return recommendations;
  }

  private static groupByReason(transactions: InventoryTransaction[]): Record<string, InventoryTransaction[]> {
    return transactions.reduce((groups, t) => {
      const reason = t.reason || 'Unknown';
      if (!groups[reason]) groups[reason] = [];
      groups[reason].push(t);
      return groups;
    }, {} as Record<string, InventoryTransaction[]>);
  }

  private static checkCorrectionPatterns(transactions: InventoryTransaction[], allTransactions: InventoryTransaction[]): number {
    // Simplified - would analyze if adjustments are followed by corrections
    return transactions.filter(t =>
      allTransactions.some(other =>
        other.timestamp > t.timestamp &&
        other.timestamp.getTime() - t.timestamp.getTime() < 24 * 60 * 60 * 1000 && // Within 24 hours
        other.reason?.toLowerCase().includes('correct')
      )
    ).length;
  }

  private static calculateReasonConsistency(transactions: InventoryTransaction[]): number {
    // Calculate consistency based on reason usage patterns
    return 85; // Placeholder implementation
  }

  private static calculateReasonEffectiveness(transactions: InventoryTransaction[]): number {
    // Calculate effectiveness based on outcomes (reduced corrections, etc.)
    return 78; // Placeholder implementation
  }

  private static calculateVariance(values: number[]): number {
    if (values.length <= 1) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  }
}
