import {
  RuleGeneratorConfig,
  WorkflowGeneratorConfig,
  AutonomyRiskProfile,
  AutonomyRecommendation,
  McpIntegrationSelection,
} from '../types/curriculum';

export function buildRuleMarkdown(config: RuleGeneratorConfig): string {
  const lines: string[] = ['---'];
  if (config.activationMode === 'Always On') {
    lines.push('alwaysApply: true');
    lines.push(`description: "${config.description || 'Core architectural guardrails always enforced across workspace'}"`);
  } else if (config.activationMode === 'Glob') {
    lines.push('alwaysApply: false');
    const globsFormatted = config.globs.map((g) => `"${g.trim()}"`).join(', ');
    lines.push(`globs: [${globsFormatted}]`);
    lines.push(`description: "${config.description || 'Scoped file-pattern guardrails'}"`);
  } else if (config.activationMode === 'Model Decision') {
    lines.push('alwaysApply: false');
    lines.push(`description: "${config.description || 'Semantic context rule activated dynamically when task matches domain'}"`);
  } else {
    lines.push('alwaysApply: false');
    lines.push(`description: "Manual rule invoked explicitly via @${config.name}"`);
  }
  lines.push('---', '');

  lines.push(`# Architectural Guardrail: ${config.name}`);
  lines.push('');

  if (config.domains.fastapi) {
    lines.push('## 1. FastAPI & Pydantic v2 Contracts');
    lines.push('- Always use `Annotated[Session, Depends(get_db)]` for dependency injection.');
    lines.push('- Enforce Pydantic v2 `model_config = ConfigDict(from_attributes=True, extra="forbid")` on all request/response schemas.');
    lines.push('- Raise structured domain exceptions mapped to RFC 7807 Problem Details (`422 Unprocessable Entity`, `409 Conflict`).');
    lines.push('');
  }

  if (config.domains.sqlalchemy) {
    lines.push('## 2. SQLAlchemy 2.0 Async ORM Invariants');
    lines.push('- Strictly forbid legacy `session.query()`. Always use 2.0 syntax: `await session.execute(select(Model).where(...))`.');
    lines.push('- Declare all ORM attributes using `Mapped[T]` and `mapped_column(...)` with explicit SQL types.');
    lines.push('- Prevent N+1 queries on relationships by explicitly specifying `selectinload()` or `joinedload()`.');
    lines.push('');
  }

  if (config.domains.alembic) {
    lines.push('## 3. Alembic Schema Migration Safety');
    lines.push('- Never execute raw DDL outside Alembic revisions.');
    lines.push('- Every `upgrade()` function must have a deterministic, non-destructive `downgrade()` counterpart.');
    lines.push('- Flag any `op.drop_table()` or `op.drop_column()` under `User Review Required` in `implementation_plan.md`.');
    lines.push('');
  }

  if (config.domains.pytest) {
    lines.push('## 4. Pytest & Async QA Standards');
    lines.push('- Use `pytest-asyncio` with `@pytest.mark.asyncio` and isolated transactional rollback fixtures.');
    lines.push('- Test both happy-path (`200`/`201`) and boundary validation failures (`400`/`403`/`422`).');
    lines.push('');
  }

  if (config.domains.security) {
    lines.push('## 5. Security & Secret Scrubbing');
    lines.push('- Never hardcode secrets, tokens, or connection strings; load via `pydantic-settings` `BaseSettings`.');
    lines.push('- Scrub `Authorization`, `Cookie`, `api_key`, and `password` fields before emitting telemetry.');
    lines.push('');
  }

  if (config.domains.logging) {
    lines.push('## 6. Structured JSON Telemetry & Correlation');
    lines.push('- Emit structured JSON logs using `structlog` with mandatory `correlation_id` and `trace_id` contextvars.');
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

export function buildWorkflowMarkdown(config: WorkflowGeneratorConfig): string {
  const sanitizedCmd = config.commandName.replace(/^\/+/, '').trim() || 'custom-workflow';
  const lines: string[] = [
    '---',
    `description: "${config.description || `Standard Operating Procedure for /${sanitizedCmd}`}"`,
    '---',
    '',
  ];

  if (config.turboAll) {
    lines.push('// turbo-all');
    lines.push('');
  }

  lines.push(`# Workflow: /${sanitizedCmd}`);
  lines.push('');

  config.steps.forEach((step, idx) => {
    lines.push(`## Step ${idx + 1}: ${step.title}`);
    lines.push(step.description);
    if (!config.turboAll && step.turboStep) {
      lines.push('// turbo');
    }
    lines.push('```bash');
    lines.push(step.commandOrAction);
    lines.push('```');
    lines.push('');
  });

  return lines.join('\n').trim() + '\n';
}

export function recommendAutonomyPolicy(profile: AutonomyRiskProfile): AutonomyRecommendation {
  const baseAllowList = [
    'poetry run pytest',
    'poetry run ruff check .',
    'alembic heads',
    'alembic current',
    'alembic history',
    'git status',
    'git diff',
  ];

  const baseDenyList = [
    'rm -rf',
    'git push --force',
    'git reset --hard',
    'docker system prune -a',
    'alembic downgrade base',
    'DROP TABLE',
    'TRUNCATE TABLE',
  ];

  if (profile.environment === 'enterprise-prod' || profile.hasDestructiveDbAccess || profile.requiresAuditTrail) {
    return {
      executionMode: 'Planning Mode',
      terminalPolicy: 'Auto',
      artifactReviewPolicy: 'Request Review',
      allowList: baseAllowList,
      denyList: [...baseDenyList, 'alembic upgrade head', 'kubectl delete', 'terraform apply -auto-approve'],
      rationaleFa:
        'به دلیل حساسیت محیط عملیاتی/دسترسی به دیتابیس یا الزام ممیزی، حالت Planning Mode به همراه سیاست مرور Request Review الزامی است تا پیش از هرگونه تغییر کد، فایل implementation_plan.md توسط معمار ارشد تایید شود. سیاست ترمینال Auto اجازه اجرای تست‌های بی‌خطر Allow List را می‌دهد اما دستورات مخرب را مسدود می‌کند.',
    };
  }

  if (profile.environment === 'staging-ci') {
    return {
      executionMode: 'Planning Mode',
      terminalPolicy: 'Auto',
      artifactReviewPolicy: 'Agent Decides',
      allowList: [...baseAllowList, 'alembic revision --autogenerate', 'alembic upgrade head'],
      denyList: baseDenyList,
      rationaleFa:
        'در محیط Staging، ترکیب Planning Mode با سیاست مرور Agent Decides تعادل ایده‌آلی بین سرعت و ایمنی ایجاد می‌کند. ایجنت برای تغییرات معماری بزرگ درخواست مرور می‌دهد و دستورات تست و مایگریشن استاندارد را از طریق Allow List اجرا می‌کند.',
    };
  }

  return {
    executionMode: profile.teamExperience === 'principal' ? 'Fast Mode' : 'Planning Mode',
    terminalPolicy: 'Turbo',
    artifactReviewPolicy: 'Always Proceed',
    allowList: [...baseAllowList, 'npm run test', 'alembic upgrade head', 'alembic downgrade -1'],
    denyList: baseDenyList,
    rationaleFa:
      'در محیط ایزوله Local Sandbox (یا Git Worktree مجزا)، استفاده از سیاست ترمینال Turbo به همراه Deny List سخت‌گیرانه حداکثر سرعت چرخه کدنویسی و تست خودکار را بدون توقف‌های مکرر فراهم می‌سازد.',
  };
}

export function buildMcpConfigJson(selection: McpIntegrationSelection): string {
  const mcpServers: Record<string, unknown> = {};

  if (selection.postgres) {
    mcpServers['postgres-warehouse'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', selection.envVars.postgresUrl],
      env: {
        PGCONNECT_TIMEOUT: '10',
      },
    };
  }

  if (selection.github) {
    mcpServers['github-enterprise'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: `\${${selection.envVars.githubTokenEnv}}`,
      },
    };
  }

  if (selection.opensearchTelemetry || selection.rocketchatAlert) {
    mcpServers['enterprise-telemetry-fastmcp'] = {
      command: 'poetry',
      args: ['run', 'python', 'mcp_servers/telemetry_and_alert_mcp.py'],
      env: {
        OPENSEARCH_URL: selection.envVars.opensearchUrl,
        OPENSEARCH_API_KEY: '${OPENSEARCH_API_KEY}',
        ROCKETCHAT_WEBHOOK_URL: selection.envVars.rocketchatWebhook,
         ENVIRONMENT: 'production',
      },
    };
  }

  if (selection.redisCache) {
    mcpServers['redis-inspector'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-redis', 'redis://localhost:6379/0'],
    };
  }

  return JSON.stringify({ mcpServers }, null, 2);
}

export function buildFastMcpPythonCode(selection: McpIntegrationSelection): string {
  const lines: string[] = [
    'from typing import Any',
    'import os',
    'import httpx',
    'from mcp.server.fastmcp import FastMCP',
    '',
    '# Initialize Enterprise FastMCP Server for Google Antigravity',
    'mcp = FastMCP("Enterprise-Telemetry-And-Ops")',
    '',
    `OPENSEARCH_URL = os.getenv("OPENSEARCH_URL", "${selection.envVars.opensearchUrl}")`,
    'OPENSEARCH_API_KEY = os.getenv("OPENSEARCH_API_KEY", "")',
    `ROCKETCHAT_WEBHOOK_URL = os.getenv("ROCKETCHAT_WEBHOOK_URL", "${selection.envVars.rocketchatWebhook}")`,
    '',
  ];

  if (selection.opensearchTelemetry) {
    lines.push(
      '@mcp.tool()',
      'async def fetch_opensearch_error_logs(',
      '    service_name: str,',
      '    minutes_back: int = 30,',
      '    status_code_min: int = 500',
      ') -> dict[str, Any]:',
      '    """Query OpenSearch cluster for recent HTTP 5xx exceptions and stack traces."""',
      '    query_payload = {',
      '        "size": 25,',
      '        "sort": [{"@timestamp": {"order": "desc"}}],',
      '        "query": {',
      '            "bool": {',
      '                "must": [',
      '                    {"match": {"service.name": service_name}},',
      '                    {"range": {"http.response.status_code": {"gte": status_code_min}}},',
      '                    {"range": {"@timestamp": {"gte": f"now-{minutes_back}m", "lte": "now"}}},',
      '                ]',
      '            }',
      '        },',
      '    }',
      '    headers = {"Authorization": f"ApiKey {OPENSEARCH_API_KEY}", "Content-Type": "application/json"}',
      '    async with httpx.AsyncClient(timeout=10.0) as client:',
      '        resp = await client.post(f"{OPENSEARCH_URL}/app-logs-*/_search", json=query_payload, headers=headers)',
      '        resp.raise_for_status()',
      '        hits = resp.json().get("hits", {}).get("hits", [])',
      '        return {',
      '            "service": service_name,',
      '            "total_errors": len(hits),',
      '            "entries": [h.get("_source", {}) for h in hits],',
      '        }',
      ''
    );
  }

  if (selection.rocketchatAlert) {
    lines.push(
      '@mcp.tool()',
      'async def send_rocketchat_deployment_report(',
      '    channel: str,',
      '    feature_branch: str,',
      '    pytest_passed: int,',
      '    walkthrough_summary: str',
      ') -> dict[str, str]:',
      '    """Dispatch verified Antigravity walkthrough report to Rocket.Chat engineering channel."""',
      '    payload = {',
      '        "channel": channel,',
      '        "username": "Antigravity-Agent-Bot",',
      '        "text": f"### Verified Walkthrough: `{feature_branch}`\\n- **Pytest Passed:** `{pytest_passed}`\\n- **Summary:** {walkthrough_summary}",',
      '    }',
      '    async with httpx.AsyncClient(timeout=8.0) as client:',
      '        resp = await client.post(ROCKETCHAT_WEBHOOK_URL, json=payload)',
      '        resp.raise_for_status()',
      '        return {"status": "dispatched", "channel": channel}',
      ''
    );
  }

  lines.push(
    '@mcp.resource("config://workspace/slo-thresholds")',
    'def get_service_slo_thresholds() -> dict[str, Any]:',
    '    """Expose production latency and error-budget thresholds as an MCP Resource."""',
    '    return {',
    '        "p99_latency_ms": 180,',
    '        "max_error_rate_percent": 0.1,',
    '        "required_pytest_coverage": 85,',
    '    }',
    '',
    'if __name__ == "__main__":',
    '    mcp.run(transport="stdio")',
    ''
  );

  return lines.join('\n');
}

export function estimateRuleTokenOverhead(mode: RuleGeneratorConfig['activationMode'], charLength: number): {
  tokensPerTurn: number;
  efficiencyRating: 'Optimal' | 'Moderate' | 'Heavy';
} {
  const rawTokens = Math.max(12, Math.round(charLength / 4));
  if (mode === 'Always On') {
    return {
      tokensPerTurn: rawTokens,
      efficiencyRating: rawTokens > 350 ? 'Heavy' : 'Moderate',
    };
  }
  if (mode === 'Glob' || mode === 'Model Decision') {
    return {
      tokensPerTurn: Math.round(rawTokens * 0.25),
      efficiencyRating: 'Optimal',
    };
  }
  return {
    tokensPerTurn: 0,
    efficiencyRating: 'Optimal',
  };
}

export interface KnowledgeBaseUserStateInput {
  exportedAtIso?: string;
  workspaceName?: string;
  taskId: string;
  titleEn: string;
  titleFa: string;
  worktree: string;
  executionMode: 'Planning Mode' | 'Fast Mode';
  executionStage: 'planning-review' | 'executing' | 'completed';
  activeArtifactTab: 'task.md' | 'implementation_plan.md' | 'walkthrough.md';
  inlineComments: { line: number; comment: string }[];
  tasks: { id: string; text: string; doneAfterExec: boolean }[];
  completedModules: string[];
  totalModules: number;
}

export interface KnowledgeBaseUserStateDocument {
  schemaVersion: '1.0.0';
  artifactPath: '.agent/knowledge-base/user-state.json';
  exportedAtIso: string;
  workspaceProfile: {
    workspaceName: string;
    activeWorktree: string;
    executionMode: 'Planning Mode' | 'Fast Mode';
    executionStage: 'planning-review' | 'executing' | 'completed';
  };
  activeTaskState: {
    taskId: string;
    titleEn: string;
    titleFa: string;
    activeArtifactTab: 'task.md' | 'implementation_plan.md' | 'walkthrough.md';
    inlineReviewComments: { line: number; comment: string }[];
    checklistProgress: {
      id: string;
      text: string;
      status: '[ ]' | '[/]' | '[x]';
    }[];
  };
  academyProgress: {
    completedModules: string[];
    totalModules: number;
    completionPercent: number;
  };
  continuityMetadata: {
    contextRotPrevention: 'enabled';
    knowledgeBasePersistence: 'verified';
    resumeCommand: string;
  };
}

export function buildKnowledgeBaseUserStateJson(
  input: KnowledgeBaseUserStateInput
): string {
  const safeTotal = Math.max(1, input.totalModules);
  const completionPercent = Math.min(
    100,
    Math.round((input.completedModules.length / safeTotal) * 100)
  );

  const checklistProgress = input.tasks.map((item, idx) => {
    const status: '[ ]' | '[/]' | '[x]' =
      input.executionStage === 'completed'
        ? '[x]'
        : idx === 0
        ? '[x]'
        : idx === 1
        ? '[/]'
        : '[ ]';
    return {
      id: item.id,
      text: item.text,
      status,
    };
  });

  const doc: KnowledgeBaseUserStateDocument = {
    schemaVersion: '1.0.0',
    artifactPath: '.agent/knowledge-base/user-state.json',
    exportedAtIso: input.exportedAtIso || '2026-10-28T08:45:00.000Z',
    workspaceProfile: {
      workspaceName: input.workspaceName || 'google-antigravity-academy-workspace',
      activeWorktree: input.worktree,
      executionMode: input.executionMode,
      executionStage: input.executionStage,
    },
    activeTaskState: {
      taskId: input.taskId,
      titleEn: input.titleEn,
      titleFa: input.titleFa,
      activeArtifactTab: input.activeArtifactTab,
      inlineReviewComments: input.inlineComments.map((c) => ({
        line: c.line,
        comment: c.comment,
      })),
      checklistProgress,
    },
    academyProgress: {
      completedModules: [...input.completedModules],
      totalModules: input.totalModules,
      completionPercent,
    },
    continuityMetadata: {
      contextRotPrevention: 'enabled',
      knowledgeBasePersistence: 'verified',
      resumeCommand: `antigravity resume --state .agent/knowledge-base/user-state.json --worktree ${input.worktree}`,
    },
  };

  return JSON.stringify(doc, null, 2);
}

export function parseKnowledgeBaseUserStateJson(rawJson: string): {
  valid: boolean;
  data?: KnowledgeBaseUserStateDocument;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as Partial<KnowledgeBaseUserStateDocument>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.artifactPath !== '.agent/knowledge-base/user-state.json' ||
      !parsed.workspaceProfile ||
      !parsed.activeTaskState ||
      !parsed.academyProgress
    ) {
      return {
        valid: false,
        error: 'Invalid .agent/knowledge-base/user-state.json schema structure.',
      };
    }
    return {
      valid: true,
      data: parsed as KnowledgeBaseUserStateDocument,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON syntax.',
    };
  }
}

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

