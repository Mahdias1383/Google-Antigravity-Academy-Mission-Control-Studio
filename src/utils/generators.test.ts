import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRuleMarkdown,
  buildWorkflowMarkdown,
  recommendAutonomyPolicy,
  buildMcpConfigJson,
  buildFastMcpPythonCode,
  estimateRuleTokenOverhead,
  buildKnowledgeBaseUserStateJson,
  parseKnowledgeBaseUserStateJson,
  serializeRecentSessionSnapshot,
  resolveRecentSessionFromStorage,
  buildInitialKnowledgeBaseEntries,
  calculateContextRotTelemetry,
  filterKnowledgeBaseBentoItems,
  editKnowledgeBaseEntryItem,
  deleteKnowledgeBaseEntryItem,
  pruneStaleKnowledgeBaseEntries,
  buildMissionMilestoneNotification,
  exportKnowledgeBaseBundleJson,
  parseKnowledgeBaseBundleJson,
  extractTagsForKnowledgeEntry,
  buildKnowledgeBaseTagBubbleGraph,
  buildKnowledgeBaseYearlyCalendarHeatmap,
  recordKnowledgeBaseDailyUsageAction,
  searchKnowledgeBaseFullText,
  computeQuickStudyModeTransition,
  computeReadingEstimateForModule,
  buildBreadcrumbDescriptorWithTooltips,
  getStoredKnowledgeCheckScores,
} from './generators';
import {
  CURATED_KNOWLEDGE_QUIZ_BANK,
  getKnowledgeQuizQuestionsForDoc,
  generateDynamicQuestionsForCustomDoc,
  evaluateQuizAnswer,
  calculateQuizScoreSummary,
} from './quizGenerators';
import {
  formatTimerDisplay,
  formatDeepWorkDuration,
  calculateDeepWorkXp,
  recordDeepWorkSession,
  calculateModuleDeepWorkSummaries,
  calculateTotalDeepWorkStats,
  parseDeepWorkLogsFromStorage,
  serializeDeepWorkLogsToStorage,
  POMODORO_MODES,
  DeepWorkLogEntry,
} from './pomodoroTimer';
import {
  APP_TRANSLATIONS,
  getTranslation,
  getLayoutDirection,
} from './translations';
import {
  getEnglishModuleContent,
  ENGLISH_CURRICULUM_CONTENT,
} from './curriculumEnglishContent';
import {
  createSectionChangeEvent,
  appendSectionChangeEvent,
  aggregateActivityEventsByDateAndSection,
  buildSeedNavigationActivityEvents,
  calculateActivityLogStats,
  filterActivityLogEvents,
  formatActivityDateDisplay,
  formatSessionDuration,
  normalizeDigitsToAscii,
  serializeActivityLogsToStorage,
  parseActivityLogsFromStorage,
  NavigationActivityEvent,
} from './activityLogger';
import {
  clampDeltaTime,
  createInitialCyberArenaState,
  spawnWaveEnemies,
  startCyberGameSession,
  toggleCyberGamePause,
  stepCyberArenaSimulation,
} from './cyberGameEngine';


test('buildRuleMarkdown generates valid Glob frontmatter and selected domain sections', () => {
  const md = buildRuleMarkdown({
    name: '01-backend-async',
    activationMode: 'Glob',
    globs: ['src/**/*.py', 'tests/**/*.py'],
    description: 'Async SQLAlchemy 2.0 standards',
    domains: {
      fastapi: true,
      sqlalchemy: true,
      alembic: false,
      pytest: true,
      security: false,
      logging: false,
    },
  });

  assert.equal(md.includes('alwaysApply: false'), true);
  assert.equal(md.includes('globs: ["src/**/*.py", "tests/**/*.py"]'), true);
  assert.equal(md.includes('## 1. FastAPI & Pydantic v2 Contracts'), true);
  assert.equal(md.includes('## 2. SQLAlchemy 2.0 Async ORM Invariants'), true);
  assert.equal(md.includes('## 3. Alembic Schema Migration Safety'), false);
});

test('buildWorkflowMarkdown respects // turbo-all vs step-level // turbo directives', () => {
  const stepLevelMd = buildWorkflowMarkdown({
    commandName: '/safe-migration',
    description: 'Run safe Alembic migration',
    turboAll: false,
    steps: [
      {
        id: 's1',
        title: 'Check heads',
        description: 'Verify single Alembic head',
        commandOrAction: 'poetry run alembic heads',
        turboStep: true,
      },
      {
        id: 's2',
        title: 'Apply upgrade',
        description: 'Run upgrade head',
        commandOrAction: 'poetry run alembic upgrade head',
        turboStep: false,
      },
    ],
  });

  assert.equal(stepLevelMd.includes('// turbo-all'), false);
  assert.equal(stepLevelMd.includes('// turbo\n```bash\npoetry run alembic heads'), true);

  const turboAllMd = buildWorkflowMarkdown({
    commandName: 'safe-migration',
    description: 'Run full turbo pipeline',
    turboAll: true,
    steps: [
      {
        id: 's1',
        title: 'Check heads',
        description: 'Verify single Alembic head',
        commandOrAction: 'poetry run alembic heads',
        turboStep: true,
      },
    ],
  });

  assert.equal(turboAllMd.includes('// turbo-all'), true);
});

test('recommendAutonomyPolicy enforces Request Review for enterprise-prod and destructive DB access', () => {
  const prodPolicy = recommendAutonomyPolicy({
    environment: 'enterprise-prod',
    hasDestructiveDbAccess: true,
    teamExperience: 'principal',
    requiresAuditTrail: true,
  });

  assert.equal(prodPolicy.executionMode, 'Planning Mode');
  assert.equal(prodPolicy.artifactReviewPolicy, 'Request Review');
  assert.equal(prodPolicy.denyList.includes('DROP TABLE'), true);

  const sandboxPolicy = recommendAutonomyPolicy({
    environment: 'local-sandbox',
    hasDestructiveDbAccess: false,
    teamExperience: 'principal',
    requiresAuditTrail: false,
  });

  assert.equal(sandboxPolicy.terminalPolicy, 'Turbo');
  assert.equal(sandboxPolicy.artifactReviewPolicy, 'Always Proceed');
});

test('buildMcpConfigJson and buildFastMcpPythonCode generate valid JSON and FastMCP tools', () => {
  const selection = {
    postgres: true,
    github: true,
    opensearchTelemetry: true,
    rocketchatAlert: true,
    redisCache: false,
    envVars: {
      postgresUrl: 'postgresql://readonly:secret@db.internal:5432/analytics',
      opensearchUrl: 'https://opensearch.internal:9200',
      rocketchatWebhook: 'https://chat.internal/hooks/abc123',
      githubTokenEnv: 'GH_ENTERPRISE_TOKEN',
    },
  };

  const jsonStr = buildMcpConfigJson(selection);
  const parsed = JSON.parse(jsonStr);
  assert.equal(Boolean(parsed.mcpServers['postgres-warehouse']), true);
  assert.equal(Boolean(parsed.mcpServers['enterprise-telemetry-fastmcp']), true);

  const pyCode = buildFastMcpPythonCode(selection);
  assert.equal(pyCode.includes('from mcp.server.fastmcp import FastMCP'), true);
  assert.equal(pyCode.includes('async def fetch_opensearch_error_logs'), true);
  assert.equal(pyCode.includes('async def send_rocketchat_deployment_report'), true);
});

test('estimateRuleTokenOverhead calculates lower per-turn cost for Glob than Always On', () => {
  const alwaysOn = estimateRuleTokenOverhead('Always On', 2000);
  const globScoped = estimateRuleTokenOverhead('Glob', 2000);
  assert.equal(alwaysOn.tokensPerTurn > globScoped.tokensPerTurn, true);
  assert.equal(globScoped.efficiencyRating, 'Optimal');
});

import {
  calculateCertificationMetrics,
  calculateStreakSummary,
  formatShareableReportCardText,
  calculateWeeklyPlannerMetrics,
  formatActiveTimerDisplay,
  calculateXpAndLevelProgression,
  calculateTrophyCaseStatus,
  buildShareableProgressCardBundle,
  parseSharedProgressCardFromQuery,
  buildStudyStreakHeatmapData,
  evaluateDailyStreakMilestones,
  serializeDailyStreakStateToStorage,
  parseDailyStreakStateFromStorage,
  buildUnifiedLearningMigrationBackup,
  exportUnifiedLearningMigrationJson,
  parseUnifiedLearningMigrationJson,
  calculateMasteryRankStanding,
} from './achievements';
import { ALL_CURRICULUM_MODULES } from '../data/curriculumIndex';

test('calculateCertificationMetrics computes unlocked badges, XP, and Certified status accurately', () => {
  const partial = calculateCertificationMetrics(
    ALL_CURRICULUM_MODULES,
    ['module-1', 'module-2'],
    'Aria Rostami'
  );
  assert.equal(partial.completedCount, 2);
  assert.equal(partial.totalModules, 8);
  assert.equal(partial.completionPercentage, 25);
  assert.equal(partial.isCertified, false);
  assert.equal(partial.totalXp, 350);

  const fullIds = ALL_CURRICULUM_MODULES.map((m) => m.id);
  const full = calculateCertificationMetrics(ALL_CURRICULUM_MODULES, fullIds, 'Aria Rostami');
  assert.equal(full.completedCount, 8);
  assert.equal(full.completionPercentage, 100);
  assert.equal(full.isCertified, true);
  assert.equal(full.rankTitleEn, 'Certified Principal Antigravity Architect');
});

