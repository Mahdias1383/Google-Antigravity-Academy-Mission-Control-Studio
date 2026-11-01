export type WorkspaceSectionId =
  | 'curriculum'
  | 'achievements'
  | 'simulator'
  | 'guardrails'
  | 'mcp'
  | 'cheatsheets'
  | 'scenarios'
  | 'ai-architect'
  | 'knowledge-base';

export type NavigationEventType = 'section_change';

export interface NavigationActivityEvent {
  id: string;
  eventType: NavigationEventType;
  fromSection: WorkspaceSectionId | null;
  toSection: WorkspaceSectionId;
  moduleId?: string;
  targetTitleFa: string;
  targetTitleEn: string;
  fromTitleFa: string;
  fromTitleEn: string;
  badgeCode: string;
  category: 'curriculum' | 'studio';
  timestampIso: string;
}

export interface ActivityLogSummaryStats {
  totalEvents: number;
  uniqueSectionsCount: number;
  topSection: WorkspaceSectionId | null;
  topSectionTitleFa: string;
  topSectionTitleEn: string;
  lastEventIso: string | null;
}

export interface ModuleMetadataSummary {
  id: string;
  number: number;
  titleFa: string;
  titleEn: string;
}

export const NAVIGATION_ACTIVITY_STORAGE_KEY = 'ag_navigation_activity_log_v1';
export const MAX_ACTIVITY_LOG_ENTRIES = 50;

const SECTION_CATALOG: Record<
  WorkspaceSectionId,
  {
    titleFa: string;
    titleEn: string;
    badgeCode: string;
    category: 'curriculum' | 'studio';
  }
> = {
  curriculum: {
    titleFa: 'آکادمی (۸ فصل آموزشی)',
    titleEn: 'Curriculum (8 Modules)',
    badgeCode: 'SEC-CURRICULUM',
    category: 'curriculum',
  },
  achievements: {
    titleFa: 'دستاوردها و گواهینامه آکادمی',
    titleEn: 'Achievements & Certification',
    badgeCode: 'SEC-ACHIEVEMENTS',
    category: 'curriculum',
  },
  simulator: {
    titleFa: 'شبیه‌ساز زنده Mission Control',
    titleEn: 'Mission Control Simulator',
    badgeCode: 'STUDIO-SIMULATOR',
    category: 'studio',
  },
  guardrails: {
    titleFa: 'استودیوی Rule و Workflow',
    titleEn: 'Rule & Workflow Studio',
    badgeCode: 'STUDIO-GUARDRAILS',
    category: 'studio',
  },
  mcp: {
    titleFa: 'استودیوی بصری سرور FastMCP',
    titleEn: 'FastMCP Visual Studio',
    badgeCode: 'STUDIO-FASTMCP',
    category: 'studio',
  },
  cheatsheets: {
    titleFa: 'چیت‌شیت‌ها و خروجی PDF',
    titleEn: 'Reference Cheat Sheets & PDF',
    badgeCode: 'STUDIO-CHEATSHEETS',
    category: 'studio',
  },
  scenarios: {
    titleFa: 'آزمایشگاه ۸ چالش معماری',
    titleEn: '8 Architecture Scenario Labs',
    badgeCode: 'STUDIO-SCENARIOS',
    category: 'studio',
  },
  'ai-architect': {
    titleFa: 'جستجوی زنده مستندات هوش مصنوعی',
    titleEn: 'Search Grounding (AI Copilot)',
    badgeCode: 'STUDIO-AI-COPILOT',
    category: 'studio',
  },
  'knowledge-base': {
    titleFa: 'کاوشگر پایگاه دانش و Context Rot',
    titleEn: 'Knowledge Base Explorer',
    badgeCode: 'STUDIO-KNOWLEDGE-BASE',
    category: 'studio',
  },
};