export interface RecentSessionSnapshot {
  version: '1.0';
  lastAccessedSection: WorkspaceSectionId;
  lastAccessedModuleId: string;
  completedModules: string[];
  updatedAtIso: string;
}

export interface ResolvedRecentSessionDescriptor {
  section: WorkspaceSectionId;
  moduleId: string;
  kind: 'module' | 'studio';
  targetTitleFa: string;
  targetTitleEn: string;
  badgeLabelEn: string;
  completedModules: string[];
  completedCount: number;
  totalModules: number;
  completionPercent: number;
  updatedAtIso: string;
}

const STUDIO_METADATA_MAP: Record<
  Exclude<WorkspaceSectionId, 'curriculum'>,
  { titleFa: string; titleEn: string; badgeEn: string }
> = {
  simulator: {
    titleFa: 'استودیو ۱: شبیه‌ساز زنده Mission Control و ممیزی آرتیفکت‌ها',
    titleEn: 'Studio 1: Mission Control & Inline PR Review Simulator',
    badgeEn: 'STUDIO · MISSION CONTROL',
  },
  guardrails: {
    titleFa: 'استودیو ۲: ساخت قوانین .agent/rules و ورک‌فلوهای // turbo',
    titleEn: 'Studio 2: Rule & Workflow Guardrail Builder Studio',
    badgeEn: 'STUDIO · GUARDRAILS & RULES',
  },
  mcp: {
    titleFa: 'استودیو ۳: سازنده بصری سرور FastMCP و mcp_config.json',
    titleEn: 'Studio 3: Visual Enterprise FastMCP Server Studio',
    badgeEn: 'STUDIO · FASTMCP BUILDER',
  },
  achievements: {
    titleFa: 'دستاوردها، سطح‌بندی XP، برنامه‌ریز مطالعه و گواهینامه آکادمی',
    titleEn: 'Achievements, XP Progression, Daily Planner & Certification',
    badgeEn: 'ACADEMY · ACHIEVEMENTS & XP',
  },
  cheatsheets: {
    titleFa: 'مرکز چیت‌شیت‌های مرجع و خروجی PDF ماژولار',
    titleEn: 'Modular Reference Cheat Sheets & Scoped PDF Center',
    badgeEn: 'STUDIO · CHEAT SHEETS',
  },
  scenarios: {
    titleFa: 'آزمایشگاه ۸ چالش معماری واقعی در مقیاس Production',
    titleEn: '8 Principal Architecture Production Case Studies',
    badgeEn: 'STUDIO · CASE STUDIES LAB',
  },
  'ai-architect': {
    titleFa: 'دستیار هوشمند معمار و جستجوی زنده مستندات Google Antigravity',
    titleEn: 'Grounded AI Architect Copilot & Live Documentation Search',
    badgeEn: 'STUDIO · AI SEARCH GROUNDING',
  },
  'knowledge-base': {
    titleFa: 'کاوشگر پایگاه دانش (.agent/knowledge-base) و مدیریت Context Rot',
    titleEn: 'Knowledge Base Explorer & Context Rot Management Studio',
    badgeEn: 'STUDIO · KNOWLEDGE BASE EXPLORER',
  },
};