test('calculateStreakSummary computes current consecutive streak and longest streak', () => {
  const sampleDays = [
    { dateIso: '2026-10-21', dayLabelFa: 'چهارشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
    { dateIso: '2026-10-22', dayLabelFa: 'پنج‌شنبه', minutesStudied: 0, modulesTouched: 0, active: false },
    { dateIso: '2026-10-23', dayLabelFa: 'جمعه', minutesStudied: 40, modulesTouched: 1, active: true },
    { dateIso: '2026-10-24', dayLabelFa: 'شنبه', minutesStudied: 50, modulesTouched: 2, active: true },
    { dateIso: '2026-10-25', dayLabelFa: 'یکشنبه', minutesStudied: 30, modulesTouched: 1, active: true },
  ];

  const stats = calculateStreakSummary(sampleDays);
  assert.equal(stats.currentStreakDays, 3);
  assert.equal(stats.longestStreakDays, 3);
  assert.equal(stats.totalMinutesStudied, 155);
  assert.equal(stats.activeDaysCount, 4);
});

test('formatShareableReportCardText generates deterministic shareable text summary', () => {
  const metrics = calculateCertificationMetrics(
    ALL_CURRICULUM_MODULES,
    ['module-1', 'module-2', 'module-3'],
    'Sina Karimi'
  );
  const reportText = formatShareableReportCardText(
    'Sina Karimi',
    'Principal Backend Architect',
    'Core FinTech',
    metrics,
    5,
    210
  );

  assert.equal(reportText.includes('Candidate       : Sina Karimi'), true);
  assert.equal(reportText.includes('Modules Mastered: 3 / 8 (38%)'), true);
  assert.equal(reportText.includes('[AG-CORE-01] Agent-First Core Architect'), true);
});

test('calculateWeeklyPlannerMetrics computes weekly target ratios and bar chart heights', () => {
  const sampleWeek = [
    { dateIso: '2026-10-21', dayLabelFa: 'چهارشنبه', minutesStudied: 45, modulesTouched: 1, active: true },
    { dateIso: '2026-10-22', dayLabelFa: 'پنج‌شنبه', minutesStudied: 60, modulesTouched: 2, active: true },
    { dateIso: '2026-10-23', dayLabelFa: 'جمعه', minutesStudied: 0, modulesTouched: 0, active: false },
    { dateIso: '2026-10-24', dayLabelFa: 'شنبه', minutesStudied: 45, modulesTouched: 1, active: true },
    { dateIso: '2026-10-25', dayLabelFa: 'یکشنبه', minutesStudied: 50, modulesTouched: 2, active: true },
    { dateIso: '2026-10-26', dayLabelFa: 'دوشنبه', minutesStudied: 30, modulesTouched: 1, active: true },
    { dateIso: '2026-10-27', dayLabelFa: 'سه‌شنبه', minutesStudied: 45, modulesTouched: 2, active: true },
  ];

  const planner = calculateWeeklyPlannerMetrics(sampleWeek, 45);
  assert.equal(planner.weeklyTargetMinutes, 315);
  assert.equal(planner.weeklyActualMinutes, 275);
  assert.equal(planner.daysMetTargetCount, 5);
  assert.equal(planner.todayCompletionPercent, 100);
  assert.equal(planner.chartBars.length, 7);
  assert.equal(formatActiveTimerDisplay(125), '02:05');
});

test('calculateXpAndLevelProgression combines module XP, reading time XP, and studio usage XP to level up user', () => {
  const studios = [
    { studioId: 'sim', titleFa: 'شبیه‌ساز Mission Control', titleEn: 'Mission Control Sim', xpPerAction: 100, actionsLogged: 2 },
    { studioId: 'mcp', titleFa: 'استودیوی FastMCP', titleEn: 'FastMCP Studio', xpPerAction: 120, actionsLogged: 1 },
  ];
  const initialLevel = calculateXpAndLevelProgression(150, 50, studios);
  assert.equal(initialLevel.moduleXp, 150);
  assert.equal(initialLevel.readingTimeXp, 200);
  assert.equal(initialLevel.studioUsageXp, 320);
  assert.equal(initialLevel.totalCombinedXp, 670);
  assert.equal(initialLevel.currentLevel, 2);
  assert.equal(initialLevel.levelProgressPercent, 10);

  const leveledUp = calculateXpAndLevelProgression(1650, 280, [
    { studioId: 'sim', titleFa: 'شبیه‌ساز Mission Control', titleEn: 'Mission Control Sim', xpPerAction: 100, actionsLogged: 6 },
  ]);
  assert.equal(leveledUp.currentLevel, 5);
  assert.equal(leveledUp.totalCombinedXp, 3370);
});

test('calculateTrophyCaseStatus unlocks rare trophies for high-difficulty scenarios and 100% module mastery', () => {
  const partialTrophies = calculateTrophyCaseStatus(4, 8, ['scenario-zero-downtime-alembic']);
  assert.equal(partialTrophies.unlockedCount, 1);
  assert.equal(partialTrophies.totalTrophies, 5);
  assert.equal(partialTrophies.trophyBonusXp, 350);
  assert.equal(partialTrophies.allUnlocked, false);
  assert.equal(partialTrophies.trophies[0].unlocked, false); // Mythic 100% mastery locked

  const fullTrophies = calculateTrophyCaseStatus(8, 8, [
    'scenario-zero-downtime-alembic',
    'scenario-worktree-isolation',
    'scenario-fastmcp-security',
    'scenario-browser-subagent-e2e',
  ]);
  assert.equal(fullTrophies.unlockedCount, 5);
  assert.equal(fullTrophies.trophyBonusXp, 1800);
  assert.equal(fullTrophies.allUnlocked, true);
  assert.equal(fullTrophies.trophies[0].unlocked, true); // Mythic 100% mastery unlocked
});

test('buildKnowledgeBaseUserStateJson and parseKnowledgeBaseUserStateJson serialize and restore .agent/knowledge-base/user-state.json accurately', () => {
  const jsonOutput = buildKnowledgeBaseUserStateJson({
    exportedAtIso: '2026-10-28T09:00:00.000Z',
    workspaceName: 'antigravity-enterprise-core',
    taskId: 'task-websocket',
    titleEn: 'Build Async WebSocket Notification Service with Redis Pub/Sub',
    titleFa: 'ساخت سرویس اعلان بلادرنگ WebSocket با Redis Pub/Sub',
    worktree: '../ag-worktrees/wt-websocket',
    executionMode: 'Planning Mode',
    executionStage: 'completed',
    activeArtifactTab: 'walkthrough.md',
    inlineComments: [
      { line: 5, comment: 'Ensure expired tickets return HTTP 403 before WebSocket upgrade.' },
      { line: 8, comment: 'Use heartbeat ping interval of 15s.' },
    ],
    tasks: [
      { id: 't1', text: 'Define Pydantic v2 WebSocketEnvelope schema', doneAfterExec: true },
      { id: 't2', text: 'Implement Redis async fan-out manager', doneAfterExec: true },
    ],
    completedModules: ['module-1', 'module-2', 'module-3', 'module-4'],
    totalModules: 8,
  });

  assert.equal(jsonOutput.includes('".agent/knowledge-base/user-state.json"'), true);
  assert.equal(jsonOutput.includes('"completionPercent": 50'), true);
  assert.equal(jsonOutput.includes('antigravity resume --state .agent/knowledge-base/user-state.json'), true);

  const parsedResult = parseKnowledgeBaseUserStateJson(jsonOutput);
  assert.equal(parsedResult.valid, true);
  assert.equal(parsedResult.data?.artifactPath, '.agent/knowledge-base/user-state.json');
  assert.equal(parsedResult.data?.workspaceProfile.executionStage, 'completed');
  assert.equal(parsedResult.data?.activeTaskState.inlineReviewComments.length, 2);
  assert.equal(parsedResult.data?.academyProgress.completedModules.length, 4);

  const invalidResult = parseKnowledgeBaseUserStateJson('{"artifactPath": "wrong.json"}');
  assert.equal(invalidResult.valid, false);
});

test('resolveRecentSessionFromStorage detects last accessed module or studio from localStorage accurately', () => {
  const sampleModules = ALL_CURRICULUM_MODULES.map((m) => ({
    id: m.id,
    number: m.number,
    titleFa: m.titleFa,
    titleEn: m.titleEn,
  }));

  const studioSnapshotJson = serializeRecentSessionSnapshot({
    version: '1.0',
    lastAccessedSection: 'mcp',
    lastAccessedModuleId: 'module-7',
    completedModules: ['module-1', 'module-2', 'module-7'],
    updatedAtIso: '2026-10-28T09:10:00.000Z',
  });

  const resolvedStudio = resolveRecentSessionFromStorage(studioSnapshotJson, null, sampleModules);
  assert.notEqual(resolvedStudio, null);
  assert.equal(resolvedStudio?.section, 'mcp');
  assert.equal(resolvedStudio?.kind, 'studio');
  assert.equal(resolvedStudio?.completedCount, 3);
  assert.equal(resolvedStudio?.completionPercent, 38);

  const moduleSnapshotJson = serializeRecentSessionSnapshot({
    version: '1.0',
    lastAccessedSection: 'curriculum',
    lastAccessedModuleId: 'module-5',
    completedModules: ['module-1', 'module-2', 'module-3', 'module-4'],
    updatedAtIso: '2026-10-28T09:12:00.000Z',
  });

  const resolvedModule = resolveRecentSessionFromStorage(moduleSnapshotJson, null, sampleModules);
  assert.notEqual(resolvedModule, null);
  assert.equal(resolvedModule?.section, 'curriculum');
  assert.equal(resolvedModule?.moduleId, 'module-5');
  assert.equal(resolvedModule?.kind, 'module');
  assert.equal(resolvedModule?.badgeLabelEn, 'CURRICULUM · MODULE 05');
  assert.equal(resolvedModule?.completionPercent, 50);
});

test('Knowledge Base Explorer pure functions filter bento items, calculate context rot telemetry, and allow manual edit/delete/prune', () => {
  const initialEntries = buildInitialKnowledgeBaseEntries(null, null);
  assert.equal(initialEntries.length, 6);

  const initialTelemetry = calculateContextRotTelemetry(initialEntries, 4500);
  assert.equal(initialTelemetry.staleEntriesCount, 2);
  assert.equal(initialTelemetry.rotStatus, 'Critical (Context Rot Detected)');

  // Filter by search query
  const searchResults = filterKnowledgeBaseBentoItems(initialEntries, 'sqlalchemy', 'all', false);
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, 'kb-rule-sqlalchemy-async');

  // Filter only stale Context Rot entries
  const staleResults = filterKnowledgeBaseBentoItems(initialEntries, '', 'all', true);
  assert.equal(staleResults.length, 2);

  // Manually edit a stale entry to cure its Context Rot
  const editedEntries = editKnowledgeBaseEntryItem(
    initialEntries,
    'kb-stale-legacy-celery-context',
    {
      titleEn: 'Updated Redis Streams AsyncIO Worker Standard',
      contentSnippet: 'Use AsyncIO Redis Streams XREADGROUP with consumer group ack.',
    }
  );
  const editedTarget = editedEntries.find((e) => e.id === 'kb-stale-legacy-celery-context');
  assert.equal(editedTarget?.stalenessPercent, 4);
  assert.equal(editedTarget?.titleEn, 'Updated Redis Streams AsyncIO Worker Standard');

  // Delete a specific entry
  const afterDelete = deleteKnowledgeBaseEntryItem(editedEntries, 'kb-stale-monolith-trace-dump');
  assert.equal(afterDelete.length, 5);

  const healthyTelemetry = calculateContextRotTelemetry(afterDelete, 4500);
  assert.equal(healthyTelemetry.staleEntriesCount, 0);
  assert.equal(healthyTelemetry.rotStatus, 'Healthy (Zero Context Rot)');

  // Prune stale entries directly from initial list
  const pruned = pruneStaleKnowledgeBaseEntries(initialEntries, 65);
  assert.equal(pruned.length, 4);
});

test('buildMissionMilestoneNotification generates Antigravity engineering quote, XP reward, and 24 confetti particles upon module completion', () => {
  const milestone = buildMissionMilestoneNotification({
    moduleId: 'module-4',
    moduleNumber: 4,
    moduleTitleFa: 'قوانین .agent/rules و مهندسی جلوگیری از Context Rot',
    moduleTitleEn: 'Declarative .agent/rules & Preventing Context Rot',
    completedModules: ['module-1', 'module-2'],
    totalModules: 8,
  });

  assert.equal(milestone.moduleId, 'module-4');
  assert.equal(milestone.moduleNumber, 4);
  assert.equal(milestone.completedCount, 3);
  assert.equal(milestone.completionPercent, 38);
  assert.equal(milestone.xpAwarded, 200);
  assert.equal(milestone.isFullAcademyMastery, false);
  assert.equal(milestone.quote.engineeringPrincipleEn, 'PRINCIPLE 04 · ZERO CONTEXT ROT');
  assert.equal(milestone.quote.quoteEn.includes('Context Rot'), true);
  assert.equal(milestone.confettiParticles.length, 24);

  const fullMasteryMilestone = buildMissionMilestoneNotification({
    moduleId: 'module-8',
    moduleNumber: 8,
    moduleTitleFa: 'ارکستراسیون موازی Git Worktrees و مقیاس‌پذیری',
    moduleTitleEn: 'Parallel Git Worktrees & Multi-Agent Scaling',
    completedModules: [
      'module-1',
      'module-2',
      'module-3',
      'module-4',
      'module-5',
      'module-6',
      'module-7',
    ],
    totalModules: 8,
  });

  assert.equal(fullMasteryMilestone.completedCount, 8);
  assert.equal(fullMasteryMilestone.completionPercent, 100);
  assert.equal(fullMasteryMilestone.isFullAcademyMastery, true);
  assert.equal(fullMasteryMilestone.xpAwarded, 500);
});

test('exportKnowledgeBaseBundleJson and parseKnowledgeBaseBundleJson serialize and restore full Knowledge Base state accurately', () => {
  const initialEntries = buildInitialKnowledgeBaseEntries(null, null);
  const prunedEntries = pruneStaleKnowledgeBaseEntries(initialEntries, 65);
  assert.equal(prunedEntries.length, 4);

  const bundleJson = exportKnowledgeBaseBundleJson(
    prunedEntries,
    '2026-10-31T22:05:00.000Z'
  );
  assert.equal(
    bundleJson.includes('"bundleType": "google-antigravity-knowledge-base-export"'),
    true
  );
  assert.equal(
    bundleJson.includes('"rotStatus": "Healthy (Zero Context Rot)"'),
    true
  );

  const parsedBundle = parseKnowledgeBaseBundleJson(bundleJson);
  assert.equal(parsedBundle.valid, true);
  assert.equal(parsedBundle.entries?.length, 4);
  assert.equal(parsedBundle.exportedAtIso, '2026-10-31T22:05:00.000Z');
  assert.equal(
    parsedBundle.entries?.[0].keyPath,
    '.agent/knowledge-base/user-state.json'
  );

  // Also test importing a direct JSON array of entries
  const arrayJson = JSON.stringify([
    {
      id: 'kb-custom-import-1',
      keyPath: '.agent/rules/99-custom-imported-rule.md',
      titleFa: 'قانون واردشده از فایل پشتیبان JSON',
      titleEn: 'Restored Custom Rule from JSON Backup',
      category: 'architecture-rule',
      contentSnippet: 'Always enforce strict schema validation on imported MCP payloads.',
    },
  ]);
  const parsedArray = parseKnowledgeBaseBundleJson(arrayJson);
  assert.equal(parsedArray.valid, true);
  assert.equal(parsedArray.entries?.length, 1);
  assert.equal(parsedArray.entries?.[0].id, 'kb-custom-import-1');
  assert.equal(parsedArray.entries?.[0].stalenessPercent, 5);

  const invalidBundle = parseKnowledgeBaseBundleJson('{"entries": []}');
  assert.equal(invalidBundle.valid, false);
});

test('buildShareableProgressCardBundle and parseSharedProgressCardFromQuery generate unique public mastery card URL and social media sharing API links', () => {
  const metrics = calculateCertificationMetrics(
    ALL_CURRICULUM_MODULES,
    ['module-1', 'module-2', 'module-3', 'module-4'],
    'Aria Rostami'
  );
  const xpProgression = calculateXpAndLevelProgression(metrics.totalXp, 180, [
    {
      studioId: 'sim',
      titleFa: 'شبیه‌ساز Mission Control',
      titleEn: 'Mission Control Sim',
      xpPerAction: 100,
      actionsLogged: 3,
    },
  ]);

  const bundle = buildShareableProgressCardBundle({
    baseUrl: 'https://antigravity.academy.example',
    architectName: 'آریا رستمی (Aria Rostami)',
    roleTitle: 'Principal AI Systems Architect',
    organization: 'Enterprise Cloud Engineering',
    metrics,
    xpProgression,
    currentStreakDays: 7,
    generatedAtIso: '2026-10-31T22:10:00.000Z',
  });

  assert.equal(bundle.cardSlugId.startsWith('ag-card-aria-rostami-4of8-lvl'), true);
  assert.equal(
    bundle.publicCardUrl.startsWith('https://antigravity.academy.example/?section=achievements&cardId='),
    true
  );
  assert.equal(
    bundle.socialShareUrls.linkedInUrl.startsWith(
      'https://www.linkedin.com/sharing/share-offsite/?url='
    ),
    true
  );
  assert.equal(
    bundle.socialShareUrls.twitterXUrl.startsWith('https://twitter.com/intent/tweet?text='),
    true
  );
  assert.equal(
    bundle.socialShareUrls.telegramUrl.startsWith('https://t.me/share/url?url='),
    true
  );
  assert.equal(
    bundle.socialShareUrls.whatsappUrl.startsWith('https://api.whatsapp.com/send?text='),
    true
  );

  const queryPart = new URL(bundle.publicCardUrl).search;
  const parsedSnapshot = parseSharedProgressCardFromQuery(queryPart);
  assert.notEqual(parsedSnapshot, null);
  assert.equal(parsedSnapshot?.cardSlugId, bundle.cardSlugId);
  assert.equal(parsedSnapshot?.certificateSerial, metrics.certificateSerial);
  assert.equal(parsedSnapshot?.completedCount, 4);
  assert.equal(parsedSnapshot?.completionPercentage, 50);
  assert.equal(parsedSnapshot?.totalCombinedXp, xpProgression.totalCombinedXp);
  assert.equal(parsedSnapshot?.currentLevel, xpProgression.currentLevel);
  assert.equal(parsedSnapshot?.currentStreakDays, 7);
  assert.equal(parsedSnapshot?.unlockedBadgeCodes.includes('AG-CORE-01'), true);

  assert.equal(parseSharedProgressCardFromQuery('?foo=bar'), null);
});

