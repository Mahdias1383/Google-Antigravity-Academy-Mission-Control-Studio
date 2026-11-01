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
} from './generators';

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