export function serializeRecentSessionSnapshot(
  snapshot: RecentSessionSnapshot
): string {
  return JSON.stringify(snapshot);
}

export function resolveRecentSessionFromStorage(
  rawSessionJson: string | null,
  rawUserStateJson: string | null,
  allModules: { id: string; number: number; titleFa: string; titleEn: string }[]
): ResolvedRecentSessionDescriptor | null {
  const totalModules = Math.max(1, allModules.length);

  if (rawSessionJson) {
    try {
      const parsed = JSON.parse(rawSessionJson) as Partial<RecentSessionSnapshot>;
      if (parsed && typeof parsed === 'object' && parsed.lastAccessedSection) {
        const section = parsed.lastAccessedSection;
        const moduleId = parsed.lastAccessedModuleId || allModules[0]?.id || 'module-1';
        const completedModules = Array.isArray(parsed.completedModules)
          ? parsed.completedModules
          : ['module-1', 'module-2'];
        const completedCount = completedModules.length;
        const completionPercent = Math.min(
          100,
          Math.round((completedCount / totalModules) * 100)
        );
        const updatedAtIso = parsed.updatedAtIso || '2026-10-28T08:50:00.000Z';

        if (section === 'curriculum') {
          const foundMod =
            allModules.find((m) => m.id === moduleId) || allModules[0];
          return {
            section: 'curriculum',
            moduleId: foundMod ? foundMod.id : moduleId,
            kind: 'module',
            targetTitleFa: foundMod
              ? `فصل ${foundMod.number}: ${foundMod.titleFa}`
              : 'فصل ۱: معماری هسته و فلسفه Agent-First',
            targetTitleEn: foundMod
              ? `Module 0${foundMod.number}: ${foundMod.titleEn}`
              : 'Module 01: Core Architecture',
            badgeLabelEn: foundMod
              ? `CURRICULUM · MODULE 0${foundMod.number}`
              : 'CURRICULUM · MODULE',
            completedModules,
            completedCount,
            totalModules,
            completionPercent,
            updatedAtIso,
          };
        }

        const studioMeta = STUDIO_METADATA_MAP[section];
        if (studioMeta) {
          return {
            section,
            moduleId,
            kind: 'studio',
            targetTitleFa: studioMeta.titleFa,
            targetTitleEn: studioMeta.titleEn,
            badgeLabelEn: studioMeta.badgeEn,
            completedModules,
            completedCount,
            totalModules,
            completionPercent,
            updatedAtIso,
          };
        }
      }
    } catch {
      // Fall through to user-state.json fallback
    }
  }

  if (rawUserStateJson) {
    const parsedState = parseKnowledgeBaseUserStateJson(rawUserStateJson);
    if (parsedState.valid && parsedState.data) {
      const doc = parsedState.data;
      const completedModules = doc.academyProgress.completedModules || [];
      const completedCount = completedModules.length;
      const completionPercent = Math.min(
        100,
        Math.round((completedCount / totalModules) * 100)
      );
      return {
        section: 'simulator',
        moduleId: allModules[0]?.id || 'module-1',
        kind: 'studio',
        targetTitleFa: `شبیه‌ساز Mission Control — ${doc.activeTaskState.titleFa}`,
        targetTitleEn: `Mission Control Simulator — ${doc.activeTaskState.titleEn}`,
        badgeLabelEn: `KNOWLEDGE BASE · ${doc.workspaceProfile.activeWorktree}`,
        completedModules,
        completedCount,
        totalModules,
        completionPercent,
        updatedAtIso: doc.exportedAtIso,
      };
    }
  }

  return null;
}

export type KnowledgeBaseEntryCategory =
  | 'user-state'
  | 'architecture-rule'
  | 'workflow-sop'
  | 'pr-review-directive'
  | 'mcp-schema';

export interface KnowledgeBaseEntryItem {
  id: string;
  keyPath: string;
  titleFa: string;
  titleEn: string;
  category: KnowledgeBaseEntryCategory;
  contentSnippet: string;
  tokenCount: number;
  stalenessPercent: number;
  bentoSpan: 'normal' | 'wide';
  updatedAtIso: string;
  storageSourceKey?: string;
}

export interface ContextRotTelemetry {
  totalEntries: number;
  totalTokens: number;
  tokenBudgetMax: number;
  tokenUsagePercent: number;
  staleEntriesCount: number;
  averageStalenessPercent: number;
  rotStatus:
    | 'Healthy (Zero Context Rot)'
    | 'Moderate (Watch)'
    | 'Critical (Context Rot Detected)';
}

export function estimateTokenWeight(content: string): number {
  const trimmed = (content || '').trim();
  if (!trimmed) return 45;
  return Math.max(48, Math.round(trimmed.length * 1.15));
}

export function buildInitialKnowledgeBaseEntries(
  rawUserStateJson: string | null,
  rawRecentSessionJson: string | null
): KnowledgeBaseEntryItem[] {
  let userStateSnippet = JSON.stringify(
    {
      artifactPath: '.agent/knowledge-base/user-state.json',
      workspaceProfile: {
        activeWorktree: '../ag-worktrees/wt-websocket',
        executionMode: 'Planning Mode',
        executionStage: 'planning-review',
      },
      academyProgress: {
        completedModules: ['module-1', 'module-2'],
        completionPercent: 25,
      },
    },
    null,
    2
  );
  let userStateUpdatedIso = '2026-10-28T09:00:00.000Z';

  if (rawUserStateJson) {
    const parsed = parseKnowledgeBaseUserStateJson(rawUserStateJson);
    if (parsed.valid && parsed.data) {
      userStateSnippet = JSON.stringify(
        {
          artifactPath: parsed.data.artifactPath,
          workspaceProfile: parsed.data.workspaceProfile,
          activeTaskState: {
            taskId: parsed.data.activeTaskState.taskId,
            titleEn: parsed.data.activeTaskState.titleEn,
            activeArtifactTab: parsed.data.activeTaskState.activeArtifactTab,
            inlineReviewComments: parsed.data.activeTaskState.inlineReviewComments,
          },
          academyProgress: parsed.data.academyProgress,
        },
        null,
        2
      );
      userStateUpdatedIso = parsed.data.exportedAtIso;
    }
  }

  let recentSessionSnippet = JSON.stringify(
    {
      storageKey: 'ag_recent_session_v1',
      lastAccessedSection: 'curriculum',
      lastAccessedModuleId: 'module-2',
      completedModules: ['module-1', 'module-2'],
    },
    null,
    2
  );
  if (rawRecentSessionJson) {
    try {
      const parsedSession = JSON.parse(rawRecentSessionJson);
      recentSessionSnippet = JSON.stringify(parsedSession, null, 2);
    } catch {
      // Keep default snippet
    }
  }

  return [
    {
      id: 'kb-user-state-sync',
      keyPath: '.agent/knowledge-base/user-state.json',
      titleFa: 'وضعیت همگام‌سازی‌شده نشست و محیط کار (Persistent User State)',
      titleEn: 'Synced Cross-Session Workspace & Academy User State',
      category: 'user-state',
      contentSnippet: userStateSnippet,
      tokenCount: estimateTokenWeight(userStateSnippet),
      stalenessPercent: 6,
      bentoSpan: 'wide',
      updatedAtIso: userStateUpdatedIso,
      storageSourceKey: 'ag_knowledge_base_user_state_v1',
    },
    {
      id: 'kb-recent-session-pointer',
      keyPath: 'localStorage://ag_recent_session_v1',
      titleFa: 'نشانگر آخرین ماژول و استودیوی فعال در مرورگر',
      titleEn: 'Active Session Checkpoint & Resume Pointer',
      category: 'user-state',
      contentSnippet: recentSessionSnippet,
      tokenCount: estimateTokenWeight(recentSessionSnippet),
      stalenessPercent: 8,
      bentoSpan: 'normal',
      updatedAtIso: '2026-10-28T09:05:00.000Z',
      storageSourceKey: 'ag_recent_session_v1',
    },
    {
      id: 'kb-rule-sqlalchemy-async',
      keyPath: '.agent/rules/01-sqlalchemy-async.md',
      titleFa: 'قانون اجباری: منع کامل Sync Query در SQLAlchemy 2.0',
      titleEn: 'Always On Rule: Strict AsyncSession & No Sync I/O',
      category: 'architecture-rule',
      contentSnippet: `---\ntrigger: always_on\nglob: "src/repositories/**/*.py"\n---\n- ALWAYS use AsyncSession with select() constructs.\n- NEVER invoke legacy session.query() or blocking I/O inside FastAPI routes.`,
      tokenCount: 380,
      stalenessPercent: 12,
      bentoSpan: 'normal',
      updatedAtIso: '2026-10-28T08:40:00.000Z',
    },
    {
      id: 'kb-stale-legacy-celery-context',
      keyPath: '.agent/knowledge-base/legacy-celery-v4-migration.md',
      titleFa: 'حافظه قدیمی و منقضی‌شده: تنظیمات Celery 4 و RabbitMQ قدیمی',
      titleEn: 'Deprecated Celery v4 Worker Context (High Context Rot Risk)',
      category: 'workflow-sop',
      contentSnippet: `# DEPRECATED CONTEXT (2025)\nBroker: amqp://guest@localhost:5672//\nTaskSerializer: pickle\nNote: Project migrated to Redis Streams + AsyncIO workers in Q3. Keeping this in context misleads the agent into generating legacy Celery decorators.`,
      tokenCount: 940,
      stalenessPercent: 86,
      bentoSpan: 'normal',
      updatedAtIso: '2026-09-10T11:20:00.000Z',
    },
    {
      id: 'kb-pr-inline-audit-directives',
      keyPath: '.agent/knowledge-base/pr-review-gate-directives.json',
      titleFa: 'کامنت‌های ممیزی PR-Style روی implementation_plan.md',
      titleEn: 'Inline PR-Style Review Directives & Security Gate Constraints',
      category: 'pr-review-directive',
      contentSnippet: JSON.stringify(
        {
          targetArtifact: 'implementation_plan.md',
          enforcedGates: [
            'Line 5: Validate single-use ticket TTL <= 30s in Redis before WebSocket accept()',
            'Line 11: Enforce tenant_id row-level isolation on all pub/sub channels',
          ],
        },
        null,
        2
      ),
      tokenCount: 420,
      stalenessPercent: 14,
      bentoSpan: 'normal',
      updatedAtIso: '2026-10-28T08:55:00.000Z',
    },
    {
      id: 'kb-stale-monolith-trace-dump',
      keyPath: '.agent/knowledge-base/stale-webpack4-trace-log.txt',
      titleFa: 'لاگ حجیم و منسوخ باندلر قدیمی (عامل مسمومیت پنجره زمینه)',
      titleEn: 'Obsolete Webpack 4 Build Trace Dump (Polluting Token Budget)',
      category: 'mcp-schema',
      contentSnippet: `[STALE_TRACE_DUMP] Hash: 9f8a7b6c5d4e | Chunk {0} vendor.bundle.js 4.82 MB [rendered]\nWARNING: Outdated build trace retained across 19 agent turns. Causes severe Context Rot and token budget exhaustion during Planning Mode.`,
      tokenCount: 1280,
      stalenessPercent: 92,
      bentoSpan: 'wide',
      updatedAtIso: '2026-08-22T16:10:00.000Z',
    },
  ];
}