test('buildStudyStreakHeatmapData constructs 12-week D3 calendar heatmap cells with Academy, Studios, and Combined activity domains', () => {
  const sampleDays = [
    { dateIso: '2026-10-25', dayLabelFa: 'یکشنبه', minutesStudied: 55, modulesTouched: 2, active: true },
    { dateIso: '2026-10-26', dayLabelFa: 'دوشنبه', minutesStudied: 35, modulesTouched: 1, active: true },
    { dateIso: '2026-10-27', dayLabelFa: 'سه‌شنبه', minutesStudied: 45, modulesTouched: 2, active: true },
  ];
  const sampleStudios = [
    {
      studioId: 'sim',
      titleFa: 'شبیه‌ساز Mission Control',
      titleEn: 'Mission Control Sim',
      xpPerAction: 100,
      actionsLogged: 5,
    },
  ];

  const heatmap = buildStudyStreakHeatmapData(sampleDays, sampleStudios, 12);
  assert.equal(heatmap.totalWeeks, 12);
  assert.equal(heatmap.cells.length, 84);
  assert.equal(heatmap.activeDaysCount > 20, true);
  assert.equal(heatmap.academyOnlyDaysCount > 0, true);
  assert.equal(heatmap.studiosOnlyDaysCount > 0, true);
  assert.equal(heatmap.bothActiveDaysCount > 0, true);
  assert.equal(heatmap.monthMarkers.length >= 2, true);

  const lastCell = heatmap.cells[heatmap.cells.length - 1];
  assert.equal(lastCell.dateIso, '2026-10-27');
  assert.equal(lastCell.active, true);
  assert.equal(lastCell.activitySource, 'both');
  assert.equal(lastCell.intensityLevel >= 3, true);

  // Verify custom override toggles a historical date
  const firstDateIso = heatmap.cells[0].dateIso;
  const overridden = buildStudyStreakHeatmapData(sampleDays, sampleStudios, 12, {
    [firstDateIso]: { active: true, minutesStudied: 60, studioRuns: 3 },
  });
  assert.equal(overridden.cells[0].active, true);
  assert.equal(overridden.cells[0].activitySource, 'both');
  assert.equal(overridden.cells[0].intensityLevel, 4);
  assert.equal(overridden.cells[0].xpEarned, 540);
});

test('buildKnowledgeBaseTagBubbleGraph extracts engineering concept tags, frequencies, and co-occurrence relationship links for D3 bubble chart', () => {
  const entries = buildInitialKnowledgeBaseEntries(null, null);
  const firstEntryTags = extractTagsForKnowledgeEntry(entries[0]);
  assert.equal(firstEntryTags.some((t) => t.tagId === 'user-state-sync'), true);
  assert.equal(firstEntryTags.some((t) => t.tagId === 'redis-streams-ws'), true);

  const graph = buildKnowledgeBaseTagBubbleGraph(entries);
  assert.equal(graph.totalUniqueTags >= 6, true);
  assert.equal(graph.totalRelationships >= 5, true);
  assert.notEqual(graph.dominantTag, null);

  const userStateTag = graph.nodes.find((n) => n.tagId === 'user-state-sync');
  assert.notEqual(userStateTag, undefined);
  assert.equal((userStateTag?.frequency || 0) >= 2, true);
  assert.equal((userStateTag?.relatedTagIds.length || 0) >= 2, true);

  const rotTag = graph.nodes.find((n) => n.tagId === 'context-rot-guard');
  assert.notEqual(rotTag, undefined);
  assert.equal((rotTag?.frequency || 0) >= 2, true);
});

test('evaluateDailyStreakMilestones and localStorage streak persistence track 7, 30, and 100-day milestones accurately', () => {
  // 5-day streak: 0 milestones unlocked, next milestone is 7 days (2 days remaining)
  const streak5 = evaluateDailyStreakMilestones(5, 6);
  assert.equal(streak5.currentStreakDays, 5);
  assert.equal(streak5.longestStreakDays, 6);
  assert.equal(streak5.unlockedMilestoneCount, 0);
  assert.equal(streak5.nextMilestoneDays, 7);
  assert.equal(streak5.daysToNextMilestone, 2);
  assert.equal(streak5.highestUnlockedBadge, null);
  assert.equal(streak5.totalMilestoneBonusXp, 0);

  // 7-day milestone: unlocks AG-STRK-007 (+150 XP), next milestone is 30 days
  const streak7 = evaluateDailyStreakMilestones(7, 7);
  assert.equal(streak7.unlockedMilestoneCount, 1);
  assert.equal(streak7.highestUnlockedBadge?.badgeCode, 'AG-STRK-007');
  assert.equal(streak7.nextMilestoneDays, 30);
  assert.equal(streak7.daysToNextMilestone, 23);
  assert.equal(streak7.totalMilestoneBonusXp, 150);

  // 30-day milestone: unlocks AG-STRK-007 and AG-STRK-030 (+650 XP), next milestone is 100 days
  const streak30 = evaluateDailyStreakMilestones(30, 30);
  assert.equal(streak30.unlockedMilestoneCount, 2);
  assert.equal(streak30.highestUnlockedBadge?.badgeCode, 'AG-STRK-030');
  assert.equal(streak30.nextMilestoneDays, 100);
  assert.equal(streak30.daysToNextMilestone, 70);
  assert.equal(streak30.totalMilestoneBonusXp, 650);

  // 100-day milestone: unlocks all 3 badges (+2150 XP), nextMilestoneDays is null
  const streak100 = evaluateDailyStreakMilestones(100, 100);
  assert.equal(streak100.unlockedMilestoneCount, 3);
  assert.equal(streak100.highestUnlockedBadge?.badgeCode, 'AG-STRK-100');
  assert.equal(streak100.nextMilestoneDays, null);
  assert.equal(streak100.daysToNextMilestone, 0);
  assert.equal(streak100.totalMilestoneBonusXp, 2150);

  // Verify localStorage serialization & parsing
  const sampleDays = [
    { dateIso: '2026-10-26', dayLabelFa: 'دوشنبه', minutesStudied: 40, modulesTouched: 1, active: true },
    { dateIso: '2026-10-27', dayLabelFa: 'سه‌شنبه', minutesStudied: 50, modulesTouched: 2, active: true },
  ];
  const serialized = serializeDailyStreakStateToStorage({
    currentStreakDays: 30,
    longestStreakDays: 32,
    lastLoggedDateIso: '2026-10-27',
    studyDays: sampleDays,
  });
  const restored = parseDailyStreakStateFromStorage(serialized, sampleDays);
  assert.equal(restored.currentStreakDays, 30);
  assert.equal(restored.longestStreakDays, 32);
  assert.equal(restored.lastLoggedDateIso, '2026-10-27');
  assert.equal(restored.studyDays.length, 2);

  // Fallback on null/corrupt JSON
  const fallbackRestored = parseDailyStreakStateFromStorage('{invalid', sampleDays);
  assert.equal(fallbackRestored.currentStreakDays, 2);
  assert.equal(fallbackRestored.longestStreakDays, 2);
});

test('buildUnifiedLearningMigrationBackup, exportUnifiedLearningMigrationJson, and parseUnifiedLearningMigrationJson bulk-export and restore learning history, badge list, and accumulated XP accurately', () => {
  const sampleDays = [
    { dateIso: '2026-10-26', dayLabelFa: 'دوشنبه', minutesStudied: 45, modulesTouched: 1, active: true },
    { dateIso: '2026-10-27', dayLabelFa: 'سه‌شنبه', minutesStudied: 60, modulesTouched: 2, active: true },
  ];
  const streakState = {
    schemaVersion: '1.0.0' as const,
    currentStreakDays: 30,
    longestStreakDays: 32,
    lastLoggedDateIso: '2026-10-27',
    studyDays: sampleDays,
    updatedAtIso: '2026-10-27T12:00:00.000Z',
  };
  const kbEntries = buildInitialKnowledgeBaseEntries(null, null);

  const backup = buildUnifiedLearningMigrationBackup({
    allModules: ALL_CURRICULUM_MODULES,
    completedModuleIds: ['module-1', 'module-2', 'module-3'],
    architectName: 'Aria Rostami',
    streakState,
    knowledgeEntries: kbEntries,
    lastAccessedSession: {
      section: 'curriculum',
      moduleId: 'module-3',
      updatedAtIso: '2026-10-31T22:45:00.000Z',
    },
    exportedAtIso: '2026-10-31T22:50:00.000Z',
  });

  assert.equal(backup.bundleType, 'google-antigravity-unified-migration-backup');
  assert.equal(backup.learningHistory.completedModulesCount, 3);
  assert.equal(backup.learningHistory.totalModulesCount, 8);
  assert.equal(backup.learningHistory.currentStreakDays, 30);
  assert.equal(backup.learningHistory.totalMinutesStudied, 105);
  assert.equal(backup.badgeList.unlockedModuleBadgesCount, 3);
  assert.equal(backup.badgeList.unlockedStreakMilestonesCount, 2); // 7d and 30d
  assert.equal(backup.badgeList.totalUnlockedBadgesCount, 5);
  assert.equal(backup.badgeList.unlockedBadgeCodes.includes('AG-CORE-01'), true);
  assert.equal(backup.badgeList.unlockedBadgeCodes.includes('AG-STRK-030'), true);
  assert.equal(backup.accumulatedXp.moduleMasteryXp, 525);
  assert.equal(backup.accumulatedXp.streakMilestoneBonusXp, 650);
  assert.equal(backup.accumulatedXp.totalAccumulatedXp > 1500, true);
  assert.equal(backup.knowledgeBase.totalEntries, kbEntries.length);

  const formattedJson = exportUnifiedLearningMigrationJson(backup);
  assert.equal(
    formattedJson.includes('"bundleType": "google-antigravity-unified-migration-backup"'),
    true
  );

  const parsed = parseUnifiedLearningMigrationJson(formattedJson);
  assert.equal(parsed.valid, true);
  assert.deepEqual(parsed.completedModuleIds, ['module-1', 'module-2', 'module-3']);
  assert.equal(parsed.currentStreakDays, 30);
  assert.equal(parsed.longestStreakDays, 32);
  assert.equal(parsed.knowledgeEntries?.length, kbEntries.length);

  const invalidParsed = parseUnifiedLearningMigrationJson('{"foo":"bar"}');
  assert.equal(invalidParsed.valid, false);
});

test('buildKnowledgeBaseYearlyCalendarHeatmap and recordKnowledgeBaseDailyUsageAction construct 52-week D3 yearly calendar heatmap and track research patterns accurately', () => {
  const entries = buildInitialKnowledgeBaseEntries(null, null);
  const summaryAll = buildKnowledgeBaseYearlyCalendarHeatmap(
    entries,
    {},
    'all',
    '2026-10-31'
  );

  // 52 weeks * 7 days = 364 daily cells
  assert.equal(summaryAll.cells.length, 364);
  assert.equal(summaryAll.cells[summaryAll.cells.length - 1].dateIso, '2026-10-31');
  assert.equal(summaryAll.monthTicks.length >= 10, true);
  assert.equal(summaryAll.totalYearlyInteractions > 300, true);
  assert.equal(summaryAll.activeResearchDaysCount > 100, true);
  assert.equal(summaryAll.peakResearchDay.totalInteractions > 0, true);

  // Record a live research pulse on 2026-10-31 and verify increment
  let overrides = recordKnowledgeBaseDailyUsageAction(
    {},
    '2026-10-31',
    'entry-edit',
    250
  );
  overrides = recordKnowledgeBaseDailyUsageAction(
    overrides,
    '2026-10-31',
    'rot-prune',
    180
  );

  const summaryUpdated = buildKnowledgeBaseYearlyCalendarHeatmap(
    entries,
    overrides,
    'all',
    '2026-10-31'
  );
  const lastCellBefore = summaryAll.cells[summaryAll.cells.length - 1];
  const lastCellAfter = summaryUpdated.cells[summaryUpdated.cells.length - 1];

  assert.equal(
    lastCellAfter.entriesEditedOrCreated,
    lastCellBefore.entriesEditedOrCreated + 1
  );
  assert.equal(
    lastCellAfter.rotPrunedCount,
    lastCellBefore.rotPrunedCount + 1
  );
  assert.equal(
    lastCellAfter.totalInteractions,
    lastCellBefore.totalInteractions + 2
  );

  // Verify focusMode filtering changes focusedMetricValue
  const summaryRotOnly = buildKnowledgeBaseYearlyCalendarHeatmap(
    entries,
    overrides,
    'rot-pruning',
    '2026-10-31'
  );
  const lastCellRotOnly = summaryRotOnly.cells[summaryRotOnly.cells.length - 1];
  assert.equal(lastCellRotOnly.focusedMetricValue, lastCellAfter.rotPrunedCount);
});

