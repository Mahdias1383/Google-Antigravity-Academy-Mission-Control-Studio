export type UserRole = 'admin' | 'employee' | 'passenger';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  walletBalance: number;
  nationalId?: string;
  phoneNumber?: string;
  assignedLines?: string[]; // for employee role
  createdAt: string;
}

export interface StationNode {
  id: string;
  nameFa: string;
  nameEn: string;
  code: string;
  kmFromStart: number;
  platformsCount: number;
}

export interface TrainLine {
  id: string;
  code: string;
  nameFa: string;
  nameEn: string;
  stations: StationNode[];
  totalDistanceKm: number;
  status: 'active' | 'maintenance' | 'restricted';
}

export type TrainType = 'high-speed' | 'express' | 'intercity' | 'freight';
export type TrainStatus = 'scheduled' | 'running' | 'delayed' | 'cancelled';

export interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainNameFa: string;
  trainNameEn: string;
  lineId: string;
  departureTime: string; // "HH:MM" e.g. "08:30"
  speedKmh: number;
  stopTimesMinutes: number[]; // stop duration at each intermediate station
  totalCapacity: number;
  bookedSeats: number;
  ticketPrice: number;
  trainType: TrainType;
  status: TrainStatus;
}

export interface StationTimePoint {
  stationId: string;
  stationNameFa: string;
  stationNameEn: string;
  kmFromStart: number;
  arrivalTimeMinutes: number; // minutes from 00:00
  departureTimeMinutes: number; // minutes from 00:00
  arrivalTimeStr: string; // "HH:MM"
  departureTimeStr: string; // "HH:MM"
}

export interface CalculatedTrainTrajectory {
  train: TrainSchedule;
  line: TrainLine;
  timePoints: StationTimePoint[];
}

export type ConflictType = 'platform-overlap' | 'segment-overtake' | 'head-on' | 'spacing-violation';
export type ConflictSeverity = 'critical' | 'warning' | 'info';

export interface SafetyConflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  trainAId: string;
  trainBId: string;
  trainANumber: string;
  trainBNumber: string;
  lineId: string;
  lineNameFa: string;
  lineNameEn: string;
  locationName: string;
  estimatedConflictTime: string;
  detailsFa: string;
  detailsEn: string;
  mathematicalProof: string;
}

export interface Ticket {
  id: string;
  pnr: string;
  trainId: string;
  trainNumber: string;
  trainNameFa: string;
  trainNameEn: string;
  lineId: string;
  lineNameFa: string;
  lineNameEn: string;
  passengerId: string;
  passengerName: string;
  passengerNationalId: string;
  seatCount: number;
  seatNumbers: number[];
  unitPrice: number;
  totalPrice: number;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  estimatedArrivalTime: string;
  bookingTimestamp: string;
  status: 'confirmed' | 'cancelled' | 'boarded';
  qrPayload: string;
}

export type TransactionType = 'credit' | 'debit' | 'refund';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  referenceId: string;
  descriptionFa: string;
  descriptionEn: string;
  timestamp: string;
}

// Automated Audit Log Types
export type AuditActionType =
  | 'ticket_reservation'
  | 'ticket_cancellation'
  | 'schedule_create'
  | 'schedule_update'
  | 'schedule_delete'
  | 'line_create'
  | 'line_update'
  | 'wallet_deposit'
  | 'wallet_debit'
  | 'employee_register'
  | 'safety_override'
  | 'user_login'
  | 'migration_run';

export type AuditEntityType = 'ticket' | 'schedule' | 'line' | 'wallet' | 'user' | 'system';
export type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'system';
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  summaryFa: string;
  summaryEn: string;
  metadata: Record<string, any>;
  ipAddress: string;
  riskLevel: AuditRiskLevel;
  status: 'success' | 'failure' | 'blocked';
  verificationHash: string;
}

export interface LegacyV1Schema {
  user_dict: Record<string, { username: string; email: string; password: string; wallet: number }>;
  employee_dict: Record<string, { username: string; email: string; password: string; line_access?: string[] }>;
  line_dic: Record<string, { name: string; stations: string[]; distances: number[] }>;
  train_dic: Record<string, { train_num: string; line: string; departure: string; speed: number; stops: number[]; capacity: number; price: number }>;
}

export interface MigrationLog {
  id: string;
  legacyFormat: string;
  targetVersion: string;
  migratedUsers: number;
  migratedEmployees: number;
  migratedLines: number;
  migratedTrains: number;
  timestamp: string;
  status: 'completed' | 'failed';
  diffSummary: string[];
}
