import test from 'node:test';
import assert from 'node:assert/strict';
import { timeStringToMinutes, minutesToTimeString, checkAccident } from './collisionEngine';
import { TrainSchedule, TrainLine, User } from '../types/railpulse';
import {
  recordAuditAction,
  filterAuditLogs,
  computeAuditStats,
  getDistinctAuditUsers,
  exportAuditLogsToCsv,
  exportAuditLogsToJson,
  buildAuditExportFilename,
} from './auditLogService';
import { normalizeSearchText, performGlobalAdminSearch } from './globalSearchService';
import {
  buildTicketSalesTimeSeries,
  buildSystemActivityTimeSeries,
  buildCorridorPerformanceBreakdown,
  buildTicketDemandForecast,
} from './dashboardAnalyticsService';
import {
  buildQuarterlyImpactReport,
  buildImpactReportFilename,
  exportImpactReportToJson,
  exportImpactReportToPdfBytes,
} from './impactReportService';
import {
  DEFAULT_ADMIN_POLL_INTERVAL_MS,
  createAdminPollingController,
} from './adminPollingService';
import { INITIAL_SCHEDULES, INITIAL_LINES, INITIAL_TICKETS } from './storageAndMigration';

test('timeStringToMinutes converts correctly', () => {
  assert.equal(timeStringToMinutes('00:00'), 0);
  assert.equal(timeStringToMinutes('01:30'), 90);
  assert.equal(timeStringToMinutes('08:45'), 525);
  assert.equal(timeStringToMinutes('23:59'), 1439);
});

test('minutesToTimeString converts correctly', () => {
  assert.equal(minutesToTimeString(0), '00:00');
  assert.equal(minutesToTimeString(90), '01:30');
  assert.equal(minutesToTimeString(525), '08:45');
  assert.equal(minutesToTimeString(1439), '23:59');
});

test('checkAccident detects dangerous single-track overtake between stations', () => {
  const line: TrainLine = {
    id: 'line-test',
    code: 'LT',
    nameFa: 'خط آزمایشی',
    nameEn: 'Test Line',
    totalDistanceKm: 200,
    status: 'active',
    stations: [
      { id: 's1', nameFa: 'ایستگاه مبدا', nameEn: 'Start', code: 'STA', kmFromStart: 0, platformsCount: 1 },
      { id: 's2', nameFa: 'ایستگاه میانی', nameEn: 'Mid', code: 'MID', kmFromStart: 100, platformsCount: 1 },
      { id: 's3', nameFa: 'ایستگاه مقصد', nameEn: 'End', code: 'END', kmFromStart: 200, platformsCount: 1 },
    ],
  };

  // Train 1: Departs at 08:00, speed 80 km/h (takes 75 min to s2 => 09:15)
  const train1: TrainSchedule = {
    id: 'T1',
    trainNumber: '101',
    trainNameFa: 'قطار کند',
    trainNameEn: 'Slow',
    lineId: 'line-test',
    departureTime: '08:00',
    speedKmh: 80,
    stopTimesMinutes: [10],
    totalCapacity: 100,
    bookedSeats: 0,
    ticketPrice: 1000,
    trainType: 'intercity',
    status: 'scheduled',
  };

  // Train 2: Departs at 08:10, speed 160 km/h (takes 37.5 min to s2 => 08:47, passing Train 1)
  const train2: TrainSchedule = {
    id: 'T2',
    trainNumber: '202',
    trainNameFa: 'قطار تند',
    trainNameEn: 'Fast',
    lineId: 'line-test',
    departureTime: '08:10',
    speedKmh: 160,
    stopTimesMinutes: [10],
    totalCapacity: 100,
    bookedSeats: 0,
    ticketPrice: 2000,
    trainType: 'high-speed',
    status: 'scheduled',
  };

  const conflicts = checkAccident([train1, train2], [line]);
  assert.ok(conflicts.length >= 1, 'Should detect at least 1 collision hazard');
  const overtake = conflicts.find((c) => c.type === 'segment-overtake');
  assert.ok(overtake, 'Should specifically flag segment-overtake hazard');
  assert.equal(overtake?.severity, 'critical');
});