test('searchKnowledgeBaseFullText filters knowledge items in real-time by title and content and isolates items via Filter by Tag dropdown', () => {
  const entries = buildInitialKnowledgeBaseEntries(null, null);

  // 1. Default unfiltered search returns all entries and populated tag dropdown options
  const unfiltered = searchKnowledgeBaseFullText({
    entries,
    searchQuery: '',
    searchScope: 'all',
    selectedTagId: 'all',
    selectedCategory: 'all',
    onlyStaleRot: false,
  });
  assert.equal(unfiltered.totalMatched, entries.length);
  assert.equal(unfiltered.availableTagOptions.length >= 6, true);

  // 2. Full-text search by title ("SQLAlchemy")
  const byTitle = searchKnowledgeBaseFullText({
    entries,
    searchQuery: 'SQLAlchemy',
    searchScope: 'all',
    selectedTagId: 'all',
  });
  assert.equal(byTitle.totalMatched >= 1, true);
  assert.equal(byTitle.totalMatchedInTitle >= 1, true);
  assert.equal(byTitle.results[0].matchedInTitle, true);

  // 3. Full-text search by content snippet ("vendor.bundle.js") with content-only scope
  const byContentOnly = searchKnowledgeBaseFullText({
    entries,
    searchQuery: 'vendor.bundle.js',
    searchScope: 'content-only',
    selectedTagId: 'all',
  });
  assert.equal(byContentOnly.totalMatched, 1);
  assert.equal(byContentOnly.results[0].matchedInContent, true);

  // Title-only scope for a content-only token should return 0 matches
  const byTitleOnlyMiss = searchKnowledgeBaseFullText({
    entries,
    searchQuery: 'vendor.bundle.js',
    searchScope: 'title-only',
    selectedTagId: 'all',
  });
  assert.equal(byTitleOnlyMiss.totalMatched, 0);

  // 4. Filter by Tag dropdown ("redis-streams-ws") isolates specific engineering concept
  const byTagOnly = searchKnowledgeBaseFullText({
    entries,
    searchQuery: '',
    searchScope: 'all',
    selectedTagId: 'redis-streams-ws',
  });
  assert.equal(byTagOnly.totalMatched >= 1, true);
  assert.equal(byTagOnly.totalMatched < entries.length, true);
  assert.equal(
    byTagOnly.results.every((r) =>
      r.tags.some((t) => t.tagId === 'redis-streams-ws')
    ),
    true
  );
});

test('calculateMasteryRankStanding assigns Trainee, Specialist, Architect, and Principal ranks based on accumulated XP and milestones', () => {
  // 1. Trainee (< 1,200 XP or < 2 milestones)
  const trainee = calculateMasteryRankStanding({
    totalCombinedXp: 850,
    completedModulesCount: 1,
    unlockedStreakMilestonesCount: 0,
    unlockedTrophiesCount: 0,
  });
  assert.equal(trainee.currentRank.rankNameEn, 'Trainee');
  assert.equal(trainee.nextRank?.rankNameEn, 'Specialist');
  assert.equal(trainee.xpNeededForNextRank, 350);
  assert.equal(trainee.milestonesNeededForNextRank, 1);

  // 2. Specialist (>= 1,200 XP and >= 2 milestones)
  const specialist = calculateMasteryRankStanding({
    totalCombinedXp: 1550,
    completedModulesCount: 2,
    unlockedStreakMilestonesCount: 1,
    unlockedTrophiesCount: 0,
  });
  assert.equal(specialist.currentRank.rankNameEn, 'Specialist');
  assert.equal(specialist.nextRank?.rankNameEn, 'Architect');
  assert.equal(specialist.totalMilestonesCompleted, 3);
  assert.equal(specialist.milestonesNeededForNextRank, 2);

  // 3. Architect (>= 2,400 XP and >= 5 milestones)
  const architect = calculateMasteryRankStanding({
    totalCombinedXp: 2800,
    completedModulesCount: 4,
    unlockedStreakMilestonesCount: 1,
    unlockedTrophiesCount: 1,
  });
  assert.equal(architect.currentRank.rankNameEn, 'Architect');
  assert.equal(architect.nextRank?.rankNameEn, 'Principal');
  assert.equal(architect.totalMilestonesCompleted, 6);

  // 4. Principal (>= 3,600 XP and >= 8 milestones)
  const principal = calculateMasteryRankStanding({
    totalCombinedXp: 4200,
    completedModulesCount: 8,
    unlockedStreakMilestonesCount: 2,
    unlockedTrophiesCount: 3,
  });
  assert.equal(principal.currentRank.rankNameEn, 'Principal');
  assert.equal(principal.nextRank, null);
  assert.equal(principal.overallProgressToNextPercent, 100);
  assert.equal(principal.ranks.every((r) => r.unlocked), true);
});

test('.github/workflows/main.yml defines automated Node.js setup, npm dependency installation, lint, test, and production build steps with a valid package-lock.json', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/main.yml');
  assert.equal(fs.existsSync(workflowPath), true);

  const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
  assert.equal(workflowContent.includes('actions/checkout@v4'), true);
  assert.equal(workflowContent.includes('actions/setup-node@v4'), true);
  assert.equal(workflowContent.includes("cache: 'npm'"), true);
  assert.equal(workflowContent.includes('npm ci || npm install'), true);
  assert.equal(workflowContent.includes('npm run lint'), true);
  assert.equal(workflowContent.includes('npm test'), true);
  assert.equal(workflowContent.includes('npm run build'), true);

  const lockfilePath = path.resolve(process.cwd(), 'package-lock.json');
  assert.equal(fs.existsSync(lockfilePath), true, 'package-lock.json must exist for npm caching in GitHub Actions');
  const lockfileJson = JSON.parse(fs.readFileSync(lockfilePath, 'utf-8'));
  assert.equal(typeof lockfileJson.lockfileVersion, 'number');
  assert.equal(lockfileJson.lockfileVersion >= 2, true);
});

test('Knowledge Quiz: retrieves curated questions matching selected document or synthesizes dynamic questions for custom docs', () => {
  const initialDocs = buildInitialKnowledgeBaseEntries(null, null);
  const userStateDoc = initialDocs.find((d) => d.id === 'kb-user-state-sync')!;
  assert.ok(userStateDoc);

  // 1. Curated questions for default doc
  const userStateQuestions = getKnowledgeQuizQuestionsForDoc(userStateDoc);
  assert.ok(userStateQuestions.length >= 2);
  assert.equal(userStateQuestions[0].docId, 'kb-user-state-sync');
  assert.ok(userStateQuestions[0].options.length === 4);
  assert.ok(userStateQuestions[0].xpReward >= 30);
  assert.ok(userStateQuestions[0].questionFa.length > 10);
  assert.ok(userStateQuestions[0].explanationFa.length > 10);

  // 2. Curated questions for sqlalchemy async rule
  const sqlDoc = initialDocs.find((d) => d.id === 'kb-rule-sqlalchemy-async')!;
  const sqlQuestions = getKnowledgeQuizQuestionsForDoc(sqlDoc);
  assert.ok(sqlQuestions.length >= 2);
  assert.equal(sqlQuestions[0].docId, 'kb-rule-sqlalchemy-async');

  // 3. Dynamic synthesis for arbitrary custom doc
  const customDoc = {
    id: 'kb-custom-redis-locks',
    keyPath: '.agent/rules/distributed-locks.md',
    titleFa: 'مدیریت قفل‌های توزیع‌شده با ردیس',
    titleEn: 'Distributed Redlock Concurrency Governance',
    category: 'architecture-rule' as const,
    contentSnippet: 'Acquire redlock with TTL <= 10s and unique nonce.',
    tokenCount: 210,
    stalenessPercent: 5,
    bentoSpan: 'normal' as const,
    updatedAtIso: '2026-10-31T12:00:00.000Z',
  };
  const dynamicQuestions = getKnowledgeQuizQuestionsForDoc(customDoc);
  assert.equal(dynamicQuestions.length, 2);
  assert.equal(dynamicQuestions[0].docId, 'kb-custom-redis-locks');
  assert.ok(dynamicQuestions[0].questionFa.includes('قفل‌های توزیع‌شده'));
  assert.ok(dynamicQuestions[0].options.length === 4);
});

test('Knowledge Quiz: evaluateQuizAnswer awards XP on correct answer and zero XP on incorrect answer', () => {
  const sampleQuestion = CURATED_KNOWLEDGE_QUIZ_BANK[0];
  const correctIdx = sampleQuestion.correctOptionIndex;
  const incorrectIdx = (correctIdx + 1) % 4;

  // Correct answer
  const correctResult = evaluateQuizAnswer(sampleQuestion, correctIdx);
  assert.equal(correctResult.isCorrect, true);
  assert.equal(correctResult.earnedXp, sampleQuestion.xpReward);
  assert.equal(correctResult.correctOptionIndex, correctIdx);
  assert.ok(correctResult.explanationFa.length > 5);

  // Incorrect answer
  const incorrectResult = evaluateQuizAnswer(sampleQuestion, incorrectIdx);
  assert.equal(incorrectResult.isCorrect, false);
  assert.equal(incorrectResult.earnedXp, 0);
  assert.equal(incorrectResult.correctOptionIndex, correctIdx);
});

test('Knowledge Quiz: calculateQuizScoreSummary aggregates accuracy, earned XP, and mastery rank tier', () => {
  const sampleQuestions = CURATED_KNOWLEDGE_QUIZ_BANK.slice(0, 3);
  const q0 = sampleQuestions[0];
  const q1 = sampleQuestions[1];
  const q2 = sampleQuestions[2];

  // Perfect score
  const perfectSummary = calculateQuizScoreSummary(sampleQuestions, {
    [q0.id]: q0.correctOptionIndex,
    [q1.id]: q1.correctOptionIndex,
    [q2.id]: q2.correctOptionIndex,
  });
  assert.equal(perfectSummary.totalQuestions, 3);
  assert.equal(perfectSummary.correctCount, 3);
  assert.equal(perfectSummary.accuracyPercent, 100);
  assert.equal(perfectSummary.earnedXp, q0.xpReward + q1.xpReward + q2.xpReward);
  assert.equal(perfectSummary.masteryTierEn, 'Principal Antigravity Auditor');
  assert.equal(perfectSummary.passed, true);

  // Partial score (1 correct, 2 incorrect)
  const partialSummary = calculateQuizScoreSummary(sampleQuestions, {
    [q0.id]: q0.correctOptionIndex,
    [q1.id]: (q1.correctOptionIndex + 1) % 4,
    [q2.id]: (q2.correctOptionIndex + 1) % 4,
  });
  assert.equal(partialSummary.correctCount, 1);
  assert.equal(partialSummary.incorrectCount, 2);
  assert.equal(partialSummary.accuracyPercent, 33);
  assert.equal(partialSummary.earnedXp, q0.xpReward);
  assert.equal(partialSummary.masteryTierEn, 'Knowledge Base Trainee');
});

test('Pomodoro Timer: formatTimerDisplay formats mm:ss correctly and formatDeepWorkDuration formats minutes and hours', () => {
  assert.equal(formatTimerDisplay(1500), '25:00');
  assert.equal(formatTimerDisplay(3000), '50:00');
  assert.equal(formatTimerDisplay(300), '05:00');
  assert.equal(formatTimerDisplay(45), '00:45');
  assert.equal(formatTimerDisplay(0), '00:00');

  assert.equal(formatDeepWorkDuration(25), '25m');
  assert.equal(formatDeepWorkDuration(50), '50m');
  assert.equal(formatDeepWorkDuration(60), '1.0h');
  assert.equal(formatDeepWorkDuration(90), '1.5h');
  assert.equal(formatDeepWorkDuration(150), '2.5h');
});

test('Pomodoro Timer: calculateDeepWorkXp awards XP based on duration and session mode', () => {
  // Focus: 2.5 XP per min
  assert.equal(calculateDeepWorkXp(25, 'focus'), 63);
  // Deep Work: 3 XP per min
  assert.equal(calculateDeepWorkXp(50, 'deep-work'), 150);
  // Break: 0 XP
  assert.equal(calculateDeepWorkXp(5, 'short-break'), 0);
});

test('Pomodoro Timer: recordDeepWorkSession, module summaries, and total stats track deep work accurately', () => {
  const initialLogs: DeepWorkLogEntry[] = [];
  const session1 = recordDeepWorkSession(initialLogs, {
    moduleId: 'module-1',
    moduleNumber: 1,
    moduleTitleFa: 'معماری هسته Agent-First',
    moduleTitleEn: 'Agent-First Core Architecture',
    durationMinutes: 25,
    mode: 'focus',
    notes: 'Supercomplete & Tab-to-Jump review',
  });

  assert.equal(session1.updatedLogs.length, 1);
  assert.equal(session1.createdEntry.durationMinutes, 25);
  assert.equal(session1.createdEntry.xpEarned, 63);
  assert.equal(session1.createdEntry.moduleId, 'module-1');

  const session2 = recordDeepWorkSession(session1.updatedLogs, {
    moduleId: 'module-1',
    moduleNumber: 1,
    moduleTitleFa: 'معماری هسته Agent-First',
    moduleTitleEn: 'Agent-First Core Architecture',
    durationMinutes: 50,
    mode: 'deep-work',
  });

  const session3 = recordDeepWorkSession(session2.updatedLogs, {
    moduleId: 'module-2',
    moduleNumber: 2,
    moduleTitleFa: 'مهندسی مبتنی بر آرتیفکت',
    moduleTitleEn: 'Artifact-Driven Engineering',
    durationMinutes: 45,
    mode: 'focus',
  });

  assert.equal(session3.updatedLogs.length, 3);

  // Module summaries
  const summaries = calculateModuleDeepWorkSummaries(session3.updatedLogs);
  assert.ok(summaries['module-1']);
  assert.equal(summaries['module-1'].totalMinutes, 75); // 25 + 50
  assert.equal(summaries['module-1'].sessionsCount, 2);
  assert.equal(summaries['module-1'].totalHoursFormatted, '1.3h');

  assert.ok(summaries['module-2']);
  assert.equal(summaries['module-2'].totalMinutes, 45);
  assert.equal(summaries['module-2'].sessionsCount, 1);

  // Overall stats
  const totalStats = calculateTotalDeepWorkStats(session3.updatedLogs);
  assert.equal(totalStats.totalMinutes, 120); // 75 + 45
  assert.equal(totalStats.totalHoursFormatted, '2.0h');
  assert.equal(totalStats.totalSessions, 3);
  assert.equal(totalStats.activeModulesCount, 2);
  assert.ok(totalStats.topModuleTitleFa.includes('فصل 1'));

  // Serialization & parsing
  const serialized = serializeDeepWorkLogsToStorage(session3.updatedLogs);
  const parsed = parseDeepWorkLogsFromStorage(serialized);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].moduleId, 'module-2');
});

