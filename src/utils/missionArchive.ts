import { ArchitectDailyMissionTask, DailyMissionTargetSection, ARCHITECT_DAILY_MISSIONS_POOL } from './generators';

export interface CompletedMissionArchiveEntry {
  id: string;
  missionId: string;
  code: string;
  titleEn: string;
  titleFa: string;
  descEn: string;
  descFa: string;
  targetArtifact: string;
  targetSection: DailyMissionTargetSection;
  categoryBadge: string;
  xpEarned: number;
  completedAtIso: string;
  verificationHash: string;
  difficulty: 'STANDARD' | 'ADVANCED' | 'CRITICAL';
}

export const MISSION_ARCHIVE_STORAGE_KEY = 'ag_architect_mission_archive_v1';
export const MISSION_ARCHIVE_UPDATED_EVENT = 'antigravity_mission_archive_updated_v1';

export const SEED_COMPLETED_MISSIONS: CompletedMissionArchiveEntry[] = [
  {
    id: 'arch-entry-adm05-1772448000000',
    missionId: 'mission-turbo-workflow',
    code: 'ADM-05',
    titleEn: 'Automate Verification Step with // turbo Directive',
    titleFa: 'خودکارسازی گام صحت‌سنجی با دایرکتیو // turbo',
    descEn: 'Add a non-destructive unit test runner step annotated with // turbo inside .agent/workflows/verify.md.',
    descFa: 'افزودن گام اجرای خودکار تست‌های واحد با دایرکتیو // turbo درون پایپ‌لاین .agent/workflows/verify.md.',
    targetArtifact: '.agent/workflows/verify.md',
    targetSection: 'guardrails',
    categoryBadge: 'Turbo Workflow',
    xpEarned: 140,
    completedAtIso: '2026-03-02T10:45:00.000Z',
    verificationHash: 'AG-AUDIT-ADM05-7F1D',
    difficulty: 'STANDARD',
  },
  {
    id: 'arch-entry-adm03-1772361600000',
    missionId: 'mission-fastmcp-readonly',
    code: 'ADM-03',
    titleEn: 'Harden FastMCP Server Pool to Read-Only Mode',
    titleFa: 'ایمن‌سازی استخر سرور FastMCP در حالت Read-Only',
    descEn: 'Audit mcp_config.json to enforce default_transaction_read_only=on and prevent autonomous DDL/DML mutations.',
    descFa: 'ممیزی فایل mcp_config.json برای اعمال پارامتر default_transaction_read_only=on و جلوگیری از تغییرات ناخواسته دیتابیس.',
    targetArtifact: 'mcp_config.json',
    targetSection: 'mcp',
    categoryBadge: 'FastMCP Guard',
    xpEarned: 180,
    completedAtIso: '2026-03-01T14:30:00.000Z',
    verificationHash: 'AG-AUDIT-ADM03-9B2C',
    difficulty: 'ADVANCED',
  },
  {
    id: 'arch-entry-adm01-1772275200000',
    missionId: 'mission-refactor-rule',
    code: 'ADM-01',
    titleEn: 'Refactor a .agent/rules Guardrail to Glob Mode',
    titleFa: 'بازآرایی یک قانون (Refactor a rule) در .agent/rules به حالت Glob',
    descEn: 'Convert an Always-On database rule into a scoped Glob activation rule (alembic/versions/*.py) to reduce context overhead.',
    descFa: 'تبدیل یک قانون سراسری دیتابیس به حالت فعال‌سازی هدفمند Glob (مسیر alembic/versions/*.py) جهت کاهش بار پنجره زمینه.',
    targetArtifact: '.agent/rules/db-migrations.md',
    targetSection: 'guardrails',
    categoryBadge: 'Refactor a Rule',
    xpEarned: 150,
    completedAtIso: '2026-02-28T09:15:00.000Z',
    verificationHash: 'AG-AUDIT-ADM01-4A8F',
    difficulty: 'CRITICAL',
  },
];

export function getSeedMissionArchive(): CompletedMissionArchiveEntry[] {
  return [...SEED_COMPLETED_MISSIONS];
}

export function getStoredMissionArchive(): CompletedMissionArchiveEntry[] {
  if (typeof window === 'undefined') {
    return getSeedMissionArchive();
  }
  try {
    const raw = window.localStorage.getItem(MISSION_ARCHIVE_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        MISSION_ARCHIVE_STORAGE_KEY,
        JSON.stringify(SEED_COMPLETED_MISSIONS)
      );
      return getSeedMissionArchive();
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getSeedMissionArchive();
  } catch {
    return getSeedMissionArchive();
  }
}

export function generateVerificationHash(code: string, timestampMs: number): string {
  let hash = 2166136261;
  const combined = `${code}:${timestampMs}:antigravity-audit`;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 4);
  return `AG-AUDIT-${code.replace(/[^A-Z0-9]/gi, '')}-${hex}`;
}