test('Audit Log filtering and statistics calculation', () => {
  const dummyLogs = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      actorId: 'u1',
      actorName: 'سارا راد',
      actorRole: 'passenger' as const,
      actionType: 'ticket_reservation' as const,
      entityType: 'ticket' as const,
      entityId: 'PNR-1',
      summaryFa: 'رزرو بلیت',
      summaryEn: 'Booking',
      metadata: {},
      ipAddress: '127.0.0.1',
      riskLevel: 'low' as const,
      status: 'success' as const,
      verificationHash: 'hash1',
    },
    {
      id: '2',
      timestamp: new Date().toISOString(),
      actorId: 'u2',
      actorName: 'رضا شمس',
      actorRole: 'employee' as const,
      actionType: 'schedule_update' as const,
      entityType: 'schedule' as const,
      entityId: 'TR-1',
      summaryFa: 'تغییر زمان‌بندی',
      summaryEn: 'Schedule update',
      metadata: {},
      ipAddress: '127.0.0.1',
      riskLevel: 'high' as const,
      status: 'success' as const,
      verificationHash: 'hash2',
    },
  ];

  const stats = computeAuditStats(dummyLogs);
  assert.equal(stats.total, 2);
  assert.equal(stats.reservations, 1);
  assert.equal(stats.scheduleEdits, 1);
  assert.equal(stats.highRisk, 1);

  const filtered = filterAuditLogs(dummyLogs, { actionType: 'ticket_reservation' });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].entityId, 'PNR-1');
});

test('performGlobalAdminSearch queries across schedules, tickets, and audit logs with bilingual digits', () => {
  assert.equal(normalizeSearchText('۱۰۱ فدک'), '101 فدک');

  const sampleAuditLogs = [
    {
      id: 'audit-1',
      timestamp: new Date().toISOString(),
      actorId: 'usr-pass-1',
      actorName: 'سارا راد',
      actorRole: 'passenger' as const,
      actionType: 'ticket_reservation' as const,
      entityType: 'ticket' as const,
      entityId: 'PNR-8921-FA',
      summaryFa: 'رزرو قطعی ۲ صندلی در قطار ۱۰۱ تهران - مشهد',
      summaryEn: 'Reserved 2 seats on Train 101 Tehran-Mashhad',
      metadata: { pnr: 'PNR-8921-FA', trainNumber: 'TR-101' },
      ipAddress: '192.168.10.42',
      riskLevel: 'low' as const,
      status: 'success' as const,
      verificationHash: 'sha256-xyz',
    },
  ];

  // Query "101" should match TR-101 schedule, PNR-8921-FA ticket (for train ۱۰۱ فدک), and audit-1 log
  const res101 = performGlobalAdminSearch({
    query: '101',
    category: 'all',
    schedules: INITIAL_SCHEDULES,
    lines: INITIAL_LINES,
    tickets: INITIAL_TICKETS,
    auditLogs: sampleAuditLogs,
  });

  assert.equal(res101.schedules.length, 1);
  assert.equal(res101.schedules[0].id, 'TR-101');
  assert.equal(res101.tickets.length, 1);
  assert.equal(res101.tickets[0].pnr, 'PNR-8921-FA');
  assert.equal(res101.auditLogs.length, 1);
  assert.equal(res101.totalCount, 3);

  // Category filter 'tickets' should only return ticket results
  const ticketsOnly = performGlobalAdminSearch({
    query: 'PNR-8921-FA',
    category: 'tickets',
    schedules: INITIAL_SCHEDULES,
    lines: INITIAL_LINES,
    tickets: INITIAL_TICKETS,
    auditLogs: sampleAuditLogs,
  });

  assert.equal(ticketsOnly.schedules.length, 0);
  assert.equal(ticketsOnly.tickets.length, 1);
  assert.equal(ticketsOnly.auditLogs.length, 0);
});