test('i18n Translations: getTranslation returns correct strings for both Persian and English with interpolation', () => {
  // 1. Navigation and Brand
  assert.equal(getTranslation('fa', 'brandTitle'), 'Google Antigravity Academy');
  assert.equal(getTranslation('en', 'brandTitle'), 'Google Antigravity Academy');
  assert.equal(getTranslation('fa', 'navAcademy'), 'آکادمی (۸ فصل)');
  assert.equal(getTranslation('en', 'navAcademy'), 'Curriculum (8 Modules)');

  // 2. Interpolation test
  const faModule = getTranslation('fa', 'moduleBadge', { num: '02' });
  assert.equal(faModule, 'فصل ۰02 از ۰۸');

  const enModule = getTranslation('en', 'moduleBadge', { num: '02' });
  assert.equal(enModule, 'Module 002 of 08');

  const toastFa = getTranslation('fa', 'deepWorkLoggedToast', { mins: 25, num: 1, xp: 63 });
  assert.ok(toastFa.includes('25 دقیقه کار عمیق'));
  assert.ok(toastFa.includes('+63 XP'));

  const toastEn = getTranslation('en', 'deepWorkLoggedToast', { mins: 25, num: 1, xp: 63 });
  assert.ok(toastEn.includes('25 mins of Deep Work'));
  assert.ok(toastEn.includes('+63 XP'));

  // 3. Direction resolution
  assert.equal(getLayoutDirection('fa'), 'rtl');
  assert.equal(getLayoutDirection('en'), 'ltr');
});

test('Curriculum English Content: getEnglishModuleContent returns complete English summaries and takeaways for all 8 modules', () => {
  for (let modNum = 1; modNum <= 8; modNum++) {
    const modId = `module-${modNum}`;
    const enContent = getEnglishModuleContent(modId);
    assert.ok(enContent, `English content must exist for ${modId}`);
    assert.ok(enContent.summaryEn.length > 20, `Summary must be non-empty for ${modId}`);
    assert.ok(enContent.keyTakeaways.length >= 3, `Key takeaways must exist for ${modId}`);
    assert.ok(enContent.keyTakeaways[0].titleEn.length > 0);
  }
});

test('Activity Logger: createSectionChangeEvent, appendSectionChangeEvent, stats, filtering, and localStorage persistence track section_change events accurately', () => {
  const sampleModules = [
    {
      id: 'module-1',
      number: 1,
      titleFa: 'معماری هسته Agent-First',
      titleEn: 'Agent-First Core Architecture',
    },
    {
      id: 'module-3',
      number: 3,
      titleFa: 'حالت‌های اجرای خودمختار و سیاست‌های ترمینال',
      titleEn: 'Autonomy Modes & Terminal Policies',
    },
  ];

  // 1. Initial curriculum event
  const evt1 = createSectionChangeEvent({
    fromSection: null,
    toSection: 'curriculum',
    moduleId: 'module-1',
    timestampIso: '2026-11-01T08:00:00.000Z',
    modules: sampleModules,
  });
  assert.equal(evt1.eventType, 'section_change');
  assert.equal(evt1.toSection, 'curriculum');
  assert.equal(evt1.moduleId, 'module-1');
  assert.equal(evt1.badgeCode, 'MOD-01');
  assert.equal(evt1.category, 'curriculum');
  assert.ok(evt1.targetTitleEn.includes('Module 1: Agent-First Core Architecture'));

  let logs: NavigationActivityEvent[] = appendSectionChangeEvent([], evt1);
  assert.equal(logs.length, 1);

  // Deduplicate identical consecutive section_change
  logs = appendSectionChangeEvent(logs, evt1);
  assert.equal(logs.length, 1);

  // 2. Navigate to Mission Control Simulator studio
  const evt2 = createSectionChangeEvent({
    fromSection: 'curriculum',
    toSection: 'simulator',
    timestampIso: '2026-11-01T08:05:00.000Z',
    modules: sampleModules,
  });
  assert.equal(evt2.eventType, 'section_change');
  assert.equal(evt2.category, 'studio');
  assert.equal(evt2.badgeCode, 'STUDIO-SIMULATOR');
  logs = appendSectionChangeEvent(logs, evt2);
  assert.equal(logs.length, 2);
  assert.equal(logs[0].toSection, 'simulator');

  // 3. Navigate to curriculum module 3
  const evt3 = createSectionChangeEvent({
    fromSection: 'simulator',
    toSection: 'curriculum',
    moduleId: 'module-3',
    timestampIso: '2026-11-01T08:10:00.000Z',
    modules: sampleModules,
  });
  logs = appendSectionChangeEvent(logs, evt3);
  assert.equal(logs.length, 3);

  // 4. Summary stats (Total Session Time & Most Visited Section)
  const emptyStats = calculateActivityLogStats([]);
  assert.equal(emptyStats.totalEvents, 0);
  assert.equal(emptyStats.topSection, null);
  assert.equal(emptyStats.topSectionCount, 0);
  assert.equal(emptyStats.totalSessionTimeSeconds, 0);
  assert.equal(emptyStats.totalSessionTimeFormatted, '0m 0s');
  assert.equal(emptyStats.activeSessionsCount, 0);

  const stats = calculateActivityLogStats(logs);
  assert.equal(stats.totalEvents, 3);
  assert.equal(stats.uniqueSectionsCount, 2);
  assert.equal(stats.topSection, 'curriculum');
  assert.equal(stats.topSectionCount, 2);
  assert.equal(stats.topSectionTitleEn, 'Curriculum (8 Modules)');
  assert.equal(stats.topSectionBadgeCode, 'SEC-CURRICULUM');
  assert.equal(stats.totalSessionTimeSeconds, 600); // 08:00 -> 08:05 (300s) + 08:05 -> 08:10 (300s)
  assert.equal(stats.totalSessionTimeFormatted, '10m 0s');
  assert.equal(stats.activeSessionsCount, 1);
  assert.equal(stats.lastEventIso, '2026-11-01T08:10:00.000Z');

  assert.equal(formatSessionDuration(0), '0m 0s');
  assert.equal(formatSessionDuration(45), '0m 45s');
  assert.equal(formatSessionDuration(5400), '1h 30m');
  assert.equal(formatSessionDuration(5415), '1h 30m 15s');

  const seededEvents = buildSeedNavigationActivityEvents(sampleModules);
  const seededStats = calculateActivityLogStats(seededEvents);
  assert.equal(seededStats.totalEvents, 6);
  assert.equal(seededStats.topSection, 'curriculum');
  assert.equal(seededStats.topSectionCount, 2);
  assert.equal(seededStats.totalSessionTimeSeconds, 5400); // 25m + 30m + 35m = 90m
  assert.equal(seededStats.totalSessionTimeFormatted, '1h 30m');
  assert.equal(seededStats.activeSessionsCount, 3);

  // 5. Filter by category, section name (EN & FA), and date (ISO YYYY-MM-DD & formatted)
  const studioOnly = filterActivityLogEvents(logs, 'studio', '');
  assert.equal(studioOnly.length, 1);
  assert.equal(studioOnly[0].toSection, 'simulator');

  const searchMod3 = filterActivityLogEvents(logs, 'all', 'MOD-03');
  assert.equal(searchMod3.length, 1);
  assert.equal(searchMod3[0].moduleId, 'module-3');

  const searchSectionEn = filterActivityLogEvents(logs, 'all', 'Mission Control Simulator');
  assert.equal(searchSectionEn.length, 2); // evt2 (toSection) and evt3 (fromSection)

  const searchSectionFa = filterActivityLogEvents(logs, 'all', 'شبیه‌ساز زنده');
  assert.equal(searchSectionFa.length, 2);

  // Add an event on a different date to verify date filtering
  const evtDifferentDate = createSectionChangeEvent({
    fromSection: 'curriculum',
    toSection: 'guardrails',
    timestampIso: '2026-10-25T14:30:00.000Z',
    modules: sampleModules,
  });
  const logsWithMultiDates = appendSectionChangeEvent(logs, evtDifferentDate);
  assert.equal(logsWithMultiDates.length, 4);

  const filterByOctDate = filterActivityLogEvents(logsWithMultiDates, 'all', '2026-10-25');
  assert.equal(filterByOctDate.length, 1);
  assert.equal(filterByOctDate[0].toSection, 'guardrails');

  const filterByNovDate = filterActivityLogEvents(logsWithMultiDates, 'all', '2026-11-01');
  assert.equal(filterByNovDate.length, 3);

  const filterByPersianDigitsDate = filterActivityLogEvents(logsWithMultiDates, 'all', '۲۰۲۶-۱۰-۲۵');
  assert.equal(filterByPersianDigitsDate.length, 1);
  assert.equal(filterByPersianDigitsDate[0].toSection, 'guardrails');

  const dateDisplay = formatActivityDateDisplay('2026-11-01T08:10:00.000Z', 'en');
  assert.equal(dateDisplay.isoDate, '2026-11-01');
  assert.equal(normalizeDigitsToAscii('۱۴۰۵/۰۸/۱۰'), '1405/08/10');

  // 5b. Date Range Picker filtering (Start Date / End Date) across seeded multi-date events
  // seededEvents has 2 events on 2026-10-28, 2 events on 2026-10-29, and 2 events on 2026-10-30
  const startOnlyFiltered = filterActivityLogEvents(seededEvents, 'all', '', '2026-10-29', '');
  assert.equal(startOnlyFiltered.length, 4); // 2026-10-29 (2) + 2026-10-30 (2)

  const endOnlyFiltered = filterActivityLogEvents(seededEvents, 'all', '', '', '2026-10-29');
  assert.equal(endOnlyFiltered.length, 4); // 2026-10-28 (2) + 2026-10-29 (2)

  const exactSingleDayRange = filterActivityLogEvents(
    seededEvents,
    'all',
    '',
    '2026-10-29',
    '2026-10-29'
  );
  assert.equal(exactSingleDayRange.length, 2);
  assert.equal(
    exactSingleDayRange.every((e) => e.timestampIso.startsWith('2026-10-29')),
    true
  );

  const combinedRangeAndCategory = filterActivityLogEvents(
    seededEvents,
    'studio',
    '',
    '2026-10-29',
    '2026-10-30'
  );
  assert.equal(combinedRangeAndCategory.length, 3);
  assert.equal(
    combinedRangeAndCategory.every((e) => e.category === 'studio'),
    true
  );

  const outOfBoundsRange = filterActivityLogEvents(
    seededEvents,
    'all',
    '',
    '2026-12-01',
    '2026-12-31'
  );
  assert.equal(outOfBoundsRange.length, 0);

  // 6. Date-by-section aggregation for Recharts bar chart
  const chartAgg = aggregateActivityEventsByDateAndSection(logsWithMultiDates);
  assert.equal(chartAgg.totalEvents, 4);
  assert.equal(chartAgg.totalDates, 2);
  assert.equal(chartAgg.data.length, 2);
  assert.equal(chartAgg.data[0].date, '2026-10-25');
  assert.equal(chartAgg.data[0].guardrails, 1);
  assert.equal(chartAgg.data[0].total, 1);
  assert.equal(chartAgg.data[1].date, '2026-11-01');
  assert.equal(chartAgg.data[1].curriculum, 2);
  assert.equal(chartAgg.data[1].simulator, 1);
  assert.equal(chartAgg.data[1].total, 3);
  assert.equal(chartAgg.activeSections.length, 3);
  assert.equal(
    chartAgg.activeSections.some((s) => s.sectionId === 'curriculum' && s.count === 2),
    true
  );

  // 7. Serialization & restoration
  const rawJson = serializeActivityLogsToStorage(logs);
  const restored = parseActivityLogsFromStorage(rawJson);
  assert.equal(restored.length, 3);
  assert.equal(restored[0].id, evt3.id);
  assert.deepEqual(parseActivityLogsFromStorage('invalid-json'), []);
});

