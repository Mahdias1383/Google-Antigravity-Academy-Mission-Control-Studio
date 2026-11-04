export type UserRole = 'admin' | 'employee' | 'passenger' | 'system';

export type PortalTab = 'admin' | 'operations' | 'passenger' | 'qa';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  walletBalance: number;
  assignedLines?: string[];
  createdAt: string;
}

export interface StationNode {
  id: string;
  nameFa: string;
  nameEn: string;
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
}

export interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainNameFa: string;
  trainNameEn: string;
  lineId: string;
  departureTime: string; // HH:MM
  speedKmh: number;
  stopTimesMinutes: number[];
  totalCapacity: number;
  bookedSeats: number;
  ticketPrice: number;
  trainType: 'high_speed' | 'express' | 'sleeper';
  status: 'scheduled' | 'active' | 'delayed' | 'cancelled';
}

export interface Ticket {
  id: string;
  pnr: string;
  userId: string;
  passengerName: string;
  scheduleId: string;
  trainNumber: string;
  lineNameFa: string;
  lineNameEn: string;
  departureTime: string;
  seatCount: number;
  seatNumbers: string[];
  totalPrice: number;
  purchasedAt: string;
  status: 'confirmed' | 'cancelled';
  qrPayload: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'purchase' | 'refund';
  amount: number;
  balanceAfter: number;
  descriptionFa: string;
  descriptionEn: string;
  timestamp: string;
  referenceId?: string;
}

export interface SafetyConflict {
  id: string;
  lineId: string;
  conflictType: 'station_platform_overlap' | 'segment_overtake_collision';
  trainAId: string;
  trainANumber: string;
  trainBId: string;
  trainBNumber: string;
  locationName: string;
  estimatedConflictTime: string;
  detailsFa: string;
  detailsEn: string;
  mathematicalProof: string;
  severity: 'critical' | 'warning';
}

export interface MigrationLog {
  id: string;
  timestamp: string;
  executedBy: string;
  migratedUsers: number;
  migratedEmployees: number;
  migratedLines: number;
  migratedTrains: number;
  diffSummary: string[];
}

export interface LegacyV1Schema {
  user_dict: Record<
    string,
    { username: string; email: string; password: string; wallet: number }
  >;
  employee_dict: Record<
    string,
    { username: string; email: string; password: string; line_access: string[] }
  >;
  line_dic: Record<
    string,
    { name: string; stations: string[]; distances: number[] }
  >;
  train_dic: Record<
    string,
    {
      train_num: string;
      line: string;
      departure: string;
      speed: number;
      stops: number[];
      capacity: number;
      price: number;
    }
  >;
}

export type AuditActionType =
  | 'ticket_reservation'
  | 'ticket_cancellation'
  | 'schedule_create'
  | 'schedule_update'
  | 'schedule_delete'
  | 'wallet_deposit'
  | 'employee_register'
  | 'user_login'
  | 'portal_switch'
  | 'security_alert'
  | 'safety_override'
  | 'migration_run';

export type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actionType: AuditActionType;
  entityType: 'ticket' | 'schedule' | 'user' | 'wallet' | 'line' | 'system';
  entityId: string;
  summaryFa: string;
  summaryEn: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  riskLevel: AuditRiskLevel;
  status: 'success' | 'rejected' | 'warning';
  verificationHash: string;
}