test('filterAuditLogs by user and date range and export to CSV and JSON', () => {
  const logs = [
    {
      id: 'log-1',
      timestamp: '2026-11-01T10:00:00.000Z',
      actorId: 'usr-pass-1',
      actorName: 'سارا راد',
      actorRole: 'passenger' as const,
      actionType: 'ticket_reservation' as const,
      entityType: 'ticket' as const,
      entityId: 'PNR-100',
      summaryFa: 'رزرو بلیت',
      summaryEn: 'Ticket booked',
      metadata: {},
      ipAddress: '192.168.10.1',
      riskLevel: 'low' as const,
      status: 'success' as const,
      verificationHash: 'sha256-a1',
    },
    {
      id: 'log-2',
      timestamp: '2026-11-03T14:30:00.000Z',
      actorId: 'usr-emp-1',
      actorName: 'مهندس رضا شمس',
      actorRole: 'employee' as const,
      actionType: 'schedule_update' as const,
      entityType: 'schedule' as const,
      entityId: 'TR-101',
      summaryFa: 'ویرایش برنامه حرکت',
      summaryEn: 'Schedule updated',
      metadata: {},
      ipAddress: '192.168.10.2',
      riskLevel: 'high' as const,
      status: 'success' as const,
      verificationHash: 'sha256-a2',
    },
  ];

  const distinct = getDistinctAuditUsers(logs);
  assert.equal(distinct.length, 2);

  // Filter by user 'usr-pass-1'
  const byUser = filterAuditLogs(logs, { actorId: 'usr-pass-1' });
  assert.equal(byUser.length, 1);
  assert.equal(byUser[0].id, 'log-1');

  // Filter by date range '2026-11-02' to '2026-11-03'
  const byDate = filterAuditLogs(logs, {
    startDate: '2026-11-02',
    endDate: '2026-11-03',
  });
  assert.equal(byDate.length, 1);
  assert.equal(byDate[0].id, 'log-2');

  // Verify JSON and CSV export content and filenames
  const csvOut = exportAuditLogsToCsv(byUser);
  assert.ok(csvOut.includes('"usr-pass-1"'));
  assert.ok(csvOut.includes('"PNR-100"'));

  const jsonOut = exportAuditLogsToJson(byDate);
  const parsedJson = JSON.parse(jsonOut);
  assert.equal(parsedJson.length, 1);
  assert.equal(parsedJson[0].entityId, 'TR-101');

  const fname = buildAuditExportFilename('csv', {
    actorId: 'usr-pass-1',
    startDate: '2026-11-01',
  });
  assert.equal(fname, 'railpulse-audit-logs-usr-pass-1-from-2026-11-01.csv');
});

test('dashboardAnalyticsService builds time-series ticket sales trends and system activity metrics', () => {
  const sales7d = buildTicketSalesTimeSeries(INITIAL_SCHEDULES, INITIAL_TICKETS, '7d');
  assert.equal(sales7d.length, 7);
  assert.ok(sales7d[sales7d.length - 1].ticketsSold > 0);
  assert.ok(sales7d[sales7d.length - 1].revenueMillions > 0);

  const sales30d = buildTicketSalesTimeSeries(INITIAL_SCHEDULES, INITIAL_TICKETS, '30d');
  assert.equal(sales30d.length, 30);

  const activitySeries = buildSystemActivityTimeSeries([]);
  assert.equal(activitySeries.length, 6);
  assert.ok(activitySeries[0].totalEvents > 0);

  const corridors = buildCorridorPerformanceBreakdown(INITIAL_LINES, INITIAL_SCHEDULES);
  assert.equal(corridors.length, INITIAL_LINES.length);
  assert.ok(corridors[0].bookedSeats > 0);
  assert.ok(corridors[0].availableSeats > 0);
});

test('buildTicketDemandForecast projects future ticket demand with OLS regression and confidence intervals', () => {
  const baseline7d = buildTicketDemandForecast(
    INITIAL_SCHEDULES,
    INITIAL_TICKETS,
    '7d',
    'baseline'
  );
  // 7 recent historical days + 7 forecast days = 14 points
  assert.equal(baseline7d.points.length, 14);
  assert.equal(baseline7d.horizonDays, 7);
  assert.ok(baseline7d.totalProjectedSeats > 0);
  assert.ok(baseline7d.totalProjectedRevenueMillions > 0);
  assert.ok(baseline7d.peakForecastSeats > 0);

  // Verify bridge point (index 6) has both actualTickets and projectedTickets equal for seamless chart transition
  const bridgePoint = baseline7d.points[6];
  assert.equal(bridgePoint.isForecast, false);
  assert.ok(bridgePoint.actualTickets !== null);
  assert.equal(bridgePoint.actualTickets, bridgePoint.projectedTickets);

  // Verify forecast points (indices 7..13) obey lowerBoundTickets <= projectedTickets <= upperBoundTickets
  const futurePoints = baseline7d.points.slice(7);
  assert.equal(futurePoints.length, 7);
  for (const fp of futurePoints) {
    assert.equal(fp.isForecast, true);
    assert.equal(fp.actualTickets, null);
    assert.ok(fp.projectedTickets !== null && fp.projectedTickets > 0);
    assert.ok(
      fp.lowerBoundTickets !== null &&
        fp.upperBoundTickets !== null &&
        fp.lowerBoundTickets <= fp.projectedTickets &&
        fp.projectedTickets <= fp.upperBoundTickets
    );
  }

  // Verify 14d horizon produces 7 historical + 14 forecast = 21 points
  const holiday14d = buildTicketDemandForecast(
    INITIAL_SCHEDULES,
    INITIAL_TICKETS,
    '14d',
    'peak_holiday'
  );
  assert.equal(holiday14d.points.length, 21);

  // Verify scenario ordering: weather_disruption < baseline < peak_holiday for 7d horizon
  const holiday7d = buildTicketDemandForecast(
    INITIAL_SCHEDULES,
    INITIAL_TICKETS,
    '7d',
    'peak_holiday'
  );
  const weather7d = buildTicketDemandForecast(
    INITIAL_SCHEDULES,
    INITIAL_TICKETS,
    '7d',
    'weather_disruption'
  );
  assert.ok(weather7d.totalProjectedSeats < baseline7d.totalProjectedSeats);
  assert.ok(baseline7d.totalProjectedSeats < holiday7d.totalProjectedSeats);
});

