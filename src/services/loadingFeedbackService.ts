export type LoadingOperationType =
  | 'admin_tab_transition'
  | 'admin_data_sync'
  | 'admin_migration_pipeline'
  | 'ops_corridor_switch'
  | 'ops_collision_recalc'
  | 'ops_schedule_mutation';

export type SkeletonVariant = 'dashboard' | 'table' | 'marey_graph' | 'timeline';

export interface LoadingStageMetadata {
  operationType: LoadingOperationType;
  progressPercent: number;
  widthClass: string;
  badgeFa: string;
  badgeEn: string;
  stageLabelFa: string;
  stageLabelEn: string;
  skeletonVariant: SkeletonVariant;
  accentColor: 'blue' | 'emerald' | 'indigo' | 'amber' | 'cyan';
}

export interface LoadingFeedbackState {
  isActive: boolean;
  isSkeletonVisible: boolean;
  isPinnedPreview: boolean;
  operationType: LoadingOperationType;
  progressPercent: number;
  widthClass: string;
  badgeFa: string;
  badgeEn: string;
  stageLabelFa: string;
  stageLabelEn: string;
  skeletonVariant: SkeletonVariant;
  accentColor: 'blue' | 'emerald' | 'indigo' | 'amber' | 'cyan';
}

export function resolveTailwindProgressWidthClass(progressPercent: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(Number.isFinite(progressPercent) ? progressPercent : 0)));
  if (clamped <= 0) return 'w-0';
  if (clamped <= 10) return 'w-1/12';
  if (clamped <= 20) return 'w-1/6';
  if (clamped <= 28) return 'w-1/4';
  if (clamped <= 36) return 'w-1/3';
  if (clamped <= 44) return 'w-5/12';
  if (clamped <= 54) return 'w-1/2';
  if (clamped <= 62) return 'w-7/12';
  if (clamped <= 70) return 'w-2/3';
  if (clamped <= 80) return 'w-3/4';
  if (clamped <= 88) return 'w-5/6';
  if (clamped <= 96) return 'w-11/12';
  return 'w-full';
}

export function resolveAdminTabSkeletonVariant(tabId: string): SkeletonVariant {
  switch (tabId) {
    case 'overview':
      return 'dashboard';
    case 'activity-monitor':
    case 'global-timeline':
      return 'timeline';
    case 'lines':
    case 'employees':
    case 'migration':
    case 'system-settings':
    default:
      return 'table';
  }
}

