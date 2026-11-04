import test from 'node:test';
import assert from 'node:assert/strict';
import { timeStringToMinutes, minutesToTimeString, checkAccident } from './collisionEngine';
import { TrainSchedule, TrainLine } from '../types/railpulse';
import {
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
import {
  normalizeRuntimeError,
  parseStackLines,
  buildErrorIncidentReport,
  shouldAutoResetBoundary,
} from './errorBoundaryService';
import {
  getThemePresetConfig,
  getAllThemePresets,
  resolveNextThemePreset,
  loadPersistedThemePreset,
  savePersistedThemePreset,
} from './themeSettingsService';
import {
  DEFAULT_IDLE_TIMEOUT_MS,
  formatIdleCountdown,
  verifySessionUnlockCredential,
  createIdleSessionController,
} from './idleSessionService';
import {
  classifyTimelineCategory,
  computeTimelineSummaryMetrics,
  buildGlobalActivityTimeline,
  recordPortalSwitchEvent,
} from './activityTimelineService';
import {
  getDefaultAdminCommands,
  filterCommandPaletteItems,
  moveCommandSelection,
  isCommandPaletteShortcut,
} from './commandPaletteService';
import {
  resolveTailwindProgressWidthClass,
  resolveAdminTabSkeletonVariant,
  getOperationStageMetadata,
  createLoadingFeedbackState,
} from './loadingFeedbackService';
import { buildAdminPrintableReport } from './adminPrintReportService';
import { INITIAL_SCHEDULES, INITIAL_LINES, INITIAL_TICKETS, INITIAL_USERS } from './storageAndMigration';

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
    code: 'TST-01',
    nameFa: 'خط تست',
    nameEn: 'Test Line',
    totalDistanceKm: 200,
    stations: [
      { id: 's1', nameFa: 'ایستگاه ۱', nameEn: 'St 1', kmFromStart: 0, platformsCount: 2 },
      { id: 's2', nameFa: 'ایستگاه ۲', nameEn: 'St 2', kmFromStart: 200, platformsCount: 2 },
    ],
  };

  const schedules: TrainSchedule[] = [
    {
      id: 't1',
      trainNumber: '101',
      trainNameFa: 'قطار ۱',
      trainNameEn: 'Train 1',
      lineId: 'line-test',
      departureTime: '08:00',
      speedKmh: 100,
      stopTimesMinutes: [],
      totalCapacity: 200,
      bookedSeats: 50,
      ticketPrice: 100000,
      trainType: 'express',
      status: 'scheduled',
    },
    {
      id: 't2',
      trainNumber: '102',
      trainNameFa: 'قطار ۲',
      trainNameEn: 'Train 2',
      lineId: 'line-test',
      departureTime: '08:30',
      speedKmh: 200,
      stopTimesMinutes: [],
      totalCapacity: 200,
      bookedSeats: 50,
      ticketPrice: 100000,
      trainType: 'high_speed',
      status: 'scheduled',
    },
  ];

  const conflicts = checkAccident(schedules, [line]);
  assert.ok(conflicts.length >= 1);
  assert.equal(conflicts[0].conflictType, 'segment_overtake_collision');
});

test('Audit Log filtering and statistics calculation', () => {
  const sample = [
    {
      id: 'a1',
      timestamp: new Date().toISOString(),
      actorId: 'u1',
      actorName: 'Ali',
      actorRole: 'passenger' as const,
      actionType: 'ticket_reservation' as const,
      entityType: 'ticket' as const,
      entityId: 'PNR-1',
      summaryFa: 'رزرو بلیت',
      summaryEn: 'Booked ticket',
      metadata: {},
      ipAddress: '127.0.0.1',
      riskLevel: 'low' as const,
      status: 'success' as const,
      verificationHash: 'sha256-123',
    },
  ];
  const stats = computeAuditStats(sample);
  assert.equal(stats.total, 1);
  assert.equal(stats.reservations, 1);

  const filtered = filterAuditLogs(sample, { actionType: 'ticket_reservation' });
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

  const byUser = filterAuditLogs(logs, { actorId: 'usr-pass-1' });
  assert.equal(byUser.length, 1);
  assert.equal(byUser[0].id, 'log-1');

  const byDate = filterAuditLogs(logs, {
    startDate: '2026-11-02',
    endDate: '2026-11-03',
  });
  assert.equal(byDate.length, 1);
  assert.equal(byDate[0].id, 'log-2');

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
  assert.equal(baseline7d.points.length, 14);
  assert.equal(baseline7d.horizonDays, 7);
  assert.ok(baseline7d.totalProjectedSeats > 0);

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
  assert.ok(report.kpis.projectedTicketsSold > 0);

  const fname = buildImpactReportFilename('Q4-1405', 'peak_holiday', 'pdf');
  assert.equal(fname, 'railpulse-impact-report-q4-1405-peak_holiday.pdf');

  const jsonStr = exportImpactReportToJson(report);
  assert.ok(jsonStr.includes('Q4-1405'));

  const pdfBytes = exportImpactReportToPdfBytes(report);
  assert.ok(pdfBytes.byteLength > 100);
});