test('3D Cyber-Defense Game Engine: state transitions, 3 enemy archetypes with windup telegraphs, combat physics, and wave progression work deterministically', () => {
  // 1. Delta time clamping per Three.js game guidelines
  assert.equal(clampDeltaTime(0.016), 0.016);
  assert.equal(clampDeltaTime(0.5), 0.05);
  assert.equal(clampDeltaTime(-1), 0);

  // 2. Title screen state initialization & starting session
  const titleState = createInitialCyberArenaState('title');
  assert.equal(titleState.status, 'title');
  assert.equal(titleState.enemies.length, 0);

  const playingState = startCyberGameSession(titleState);
  assert.equal(playingState.status, 'playing');
  assert.equal(playingState.wave, 1);
  assert.ok(playingState.enemies.length >= 5);

  // Verify all 3 required enemy archetypes exist in Wave 1 ('swarmer', 'ranged', 'charger')
  const wave1Enemies = spawnWaveEnemies(1);
  const archetypes = new Set(wave1Enemies.map((e) => e.archetype));
  assert.equal(archetypes.has('swarmer'), true);
  assert.equal(archetypes.has('ranged'), true);
  assert.equal(archetypes.has('charger'), true);

  // 3. Pause and Resume state toggle
  const pausedState = toggleCyberGamePause(playingState);
  assert.equal(pausedState.status, 'paused');
  const resumedState = toggleCyberGamePause(pausedState);
  assert.equal(resumedState.status, 'playing');

  // 4. Player movement, Quantum Dash, and primary laser fire
  const stepped = stepCyberArenaSimulation(resumedState, 0.03, {
    moveX: 1,
    moveZ: 0,
    fireHeld: true,
    dashPressed: true,
    pulsePressed: false,
  });
  assert.ok(stepped.player.x > 0);
  assert.ok(stepped.player.dashCooldown > 0);
  assert.equal(stepped.projectiles.length, 1);
  assert.equal(stepped.events.some((ev) => ev.type === 'dash'), true);

  // 5. EMP Pulse Blast damages nearby enemies and triggers wave progression when wave is cleared
  const nearEnemyState = createInitialCyberArenaState('playing');
  nearEnemyState.enemies = [
    {
      id: 'test-swarmer-1',
      archetype: 'swarmer',
      x: 2.0,
      z: 0,
      vx: 0,
      vz: 0,
      facingAngle: 0,
      hp: 30,
      maxHp: 50,
      radius: 0.95,
      phase: 'pursue',
      phaseTimer: 0,
      chargeDirX: 0,
      chargeDirZ: 0,
      hitFlashTimer: 0,
      scoreValue: 150,
    },
  ];
  const afterPulse = stepCyberArenaSimulation(nearEnemyState, 0.02, {
    moveX: 0,
    moveZ: 0,
    fireHeld: false,
    dashPressed: false,
    pulsePressed: true,
  });
  assert.equal(afterPulse.kills, 1);
  assert.equal(afterPulse.wave, 2);
  assert.ok(afterPulse.score >= 150);
  assert.equal(afterPulse.events.some((ev) => ev.type === 'wave_cleared'), true);
});

test('Quick Study Mode: state transitions collapse sidebars and switch to curriculum reading with reading time estimates', () => {
  // 1. Activating study mode collapses sidebar and forces curriculum view
  const activated = computeQuickStudyModeTransition(false, 'simulator');
  assert.equal(activated.isStudyMode, true);
  assert.equal(activated.sidebarOpen, false);
  assert.equal(activated.activeSection, 'curriculum');

  // 2. Exiting study mode restores standard mode
  const exited = computeQuickStudyModeTransition(true, 'curriculum');
  assert.equal(exited.isStudyMode, false);
  assert.equal(exited.sidebarOpen, true);
  assert.equal(exited.activeSection, 'curriculum');

  // 3. Module reading time estimates
  const m1Estimate = computeReadingEstimateForModule(1);
  assert.equal(m1Estimate.estimatedMinutes, 10);
  assert.ok(m1Estimate.labelFa.includes('دقیقه'));
  assert.ok(m1Estimate.labelEn.includes('min'));

  const m5Estimate = computeReadingEstimateForModule(5);
  assert.equal(m5Estimate.estimatedMinutes, 16);
});

test('Font Loading & Zero-CLS Optimization: index.html preloads WOFF2 font files and index.css enforces font-display: swap with metric-adjusted fallbacks', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  // 1. Verify index.html preloads Vazirmatn and JetBrains Mono WOFF2 files
  const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  assert.equal(indexHtml.includes('rel="preload"'), true);
  assert.equal(indexHtml.includes('href="/fonts/vazirmatn-arabic.woff2"'), true);
  assert.equal(indexHtml.includes('href="/fonts/vazirmatn-latin.woff2"'), true);
  assert.equal(indexHtml.includes('href="/fonts/jetbrains-mono-latin.woff2"'), true);
  assert.equal(indexHtml.includes('as="font"'), true);
  assert.equal(indexHtml.includes('type="font/woff2"'), true);

  // 2. Verify physical WOFF2 font files exist in public/fonts and have valid wOF2 header
  const fontFiles = [
    'public/fonts/vazirmatn-arabic.woff2',
    'public/fonts/vazirmatn-latin.woff2',
    'public/fonts/jetbrains-mono-latin.woff2',
  ];
  for (const relFontPath of fontFiles) {
    const fullPath = path.resolve(process.cwd(), relFontPath);
    assert.equal(fs.existsSync(fullPath), true, `${relFontPath} must exist`);
    const buf = fs.readFileSync(fullPath);
    assert.equal(buf.length > 10000, true, `${relFontPath} must be a valid non-empty WOFF2 binary`);
    assert.equal(buf.subarray(0, 4).toString('ascii'), 'wOF2', `${relFontPath} must start with wOF2 signature`);
  }

  // 3. Verify src/index.css implements @font-face with font-display: swap and CLS fallback overrides
  const indexCssPath = path.resolve(process.cwd(), 'src/index.css');
  const indexCss = fs.readFileSync(indexCssPath, 'utf-8');
  assert.equal(indexCss.includes("font-family: 'Vazirmatn';"), true);
  assert.equal(indexCss.includes("font-family: 'JetBrains Mono';"), true);
  assert.equal(indexCss.includes('font-display: swap;'), true);
  assert.equal(indexCss.includes("font-family: 'Vazirmatn Fallback';"), true);
  assert.equal(indexCss.includes("font-family: 'JetBrains Mono Fallback';"), true);
  assert.equal(indexCss.includes('ascent-override:'), true);
  assert.equal(indexCss.includes('descent-override:'), true);
  assert.equal(indexCss.includes('@theme'), true);
  assert.equal(indexCss.includes('font-variant-numeric: tabular-nums'), true);
  assert.equal(indexCss.includes('font-feature-settings: "tnum" 1'), true);
  assert.equal(indexCss.includes('--tracking-ui:'), true);
  assert.equal(indexCss.includes('--tracking-heading:'), true);
  assert.equal(indexCss.includes('--tracking-numeric: 0em'), true);
  assert.equal(indexCss.includes('[dir="rtl"] .tabular-nums'), true);
});

test('Bidi Typography, Number Localization & RTL/LTR Isolation: normalizes Persian digits and isolates LTR technical parentheticals', async () => {
  const {
    toPersianDigits,
    formatLocalizedNumber,
    formatLocalizedReadingTime,
    formatLocalizedDifficulty,
    stabilizeBidiString,
    renderBidiText,
  } = await import('./bidiText');

  // 1. Digit conversion & zero-padded module numbers
  assert.equal(toPersianDigits(18), '۱۸');
  assert.equal(formatLocalizedNumber(1, 'fa', false), '۱');
  assert.equal(formatLocalizedNumber(1, 'fa', true), '۰۱');
  assert.equal(formatLocalizedNumber(1, 'en', true), '01');

  // 2. Reading time & difficulty localization
  assert.equal(formatLocalizedReadingTime('18 min read', 'fa'), '۱۸ دقیقه مطالعه');
  assert.equal(formatLocalizedReadingTime('18 min read', 'en'), '18 min read');
  assert.equal(formatLocalizedDifficulty('Foundation & Architecture', 'fa'), 'مبانی و معماری پایه');

  // 3. Stabilizing leading numerals in Persian headings
  const normalizedTitle = stabilizeBidiString('1. معماری هسته و فلسفه Agent-First', 'fa');
  assert.equal(normalizedTitle.startsWith('۱. '), true);

  // 4. Bidi React nodes isolate parenthetical English phrases like (Asynchronous Agent-First Engineering) and (Task & Artifact-Centric)
  const nodes = renderBidiText(
    'گذار بنیادین به ارکستریشن ناهمگام چندایجنتی (Asynchronous Agent-First Engineering) و تسک مهندسی (Task & Artifact-Centric) در پلتفرم',
    'fa'
  );
  assert.equal(Array.isArray(nodes), true);
  const serialized = JSON.stringify(nodes);
  assert.equal(serialized.includes('(Asynchronous Agent-First Engineering)'), true);
  assert.equal(serialized.includes('(Task & Artifact-Centric)'), true);
  assert.equal(serialized.includes('bidi-ltr-run'), true);

  // 5. Mixed Persian parenthetical (با فشردن Tab) is NOT wrapped as a whole LTR parenthetical, only 'Tab' is isolated
  const mixedNodes = renderBidiText('گام دوم (با فشردن Tab): کرسر به فایل اسکیما پریده.', 'fa');
  const mixedSerialized = JSON.stringify(mixedNodes);
  assert.equal(mixedSerialized.includes('(با فشردن '), true);
  assert.equal(mixedSerialized.includes('"children":"Tab"'), true);

  // 6. Comma-separated English list stays together as one LTR run
  const listNodes = renderBidiText('Supercomplete, Tab-to-Jump, Cmd/Ctrl + I', 'fa');
  const listSerialized = JSON.stringify(listNodes);
  assert.equal(listSerialized.includes('"children":"Supercomplete, Tab-to-Jump, Cmd/Ctrl + I"'), true);
});

test('Breadcrumb Tooltips: buildBreadcrumbDescriptorWithTooltips generates full hierarchical paths and module/workspace descriptions in FA and EN', async () => {
  const { buildBreadcrumbDescriptorWithTooltips } = await import('./generators');

  const sampleModule = {
    number: 1,
    titleFa: 'معماری هسته و فلسفه Agent-First',
    titleEn: 'Core Architecture: Editor View vs. Agent Manager',
    summaryFa: 'گذار بنیادین از کدنویسی خط‌به‌خط سنکرون به ارکستریشن ناهمگام چندایجنتی.',
    summaryEn: 'Fundamental shift from synchronous coding to asynchronous multi-agent orchestration.',
    readingTime: '18 min read',
    difficulty: 'Principal Foundation',
  };

  // 1. Curriculum in Persian
  const faCurriculum = buildBreadcrumbDescriptorWithTooltips({
    activeSection: 'curriculum',
    language: 'fa',
    currentModule: sampleModule,
    formattedModNumber: '۰۱',
  });
  assert.equal(faCurriculum.group, 'سرفصل‌های آموزشی');
  assert.equal(faCurriculum.subgroup, 'گام اول · معماری هسته و اجرا');
  assert.equal(faCurriculum.item, 'فصل ۰۱: معماری هسته و فلسفه Agent-First');
  assert.equal(
    faCurriculum.fullPath,
    'سرفصل‌های آموزشی / گام اول · معماری هسته و اجرا / فصل ۰۱: معماری هسته و فلسفه Agent-First'
  );
  assert.equal(faCurriculum.itemTooltip.description, sampleModule.summaryFa);
  assert.equal(faCurriculum.itemTooltip.badge, 'MOD-01');
  assert.equal(faCurriculum.itemTooltip.meta, 'Principal Foundation · 18 min read');

  // 2. Curriculum in English
  const enCurriculum = buildBreadcrumbDescriptorWithTooltips({
    activeSection: 'curriculum',
    language: 'en',
    currentModule: sampleModule,
    formattedModNumber: '01',
  });
  assert.equal(enCurriculum.group, 'Curriculum');
  assert.equal(enCurriculum.item, 'Module 01: Core Architecture: Editor View vs. Agent Manager');
  assert.equal(enCurriculum.itemTooltip.description, sampleModule.summaryEn);

  // 3. Engineering Studios (Simulator)
  const faStudio = buildBreadcrumbDescriptorWithTooltips({
    activeSection: 'simulator',
    language: 'fa',
    currentModule: sampleModule,
    formattedModNumber: '۰۱',
  });
  assert.equal(faStudio.group, 'استودیوهای مهندسی زنده');
  assert.equal(faStudio.item, 'شبیه‌ساز Mission Control');
  assert.equal(faStudio.itemTooltip.badge, 'Live IDE');
  assert.equal(faStudio.itemTooltip.description.includes('Editor View'), true);
});

test('Sidebar Module Path Graph: buildSidebarModulePathGraph builds curved cubic-Bezier connected path with completed, active, and pending chapter states', async () => {
  const { buildSidebarModulePathGraph } = await import('./generators');

  const sampleModules = Array.from({ length: 8 }, (_, idx) => ({
    id: `module-${idx + 1}`,
    number: idx + 1,
    titleFa: `فصل ${idx + 1}`,
    titleEn: `Chapter ${idx + 1}`,
  }));

  const graph = buildSidebarModulePathGraph({
    modules: sampleModules,
    completedModules: ['module-1', 'module-2'],
    activeModuleId: 'module-3',
    activeSection: 'curriculum',
  });

  assert.equal(graph.nodes.length, 8);
  assert.equal(graph.segments.length, 7);
  assert.equal(graph.fullTrackPathD.startsWith('M 28 24 C '), true);

  // Verify states
  assert.equal(graph.nodes[0].status, 'completed');
  assert.equal(graph.nodes[1].status, 'completed');
  assert.equal(graph.nodes[2].status, 'active');
  assert.equal(graph.nodes[3].status, 'pending');
  assert.equal(graph.nodes[7].status, 'pending');

  // Verify counts
  assert.deepEqual(graph.counts, {
    completed: 2,
    active: 1,
    pending: 5,
    total: 8,
  });

  // Verify curved SVG path segments use cubic Bezier 'C' commands
  for (const seg of graph.segments) {
    assert.equal(seg.pathD.startsWith('M '), true);
    assert.equal(seg.pathD.includes(' C '), true);
  }

  // Segment 1->2 is between two completed nodes => completed
  assert.equal(graph.segments[0].status, 'completed');
  // Segment 2->3 connects completed module-2 to active module-3 => active
  assert.equal(graph.segments[1].status, 'active');
  // Segment 3->4 connects active module-3 to pending module-4 => active
  assert.equal(graph.segments[2].status, 'active');
  // Segment 4->5 connects pending module-4 to pending module-5 => pending
  assert.equal(graph.segments[3].status, 'pending');
});