export function recordCompletedMissionArchive(
  mission: ArchitectDailyMissionTask,
  xpEarned: number,
  completedAtIso?: string
): CompletedMissionArchiveEntry[] {
  const currentEntries = getStoredMissionArchive();
  const timestamp = completedAtIso ? new Date(completedAtIso).getTime() : Date.now();
  const isoString = completedAtIso || new Date(timestamp).toISOString();

  // Avoid duplicate completion within same second
  const existing = currentEntries.find(
    (e) => e.missionId === mission.id && e.completedAtIso.slice(0, 10) === isoString.slice(0, 10)
  );
  if (existing) {
    return currentEntries;
  }

  const difficultyMap: Record<string, 'STANDARD' | 'ADVANCED' | 'CRITICAL'> = {
    'ADM-01': 'CRITICAL',
    'ADM-02': 'ADVANCED',
    'ADM-03': 'ADVANCED',
    'ADM-04': 'STANDARD',
    'ADM-05': 'STANDARD',
    'ADM-06': 'CRITICAL',
  };

  const newEntry: CompletedMissionArchiveEntry = {
    id: `arch-entry-${mission.code.toLowerCase()}-${timestamp}`,
    missionId: mission.id,
    code: mission.code,
    titleEn: mission.titleEn,
    titleFa: mission.titleFa,
    descEn: mission.descEn,
    descFa: mission.descFa,
    targetArtifact: mission.targetArtifact,
    targetSection: mission.targetSection,
    categoryBadge: mission.categoryBadge,
    xpEarned: Math.max(xpEarned, mission.xpReward),
    completedAtIso: isoString,
    verificationHash: generateVerificationHash(mission.code, timestamp),
    difficulty: difficultyMap[mission.code] || 'ADVANCED',
  };

  const updatedEntries = [newEntry, ...currentEntries];

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        MISSION_ARCHIVE_STORAGE_KEY,
        JSON.stringify(updatedEntries)
      );
      window.dispatchEvent(
        new CustomEvent(MISSION_ARCHIVE_UPDATED_EVENT, { detail: newEntry })
      );
    } catch {
      // Ignore localStorage errors
    }
  }

  return updatedEntries;
}

export interface MissionArchiveFilterParams {
  entries: ReadonlyArray<CompletedMissionArchiveEntry>;
  searchQuery?: string;
  selectedCategory?: string;
  sortOrder?: 'newest' | 'oldest';
}

export function filterAndSortMissionArchive(
  params: MissionArchiveFilterParams
): CompletedMissionArchiveEntry[] {
  const { entries, searchQuery = '', selectedCategory = 'all', sortOrder = 'newest' } = params;

  let filtered = [...entries];

  if (selectedCategory && selectedCategory !== 'all') {
    filtered = filtered.filter(
      (e) => e.categoryBadge.toLowerCase() === selectedCategory.toLowerCase()
    );
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.code.toLowerCase().includes(q) ||
        e.titleEn.toLowerCase().includes(q) ||
        e.titleFa.toLowerCase().includes(q) ||
        e.descEn.toLowerCase().includes(q) ||
        e.descFa.toLowerCase().includes(q) ||
        e.targetArtifact.toLowerCase().includes(q) ||
        e.categoryBadge.toLowerCase().includes(q) ||
        e.verificationHash.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    const timeA = new Date(a.completedAtIso).getTime();
    const timeB = new Date(b.completedAtIso).getTime();
    return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
  });

  return filtered;
}

export interface MissionArchiveStats {
  totalCompleted: number;
  totalXpEarned: number;
  distinctArtifactsCount: number;
  topCategory: string;
  latestCompletionIso: string | null;
}

export function calculateMissionArchiveStats(
  entries: ReadonlyArray<CompletedMissionArchiveEntry>
): MissionArchiveStats {
  if (entries.length === 0) {
    return {
      totalCompleted: 0,
      totalXpEarned: 0,
      distinctArtifactsCount: 0,
      topCategory: 'None',
      latestCompletionIso: null,
    };
  }

  const totalCompleted = entries.length;
  const totalXpEarned = entries.reduce((sum, e) => sum + (e.xpEarned || 0), 0);
  const artifacts = new Set(entries.map((e) => e.targetArtifact));

  const categoryCounts: Record<string, number> = {};
  entries.forEach((e) => {
    categoryCounts[e.categoryBadge] = (categoryCounts[e.categoryBadge] || 0) + 1;
  });

  let topCategory = 'General';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  }

  const sortedByDate = [...entries].sort(
    (a, b) =>
      new Date(b.completedAtIso).getTime() - new Date(a.completedAtIso).getTime()
  );

  return {
    totalCompleted,
    totalXpEarned,
    distinctArtifactsCount: artifacts.size,
    topCategory,
    latestCompletionIso: sortedByDate[0]?.completedAtIso || null,
  };
}