export function resolveSectionMetadata(
  section: WorkspaceSectionId,
  moduleId?: string,
  modules?: ModuleMetadataSummary[]
): {
  targetTitleFa: string;
  targetTitleEn: string;
  badgeCode: string;
  category: 'curriculum' | 'studio';
} {
  const base = SECTION_CATALOG[section] || SECTION_CATALOG.curriculum;

  if (section === 'curriculum' && moduleId && modules && modules.length > 0) {
    const matchedMod = modules.find((m) => m.id === moduleId);
    if (matchedMod) {
      return {
        targetTitleFa: `فصل ${matchedMod.number}: ${matchedMod.titleFa}`,
        targetTitleEn: `Module ${matchedMod.number}: ${matchedMod.titleEn}`,
        badgeCode: `MOD-0${matchedMod.number}`,
        category: 'curriculum',
      };
    }
  }

  return {
    targetTitleFa: base.titleFa,
    targetTitleEn: base.titleEn,
    badgeCode: base.badgeCode,
    category: base.category,
  };
}

export function createSectionChangeEvent(params: {
  fromSection: WorkspaceSectionId | null;
  toSection: WorkspaceSectionId;
  moduleId?: string;
  timestampIso?: string;
  modules?: ModuleMetadataSummary[];
}): NavigationActivityEvent {
  const timestampIso = params.timestampIso || new Date().toISOString();
  const targetMeta = resolveSectionMetadata(
    params.toSection,
    params.moduleId,
    params.modules
  );
  const fromMeta = params.fromSection
    ? resolveSectionMetadata(params.fromSection, undefined, params.modules)
    : {
        targetTitleFa: 'شروع نشست (Session Start)',
        targetTitleEn: 'Session Start',
      };

  const effectiveModuleId =
    params.toSection === 'curriculum' ? params.moduleId : undefined;

  const uniqueSuffix = Math.random().toString(36).substring(2, 7);
  const id = `evt-sec-${Date.parse(timestampIso) || Date.now()}-${uniqueSuffix}`;

  return {
    id,
    eventType: 'section_change',
    fromSection: params.fromSection,
    toSection: params.toSection,
    ...(effectiveModuleId ? { moduleId: effectiveModuleId } : {}),
    targetTitleFa: targetMeta.targetTitleFa,
    targetTitleEn: targetMeta.targetTitleEn,
    fromTitleFa: fromMeta.targetTitleFa,
    fromTitleEn: fromMeta.targetTitleEn,
    badgeCode: targetMeta.badgeCode,
    category: targetMeta.category,
    timestampIso,
  };
}

export function appendSectionChangeEvent(
  existingLogs: NavigationActivityEvent[],
  newEvent: NavigationActivityEvent,
  maxEntries: number = MAX_ACTIVITY_LOG_ENTRIES
): NavigationActivityEvent[] {
  const latest = existingLogs[0];
  if (
    latest &&
    latest.eventType === 'section_change' &&
    latest.toSection === newEvent.toSection &&
    (latest.moduleId || '') === (newEvent.moduleId || '')
  ) {
    return existingLogs;
  }

  return [newEvent, ...existingLogs].slice(0, Math.max(1, maxEntries));
}

export function calculateActivityLogStats(
  logs: NavigationActivityEvent[]
): ActivityLogSummaryStats {
  if (logs.length === 0) {
    return {
      totalEvents: 0,
      uniqueSectionsCount: 0,
      topSection: null,
      topSectionTitleFa: '—',
      topSectionTitleEn: '—',
      lastEventIso: null,
    };
  }

  const counts = new Map<WorkspaceSectionId, number>();
  for (const item of logs) {
    counts.set(item.toSection, (counts.get(item.toSection) || 0) + 1);
  }

  let topSection: WorkspaceSectionId = logs[0].toSection;
  let maxCount = 0;
  for (const [sec, cnt] of counts.entries()) {
    if (cnt > maxCount) {
      maxCount = cnt;
      topSection = sec;
    }
  }

  const topMeta = SECTION_CATALOG[topSection] || SECTION_CATALOG.curriculum;

  return {
    totalEvents: logs.length,
    uniqueSectionsCount: counts.size,
    topSection,
    topSectionTitleFa: topMeta.titleFa,
    topSectionTitleEn: topMeta.titleEn,
    lastEventIso: logs[0].timestampIso,
  };
}

