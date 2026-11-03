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
  errorMessageFa?: string;
  errorMessageEn?: string;
}

export interface CancellationResult {
  success: boolean;
  refundAmount?: number;
  errorMessageFa?: string;
  errorMessageEn?: string;
}

/**
 * Generates an alphanumeric PNR (Passenger Name Record)
 */
function generatePNR(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PNR-${code}-IR`;
}

/**
 * Atomic Ticket Purchase with Balance Deduction and Automated Audit Logging
 */
export function reserveTickets(
  passenger: User,
  trainId: string,
  seatCount: number,
  departureStationName?: string,
  arrivalStationName?: string
): BookingResult {
  // Input validations
  if (!passenger || !passenger.id) {
    return {
      success: false,
      errorMessageFa: 'خطا: اطلاعات کاربری مسافر معتبر نیست.',
      errorMessageEn: 'Error: Invalid passenger credentials.',
    };
  }

  if (!Number.isInteger(seatCount) || seatCount <= 0) {
    return {
      success: false,
      errorMessageFa: 'خطا: تعداد بلیت درخواستی باید عدد صحیح مثبت باشد.',
      errorMessageEn: 'Error: Seat count must be a positive integer.',
    };
  }

  const db = getDatabase();
  const train = db.schedules.find((s) => s.id === trainId);
  if (!train) {
    return {
      success: false,
      errorMessageFa: 'خطا: قطار مورد نظر در برنامه حرکت سامانه یافت نشد.',
      errorMessageEn: 'Error: Requested train schedule not found.',
    };
  }

  if (train.status === 'cancelled') {
    return {
      success: false,
      errorMessageFa: 'خطا: حرکت این قطار لغو شده است.',
      errorMessageEn: 'Error: This train schedule has been cancelled.',
    };
  }

  const line = db.lines.find((l) => l.id === train.lineId);
  const remainingCapacity = train.totalCapacity - train.bookedSeats;
  if (seatCount > remainingCapacity) {
    recordAuditAction({
      actorId: passenger.id,
      actorName: passenger.fullName,
      actorRole: passenger.role,
      actionType: 'ticket_reservation',
      entityType: 'ticket',
      entityId: train.id,
      summaryFa: `تلاش ناموفق مسافر برای رزرو ${seatCount} صندلی قطار ${train.trainNumber} به دلیل تکمیل ظرفیت`,
      summaryEn: `Failed reservation attempt by passenger for ${seatCount} seats on Train ${train.trainNumber} (capacity exceeded)`,
      metadata: { trainNumber: train.trainNumber, requested: seatCount, available: remainingCapacity },
      riskLevel: 'low',
      status: 'blocked',
    });

    return {
      success: false,
      errorMessageFa: `ظرفیت صندلی‌های باقیمانده قطار ناکافی است. (ظرفیت خالی: ${remainingCapacity} صندلی)`,
      errorMessageEn: `Insufficient seat capacity remaining. (Available: ${remainingCapacity} seats)`,
    };
  }

  const totalPrice = seatCount * train.ticketPrice;
  const userInDb = db.users.find((u) => u.id === passenger.id);
  const currentBalance = userInDb ? userInDb.walletBalance : passenger.walletBalance;

  if (currentBalance < totalPrice) {
    const deficit = totalPrice - currentBalance;
    recordAuditAction({
      actorId: passenger.id,
      actorName: passenger.fullName,
      actorRole: passenger.role,
      actionType: 'ticket_reservation',
      entityType: 'ticket',
      entityId: train.id,
      summaryFa: `تلاش ناموفق برای خرید بلیت قطار ${train.trainNumber}: موجودی کیف پول (${currentBalance.toLocaleString('fa-IR')} تومان) کمتر از مبلغ بلیت (${totalPrice.toLocaleString('fa-IR')} تومان) است.`,
      summaryEn: `Insufficient wallet balance for Train ${train.trainNumber} reservation. Deficit: ${deficit.toLocaleString('en-US')} Tomans.`,
      metadata: { currentBalance, totalPrice, deficit, trainNumber: train.trainNumber },
      riskLevel: 'low',
      status: 'blocked',
    });

    return {
      success: false,
      errorMessageFa: `موجودی کیف پول شما کافی نیست. به مبلغ ${deficit.toLocaleString('fa-IR')} تومان شارژ نیاز دارید.`,
      errorMessageEn: `Insufficient wallet balance. You need ${deficit.toLocaleString('en-US')} Tomans more.`,
    };
  }

  // ATOMIC TRANSACTION EXECUTION:
  // 1. Deduct wallet
  const previousBalance = currentBalance;
  const newBalance = currentBalance - totalPrice;
  if (userInDb) {
    userInDb.walletBalance = newBalance;
  }

  // 2. Generate Seat Numbers
  const startSeat = train.bookedSeats + 1;
  const seatNumbers: number[] = [];
  for (let i = 0; i < seatCount; i++) {
    seatNumbers.push(startSeat + i);
  }

  // 3. Increment Booked Seats
  train.bookedSeats += seatCount;

  // 4. Create Ticket Record
  const pnr = generatePNR();
  const ticketId = `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const depStation = departureStationName || line?.stations[0]?.nameFa || 'تهران (مرکزی)';
  const arrStation = arrivalStationName || line?.stations[line?.stations.length - 1]?.nameFa || 'مشهد مقدس';

  const ticket: Ticket = {
    id: ticketId,
    pnr,
    trainId: train.id,
    trainNumber: train.trainNumber,
    trainNameFa: train.trainNameFa,
    trainNameEn: train.trainNameEn,
    lineId: train.lineId,
    lineNameFa: line?.nameFa || 'مسیر ریلی سراسری',
    lineNameEn: line?.nameEn || 'National Rail Corridor',
    passengerId: passenger.id,
    passengerName: passenger.fullName,
    passengerNationalId: passenger.nationalId || '0098765432',
    seatCount,
    seatNumbers,
    unitPrice: train.ticketPrice,
    totalPrice,
    departureStation: depStation,
    arrivalStation: arrStation,
    departureTime: train.departureTime,
    estimatedArrivalTime: 'محاسبه شده طبق سرعت سیر',
    bookingTimestamp: new Date().toISOString(),
    status: 'confirmed',
    qrPayload: `RAILPULSE:${pnr}:${passenger.id}:${train.trainNumber}:SEATS-${seatNumbers.join(',')}:${totalPrice}`,
  };
  db.tickets.unshift(ticket);

  // 5. Append Wallet Ledger Record
  const tx: WalletTransaction = {
    id: `tx-${Date.now()}`,
    userId: passenger.id,
    type: 'debit',
    amount: totalPrice,
    previousBalance,
    newBalance,
    referenceId: pnr,
    descriptionFa: `کسر وجه بابت رزرو ${seatCount} صندلی قطار ${train.trainNumber} (${depStation} به ${arrStation})`,
    descriptionEn: `Debit for reservation of ${seatCount} seat(s) on Train ${train.trainNumber} (${depStation} to ${arrStation})`,
    timestamp: new Date().toISOString(),
  };
  db.transactions.unshift(tx);

  // Save to persistent storage
  saveDatabase(db);

  // AUTOMATED AUDIT LOGGING:
  recordAuditAction({
    actorId: passenger.id,
    actorName: passenger.fullName,
    actorRole: passenger.role,
    actionType: 'ticket_reservation',
    entityType: 'ticket',
    entityId: pnr,
    summaryFa: `صدور و رزرو قطعی ${seatCount} صندلی در قطار ${train.trainNumber} به شماره PNR: ${pnr} به مبلغ کل ${totalPrice.toLocaleString('fa-IR')} تومان`,
    summaryEn: `Confirmed booking of ${seatCount} seat(s) on Train ${train.trainNumber} [PNR: ${pnr}], total: ${totalPrice.toLocaleString('en-US')} Tomans`,
    metadata: {
      pnr,
      ticketId,
      trainId: train.id,
      trainNumber: train.trainNumber,
      seatNumbers,
      seatCount,
      totalPrice,
      departureStation: depStation,
      arrivalStation: arrStation,
      newWalletBalance: newBalance,
    },
    riskLevel: 'low',
    status: 'success',
  });

  return {
    success: true,
    ticket,
  };
}