test('createAdminPollingController defaults to 60s and periodically triggers onRefreshData', async () => {
  assert.equal(DEFAULT_ADMIN_POLL_INTERVAL_MS, 60_000);
  let count = 0;
  const ctrl = createAdminPollingController({
    intervalMs: 30,
    onRefreshData: () => {
      count += 1;
    },
  });
  ctrl.start();
  await new Promise((r) => setTimeout(r, 85));
  ctrl.stop();
  assert.ok(count >= 2);
});

test('errorBoundaryService normalizes errors, builds deterministic incident reports, and evaluates resetKeys', () => {
  const norm = normalizeRuntimeError(new Error('Test portal crash'));
  assert.equal(norm.message, 'Test portal crash');
  assert.ok(parseStackLines('line1\nline2').length === 2);

  const report = buildErrorIncidentReport(new Error('Boom'), 'admin');
  assert.ok(report.incidentId.startsWith('INC-ADMIN-'));
  assert.equal(shouldAutoResetBoundary(['admin'], ['operations']), true);
  assert.equal(shouldAutoResetBoundary(['admin'], ['admin']), false);
});

test('themeSettingsService provides Midnight and Deep Space presets, toggles, and persists to storage', () => {
  const presets = getAllThemePresets();
  assert.equal(presets.length, 2);
  assert.equal(getThemePresetConfig('deep-space').badgeText, 'DEEP SPACE');
  assert.equal(resolveNextThemePreset('midnight'), 'deep-space');
  savePersistedThemePreset('deep-space');
  assert.equal(loadPersistedThemePreset(), 'deep-space');
});

test('idleSessionService enforces 15-minute timeout, resets on activity, and verifies re-authentication credentials', () => {
  assert.equal(DEFAULT_IDLE_TIMEOUT_MS, 900_000);
  assert.equal(formatIdleCountdown(900_000), '15:00');

  const controller = createIdleSessionController({ timeoutMs: 1000 });
  controller.tick(600);
  assert.equal(controller.getState().isLocked, false);
  controller.tick(500);
  assert.equal(controller.getState().isLocked, true);

  assert.equal(verifySessionUnlockCredential('wrong', INITIAL_USERS[0]), false);
  assert.equal(controller.attemptUnlock('admin', INITIAL_USERS[0]), true);
  assert.equal(controller.getState().isLocked, false);
});

test('activityTimelineService classifies system events, computes login and portal switch metrics, and sorts chronologically', () => {
  assert.equal(classifyTimelineCategory('user_login'), 'auth_and_portal');
  assert.equal(classifyTimelineCategory('portal_switch'), 'auth_and_portal');
  assert.equal(classifyTimelineCategory('schedule_update'), 'dispatch_and_ops');
  assert.equal(classifyTimelineCategory('ticket_reservation'), 'tickets_and_wallet');

  const sampleLogs = [
    {
      id: 'tl-1',
      timestamp: '2026-11-03T08:00:00.000Z',
      actorId: 'usr-admin-1',
      actorName: 'سید علی محمدی',
      actorRole: 'admin' as const,
      actionType: 'user_login' as const,
      entityType: 'user' as const,
      entityId: 'usr-admin-1',
      summaryFa: 'ورود مدیر ارشد به سامانه',
      summaryEn: 'Admin login to system',
      metadata: { username: 'admin' },
      ipAddress: '192.168.10.1',
      riskLevel: 'low' as const,
      status: 'success' as const,
      verificationHash: 'sha256-tl1',
    },
    {
      id: 'tl-2',
      timestamp: '2026-11-03T08:15:00.000Z',
      actorId: 'usr-admin-1',
      actorName: 'سید علی محمدی',
      actorRole: 'admin' as const,
      actionType: 'portal_switch' as const,
      entityType: 'system' as const,
      entityId: 'operations',
      summaryFa: 'جابجایی پرتال کاری از مدیریت به عملیات',
      summaryEn: 'Switched workspace portal from Admin to Operations',
      metadata: { fromPortal: 'admin', toPortal: 'operations' },
      ipAddress: '192.168.10.1',
      riskLevel: 'low' as const,
      status: 'success' as const,
      verificationHash: 'sha256-tl2',
    },
  ];

  const metrics = computeTimelineSummaryMetrics(sampleLogs);
  assert.equal(metrics.totalEvents, 2);
  assert.equal(metrics.loginCount, 1);
  assert.equal(metrics.portalSwitchCount, 1);

  const feed = buildGlobalActivityTimeline(sampleLogs, { sortOrder: 'newest' });
  assert.equal(feed.items[0].log.id, 'tl-2');

  const switchLog = recordPortalSwitchEvent(INITIAL_USERS[0], 'admin', 'operations');
  assert.equal(switchLog.actionType, 'portal_switch');
});