export function normalizeDigitsToAscii(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function formatActivityDateDisplay(
  timestampIso: string,
  language: 'en' | 'fa' = 'en'
): {
  isoDate: string;
  localizedDate: string;
  localizedTime: string;
} {
  const isoDateFallback =
    typeof timestampIso === 'string' && timestampIso.length >= 10
      ? timestampIso.slice(0, 10)
      : timestampIso;

  try {
    const date = new Date(timestampIso);
    if (Number.isNaN(date.getTime())) {
      return {
        isoDate: isoDateFallback,
        localizedDate: isoDateFallback,
        localizedTime: timestampIso,
      };
    }

    const isoDate = date.toISOString().slice(0, 10);
    const locale = language === 'en' ? 'en-US' : 'fa-IR';
    const localizedDate = date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    const localizedTime = date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      isoDate,
      localizedDate,
      localizedTime,
    };
  } catch {
    return {
      isoDate: isoDateFallback,
      localizedDate: isoDateFallback,
      localizedTime: timestampIso,
    };
  }
}

export function buildEventSearchableDateTokens(timestampIso: string): string {
  const tokens: string[] = [timestampIso];
  if (typeof timestampIso === 'string' && timestampIso.length >= 10) {
    tokens.push(timestampIso.slice(0, 10));
  }

  try {
    const date = new Date(timestampIso);
    if (!Number.isNaN(date.getTime())) {
      const isoString = date.toISOString();
      tokens.push(isoString, isoString.slice(0, 10));

      const localYear = date.getFullYear();
      const localMonth = String(date.getMonth() + 1).padStart(2, '0');
      const localDay = String(date.getDate()).padStart(2, '0');
      tokens.push(`${localYear}-${localMonth}-${localDay}`);
      tokens.push(`${localMonth}/${localDay}/${localYear}`);

      const enShort = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const enLong = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      });
      const enNumeric = date.toLocaleDateString('en-US');
      const faShort = date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
      const faNumeric = date.toLocaleDateString('fa-IR');

      tokens.push(
        enShort,
        enLong,
        enNumeric,
        faShort,
        faNumeric,
        normalizeDigitsToAscii(faShort),
        normalizeDigitsToAscii(faNumeric)
      );
    }
  } catch {
    // Ignore invalid date formatting errors
  }

  return tokens.join(' ').toLowerCase();
}

export function filterActivityLogEvents(
  logs: NavigationActivityEvent[],
  filterCategory: 'all' | 'curriculum' | 'studio' = 'all',
  searchQuery: string = ''
): NavigationActivityEvent[] {
  const rawQuery = searchQuery.trim().toLowerCase();
  const normalizedQuery = normalizeDigitsToAscii(rawQuery);

  return logs.filter((entry) => {
    if (filterCategory !== 'all' && entry.category !== filterCategory) {
      return false;
    }
    if (!rawQuery) {
      return true;
    }

    const sectionHaystack = normalizeDigitsToAscii(
      [
        entry.targetTitleFa,
        entry.targetTitleEn,
        entry.fromTitleFa,
        entry.fromTitleEn,
        entry.toSection,
        entry.fromSection || '',
        entry.badgeCode,
        entry.moduleId || '',
      ]
        .join(' ')
        .toLowerCase()
    );

    const dateHaystack = buildEventSearchableDateTokens(entry.timestampIso);

    return (
      sectionHaystack.includes(normalizedQuery) ||
      sectionHaystack.includes(rawQuery) ||
      dateHaystack.includes(normalizedQuery) ||
      dateHaystack.includes(rawQuery)
    );
  });
}

export function serializeActivityLogsToStorage(
  logs: NavigationActivityEvent[]
): string {
  return JSON.stringify({
    schemaVersion: '1.0',
    updatedAtIso: new Date().toISOString(),
    events: logs,
  });
}

export function parseActivityLogsFromStorage(
  rawJson: string | null
): NavigationActivityEvent[] {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson);
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.events)
      ? parsed.events
      : [];

    return list
      .filter(
        (item: unknown): item is NavigationActivityEvent =>
          Boolean(
            item &&
              typeof item === 'object' &&
              (item as NavigationActivityEvent).eventType === 'section_change' &&
              typeof (item as NavigationActivityEvent).toSection === 'string' &&
              typeof (item as NavigationActivityEvent).timestampIso === 'string'
          )
      )
      .slice(0, MAX_ACTIVITY_LOG_ENTRIES);
  } catch {
    return [];
  }
}
