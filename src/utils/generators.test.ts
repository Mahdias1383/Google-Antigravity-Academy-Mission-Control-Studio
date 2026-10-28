import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRuleMarkdown,
  buildWorkflowMarkdown,
  recommendAutonomyPolicy,
  buildMcpConfigJson,
  buildFastMcpPythonCode,
  estimateRuleTokenOverhead,
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
  // 150 module + (50 * 4 = 200) reading + (200 + 120 = 320) studio = 670 XP -> Level 2 (600..1300)
  assert.equal(initialLevel.moduleXp, 150);
  assert.equal(initialLevel.readingTimeXp, 200);
  assert.equal(initialLevel.studioUsageXp, 320);
  assert.equal(initialLevel.totalCombinedXp, 670);
  assert.equal(initialLevel.currentLevel, 2);
  assert.equal(initialLevel.levelProgressPercent, 10);

  const leveledUp = calculateXpAndLevelProgression(1650, 280, [
    { studioId: 'sim', titleFa: 'شبیه‌ساز Mission Control', titleEn: 'Mission Control Sim', xpPerAction: 100, actionsLogged: 6 },
  ]);
  // 1650 + 1120 + 600 = 3370 XP -> Level 5 (3000..4000)
  assert.equal(leveledUp.currentLevel, 5);
  assert.equal(leveledUp.totalCombinedXp, 3370);
});



