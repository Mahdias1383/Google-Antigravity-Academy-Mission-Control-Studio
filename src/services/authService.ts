import { User, UserRole } from '../types/railpulse';
import { getDatabase, saveDatabase } from './storageAndMigration';
import { recordAuditAction } from './auditLogService';

const SESSION_STORAGE_KEY = 'railpulse_current_user_v2';

export function getCurrentUser(): User {
  if (typeof window === 'undefined') {
    return getDatabase().users[0];
  }
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure balance and data are fresh from database
      const db = getDatabase();
      const matched = db.users.find((u) => u.id === parsed.id);
      if (matched) return matched;
      return parsed;
    }
  } catch (e) {
    console.error('Session read error:', e);
  }
  // Default to System Admin
  const db = getDatabase();
  const defaultUser = db.users.find((u) => u.role === 'admin') || db.users[0];
  setCurrentUser(defaultUser);
  return defaultUser;
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Session write error:', e);
  }
}

export function switchPersona(role: UserRole): User {
  const db = getDatabase();
  const target = db.users.find((u) => u.role === role) || db.users[0];
  setCurrentUser(target);

  recordAuditAction({
    actorId: target.id,
    actorName: target.fullName,
    actorRole: target.role,
    actionType: 'user_login',
    entityType: 'user',
    entityId: target.id,
    summaryFa: `تغییر نقش سریع به «${target.fullName}» با دسترسی سطح ${role === 'admin' ? 'مدیر ارشد' : role === 'employee' ? 'پرسنل عملیات' : 'مسافر'}`,
    summaryEn: `Switched active persona to ${target.fullName} (${role.toUpperCase()})`,
    metadata: { role, username: target.username },
    riskLevel: 'low',
    status: 'success',
  });

  return target;
}

export function loginUser(identifier: string, passwordPlain: string): { success: boolean; user?: User; error?: string } {
  const db = getDatabase();
  const cleanId = identifier.trim().toLowerCase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
  );

  if (!user) {
    return { success: false, error: 'کاربری با این نام کاربری یا ایمیل یافت نشد.' };
  }

  // Simulated hash verification
  setCurrentUser(user);

  recordAuditAction({
    actorId: user.id,
    actorName: user.fullName,
    actorRole: user.role,
    actionType: 'user_login',
    entityType: 'user',
    entityId: user.id,
    summaryFa: `ورود موفق کاربر «${user.fullName}» (${user.username}) به سامانه`,
    summaryEn: `Successful login for user ${user.fullName} (${user.username})`,
    riskLevel: 'low',
    status: 'success',
  });

  return { success: true, user };
}

export function registerPassenger(
  username: string,
  fullName: string,
  email: string,
  nationalId: string,
  initialWallet: number = 2000000
): { success: boolean; user?: User; error?: string } {
  const db = getDatabase();
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  const exists = db.users.some(
    (u) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail
  );
  if (exists) {
    return { success: false, error: 'این نام کاربری یا ایمیل قبلاً در سامانه ثبت شده است.' };
  }

  const newUser: User = {
    id: `usr-reg-${Date.now()}`,
    username: cleanUsername,
    fullName,
    email: cleanEmail,
    role: 'passenger',
    passwordHash: `hash-${cleanUsername}-2026`,
    walletBalance: initialWallet,
    nationalId,
    phoneNumber: '09120000000',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);
  setCurrentUser(newUser);

  recordAuditAction({
    actorId: newUser.id,
    actorName: newUser.fullName,
    actorRole: 'passenger',
    actionType: 'user_login',
    entityType: 'user',
    entityId: newUser.id,
    summaryFa: `ثبت‌نام مسافر جدید «${fullName}» در سامانه با موجودی اولیه کیف پول ${initialWallet.toLocaleString('fa-IR')} تومان`,
    summaryEn: `New passenger registration for ${fullName} with initial wallet ${initialWallet.toLocaleString('en-US')} Tomans`,
    metadata: { username: cleanUsername, email: cleanEmail, nationalId },
    riskLevel: 'low',
    status: 'success',
  });

  return { success: true, user: newUser };
}