export function calculateContextRotTelemetry(
  entries: KnowledgeBaseEntryItem[],
  tokenBudgetMax: number = 4500
): ContextRotTelemetry {
  const safeMax = Math.max(500, tokenBudgetMax);
  const totalEntries = entries.length;
  const totalTokens = entries.reduce((sum, item) => sum + Math.max(0, item.tokenCount), 0);
  const tokenUsagePercent = Math.min(100, Math.round((totalTokens / safeMax) * 100));
  const staleEntriesCount = entries.filter((item) => item.stalenessPercent >= 65).length;
  const averageStalenessPercent =
    totalEntries > 0
      ? Math.round(
          entries.reduce((sum, item) => sum + item.stalenessPercent, 0) / totalEntries
        )
      : 0;

  let rotStatus: ContextRotTelemetry['rotStatus'] = 'Healthy (Zero Context Rot)';
  if (staleEntriesCount >= 2 || averageStalenessPercent >= 50 || tokenUsagePercent >= 85) {
    rotStatus = 'Critical (Context Rot Detected)';
  } else if (staleEntriesCount === 1 || averageStalenessPercent >= 30 || tokenUsagePercent >= 65) {
    rotStatus = 'Moderate (Watch)';
  }

  return {
    totalEntries,
    totalTokens,
    tokenBudgetMax: safeMax,
    tokenUsagePercent,
    staleEntriesCount,
    averageStalenessPercent,
    rotStatus,
  };
}