test('impactReportService generates quarterly business impact reports and exports valid PDF and JSON', () => {
  const report = buildQuarterlyImpactReport({
    lines: INITIAL_LINES,
    schedules: INITIAL_SCHEDULES,
    tickets: INITIAL_TICKETS,
    auditLogs: [],
    quarter: 'Q4-1405',
    salesWindow: '14d',
    forecastHorizon: '14d',
    scenario: 'peak_holiday',
  });

  assert.equal(report.quarter, 'Q4-1405');
  assert.equal(report.scenario, 'peak_holiday');
  assert.ok(report.executiveSummary.quarterlyProjectedSeats > 0);
  assert.ok(report.executiveSummary.quarterlyProjectedRevenueMillions > 0);
  assert.ok(report.executiveSummary.recommendedExtraTrainsets >= 1);
  assert.equal(report.historicalSalesTrend.length, 14);
  assert.equal(report.forecastTrajectory.length, 21);
  assert.equal(report.strategicRecommendations.length, 3);

  // Verify filenames
  assert.equal(
    buildImpactReportFilename('pdf', 'Q4-1405', 'peak_holiday'),
    'railpulse-quarterly-impact-Q4-1405-peak_holiday.pdf'
  );
  assert.equal(
    buildImpactReportFilename('json', 'Q4-1405', 'peak_holiday'),
    'railpulse-quarterly-impact-Q4-1405-peak_holiday.json'
  );

  // Verify JSON export
  const jsonText = exportImpactReportToJson(report);
  const parsed = JSON.parse(jsonText);
  assert.equal(parsed.reportId, report.reportId);
  assert.equal(
    parsed.executiveSummary.quarterlyProjectedSeats,
    report.executiveSummary.quarterlyProjectedSeats
  );

  // Verify PDF binary export
  const pdfBytes = exportImpactReportToPdfBytes(report);
  assert.ok(pdfBytes.byteLength > 1500, 'PDF should have non-trivial byte length');
  const pdfText = new TextDecoder().decode(pdfBytes);
  assert.ok(pdfText.startsWith('%PDF-1.4'), 'PDF must start with %PDF-1.4 header');
  assert.ok(pdfText.trimEnd().endsWith('%%EOF'), 'PDF must end with %%EOF');
  assert.ok(
    pdfText.includes('RAILPULSE ENTERPRISE - QUARTERLY BUSINESS IMPACT REPORT'),
    'PDF must contain executive title'
  );
  assert.ok(
    pdfText.includes('Historical Ticket Sales & Predictive Demand Trajectory'),
    'PDF must include embedded vector chart section'
  );
});

test('createAdminPollingController defaults to 60s and periodically triggers onRefreshData', async () => {
  assert.equal(DEFAULT_ADMIN_POLL_INTERVAL_MS, 60_000);

  let refreshCallCount = 0;
  const controller = createAdminPollingController({
    intervalMs: 25,
    onRefreshData: () => {
      refreshCallCount += 1;
    },
  });

  assert.equal(controller.getState().isRunning, false);
  controller.start();
  assert.equal(controller.getState().isRunning, true);

  await new Promise((resolve) => setTimeout(resolve, 65));
  assert.ok(
    refreshCallCount >= 2,
    `Expected at least 2 periodic refresh calls, got ${refreshCallCount}`
  );
  assert.equal(controller.getState().syncCount, refreshCallCount);

  // Test pause prevents automatic polling
  const countBeforePause = refreshCallCount;
  controller.setPaused(true);
  assert.equal(controller.getState().isPaused, true);
  await new Promise((resolve) => setTimeout(resolve, 45));
  assert.equal(refreshCallCount, countBeforePause);

  // Test manual triggerNow works immediately
  controller.triggerNow();
  assert.equal(refreshCallCount, countBeforePause + 1);

  controller.stop();
  assert.equal(controller.getState().isRunning, false);
});






