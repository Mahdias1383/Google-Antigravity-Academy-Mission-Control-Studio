export type AppLanguage = 'fa' | 'en';

export interface TranslationDictionary {
  // Brand & Header
  brandTitle: string;
  navAcademy: string;
  navSimulator: string;
  navGuardrails: string;
  navMcp: string;
  navCheatsheets: string;
  quickSearch: string;
  searchPlaceholder: string;

  // Secondary Toolbar
  sidebarToggle: string;
  navAchievements: string;
  navScenarios: string;
  navAiSearch: string;
  navKnowledgeBase: string;
  resumeSession: string;
  studyProgress: string;
  themeLight: string;
  themeDark: string;
  langSwitchLabel: string;
  langSwitchBadge: string;

  // Sidebar
  sidebarTitle: string;
  sidebarSubtitle: string;
  moduleLabel: string;
  studiosSectionTitle: string;
  studio1Label: string;
  studio1Sub: string;
  studio2Label: string;
  studio2Sub: string;
  studio3Label: string;
  studio3Sub: string;
  studio4Label: string;
  studio4Sub: string;
  studio5Label: string;
  studio5Sub: string;
  studio6Label: string;
  studio6Sub: string;

  // Module Content View
  moduleBadge: string;
  exportPdfBtn: string;
  markCompleted: string;
  completedBadge: string;
  keyTakeawaysTitle: string;
  onThisPageTitle: string;
  prevModuleBtn: string;
  nextModuleBtn: string;
  allModulesCompletedToast: string;

  // Pomodoro & Deep Work
  pomodoroTitle: string;
  pomodoroSubtitle: string;
  pomodoroStandard: string;
  pomodoroDeepWork: string;
  pomodoroShortBreak: string;
  pomodoroLongBreak: string;
  activeModuleTarget: string;
  startFocus: string;
  pauseFocus: string;
  resetTimer: string;
  logDeepWorkBtn: string;
  sessionNotesLabel: string;
  sessionNotesPlaceholder: string;
  moduleStatsTitle: string;
  moduleSessionsLabel: string;
  totalDeepWorkLabel: string;
  deepWorkLoggedToast: string;

  // Modals & Banners
  resumeModalTitle: string;
  resumeModalStay: string;
  resumeModalJump: string;
  milestoneTitle: string;
  milestoneAdvance: string;
  milestoneTrophy: string;

  // PWA & Offline
  pwaInstallBtn: string;
  pwaModalTitle: string;
  pwaModalGotIt: string;
  offlineBanner: string;

  // Global Command Search
  searchModalPlaceholder: string;
  searchModulesHeader: string;
  searchStudiosHeader: string;

  // Comparison Matrix Headers
  tableColCriterion: string;
  tableColTraditional: string;
  tableColAntigravity: string;
  tableColVerdict: string;
}