export function filterKnowledgeBaseBentoItems(
  entries: KnowledgeBaseEntryItem[],
  searchQuery: string,
  category: KnowledgeBaseEntryCategory | 'all',
  onlyStaleRot: boolean = false
): KnowledgeBaseEntryItem[] {
  const q = (searchQuery || '').trim().toLowerCase();
  return entries.filter((item) => {
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    if (onlyStaleRot && item.stalenessPercent < 65) {
      return false;
    }
    if (!q) return true;
    return (
      item.titleFa.toLowerCase().includes(q) ||
      item.titleEn.toLowerCase().includes(q) ||
      item.keyPath.toLowerCase().includes(q) ||
      item.contentSnippet.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });
}

export function editKnowledgeBaseEntryItem(
  entries: KnowledgeBaseEntryItem[],
  id: string,
  updates: {
    titleFa?: string;
    titleEn?: string;
    keyPath?: string;
    contentSnippet?: string;
  },
  updatedAtIso: string = '2026-10-28T09:30:00.000Z'
): KnowledgeBaseEntryItem[] {
  return entries.map((item) => {
    if (item.id !== id) return item;
    const nextSnippet =
      updates.contentSnippet !== undefined ? updates.contentSnippet : item.contentSnippet;
    return {
      ...item,
      titleFa: updates.titleFa !== undefined ? updates.titleFa : item.titleFa,
      titleEn: updates.titleEn !== undefined ? updates.titleEn : item.titleEn,
      keyPath: updates.keyPath !== undefined ? updates.keyPath : item.keyPath,
      contentSnippet: nextSnippet,
      tokenCount: estimateTokenWeight(nextSnippet),
      stalenessPercent: 4,
      updatedAtIso,
    };
  });
}

export function deleteKnowledgeBaseEntryItem(
  entries: KnowledgeBaseEntryItem[],
  id: string
): KnowledgeBaseEntryItem[] {
  return entries.filter((item) => item.id !== id);
}

export function pruneStaleKnowledgeBaseEntries(
  entries: KnowledgeBaseEntryItem[],
  stalenessThreshold: number = 65
): KnowledgeBaseEntryItem[] {
  return entries.filter((item) => item.stalenessPercent < stalenessThreshold);
}

export interface MissionMilestoneQuote {
  moduleNumber: number;
  quoteFa: string;
  quoteEn: string;
  authorRoleEn: string;
  engineeringPrincipleEn: string;
}

export interface MissionMilestoneConfettiParticle {
  id: number;
  leftPercent: number;
  delayMs: number;
  durationMs: number;
  colorHex: string;
  rotationDeg: number;
  shape: 'rect' | 'diamond' | 'circle';
}

export interface MissionMilestonePayload {
  moduleId: string;
  moduleNumber: number;
  moduleTitleFa: string;
  moduleTitleEn: string;
  completedCount: number;
  totalModules: number;
  completionPercent: number;
  xpAwarded: number;
  isFullAcademyMastery: boolean;
  quote: MissionMilestoneQuote;
  confettiParticles: MissionMilestoneConfettiParticle[];
}

const ANTIGRAVITY_MILESTONE_QUOTES: Record<number, MissionMilestoneQuote> = {
  1: {
    moduleNumber: 1,
    quoteFa:
      'مهندسی Agent-First یعنی ارتقای نقش توسعه‌دهنده از تایپیست کد به معمار ارشد ارکستراسیون ایجنت‌ها؛ جایی که هر خط کد پیش از تولد، در طرح معماری ممیزی می‌شود.',
    quoteEn:
      'True Agent-First engineering elevates the developer from code typist to Principal Orchestrator—where architecture precedes every token.',
    authorRoleEn: 'Principal AI Systems Architect · Antigravity Core',
    engineeringPrincipleEn: 'PRINCIPLE 01 · AGENT-FIRST ORCHESTRATION',
  },
  2: {
    moduleNumber: 2,
    quoteFa:
      'سرعت بدون کنترل خطرساز است؛ ترکیب هوشمندانه Supercomplete و Tab-to-Jump در کنار Agent Manager، جریان فکری شما را در بالاترین مدار بهره‌وری نگه می‌دارد.',
    quoteEn:
      'Velocity without precision is noise; mastering Editor View alongside Mission Control keeps your cognitive flow in zero-friction orbit.',
    authorRoleEn: 'Staff IDE Experience Engineer · Antigravity',
    engineeringPrincipleEn: 'PRINCIPLE 02 · DUAL-SURFACE FLOW STATE',
  },
  3: {
    moduleNumber: 3,
    quoteFa:
      'هیچ کدی نباید بدون تأیید قرارداد معماری اجرا شود؛ آرتیفکت‌های سهرابانه task.md، implementation_plan.md و walkthrough.md ستون فقرات اعتمادپذیری ایجنت هستند.',
    quoteEn:
      'Never ship unverified autonomy. Artifact-driven PR gates on implementation_plan.md turn black-box agents into auditable engineering partners.',
    authorRoleEn: 'Lead Autonomous Verification Architect',
    engineeringPrincipleEn: 'PRINCIPLE 03 · ARTIFACT-DRIVEN PR GATES',
  },
  4: {
    moduleNumber: 4,
    quoteFa:
      'پوسیدگی زمینه (Context Rot) قاتل خاموش دقت ایجنت است؛ قوانین Glob-Scoped در .agent/rules بودجه توکن شما را تمیز، تیز و هدفمند نگه می‌دارند.',
    quoteEn:
      'Context Rot is the silent killer of agentic reasoning; Glob-scoped .agent/rules keep your token budget surgical and deterministic.',
    authorRoleEn: 'Principal Context & Guardrails Engineer',
    engineeringPrincipleEn: 'PRINCIPLE 04 · ZERO CONTEXT ROT',
  },
  5: {
    moduleNumber: 5,
    quoteFa:
      'تکرار دشمن خلاقیت مهندسی است؛ ورک‌فلوهای استاندارد در .agent/workflows با دایرکتیو // turbo، عملیات پیچیده را به پایپ‌لاین‌های خودکار و بی‌نقص تبدیل می‌کنند.',
    quoteEn:
      'Repetition is the enemy of architectural focus; declarative .agent/workflows with // turbo directives codify your best engineering habits.',
    authorRoleEn: 'Staff Workflow Automation Architect',
    engineeringPrincipleEn: 'PRINCIPLE 05 · DETERMINISTIC // TURBO PIPELINES',
  },
  6: {
    moduleNumber: 6,
    quoteFa:
      'ایجنتی که خروجی بصری خود را در مرورگر واقعی نبیند، در تاریکی کد می‌زند؛ ساب‌ایجنت مرورگر حلقه بازخورد E2E و DOM Telemetry را کامل می‌کند.',
    quoteEn:
      'An agent that cannot inspect its own rendered DOM is coding blind; Browser Subagent telemetry closes the autonomous verification loop.',
    authorRoleEn: 'Lead Browser Subagent & Runtime Engineer',
    engineeringPrincipleEn: 'PRINCIPLE 06 · CLOSED-LOOP VISUAL TELEMETRY',
  },
  7: {
    moduleNumber: 7,
    quoteFa:
      'قدرت واقعی ایجنت در اتصال امن به ابزارهای سازمانی نهفته است؛ سرورهای FastMCP با اعتبارسنجی سخت‌گیرانه، پل امن بین استدلال مدل و زیرساخت واقعی هستند.',
    quoteEn:
      'Enterprise autonomy demands strict schema boundaries; FastMCP servers bridge deep reasoning with hardened production infrastructure.',
    authorRoleEn: 'Principal MCP & Security Architect',
    engineeringPrincipleEn: 'PRINCIPLE 07 · HARDENED FASTMCP TOPOLOGY',
  },
  8: {
    moduleNumber: 8,
    quoteFa:
      'اوج مهندسی Antigravity زمانی رقم می‌خورد که چندین ایجنت موازی در Git Worktrees ایزوله، بدون کوچک‌ترین تداخل، فیچرهای مقیاس‌پذیر را هم‌زمان خلق کنند.',
    quoteEn:
      'Peak Antigravity mastery is achieved when parallel agents operate across isolated Git Worktrees in conflict-free symphony.',
    authorRoleEn: 'Distinguished Fellow · Google Antigravity Academy',
    engineeringPrincipleEn: 'PRINCIPLE 08 · PARALLEL WORKTREE MASTERY',
  },
};

export function buildMissionMilestoneNotification(input: {
  moduleId: string;
  moduleNumber: number;
  moduleTitleFa: string;
  moduleTitleEn: string;
  completedModules: string[];
  totalModules: number;
}): MissionMilestonePayload {
  const safeTotal = Math.max(1, input.totalModules);
  const uniqueCompleted = Array.from(
    new Set([...input.completedModules, input.moduleId])
  );
  const completedCount = uniqueCompleted.length;
  const completionPercent = Math.min(
    100,
    Math.round((completedCount / safeTotal) * 100)
  );
  const isFullAcademyMastery = completedCount >= safeTotal;
  const xpAwarded = isFullAcademyMastery ? 500 : 200;

  const quote =
    ANTIGRAVITY_MILESTONE_QUOTES[input.moduleNumber] ||
    ANTIGRAVITY_MILESTONE_QUOTES[1];

  const palette = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#38bdf8'];
  const shapes: ('rect' | 'diamond' | 'circle')[] = ['rect', 'diamond', 'circle'];

  const confettiParticles: MissionMilestoneConfettiParticle[] = Array.from(
    { length: 24 },
    (_, idx) => ({
      id: idx + 1,
      leftPercent: Math.round(((idx * 17 + 7) % 92) + 4),
      delayMs: (idx % 6) * 90,
      durationMs: 1800 + (idx % 5) * 260,
      colorHex: palette[idx % palette.length],
      rotationDeg: (idx * 37) % 360,
      shape: shapes[idx % shapes.length],
    })
  );

  return {
    moduleId: input.moduleId,
    moduleNumber: input.moduleNumber,
    moduleTitleFa: input.moduleTitleFa,
    moduleTitleEn: input.moduleTitleEn,
    completedCount,
    totalModules: safeTotal,
    completionPercent,
    xpAwarded,
    isFullAcademyMastery,
    quote,
    confettiParticles,
  };
}

export interface KnowledgeBaseBundleDocument {
  schemaVersion: '1.0.0';
  bundleType: 'google-antigravity-knowledge-base-export';
  exportedAtIso: string;
  telemetrySummary: ContextRotTelemetry;
  entries: KnowledgeBaseEntryItem[];
}

export function exportKnowledgeBaseBundleJson(
  entries: KnowledgeBaseEntryItem[],
  exportedAtIso: string = '2026-10-31T22:00:00.000Z'
): string {
  const telemetrySummary = calculateContextRotTelemetry(entries, 4500);
  const doc: KnowledgeBaseBundleDocument = {
    schemaVersion: '1.0.0',
    bundleType: 'google-antigravity-knowledge-base-export',
    exportedAtIso,
    telemetrySummary,
    entries,
  };
  return JSON.stringify(doc, null, 2);
}

const VALID_KB_CATEGORIES: KnowledgeBaseEntryCategory[] = [
  'user-state',
  'architecture-rule',
  'workflow-sop',
  'pr-review-directive',
  'mcp-schema',
];

export function parseKnowledgeBaseBundleJson(rawJson: string): {
  valid: boolean;
  entries?: KnowledgeBaseEntryItem[];
  exportedAtIso?: string;
  error?: string;
} {
  if (!rawJson || !rawJson.trim()) {
    return { valid: false, error: 'محتوای JSON واردشده خالی است.' };
  }

  try {
    const parsed = JSON.parse(rawJson);
    let candidateEntries: unknown[] | null = null;
    let exportedAtIso = '2026-10-31T22:00:00.000Z';

    if (Array.isArray(parsed)) {
      candidateEntries = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.entries)) {
        candidateEntries = obj.entries;
        if (typeof obj.exportedAtIso === 'string' && obj.exportedAtIso.trim()) {
          exportedAtIso = obj.exportedAtIso;
        }
      }
    }

    if (!candidateEntries || candidateEntries.length === 0) {
      return {
        valid: false,
        error:
          'ساختار JSON معتبر نیست: آرایه entries یا لیست آیتم‌های پایگاه دانش یافت نشد.',
      };
    }

    const normalizedEntries: KnowledgeBaseEntryItem[] = [];

    for (let i = 0; i < candidateEntries.length; i++) {
      const rawItem = candidateEntries[i];
      if (!rawItem || typeof rawItem !== 'object') {
        return {
          valid: false,
          error: `آیتم شماره ${i + 1} در فایل JSON یک آبجکت معتبر نیست.`,
        };
      }

      const rec = rawItem as Record<string, unknown>;
      const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : `kb-imported-${i + 1}`;
      const keyPath = typeof rec.keyPath === 'string' ? rec.keyPath.trim() : '';
      const titleFa = typeof rec.titleFa === 'string' ? rec.titleFa.trim() : '';
      const titleEn =
        typeof rec.titleEn === 'string' && rec.titleEn.trim()
          ? rec.titleEn.trim()
          : 'Imported Knowledge Base Entry';
      const contentSnippet =
        typeof rec.contentSnippet === 'string' ? rec.contentSnippet : '';

      if (!keyPath || !titleFa || !contentSnippet.trim()) {
        return {
          valid: false,
          error: `آیتم شماره ${i + 1} فاقد فیلدهای الزامی (keyPath، titleFa یا contentSnippet) است.`,
        };
      }

      const rawCat = rec.category as KnowledgeBaseEntryCategory;
      const category: KnowledgeBaseEntryCategory = VALID_KB_CATEGORIES.includes(
        rawCat
      )
        ? rawCat
        : 'architecture-rule';

      const tokenCount =
        typeof rec.tokenCount === 'number' && rec.tokenCount > 0
          ? Math.round(rec.tokenCount)
          : estimateTokenWeight(contentSnippet);

      const stalenessPercent =
        typeof rec.stalenessPercent === 'number' &&
        rec.stalenessPercent >= 0 &&
        rec.stalenessPercent <= 100
          ? Math.round(rec.stalenessPercent)
          : 5;

      const bentoSpan: 'normal' | 'wide' =
        rec.bentoSpan === 'wide' || rec.bentoSpan === 'normal'
          ? rec.bentoSpan
          : contentSnippet.length > 220
          ? 'wide'
          : 'normal';

      const updatedAtIso =
        typeof rec.updatedAtIso === 'string' && rec.updatedAtIso.trim()
          ? rec.updatedAtIso
          : exportedAtIso;

      const storageSourceKey =
        typeof rec.storageSourceKey === 'string' && rec.storageSourceKey.trim()
          ? rec.storageSourceKey
          : undefined;

      normalizedEntries.push({
        id,
        keyPath,
        titleFa,
        titleEn,
        category,
        contentSnippet,
        tokenCount,
        stalenessPercent,
        bentoSpan,
        updatedAtIso,
        ...(storageSourceKey ? { storageSourceKey } : {}),
      });
    }

    return {
      valid: true,
      entries: normalizedEntries,
      exportedAtIso,
    };
  } catch {
    return {
      valid: false,
      error: 'فرمت JSON نامعتبر است (خطای نحوی در پارس کردن فایل).',
    };
  }
}

