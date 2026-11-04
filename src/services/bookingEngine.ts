import {
  User,
  TrainSchedule,
  Ticket,
  WalletTransaction,
} from '../types/railpulse';
import { getDatabase, saveDatabase } from './storageAndMigration';
import { recordAuditAction } from './auditLogService';

export interface BookingResult {
  success: boolean;
  ticket?: Ticket;
  transaction?: WalletTransaction;
  errorMessageFa?: string;
  errorMessageEn?: string;
}

export function reserveTickets(
  user: User,
  scheduleId: string,
  seatCount: number
): BookingResult {
  if (!Number.isInteger(seatCount) || seatCount <= 0) {
    return {
      success: false,
      errorMessageFa: 'تعداد صندلی باید یک عدد صحیح مثبت باشد.',
      errorMessageEn: 'Seat count must be a positive integer.',
    };
  }

  const db = getDatabase();
  const dbUser = db.users.find((u) => u.id === user.id);
  const schedule = db.schedules.find((s) => s.id === scheduleId);

  if (!dbUser || !schedule) {
    return {
      success: false,
      errorMessageFa: 'کاربر یا برنامه حرکت قطار یافت نشد.',
      errorMessageEn: 'User or train schedule not found.',
    };
  }

  const remainingCapacity = schedule.totalCapacity - schedule.bookedSeats;
  if (seatCount > remainingCapacity) {
    return {
      success: false,
      errorMessageFa: `ظرفیت کافی موجود نیست. صندلی باقی‌مانده: ${remainingCapacity}`,
      errorMessageEn: `Insufficient seat capacity. Remaining: ${remainingCapacity}`,
    };
  }

  const totalCost = schedule.ticketPrice * seatCount;
  if (dbUser.walletBalance < totalCost) {
    return {
      success: false,
      errorMessageFa: 'موجودی کیف پول دیجیتال برای خرید این بلیت کافی نیست.',
      errorMessageEn: 'Insufficient digital wallet balance for this reservation.',
    };
  }

  const line = db.lines.find((l) => l.id === schedule.lineId);
  dbUser.walletBalance -= totalCost;
  schedule.bookedSeats += seatCount;

  const pnr = `PNR-${Math.floor(1000 + Math.random() * 9000)}-FA`;
  const seatNumbers = Array.from(
    { length: seatCount },
    (_, idx) => `C2-${schedule.bookedSeats - idx}A`
  );

  const ticket: Ticket = {
    id: `tk-${Date.now()}`,
    pnr,
    userId: dbUser.id,
    passengerName: dbUser.fullName,
    scheduleId: schedule.id,
    trainNumber: schedule.trainNumber,
    lineNameFa: line?.nameFa || 'خط سراسری',
    lineNameEn: line?.nameEn || 'Mainline Corridor',
    departureTime: schedule.departureTime,
    seatCount,
    seatNumbers,
    totalPrice: totalCost,
    purchasedAt: new Date().toISOString(),
    status: 'confirmed',
    qrPayload: `RAILPULSE|${pnr}|${schedule.id}|SEATS:${seatCount}|VERIFIED`,
  };

  const transaction: WalletTransaction = {
    id: `tx-pur-${Date.now()}`,
    userId: dbUser.id,
    type: 'purchase',
    amount: totalCost,
    balanceAfter: dbUser.walletBalance,
    descriptionFa: `خرید ${seatCount} بلیت قطار ${schedule.trainNumber} (${pnr})`,
    descriptionEn: `Purchased ${seatCount} ticket(s) on ${schedule.trainNumber} (${pnr})`,
    timestamp: new Date().toISOString(),
    referenceId: pnr,
  };

  db.tickets.unshift(ticket);
  db.transactions.unshift(transaction);
  saveDatabase(db);

  recordAuditAction({
    actorId: dbUser.id,
    actorName: dbUser.fullName,
    actorRole: dbUser.role,
    actionType: 'ticket_reservation',
    entityType: 'ticket',
    entityId: pnr,
    summaryFa: `رزرو قطعی ${seatCount} صندلی در قطار ${schedule.trainNumber} به مبلغ ${totalCost.toLocaleString('fa-IR')} تومان`,
    summaryEn: `Confirmed reservation of ${seatCount} seat(s) on ${schedule.trainNumber} for ${totalCost} TMN`,
    metadata: { pnr, scheduleId: schedule.id, seatCount, totalCost },
    riskLevel: 'low',
    status: 'success',
  });

  return { success: true, ticket, transaction };
}