export const APP_TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  fa: {
    brandTitle: 'Google Antigravity Academy',
    navAcademy: 'آکادمی (۸ فصل)',
    navSimulator: 'شبیه‌ساز Mission Control',
    navGuardrails: 'استودیوی Rule و Workflow',
    navMcp: 'استودیوی FastMCP',
    navCheatsheets: 'چیت‌شیت‌ها و PDF',
    quickSearch: 'جستجوی سریع (Ctrl+K)',
    searchPlaceholder: 'جستجوی سریع در تمام فصل‌ها، آرتیفکت‌ها و دستورات...',

    sidebarToggle: 'فهرست فصل‌ها',
    navAchievements: 'دستاوردها و گواهینامه',
    navScenarios: 'آزمایشگاه سناریو',
    navAiSearch: 'جستجوی زنده مستندات',
    navKnowledgeBase: 'پایگاه دانش',
    resumeSession: 'ادامه نشست',
    studyProgress: 'پیشرفت مطالعه:',
    themeLight: 'حالت روشن',
    themeDark: 'حالت تیره',
    langSwitchLabel: 'تغییر زبان به انگلیسی',
    langSwitchBadge: 'EN',

    sidebarTitle: 'سرفصل‌های آموزشی',
    sidebarSubtitle: '۸ فصل جامع مهندسی Agent-First',
    moduleLabel: 'فصل',
    studiosSectionTitle: 'استودیوها و آزمایشگاه‌ها',
    studio1Label: '۱. شبیه‌ساز زنده Mission Control',
    studio1Sub: 'Artifact & PR Review Simulator',
    studio2Label: '۲. استودیوی Rule و Workflow',
    studio2Sub: '.agent/rules & // turbo Builder',
    studio3Label: '۳. استودیوی بصری سرور FastMCP',
    studio3Sub: 'mcp_config.json & Python Code',
    studio4Label: '۴. مرکز چیت‌شیت‌ها و خروجی PDF',
    studio4Sub: 'Modular Reference Cards',
    studio5Label: '۵. آزمایشگاه چالش‌های معماری',
    studio5Sub: '8 Principal Case Studies',
    studio6Label: '۶. کاوشگر پایگاه دانش و Context Rot',
    studio6Sub: '.agent/knowledge-base Bento Explorer',

    moduleBadge: 'فصل ۰{num} از ۰۸',
    exportPdfBtn: 'دریافت PDF فصل',
    markCompleted: 'علامت‌گذاری به عنوان مطالعه‌شده',
    completedBadge: 'تکمیل‌شده',
    keyTakeawaysTitle: 'نکات کلیدی و اصول معماری این فصل',
    onThisPageTitle: 'سرفصل‌های این بخش',
    prevModuleBtn: 'فصل قبلی',
    nextModuleBtn: 'فصل بعدی',
    allModulesCompletedToast: 'تبریک! تمام ۸ ماژول آکادمی با موفقیت تکمیل شد.',

    pomodoroTitle: 'مرکز کار عمیق و تایمر پومودورو',
    pomodoroSubtitle: 'Deep Work & Focus Tracker',
    pomodoroStandard: 'پومودورو (25m)',
    pomodoroDeepWork: 'کار عمیق (50m)',
    pomodoroShortBreak: 'استراحت کوتاه (5m)',
    pomodoroLongBreak: 'استراحت بلند (15m)',
    activeModuleTarget: 'فصل فعال برای ثبت ساعت مطالعه:',
    startFocus: 'شروع تمرکز',
    pauseFocus: 'توقف موقت',
    resetTimer: 'بازنشانی',
    logDeepWorkBtn: 'ثبت کار عمیق فصل {num}',
    sessionNotesLabel: 'یادداشت تمرکز برای این فصل (اختیاری):',
    sessionNotesPlaceholder: 'مثال: بازبینی ساختار implementation_plan.md و گیت‌های بازبینی...',
    moduleStatsTitle: 'آمار کار عمیق فصل {num}:',
    moduleSessionsLabel: 'تعداد جلسات فصل:',
    totalDeepWorkLabel: 'کل کار عمیق آکادمی:',
    deepWorkLoggedToast: 'ثبت موفق! {mins} دقیقه کار عمیق برای فصل {num} ذخیره شد (+{xp} XP)',

    resumeModalTitle: 'تشخیص نشست قبلی در مرورگر',
    resumeModalStay: 'ماندن در نمای فعلی',
    resumeModalJump: 'پرش به آخرین نقطه پیشرفت',
    milestoneTitle: 'تبریک معمار! دستاورد فاز جدید ثبت شد',
    milestoneAdvance: 'پیشروی به فصل بعدی',
    milestoneTrophy: 'مشاهده تالار افتخارات و کاپ‌ها',

    pwaInstallBtn: 'نصب وب‌اپلیکیشن',
    pwaModalTitle: 'نصب نسخه وب‌اپلیکیشن پیش‌رونده (PWA)',
    pwaModalGotIt: 'متوجه شدم',
    offlineBanner: 'حالت آفلاین فعال است — محتوای آکادمی از حافظه کش PWA بارگذاری می‌شود',

    searchModalPlaceholder: 'جستجوی فصل، مفهوم (مثلاً Supercomplete، task.md، FastMCP، Worktree)...',
    searchModulesHeader: 'فصل‌های آموزشی (۸ ماژول)',
    searchStudiosHeader: 'استودیوهای مهندسی و ابزارهای تعاملی',

    tableColCriterion: 'معیار مقایسه',
    tableColTraditional: 'رویکرد سنتی / دستیار سنکرون',
    tableColAntigravity: 'محیط هوشمند Google Antigravity',
    tableColVerdict: 'قضاوت معمار سیستم',
  },

  en: {
    brandTitle: 'Google Antigravity Academy',
    navAcademy: 'Curriculum (8 Modules)',
    navSimulator: 'Mission Control Simulator',
    navGuardrails: 'Rule & Workflow Studio',
    navMcp: 'FastMCP Studio',
    navCheatsheets: 'Cheat Sheets & PDF',
    quickSearch: 'Quick Search (Ctrl+K)',
    searchPlaceholder: 'Quick search across all modules, artifacts, rules, and slash commands...',

    sidebarToggle: 'Curriculum Sidebar',
    navAchievements: 'Achievements & Certification',
    navScenarios: '8 Architecture Labs',
    navAiSearch: 'Search Grounding (AI Copilot)',
    navKnowledgeBase: 'Knowledge Base Explorer',
    resumeSession: 'Resume Session',
    studyProgress: 'Study Progress:',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    langSwitchLabel: 'Change Language',
    langSwitchBadge: 'فارسی',

    sidebarTitle: 'Curriculum Outline',
    sidebarSubtitle: '8 Comprehensive Modules for Agent-First Mastery',
    moduleLabel: 'Module',
    studiosSectionTitle: 'Engineering Studios & Simulators',
    studio1Label: '1. Mission Control Simulator',
    studio1Sub: 'Artifact & PR Review Simulator',
    studio2Label: '2. Rule & Workflow Studio',
    studio2Sub: '.agent/rules & // turbo Builder',
    studio3Label: '3. FastMCP Visual Studio',
    studio3Sub: 'mcp_config.json & Python Code',
    studio4Label: '4. Reference Cheat Sheets & PDF',
    studio4Sub: 'Modular Reference Cards',
    studio5Label: '5. Architecture Scenario Lab',
    studio5Sub: '8 Principal Case Studies',
    studio6Label: '6. Knowledge Base & Context Rot',
    studio6Sub: '.agent/knowledge-base Bento Explorer',

    moduleBadge: 'Module 0{num} of 08',
    exportPdfBtn: 'Export Module PDF',
    markCompleted: 'Mark as Completed',
    completedBadge: 'Completed',
    keyTakeawaysTitle: 'Key Architectural Takeaways & Invariants',
    onThisPageTitle: 'On This Page',
    prevModuleBtn: 'Previous Module',
    nextModuleBtn: 'Next Module',
    allModulesCompletedToast: 'Congratulations! All 8 curriculum modules successfully completed.',

    pomodoroTitle: 'Deep Work & Pomodoro Focus Center',
    pomodoroSubtitle: 'Deep Work & Focus Tracker',
    pomodoroStandard: 'Pomodoro (25m)',
    pomodoroDeepWork: 'Deep Work (50m)',
    pomodoroShortBreak: 'Short Break (5m)',
    pomodoroLongBreak: 'Long Break (15m)',
    activeModuleTarget: 'Active Module for Deep Work Logging:',
    startFocus: 'Start Focus',
    pauseFocus: 'Pause Focus',
    resetTimer: 'Reset',
    logDeepWorkBtn: 'Log Deep Work for Module {num}',
    sessionNotesLabel: 'Focus session notes (optional):',
    sessionNotesPlaceholder: 'e.g. Reviewed implementation_plan.md structure & PR-style gates...',
    moduleStatsTitle: 'Module {num} Deep Work Stats:',
    moduleSessionsLabel: 'Module Sessions:',
    totalDeepWorkLabel: 'Total Academy Deep Work:',
    deepWorkLoggedToast: 'Logged successfully! {mins} mins of Deep Work recorded for Module {num} (+{xp} XP)',

    resumeModalTitle: 'Previous Session Checkpoint Detected',
    resumeModalStay: 'Stay on Current View',
    resumeModalJump: 'Jump Back to Last Checkpoint',
    milestoneTitle: 'Architect Milestone Achieved!',
    milestoneAdvance: 'Advance to Next Module',
    milestoneTrophy: 'View Trophy Case & Badges',

    pwaInstallBtn: 'Install App (PWA)',
    pwaModalTitle: 'Install Progressive Web App (PWA)',
    pwaModalGotIt: 'Got it',
    offlineBanner: 'Offline Mode Active — Content loaded from PWA offline cache',

    searchModalPlaceholder: 'Search modules, concepts (e.g. Supercomplete, task.md, FastMCP, Worktree)...',
    searchModulesHeader: 'Curriculum Modules (8 Modules)',
    searchStudiosHeader: 'Interactive Studios & Engineering Tools',

    tableColCriterion: 'Criterion',
    tableColTraditional: 'Synchronous Copilot',
    tableColAntigravity: 'Google Antigravity',
    tableColVerdict: 'Architectural Verdict',
  },
};