export interface KnowledgeConceptTagNode {
  tagId: string;
  labelEn: string;
  labelFa: string;
  domainCategory: KnowledgeBaseEntryCategory;
  frequency: number;
  totalTokens: number;
  averageStalenessPercent: number;
  entryIds: string[];
  relatedTagIds: string[];
  weightScore: number;
}

export interface KnowledgeTagCoOccurrenceLink {
  sourceTagId: string;
  targetTagId: string;
  sharedEntriesCount: number;
  sharedEntryIds: string[];
}

export interface KnowledgeTagBubbleGraph {
  nodes: KnowledgeConceptTagNode[];
  links: KnowledgeTagCoOccurrenceLink[];
  totalUniqueTags: number;
  totalRelationships: number;
  dominantTag: KnowledgeConceptTagNode | null;
}

interface RawConceptTagDescriptor {
  tagId: string;
  labelEn: string;
  labelFa: string;
  domainCategory: KnowledgeBaseEntryCategory;
}

const CONCEPT_TAG_DICTIONARY: Array<
  RawConceptTagDescriptor & { matchKeywords: string[] }
> = [
  {
    tagId: 'user-state-sync',
    labelEn: '#user-state-sync',
    labelFa: 'همگام‌سازی وضعیت نشست',
    domainCategory: 'user-state',
    matchKeywords: ['user-state', 'recent_session', 'resume', 'checkpoint', 'session'],
  },
  {
    tagId: 'context-rot-guard',
    labelEn: '#context-rot-guard',
    labelFa: 'مهار پوسیدگی زمینه',
    domainCategory: 'mcp-schema',
    matchKeywords: ['context rot', 'stale', 'deprecated', 'obsolete', 'token budget', 'polluting'],
  },
  {
    tagId: 'async-sqlalchemy',
    labelEn: '#async-sqlalchemy',
    labelFa: 'کوئری ناهمگام SQLAlchemy',
    domainCategory: 'architecture-rule',
    matchKeywords: ['sqlalchemy', 'asyncsession', 'select()', 'repositories', 'tenant'],
  },
  {
    tagId: 'pr-review-gates',
    labelEn: '#pr-review-gates',
    labelFa: 'گیت‌های ممیزی PR-Style',
    domainCategory: 'pr-review-directive',
    matchKeywords: ['implementation_plan', 'pr-review', 'inline', 'enforcedgates', 'walkthrough'],
  },
  {
    tagId: 'redis-streams-ws',
    labelEn: '#redis-streams-ws',
    labelFa: 'جریان‌های Redis و WebSocket',
    domainCategory: 'workflow-sop',
    matchKeywords: ['redis', 'websocket', 'pub/sub', 'streams', 'asyncio', 'celery'],
  },
  {
    tagId: 'git-worktree-isolation',
    labelEn: '#git-worktree-isolation',
    labelFa: 'ایزولاسیون Git Worktree',
    domainCategory: 'user-state',
    matchKeywords: ['worktree', 'ag-worktrees', 'parallel', 'branch'],
  },
  {
    tagId: 'declarative-agent-rules',
    labelEn: '#agent-rules',
    labelFa: 'قوانین .agent/rules',
    domainCategory: 'architecture-rule',
    matchKeywords: ['.agent/rules', 'always_on', 'glob:', 'invariant', 'rule'],
  },
  {
    tagId: 'mcp-telemetry-trace',
    labelEn: '#mcp-telemetry',
    labelFa: 'تله‌متری و طرحواره MCP',
    domainCategory: 'mcp-schema',
    matchKeywords: ['trace', 'bundle', 'mcp', 'schema', 'telemetry', 'webpack'],
  },
];

export function extractTagsForKnowledgeEntry(
  item: KnowledgeBaseEntryItem
): RawConceptTagDescriptor[] {
  const combinedText = `${item.keyPath} ${item.titleEn} ${item.titleFa} ${item.contentSnippet} ${item.category}`.toLowerCase();
  const matched = new Map<string, RawConceptTagDescriptor>();

  // Category baseline tag so every entry belongs to its primary architectural cluster
  if (item.category === 'user-state') {
    matched.set('user-state-sync', CONCEPT_TAG_DICTIONARY[0]);
  } else if (item.category === 'architecture-rule') {
    matched.set('declarative-agent-rules', CONCEPT_TAG_DICTIONARY[6]);
  } else if (item.category === 'pr-review-directive') {
    matched.set('pr-review-gates', CONCEPT_TAG_DICTIONARY[3]);
  } else if (item.category === 'workflow-sop') {
    matched.set('redis-streams-ws', CONCEPT_TAG_DICTIONARY[4]);
  } else if (item.category === 'mcp-schema') {
    matched.set('mcp-telemetry-trace', CONCEPT_TAG_DICTIONARY[7]);
  }

  for (const spec of CONCEPT_TAG_DICTIONARY) {
    if (spec.matchKeywords.some((kw) => combinedText.includes(kw))) {
      matched.set(spec.tagId, {
        tagId: spec.tagId,
        labelEn: spec.labelEn,
        labelFa: spec.labelFa,
        domainCategory: spec.domainCategory,
      });
    }
  }

  if (item.stalenessPercent >= 65) {
    matched.set('context-rot-guard', CONCEPT_TAG_DICTIONARY[1]);
  }

  return Array.from(matched.values());
}

export function buildKnowledgeBaseTagBubbleGraph(
  entries: KnowledgeBaseEntryItem[]
): KnowledgeTagBubbleGraph {
  const tagAccumulator = new Map<
    string,
    {
      tagId: string;
      labelEn: string;
      labelFa: string;
      domainCategory: KnowledgeBaseEntryCategory;
      frequency: number;
      totalTokens: number;
      stalenessSum: number;
      entryIds: string[];
      relatedSet: Set<string>;
    }
  >();

  const pairMap = new Map<
    string,
    {
      sourceTagId: string;
      targetTagId: string;
      sharedEntryIds: string[];
    }
  >();

  for (const entry of entries) {
    const entryTags = extractTagsForKnowledgeEntry(entry);
    const tagIds = entryTags.map((t) => t.tagId);

    for (const tag of entryTags) {
      const existing = tagAccumulator.get(tag.tagId);
      if (!existing) {
        tagAccumulator.set(tag.tagId, {
          tagId: tag.tagId,
          labelEn: tag.labelEn,
          labelFa: tag.labelFa,
          domainCategory: tag.domainCategory,
          frequency: 1,
          totalTokens: Math.max(50, entry.tokenCount),
          stalenessSum: entry.stalenessPercent,
          entryIds: [entry.id],
          relatedSet: new Set(tagIds.filter((id) => id !== tag.tagId)),
        });
      } else {
        existing.frequency += 1;
        existing.totalTokens += Math.max(50, entry.tokenCount);
        existing.stalenessSum += entry.stalenessPercent;
        if (!existing.entryIds.includes(entry.id)) {
          existing.entryIds.push(entry.id);
        }
        for (const otherId of tagIds) {
          if (otherId !== tag.tagId) {
            existing.relatedSet.add(otherId);
          }
        }
      }
    }

    // Build pairwise co-occurrence links
    const sortedTagIds = [...tagIds].sort();
    for (let i = 0; i < sortedTagIds.length; i++) {
      for (let j = i + 1; j < sortedTagIds.length; j++) {
        const sId = sortedTagIds[i];
        const tId = sortedTagIds[j];
        const pairKey = `${sId}__${tId}`;
        const existingPair = pairMap.get(pairKey);
        if (!existingPair) {
          pairMap.set(pairKey, {
            sourceTagId: sId,
            targetTagId: tId,
            sharedEntryIds: [entry.id],
          });
        } else if (!existingPair.sharedEntryIds.includes(entry.id)) {
          existingPair.sharedEntryIds.push(entry.id);
        }
      }
    }
  }

  const nodes: KnowledgeConceptTagNode[] = Array.from(tagAccumulator.values())
    .map((acc) => {
      const avgStaleness = Math.round(acc.stalenessSum / Math.max(1, acc.frequency));
      const weightScore = acc.frequency * 180 + Math.round(acc.totalTokens / 6);
      return {
        tagId: acc.tagId,
        labelEn: acc.labelEn,
        labelFa: acc.labelFa,
        domainCategory: acc.domainCategory,
        frequency: acc.frequency,
        totalTokens: acc.totalTokens,
        averageStalenessPercent: avgStaleness,
        entryIds: acc.entryIds,
        relatedTagIds: Array.from(acc.relatedSet),
        weightScore,
      };
    })
    .sort((a, b) => b.weightScore - a.weightScore);

  const links: KnowledgeTagCoOccurrenceLink[] = Array.from(pairMap.values())
    .map((p) => ({
      sourceTagId: p.sourceTagId,
      targetTagId: p.targetTagId,
      sharedEntriesCount: p.sharedEntryIds.length,
      sharedEntryIds: p.sharedEntryIds,
    }))
    .sort((a, b) => b.sharedEntriesCount - a.sharedEntriesCount);

  return {
    nodes,
    links,
    totalUniqueTags: nodes.length,
    totalRelationships: links.length,
    dominantTag: nodes[0] || null,
  };
}

export const KB_YEARLY_USAGE_STORAGE_KEY = 'ag_kb_yearly_usage_log_v1';

export type KnowledgeBaseResearchFocusMode =
  | 'all'
  | 'entries-edits'
  | 'search-queries'
  | 'rot-pruning';

export interface KnowledgeBaseDailyUsageOverride {
  entriesEditedOrCreated: number;
  searchQueriesCount: number;
  rotPrunedCount: number;
  tokensProcessed: number;
}