test('Module Quick Overview: buildModuleQuickOverviewPrompt, buildDeterministicModuleQuickOverview, and normalizeAiQuickOverviewResponse synthesize core engineering takeaways across lenses and languages', async () => {
  const {
    buildModuleQuickOverviewPrompt,
    buildDeterministicModuleQuickOverview,
    normalizeAiQuickOverviewResponse,
  } = await import('./generators');

  const sampleMod = {
    id: 'module-1',
    number: 1,
    titleFa: 'معماری هسته و فلسفه Agent-First',
    titleEn: 'Core Architecture: Editor View vs. Agent Manager',
    summaryFa: 'گذار بنیادین از کدنویسی خط‌به‌خط سنکرون به ارکستریشن ناهمگام چندایجنتی.',
    summaryEn: 'Fundamental shift from synchronous coding to asynchronous multi-agent orchestration.',
    difficulty: 'Principal Foundation',
    readingTime: '18 min read',
    keyTakeaways: [
      {
        titleFa: 'تفکیک محیط کاربری دوگانه',
        descFa: 'جدا کردن محیط ویرایش جراحی کد از مرکز فرماندهی ایجنت‌های موازی.',
        titleEn: 'Dual Workspace Separation',
        descEn: 'Separating surgical synchronous editing from asynchronous Mission Control.',
        metricOrBadge: 'Editor View + Mission Control',
      },
      {
        titleFa: 'موتور پیش‌بینی Supercomplete',
        descFa: 'پیش‌بینی تغییرات چندخطی و چندفایلی بر اساس گراف وابستگی LSP.',
        titleEn: 'Supercomplete Engine',
        descEn: 'Predicting multi-line and cross-file diffs via LSP dependency graphs.',
        metricOrBadge: 'LSP + Diff-History Aware',
      },
    ],
    subSections: [
      {
        id: 'm1-s1',
        titleFa: '۱.۱ پارادایم شیفت',
        titleEn: '1.1 Paradigm Shift',
        bulletPoints: [
          {
            termEn: 'Tab-to-Jump',
            descFa: 'پرش هوشمند بین فایل‌های وابسته.',
            descEn: 'Intelligent cursor jump across dependent files.',
          },
        ],
      },
    ],
  };

  // 1. Prompt builder includes module title, lens focus, and takeaways
  const promptFa = buildModuleQuickOverviewPrompt({
    module: sampleMod,
    lens: 'security-guardrails',
    language: 'fa',
  });
  assert.equal(promptFa.includes('Core Architecture: Editor View vs. Agent Manager'), true);
  assert.equal(promptFa.includes('Zero-Trust Security'), true);
  assert.equal(promptFa.includes('Editor View + Mission Control'), true);

  // 2. Deterministic synthesis produces 3 takeaways in Persian and English
  const faOverview = buildDeterministicModuleQuickOverview({
    module: sampleMod,
    lens: 'principal-synthesis',
    language: 'fa',
  });
  assert.equal(faOverview.moduleId, 'module-1');
  assert.equal(faOverview.takeaways.length, 3);
  assert.equal(faOverview.takeaways[0].principleBadge, 'Editor View + Mission Control');
  assert.equal(faOverview.coreEngineeringPrinciple.includes('Editor View + Mission Control'), true);

  const enGuardrails = buildDeterministicModuleQuickOverview({
    module: sampleMod,
    lens: 'security-guardrails',
    language: 'en',
  });
  assert.equal(enGuardrails.language, 'en');
  assert.equal(enGuardrails.takeaways.length, 3);
  assert.equal(enGuardrails.takeaways[0].title.includes('Policy Enforcement'), true);

  // 3. Normalizer validates AI response and falls back safely on malformed input
  const normalizedLive = normalizeAiQuickOverviewResponse(
    {
      executiveHeadline: 'Custom AI Executive Headline for Module 01',
      coreEngineeringPrinciple: 'Custom AI Core Engineering Principle for Agent-First IDE',
      takeaways: [
        {
          principleBadge: 'LSP Graph',
          title: 'AI Takeaway 1',
          takeaway: 'Actionable engineering takeaway 1 from Gemini.',
          impactMetric: '10x Velocity',
        },
        {
          principleBadge: 'Mission Control',
          title: 'AI Takeaway 2',
          takeaway: 'Actionable engineering takeaway 2 from Gemini.',
          impactMetric: 'Zero Blocking',
        },
      ],
      modelUsed: 'gemini-3.8-flash',
      source: 'ai-live',
    },
    enGuardrails
  );
  assert.equal(normalizedLive.source, 'ai-live');
  assert.equal(normalizedLive.executiveHeadline, 'Custom AI Executive Headline for Module 01');
  assert.equal(normalizedLive.takeaways.length, 2);
  assert.equal(normalizedLive.takeaways[0].principleBadge, 'LSP Graph');

  const fallbackResult = normalizeAiQuickOverviewResponse(null, faOverview);
  assert.equal(fallbackResult.executiveHeadline, faOverview.executiveHeadline);
});

test('Knowledge Base Context Awareness & MCP Drift Auditor: buildKbContextAwarenessPrompt, buildDeterministicKbContextAwareness, and normalizeAiKbContextAwarenessResponse detect MCP configuration drifts across profiles and languages', async () => {
  const {
    buildInitialKnowledgeBaseEntries,
    buildKbContextAwarenessPrompt,
    buildDeterministicKbContextAwareness,
    normalizeAiKbContextAwarenessResponse,
  } = await import('./generators');

  const seededEntries = buildInitialKnowledgeBaseEntries(null, null);
  const mcpEntry =
    seededEntries.find((e) => e.category === 'mcp-schema') || seededEntries[0];
  const staleEntry =
    seededEntries.find((e) => e.stalenessPercent >= 65) || seededEntries[1];

  // 1. Prompt builder includes entry keyPath, baseline profile, and content snippet
  const prompt = buildKbContextAwarenessPrompt({
    entry: mcpEntry,
    baselineProfile: 'sse-remote-zero-trust',
    language: 'fa',
  });
  assert.equal(prompt.includes(mcpEntry.keyPath), true);
  assert.equal(prompt.includes('sse-remote-zero-trust'), true);

  // 2. Deterministic audit detects SSE transport drift when entry uses local stdio
  const sseAuditFa = buildDeterministicKbContextAwareness({
    entry: mcpEntry,
    baselineProfile: 'sse-remote-zero-trust',
    language: 'fa',
  });
  assert.equal(sseAuditFa.entryId, mcpEntry.id);
  assert.equal(sseAuditFa.driftFindings.length, 3);
  assert.equal(
    sseAuditFa.driftFindings[0].parameterPath,
    'mcpServers.postgres_telemetry.transport'
  );
  assert.equal(sseAuditFa.recommendedMcpSnippet.includes('"transport": "sse"'), true);

  // 3. Stale entry produces CRITICAL Finding #2 on Context Rot staleness
  const staleAuditEn = buildDeterministicKbContextAwareness({
    entry: staleEntry,
    baselineProfile: 'multi-worktree-ci',
    language: 'en',
  });
  assert.equal(staleAuditEn.language, 'en');
  assert.equal(staleAuditEn.driftRiskScore >= 50, true);
  assert.equal(staleAuditEn.driftFindings[1].severity, 'CRITICAL');

  // 4. Normalizer validates AI response and falls back safely on malformed input
  const normalizedLive = normalizeAiKbContextAwarenessResponse(
    {
      contextAwarenessSummary: 'Live Gemini Context Awareness summary for MCP setup.',
      architecturalIntent: 'Maintain strict read-only pool and schema alignment.',
      driftRiskScore: 68,
      driftSeverity: 'HIGH',
      driftFindings: [
        {
          severity: 'WARNING',
          parameterPath: 'mcpServers.postgres.transport',
          expectedBaseline: 'sse',
          detectedState: 'stdio',
          explanation: 'Transport drift between local stdio and remote SSE gateway.',
          remediationPatch: '"transport": "sse"',
        },
        {
          severity: 'CRITICAL',
          parameterPath: '.agent/knowledge-base/rot',
          expectedBaseline: '< 35%',
          detectedState: '82%',
          explanation: 'Stale vendor AST dump pollutes MCP tool resolution.',
          remediationPatch: 'Prune stale entry',
        },
      ],
      recommendedMcpSnippet: '{"mcpServers": {"guard": {"transport": "sse"}}}',
      modelUsed: 'gemini-3.8-flash',
      source: 'ai-live',
    },
    staleAuditEn
  );
  assert.equal(normalizedLive.source, 'ai-live');
  assert.equal(normalizedLive.driftRiskScore, 68);
  assert.equal(normalizedLive.driftSeverity, 'HIGH');
  assert.equal(normalizedLive.driftFindings.length, 2);

  const fallbackNorm = normalizeAiKbContextAwarenessResponse(undefined, sseAuditFa);
  assert.equal(fallbackNorm.contextAwarenessSummary, sseAuditFa.contextAwarenessSummary);
});

test('Academy Leaderboard & AI Weekly Challenges: anonymizes student handles, ranks architects by cumulative XP, and normalizes AI weekly challenges', async () => {
  const {
    anonymizeArchitectHandle,
    buildAcademyLeaderboardStandings,
    buildWeeklyLeaderboardChallengePrompt,
    buildDeterministicWeeklyLeaderboardChallenges,
    normalizeAiWeeklyLeaderboardChallengesResponse,
  } = await import('./achievements');

  // 1. Privacy-preserving handle anonymization never leaks raw full names or email addresses
  const handleStandard = anonymizeArchitectHandle(
    'Kourosh Rostami',
    'peer-arch-01',
    false
  );
  assert.equal(handleStandard.startsWith('arch#'), true);
  assert.equal(handleStandard.includes('K.R***'), true);
  assert.equal(handleStandard.includes('Kourosh'), false);
  assert.equal(handleStandard.includes('Rostami'), false);

  const handleFromEmail = anonymizeArchitectHandle(
    'aria.farhadi@example.com',
    'user-99',
    false
  );
  assert.equal(handleFromEmail.includes('@example.com'), false);
  assert.equal(handleFromEmail.includes('A.F***'), true);

  const handleStrict = anonymizeArchitectHandle(
    'Kourosh Rostami',
    'peer-arch-01',
    true
  );
  assert.equal(handleStrict.startsWith('zk-node#'), true);
  assert.equal(handleStrict.includes('K.R'), false);

  // 2. Cumulative XP standings sort descending and update current user rank dynamically
  const midStandings = buildAcademyLeaderboardStandings({
    currentArchitectName: 'مهندس ارشد (Principal Engineer)',
    currentArchitectId: 'current-session-architect',
    currentUserCumulativeXp: 2850,
    currentUserCompletedModules: 5,
    currentUserStreakDays: 10,
    currentUserChallengesSolved: 1,
    currentUserWeeklyBonusXp: 250,
    strictPrivacyMode: false,
  });

  assert.equal(midStandings.entries.length, 8); // 7 seeded peers + current user
  // Verify descending cumulative XP order
  for (let i = 1; i < midStandings.entries.length; i++) {
    assert.equal(
      midStandings.entries[i - 1].cumulativeXp >=
        midStandings.entries[i].cumulativeXp,
      true
    );
  }
  // At 2850 XP, user is ranked #5 (behind 4480, 3960, 3520, 3080)
  assert.equal(midStandings.currentUserEntry.rank, 5);
  assert.equal(midStandings.currentUserEntry.isCurrentUser, true);
  assert.equal(midStandings.xpToNextLeaderboardSpot, 3080 - 2850 + 10);

  // Boosting user cumulative XP to 4800 elevates user to #1 on the podium
  const topStandings = buildAcademyLeaderboardStandings({
    currentArchitectName: 'مهندس ارشد (Principal Engineer)',
    currentArchitectId: 'current-session-architect',
    currentUserCumulativeXp: 4800,
    currentUserCompletedModules: 8,
    currentUserStreakDays: 18,
    strictPrivacyMode: true,
  });
  assert.equal(topStandings.currentUserEntry.rank, 1);
  assert.equal(topStandings.topThreePodium[0].isCurrentUser, true);
  assert.equal(topStandings.xpToNextLeaderboardSpot, 0);
  assert.equal(
    topStandings.entries.every((e) => e.displayHandle.startsWith('zk-node#')),
    true
  );

  // 3. AI Weekly Ranking Challenges prompt, deterministic tracks, and normalization
  const promptFa = buildWeeklyLeaderboardChallengePrompt({
    track: 'fastmcp-security',
    language: 'fa',
    currentRankNameEn: 'Architect',
    completedModulesCount: 6,
  });
  assert.equal(promptFa.includes('fastmcp-security'), true);
  assert.equal(promptFa.includes('mcp_config.json'), true);

  const fastmcpSuiteFa = buildDeterministicWeeklyLeaderboardChallenges({
    track: 'fastmcp-security',
    language: 'fa',
  });
  assert.equal(fastmcpSuiteFa.challenges.length, 3);
  assert.equal(fastmcpSuiteFa.challenges[0].targetArtifactOrPath, 'mcp_config.json');

  const normalizedAiSuite = normalizeAiWeeklyLeaderboardChallengesResponse(
    {
      weekCode: '2026-W45',
      themeHeadline: 'Custom AI Weekly Sprint Headline',
      aiDirectiveSummary: 'Custom AI Weekly Directive Summary for Leaderboard.',
      challenges: [
        {
          id: 'ai-c1',
          code: 'WRC-45-01',
          title: 'Audit FastMCP Read-Only Pool',
          scenarioBrief: 'Ensure read-only pool in mcp_config.json.',
          verificationCriterion: 'Verify default_transaction_read_only=on.',
          targetArtifactOrPath: 'mcp_config.json',
          difficulty: 'ARCHITECT',
          xpReward: 400,
        },
        {
          id: 'ai-c2',
          code: 'WRC-45-02',
          title: 'Isolate Worktree Branches',
          scenarioBrief: 'Prevent index.lock contention across 3 agents.',
          verificationCriterion: 'Zero merge conflicts in Mission Control.',
          targetArtifactOrPath: '.agent/workflows/worktree.md',
          difficulty: 'PRINCIPAL',
          xpReward: 500,
        },
      ],
      source: 'ai-live',
    },
    fastmcpSuiteFa
  );
  assert.equal(normalizedAiSuite.source, 'ai-live');
  assert.equal(normalizedAiSuite.weekCode, '2026-W45');
  assert.equal(normalizedAiSuite.challenges.length, 2);
  assert.equal(normalizedAiSuite.challenges[0].xpReward, 400);
});

