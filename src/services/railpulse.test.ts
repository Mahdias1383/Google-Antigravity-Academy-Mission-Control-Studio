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