export function getOperationStageMetadata(
  operationType: LoadingOperationType,
  progressPercent: number,
  overrideVariant?: SkeletonVariant
): LoadingStageMetadata {
  const clamped = Math.max(0, Math.min(100, Math.round(Number.isFinite(progressPercent) ? progressPercent : 0)));
  const widthClass = resolveTailwindProgressWidthClass(clamped);

  switch (operationType) {
    case 'admin_data_sync': {
      const stageLabelFa =
        clamped < 40
          ? 'دریافت آخرین تراکنش‌ها، بلیت‌ها و وضعیت خطوط از مخزن داده...'
          : clamped < 80
          ? 'اعتبارسنجی زنجیره هش SHA-256 لاگ‌های حسابرسی و شاخص‌های کلیدی...'
          : 'بروزرسانی نمودارهای تحلیلی و جدول پایش فعالیت‌ها تکمیل شد';
      const stageLabelEn =
        clamped < 40
          ? 'Fetching latest transactions, tickets & corridor telemetry...'
          : clamped < 80
          ? 'Verifying SHA-256 audit log chain & recalculating KPIs...'
          : 'Dashboard analytics and live activity monitor synchronized';
      return {
        operationType,
        progressPercent: clamped,
        widthClass,
        badgeFa: 'همگام‌سازی داده‌ها',
        badgeEn: 'DATA SYNC',
        stageLabelFa,
        stageLabelEn,
        skeletonVariant: overrideVariant || 'dashboard',
        accentColor: 'emerald',
      };
    }

    case 'admin_migration_pipeline': {
      const stageLabelFa =
        clamped < 40
          ? 'خواندن دیکشنری‌های میراث پایتون (user_dict, line_dic, train_dic)...'
          : clamped < 80
          ? 'نرمال‌سازی موجودیت‌های رابطه‌ای v2 و ثبت رکوردهای حسابرسی...'
          : 'انتقال و یکپارچه‌سازی داده‌های مهاجرت با موفقیت انجام شد';
      const stageLabelEn =
        clamped < 40
          ? 'Parsing legacy Python v1 dictionaries (user_dict, line_dic, train_dic)...'
          : clamped < 80
          ? 'Normalizing v2 relational entities & writing audit records...'
          : 'Legacy v1 to Enterprise v2 schema migration completed';
      return {
        operationType,
        progressPercent: clamped,
        widthClass,
        badgeFa: 'پایپ‌لاین مهاجرت v2',
        badgeEn: 'MIGRATION PIPELINE',
        stageLabelFa,
        stageLabelEn,
        skeletonVariant: overrideVariant || 'table',
        accentColor: 'amber',
      };
    }

    case 'ops_corridor_switch': {
      const stageLabelFa =
        clamped < 45
          ? 'واکشی توپولوژی ایستگاه‌ها، فواصل کیلومتری و ظرفیت سکوهای خط...'
          : clamped < 85
          ? 'اجرای موتور ریاضی checkAccident و ترسیم گراف ماری (Marey)...'
          : 'گراف زمان-مسافت و جدول اعزام قطارهای کریدور آماده بهره‌برداری است';
      const stageLabelEn =
        clamped < 45
          ? 'Fetching station topology, kilometer milestones & platform capacities...'
          : clamped < 85
          ? 'Running checkAccident engine & computing Marey trajectories...'
          : 'Corridor Marey time-distance graph & dispatch timetable ready';
      return {
        operationType,
        progressPercent: clamped,
        widthClass,
        badgeFa: 'بارگذاری کریدور ریلی',
        badgeEn: 'CORRIDOR FETCH',
        stageLabelFa,
        stageLabelEn,
        skeletonVariant: overrideVariant || 'marey_graph',
        accentColor: 'blue',
      };
    }

    case 'ops_collision_recalc': {
      const stageLabelFa =
        clamped < 45
          ? 'محاسبه ماتریس زمان ورود و خروج قطارها در تمام ایستگاه‌های مسیر...'
          : clamped < 85
          ? 'بررسی تداخل همزمان سکوها و سبقت غیرمجاز در بلاک‌های سیر...'
          : 'پایش ایمنی checkAccident و همگام‌سازی گراف سیر تکمیل شد';
      const stageLabelEn =
        clamped < 45
          ? 'Computing station arrival/departure matrices across corridor...'
          : clamped < 85
          ? 'Scanning for platform overlaps and track segment overtakes...'
          : 'checkAccident safety verification & Marey graph sync complete';
      return {
        operationType,
        progressPercent: clamped,
        widthClass,
        badgeFa: 'پایش ایمنی سیر',
        badgeEn: 'SAFETY RECALC',
        stageLabelFa,
        stageLabelEn,
        skeletonVariant: overrideVariant || 'marey_graph',
        accentColor: 'cyan',
      };
    }

    case 'ops_schedule_mutation': {
      const stageLabelFa =
        clamped < 50
          ? 'ثبت تغییرات برنامه حرکت قطار و بررسی محدودیت‌های ایمنی خط...'
          : 'بروزرسانی گراف ماری و ثبت امضای دیجیتال در لاگ حسابرسی';
      const stageLabelEn =
        clamped < 50
          ? 'Committing timetable update & validating corridor safety bounds...'
          : 'Updating Marey schedule graph & writing cryptographic audit log';
      return {
        operationType,
        progressPercent: clamped,
        widthClass,
        badgeFa: 'بروزرسانی جدول حرکت',
        badgeEn: 'TIMETABLE UPDATE',
        stageLabelFa,
        stageLabelEn,
        skeletonVariant: overrideVariant || 'marey_graph',
        accentColor: 'indigo',
      };
    }

    case 'admin_tab_transition':
    default: {
      const stageLabelFa =
        clamped < 50
          ? 'بارگذاری داده‌های نمای انتخابی و آماده‌سازی المان‌های بصری...'
          : 'نمایش اطلاعات به‌روزرسانی‌شده مرکز فرماندهی';
      const stageLabelEn =
        clamped < 50
          ? 'Fetching view datasets & preparing telemetry components...'
          : 'Rendering synchronized command center view';
      return {
        operationType: 'admin_tab_transition',
        progressPercent: clamped,
        widthClass,
        badgeFa: 'انتقال نما',
        badgeEn: 'VIEW TRANSITION',
        stageLabelFa,
        stageLabelEn,
        skeletonVariant: overrideVariant || 'timeline',
        accentColor: 'indigo',
      };
    }
  }
}

export function createLoadingFeedbackState(
  operationType: LoadingOperationType = 'admin_tab_transition',
  progressPercent = 0,
  isActive = false,
  isSkeletonVisible = false,
  isPinnedPreview = false,
  overrideVariant?: SkeletonVariant
): LoadingFeedbackState {
  const meta = getOperationStageMetadata(operationType, progressPercent, overrideVariant);
  return {
    isActive,
    isSkeletonVisible,
    isPinnedPreview,
    ...meta,
  };
}