test('commandPaletteService detects Ctrl+K shortcut, filters views (Audit Logs, Performance Dashboard, System Settings), and wraps keyboard selection', () => {
  assert.equal(isCommandPaletteShortcut({ key: 'k', ctrlKey: true }), true);
  assert.equal(isCommandPaletteShortcut({ key: 'K', metaKey: true }), true);
  assert.equal(isCommandPaletteShortcut({ key: 'k', ctrlKey: false, metaKey: false }), false);

  const allCommands = getDefaultAdminCommands();
  const auditMatches = filterCommandPaletteItems(allCommands, 'Audit Logs');
  assert.equal(auditMatches[0].targetTab, 'activity-monitor');

  const perfMatches = filterCommandPaletteItems(allCommands, 'Performance Dashboard');
  assert.equal(perfMatches[0].targetTab, 'overview');

  const settingsMatches = filterCommandPaletteItems(allCommands, 'System Settings');
  assert.equal(settingsMatches[0].targetTab, 'system-settings');

  assert.equal(moveCommandSelection(0, 5, 'down'), 1);
  assert.equal(moveCommandSelection(4, 5, 'down'), 0);
  assert.equal(moveCommandSelection(0, 5, 'up'), 4);
});

test('loadingFeedbackService maps progress percentages to Tailwind width classes and resolves bilingual stage metadata', () => {
  assert.equal(resolveTailwindProgressWidthClass(0), 'w-0');
  assert.equal(resolveTailwindProgressWidthClass(25), 'w-1/4');
  assert.equal(resolveTailwindProgressWidthClass(50), 'w-1/2');
  assert.equal(resolveTailwindProgressWidthClass(75), 'w-3/4');
  assert.equal(resolveTailwindProgressWidthClass(100), 'w-full');

  assert.equal(resolveAdminTabSkeletonVariant('overview'), 'dashboard');
  assert.equal(resolveAdminTabSkeletonVariant('activity-monitor'), 'timeline');

  const opsStageMid = getOperationStageMetadata('ops_corridor_switch', 76);
  assert.equal(opsStageMid.widthClass, 'w-3/4');
  assert.ok(opsStageMid.stageLabelFa.includes('checkAccident'));

  const adminSyncState = createLoadingFeedbackState(
    'admin_data_sync',
    68,
    true,
    true,
    true,
    'dashboard'
  );
  assert.equal(adminSyncState.progressPercent, 68);
  assert.equal(adminSyncState.widthClass, 'w-2/3');
});

test('adminPrintReportService compiles printer-friendly performance dashboard statistics and audit log records', () => {
  const sampleLogs = [
    {
      id: 'prt-log-1',
      timestamp: '2026-11-03T10:20:00.000Z',
      actorId: 'usr-pass-1',
      actorName: 'سارا راد',
      actorRole: 'passenger' as const,
      actionType: 'ticket_reservation' as const,
      entityType: 'ticket' as const,
      entityId: 'PNR-8921-FA',
      summaryFa: 'رزرو ۲ صندلی قطار ۱۰۱ فدک',
      summaryEn: 'Reserved 2 seats on Train 101 Fadak',
      metadata: { pnr: 'PNR-8921-FA' },
      ipAddress: '192.168.10.42',
      riskLevel: 'low' as const,
      status: 'success' as const,
      verificationHash: 'sha256-abcdef1234567890abcdef',
    },
    {
      id: 'prt-log-2',
      timestamp: '2026-11-03T11:05:00.000Z',
      actorId: 'usr-emp-1',
      actorName: 'مهندس رضا شمس',
      actorRole: 'employee' as const,
      actionType: 'schedule_update' as const,
      entityType: 'schedule' as const,
      entityId: 'TR-202',
      summaryFa: 'بروزرسانی سرعت قطار ۲۰۲',
      summaryEn: 'Updated Train 202 speed',
      metadata: { trainId: 'TR-202' },
      ipAddress: '192.168.10.10',
      riskLevel: 'high' as const,
      status: 'success' as const,
      verificationHash: 'sha256-9876543210fedcba987654',
    },
  ];

  const report = buildAdminPrintableReport({
    lines: INITIAL_LINES,
    schedules: INITIAL_SCHEDULES,
    tickets: INITIAL_TICKETS,
    auditLogs: sampleLogs,
    currentUser: INITIAL_USERS[0],
  });

  assert.ok(report.reportId.startsWith('RPT-ADMIN-'));
  assert.ok(report.performanceStats.totalRevenue > 0);
  assert.ok(report.performanceStats.confirmedTicketsCount >= 1);
  assert.equal(report.performanceStats.activeCorridorsCount, INITIAL_LINES.length);
  assert.equal(report.performanceStats.scheduledTrainsCount, INITIAL_SCHEDULES.length);
  assert.equal(report.performanceStats.corridorRows.length, INITIAL_LINES.length);

  assert.equal(report.auditSummary.totalLogs, 2);
  assert.equal(report.auditSummary.reservationsCount, 1);
  assert.equal(report.auditSummary.scheduleChangesCount, 1);
  assert.equal(report.auditSummary.highRiskCount, 1);
  assert.equal(report.auditSummary.verifiedHashCount, 2);

  assert.equal(report.auditRows.length, 2);
  assert.equal(report.auditRows[0].entityId, 'PNR-8921-FA');
  assert.ok(report.auditRows[0].shortHash.startsWith('sha256-'));
});