export interface KnowledgeBaseDailyUsageCell {
  dateIso: string;
  weekIndex: number;
  dayOfWeek: number;
  dayOfWeekLabelEn: string;
  dayOfWeekLabelFa: string;
  monthShortEn: string;
  monthLabelFa: string;
  totalInteractions: number;
  focusedMetricValue: number;
  entriesEditedOrCreated: number;
  searchQueriesCount: number;
  rotPrunedCount: number;
  tokensProcessed: number;
  intensityLevel: 0 | 1 | 2 | 3 | 4;
  dominantResearchPatternEn: string;
  dominantResearchPatternFa: string;
}

export interface KnowledgeBaseYearlyHeatmapMonthTick {
  monthShortEn: string;
  weekIndex: number;
}

export interface KnowledgeBaseYearlyHeatmapSummary {
  cells: KnowledgeBaseDailyUsageCell[];
  monthTicks: KnowledgeBaseYearlyHeatmapMonthTick[];
  totalYearlyInteractions: number;
  activeResearchDaysCount: number;
  activeDaysPercent: number;
  totalEntriesTouchedYearly: number;
  totalSearchQueriesYearly: number;
  totalRotPrunedYearly: number;
  totalTokensProcessedYearly: number;
  peakResearchDay: KnowledgeBaseDailyUsageCell;
  peakResearchMonthEn: string;
  currentResearchStreakDays: number;
}

const WEEKDAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

const MONTH_SHORT_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_LABELS_FA = [
  'ژانویه',
  'فوریه',
  'مارس',
  'آوریل',
  'مه',
  'ژوئن',
  'ژوئیه',
  'اوت',
  'سپتامبر',
  'اکتبر',
  'نوامبر',
  'دسامبر',
];

export function recordKnowledgeBaseDailyUsageAction(
  currentOverrides: Record<string, KnowledgeBaseDailyUsageOverride>,
  dateIso: string,
  actionType: 'entry-edit' | 'search-query' | 'rot-prune',
  tokensDelta: number = 140
): Record<string, KnowledgeBaseDailyUsageOverride> {
  const existing = currentOverrides[dateIso] || {
    entriesEditedOrCreated: 0,
    searchQueriesCount: 0,
    rotPrunedCount: 0,
    tokensProcessed: 0,
  };

  const next: KnowledgeBaseDailyUsageOverride = {
    entriesEditedOrCreated:
      existing.entriesEditedOrCreated + (actionType === 'entry-edit' ? 1 : 0),
    searchQueriesCount:
      existing.searchQueriesCount + (actionType === 'search-query' ? 2 : 0),
    rotPrunedCount:
      existing.rotPrunedCount + (actionType === 'rot-prune' ? 1 : 0),
    tokensProcessed: existing.tokensProcessed + Math.max(40, tokensDelta),
  };

  return {
    ...currentOverrides,
    [dateIso]: next,
  };
}