/**
 * Cancels a ticket, restores seat inventory, and refunds wallet
 */
export function cancelTicket(ticketId: string, actor: User): CancellationResult {
  const db = getDatabase();
  const ticket = db.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return {
      success: false,
      errorMessageFa: 'خطا: بلیت مورد نظر یافت نشد.',
      errorMessageEn: 'Error: Ticket not found.',
    };
  }

  if (ticket.status === 'cancelled') {
    return {
      success: false,
      errorMessageFa: 'این بلیت قبلاً لغو شده است.',
      errorMessageEn: 'This ticket has already been cancelled.',
    };
  }

  // Find train and return seats
  const train = db.schedules.find((s) => s.id === ticket.trainId);
  if (train) {
    train.bookedSeats = Math.max(0, train.bookedSeats - ticket.seatCount);
  }

  // Refund passenger wallet
  const passenger = db.users.find((u) => u.id === ticket.passengerId);
  const refundAmount = ticket.totalPrice;
  if (passenger) {
    const prevBal = passenger.walletBalance;
    const newBal = prevBal + refundAmount;
    passenger.walletBalance = newBal;

    db.transactions.unshift({
      id: `tx-refund-${Date.now()}`,
      userId: passenger.id,
      type: 'refund',
      amount: refundAmount,
      previousBalance: prevBal,
      newBalance: newBal,
      referenceId: ticket.pnr,
      descriptionFa: `استرداد و بازگشت وجه لغو بلیت ${ticket.pnr} (${ticket.trainNumber})`,
      descriptionEn: `Full refund for cancellation of ticket ${ticket.pnr} (${ticket.trainNumber})`,
      timestamp: new Date().toISOString(),
    });
  }

  ticket.status = 'cancelled';
  saveDatabase(db);

  // AUTOMATED AUDIT LOGGING:
  recordAuditAction({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    actionType: 'ticket_cancellation',
    entityType: 'ticket',
    entityId: ticket.pnr,
    summaryFa: `لغو بلیت ${ticket.pnr} (قطار ${ticket.trainNumber}) و استرداد ${refundAmount.toLocaleString('fa-IR')} تومان به کیف پول مسافر`,
    summaryEn: `Cancelled ticket ${ticket.pnr} (Train ${ticket.trainNumber}) and refunded ${refundAmount.toLocaleString('en-US')} Tomans to wallet`,
    metadata: {
      pnr: ticket.pnr,
      trainNumber: ticket.trainNumber,
      seatCount: ticket.seatCount,
      refundAmount,
      cancelledBy: actor.fullName,
    },
    riskLevel: 'medium',
    status: 'success',
  });

  return {
    success: true,
    refundAmount,
  };
}

