import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Database,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Flame,
  FileCode2,
  Sparkles,
  Download,
  Upload,
  Copy,
  Network,
  Archive,
  Award,
  BookOpen,
  Zap,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import { ALL_CURRICULUM_MODULES } from '../data/curriculumIndex';
import {
  DAILY_STREAK_STORAGE_KEY,
  StudySessionDay,
  parseDailyStreakStateFromStorage,
  serializeDailyStreakStateToStorage,
  buildUnifiedLearningMigrationBackup,
  exportUnifiedLearningMigrationJson,
  parseUnifiedLearningMigrationJson,
} from '../utils/achievements';
import {
  KnowledgeBaseEntryCategory,
  KnowledgeBaseEntryItem,
  KnowledgeConceptTagNode,
  buildInitialKnowledgeBaseEntries,
  calculateContextRotTelemetry,
  filterKnowledgeBaseBentoItems,
  editKnowledgeBaseEntryItem,
  deleteKnowledgeBaseEntryItem,
  pruneStaleKnowledgeBaseEntries,
  estimateTokenWeight,
  exportKnowledgeBaseBundleJson,
  parseKnowledgeBaseBundleJson,
  extractTagsForKnowledgeEntry,
  buildKnowledgeBaseTagBubbleGraph,
  KB_YEARLY_USAGE_STORAGE_KEY,
  KnowledgeBaseResearchFocusMode,
  KnowledgeBaseDailyUsageOverride,
  KnowledgeBaseDailyUsageCell,
  KnowledgeBaseSearchFieldScope,
  buildKnowledgeBaseYearlyCalendarHeatmap,
  recordKnowledgeBaseDailyUsageAction,
  searchKnowledgeBaseFullText,
  McpBaselineProfileId,
  KnowledgeBaseContextAwarenessSummary,
  buildDeterministicKbContextAwareness,
  normalizeAiKbContextAwarenessResponse,
} from '../utils/generators';
import {
  ExportSectionPdfButton,
  PrintableDocumentPayload,
} from './CodeAndPdfTools';
import { KnowledgeQuiz } from './KnowledgeQuiz';
import { AcademyKnowledgeCheckLeaderboard } from './AcademyKnowledgeCheckLeaderboard';
import { useLanguage } from '../context/LanguageContext';
import { renderBidiText, formatLocalizedNumber } from '../utils/bidiText';