export function buildKnowledgeBaseYearlyCalendarHeatmap(
  entries: KnowledgeBaseEntryItem[],
  customLogOverrides: Record<string, KnowledgeBaseDailyUsageOverride> = {},
  focusMode: KnowledgeBaseResearchFocusMode = 'all',
  referenceEndDateIso: string = '2026-10-31'
): KnowledgeBaseYearlyHeatmapSummary {
  const totalDays = 364; // 52 full weeks * 7 days
  const endParts = referenceEndDateIso.split('-').map((n) => parseInt(n, 10));
  const endDateUtc = new Date(
    Date.UTC(
      endParts[0] || 2026,
      (endParts[1] || 10) - 1,
      endParts[2] || 31,
      12,
      0,
      0
    )
  );

  // Map entry update dates to boost activity on those specific dates
  const entryUpdatesByDate = new Map<string, { count: number; tokens: number }>();
  for (const item of entries) {
    const datePrefix = (item.updatedAtIso || '').slice(0, 10);
    if (datePrefix.length === 10) {
      const prev = entryUpdatesByDate.get(datePrefix) || { count: 0, tokens: 0 };
      entryUpdatesByDate.set(datePrefix, {
        count: prev.count + 1,
        tokens: prev.tokens + Math.max(80, item.tokenCount),
      });
    }
  }

  const cells: KnowledgeBaseDailyUsageCell[] = [];
  const monthTicks: KnowledgeBaseYearlyHeatmapMonthTick[] = [];
  const monthActivityTotals = new Map<string, number>();
  let lastSeenMonth = -1;

  for (let i = 0; i < totalDays; i++) {
    const offsetDays = totalDays - 1 - i;
    const cellDate = new Date(endDateUtc.getTime() - offsetDays * 86400000);
    const yyyy = cellDate.getUTCFullYear();
    const mm = cellDate.getUTCMonth();
    const dd = cellDate.getUTCDate();
    const dateIso = `${yyyy}-${String(mm + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

    const weekIndex = Math.floor(i / 7);
    const dayOfWeek = cellDate.getUTCDay();
    const monthShortEn = MONTH_SHORT_EN[mm] || 'Oct';
    const monthLabelFa = MONTH_LABELS_FA[mm] || 'اکتبر';

    if (mm !== lastSeenMonth && dayOfWeek <= 3) {
      if (
        monthTicks.length === 0 ||
        weekIndex - monthTicks[monthTicks.length - 1].weekIndex >= 3
      ) {
        monthTicks.push({ monthShortEn, weekIndex });
        lastSeenMonth = mm;
      }
    }

    // Deterministic research cadence across the 52 weeks + recent sprint amplification
    const seed = (i * 31 + (mm + 1) * 17 + dd * 13) % 29;
    const isRecentSprint = offsetDays <= 28;
    const isMidYearResearchWave = offsetDays >= 90 && offsetDays <= 155;
    const isQ1ArchitectureSprint = offsetDays >= 220 && offsetDays <= 270;

    let baseEntries = 0;
    let baseSearches = 0;
    let basePrunes = 0;

    if (isRecentSprint) {
      if (offsetDays <= 10 || seed % 2 === 0) {
        baseEntries = (seed % 3) + 1;
        baseSearches = (seed % 5) + 2;
        basePrunes = seed % 3 === 0 ? 2 : 1;
      }
    } else if (isMidYearResearchWave) {
      if (seed % 3 !== 0) {
        baseEntries = (seed % 3) + 1;
        baseSearches = (seed % 4) + 1;
        basePrunes = seed % 4 === 0 ? 1 : 0;
      }
    } else if (isQ1ArchitectureSprint) {
      if (seed % 2 === 0) {
        baseEntries = (seed % 2) + 1;
        baseSearches = (seed % 4) + 1;
        basePrunes = seed % 5 === 0 ? 1 : 0;
      }
    } else if (seed % 3 === 0 || seed % 7 === 0) {
      baseEntries = seed % 2;
      baseSearches = (seed % 3) + 1;
      basePrunes = seed % 6 === 0 ? 1 : 0;
    }

    const entryBoost = entryUpdatesByDate.get(dateIso);
    const customOverride = customLogOverrides[dateIso];

    const entriesEditedOrCreated =
      baseEntries +
      (entryBoost ? entryBoost.count : 0) +
      (customOverride ? customOverride.entriesEditedOrCreated : 0);
    const searchQueriesCount =
      baseSearches +
      (entryBoost ? entryBoost.count * 2 : 0) +
      (customOverride ? customOverride.searchQueriesCount : 0);
    const rotPrunedCount =
      basePrunes + (customOverride ? customOverride.rotPrunedCount : 0);

    const totalInteractions =
      entriesEditedOrCreated + searchQueriesCount + rotPrunedCount;

    const tokensProcessed =
      totalInteractions > 0
        ? entriesEditedOrCreated * 210 +
          searchQueriesCount * 65 +
          rotPrunedCount * 155 +
          (entryBoost ? entryBoost.tokens : 0) +
          (customOverride ? customOverride.tokensProcessed : 0)
        : 0;

    let focusedMetricValue = totalInteractions;
    if (focusMode === 'entries-edits') {
      focusedMetricValue = entriesEditedOrCreated;
    } else if (focusMode === 'search-queries') {
      focusedMetricValue = searchQueriesCount;
    } else if (focusMode === 'rot-pruning') {
      focusedMetricValue = rotPrunedCount;
    }

    let intensityLevel: 0 | 1 | 2 | 3 | 4 = 0;
    if (focusMode === 'all') {
      if (focusedMetricValue >= 10) intensityLevel = 4;
      else if (focusedMetricValue >= 6) intensityLevel = 3;
      else if (focusedMetricValue >= 3) intensityLevel = 2;
      else if (focusedMetricValue >= 1) intensityLevel = 1;
    } else if (focusMode === 'entries-edits') {
      if (focusedMetricValue >= 4) intensityLevel = 4;
      else if (focusedMetricValue >= 3) intensityLevel = 3;
      else if (focusedMetricValue >= 2) intensityLevel = 2;
      else if (focusedMetricValue >= 1) intensityLevel = 1;
    } else if (focusMode === 'search-queries') {
      if (focusedMetricValue >= 6) intensityLevel = 4;
      else if (focusedMetricValue >= 4) intensityLevel = 3;
      else if (focusedMetricValue >= 2) intensityLevel = 2;
      else if (focusedMetricValue >= 1) intensityLevel = 1;
    } else {
      if (focusedMetricValue >= 3) intensityLevel = 4;
      else if (focusedMetricValue >= 2) intensityLevel = 3;
      else if (focusedMetricValue >= 1) intensityLevel = 2;
    }

    let dominantResearchPatternEn = 'Idle / No KB Activity';
    let dominantResearchPatternFa = 'بدون فعالیت ثبت‌شده در پایگاه دانش';

    if (totalInteractions > 0) {
      if (rotPrunedCount >= 2 && rotPrunedCount >= entriesEditedOrCreated) {
        dominantResearchPatternEn = 'Context Rot Hygiene & Pruning';
        dominantResearchPatternFa = 'پاک‌سازی و هرس پوسیدگی زمینه (Context Rot)';
      } else if (entriesEditedOrCreated >= 3) {
        dominantResearchPatternEn = 'Architecture Rule & State Authoring';
        dominantResearchPatternFa = 'نگارش قوانین معماری و به‌روزرسانی وضعیت';
      } else if (searchQueriesCount >= 4) {
        dominantResearchPatternEn = 'Deep Semantic KB Lookup & Audit';
        dominantResearchPatternFa = 'جستجوی معنایی عمیق و ممیزی آرتیفکت‌ها';
      } else {
        dominantResearchPatternEn = 'Incremental Knowledge Base Sync';
        dominantResearchPatternFa = 'همگام‌سازی تدریجی حافظه ایجنت';
      }
    }

    monthActivityTotals.set(
      monthShortEn,
      (monthActivityTotals.get(monthShortEn) || 0) + totalInteractions
    );

    cells.push({
      dateIso,
      weekIndex,
      dayOfWeek,
      dayOfWeekLabelEn: WEEKDAY_LABELS_EN[dayOfWeek] || 'Sun',
      dayOfWeekLabelFa: WEEKDAY_LABELS_FA[dayOfWeek] || 'یکشنبه',
      monthShortEn,
      monthLabelFa,
      totalInteractions,
      focusedMetricValue,
      entriesEditedOrCreated,
      searchQueriesCount,
      rotPrunedCount,
      tokensProcessed,
      intensityLevel,
      dominantResearchPatternEn,
      dominantResearchPatternFa,
    });
  }

  const totalYearlyInteractions = cells.reduce(
    (sum, c) => sum + c.totalInteractions,
    0
  );
  const activeResearchDaysCount = cells.filter(
    (c) => c.totalInteractions > 0
  ).length;
  const activeDaysPercent = Math.round(
    (activeResearchDaysCount / Math.max(1, cells.length)) * 100
  );
  const totalEntriesTouchedYearly = cells.reduce(
    (sum, c) => sum + c.entriesEditedOrCreated,
    0
  );
  const totalSearchQueriesYearly = cells.reduce(
    (sum, c) => sum + c.searchQueriesCount,
    0
  );
  const totalRotPrunedYearly = cells.reduce(
    (sum, c) => sum + c.rotPrunedCount,
    0
  );
  const totalTokensProcessedYearly = cells.reduce(
    (sum, c) => sum + c.tokensProcessed,
    0
  );

  let peakResearchDay = cells[cells.length - 1];
  for (const c of cells) {
    if (c.totalInteractions >= peakResearchDay.totalInteractions) {
      peakResearchDay = c;
    }
  }

  let peakResearchMonthEn = 'Oct';
  let maxMonthTotal = -1;
  for (const [mKey, mVal] of monthActivityTotals.entries()) {
    if (mVal > maxMonthTotal) {
      maxMonthTotal = mVal;
      peakResearchMonthEn = mKey;
    }
  }

  let currentResearchStreakDays = 0;
  for (let idx = cells.length - 1; idx >= 0; idx--) {
    if (cells[idx].totalInteractions > 0) {
      currentResearchStreakDays += 1;
    } else {
      break;
    }
  }

  return {
    cells,
    monthTicks,
    totalYearlyInteractions,
    activeResearchDaysCount,
    activeDaysPercent,
    totalEntriesTouchedYearly,
    totalSearchQueriesYearly,
    totalRotPrunedYearly,
    totalTokensProcessedYearly,
    peakResearchDay,
    peakResearchMonthEn,
    currentResearchStreakDays,
  };
}

export type KnowledgeBaseSearchFieldScope =
  | 'all'
  | 'title-only'
  | 'content-only';

export interface KnowledgeBaseTagFilterOption {
  tagId: string;
  labelEn: string;
  labelFa: string;
  domainCategory: KnowledgeBaseEntryCategory;
  count: number;
}

export interface KnowledgeBaseFullTextMatchResult {
  item: KnowledgeBaseEntryItem;
  tags: RawConceptTagDescriptor[];
  matchedInTitle: boolean;
  matchedInContent: boolean;
  matchedInKeyPath: boolean;
  matchedInTags: boolean;
  relevanceScore: number;
}

export interface KnowledgeBaseFullTextSearchSummary {
  results: KnowledgeBaseFullTextMatchResult[];
  totalMatched: number;
  totalMatchedInTitle: number;
  totalMatchedInContent: number;
  matchedTokenSum: number;
  availableTagOptions: KnowledgeBaseTagFilterOption[];
}

export function searchKnowledgeBaseFullText(params: {
  entries: KnowledgeBaseEntryItem[];
  searchQuery: string;
  searchScope?: KnowledgeBaseSearchFieldScope;
  selectedTagId?: string | 'all' | null;
  selectedCategory?: KnowledgeBaseEntryCategory | 'all';
  onlyStaleRot?: boolean;
}): KnowledgeBaseFullTextSearchSummary {
  const {
    entries,
    searchQuery,
    searchScope = 'all',
    selectedTagId = 'all',
    selectedCategory = 'all',
    onlyStaleRot = false,
  } = params;

  // 1. Build available tag options across all entries
  const tagMap = new Map<string, KnowledgeBaseTagFilterOption>();
  const entryTagsById = new Map<string, RawConceptTagDescriptor[]>();

  for (const spec of CONCEPT_TAG_DICTIONARY) {
    tagMap.set(spec.tagId, {
      tagId: spec.tagId,
      labelEn: spec.labelEn,
      labelFa: spec.labelFa,
      domainCategory: spec.domainCategory,
      count: 0,
    });
  }

  for (const item of entries) {
    const tags = extractTagsForKnowledgeEntry(item);
    entryTagsById.set(item.id, tags);
    for (const t of tags) {
      const existing = tagMap.get(t.tagId);
      if (existing) {
        existing.count += 1;
      } else {
        tagMap.set(t.tagId, {
          tagId: t.tagId,
          labelEn: t.labelEn,
          labelFa: t.labelFa,
          domainCategory: t.domainCategory,
          count: 1,
        });
      }
    }
  }

  const availableTagOptions = Array.from(tagMap.values())
    .filter((opt) => opt.count > 0)
    .sort((a, b) => b.count - a.count || a.labelEn.localeCompare(b.labelEn));

  const normalizedQuery = (searchQuery || '').trim().toLowerCase();
  const queryTerms = normalizedQuery
    ? normalizedQuery.split(/\s+/).filter(Boolean)
    : [];

  const activeTag =
    selectedTagId && selectedTagId !== 'all' ? selectedTagId : null;

  const results: KnowledgeBaseFullTextMatchResult[] = [];
  let totalMatchedInTitle = 0;
  let totalMatchedInContent = 0;
  let matchedTokenSum = 0;

  for (const item of entries) {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      continue;
    }
    if (onlyStaleRot && item.stalenessPercent < 65) {
      continue;
    }

    const itemTags = entryTagsById.get(item.id) || [];
    if (activeTag && !itemTags.some((t) => t.tagId === activeTag)) {
      continue;
    }

    if (queryTerms.length === 0) {
      results.push({
        item,
        tags: itemTags,
        matchedInTitle: false,
        matchedInContent: false,
        matchedInKeyPath: false,
        matchedInTags: Boolean(activeTag),
        relevanceScore: 1,
      });
      matchedTokenSum += Math.max(0, item.tokenCount);
      continue;
    }

    const titleText = `${item.titleFa} ${item.titleEn}`.toLowerCase();
    const keyPathText = item.keyPath.toLowerCase();
    const contentText = item.contentSnippet.toLowerCase();
    const tagText = itemTags
      .map((t) => `${t.tagId} ${t.labelEn} ${t.labelFa}`)
      .join(' ')
      .toLowerCase();

    const matchedInTitle = queryTerms.every(
      (term) => titleText.includes(term) || keyPathText.includes(term)
    );
    const matchedInKeyPath = queryTerms.every((term) =>
      keyPathText.includes(term)
    );
    const matchedInContent = queryTerms.every((term) =>
      contentText.includes(term)
    );
    const matchedInTags = queryTerms.every((term) => tagText.includes(term));

    let isMatch = false;
    if (searchScope === 'title-only') {
      isMatch = matchedInTitle;
    } else if (searchScope === 'content-only') {
      isMatch = matchedInContent;
    } else {
      // Multi-term full-text check across combined document surface
      const combinedSurface = `${titleText} ${keyPathText} ${contentText} ${tagText}`;
      isMatch = queryTerms.every((term) => combinedSurface.includes(term));
    }

    if (!isMatch) {
      continue;
    }

    const anyTitleHit = queryTerms.some(
      (term) => titleText.includes(term) || keyPathText.includes(term)
    );
    const anyContentHit = queryTerms.some((term) => contentText.includes(term));
    const anyKeyPathHit = queryTerms.some((term) => keyPathText.includes(term));
    const anyTagHit = queryTerms.some((term) => tagText.includes(term));

    if (anyTitleHit) totalMatchedInTitle += 1;
    if (anyContentHit) totalMatchedInContent += 1;
    matchedTokenSum += Math.max(0, item.tokenCount);

    const relevanceScore =
      (anyTitleHit ? 10 : 0) +
      (anyKeyPathHit ? 6 : 0) +
      (anyTagHit ? 5 : 0) +
      (anyContentHit ? 4 : 0);

    results.push({
      item,
      tags: itemTags,
      matchedInTitle: anyTitleHit,
      matchedInContent: anyContentHit,
      matchedInKeyPath: anyKeyPathHit,
      matchedInTags: anyTagHit,
      relevanceScore,
    });
  }

  if (queryTerms.length > 0) {
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  return {
    results,
    totalMatched: results.length,
    totalMatchedInTitle,
    totalMatchedInContent,
    matchedTokenSum,
    availableTagOptions,
  };
}