/**
 * Top-Up Passenger / User Wallet Balance
 */
export function topUpWallet(user: User, amount: number): { success: boolean; newBalance: number } {
  if (amount <= 0) return { success: false, newBalance: user.walletBalance };

  const db = getDatabase();
  const targetUser = db.users.find((u) => u.id === user.id);
  const prevBal = targetUser ? targetUser.walletBalance : user.walletBalance;
  const newBal = prevBal + amount;

  if (targetUser) {
    targetUser.walletBalance = newBal;
  }

  const txId = `tx-topup-${Date.now()}`;
  db.transactions.unshift({
    id: txId,
    userId: user.id,
    type: 'credit',
    amount,
    previousBalance: prevBal,
    newBalance: newBal,
    referenceId: `DEP-${Date.now().toString().slice(-6)}`,
    descriptionFa: `افزایش و شارژ آنلاین موجودی کیف پول به مبلغ ${amount.toLocaleString('fa-IR')} تومان`,
    descriptionEn: `Online wallet balance top-up: ${amount.toLocaleString('en-US')} Tomans`,
    timestamp: new Date().toISOString(),
  });

  saveDatabase(db);

  // AUTOMATED AUDIT LOGGING:
  recordAuditAction({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    actionType: 'wallet_deposit',
    entityType: 'wallet',
    entityId: txId,
    summaryFa: `شارژ آنلاین کیف پول مسافر «${user.fullName}» به مبلغ ${amount.toLocaleString('fa-IR')} تومان (موجودی جدید: ${newBal.toLocaleString('fa-IR')} تومان)`,
    summaryEn: `Online wallet deposit by ${user.fullName}: ${amount.toLocaleString('en-US')} Tomans (New balance: ${newBal.toLocaleString('en-US')})`,
    metadata: { amount, prevBal, newBal, txId },
    riskLevel: 'low',
    status: 'success',
  });

  return { success: true, newBalance: newBal };
}