export function depositToWallet(user: User, amount: number): BookingResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      errorMessageFa: 'مبلغ شارژ باید بزرگتر از صفر باشد.',
      errorMessageEn: 'Deposit amount must be greater than zero.',
    };
  }

  const db = getDatabase();
  const dbUser = db.users.find((u) => u.id === user.id);
  if (!dbUser) {
    return {
      success: false,
      errorMessageFa: 'کاربر یافت نشد.',
      errorMessageEn: 'User not found.',
    };
  }

  dbUser.walletBalance += Math.round(amount);
  const tx: WalletTransaction = {
    id: `tx-dep-${Date.now()}`,
    userId: dbUser.id,
    type: 'deposit',
    amount: Math.round(amount),
    balanceAfter: dbUser.walletBalance,
    descriptionFa: `شارژ کیف پول دیجیتال به مبلغ ${Math.round(amount).toLocaleString('fa-IR')} تومان`,
    descriptionEn: `Digital wallet top-up of ${Math.round(amount)} TMN`,
    timestamp: new Date().toISOString(),
  };

  db.transactions.unshift(tx);
  saveDatabase(db);

  recordAuditAction({
    actorId: dbUser.id,
    actorName: dbUser.fullName,
    actorRole: dbUser.role,
    actionType: 'wallet_deposit',
    entityType: 'wallet',
    entityId: tx.id,
    summaryFa: tx.descriptionFa,
    summaryEn: tx.descriptionEn,
    metadata: { amount: tx.amount, balanceAfter: tx.balanceAfter },
    riskLevel: 'low',
    status: 'success',
  });

  return { success: true, transaction: tx };
}

export function updateTrainSchedule(
  scheduleId: string,
  updates: Partial<Pick<TrainSchedule, 'departureTime' | 'speedKmh' | 'totalCapacity' | 'ticketPrice' | 'status'>>,
  actor: User
): { success: boolean; schedule?: TrainSchedule } {
  const db = getDatabase();
  const schedule = db.schedules.find((s) => s.id === scheduleId);
  if (!schedule) return { success: false };

  Object.assign(schedule, updates);
  saveDatabase(db);

  recordAuditAction({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    actionType: 'schedule_update',
    entityType: 'schedule',
    entityId: schedule.id,
    summaryFa: `بروزرسانی برنامه حرکت قطار ${schedule.trainNumber} (ساعت حرکت: ${schedule.departureTime}، سرعت: ${schedule.speedKmh} km/h)`,
    summaryEn: `Updated schedule for train ${schedule.trainNumber} (Dep: ${schedule.departureTime}, Speed: ${schedule.speedKmh} km/h)`,
    metadata: { scheduleId: schedule.id, ...updates },
    riskLevel: 'high',
    status: 'success',
  });

  return { success: true, schedule };
}

export function createTrainSchedule(
  input: Omit<TrainSchedule, 'id' | 'bookedSeats'>,
  actor: User
): { success: boolean; schedule: TrainSchedule } {
  const db = getDatabase();
  const newSchedule: TrainSchedule = {
    ...input,
    id: `TR-${Date.now().toString().slice(-4)}`,
    bookedSeats: 0,
  };

  db.schedules.push(newSchedule);
  saveDatabase(db);

  recordAuditAction({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    actionType: 'schedule_create',
    entityType: 'schedule',
    entityId: newSchedule.id,
    summaryFa: `تعریف برنامه حرکت قطار جدید ${newSchedule.trainNumber} در ساعت ${newSchedule.departureTime}`,
    summaryEn: `Created new train schedule ${newSchedule.trainNumber} departing at ${newSchedule.departureTime}`,
    metadata: { scheduleId: newSchedule.id, lineId: newSchedule.lineId },
    riskLevel: 'medium',
    status: 'success',
  });

  return { success: true, schedule: newSchedule };
}
