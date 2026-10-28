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