export const LANGUAGE_STORAGE_KEY = 'ag_language_preference_v1';

/**
 * Gets translation string with simple variable interpolation (e.g. {num}, {mins}, {xp}).
 */
export function getTranslation(
  lang: AppLanguage,
  key: keyof TranslationDictionary,
  params?: Record<string, string | number>
): string {
  const dict = APP_TRANSLATIONS[lang] || APP_TRANSLATIONS.fa;
  let text = dict[key] || APP_TRANSLATIONS.fa[key] || '';

  if (params) {
    const effectiveParams = { ...params };
    if ('number' in effectiveParams && !('num' in effectiveParams)) {
      effectiveParams.num = effectiveParams.number;
    }
    if ('num' in effectiveParams && !('number' in effectiveParams)) {
      effectiveParams.number = effectiveParams.num;
    }
    for (const [pKey, pVal] of Object.entries(effectiveParams)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return text;
}

/**
 * Resolves layout direction ('rtl' for fa, 'ltr' for en).
 */
export function getLayoutDirection(lang: AppLanguage): 'rtl' | 'ltr' {
  return lang === 'fa' ? 'rtl' : 'ltr';
}

export function getInitialLanguagePreference(): AppLanguage {
  if (typeof window === 'undefined') return 'fa';
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'en' || urlLang === 'fa') return urlLang;

    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === 'en' || raw === 'fa') return raw;

    return 'fa';
  } catch {
    return 'fa';
  }
}