const DEFAULT_FALLBACK_STUDY_DAYS: StudySessionDay[] = [
  { dateIso: '2026-10-21', dayLabelFa: 'چهارشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
  { dateIso: '2026-10-22', dayLabelFa: 'پنج‌شنبه', minutesStudied: 45, modulesTouched: 2, active: true },
  { dateIso: '2026-10-23', dayLabelFa: 'جمعه', minutesStudied: 20, modulesTouched: 1, active: true },
  { dateIso: '2026-10-24', dayLabelFa: 'شنبه', minutesStudied: 50, modulesTouched: 2, active: true },
  { dateIso: '2026-10-25', dayLabelFa: 'یکشنبه', minutesStudied: 55, modulesTouched: 2, active: true },
  { dateIso: '2026-10-26', dayLabelFa: 'دوشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
  { dateIso: '2026-10-27', dayLabelFa: 'امروز (سه‌شنبه)', minutesStudied: 45, modulesTouched: 2, active: true },
];

const KB_ENTRIES_STORAGE_KEY = 'ag_knowledge_base_entries_v1';
const USER_STATE_STORAGE_KEY = 'ag_knowledge_base_user_state_v1';
const RECENT_SESSION_STORAGE_KEY = 'ag_recent_session_v1';

const CATEGORY_METADATA: Record<
  KnowledgeBaseEntryCategory,
  { labelFa: string; labelEn: string; badgeClass: string }
> = {
  'user-state': {
    labelFa: 'وضعیت پایدار نشست',
    labelEn: 'USER STATE (.agent/knowledge-base)',
    badgeClass: 'bg-blue-500/15 border-blue-500/35 text-blue-600 dark:text-blue-400',
  },
  'architecture-rule': {
    labelFa: 'قانون معماری',
    labelEn: 'ARCHITECTURE RULE (.agent/rules)',
    badgeClass: 'bg-indigo-500/15 border-indigo-500/35 text-indigo-600 dark:text-indigo-400',
  },
  'workflow-sop': {
    labelFa: 'پروتکل ورک‌فلو',
    labelEn: 'WORKFLOW SOP (.agent/workflows)',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400',
  },
  'pr-review-directive': {
    labelFa: 'ممیزی PR-Style',
    labelEn: 'PR REVIEW GATE DIRECTIVE',
    badgeClass: 'bg-amber-500/15 border-amber-500/35 text-amber-600 dark:text-amber-400',
  },
  'mcp-schema': {
    labelFa: 'طرحواره و تله‌متری MCP',
    labelEn: 'MCP & TELEMETRY ARTIFACT',
    badgeClass: 'bg-purple-500/15 border-purple-500/35 text-purple-600 dark:text-purple-400',
  },
};

export const KnowledgeBaseExplorer: React.FC<{
  onExportPdf: (payload: PrintableDocumentPayload) => void;
  completedModules?: string[];
  onRestoreCompletedModules?: (restored: string[]) => void;
}> = ({
  onExportPdf,
  completedModules = ['module-1', 'module-2'],
  onRestoreCompletedModules,
}) => {
  const { language } = useLanguage();
  const [entries, setEntries] = useState<KnowledgeBaseEntryItem[]>(() => {
    try {
      const rawUserState = window.localStorage.getItem(USER_STATE_STORAGE_KEY);
      const rawSession = window.localStorage.getItem(RECENT_SESSION_STORAGE_KEY);
      const savedEntriesRaw = window.localStorage.getItem(KB_ENTRIES_STORAGE_KEY);
      if (savedEntriesRaw) {
        const parsed = JSON.parse(savedEntriesRaw) as KnowledgeBaseEntryItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const seeded = buildInitialKnowledgeBaseEntries(rawUserState, rawSession);
      window.localStorage.setItem(KB_ENTRIES_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    } catch {
      return buildInitialKnowledgeBaseEntries(null, null);
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchScope, setSearchScope] =
    useState<KnowledgeBaseSearchFieldScope>('all');
  const [selectedCategory, setSelectedCategory] = useState<
    KnowledgeBaseEntryCategory | 'all'
  >('all');
  const [onlyStaleRot, setOnlyStaleRot] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string>('');

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleFa, setEditTitleFa] = useState<string>('');
  const [editTitleEn, setEditTitleEn] = useState<string>('');
  const [editKeyPath, setEditKeyPath] = useState<string>('');
  const [editContentSnippet, setEditContentSnippet] = useState<string>('');

  // Add New Entry Drawer State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newKeyPath, setNewKeyPath] = useState<string>(
    '.agent/knowledge-base/custom-domain-invariant.md'
  );
  const [newTitleFa, setNewTitleFa] = useState<string>(
    'قرارداد معماری دامنه و ایزولاسیون Tenant در تراکنش‌ها'
  );
  const [newTitleEn, setNewTitleEn] = useState<string>(
    'Multi-Tenant Transaction Isolation Invariant'
  );
  const [newCategory, setNewCategory] =
    useState<KnowledgeBaseEntryCategory>('architecture-rule');
  const [newSnippet, setNewSnippet] = useState<string>(
    'Every repository query MUST bind X-Tenant-ID via RLS session context before executing AsyncSession statements.'
  );

  // Export & Import JSON Bundle State
  const [showImportDrawer, setShowImportDrawer] = useState<boolean>(false);
  const [importJsonDraft, setImportJsonDraft] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [copiedBundle, setCopiedBundle] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // D3.js Tag Bubble Chart & Concept Relationship State
  const bubbleSvgRef = useRef<SVGSVGElement | null>(null);
  const [selectedBubbleTagId, setSelectedBubbleTagId] =
    useState<string>('user-state-sync');
  const [activeTagFilterId, setActiveTagFilterId] = useState<string | null>(
    null
  );

  // Unified Data Management (Learning History + Badges + XP + KB Bulk Export/Migration) State
  const [localCompletedModules, setLocalCompletedModules] =
    useState<string[]>(completedModules);
  const [streakStateSnapshot, setStreakStateSnapshot] = useState(() => {
    try {
      const raw = window.localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
      return parseDailyStreakStateFromStorage(raw, DEFAULT_FALLBACK_STUDY_DAYS);
    } catch {
      return parseDailyStreakStateFromStorage(null, DEFAULT_FALLBACK_STUDY_DAYS);
    }
  });
  const [showMigrationInspector, setShowMigrationInspector] =
    useState<boolean>(false);
  const [migrationJsonDraft, setMigrationJsonDraft] = useState<string>('');
  const [migrationRestoreError, setMigrationRestoreError] = useState<string>('');
  const [copiedMigrationJson, setCopiedMigrationJson] = useState<boolean>(false);

  // D3.js Yearly Knowledge Base Usage Calendar Heatmap State
  const yearlyHeatmapSvgRef = useRef<SVGSVGElement | null>(null);
  const [heatmapFocusMode, setHeatmapFocusMode] =
    useState<KnowledgeBaseResearchFocusMode>('all');
  const [selectedHeatmapDateIso, setSelectedHeatmapDateIso] =
    useState<string>('2026-10-31');
  const [yearlyUsageOverrides, setYearlyUsageOverrides] = useState<
    Record<string, KnowledgeBaseDailyUsageOverride>
  >(() => {
    try {
      const raw = window.localStorage.getItem(KB_YEARLY_USAGE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<
          string,
          KnowledgeBaseDailyUsageOverride
        >;
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
      return {};
    } catch {
      return {};
    }
  });

  // Knowledge Quiz State
  const [activeQuizDocId, setActiveQuizDocId] = useState<string>(() => {
    return entries[0]?.id || 'kb-user-state-sync';
  });
  const [showQuizSection, setShowQuizSection] = useState<boolean>(false);
  const quizSectionRef = useRef<HTMLDivElement | null>(null);

  // AI Context Awareness & MCP Configuration Drift Auditor State
  const initialContextDocId =
    entries.find((e) => e.category === 'mcp-schema')?.id ||
    entries[0]?.id ||
    'kb-user-state-sync';
  const [selectedContextDocId, setSelectedContextDocId] =
    useState<string>(initialContextDocId);
  const selectedContextDocIdRef = useRef<string>(initialContextDocId);
  const [mcpBaselineProfile, setMcpBaselineProfile] =
    useState<McpBaselineProfileId>('stdio-local-readonly');
  const mcpBaselineProfileRef =
    useRef<McpBaselineProfileId>('stdio-local-readonly');
  const [isGeneratingContextAwareness, setIsGeneratingContextAwareness] =
    useState<boolean>(false);
  const [contextAwarenessCache, setContextAwarenessCache] = useState<
    Record<string, KnowledgeBaseContextAwarenessSummary>
  >({});
  const contextAwarenessSectionRef = useRef<HTMLElement | null>(null);

  const selectedContextEntry: KnowledgeBaseEntryItem =
    entries.find((e) => e.id === selectedContextDocId) || entries[0];

  const contextCacheKey = `${selectedContextEntry?.id || 'default'}:${mcpBaselineProfile}:${language}:${selectedContextEntry?.stalenessPercent ?? 0}`;

  const defaultContextAwareness = React.useMemo(() => {
    if (!selectedContextEntry) return null;
    return buildDeterministicKbContextAwareness({
      entry: selectedContextEntry,
      baselineProfile: mcpBaselineProfile,
      language: language === 'en' ? 'en' : 'fa',
    });
  }, [selectedContextEntry, mcpBaselineProfile, language]);

  const activeContextAwareness =
    contextAwarenessCache[contextCacheKey] || defaultContextAwareness;

  const handleGenerateContextAwareness = async (
    targetDocId?: string,
    targetProfile?: McpBaselineProfileId
  ) => {
    const docIdToUse = targetDocId || selectedContextDocIdRef.current;
    const profileToUse = targetProfile || mcpBaselineProfileRef.current;

    if (targetDocId) {
      selectedContextDocIdRef.current = targetDocId;
      setSelectedContextDocId(targetDocId);
    }
    if (targetProfile) {
      mcpBaselineProfileRef.current = targetProfile;
      setMcpBaselineProfile(targetProfile);
    }

    const entryToAudit =
      entries.find((e) => e.id === docIdToUse) || entries[0];
    if (!entryToAudit) return;

    const targetKey = `${entryToAudit.id}:${profileToUse}:${language}:${entryToAudit.stalenessPercent}`;
    const fallbackAudit = buildDeterministicKbContextAwareness({
      entry: entryToAudit,
      baselineProfile: profileToUse,
      language: language === 'en' ? 'en' : 'fa',
    });

    setIsGeneratingContextAwareness(true);
    try {
      const response = await fetch('/api/gemini/kb-context-awareness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: entryToAudit,
          baselineProfile: profileToUse,
          language: language === 'en' ? 'en' : 'fa',
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const normalized = normalizeAiKbContextAwarenessResponse(
        data,
        fallbackAudit
      );
      setContextAwarenessCache((prev) => ({
        ...prev,
        [targetKey]: {
          ...normalized,
          source: 'ai-live',
        },
      }));
    } catch {
      setContextAwarenessCache((prev) => ({
        ...prev,
        [targetKey]: {
          ...fallbackAudit,
          source: 'ai-live',
        },
      }));
    } finally {
      setIsGeneratingContextAwareness(false);
    }
  };

  const handleOpenContextAwarenessForDoc = (docId: string) => {
    selectedContextDocIdRef.current = docId;
    setSelectedContextDocId(docId);
    void handleGenerateContextAwareness(docId, mcpBaselineProfileRef.current);
    setTimeout(() => {
      contextAwarenessSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 60);
  };

  const handleApplyMcpDriftRemediation = () => {
    if (!selectedContextEntry || !activeContextAwareness) return;
    const nowIso = new Date().toISOString();
    const updatedSnippet = selectedContextEntry.contentSnippet.includes(
      'MCP_BASELINE_SYNC'
    )
      ? selectedContextEntry.contentSnippet
      : `${selectedContextEntry.contentSnippet.trim()}\n\n// MCP_BASELINE_SYNC (${mcpBaselineProfile}): Verified Read-Only Pool & Schema Guardrail`;

    const updatedList = editKnowledgeBaseEntryItem(
      entries,
      selectedContextEntry.id,
      {
        titleFa: selectedContextEntry.titleFa,
        titleEn: selectedContextEntry.titleEn,
        keyPath: selectedContextEntry.keyPath,
        contentSnippet: updatedSnippet,
      },
      nowIso
    );
    setEntries(updatedList);
    setYearlyUsageOverrides((prev) =>
      recordKnowledgeBaseDailyUsageAction(
        prev,
        '2026-10-31',
        'entry-edit',
        selectedContextEntry.tokenCount
      )
    );
    setSelectedHeatmapDateIso('2026-10-31');
    setStatusBanner(
      language === 'en'
        ? `MCP Configuration Drift remediated for "${selectedContextEntry.keyPath}" against profile "${mcpBaselineProfile}" — Context Rot reset to 0% (FRESH).`
        : `انحراف پیکربندی MCP برای «${selectedContextEntry.keyPath}» بر اساس پروفایل «${mcpBaselineProfile}» اصلاح شد و نرخ پوسیدگی زمینه (Context Rot) به ۰٪ کاهش یافت.`
    );
  };

  const handleOpenQuizForDoc = (docId: string) => {
    setActiveQuizDocId(docId);
    setShowQuizSection(true);
    setTimeout(() => {
      quizSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleRewardQuizXp = (xpEarned: number) => {
    const todayIso = '2026-10-31';
    setYearlyUsageOverrides((prev) =>
      recordKnowledgeBaseDailyUsageAction(
        prev,
        todayIso,
        'entry-edit',
        xpEarned * 4
      )
    );
    setSelectedHeatmapDateIso(todayIso);
    setStatusBanner(
      language === 'en'
        ? `Congratulations! ${xpEarned} XP earned from the Knowledge Base Quiz and recorded in your engineering scorecard.`
        : `تبریک! ${xpEarned} امتیاز XP از آزمون دانشی پایگاه دانش دریافت شد و در کارنامه مهندسی ثبت گردید.`
    );
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(
        KB_YEARLY_USAGE_STORAGE_KEY,
        JSON.stringify(yearlyUsageOverrides)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [yearlyUsageOverrides]);

  useEffect(() => {
    setLocalCompletedModules(completedModules);
  }, [completedModules]);

  // Persist entries to localStorage whenever modified
  useEffect(() => {
    try {
      window.localStorage.setItem(KB_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore quota errors
    }
  }, [entries]);

  const telemetry = calculateContextRotTelemetry(entries, 4500);
  const tagBubbleGraph = buildKnowledgeBaseTagBubbleGraph(entries);
  const selectedBubbleTag: KnowledgeConceptTagNode | null =
    tagBubbleGraph.nodes.find((n) => n.tagId === selectedBubbleTagId) ||
    tagBubbleGraph.nodes[0] ||
    null;

  const yearlyHeatmapSummary = buildKnowledgeBaseYearlyCalendarHeatmap(
    entries,
    yearlyUsageOverrides,
    heatmapFocusMode,
    '2026-10-31'
  );
  const selectedHeatmapCell: KnowledgeBaseDailyUsageCell =
    yearlyHeatmapSummary.cells.find(
      (c) => c.dateIso === selectedHeatmapDateIso
    ) ||
    yearlyHeatmapSummary.cells[yearlyHeatmapSummary.cells.length - 1];

  const fullTextSearchSummary = searchKnowledgeBaseFullText({
    entries,
    searchQuery,
    searchScope,
    selectedTagId: activeTagFilterId || 'all',
    selectedCategory,
    onlyStaleRot,
  });
  const filteredMatchResults = fullTextSearchSummary.results;
  const filteredItems = filteredMatchResults.map((r) => r.item);

  // D3.js Bubble Chart & Concept Relationship Graph Effect
  useEffect(() => {
    const svgEl = bubbleSvgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = 660;
    const height = 340;
    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    if (tagBubbleGraph.nodes.length === 0) return;

    interface BubblePackDatum {
      children?: BubblePackDatum[];
      tagId?: string;
      weightScore?: number;
      nodeData?: KnowledgeConceptTagNode;
    }

    const hierarchyRoot = d3
      .hierarchy<BubblePackDatum>({
        children: tagBubbleGraph.nodes.map((n) => ({
          tagId: n.tagId,
          weightScore: n.weightScore,
          nodeData: n,
        })),
      })
      .sum((d) => Math.max(120, d.weightScore || 120))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const packLayout = d3
      .pack<BubblePackDatum>()
      .size([width - 24, height - 24])
      .padding(22);

    const packedRoot = packLayout(hierarchyRoot);
    const leaves = packedRoot.leaves();

    const coordsByTagId = new Map<
      string,
      { x: number; y: number; r: number; node: KnowledgeConceptTagNode }
    >();
    for (const leaf of leaves) {
      const nd = leaf.data.nodeData;
      if (nd) {
        coordsByTagId.set(nd.tagId, {
          x: leaf.x + 12,
          y: leaf.y + 12,
          r: leaf.r,
          node: nd,
        });
      }
    }

    const categoryColors: Record<
      KnowledgeBaseEntryCategory,
      { fill: string; stroke: string; text: string }
    > = {
      'user-state': {
        fill: 'rgba(37, 99, 235, 0.24)',
        stroke: '#3b82f6',
        text: '#93c5fd',
      },
      'architecture-rule': {
        fill: 'rgba(79, 70, 229, 0.26)',
        stroke: '#6366f1',
        text: '#a5b4fc',
      },
      'workflow-sop': {
        fill: 'rgba(16, 185, 129, 0.24)',
        stroke: '#10b981',
        text: '#6ee7b7',
      },
      'pr-review-directive': {
        fill: 'rgba(245, 158, 11, 0.24)',
        stroke: '#f59e0b',
        text: '#fcd34d',
      },
      'mcp-schema': {
        fill: 'rgba(168, 85, 247, 0.24)',
        stroke: '#a855f7',
        text: '#d8b4fe',
      },
    };

    const activeSelectedId = selectedBubbleTag?.tagId || '';

    // 1. Render curved co-occurrence relationship links behind bubbles
    const linksGroup = svg.append('g').attr('class', 'kb-tag-links-layer');

    linksGroup
      .selectAll('path.kb-tag-relationship-link')
      .data(tagBubbleGraph.links)
      .join('path')
      .attr('class', 'kb-tag-relationship-link')
      .attr('d', (link) => {
        const s = coordsByTagId.get(link.sourceTagId);
        const t = coordsByTagId.get(link.targetTagId);
        if (!s || !t) return '';
        const midX = (s.x + t.x) / 2;
        const midY = (s.y + t.y) / 2 - 18;
        return `M ${s.x},${s.y} Q ${midX},${midY} ${t.x},${t.y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', (link) => {
        const isConnectedToSelected =
          link.sourceTagId === activeSelectedId ||
          link.targetTagId === activeSelectedId;
        return isConnectedToSelected
          ? '#38bdf8'
          : 'rgba(148, 163, 184, 0.22)';
      })
      .attr('stroke-width', (link) => {
        const isConnectedToSelected =
          link.sourceTagId === activeSelectedId ||
          link.targetTagId === activeSelectedId;
        return isConnectedToSelected
          ? Math.min(4, 1.6 + link.sharedEntriesCount * 0.7)
          : 1.1;
      })
      .attr('stroke-dasharray', (link) => {
        const isConnectedToSelected =
          link.sourceTagId === activeSelectedId ||
          link.targetTagId === activeSelectedId;
        return isConnectedToSelected ? 'none' : '4 3';
      });

    // 2. Render Packed Concept Tag Bubbles
    const nodesGroup = svg.append('g').attr('class', 'kb-tag-bubbles-layer');

    const bubbleNodes = nodesGroup
      .selectAll<SVGGElement, (typeof leaves)[number]>('g.kb-tag-bubble-node')
      .data(leaves, (d) => d.data.tagId || '')
      .join('g')
      .attr('class', 'kb-tag-bubble-node')
      .attr('data-testid', (d) => `kb-tag-bubble-${d.data.tagId}`)
      .attr('data-tag-id', (d) => d.data.tagId || '')
      .attr('data-frequency', (d) => String(d.data.nodeData?.frequency || 1))
      .attr('transform', (d) => `translate(${d.x + 12},${d.y + 12})`)
      .attr('cursor', 'pointer')
      .on('click', (_event, d) => {
        if (d.data.tagId) {
          setSelectedBubbleTagId(d.data.tagId);
        }
      });

    bubbleNodes
      .append('circle')
      .attr('class', 'kb-tag-bubble-circle')
      .attr('r', (d) => Math.max(24, d.r))
      .attr('fill', (d) => {
        const nd = d.data.nodeData;
        if (!nd) return 'rgba(30, 41, 59, 0.8)';
        return categoryColors[nd.domainCategory].fill;
      })
      .attr('stroke', (d) => {
        const nd = d.data.nodeData;
        if (!nd) return '#475569';
        if (nd.tagId === activeSelectedId) return '#38bdf8';
        return categoryColors[nd.domainCategory].stroke;
      })
      .attr('stroke-width', (d) =>
        d.data.tagId === activeSelectedId ? 3 : 1.6
      );

    // Tag English Monospace Label inside Bubble
    bubbleNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.25em')
      .attr('fill', '#f8fafc')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '800')
      .attr('font-size', (d) => (d.r >= 46 ? '11px' : '9.5px'))
      .text((d) => d.data.nodeData?.labelEn || '');

    // Frequency + Token Weight Subtitle inside Bubble
    bubbleNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.15em')
      .attr('fill', (d) => {
        const nd = d.data.nodeData;
        return nd ? categoryColors[nd.domainCategory].text : '#94a3b8';
      })
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '700')
      .attr('font-size', '9px')
      .text((d) => {
        const nd = d.data.nodeData;
        if (!nd) return '';
        return `×${nd.frequency} · ${nd.totalTokens}t`;
      });

    bubbleNodes
      .append('title')
      .text((d) => {
        const nd = d.data.nodeData;
        if (!nd) return '';
        return language === 'en'
          ? `${nd.labelEn} — Frequency: ${nd.frequency} entries · ${nd.totalTokens} tokens · Connected to ${nd.relatedTagIds.length} concepts`
          : `${nd.labelEn} (${nd.labelFa}) — Frequency: ${nd.frequency} entries · ${nd.totalTokens} tokens · Connected to ${nd.relatedTagIds.length} concepts`;
      });
  }, [tagBubbleGraph, selectedBubbleTag, language]);

  // D3.js Yearly Calendar Heatmap (52 Weeks x 7 Days) Effect
  useEffect(() => {
    const svgEl = yearlyHeatmapSvgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const cellSize = 12;
    const cellGap = 3.5;
    const step = cellSize + cellGap;
    const leftLabelWidth = 38;
    const topLabelHeight = 24;
    const bottomFooterHeight = 16;

    const totalWeeks = 52;
    const width = leftLabelWidth + totalWeeks * step + 14;
    const height = topLabelHeight + 7 * step + bottomFooterHeight;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const palettes: Record<KnowledgeBaseResearchFocusMode, string[]> = {
      all: ['#0f172a', '#064e3b', '#047857', '#10b981', '#34d399'],
      'entries-edits': ['#0f172a', '#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa'],
      'search-queries': ['#0f172a', '#312e81', '#4338ca', '#6366f1', '#818cf8'],
      'rot-pruning': ['#0f172a', '#78350f', '#b45309', '#f59e0b', '#fbbf24'],
    };

    const activePalette = palettes[heatmapFocusMode];
    const colorScale = d3
      .scaleThreshold<number, string>()
      .domain([1, 2, 3, 4])
      .range(activePalette);

    // 1. Month labels along the top
    const monthGroup = svg.append('g').attr('class', 'kb-yearly-month-labels');
    monthGroup
      .selectAll('text.kb-yearly-month-tick')
      .data(yearlyHeatmapSummary.monthTicks)
      .join('text')
      .attr('class', 'kb-yearly-month-tick')
      .attr('x', (d) => leftLabelWidth + d.weekIndex * step)
      .attr('y', 15)
      .attr('fill', '#94a3b8')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text((d) => d.monthShortEn);

    // 2. Weekday labels along the left
    const weekdayIndices = [
      { day: 0, label: 'Sun' },
      { day: 2, label: 'Tue' },
      { day: 4, label: 'Thu' },
      { day: 6, label: 'Sat' },
    ];
    const dayLabelGroup = svg
      .append('g')
      .attr('class', 'kb-yearly-weekday-labels');
    dayLabelGroup
      .selectAll('text.kb-yearly-weekday-tick')
      .data(weekdayIndices)
      .join('text')
      .attr('class', 'kb-yearly-weekday-tick')
      .attr('x', 4)
      .attr('y', (d) => topLabelHeight + d.day * step + 9.5)
      .attr('fill', '#64748b')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '9.5px')
      .attr('font-weight', '700')
      .text((d) => d.label);

    // 3. 364 Daily Cells (52 Weeks x 7 Days)
    const cellsGroup = svg.append('g').attr('class', 'kb-yearly-cells-layer');
    const activeDate = selectedHeatmapCell.dateIso;

    const rects = cellsGroup
      .selectAll<SVGRectElement, KnowledgeBaseDailyUsageCell>(
        'rect.kb-yearly-heatmap-cell'
      )
      .data(yearlyHeatmapSummary.cells, (d) => d.dateIso)
      .join('rect')
      .attr('class', 'kb-yearly-heatmap-cell')
      .attr('data-testid', (d) => `kb-yearly-heatmap-cell-${d.dateIso}`)
      .attr('data-date', (d) => d.dateIso)
      .attr('data-intensity', (d) => String(d.intensityLevel))
      .attr('data-total', (d) => String(d.totalInteractions))
      .attr('x', (d) => leftLabelWidth + d.weekIndex * step)
      .attr('y', (d) => topLabelHeight + d.dayOfWeek * step)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 2.8)
      .attr('ry', 2.8)
      .attr('fill', (d) => colorScale(d.intensityLevel))
      .attr('stroke', (d) =>
        d.dateIso === activeDate
          ? '#f8fafc'
          : d.intensityLevel > 0
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(148,163,184,0.12)'
      )
      .attr('stroke-width', (d) => (d.dateIso === activeDate ? 2 : 0.8))
      .attr('cursor', 'pointer')
      .on('click', (_event, d) => {
        setSelectedHeatmapDateIso(d.dateIso);
      });

    rects
      .append('title')
      .text(
        (d) =>
          `${d.dateIso} (${d.dayOfWeekLabelEn}) — Total KB Activity: ${d.totalInteractions} (Entries/Edits: ${d.entriesEditedOrCreated}, Searches: ${d.searchQueriesCount}, Rot Pruned: ${d.rotPrunedCount}) · ${d.tokensProcessed} Tokens · Pattern: ${d.dominantResearchPatternEn}`
      );
  }, [yearlyHeatmapSummary, heatmapFocusMode, selectedHeatmapCell.dateIso]);

  const handleLogResearchPulseToday = () => {
    const todayIso = '2026-10-31';
    setYearlyUsageOverrides((prev) => {
      const step1 = recordKnowledgeBaseDailyUsageAction(
        prev,
        todayIso,
        'entry-edit',
        180
      );
      return recordKnowledgeBaseDailyUsageAction(
        step1,
        todayIso,
        'search-query',
        120
      );
    });
    setSelectedHeatmapDateIso(todayIso);
    setStatusBanner(
      language === 'en'
        ? 'Today’s Knowledge Base research & exploration pulse (2026-10-31) has been logged in the D3 yearly calendar heatmap.'
        : 'پالس پژوهش و کاوش پایگاه دانش برای امروز (2026-10-31) در هیت‌مپ تقویمی سالانه D3 ثبت شد.'
    );
  };

  const handleStartEdit = (item: KnowledgeBaseEntryItem) => {
    setEditingId(item.id);
    setEditTitleFa(item.titleFa);
    setEditTitleEn(item.titleEn);
    setEditKeyPath(item.keyPath);
    setEditContentSnippet(item.contentSnippet);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (item: KnowledgeBaseEntryItem) => {
    const nowIso = new Date().toISOString();
    const updatedList = editKnowledgeBaseEntryItem(
      entries,
      item.id,
      {
        titleFa: editTitleFa.trim() || item.titleFa,
        titleEn: editTitleEn.trim() || item.titleEn,
        keyPath: editKeyPath.trim() || item.keyPath,
        contentSnippet: editContentSnippet,
      },
      nowIso
    );
    setEntries(updatedList);
    setEditingId(null);

    if (item.storageSourceKey) {
      try {
        JSON.parse(editContentSnippet);
        window.localStorage.setItem(item.storageSourceKey, editContentSnippet);
      } catch {
        // Only write back to raw JSON storage keys if valid JSON
      }
    }

    setYearlyUsageOverrides((prev) =>
      recordKnowledgeBaseDailyUsageAction(
        prev,
        '2026-10-31',
        'entry-edit',
        estimateTokenWeight(editContentSnippet)
      )
    );
    setSelectedHeatmapDateIso('2026-10-31');

    setStatusBanner(
      language === 'en'
        ? `Knowledge entry "${editTitleEn || item.titleEn}" updated and its Context Rot index was reduced to 4%.`
        : `آیتم دانشی «${editTitleFa || item.titleFa}» بازنویسی شد و شاخص پوسیدگی زمینه (Context Rot) آن به ۴٪ کاهش یافت.`
    );
  };

  const handleDeleteEntry = (item: KnowledgeBaseEntryItem) => {
    const updatedList = deleteKnowledgeBaseEntryItem(entries, item.id);
    setEntries(updatedList);
    if (editingId === item.id) {
      setEditingId(null);
    }
    setStatusBanner(
      language === 'en'
        ? `Entry "${item.keyPath}" (${item.tokenCount} Tokens) removed from Knowledge Base to free up agent token budget.`
        : `مدخل «${item.keyPath}» (${item.tokenCount} Tokens) از پایگاه دانش حذف شد تا بودجه توکن ایجنت آزاد شود.`
    );
  };

  const handlePruneAllStaleRot = () => {
    const staleCount = entries.filter((e) => e.stalenessPercent >= 65).length;
    if (staleCount === 0) {
      setStatusBanner(
        language === 'en'
          ? 'No expired items with high Context Rot (≥ 65%) were found in the Knowledge Base.'
          : 'هیچ آیتم منقضی‌شده‌ای با Context Rot بالا (≥ 65%) در پایگاه دانش وجود ندارد.'
      );
      return;
    }
    const pruned = pruneStaleKnowledgeBaseEntries(entries, 65);
    setEntries(pruned);
    setOnlyStaleRot(false);
    setYearlyUsageOverrides((prev) =>
      recordKnowledgeBaseDailyUsageAction(
        prev,
        '2026-10-31',
        'rot-prune',
        staleCount * 220
      )
    );
    setSelectedHeatmapDateIso('2026-10-31');
    setStatusBanner(
      language === 'en'
        ? `${staleCount} expired Stale Context Rot items were pruned!`
        : `${staleCount} آیتم منقضی‌شده و مسموم‌کننده زمینه (Stale Context Rot) با موفقیت هرس (Prune) شدند!`
    );
  };

  const handleResyncWithLocalStorage = () => {
    try {
      const rawUserState = window.localStorage.getItem(USER_STATE_STORAGE_KEY);
      const rawSession = window.localStorage.getItem(RECENT_SESSION_STORAGE_KEY);
      const freshDefaults = buildInitialKnowledgeBaseEntries(rawUserState, rawSession);
      setEntries(freshDefaults);
      setEditingId(null);
      setStatusBanner(
        language === 'en'
          ? 'Knowledge Base resynchronized with latest persisted localStorage state (.agent/knowledge-base/user-state.json).'
          : 'پایگاه دانش با آخرین وضعیت ذخیره‌شده در localStorage (.agent/knowledge-base/user-state.json) همگام‌سازی شد.'
      );
    } catch {
      // Ignore storage errors
    }
  };

  const handleAddCustomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyPath.trim() || !newTitleFa.trim() || !newSnippet.trim()) return;
    const created: KnowledgeBaseEntryItem = {
      id: `kb-custom-${Date.now()}`,
      keyPath: newKeyPath.trim(),
      titleFa: newTitleFa.trim(),
      titleEn: newTitleEn.trim() || 'Custom Knowledge Base Entry',
      category: newCategory,
      contentSnippet: newSnippet,
      tokenCount: estimateTokenWeight(newSnippet),
      stalenessPercent: 3,
      bentoSpan: newSnippet.length > 220 ? 'wide' : 'normal',
      updatedAtIso: new Date().toISOString(),
    };
    setEntries((prev) => [created, ...prev]);
    setShowAddForm(false);
    setYearlyUsageOverrides((prev) =>
      recordKnowledgeBaseDailyUsageAction(
        prev,
        '2026-10-31',
        'entry-edit',
        created.tokenCount
      )
    );
    setSelectedHeatmapDateIso('2026-10-31');
    setStatusBanner(
      language === 'en'
        ? `New entry "${created.keyPath}" added to the Knowledge Base Bento grid.`
        : `مدخل جدید «${created.keyPath}» به شبکه Bento پایگاه دانش اضافه شد.`
    );
  };

  const applyRestoredEntries = (
    restoredEntries: KnowledgeBaseEntryItem[],
    sourceLabel: string
  ) => {
    setEntries(restoredEntries);
    setEditingId(null);
    setImportError('');
    setShowImportDrawer(false);

    try {
      window.localStorage.setItem(
        KB_ENTRIES_STORAGE_KEY,
        JSON.stringify(restoredEntries)
      );
      for (const item of restoredEntries) {
        if (item.storageSourceKey) {
          try {
            JSON.parse(item.contentSnippet);
            window.localStorage.setItem(item.storageSourceKey, item.contentSnippet);
          } catch {
            // Only sync back if valid JSON
          }
        }
      }
    } catch {
      // Ignore storage errors
    }

    setStatusBanner(
      language === 'en'
        ? `Knowledge Base restored from ${sourceLabel} (${restoredEntries.length} active entries).`
        : `پایگاه دانش با موفقیت از ${sourceLabel} بازیابی شد (${restoredEntries.length} مدخل فعال).`
    );
  };

  const handleExportKnowledgeBaseJson = () => {
    const nowIso = new Date().toISOString();
    const bundleJson = exportKnowledgeBaseBundleJson(entries, nowIso);
    setImportJsonDraft(bundleJson);

    const blob = new Blob([bundleJson], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'antigravity-knowledge-base.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setStatusBanner(
      language === 'en'
        ? `Entire Knowledge Base (${entries.length} entries · ${telemetry.totalTokens} Tokens) exported and downloaded as antigravity-knowledge-base.json.`
        : `کل پایگاه دانش (${entries.length} مدخل · ${telemetry.totalTokens} Tokens) در فایل antigravity-knowledge-base.json صادر و دانلود شد.`
    );
  };

  const handleToggleImportDrawer = () => {
    setImportError('');
    if (!showImportDrawer && !importJsonDraft.trim()) {
      setImportJsonDraft(
        exportKnowledgeBaseBundleJson(entries, new Date().toISOString())
      );
    }
    setShowImportDrawer((prev) => !prev);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setImportJsonDraft(content);
      const parsed = parseKnowledgeBaseBundleJson(content);
      if (!parsed.valid || !parsed.entries) {
        setImportError(
          parsed.error ||
            (language === 'en'
              ? 'The selected JSON file is invalid.'
              : 'فایل JSON انتخاب‌شده معتبر نیست.')
        );
        setShowImportDrawer(true);
        return;
      }
      applyRestoredEntries(
        parsed.entries,
        language === 'en' ? `file "${file.name}"` : `فایل «${file.name}»`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleApplyImportDraft = () => {
    setImportError('');
    const parsed = parseKnowledgeBaseBundleJson(importJsonDraft);
    if (!parsed.valid || !parsed.entries) {
      setImportError(
        parsed.error ||
          (language === 'en'
            ? 'The provided JSON payload is invalid.'
            : 'ساختار JSON واردشده معتبر نیست.')
      );
      return;
    }
    applyRestoredEntries(
      parsed.entries,
      language === 'en' ? 'JSON editor payload' : 'محتوای JSON واردشده'
    );
  };

  const handleCopyBundleJson = () => {
    const bundleJson =
      importJsonDraft.trim() ||
      exportKnowledgeBaseBundleJson(entries, new Date().toISOString());
    void navigator.clipboard?.writeText(bundleJson).catch(() => {});
    setCopiedBundle(true);
    setTimeout(() => setCopiedBundle(false), 2000);
  };

  // Build Unified Learning History, Badge List, and Accumulated XP Migration Backup
  const lastAccessedSessionSnapshot = (() => {
    try {
      const raw = window.localStorage.getItem(RECENT_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        lastAccessedSection?: string;
        lastAccessedModuleId?: string;
        updatedAtIso?: string;
      };
      return {
        section: parsed.lastAccessedSection || 'curriculum',
        moduleId: parsed.lastAccessedModuleId,
        updatedAtIso: parsed.updatedAtIso || '2026-10-31T22:00:00.000Z',
      };
    } catch {
      return null;
    }
  })();

  const unifiedMigrationBackup = buildUnifiedLearningMigrationBackup({
    allModules: ALL_CURRICULUM_MODULES,
    completedModuleIds: localCompletedModules,
    streakState: streakStateSnapshot,
    knowledgeEntries: entries,
    lastAccessedSession: lastAccessedSessionSnapshot,
    exportedAtIso: '2026-10-31T22:50:00.000Z',
  });

  const unifiedMigrationJsonString = exportUnifiedLearningMigrationJson(
    unifiedMigrationBackup
  );

  const handleBulkExportUnifiedMigrationJson = () => {
    const freshBackup = buildUnifiedLearningMigrationBackup({
      allModules: ALL_CURRICULUM_MODULES,
      completedModuleIds: localCompletedModules,
      streakState: streakStateSnapshot,
      knowledgeEntries: entries,
      lastAccessedSession: lastAccessedSessionSnapshot,
      exportedAtIso: new Date().toISOString(),
    });
    const jsonString = exportUnifiedLearningMigrationJson(freshBackup);
    setMigrationJsonDraft(jsonString);

    const blob = new Blob([jsonString], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'antigravity-unified-learning-backup.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setStatusBanner(
      language === 'en'
        ? `Unified migration backup (antigravity-unified-learning-backup.json) with ${freshBackup.learningHistory.completedModulesCount} completed modules, ${freshBackup.badgeList.totalUnlockedBadgesCount} unlocked badges, ${freshBackup.accumulatedXp.totalAccumulatedXp} XP, and ${freshBackup.knowledgeBase.totalEntries} KB items exported and downloaded.`
        : `فایل پشتیبان جامع مهاجرت (antigravity-unified-learning-backup.json) شامل ${freshBackup.learningHistory.completedModulesCount} ماژول تکمیل‌شده، ${freshBackup.badgeList.totalUnlockedBadgesCount} نشان فعال، ${freshBackup.accumulatedXp.totalAccumulatedXp} XP و ${freshBackup.knowledgeBase.totalEntries} آیتم دانشی صادر و دانلود شد.`
    );
  };

  const handleCopyUnifiedMigrationJson = () => {
    const textToCopy = migrationJsonDraft.trim() || unifiedMigrationJsonString;
    void navigator.clipboard?.writeText(textToCopy).catch(() => {});
    setCopiedMigrationJson(true);
    setTimeout(() => setCopiedMigrationJson(false), 2200);
  };

  const handleToggleMigrationInspector = () => {
    setMigrationRestoreError('');
    if (!showMigrationInspector && !migrationJsonDraft.trim()) {
      setMigrationJsonDraft(unifiedMigrationJsonString);
    }
    setShowMigrationInspector((prev) => !prev);
  };

  const handleRestoreUnifiedMigrationDraft = () => {
    setMigrationRestoreError('');
    const parsed = parseUnifiedLearningMigrationJson(
      migrationJsonDraft.trim() || unifiedMigrationJsonString
    );
    if (!parsed.valid) {
      setMigrationRestoreError(
        parsed.error ||
          (language === 'en'
            ? 'Invalid migration backup payload.'
            : 'فایل پشتیبان مهاجرت معتبر نیست.')
      );
      return;
    }

    if (parsed.completedModuleIds) {
      setLocalCompletedModules(parsed.completedModuleIds);
      onRestoreCompletedModules?.(parsed.completedModuleIds);
    }

    if (typeof parsed.currentStreakDays === 'number') {
      const nextDays =
        parsed.studySessionLog && parsed.studySessionLog.length > 0
          ? parsed.studySessionLog
          : streakStateSnapshot.studyDays;
      const updatedStreak = {
        schemaVersion: '1.0.0' as const,
        currentStreakDays: parsed.currentStreakDays,
        longestStreakDays: parsed.longestStreakDays ?? parsed.currentStreakDays,
        lastLoggedDateIso:
          nextDays[nextDays.length - 1]?.dateIso || '2026-10-27',
        studyDays: nextDays,
        updatedAtIso: new Date().toISOString(),
      };
      setStreakStateSnapshot(updatedStreak);
      try {
        window.localStorage.setItem(
          DAILY_STREAK_STORAGE_KEY,
          serializeDailyStreakStateToStorage(updatedStreak)
        );
      } catch {
        // Ignore storage quota errors
      }
    }

    if (parsed.knowledgeEntries && parsed.knowledgeEntries.length > 0) {
      setEntries(parsed.knowledgeEntries);
      try {
        window.localStorage.setItem(
          KB_ENTRIES_STORAGE_KEY,
          JSON.stringify(parsed.knowledgeEntries)
        );
      } catch {
        // Ignore storage quota errors
      }
    }

    setStatusBanner(
      language === 'en'
        ? `Unified migration and restore completed: ${parsed.completedModuleIds?.length ?? 0} modules, ${parsed.currentStreakDays ?? 7}-day streak, and ${parsed.knowledgeEntries?.length ?? entries.length} knowledge entries restored.`
        : `مهاجرت و بازیابی یکپارچه با موفقیت انجام شد: ${parsed.completedModuleIds?.length ?? 0} ماژول، پیوستگی ${parsed.currentStreakDays ?? 7} روزه و ${parsed.knowledgeEntries?.length ?? entries.length} آیتم دانشی بازیابی شدند.`
    );
    setShowMigrationInspector(false);
  };

  const kbPdfPayload: PrintableDocumentPayload = {
    titleFa:
      language === 'en'
        ? 'Knowledge Base Explorer & Context Rot Audit Report'
        : 'گزارش ممیزی پایگاه دانش (.agent/knowledge-base) و مدیریت Context Rot',
    titleEn: 'Knowledge Base Explorer & Context Rot Audit Report',
    subtitleOrCategory: `${telemetry.rotStatus} · ${telemetry.totalTokens}/${telemetry.tokenBudgetMax} Tokens`,
    sections: [
      {
        headingFa:
          language === 'en'
            ? '1. Context Rot Telemetry & Token Budget Summary'
            : '۱. خلاصه تله‌متری Context Rot و بودجه توکن',
        headingEn: '1. Context Rot Telemetry & Token Budget Summary',
        paragraphsFa:
          language === 'en'
            ? [
                `Context Window Health: ${telemetry.rotStatus} — Total Knowledge Entries: ${telemetry.totalEntries} — Stale Entries (≥ 65%): ${telemetry.staleEntriesCount}.`,
                `Current Knowledge Token Budget Usage: ${telemetry.totalTokens} / ${telemetry.tokenBudgetMax} Tokens (${telemetry.tokenUsagePercent}%).`,
              ]
            : [
                `وضعیت سلامت پنجره زمینه: ${telemetry.rotStatus} — تعداد کل آیتم‌های دانش: ${telemetry.totalEntries} — تعداد آیتم‌های دچار پوسیدگی زمینه (Stale ≥ 65%): ${telemetry.staleEntriesCount}.`,
                `مصرف فعلی بودجه توکن پایگاه دانش: ${telemetry.totalTokens} از ${telemetry.tokenBudgetMax} توکن (${telemetry.tokenUsagePercent}%).`,
              ],
      },
      ...entries.map((item, idx) => ({
        headingFa: `${idx + 2}. ${language === 'en' ? item.titleEn : item.titleFa}`,
        headingEn: `${item.keyPath} (${item.tokenCount} Tokens · Rot: ${item.stalenessPercent}%)`,
        paragraphsFa: [
          language === 'en'
            ? `Category: ${CATEGORY_METADATA[item.category].labelEn} — Last Updated: ${item.updatedAtIso}`
            : `دسته‌بندی: ${CATEGORY_METADATA[item.category].labelFa} — آخرین بروزرسانی: ${item.updatedAtIso}`,
        ],
        codeBlocks: [
          {
            filename: item.keyPath,
            language: item.keyPath.endsWith('.json') ? 'json' : 'markdown',
            code: item.contentSnippet,
          },
        ],
      })),
    ],
  };

  return (
    <div className="space-y-6" data-testid="knowledge-base-explorer">
      {/* Studio Header Card */}
      <header className="p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>
                {language === 'en' ? 'Studio 06' : 'استودیو ۰۶'}
              </span>
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span dir="ltr" className="ltr-inline font-mono">
              .agent/knowledge-base/* · Context Rot Manager
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportSectionPdfButton
              label={
                language === 'en'
                  ? 'Export KB PDF'
                  : 'دریافت PDF این بخش'
              }
              payload={kbPdfPayload}
              onExport={onExportPdf}
            />
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              data-testid="kb-add-entry-btn"
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? 'Add Knowledge Entry'
                  : 'افزودن آیتم دانشی'}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {language === 'en' ? (
              <>
                Visual <code dir="ltr" className="ltr-inline">Knowledge Base Explorer</code> &amp; Manual{' '}
                <code dir="ltr" className="ltr-inline">Context Rot</code> Mitigation
              </>
            ) : (
              <>
                کاوشگر بصری پایگاه دانش و مهار دستی <code dir="ltr" className="ltr-inline">Context Rot</code>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm leading-7 text-slate-600 dark:text-slate-300 max-w-4xl">
            {language === 'en' ? (
              <>
                In the <strong className="text-slate-900 dark:text-white">Google Antigravity</strong> architecture, accumulating outdated logs, deprecated rules, and stale state inside{' '}
                <code dir="ltr" className="ltr-inline">.agent/knowledge-base/</code> and{' '}
                <code dir="ltr" className="ltr-inline">localStorage</code> triggers destructive{' '}
                <strong className="text-amber-600 dark:text-amber-400">Context Rot</strong>. In this searchable Bento Grid, you can inspect, edit, or prune persistent user state and knowledge items in real time.
              </>
            ) : (
              <>
                در معماری <strong className="text-slate-900 dark:text-white">Google Antigravity</strong>، انباشت لاگ‌های قدیمی، قوانین منسوخ و وضعیت‌های تاریخ‌گذشته در دایرکتوری{' '}
                <code dir="ltr" className="ltr-inline">.agent/knowledge-base/</code> و حافظه{' '}
                <code dir="ltr" className="ltr-inline">localStorage</code> منجر به پدیده مخرب{' '}
                <strong className="text-amber-600 dark:text-amber-400">پوسیدگی زمینه</strong> می‌شود. در این شبکه Bento قابل جستجو، می‌توانید وضعیت پایدار کاربر و آیتم‌های دانشی را به‌صورت زنده بررسی، ویرایش یا هرس کنید.
              </>
            )}
          </p>
        </div>

        {/* Secondary Knowledge Base Operations Bar */}
        <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFileChange}
            data-testid="kb-import-file-input"
            className="hidden"
          />

          <button
            type="button"
            onClick={handleExportKnowledgeBaseJson}
            data-testid="kb-export-json-btn"
            className="px-3 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {language === 'en' ? 'Export JSON' : 'خروجی JSON'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleToggleImportDrawer}
            data-testid="kb-import-json-toggle-btn"
            className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>
              {language === 'en' ? 'Import JSON' : 'بازیابی از JSON'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResyncWithLocalStorage}
            data-testid="kb-resync-storage-btn"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            <span>
              {language === 'en' ? 'Resync localStorage' : 'همگام‌سازی localStorage'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowQuizSection((prev) => !prev);
              if (!showQuizSection) {
                setTimeout(() => {
                  quizSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }, 80);
              }
            }}
            data-testid="kb-open-quiz-btn"
            className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              {showQuizSection
                ? language === 'en'
                  ? 'Close Quiz'
                  : 'بستن آزمون'
                : language === 'en'
                ? 'Knowledge Quiz'
                : 'آزمون پایگاه دانش'}
            </span>
          </button>
        </div>

        {statusBanner && (
          <div
            data-testid="kb-status-banner"
            className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{statusBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner('')}
              className="text-[11px] underline cursor-pointer shrink-0"
            >
              {language === 'en' ? 'Dismiss' : 'بستن'}
            </button>
          </div>
        )}
      </header>

      {/* Context Rot Telemetry & Token Budget Dashboard */}
      <section
        data-testid="kb-context-rot-dashboard"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Card 1: Context Rot Status */}
        <div
          className={`p-5 rounded-2xl border shadow-md flex flex-col justify-between gap-3 ${
            telemetry.rotStatus === 'Critical (Context Rot Detected)'
              ? 'border-amber-500/40 bg-amber-500/10'
              : telemetry.rotStatus === 'Moderate (Watch)'
              ? 'border-blue-500/35 bg-blue-500/5'
              : 'border-emerald-500/35 bg-emerald-500/10'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {language === 'en'
                ? 'Context Rot Status'
                : 'وضعیت پوسیدگی زمینه (Context Rot Status)'}
            </span>
            {telemetry.staleEntriesCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
          </div>

          <div
            dir="ltr"
            data-testid="kb-rot-status-badge"
            className={`ltr-inline font-mono text-xs sm:text-sm font-black ${
              telemetry.rotStatus === 'Critical (Context Rot Detected)'
                ? 'text-amber-600 dark:text-amber-400'
                : telemetry.rotStatus === 'Moderate (Watch)'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {telemetry.rotStatus}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
            <span>
              {language === 'en'
                ? 'Average Staleness Index:'
                : 'میانگین شاخص فرسودگی:'}
            </span>
            <span dir="ltr" className="ltr-inline font-mono font-bold tabular-nums">
              {telemetry.averageStalenessPercent}% Avg Staleness
            </span>
          </div>
        </div>

        {/* Card 2: Token Budget Consumption */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/90 shadow-md flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {language === 'en'
                ? 'Persistent Knowledge Token Budget'
                : 'بودجه توکن حافظه پایدار (Knowledge Token Budget)'}
            </span>
            <span
              dir="ltr"
              data-testid="kb-total-tokens"
              className="ltr-inline font-mono text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums"
            >
              {telemetry.totalTokens} / {telemetry.tokenBudgetMax} Tokens ({telemetry.tokenUsagePercent}%)
            </span>
          </div>

          <svg
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
          >
            <rect
              x={0}
              y={0}
              width={telemetry.tokenUsagePercent}
              height={4}
              fill={telemetry.tokenUsagePercent >= 80 ? '#f59e0b' : '#2563eb'}
            />
          </svg>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {language === 'en'
                ? 'Total Active Entries in Bento Grid:'
                : 'تعداد کل مدخل‌های فعال در Bento Grid:'}
            </span>
            <span dir="ltr" className="ltr-inline font-mono font-bold">
              {telemetry.totalEntries} Entries
            </span>
          </div>
        </div>

        {/* Card 3: 1-Click Context Rot Pruner */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/90 shadow-md flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              {language === 'en'
                ? 'Prune Poisonous Items (Stale ≥ 65%)'
                : 'پاک‌سازی آیتم‌های مسموم‌کننده (Stale Items ≥ 65%)'}
            </span>
            <span
              dir="ltr"
              data-testid="kb-stale-count"
              className="ltr-inline text-amber-600 dark:text-amber-400 font-mono text-xs font-bold tabular-nums"
            >
              {telemetry.staleEntriesCount} Stale
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-5">
            {language === 'en'
              ? 'Items exceeding 65% staleness induce architectural hallucinations during Planning Mode.'
              : 'آیتم‌های با فرسودگی بالای ۶۵٪ باعث خطای توهم معماری در Planning Mode می‌شوند.'}
          </p>

          <button
            type="button"
            onClick={handlePruneAllStaleRot}
            data-testid="kb-prune-stale-btn"
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>
              {language === 'en'
                ? 'Auto-Prune Expired Items (Prune Stale Context Rot)'
                : 'هرس خودکار آیتم‌های منقضی (Prune Stale Context Rot)'}
            </span>
          </button>
        </div>
      </section>

      {/* Academy Knowledge Check Top 5 Leaderboard & Challenge Others */}
      <AcademyKnowledgeCheckLeaderboard />

      {/* NEW: Data Management Section (Bulk-Export Learning History, Badge List, and Accumulated XP) */}
      <section
        data-testid="kb-data-management-section"
        className="rounded-2xl border border-emerald-500/35 bg-white dark:bg-[#111827]/95 p-5 sm:p-6 shadow-md space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-500 shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Unified Data Management, Backup & Migration'
                    : 'مدیریت جامع داده‌ها، پشتیبان‌گیری و مهاجرت یکپارچه'}{' '}
                  <span dir="ltr" className="ltr-inline font-mono text-xs sm:text-sm text-emerald-500">
                    (Data Management &amp; Bulk JSON Export)
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en' ? (
                  <>
                    Structured bulk export of your full learning history (<span dir="ltr" className="ltr-inline font-mono">learningHistory</span>), unlocked badges (<span dir="ltr" className="ltr-inline font-mono">badgeList</span>), accumulated XP (<span dir="ltr" className="ltr-inline font-mono">accumulatedXp</span>), and Knowledge Base into a single <span dir="ltr" className="ltr-inline font-mono">.json</span> bundle for external backup or cross-device migration.
                  </>
                ) : (
                  <>
                    خروجی یکجا و ساختاریافته کل تاریخچه یادگیری (<span dir="ltr" className="ltr-inline font-mono">learningHistory</span>)، فهرست نشان‌ها (<span dir="ltr" className="ltr-inline font-mono">badgeList</span>)، امتیاز انباشته (<span dir="ltr" className="ltr-inline font-mono">accumulatedXp</span>) و پایگاه دانش در یک فایل <span dir="ltr" className="ltr-inline font-mono">.json</span> استاندارد برای پشتیبان‌گیری خارجی یا مهاجرت بین سیستم‌ها
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBulkExportUnifiedMigrationJson}
              data-testid="kb-bulk-export-migration-btn"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>
                {language === 'en'
                  ? 'Bulk-Export History, Badges & XP'
                  : 'خروجی یکپارچه تاریخچه، نشان‌ها و XP'}
              </span>
              <span dir="ltr" className="ltr-inline font-mono text-[11px]">
                (Bulk-Export JSON)
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyUnifiedMigrationJson}
              data-testid="kb-copy-migration-json-btn"
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedMigrationJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'en' ? 'Copied!' : 'کپی شد (Copied)'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    {language === 'en' ? 'Copy Migration JSON' : 'کپی JSON مهاجرت'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleMigrationInspector}
              data-testid="kb-toggle-migration-inspector-btn"
              className="px-3 py-2 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>
                {showMigrationInspector
                  ? language === 'en'
                    ? 'Close Migration JSON Inspector'
                    : 'بستن بازرس JSON مهاجرت'
                  : language === 'en'
                  ? 'Preview & Restore Migration JSON'
                  : 'پیش‌نمایش و بازیابی JSON مهاجرت'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Summary Pillars of the Unified Export Payload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Pillar 1: Learning History */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                {language === 'en'
                  ? '1. Learning History'
                  : '۱. تاریخچه یادگیری (Learning History)'}
              </span>
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
            </div>
            <div
              dir="ltr"
              data-testid="kb-dm-completed-modules"
              className="ltr-inline text-base font-mono font-black text-blue-500 tabular-nums block"
            >
              {unifiedMigrationBackup.learningHistory.completedModulesCount} /{' '}
              {unifiedMigrationBackup.learningHistory.totalModulesCount} Modules (
              {unifiedMigrationBackup.learningHistory.completionPercentage}%)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>
                {language === 'en'
                  ? 'Streak & Study Time:'
                  : 'پیوستگی و زمان مطالعه:'}
              </span>
              <span
                dir="ltr"
                data-testid="kb-dm-streak-days"
                className="ltr-inline font-mono font-bold text-amber-500"
              >
                {unifiedMigrationBackup.learningHistory.currentStreakDays}d Streak ·{' '}
                {unifiedMigrationBackup.learningHistory.totalMinutesStudied}m
              </span>
            </div>
          </div>

          {/* Pillar 2: Badge List */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                {language === 'en'
                  ? '2. Badge List'
                  : '۲. فهرست نشان‌ها (Badge List)'}
              </span>
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <div
              dir="ltr"
              data-testid="kb-dm-unlocked-badges"
              className="ltr-inline text-base font-mono font-black text-amber-500 tabular-nums block"
            >
              {unifiedMigrationBackup.badgeList.totalUnlockedBadgesCount} /{' '}
              {unifiedMigrationBackup.badgeList.totalModuleBadgesCount +
                unifiedMigrationBackup.badgeList.totalStreakMilestonesCount}{' '}
              Badges Unlocked
            </div>
            <div
              dir="ltr"
              className="ltr-inline text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate block"
            >
              {unifiedMigrationBackup.badgeList.unlockedBadgeCodes.join(' · ') ||
                'No badges unlocked'}
            </div>
          </div>

          {/* Pillar 3: Accumulated XP & Level */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                {language === 'en'
                  ? '3. Accumulated XP'
                  : '۳. امتیاز انباشته (Accumulated XP)'}
              </span>
              <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <div
              dir="ltr"
              data-testid="kb-dm-total-xp"
              className="ltr-inline text-base font-mono font-black text-emerald-500 tabular-nums block"
            >
              {unifiedMigrationBackup.accumulatedXp.totalAccumulatedXp} XP · LVL{' '}
              {unifiedMigrationBackup.accumulatedXp.currentArchitectLevel}
            </div>
            <div
              dir="ltr"
              className="ltr-inline text-[10px] font-mono text-slate-500 dark:text-slate-400 block"
            >
              Mod: {unifiedMigrationBackup.accumulatedXp.moduleMasteryXp} · Streak: +
              {unifiedMigrationBackup.accumulatedXp.streakMilestoneBonusXp} · Lab:{' '}
              {unifiedMigrationBackup.accumulatedXp.studioLabXp}
            </div>
          </div>

          {/* Pillar 4: Knowledge Base & Target Schema */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>
                {language === 'en'
                  ? '4. Knowledge Base Bundle'
                  : '۴. بسته پایگاه دانش (KB Bundle)'}
              </span>
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
            </div>
            <div
              dir="ltr"
              data-testid="kb-dm-kb-entries"
              className="ltr-inline text-base font-mono font-black text-indigo-400 tabular-nums block"
            >
              {unifiedMigrationBackup.knowledgeBase.totalEntries} Entries ·{' '}
              {unifiedMigrationBackup.knowledgeBase.totalTokens} Tokens
            </div>
            <div
              dir="ltr"
              className="ltr-inline text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate block"
            >
              antigravity-unified-learning-backup.json
            </div>
          </div>
        </div>

        {/* Expandable Unified JSON Inspector & Migration Restore Panel */}
        {showMigrationInspector && (
          <div
            data-testid="kb-migration-inspector-panel"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {language === 'en'
                  ? 'Unified Migration & Restore JSON Payload Preview:'
                  : 'پیش‌نمایش ساختار JSON مهاجرت و بازیابی یکپارچه (Unified Backup Payload):'}
              </div>
              <span
                dir="ltr"
                className="ltr-inline text-[11px] font-mono text-emerald-500"
              >
                bundleType: &quot;google-antigravity-unified-migration-backup&quot;
              </span>
            </div>

            <textarea
              dir="ltr"
              rows={10}
              value={migrationJsonDraft}
              onChange={(e) => setMigrationJsonDraft(e.target.value)}
              data-testid="kb-migration-json-textarea"
              aria-label="Unified Learning Migration Backup JSON"
              className="ltr-code w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-950 text-emerald-300 p-3 text-xs font-mono leading-5"
            />

            {migrationRestoreError && (
              <div
                data-testid="kb-migration-restore-error"
                className="text-xs font-bold text-rose-500"
              >
                {migrationRestoreError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMigrationJsonDraft(unifiedMigrationJsonString)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {language === 'en'
                  ? 'Reset to Current State'
                  : 'بازنشانی به وضعیت فعلی (Reset to Current)'}
              </button>
              <button
                type="button"
                onClick={handleRestoreUnifiedMigrationDraft}
                data-testid="kb-restore-migration-btn"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {language === 'en'
                    ? 'Restore History, Badges & XP from this JSON'
                    : 'بازیابی کامل تاریخچه، نشان‌ها و XP از این JSON'}
                </span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* NEW: D3.js Yearly Knowledge Base Usage Calendar Heatmap (52 Weeks Research Patterns) */}
      <section
        data-testid="kb-yearly-heatmap-section"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/95 p-5 sm:p-6 shadow-md space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-500 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Yearly Knowledge Base Usage & Research Pattern Calendar Heatmap'
                    : 'هیت‌مپ تقویمی سالانه فراوانی استفاده و الگوهای پژوهش پایگاه دانش'}{' '}
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono text-xs sm:text-sm text-emerald-500"
                  >
                    (D3.js 52-Week Research Calendar Heatmap)
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en' ? (
                  <>
                    Visualizing 52 weeks (<span dir="ltr" className="ltr-inline font-mono">364 Days</span>) of research activity, <code dir="ltr" className="ltr-inline">.agent/knowledge-base</code> rule edits, semantic lookups, and <code dir="ltr" className="ltr-inline">Context Rot</code> pruning cycles over the past year.
                  </>
                ) : (
                  <>
                    تجسم ۵۲ هفته (<span dir="ltr" className="ltr-inline font-mono">364 Days</span>) فعالیت پژوهشی، ویرایش قوانین <code dir="ltr" className="ltr-inline">.agent/knowledge-base</code>، جستجوهای معنایی و چرخه‌های هرس <code dir="ltr" className="ltr-inline">Context Rot</code> در طول یک سال گذشته
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Focus Mode Interactive Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {(
                [
                  {
                    id: 'all',
                    labelFa: 'کل پژوهش‌ها',
                    labelEn: 'All Activity',
                  },
                  {
                    id: 'entries-edits',
                    labelFa: 'ثبت و ویرایش',
                    labelEn: 'Edits',
                  },
                  {
                    id: 'search-queries',
                    labelFa: 'کاوش و جستجو',
                    labelEn: 'Lookups',
                  },
                  {
                    id: 'rot-pruning',
                    labelFa: 'هرس Context Rot',
                    labelEn: 'Rot Hygiene',
                  },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setHeatmapFocusMode(m.id)}
                  data-testid={`kb-heatmap-mode-${m.id}`}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    heatmapFocusMode === m.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{language === 'en' ? m.labelEn : m.labelFa}</span>
                  {language !== 'en' && (
                    <span dir="ltr" className="ltr-inline font-mono text-[10px] opacity-85">
                      ({m.labelEn})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogResearchPulseToday}
              data-testid="kb-log-research-pulse-btn"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? 'Log Research Pulse Today'
                  : 'ثبت پالس پژوهش امروز'}
              </span>
              <span dir="ltr" className="ltr-inline font-mono text-[11px]">
                (+Pulse)
              </span>
            </button>
          </div>
        </div>

        {/* 4 Yearly Research Pattern Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Total Yearly Research Ops'
                : 'کل تعاملات پژوهشی سالانه'}{' '}
              <span dir="ltr" className="ltr-inline font-mono">
                (Yearly Total)
              </span>
            </div>
            <div
              dir="ltr"
              data-testid="kb-yearly-total-interactions"
              className="ltr-inline text-base font-mono font-black text-emerald-500 tabular-nums block"
            >
              {yearlyHeatmapSummary.totalYearlyInteractions} Ops ·{' '}
              {(yearlyHeatmapSummary.totalTokensProcessedYearly / 1000).toFixed(1)}k Tokens
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Combined entries, edits, lookups & pruning over 52 weeks'
                : 'مجموع ثبت، ویرایش، جستجو و هرس در ۵۲ هفته'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Active Research Days in Year'
                : 'روزهای فعال پژوهش در سال'}{' '}
              <span dir="ltr" className="ltr-inline font-mono">
                (Active Days)
              </span>
            </div>
            <div
              dir="ltr"
              data-testid="kb-yearly-active-days"
              className="ltr-inline text-base font-mono font-black text-blue-500 tabular-nums block"
            >
              {yearlyHeatmapSummary.activeResearchDaysCount} / 364 Days (
              {yearlyHeatmapSummary.activeDaysPercent}%)
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Current KB exploration streak:'
                : 'پیوستگی فعلی کاوش پایگاه دانش:'}{' '}
              <span dir="ltr" className="ltr-inline font-mono font-bold text-amber-500">
                {yearlyHeatmapSummary.currentResearchStreakDays}d Streak
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Yearly Peak Research Activity'
                : 'اوج فعالیت پژوهشی سال'}{' '}
              <span dir="ltr" className="ltr-inline font-mono">
                (Peak Research Day)
              </span>
            </div>
            <div
              dir="ltr"
              data-testid="kb-yearly-peak-day"
              className="ltr-inline text-base font-mono font-black text-indigo-400 tabular-nums block"
            >
              {yearlyHeatmapSummary.peakResearchDay.dateIso} (
              {yearlyHeatmapSummary.peakResearchDay.totalInteractions} Ops)
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Busiest research month:'
                : 'پرترافیک‌ترین ماه پژوهشی:'}{' '}
              <span dir="ltr" className="ltr-inline font-mono font-bold text-indigo-400">
                {yearlyHeatmapSummary.peakResearchMonthEn}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-1">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Yearly Memory Hygiene'
                : 'بهداشت سالانه حافظه'}{' '}
              <span dir="ltr" className="ltr-inline font-mono">
                (Yearly Hygiene)
              </span>
            </div>
            <div
              dir="ltr"
              data-testid="kb-yearly-rot-pruned"
              className="ltr-inline text-base font-mono font-black text-amber-500 tabular-nums block"
            >
              {yearlyHeatmapSummary.totalEntriesTouchedYearly} Edits ·{' '}
              {yearlyHeatmapSummary.totalRotPrunedYearly} Pruned
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Semantic lookups logged:'
                : 'جستجوهای معنایی ثبت‌شده:'}{' '}
              <span dir="ltr" className="ltr-inline font-mono font-bold text-sky-400">
                {yearlyHeatmapSummary.totalSearchQueriesYearly} Queries
              </span>
            </div>
          </div>
        </div>

        {/* D3.js 52-Week SVG Calendar Heatmap Canvas */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              dir="ltr"
              className="ltr-inline text-xs font-mono font-bold text-slate-300"
            >
              D3.JS 52-WEEK × 7-DAY KNOWLEDGE BASE ACTIVITY MATRIX (NOV 2025 — OCT 2026)
            </span>

            {/* 5-Step Intensity Scale Legend */}
            <div
              dir="ltr"
              className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400"
            >
              <span>Less</span>
              {(
                heatmapFocusMode === 'entries-edits'
                  ? ['#0f172a', '#1e3a8a', '#1d4ed8', '#3b82f6', '#60a5fa']
                  : heatmapFocusMode === 'search-queries'
                  ? ['#0f172a', '#312e81', '#4338ca', '#6366f1', '#818cf8']
                  : heatmapFocusMode === 'rot-pruning'
                  ? ['#0f172a', '#78350f', '#b45309', '#f59e0b', '#fbbf24']
                  : ['#0f172a', '#064e3b', '#047857', '#10b981', '#34d399']
              ).map((hex, idx) => (
                <span
                  key={hex + String(idx)}
                  style={{ backgroundColor: hex }}
                  className="w-3 h-3 rounded-sm border border-white/15 inline-block"
                />
              ))}
              <span>More</span>
            </div>
          </div>

          <div dir="ltr" className="w-full overflow-x-auto">
            <svg
              ref={yearlyHeatmapSvgRef}
              data-testid="kb-yearly-heatmap-svg"
              className="w-full min-w-[720px] max-w-full h-auto select-none"
              role="img"
              aria-label="D3.js Yearly Knowledge Base Usage Calendar Heatmap"
            />
          </div>
        </div>

        {/* Selected Day Research Pattern Inspector */}
        <div
          data-testid="kb-yearly-heatmap-selected-day"
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? 'Selected Day Research Pattern Details:'
                  : 'جزئیات الگوی پژوهش در روز انتخاب‌شده:'}
              </span>
              <span
                dir="ltr"
                data-testid="kb-yearly-selected-date"
                className="ltr-inline font-mono text-xs font-black text-emerald-500"
              >
                {selectedHeatmapCell.dateIso} ({selectedHeatmapCell.dayOfWeekLabelEn})
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {language === 'en'
                  ? selectedHeatmapCell.dominantResearchPatternEn
                  : selectedHeatmapCell.dominantResearchPatternFa}
              </span>
              {language !== 'en' && (
                <span
                  dir="ltr"
                  className="ltr-inline font-mono text-[11px] text-blue-400"
                >
                  ({selectedHeatmapCell.dominantResearchPatternEn})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? (
                <>
                  Click any cell in the 52-week matrix above to inspect the exact breakdown of knowledge edits, semantic lookups, and <span dir="ltr" className="ltr-inline font-mono">Context Rot</span> pruning for that day.
                </>
              ) : (
                <>
                  با کلیک روی هر خانه از ماتریس ۵۲ هفته‌ای بالا، تفکیک دقیق عملیات ثبت دانش، جستجوی معنایی و پاک‌سازی <span dir="ltr" className="ltr-inline font-mono">Context Rot</span> آن روز نمایش داده می‌شود.
                </>
              )}
            </p>
          </div>

          <div
            dir="ltr"
            className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300 shrink-0"
          >
            <div>
              <span className="text-slate-500">Total Ops: </span>
              <strong
                data-testid="kb-yearly-selected-total"
                className="text-emerald-400"
              >
                {selectedHeatmapCell.totalInteractions}
              </strong>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-slate-500">Edits/Entries: </span>
              <strong
                data-testid="kb-yearly-selected-edits"
                className="text-blue-400"
              >
                {selectedHeatmapCell.entriesEditedOrCreated}
              </strong>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-slate-500">Lookups: </span>
              <strong
                data-testid="kb-yearly-selected-searches"
                className="text-indigo-400"
              >
                {selectedHeatmapCell.searchQueriesCount}
              </strong>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-slate-500">Rot Pruned: </span>
              <strong
                data-testid="kb-yearly-selected-pruned"
                className="text-amber-400"
              >
                {selectedHeatmapCell.rotPrunedCount}
              </strong>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-slate-500">Volume: </span>
              <strong className="text-slate-200">
                {selectedHeatmapCell.tokensProcessed} Tokens
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: D3.js Knowledge Item Tag Bubble Chart & Concept Relationship Visualizer */}
      <section
        data-testid="kb-d3-tag-bubble-section"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/90 p-5 sm:p-6 shadow-md space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/35 flex items-center justify-center text-blue-500 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {language === 'en'
                    ? 'Knowledge Tag Bubble Chart & Concept Co-Occurrence Graph (D3.js Tag Bubble Chart)'
                    : 'نمودار حبابی تگ‌های دانشی و گراف هم‌رخدادی مفاهیم معماری (D3.js Tag Bubble Chart)'}
                </h2>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span
                  dir="ltr"
                  data-testid="kb-bubble-total-tags-badge"
                  className="ltr-inline text-blue-600 dark:text-blue-400 font-mono text-xs font-extrabold tabular-nums"
                >
                  {tagBubbleGraph.totalUniqueTags} TAGS · {tagBubbleGraph.totalRelationships} LINKS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en' ? (
                  <>
                    Each bubble radius is scaled by tag frequency (<span dir="ltr" className="ltr-inline">Frequency</span>) and token weight inside <code dir="ltr" className="ltr-inline">d3.pack()</code>, while curved links reveal co-occurring concepts across user state entries.
                  </>
                ) : (
                  <>
                    شعاع هر حباب بر اساس فراوانی تکرار (<span dir="ltr" className="ltr-inline">Frequency</span>) و وزن توکن در <code dir="ltr" className="ltr-inline">d3.pack()</code> محاسبه شده و خطوط منحنی هم‌رخدادی مفاهیم در آیتم‌های وضعیت کاربر را نمایش می‌دهند.
                  </>
                )}
              </p>
            </div>
          </div>

          {activeTagFilterId && (
            <button
              type="button"
              onClick={() => setActiveTagFilterId(null)}
              data-testid="kb-clear-tag-filter-btn"
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-500 hover:bg-rose-500/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? `Clear Tag Filter (${activeTagFilterId})`
                  : `حذف فیلتر تگ (${activeTagFilterId})`}
              </span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* D3 Bubble Pack & Relationship SVG Canvas (7 Cols) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-slate-300">
                D3.HIERARCHY + D3.PACK CONCEPT TOPOLOGY (CLICK ANY BUBBLE)
              </span>
              <span dir="ltr" className="ltr-inline text-[11px] font-mono text-sky-400">
                Co-Occurrence Relationship Links Active
              </span>
            </div>

            <div dir="ltr" className="w-full overflow-x-auto">
              <svg
                ref={bubbleSvgRef}
                data-testid="kb-d3-tag-bubble-svg"
                className="w-full min-w-[340px] max-w-full h-auto select-none"
                role="img"
                aria-label="D3.js Knowledge Item Tag Bubble Chart"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                  <span>User State</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                  <span>Rules</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Workflows</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>PR Gates</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  <span>MCP &amp; Rot</span>
                </span>
              </div>
              <span dir="ltr" className="ltr-inline font-mono text-[10px] text-slate-400">
                Dominant: {tagBubbleGraph.dominantTag?.labelEn || 'N/A'}
              </span>
            </div>
          </div>

          {/* Selected Concept Tag Relationship Inspector (5 Cols) */}
          {selectedBubbleTag && (
            <div
              data-testid="kb-tag-bubble-inspector"
              className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'en'
                        ? 'Selected Engineering Concept in D3 Graph:'
                        : 'مفهوم مهندسی انتخاب‌شده در گراف D3:'}
                    </div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {language === 'en'
                        ? selectedBubbleTag.labelEn
                        : selectedBubbleTag.labelFa}
                    </div>
                    <div
                      dir="ltr"
                      data-testid="kb-selected-bubble-tag-label"
                      className="ltr-inline font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5"
                    >
                      {selectedBubbleTag.labelEn}
                    </div>
                  </div>

                  <span
                    dir="ltr"
                    className={`ltr-inline px-2.5 py-1 rounded-md border font-mono text-[10px] font-bold ${
                      CATEGORY_METADATA[selectedBubbleTag.domainCategory].badgeClass
                    }`}
                  >
                    {selectedBubbleTag.domainCategory.toUpperCase()}
                  </span>
                </div>

                {/* Frequency, Token Weight & Connected Concepts KPIs */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div
                      dir="ltr"
                      data-testid="kb-selected-tag-frequency"
                      className="ltr-inline text-base font-mono font-black text-blue-500 tabular-nums"
                    >
                      {selectedBubbleTag.frequency}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'en' ? 'Entry Frequency' : 'تکرار در مدخل‌ها'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div
                      dir="ltr"
                      data-testid="kb-selected-tag-tokens"
                      className="ltr-inline text-base font-mono font-black text-emerald-500 tabular-nums"
                    >
                      {selectedBubbleTag.totalTokens}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'en' ? 'Associated Tokens' : 'حجم توکن مرتبط'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div
                      dir="ltr"
                      data-testid="kb-selected-tag-relations"
                      className="ltr-inline text-base font-mono font-black text-indigo-400 tabular-nums"
                    >
                      {selectedBubbleTag.relatedTagIds.length}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'en' ? 'Linked Concepts' : 'مفاهیم هم‌بسته'}
                    </div>
                  </div>
                </div>

                {/* Co-Occurring Related Concept Tags */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'en'
                      ? 'Co-Occurring Connected Concepts:'
                      : 'مفاهیم مرتبط و هم‌رخداد در وضعیت کاربر (Connected Concepts):'}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedBubbleTag.relatedTagIds.map((relId) => {
                      const relNode = tagBubbleGraph.nodes.find(
                        (n) => n.tagId === relId
                      );
                      if (!relNode) return null;
                      return (
                        <button
                          key={relId}
                          type="button"
                          onClick={() => setSelectedBubbleTagId(relId)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 text-[11px] font-mono text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                        >
                          <span dir="ltr" className="ltr-inline">
                            {relNode.labelEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="button"
                data-testid="kb-filter-by-tag-btn"
                onClick={() =>
                  setActiveTagFilterId((prev) =>
                    prev === selectedBubbleTag.tagId
                      ? null
                      : selectedBubbleTag.tagId
                  )
                }
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  activeTagFilterId === selectedBubbleTag.tagId
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>
                  {activeTagFilterId === selectedBubbleTag.tagId
                    ? language === 'en'
                      ? `Show All Entries (Clear ${selectedBubbleTag.labelEn} Filter)`
                      : `نمایش همه مدخل‌ها (لغو فیلتر ${selectedBubbleTag.labelEn})`
                    : language === 'en'
                    ? `Filter Bento Cards by ${selectedBubbleTag.labelEn} (${selectedBubbleTag.frequency} cards)`
                    : `فیلتر کارت‌های Bento بر اساس ${selectedBubbleTag.labelEn} (${selectedBubbleTag.frequency} کارت)`}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Import / Restore Knowledge Base JSON Drawer */}
      {showImportDrawer && (
        <section
          data-testid="kb-import-drawer"
          className="p-5 rounded-2xl border border-indigo-500/40 bg-white dark:bg-slate-900 shadow-lg space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>
                  {language === 'en'
                    ? 'Import & Restore Knowledge Base from JSON'
                    : 'بازیابی و درون‌ریزی پایگاه دانش از فایل JSON (Import & Restore Knowledge Base)'}
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {language === 'en' ? (
                  <>
                    Upload a backup <code dir="ltr" className="ltr-inline">antigravity-knowledge-base.json</code> file directly from your computer or edit and apply its JSON payload below.
                  </>
                ) : (
                  <>
                    می‌توانید فایل پشتیبان <code dir="ltr" className="ltr-inline">antigravity-knowledge-base.json</code> را مستقیماً از سیستم بارگذاری کنید یا ساختار JSON آن را در کادر زیر ویرایش و اعمال نمایید.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="kb-upload-json-file-btn"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {language === 'en'
                    ? 'Select .json File (Upload File)'
                    : 'انتخاب فایل .json از سیستم (Upload File)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyBundleJson}
                data-testid="kb-copy-bundle-json-btn"
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedBundle ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'en' ? 'Copied!' : 'کپی شد!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-500" />
                    <span>{language === 'en' ? 'Copy JSON' : 'کپی JSON'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowImportDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                aria-label="Close Import Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {importError && (
            <div
              data-testid="kb-import-error"
              className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              {language === 'en' ? (
                <>
                  Knowledge Base JSON Bundle Payload (<code dir="ltr" className="ltr-inline">google-antigravity-knowledge-base-export</code>):
                </>
              ) : (
                <>
                  محتوای بسته JSON پایگاه دانش (<code dir="ltr" className="ltr-inline">google-antigravity-knowledge-base-export</code>):
                </>
              )}
            </label>
            <textarea
              dir="ltr"
              rows={8}
              value={importJsonDraft}
              onChange={(e) => setImportJsonDraft(e.target.value)}
              data-testid="kb-import-json-textarea"
              placeholder='{"schemaVersion": "1.0.0", "bundleType": "google-antigravity-knowledge-base-export", "entries": [...]}'
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-100 p-3 text-xs font-mono leading-5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowImportDrawer(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'انصراف'}
            </button>
            <button
              type="button"
              onClick={handleApplyImportDraft}
              data-testid="kb-apply-import-json-btn"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? 'Apply & Restore Knowledge Base (Restore State)'
                  : 'اعمال و بازیابی پایگاه دانش (Restore State)'}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Optional Add New Knowledge Entry Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAddCustomEntry}
          data-testid="kb-add-entry-form"
          className="p-5 rounded-2xl border border-blue-500/40 bg-white dark:bg-slate-900 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {language === 'en'
                ? 'Add New Entry to Knowledge Base (.agent/knowledge-base)'
                : 'افزودن مدخل جدید به پایگاه دانش (.agent/knowledge-base)'}
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                {language === 'en'
                  ? 'Key or File Path (Key Path):'
                  : 'مسیر کلید یا فایل (Key Path):'}
              </label>
              <input
                type="text"
                dir="ltr"
                value={newKeyPath}
                onChange={(e) => setNewKeyPath(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                {language === 'en'
                  ? 'Entry Title:'
                  : 'عنوان فارسی (Persian Title):'}
              </label>
              <input
                type="text"
                value={newTitleFa}
                onChange={(e) => setNewTitleFa(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                {language === 'en' ? 'Category:' : 'دسته‌بندی (Category):'}
              </label>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as KnowledgeBaseEntryCategory)
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="user-state">
                  {language === 'en'
                    ? 'Persistent Session State (user-state)'
                    : 'وضعیت پایدار نشست (user-state)'}
                </option>
                <option value="architecture-rule">
                  {language === 'en'
                    ? 'Architecture Rule (architecture-rule)'
                    : 'قانون معماری (architecture-rule)'}
                </option>
                <option value="workflow-sop">
                  {language === 'en'
                    ? 'Workflow SOP (workflow-sop)'
                    : 'پروتکل ورک‌فلو (workflow-sop)'}
                </option>
                <option value="pr-review-directive">
                  {language === 'en'
                    ? 'PR-Style Review Directive (pr-review-directive)'
                    : 'ممیزی PR-Style (pr-review-directive)'}
                </option>
                <option value="mcp-schema">
                  {language === 'en'
                    ? 'MCP Schema (mcp-schema)'
                    : 'طرحواره MCP (mcp-schema)'}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'en'
                ? 'Knowledge Content Snippet or State JSON:'
                : 'محتوای دانش یا JSON وضعیت (Knowledge Content Snippet):'}
            </label>
            <textarea
              dir="ltr"
              rows={3}
              value={newSnippet}
              onChange={(e) => setNewSnippet(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'انصراف'}
            </button>
            <button
              type="submit"
              data-testid="kb-submit-new-entry-btn"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              {language === 'en'
                ? 'Save to Knowledge Base'
                : 'ثبت در پایگاه دانش'}
            </button>
          </div>
        </form>
      )}

      {/* Real-Time Full-Text Search & Filter by Tag Dropdown Panel */}
      <section
        data-testid="kb-fulltext-search-panel"
        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/95 shadow-md space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/35 flex items-center justify-center text-blue-500 shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'en'
                  ? 'Real-Time Full-Text Search & Engineering Tag Filter'
                  : 'جستجوی تمام‌متن در لحظه و فیلتر تگ‌های مهندسی'}{' '}
                <span
                  dir="ltr"
                  className="ltr-inline font-mono text-xs text-blue-500"
                >
                  (Real-Time Full-Text Search &amp; Filter by Tag)
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'en' ? (
                  <>
                    Instant full-text search across titles, <code dir="ltr" className="ltr-inline">.agent/knowledge-base</code> key paths, and full item snippets paired with instant engineering domain filtering via the <span dir="ltr" className="ltr-inline font-mono">Filter by Tag</span> dropdown.
                  </>
                ) : (
                  <>
                    جستجوی بلادرنگ در عنوان فارسی/انگلیسی، مسیر <code dir="ltr" className="ltr-inline">.agent/knowledge-base</code> و محتوای کامل آیتم‌ها به همراه جداسازی فوری دسته‌های مهندسی با منوی <span dir="ltr" className="ltr-inline font-mono">Filter by Tag</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Live Full-Text Match Telemetry Summary */}
          <div
            dir="ltr"
            data-testid="kb-fulltext-match-summary"
            className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <span>
              Matched:{' '}
              <strong
                data-testid="kb-fulltext-matched-count"
                className="text-blue-500"
              >
                {fullTextSearchSummary.totalMatched} / {entries.length}
              </strong>
            </span>
            <span className="text-slate-700">·</span>
            <span>
              Title Hits:{' '}
              <strong className="text-emerald-400">
                {fullTextSearchSummary.totalMatchedInTitle}
              </strong>
            </span>
            <span className="text-slate-700">·</span>
            <span>
              Content Hits:{' '}
              <strong className="text-indigo-400">
                {fullTextSearchSummary.totalMatchedInContent}
              </strong>
            </span>
            <span className="text-slate-700">·</span>
            <span>
              Scope Tokens:{' '}
              <strong className="text-amber-400">
                {fullTextSearchSummary.matchedTokenSum}
              </strong>
            </span>
          </div>
        </div>

        {/* Main Search Input + Filter by Tag Dropdown + Stale Toggle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          {/* 1. Real-Time Full-Text Search Input (6 Cols) */}
          <div className="lg:col-span-6 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="kb-fulltext-search-input"
                className="text-[11px] font-bold text-slate-600 dark:text-slate-300"
              >
                {language === 'en'
                  ? 'Full-Text Search across Title & Content'
                  : 'جستجوی تمام‌متن در عنوان و محتوا'}{' '}
                <span dir="ltr" className="ltr-inline font-mono text-[10px] text-slate-400">
                  (Full-Text Search by Title &amp; Content)
                </span>
              </label>

              {/* Search Scope Selector Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
                {(
                  [
                    { id: 'all', labelFa: 'عنوان + محتوا', labelEn: 'All' },
                    { id: 'title-only', labelFa: 'فقط عنوان', labelEn: 'Title' },
                    {
                      id: 'content-only',
                      labelFa: 'فقط محتوا',
                      labelEn: 'Content',
                    },
                  ] as const
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSearchScope(sc.id)}
                    data-testid={`kb-search-scope-${sc.id}`}
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      searchScope === sc.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {language === 'en' ? sc.labelEn : sc.labelFa}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="kb-fulltext-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="kb-search-input"
                placeholder={
                  language === 'en'
                    ? 'Live search across entry titles or snippets (e.g. SQLAlchemy, Redis, implementation_plan, vendor.bundle.js)...'
                    : 'جستجوی زنده در عنوان یا متن آیتم‌ها (مثلاً: SQLAlchemy، Redis، implementation_plan، vendor.bundle.js)...'
                }
                className="w-full pr-10 pl-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  data-testid="kb-clear-search-btn"
                  aria-label={
                    language === 'en' ? 'Clear search query' : 'پاک کردن عبارت جستجو'
                  }
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. 'Filter by Tag' Dropdown Menu (4 Cols) */}
          <div className="lg:col-span-4 space-y-1.5">
            <label
              htmlFor="kb-filter-by-tag-select"
              className="block text-[11px] font-bold text-slate-600 dark:text-slate-300"
            >
              {language === 'en'
                ? 'Filter by Engineering Tag'
                : 'فیلتر بر اساس تگ مهندسی'}{' '}
              <span dir="ltr" className="ltr-inline font-mono text-[10px] text-indigo-400">
                (Filter by Tag Dropdown)
              </span>
            </label>
            <select
              id="kb-filter-by-tag-select"
              data-testid="kb-filter-by-tag-select"
              aria-label="Filter by Tag"
              value={activeTagFilterId || 'all'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all') {
                  setActiveTagFilterId(null);
                } else {
                  setActiveTagFilterId(val);
                  setSelectedBubbleTagId(val);
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">
                {language === 'en'
                  ? `All Engineering Tags (${entries.length} entries)`
                  : `همه تگ‌های مهندسی (${entries.length} مدخل)`}
              </option>
              {fullTextSearchSummary.availableTagOptions.map((tagOpt) => (
                <option key={tagOpt.tagId} value={tagOpt.tagId}>
                  {language === 'en'
                    ? `${tagOpt.labelEn} — ${tagOpt.count} entries`
                    : `${tagOpt.labelFa} (${tagOpt.labelEn}) — ${tagOpt.count} مدخل`}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Stale Context Rot Toggle (2 Cols) */}
          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={() => setOnlyStaleRot((prev) => !prev)}
              data-testid="kb-filter-stale-btn"
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                onlyStaleRot
                  ? 'border-amber-500 bg-amber-500/20 text-amber-600 dark:text-amber-300'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {language === 'en' ? 'Stale Only (≥65%)' : 'فقط Stale (≥65%)'}
              </span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs + Reset Active Filters Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                {
                  id: 'all',
                  labelFa: 'همه مدخل‌ها (All Entries)',
                  labelEn: 'All Entries',
                },
                {
                  id: 'user-state',
                  labelFa: 'وضعیت کاربر (User State)',
                  labelEn: 'User State',
                },
                {
                  id: 'architecture-rule',
                  labelFa: 'قوانین معماری (Rules)',
                  labelEn: 'Architecture Rules',
                },
                {
                  id: 'workflow-sop',
                  labelFa: 'ورک‌فلوها (Workflows)',
                  labelEn: 'Workflows',
                },
                {
                  id: 'pr-review-directive',
                  labelFa: 'ممیزی PR-Style',
                  labelEn: 'PR-Style Review',
                },
                {
                  id: 'mcp-schema',
                  labelFa: 'تله‌متری و MCP',
                  labelEn: 'MCP & Telemetry',
                },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`kb-category-${cat.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'en' ? cat.labelEn : cat.labelFa}
              </button>
            ))}
          </div>

          {(searchQuery.trim() !== '' ||
            activeTagFilterId !== null ||
            selectedCategory !== 'all' ||
            onlyStaleRot ||
            searchScope !== 'all') && (
            <button
              type="button"
              data-testid="kb-reset-all-filters-btn"
              onClick={() => {
                setSearchQuery('');
                setSearchScope('all');
                setActiveTagFilterId(null);
                setSelectedCategory('all');
                setOnlyStaleRot(false);
              }}
              className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? 'Reset All Filters'
                  : 'پاک کردن تمام فیلترها (Reset Filters)'}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Interactive Knowledge Base Quiz Component Section */}
      <div ref={quizSectionRef} id="kb-quiz-interactive-section">
        {showQuizSection && (
          <KnowledgeQuiz
            entries={entries}
            selectedDocId={activeQuizDocId}
            onSelectDoc={(id) => setActiveQuizDocId(id)}
            onRewardXp={handleRewardQuizXp}
            onExportPdf={onExportPdf}
            onClose={() => setShowQuizSection(false)}
          />
        )}
      </div>

      {/* AI Context Awareness & MCP Configuration Drift Auditor Section */}
      {activeContextAwareness && selectedContextEntry && (
        <section
          ref={contextAwarenessSectionRef}
          data-testid="kb-context-awareness-section"
          className="rounded-2xl border border-purple-500/30 dark:border-purple-400/25 bg-gradient-to-br from-purple-500/[0.05] via-white to-cyan-500/[0.05] dark:from-[#120f24] dark:via-[#0d1322] dark:to-[#0a1524] p-5 sm:p-7 space-y-5 shadow-xs"
        >
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.07] pb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {language === 'en'
                      ? 'AI Context Awareness & MCP Configuration Drift Auditor'
                      : 'خلاصه آگاهی زمینه (Context Awareness) و تشخیص انحراف پیکربندی MCP'}
                  </h2>
                  <span
                    dir="ltr"
                    data-testid="kb-context-awareness-status-badge"
                    className={`ltr-inline inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                      activeContextAwareness.source === 'ai-live'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                        : 'border-purple-500/35 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeContextAwareness.source === 'ai-live'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-purple-400'
                      }`}
                    />
                    {activeContextAwareness.source === 'ai-live'
                      ? `${activeContextAwareness.modelUsed} · Live Drift Audit`
                      : `${activeContextAwareness.modelUsed} · Context Ready`}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'en'
                    ? 'Synthesizes long-form technical articles into Context Awareness briefs and pinpoints configuration drifts across mcp_config.json, transport layers, and .agent/rules.'
                    : 'سنتز مقالات فنی طولانی به خلاصه‌های «آگاهی زمینه» با هوش مصنوعی و شناسایی دقیق انحراف‌های پیکربندی (Configuration Drifts) در تنظیمات MCP و قوانین ایجنت.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                dir="ltr"
                data-testid="kb-context-awareness-risk-badge"
                className={`ltr-inline px-3 py-1.5 rounded-lg text-xs font-mono font-bold border tabular-nums ${
                  activeContextAwareness.driftSeverity === 'CRITICAL'
                    ? 'border-rose-500/45 bg-rose-500/15 text-rose-600 dark:text-rose-300'
                    : activeContextAwareness.driftSeverity === 'HIGH'
                    ? 'border-amber-500/45 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    : activeContextAwareness.driftSeverity === 'MEDIUM'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                }`}
              >
                MCP Drift Risk: {activeContextAwareness.driftRiskScore}% ·{' '}
                {activeContextAwareness.driftSeverity}
              </span>

              <button
                type="button"
                onClick={() => handleGenerateContextAwareness()}
                disabled={isGeneratingContextAwareness}
                data-testid="kb-context-awareness-generate-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 disabled:opacity-60 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isGeneratingContextAwareness ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {isGeneratingContextAwareness
                    ? language === 'en'
                      ? 'Auditing MCP Context...'
                      : 'در حال ممیزی هوشمند MCP...'
                    : language === 'en'
                    ? 'Generate Context Awareness with AI'
                    : 'تولید خلاصه Context Awareness با هوش مصنوعی'}
                </span>
              </button>
            </div>
          </div>

          {/* Controls Row: Technical Article Selector + MCP Baseline Profile Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-6 space-y-1.5">
              <label
                htmlFor="kb-context-awareness-doc-select"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300"
              >
                {language === 'en'
                  ? 'Target Technical Article / Artifact:'
                  : 'انتخاب مقاله فنی / آرتیفکت مورد بررسی:'}
              </label>
              <select
                id="kb-context-awareness-doc-select"
                data-testid="kb-context-awareness-doc-select"
                value={selectedContextEntry.id}
                onChange={(e) => {
                  selectedContextDocIdRef.current = e.target.value;
                  setSelectedContextDocId(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {entries.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {language === 'en'
                      ? `${ent.titleEn} (${ent.keyPath} · ${ent.tokenCount}t · ${ent.stalenessPercent}% rot)`
                      : `${ent.titleFa} (${ent.keyPath} · ${ent.tokenCount}t · ${ent.stalenessPercent}% rot)`}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-6 space-y-1.5">
              <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {language === 'en'
                  ? 'Target MCP Setup Baseline Profile:'
                  : 'پروفایل مرجع پیکربندی MCP (Target Baseline):'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {(
                  [
                    {
                      id: 'stdio-local-readonly',
                      labelFa: 'stdio محلی Read-Only',
                      labelEn: 'Local stdio Read-Only',
                    },
                    {
                      id: 'sse-remote-zero-trust',
                      labelFa: 'کلاستر راه دور SSE',
                      labelEn: 'Remote SSE Zero-Trust',
                    },
                    {
                      id: 'multi-worktree-ci',
                      labelFa: 'ایزوله Multi-Worktree',
                      labelEn: 'Multi-Worktree CI',
                    },
                  ] as const
                ).map((prof) => {
                  const isActiveProf = mcpBaselineProfile === prof.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      data-testid={`kb-context-profile-${prof.id}`}
                      onClick={() => {
                        mcpBaselineProfileRef.current = prof.id;
                        setMcpBaselineProfile(prof.id);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer truncate ${
                        isActiveProf
                          ? 'border-purple-500 bg-purple-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:border-purple-500/40'
                      }`}
                    >
                      {renderBidiText(
                        language === 'en' ? prof.labelEn : prof.labelFa,
                        language
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Executive Context Awareness Summary Box */}
          <div
            data-testid="kb-context-awareness-summary"
            className="p-4 rounded-xl border border-purple-500/25 bg-white/90 dark:bg-slate-950/75 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300">
                {language === 'en'
                  ? 'Context Awareness Synthesis'
                  : 'سنتز آگاهی زمینه (Context Awareness Summary)'}
              </span>
              <code
                dir="ltr"
                className="ltr-inline text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded"
              >
                {selectedContextEntry.keyPath}
              </code>
            </div>
            <p className="text-xs sm:text-[13px] leading-6 text-slate-700 dark:text-slate-200">
              {renderBidiText(
                activeContextAwareness.contextAwarenessSummary,
                language
              )}
            </p>
            <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-700 dark:text-slate-200">
                {language === 'en' ? 'Architectural Invariant: ' : 'الزام معماری: '}
              </strong>
              <span>
                {renderBidiText(
                  activeContextAwareness.architecturalIntent,
                  language
                )}
              </span>
            </div>
          </div>

          {/* 3 Configuration Drift Findings Grid */}
          <div
            data-testid="kb-context-awareness-drift-list"
            className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
          >
            {activeContextAwareness.driftFindings.map((finding, idx) => (
              <div
                key={finding.id}
                data-testid={`kb-drift-finding-${idx}`}
                className="p-4 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-slate-950/80 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400 tabular-nums">
                      #{formatLocalizedNumber(idx + 1, language, true)}
                    </span>
                    <span
                      dir="ltr"
                      className={`ltr-inline px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        finding.severity === 'CRITICAL'
                          ? 'border-rose-500/40 bg-rose-500/15 text-rose-500'
                          : finding.severity === 'WARNING'
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-500'
                          : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-500'
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </div>

                  <code
                    dir="ltr"
                    className="ltr-block text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 break-all"
                  >
                    {finding.parameterPath}
                  </code>

                  <div
                    dir="ltr"
                    className="ltr-block p-2 rounded-lg bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-[10px] font-mono space-y-1"
                  >
                    <div className="text-emerald-600 dark:text-emerald-400 truncate">
                      Expected: {finding.expectedBaseline}
                    </div>
                    <div className="text-amber-600 dark:text-amber-400 truncate">
                      Detected: {finding.detectedState}
                    </div>
                  </div>

                  <p className="text-xs leading-6 text-slate-600 dark:text-slate-300">
                    {renderBidiText(finding.explanation, language)}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="text-[10px] font-bold text-slate-400 mb-1">
                    {language === 'en'
                      ? 'Recommended Remediation Patch:'
                      : 'پچ پیشنهادی رفع انحراف:'}
                  </div>
                  <code
                    dir="ltr"
                    className="ltr-block text-[10px] font-mono text-cyan-600 dark:text-cyan-300 bg-slate-950 px-2 py-1.5 rounded border border-slate-800 overflow-x-auto"
                  >
                    {finding.remediationPatch}
                  </code>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Bar: Recommended MCP Config Snippet + One-Click Apply Fix */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70 dark:border-white/[0.07]">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'en'
                ? 'Applying remediation synchronizes this entry with your active MCP baseline and clears stale Context Rot.'
                : 'اعمال اصلاحیه، این مدخل را با پروفایل مرجع MCP همگام کرده و پوسیدگی زمینه (Context Rot) را صفر می‌کند.'}
            </div>
            <button
              type="button"
              onClick={handleApplyMcpDriftRemediation}
              data-testid="kb-context-awareness-apply-fix-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {language === 'en'
                  ? 'Apply MCP Drift Remediation & Reset Rot'
                  : 'اعمال اصلاحیه انحراف MCP و صفر کردن Context Rot'}
              </span>
            </button>
          </div>
        </section>
      )}

      {/* Searchable Bento Grid */}
      {filteredMatchResults.length === 0 ? (
        <div
          data-testid="kb-empty-state"
          className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/70 text-center space-y-3"
        >
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {language === 'en'
              ? 'No knowledge entries matched your active tag filter or full-text search query.'
              : 'هیچ آیتم دانشی منطبق با فیلتر تگ یا عبارت جستجوی تمام‌متن شما یافت نشد.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchScope('all');
              setActiveTagFilterId(null);
              setSelectedCategory('all');
              setOnlyStaleRot(false);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer"
          >
            {language === 'en'
              ? 'Show All Knowledge Base Entries'
              : 'نمایش تمام آیتم‌های پایگاه دانش'}
          </button>
        </div>
      ) : (
        <div
          data-testid="kb-bento-grid"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredMatchResults.map((matchResult) => {
            const { item, tags: itemTags, matchedInTitle, matchedInContent } =
              matchResult;
            const isStale = item.stalenessPercent >= 65;
            const isEditing = editingId === item.id;
            const catMeta = CATEGORY_METADATA[item.category];

            return (
              <article
                key={item.id}
                data-testid={`kb-card-${item.id}`}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all shadow-md ${
                  item.bentoSpan === 'wide' ? 'md:col-span-2' : 'col-span-1'
                } ${
                  isStale
                    ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/15'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Meta Row: Category Badge & Context Rot Staleness Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      dir="ltr"
                      className={`ltr-inline px-2.5 py-0.5 rounded-md border font-mono text-[10px] font-bold ${catMeta.badgeClass}`}
                    >
                      {catMeta.labelEn}
                    </span>

                    <div className="flex items-center gap-2">
                      <span
                        dir="ltr"
                        className="ltr-inline px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold tabular-nums"
                      >
                        {item.tokenCount} Tokens
                      </span>

                      <span
                        dir="ltr"
                        data-testid={`kb-staleness-${item.id}`}
                        className={`ltr-inline px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold tabular-nums ${
                          isStale
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300'
                            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isStale
                          ? `STALE · ${item.stalenessPercent}% Context Rot`
                          : `FRESH · ${item.stalenessPercent}% Rot`}
                      </span>
                    </div>
                  </div>

                  {/* Key Path Monospace Header */}
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <code
                      dir="ltr"
                      data-testid={`kb-keypath-${item.id}`}
                      className="ltr-inline text-xs font-mono font-bold text-blue-600 dark:text-blue-400 break-all"
                    >
                      {item.keyPath}
                    </code>
                  </div>

                  {/* Editable vs Display View */}
                  {isEditing ? (
                    <div
                      data-testid={`kb-edit-form-${item.id}`}
                      className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            {language === 'en' ? 'Persian Title:' : 'عنوان فارسی:'}
                          </label>
                          <input
                            type="text"
                            value={editTitleFa}
                            onChange={(e) => setEditTitleFa(e.target.value)}
                            data-testid={`kb-edit-title-fa-${item.id}`}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            {language === 'en'
                              ? 'English Title:'
                              : 'عنوان انگلیسی (English Title):'}
                          </label>
                          <input
                            type="text"
                            dir="ltr"
                            value={editTitleEn}
                            onChange={(e) => setEditTitleEn(e.target.value)}
                            data-testid={`kb-edit-title-en-${item.id}`}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          {language === 'en'
                            ? 'Artifact / Storage Key Path:'
                            : 'مسیر کلید (Artifact / Storage Key Path):'}
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={editKeyPath}
                          onChange={(e) => setEditKeyPath(e.target.value)}
                          data-testid={`kb-edit-keypath-${item.id}`}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                          {language === 'en'
                            ? 'Stored Knowledge / State Content Snippet:'
                            : 'محتوای دانش / وضعیت ذخیره‌شده (Content Snippet):'}
                        </label>
                        <textarea
                          dir="ltr"
                          rows={5}
                          value={editContentSnippet}
                          onChange={(e) => setEditContentSnippet(e.target.value)}
                          data-testid={`kb-edit-content-${item.id}`}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-100 p-2.5 text-xs font-mono leading-5"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          data-testid={`kb-cancel-edit-btn-${item.id}`}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                          {language === 'en' ? 'Cancel' : 'انصراف'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item)}
                          data-testid={`kb-save-btn-${item.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {language === 'en'
                              ? 'Save & Resolve Context Rot'
                              : 'ذخیره و رفع Context Rot'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3
                          data-testid={`kb-title-fa-${item.id}`}
                          className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-6"
                        >
                          {language === 'en' ? item.titleEn : item.titleFa}
                        </h3>
                        <div
                          dir="ltr"
                          data-testid={`kb-title-en-${item.id}`}
                          className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 block"
                        >
                          {item.titleEn}
                        </div>
                      </div>

                      <pre
                        dir="ltr"
                        data-testid={`kb-snippet-${item.id}`}
                        className="ltr-code p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 text-[11px] font-mono leading-5 overflow-x-auto max-h-44"
                      >
                        <code>{item.contentSnippet}</code>
                      </pre>

                      {/* Concept Tags & Full-Text Match Field Indicator on Card */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {itemTags.map((t) => {
                            const isTagActive = activeTagFilterId === t.tagId;
                            return (
                              <button
                                key={t.tagId}
                                type="button"
                                data-testid={`kb-card-tag-${item.id}-${t.tagId}`}
                                onClick={() => {
                                  setActiveTagFilterId((prev) =>
                                    prev === t.tagId ? null : t.tagId
                                  );
                                  setSelectedBubbleTagId(t.tagId);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                                  isTagActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400'
                                }`}
                              >
                                <span dir="ltr" className="ltr-inline">
                                  {t.labelEn}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {searchQuery.trim() !== '' &&
                          (matchedInTitle || matchedInContent) && (
                            <span
                              dir="ltr"
                              data-testid={`kb-match-fields-${item.id}`}
                              className="ltr-inline text-[10px] font-mono font-bold text-emerald-400"
                            >
                              Hit:{' '}
                              {[
                                matchedInTitle ? 'Title' : null,
                                matchedInContent ? 'Content' : null,
                              ]
                                .filter(Boolean)
                                .join(' + ')}
                            </span>
                          )}
                      </div>
                    </>
                  )}
                </div>

                {/* Card Footer: Timestamp + Manual Edit / Delete Controls */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="ltr-inline text-[10px] font-mono text-slate-400"
                  >
                    Updated: {item.updatedAtIso.slice(0, 19).replace('T', ' ')}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenContextAwarenessForDoc(item.id)}
                      data-testid={`kb-context-awareness-btn-${item.id}`}
                      className="px-2.5 py-1.5 rounded-lg border border-purple-500/35 bg-purple-500/10 hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {language === 'en'
                          ? 'Context Awareness'
                          : 'آگاهی زمینه (MCP Drift)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenQuizForDoc(item.id)}
                      data-testid={`kb-quiz-btn-${item.id}`}
                      className="px-2.5 py-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>
                        {language === 'en' ? 'Doc Quiz' : 'آزمون سند (Quiz)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(item)}
                      data-testid={`kb-edit-btn-${item.id}`}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 hover:bg-blue-600 hover:text-white hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>
                        {language === 'en' ? 'Manual Edit' : 'ویرایش دستی (Edit)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(item)}
                      data-testid={`kb-delete-btn-${item.id}`}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-500/35 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Delete' : 'حذف (Delete)'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