test("Architect's Daily Mission: selectArchitectDailyMission and completeArchitectDailyMission select random technical tasks and award bonus XP without duplicate claims", async () => {
  const {
    ARCHITECT_DAILY_MISSIONS_POOL,
    selectArchitectDailyMission,
    completeArchitectDailyMission,
  } = await import('./generators');

  assert.equal(ARCHITECT_DAILY_MISSIONS_POOL.length >= 6, true);

  // 1. Seeded index 0 selects the 'Refactor a rule' mission
  const firstMission = selectArchitectDailyMission({ seedOrIndex: 0 });
  assert.equal(firstMission.id, 'mission-refactor-rule');
  assert.equal(firstMission.categoryBadge, 'Refactor a Rule');
  assert.equal(firstMission.xpReward, 150);

  // 2. Random selection with excludeMissionId never returns the excluded mission
  for (let i = 0; i < 12; i++) {
    const rerolled = selectArchitectDailyMission({
      excludeMissionId: firstMission.id,
    });
    assert.notEqual(rerolled.id, firstMission.id);
  }

  // 3. Completing the mission awards extra XP and prevents duplicate claiming
  const claim1 = completeArchitectDailyMission({
    mission: firstMission,
    completedMissionIds: [],
    currentBonusXp: 0,
  });
  assert.equal(claim1.alreadyCompleted, false);
  assert.equal(claim1.xpEarned, 150);
  assert.equal(claim1.updatedBonusXp, 150);
  assert.deepEqual(claim1.updatedCompletedIds, ['mission-refactor-rule']);

  const duplicateClaim = completeArchitectDailyMission({
    mission: firstMission,
    completedMissionIds: claim1.updatedCompletedIds,
    currentBonusXp: claim1.updatedBonusXp,
  });
  assert.equal(duplicateClaim.alreadyCompleted, true);
  assert.equal(duplicateClaim.xpEarned, 0);
  assert.equal(duplicateClaim.updatedBonusXp, 150);
});

test('Module Knowledge Check: buildModuleKnowledgeCheckPrompt, buildDeterministicModuleKnowledgeCheck, normalizeAiModuleKnowledgeCheckResponse, and evaluateModuleKnowledgeCheckSubmission generate and grade quizzes accurately', async () => {
  const {
    buildModuleKnowledgeCheckPrompt,
    buildDeterministicModuleKnowledgeCheck,
    normalizeAiModuleKnowledgeCheckResponse,
    evaluateModuleKnowledgeCheckSubmission,
  } = await import('./generators');

  const sampleMod = {
    id: 'module-1',
    number: 1,
    titleFa: 'معماری هسته و فلسفه Agent-First',
    titleEn: 'Core Architecture: Editor View vs. Agent Manager',
    summaryFa: 'گذار بنیادین از کدنویسی خط‌به‌خط سنکرون به ارکستریشن ناهمگام چندایجنتی.',
    summaryEn: 'Fundamental shift from synchronous coding to asynchronous multi-agent orchestration.',
    difficulty: 'Principal Foundation',
    readingTime: '18 min read',
    keyTakeaways: [
      {
        titleFa: 'تفکیک محیط کاربری دوگانه',
        descFa: 'جدا کردن محیط ویرایش جراحی کد از مرکز فرماندهی ایجنت‌های موازی.',
        titleEn: 'Dual Workspace Separation',
        descEn: 'Separating surgical synchronous editing from asynchronous Mission Control.',
        metricOrBadge: 'Editor View + Mission Control',
      },
      {
        titleFa: 'موتور پیش‌بینی Supercomplete',
        descFa: 'پیش‌بینی تغییرات چندخطی و چندفایلی بر اساس گراف وابستگی LSP.',
        titleEn: 'Supercomplete Engine',
        descEn: 'Predicting multi-line and cross-file diffs via LSP dependency graphs.',
        metricOrBadge: 'LSP + Diff-History Aware',
      },
    ],
    subSections: [
      {
        id: 'm1-s1',
        titleFa: '۱.۱ پارادایم شیفت',
        titleEn: '1.1 Paradigm Shift',
        bulletPoints: [
          {
            termEn: 'Tab-to-Jump',
            descFa: 'پرش هوشمند بین فایل‌های وابسته.',
            descEn: 'Intelligent cursor jump across dependent files.',
          },
        ],
      },
    ],
  };

  // 1. Prompt includes module title and engineering badges
  const promptFa = buildModuleKnowledgeCheckPrompt({
    module: sampleMod,
    language: 'fa',
  });
  assert.equal(promptFa.includes('Core Architecture: Editor View vs. Agent Manager'), true);
  assert.equal(promptFa.includes('Editor View + Mission Control'), true);
  assert.equal(promptFa.includes('Tab-to-Jump'), true);

  // 2. Deterministic quiz produces 3 questions with 4 options each
  const quizFa = buildDeterministicModuleKnowledgeCheck({
    module: sampleMod,
    language: 'fa',
  });
  assert.equal(quizFa.questions.length, 3);
  assert.equal(quizFa.totalPossibleXp, 225);
  assert.equal(quizFa.questions[0].options.length, 4);
  assert.equal(quizFa.questions[0].correctIndex, 0);
  assert.equal(quizFa.questions[1].correctIndex, 1);
  assert.equal(quizFa.questions[2].correctIndex, 2);

  // 3. Normalization preserves valid AI questions and falls back safely
  const normalizedLive = normalizeAiModuleKnowledgeCheckResponse(
    {
      quizTitle: 'Custom AI Knowledge Check Title',
      quizSubtitle: 'Custom AI Knowledge Check Subtitle',
      questions: [
        {
          principleBadge: 'LSP Graph',
          question: 'How does Supercomplete predict cross-file diffs?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: 2,
          explanation: 'Uses LSP AST dependency graph.',
          xpReward: 100,
        },
        {
          principleBadge: 'Mission Control',
          question: 'Where do parallel background agents execute?',
          options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
          correctIndex: 1,
          explanation: 'In isolated Git Worktrees managed via Agent Manager.',
          xpReward: 100,
        },
      ],
      source: 'ai-live',
    },
    quizFa
  );
  assert.equal(normalizedLive.source, 'ai-live');
  assert.equal(normalizedLive.questions.length, 2);
  assert.equal(normalizedLive.totalPossibleXp, 200);

  // 4. Evaluation grades answers accurately
  const perfectEval = evaluateModuleKnowledgeCheckSubmission({
    quiz: quizFa,
    selectedAnswers: {
      [quizFa.questions[0].id]: 0,
      [quizFa.questions[1].id]: 1,
      [quizFa.questions[2].id]: 2,
    },
  });
  assert.equal(perfectEval.correctCount, 3);
  assert.equal(perfectEval.scorePercent, 100);
  assert.equal(perfectEval.earnedXp, 225);
  assert.equal(perfectEval.passed, true);

  const failedEval = evaluateModuleKnowledgeCheckSubmission({
    quiz: quizFa,
    selectedAnswers: {
      [quizFa.questions[0].id]: 0,
      [quizFa.questions[1].id]: 3,
      [quizFa.questions[2].id]: 0,
    },
  });
  assert.equal(failedEval.correctCount, 1);
  assert.equal(failedEval.scorePercent, 33);
  assert.equal(failedEval.earnedXp, 75);
  assert.equal(failedEval.passed, false);
});

test('Academy Knowledge Check Leaderboard: recordModuleKnowledgeCheckScore, buildKnowledgeCheckTop5Leaderboard, and buildKnowledgeCheckChallengeSharePayload rank top 5 students and format rank share cards accurately', async () => {
  const {
    recordModuleKnowledgeCheckScore,
    buildKnowledgeCheckTop5Leaderboard,
    buildKnowledgeCheckChallengeSharePayload,
  } = await import('./generators');

  // 1. Default leaderboard returns top 5 students sorted descending by cumulativeScoreXp
  const defaultBoard = buildKnowledgeCheckTop5Leaderboard();
  assert.equal(defaultBoard.top5Students.length, 5);
  for (let i = 0; i < defaultBoard.top5Students.length - 1; i++) {
    assert.equal(
      defaultBoard.top5Students[i].cumulativeScoreXp >=
        defaultBoard.top5Students[i + 1].cumulativeScoreXp,
      true
    );
    assert.equal(defaultBoard.top5Students[i].rank, i + 1);
  }
  assert.equal(defaultBoard.currentUserEntry.isCurrentUser, true);
  assert.equal(defaultBoard.currentUserEntry.rank, 4);
  assert.equal(defaultBoard.currentUserEntry.cumulativeScoreXp, 1200);

  // 2. Recording module quiz scores keeps the highest score per module and advances rank to #1
  let scores = recordModuleKnowledgeCheckScore({
    existingScores: {},
    moduleId: 'module-1',
    moduleNumber: 1,
    evaluation: {
      correctCount: 3,
      totalQuestions: 3,
      scorePercent: 100,
      earnedXp: 225,
      passed: true,
      resultsByQuestionId: {},
    },
  });
  // Lower re-take on same module does not overwrite higher score
  scores = recordModuleKnowledgeCheckScore({
    existingScores: scores,
    moduleId: 'module-1',
    moduleNumber: 1,
    evaluation: {
      correctCount: 1,
      totalQuestions: 3,
      scorePercent: 33,
      earnedXp: 75,
      passed: false,
      resultsByQuestionId: {},
    },
  });
  assert.equal(scores['module-1'].earnedXp, 225);

  scores = recordModuleKnowledgeCheckScore({
    existingScores: scores,
    moduleId: 'module-2',
    moduleNumber: 2,
    evaluation: {
      correctCount: 3,
      totalQuestions: 3,
      scorePercent: 100,
      earnedXp: 225,
      passed: true,
      resultsByQuestionId: {},
    },
  });
  scores = recordModuleKnowledgeCheckScore({
    existingScores: scores,
    moduleId: 'module-3',
    moduleNumber: 3,
    evaluation: {
      correctCount: 3,
      totalQuestions: 3,
      scorePercent: 100,
      earnedXp: 225,
      passed: true,
      resultsByQuestionId: {},
    },
  });

  const boostedBoard = buildKnowledgeCheckTop5Leaderboard({
    userModuleScores: scores,
  });
  assert.equal(boostedBoard.currentUserEntry.cumulativeScoreXp, 1875);
  assert.equal(boostedBoard.currentUserEntry.rank, 1);
  assert.equal(boostedBoard.top5Students[0].isCurrentUser, true);

  // 3. Challenge Others share payload generates rank, XP, and challenge code in FA and EN
  const shareFa = buildKnowledgeCheckChallengeSharePayload({
    student: boostedBoard.currentUserEntry,
    language: 'fa',
  });
  assert.equal(shareFa.challengeCode, 'KC-RANK1-1875XP');
  assert.equal(shareFa.shareText.includes('1875 XP'), true);
  assert.equal(shareFa.shareText.includes('#1'), true);

  const shareEn = buildKnowledgeCheckChallengeSharePayload({
    student: boostedBoard.currentUserEntry,
    language: 'en',
  });
  assert.equal(shareEn.challengeCode, 'KC-RANK1-1875XP');
  assert.equal(shareEn.shareTitle.includes('Rank #1'), true);
});

test('Landing Page & Profile Page: breadcrumbs, section catalogs, and score storage work accurately', () => {
  // 1. Breadcrumbs for Landing Page
  const landingBcFa = buildBreadcrumbDescriptorWithTooltips({
    activeSection: 'landing',
    language: 'fa',
    currentModule: {
      number: 1,
      titleFa: 'ماژول ۱',
      titleEn: 'Module 1',
      summaryFa: 'خلاصه',
      readingTime: '10 min',
      difficulty: 'Easy',
    },
    formattedModNumber: '۱',
  });
  assert.equal(landingBcFa.group, 'آکادمی Antigravity');
  assert.equal(landingBcFa.subgroup, 'درگاه اصلی');
  assert.equal(landingBcFa.itemTooltip.badge, 'Landing');

  const landingBcEn = buildBreadcrumbDescriptorWithTooltips({
    activeSection: 'landing',
    language: 'en',
    currentModule: {
      number: 1,
      titleFa: 'ماژول ۱',
      titleEn: 'Module 1',
      summaryFa: 'خلاصه',
      readingTime: '10 min',
      difficulty: 'Easy',
    },
    formattedModNumber: '1',
  });
  assert.equal(landingBcEn.group, 'Antigravity Academy');
  assert.equal(landingBcEn.subgroup, 'Portal');

  // 2. Breadcrumbs for Profile Page
  const profileBcFa = buildBreadcrumbDescriptorWithTooltips({
    activeSection: 'profile',
    language: 'fa',
    currentModule: {
      number: 1,
      titleFa: 'ماژول ۱',
      titleEn: 'Module 1',
      summaryFa: 'خلاصه',
      readingTime: '10 min',
      difficulty: 'Easy',
    },
    formattedModNumber: '۱',
  });
  assert.equal(profileBcFa.group, 'میز کار معمار');
  assert.equal(profileBcFa.itemTooltip.badge, 'Transcript');

  // 3. getStoredKnowledgeCheckScores returns valid object in node/ssr environment
  const stored = getStoredKnowledgeCheckScores();
  assert.deepEqual(typeof stored, 'object');
});


