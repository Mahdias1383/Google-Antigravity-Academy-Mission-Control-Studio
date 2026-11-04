import { normalizeSearchText } from './globalSearchService';

export type AdminViewTabId =
  | 'activity-monitor'
  | 'global-timeline'
  | 'overview'
  | 'lines'
  | 'employees'
  | 'migration'
  | 'system-settings';

export type AdminQuickActionKey =
  | 'register_staff'
  | 'sync_now'
  | 'toggle_polling'
  | 'run_migration'
  | 'reset_seed';

export interface CommandPaletteItem {
  id: string;
  category: 'navigation' | 'quick_action';
  titleFa: string;
  titleEn: string;
  subtitleFa: string;
  subtitleEn: string;
  shortcutHint: string;
  keywords: string[];
  targetTab?: AdminViewTabId;
  actionKey?: AdminQuickActionKey;
}

export function isCommandPaletteShortcut(e: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
}): boolean {
  return (
    Boolean(e.ctrlKey || e.metaKey) &&
    typeof e.key === 'string' &&
    e.key.toLowerCase() === 'k'
  );
}

export function getDefaultAdminCommands(): CommandPaletteItem[] {
  return [
    {
      id: 'nav-audit-logs',
      category: 'navigation',
      titleFa: 'مونیتورینگ فعالیت‌ها و لاگ‌های حسابرسی (Audit Logs)',
      titleEn: 'Audit Logs & Activity Monitor',
      subtitleFa: 'مشاهده جدول وقایع امنیتی، فیلترها و خروجی CSV/JSON',
      subtitleEn: 'View real-time security audit logs, filters & exports',
      shortcutHint: 'G A',
      keywords: ['audit', 'logs', 'activity', 'monitor', 'security', 'لاگ', 'حسابرسی', 'مونیتورینگ'],
      targetTab: 'activity-monitor',
    },
    {
      id: 'nav-performance-dashboard',
      category: 'navigation',
      titleFa: 'داشبورد عملکرد و آمار تحلیلی (Performance Dashboard)',
      titleEn: 'Performance Dashboard & Executive Analytics',
      subtitleFa: 'نمودارهای فروش بلیت، پیش‌بینی تقاضا و ضریب اشغال ناوگان',
      subtitleEn: 'Revenue KPIs, demand forecast & fleet utilization charts',
      shortcutHint: 'G D',
      keywords: ['performance', 'dashboard', 'overview', 'analytics', 'kpi', 'داشبورد', 'عملکرد', 'آمار'],
      targetTab: 'overview',
    },
    {
      id: 'nav-system-settings',
      category: 'navigation',
      titleFa: 'تنظیمات سامانه و مرکز فرماندهی (System Settings)',
      titleEn: 'System Settings & Command Configuration',
      subtitleFa: 'مدیریت چرخه بروزرسانی ۶۰ ثانیه‌ای، قفل نشست و سیاست‌های امنیتی',
      subtitleEn: 'Configure 60s auto-polling, session lock & security policies',
      shortcutHint: 'G S',
      keywords: ['system', 'settings', 'config', 'security', 'تنظیمات', 'سامانه', 'پیکربندی'],
      targetTab: 'system-settings',
    },
    {
      id: 'nav-global-timeline',
      category: 'navigation',
      titleFa: 'خط زمانی جامع فعالیت‌ها (Global Activity Timeline)',
      titleEn: 'Global Activity Timeline Feed',
      subtitleFa: 'جریان زمانی ورود کاربران، جابجایی پرتال‌ها و عملیات سیر',
      subtitleEn: 'Chronological stream of logins, portal switches & operations',
      shortcutHint: 'G T',
      keywords: ['timeline', 'feed', 'stream', 'login', 'خط زمانی', 'فعالیت'],
      targetTab: 'global-timeline',
    },
    {
      id: 'nav-corridors',
      category: 'navigation',
      titleFa: 'مدیریت خطوط ریلی و ایستگاه‌ها (Corridors & Lines)',
      titleEn: 'Railway Corridors & Station Nodes',
      subtitleFa: 'مشاهده توپولوژی خطوط، فواصل کیلومتری و ظرفیت سکوها',
      subtitleEn: 'Inspect railway corridors, kilometer milestones & platforms',
      shortcutHint: 'G L',
      keywords: ['lines', 'corridors', 'stations', 'خطوط', 'ایستگاه'],
      targetTab: 'lines',
    },
    {
      id: 'nav-employees',
      category: 'navigation',
      titleFa: 'مدیریت پرسنل و دسترسی‌های عملیات (Staff & RBAC)',
      titleEn: 'Operations Staff & Access Control',
      subtitleFa: 'مشاهده و ثبت راهبران و تخصیص خطوط ریلی',
      subtitleEn: 'Manage dispatchers and assigned railway corridors',
      shortcutHint: 'G E',
      keywords: ['staff', 'employees', 'users', 'پرسنل', 'کاربران'],
      targetTab: 'employees',
    },
    {
      id: 'nav-migration',
      category: 'navigation',
      titleFa: 'پایپ‌لاین مهاجرت پایتون v1 به اسکیمای v2',
      titleEn: 'Legacy Python v1 to v2 Schema Migration',
      subtitleFa: 'انتقال دیکشنری‌های قدیمی پایتون به ساختار رابطه‌ای',
      subtitleEn: 'Execute and audit legacy v1 dictionary migration',
      shortcutHint: 'G M',
      keywords: ['migration', 'python', 'v1', 'v2', 'مهاجرت', 'پایتون'],
      targetTab: 'migration',
    },
    {
      id: 'act-sync-now',
      category: 'quick_action',
      titleFa: 'همگام‌سازی فوری داده‌ها و لاگ‌ها (Sync Data Now)',
      titleEn: 'Trigger Immediate Data & Audit Sync',
      subtitleFa: 'بروزرسانی آنی نمودارها و جدول لاگ‌های حسابرسی',
      subtitleEn: 'Refresh all dashboard metrics and audit logs immediately',
      shortcutHint: '⌘ R',
      keywords: ['sync', 'refresh', 'poll', 'همگام‌سازی', 'بروزرسانی'],
      actionKey: 'sync_now',
    },
    {
      id: 'act-register-staff',
      category: 'quick_action',
      titleFa: 'ثبت پرسنل عملیاتی جدید (Register New Staff)',
      titleEn: 'Register New Operations Employee',
      subtitleFa: 'افزودن راهبر جدید و تخصیص دسترسی خط سیر',
      subtitleEn: 'Open modal to register a new railway dispatcher',
      shortcutHint: '⌘ N',
      keywords: ['register', 'add', 'employee', 'staff', 'ثبت', 'پرسنل'],
      actionKey: 'register_staff',
    },
    {
      id: 'act-run-migration',
      category: 'quick_action',
      titleFa: 'اجرای تست مهاجرت داده v1 پایتون',
      titleEn: 'Execute Sample Python v1 Migration',
      subtitleFa: 'اجرای خودکار پایپ‌لاین مهاجرت و ثبت در لاگ حسابرسی',
      subtitleEn: 'Run sample v1 dictionary migration pipeline',
      shortcutHint: '⌘ M',
      keywords: ['run', 'migration', 'اجرا', 'مهاجرت'],
      actionKey: 'run_migration',
    },
  ];
}

export function filterCommandPaletteItems(
  items: CommandPaletteItem[],
  query: string,
  categoryFilter: 'all' | 'navigation' | 'quick_action' = 'all'
): CommandPaletteItem[] {
  const normQ = normalizeSearchText(query);
  return items.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }
    if (!normQ) return true;
    const haystack = normalizeSearchText(
      `${item.titleFa} ${item.titleEn} ${item.subtitleFa} ${item.subtitleEn} ${item.keywords.join(' ')}`
    );
    return haystack.includes(normQ);
  });
}

export function moveCommandSelection(
  currentIndex: number,
  totalItems: number,
  direction: 'up' | 'down'
): number {
  if (totalItems <= 0) return 0;
  if (direction === 'down') {
    return (currentIndex + 1) % totalItems;
  }
  return (currentIndex - 1 + totalItems) % totalItems;
}