/**
 * Staff or Admin Modifies a Train Schedule
 */
export function updateTrainSchedule(
  scheduleId: string,
  updates: Partial<TrainSchedule>,
  actor: User
): { success: boolean; schedule?: TrainSchedule; error?: string } {
  const db = getDatabase();
  const schedule = db.schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    return { success: false, error: 'Schedule not found' };
  }

  const oldValues = {
    departureTime: schedule.departureTime,
    speedKmh: schedule.speedKmh,
    totalCapacity: schedule.totalCapacity,
    ticketPrice: schedule.ticketPrice,
    status: schedule.status,
  };

  Object.assign(schedule, updates);
  saveDatabase(db);

  // AUTOMATED AUDIT LOGGING:
  recordAuditAction({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    actionType: 'schedule_update',
    entityType: 'schedule',
    entityId: schedule.id,
    summaryFa: `ویرایش مشخصات برنامه حرکت قطار ${schedule.trainNumber} توسط ${actor.fullName}`,
    summaryEn: `Updated train schedule ${schedule.trainNumber} by ${actor.fullName}`,
    metadata: {
      trainNumber: schedule.trainNumber,
      changedFields: Object.keys(updates),
      oldValues,
      newValues: updates,
    },
    riskLevel: 'high',
    status: 'success',
  });

  return { success: true, schedule };
}

/**
 * Staff or Admin Creates a New Train Schedule
 */
export function createTrainSchedule(
  newSchedule: Omit<TrainSchedule, 'id' | 'bookedSeats'>,
  actor: User
): { success: boolean; schedule?: TrainSchedule } {
  const db = getDatabase();
  const id = `TR-${Date.now().toString().slice(-4)}`;

  const schedule: TrainSchedule = {
    ...newSchedule,
    id,
    bookedSeats: 0,
  };

  db.schedules.push(schedule);
  saveDatabase(db);

  // AUTOMATED AUDIT LOGGING:
  recordAuditAction({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    actionType: 'schedule_create',
    entityType: 'schedule',
    entityId: id,
    summaryFa: `ثبت و زمان‌بندی قطار جدید ${schedule.trainNumber} (${schedule.trainNameFa}) توسط ${actor.fullName}`,
    summaryEn: `Created new train schedule ${schedule.trainNumber} (${schedule.trainNameEn}) by ${actor.fullName}`,
    metadata: {
      scheduleId: id,
      trainNumber: schedule.trainNumber,
      lineId: schedule.lineId,
      departureTime: schedule.departureTime,
      speedKmh: schedule.speedKmh,
      capacity: schedule.totalCapacity,
    },
    riskLevel: 'high',
    status: 'success',
  });

  return { success: true, schedule };
}
