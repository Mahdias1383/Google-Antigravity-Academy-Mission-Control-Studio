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
  | 'landing'
  | 'profile'
  | 'curriculum'
  | 'achievements'
  | 'simulator'
  | 'guardrails'
  | 'mcp'
  | 'cheatsheets'
  | 'scenarios'
  | 'ai-architect'
  | 'knowledge-base'
  | 'game-3d';

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
  landing: {
    titleFa: 'صفحه اصلی و درگاه آکادمی Google Antigravity',
    titleEn: 'Google Antigravity Academy Showcase & Portal',
    badgeEn: 'PORTAL · ACADEMY HOME',
  },
  profile: {
    titleFa: 'پروفایل و کارنامه جامع تحصیلی معمار ارشد',
    titleEn: 'Architect Profile, Badges & Certified Transcript',
    badgeEn: 'ARCHITECT · PROFILE & TRANSCRIPT',
  },
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
  'game-3d': {
    titleFa: 'میدان نبرد سه‌بعدی Antigravity (Three.js 3D Cyber-Defense Arena)',
    titleEn: 'Antigravity 3D Cyber-Defense Game: Context Rot Purge (Three.js)',
    badgeEn: 'STUDIO · 3D CYBER ARENA',
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

export interface QuickStudyModeStateTransition {
  isStudyMode: boolean;
  sidebarOpen: boolean;
  activeSection: string;
}

export function computeQuickStudyModeTransition(
  currentStudyMode: boolean,
  currentSection: string
): QuickStudyModeStateTransition {
  if (!currentStudyMode) {
    return {
      isStudyMode: true,
      sidebarOpen: false,
      activeSection: 'curriculum',
    };
  }
  return {
    isStudyMode: false,
    sidebarOpen: true,
    activeSection: currentSection,
  };
}

export function computeReadingEstimateForModule(moduleNumber: number): {
  estimatedMinutes: number;
  labelFa: string;
  labelEn: string;
} {
  const estimates: Record<number, number> = {
    1: 10,
    2: 12,
    3: 15,
    4: 14,
    5: 16,
    6: 15,
    7: 18,
    8: 14,
  };
  const mins = estimates[moduleNumber] || 12;
  return {
    estimatedMinutes: mins,
    labelFa: `${mins} دقیقه مطالعه متمرکز`,
    labelEn: `${mins} min deep read`,
  };
}

export interface BreadcrumbTooltipDetail {
  title: string;
  fullPath: string;
  description: string;
  badge: string;
  meta?: string;
}

export interface BreadcrumbDescriptorWithTooltips {
  group: string;
  subgroup: string;
  item: string;
  fullPath: string;
  groupTooltip: BreadcrumbTooltipDetail;
  subgroupTooltip: BreadcrumbTooltipDetail;
  itemTooltip: BreadcrumbTooltipDetail;
}

export function buildBreadcrumbDescriptorWithTooltips(params: {
  activeSection: string;
  language: 'fa' | 'en';
  currentModule: {
    number: number;
    titleFa: string;
    titleEn: string;
    summaryFa: string;
    summaryEn?: string;
    readingTime: string;
    difficulty: string;
  };
  formattedModNumber: string;
}): BreadcrumbDescriptorWithTooltips {
  const { activeSection, language, currentModule, formattedModNumber } = params;
  const isEn = language === 'en';

  if (activeSection === 'landing') {
    const group = isEn ? 'Antigravity Academy' : 'آکادمی Antigravity';
    const subgroup = isEn ? 'Portal' : 'درگاه اصلی';
    const item = isEn ? 'Academy Showcase & Roadmap' : 'صفحه اصلی و نقشه راه';
    const fullPath = `${group} / ${subgroup} / ${item}`;
    return {
      group,
      subgroup,
      item,
      fullPath,
      groupTooltip: {
        title: group,
        fullPath: group,
        description: isEn
          ? 'Google Antigravity Enterprise Architecture Academy and Mission Control platform.'
          : 'پلتفرم جامع آکادمی معماری سازمانی و اتاق فرمان Antigravity.',
        badge: 'Academy',
      },
      subgroupTooltip: {
        title: subgroup,
        fullPath: `${group} / ${subgroup}`,
        description: isEn
          ? 'Interactive showcase, curriculum overview, and live telemetry.'
          : 'نمای کلی پلتفرم، سرفصل‌ها و آمار زنده دوره.',
        badge: 'Overview',
      },
      itemTooltip: {
        title: item,
        fullPath,
        description: isEn
          ? 'Explore the 8-module curriculum, interactive studios, student cohort leaderboard, and architectural foundations.'
          : 'کاوش سرفصل‌های ۸گانه، استودیوهای زنده، تابلوی نخبگان و مبانی معماری ایجنت‌محور.',
        badge: 'Landing',
      },
    };
  }

  if (activeSection === 'profile') {
    const group = isEn ? 'Architect Workspace' : 'میز کار معمار';
    const subgroup = isEn ? 'Identity & Records' : 'شناسنامه و سوابق';
    const item = isEn ? 'Architect Profile & Transcript' : 'پروفایل و کارنامه تحصیلی';
    const fullPath = `${group} / ${subgroup} / ${item}`;
    return {
      group,
      subgroup,
      item,
      fullPath,
      groupTooltip: {
        title: group,
        fullPath: group,
        description: isEn
          ? 'Personalized architect portal with activity tracking, certifications, and transcripts.'
          : 'پورتال اختصاصی معمار شامل پایش فعالیت‌ها، مدارک و کارنامه علمی.',
        badge: 'Profile',
      },
      subgroupTooltip: {
        title: subgroup,
        fullPath: `${group} / ${subgroup}`,
        description: isEn
          ? 'Verifiable credentials, 52-week activity heatmap, and knowledge check scores.'
          : 'مدارک قابل اعتبارسنجی، هیت‌مپ ۵۲ هفته‌ای و نمرات آزمون‌ها.',
        badge: 'Records',
      },
      itemTooltip: {
        title: item,
        fullPath,
        description: isEn
          ? 'Manage your architect handle, view exam transcripts, track streaks, and export certified records.'
          : 'مدیریت شناسه معمار، مشاهده ریزنمرات آزمون‌ها، استمرار مطالعه و دریافت کارنامه رسمی.',
        badge: 'Transcript',
      },
    };
  }

  if (activeSection === 'curriculum') {
    const phaseNumber = currentModule.number <= 3 ? 1 : currentModule.number <= 6 ? 2 : 3;
    const subgroup =
      phaseNumber === 1
        ? isEn
          ? 'Phase 1 · Core Architecture'
          : 'گام اول · معماری هسته و اجرا'
        : phaseNumber === 2
        ? isEn
          ? 'Phase 2 · Rules & Automation'
          : 'گام دوم · قوانین و اتوماسیون'
        : isEn
        ? 'Phase 3 · Scale & Multi-Agent'
        : 'گام سوم · مقیاس‌پذیری و MCP';

    const phaseDesc =
      phaseNumber === 1
        ? isEn
          ? 'Modules 01–03: Dual-workspace architecture, verifiable artifacts, and terminal sandboxing.'
          : 'فصول ۰۱ تا ۰۳: معماری دوگانه Editor/Manager، ممیزی آرتیفکت‌ها و امنیت اجرای دستورات ترمینال.'
        : phaseNumber === 2
        ? isEn
          ? 'Modules 04–06: 4-tier Rules, Knowledge Base memory hygiene, Workflows, and Browser Subagent QA.'
          : 'فصول ۰۴ تا ۰۶: قوانین ۴ حالته، مدیریت حافظه و Context Rot، ورک‌فلوهای توربو و عامل مرورگر.'
        : isEn
        ? 'Modules 07–08: FastMCP 2.0 server extensibility and parallel multi-agent Git Worktree orchestration.'
        : 'فصول ۰۷ تا ۰۸: توسعه سرورهای پایتون با پروتکل FastMCP 2.0 و ارکستریشن موازی روی Git Worktree.';

    const group = isEn ? 'Curriculum' : 'سرفصل‌های آموزشی';
    const item = isEn
      ? `Module ${formattedModNumber}: ${currentModule.titleEn}`
      : `فصل ${formattedModNumber}: ${currentModule.titleFa}`;
    const fullPath = `${group} / ${subgroup} / ${item}`;
    const modDesc =
      isEn && currentModule.summaryEn ? currentModule.summaryEn : currentModule.summaryFa;

    return {
      group,
      subgroup,
      item,
      fullPath,
      groupTooltip: {
        title: isEn ? 'Academy Curriculum (8 Modules)' : 'سرفصل‌های آموزشی آکادمی (۸ فصل جامع)',
        fullPath: group,
        description: isEn
          ? 'Complete Principal Architect curriculum covering Agent-First engineering, security guardrails, MCP servers, and multi-agent scaling.'
          : 'مسیر کامل معمار ارشد شامل مهندسی Agent-First، گاردریل‌های امنیتی، سرورهای MCP و مقیاس‌پذیری چندایجنتی.',
        badge: isEn ? '8 Chapters' : '۸ فصل آموزشی',
      },
      subgroupTooltip: {
        title: subgroup,
        fullPath: `${group} / ${subgroup}`,
        description: phaseDesc,
        badge: isEn ? `Phase 0${phaseNumber}` : `فاز ۰${phaseNumber}`,
      },
      itemTooltip: {
        title: item,
        fullPath,
        description: modDesc,
        badge: `MOD-0${currentModule.number}`,
        meta: `${currentModule.difficulty} · ${currentModule.readingTime}`,
      },
    };
  }

  if (['simulator', 'guardrails', 'mcp', 'scenarios'].includes(activeSection)) {
    const studioMeta: Record<
      string,
      { fa: string; en: string; descFa: string; descEn: string; badge: string }
    > = {
      simulator: {
        fa: 'شبیه‌ساز Mission Control',
        en: 'Mission Control Simulator',
        descFa:
          'شبیه‌ساز زنده محیط دوگانه Editor View و Agent Manager با قابلیت ممیزی آرتیفکت‌ها (task.md, implementation_plan.md, walkthrough.md).',
        descEn:
          'Live dual-surface Editor View and Agent Manager simulator with interactive artifact auditing (task.md, implementation_plan.md, walkthrough.md).',
        badge: 'Live IDE',
      },
      guardrails: {
        fa: 'مهندسی Rule و Workflow',
        en: 'Rule & Workflow Studio',
        descFa:
          'طراحی قوانین ۴ حالته (.agent/rules/*.md)، شبیه‌ساز گاردریل امنیت ترمینال و پایپ‌لاین اتوماسیون // turbo.',
        descEn:
          'Author 4-mode architectural rules (.agent/rules/*.md), test terminal command guardrails, and simulate // turbo workflow pipelines.',
        badge: 'Turbo Rules',
      },
      mcp: {
        fa: 'استودیو بصری FastMCP',
        en: 'FastMCP Visual Studio',
        descFa:
          'طراحی و تولید کد سرورهای پایتون FastMCP 2.0، تست JSON-RPC و پیکربندی mcp_config.json.',
        descEn:
          'Design and generate Python FastMCP 2.0 servers, inspect JSON-RPC payloads, and build mcp_config.json.',
        badge: 'MCP Hub',
      },
      scenarios: {
        fa: 'آزمایشگاه سناریوهای معماری',
        en: 'Architect Scenario Lab',
        descFa:
          '۸ چالش تصمیم‌گیری معماری در شرایط واقعی پروداکشن همراه با تحلیل تریدآف‌ها و امتیازدهی معمار ارشد.',
        descEn:
          '8 real-world production architecture decision challenges with trade-off analysis and Principal Architect scoring.',
        badge: '8 Labs',
      },
    };

    const selected = studioMeta[activeSection] || studioMeta.simulator;
    const group = isEn ? 'Engineering Studios' : 'استودیوهای مهندسی زنده';
    const subgroup = isEn ? 'Interactive Workbenches' : 'میز کارهای تعاملی';
    const item = isEn ? selected.en : selected.fa;
    const fullPath = `${group} / ${subgroup} / ${item}`;

    return {
      group,
      subgroup,
      item,
      fullPath,
      groupTooltip: {
        title: group,
        fullPath: group,
        description: isEn
          ? '4 interactive engineering sandboxes for hands-on practice with Mission Control, Rules, FastMCP, and Architecture Scenarios.'
          : '۴ محیط آزمایشگاهی تعاملی برای تمرین عملی مدیریت ایجنت‌ها، قوانین امنیتی، پروتکل FastMCP و سناریوهای معماری.',
        badge: '4 Studios',
      },
      subgroupTooltip: {
        title: subgroup,
        fullPath: `${group} / ${subgroup}`,
        description: isEn
          ? 'Real-time simulation workbenches with live code generation and telemetry inspection.'
          : 'میز کارهای شبیه‌سازی بلادرنگ با قابلیت تولید زنده کد و بررسی تلمتری.',
        badge: 'Interactive',
      },
      itemTooltip: {
        title: item,
        fullPath,
        description: isEn ? selected.descEn : selected.descFa,
        badge: selected.badge,
      },
    };
  }

  if (['knowledge-base', 'ai-architect', 'cheatsheets'].includes(activeSection)) {
    const toolMeta: Record<
      string,
      { fa: string; en: string; descFa: string; descEn: string; badge: string }
    > = {
      'knowledge-base': {
        fa: 'پایگاه دانش و مهار Context Rot',
        en: 'Knowledge Base & Context Rot',
        descFa:
          'مدیریت حافظه پایدار ایجنت‌ها، هرس پوسیدگی کانتکست (Context Rot) و تحلیل گراف دانش و هیت‌مپ سالانه D3.',
        descEn:
          'Persistent agent memory management, Context Rot pruning, D3 concept bubble graphs, and 52-week research heatmaps.',
        badge: 'Memory & D3',
      },
      'ai-architect': {
        fa: 'دستیار هوشمند و کاوشگر مستندات',
        en: 'AI Architect & Live Docs',
        descFa:
          'کاوشگر مستندات رسمی Google Antigravity همراه با آزمون‌های تعاملی سنجش تسلط و پاداش XP.',
        descEn:
          'Official Google Antigravity documentation explorer paired with interactive mastery quizzes and XP rewards.',
        badge: 'Docs & Quiz',
      },
      cheatsheets: {
        fa: 'مرکز چیت‌شیت‌ها و مراجع PDF',
        en: 'Reference Cheat Sheets & PDF',
        descFa:
          'مجموعه کامل جداول شورتکات‌های کیبورد، دستورات اسلش، منشن‌های کانتکست و خروجی استاندارد PDF.',
        descEn:
          'Complete reference matrices for keyboard shortcuts, slash commands, context @mentions, and clean PDF exports.',
        badge: 'PDF & Tables',
      },
    };

    const selected = toolMeta[activeSection] || toolMeta['knowledge-base'];
    const group = isEn ? 'Knowledge & AI' : 'پایگاه دانش و هوش مصنوعی';
    const subgroup = isEn ? 'Documentation & Memory' : 'کانتکست و مستندات رسمی';
    const item = isEn ? selected.en : selected.fa;
    const fullPath = `${group} / ${subgroup} / ${item}`;

    return {
      group,
      subgroup,
      item,
      fullPath,
      groupTooltip: {
        title: group,
        fullPath: group,
        description: isEn
          ? 'Context engineering memory management, official documentation explorer, and reference cheat sheets.'
          : 'مدیریت مهندسی کانتکست و حافظه، کاوشگر مستندات رسمی و مراجع سریع چیت‌شیت.',
        badge: '3 Tools',
      },
      subgroupTooltip: {
        title: subgroup,
        fullPath: `${group} / ${subgroup}`,
        description: isEn
          ? 'Curated knowledge artifacts, semantic search, and printable architectural guides.'
          : 'آرتیفکت‌های دانش سازمان‌یافته، جستجوی معنایی و راهنماهای قابل چاپ معماری.',
        badge: 'Knowledge',
      },
      itemTooltip: {
        title: item,
        fullPath,
        description: isEn ? selected.descEn : selected.descFa,
        badge: selected.badge,
      },
    };
  }

  const group = isEn ? 'Mastery & Evaluation' : 'ارزیابی و کارنامه مهندسی';
  const subgroup = isEn ? 'Certification' : 'رتبه‌بندی و نشان‌ها';
  const item = isEn ? 'Official Architect Certification' : 'کارنامه مهارت و صدور گواهینامه';
  const fullPath = `${group} / ${subgroup} / ${item}`;

  return {
    group,
    subgroup,
    item,
    fullPath,
    groupTooltip: {
      title: group,
      fullPath: group,
      description: isEn
        ? 'Track your XP standing, unlock engineering badges, and export your official Principal Architect certificate.'
        : 'پایش امتیاز XP، دریافت نشان‌های تخصصی مهندسی و صدور گواهینامه رسمی معمار ارشد.',
      badge: 'Mastery',
    },
    subgroupTooltip: {
      title: subgroup,
      fullPath: `${group} / ${subgroup}`,
      description: isEn
        ? 'Verifiable skill standing, streak heatmaps, and shareable progress cards.'
        : 'رتبه‌بندی قابل راستی‌آزمایی، هیت‌مپ استمرار مطالعه و کارت‌های پیشرفت قابل اشتراک‌گذاری.',
      badge: 'Rank & Cert',
    },
    itemTooltip: {
      title: item,
      fullPath,
      description: isEn
        ? 'View your complete mastery report card, earned trophies, and printable certification.'
        : 'مشاهده کارنامه جامع مهارت، نشان‌های کسب‌شده و دریافت گواهینامه قابل چاپ.',
      badge: 'Certificate',
    },
  };
}

export type ModuleNodeProgressState = 'completed' | 'active' | 'pending';

export interface SidebarModulePathNode {
  id: string;
  number: number;
  titleFa: string;
  titleEn: string;
  status: ModuleNodeProgressState;
  isCurrent: boolean;
  isCompleted: boolean;
  x: number;
  y: number;
}

export interface SidebarModulePathSegment {
  id: string;
  fromId: string;
  toId: string;
  pathD: string;
  status: ModuleNodeProgressState;
}

export interface SidebarModulePathGraph {
  nodes: SidebarModulePathNode[];
  segments: SidebarModulePathSegment[];
  fullTrackPathD: string;
  counts: {
    completed: number;
    active: number;
    pending: number;
    total: number;
  };
}

const SERPENTINE_NODE_COORDS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 28, y: 24 },
  { x: 92, y: 16 },
  { x: 158, y: 28 },
  { x: 224, y: 18 },
  { x: 224, y: 74 },
  { x: 158, y: 64 },
  { x: 92, y: 78 },
  { x: 28, y: 68 },
];

export function buildSidebarModulePathGraph(params: {
  modules: ReadonlyArray<{
    id: string;
    number: number;
    titleFa: string;
    titleEn: string;
  }>;
  completedModules: ReadonlyArray<string>;
  activeModuleId: string;
  activeSection: string;
}): SidebarModulePathGraph {
  const { modules, completedModules, activeModuleId, activeSection } = params;
  const completedSet = new Set(completedModules);
  const isCurriculumSection = activeSection === 'curriculum';

  const nodes: SidebarModulePathNode[] = modules.map((mod, idx) => {
    const coord = SERPENTINE_NODE_COORDS[idx] || {
      x: 28 + (idx % 4) * 64,
      y: idx < 4 ? 22 : 70,
    };
    const isCurrent = isCurriculumSection && mod.id === activeModuleId;
    const isCompleted = completedSet.has(mod.id);
    const status: ModuleNodeProgressState = isCurrent
      ? 'active'
      : isCompleted
      ? 'completed'
      : 'pending';

    return {
      id: mod.id,
      number: mod.number,
      titleFa: mod.titleFa,
      titleEn: mod.titleEn,
      status,
      isCurrent,
      isCompleted,
      x: coord.x,
      y: coord.y,
    };
  });

  const segments: SidebarModulePathSegment[] = [];
  const curveCommands: string[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i];
    const to = nodes[i + 1];
    let pathD = '';
    let cubicSuffix = '';

    if (i === 3) {
      // Smooth right-hand U-turn curve connecting Row 1 (Node 4) to Row 2 (Node 5)
      cubicSuffix = `C 268 ${from.y}, 268 ${to.y}, ${to.x} ${to.y}`;
      pathD = `M ${from.x} ${from.y} ${cubicSuffix}`;
    } else {
      const midX = Math.round((from.x + to.x) / 2);
      cubicSuffix = `C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
      pathD = `M ${from.x} ${from.y} ${cubicSuffix}`;
    }

    if (i === 0) {
      curveCommands.push(`M ${from.x} ${from.y} ${cubicSuffix}`);
    } else {
      curveCommands.push(cubicSuffix);
    }

    let segStatus: ModuleNodeProgressState = 'pending';
    if (from.isCompleted && to.isCompleted) {
      segStatus = 'completed';
    } else if (
      from.isCurrent ||
      to.isCurrent ||
      (from.isCompleted && !to.isCompleted)
    ) {
      segStatus = 'active';
    }

    segments.push({
      id: `seg-${from.number}-${to.number}`,
      fromId: from.id,
      toId: to.id,
      pathD,
      status: segStatus,
    });
  }

  const completedCount = nodes.filter((n) => n.isCompleted).length;
  const activeCount = nodes.filter((n) => n.status === 'active').length;
  const pendingCount = nodes.filter(
    (n) => !n.isCompleted && n.status !== 'active'
  ).length;

  return {
    nodes,
    segments,
    fullTrackPathD: curveCommands.join(' '),
    counts: {
      completed: completedCount,
      active: activeCount,
      pending: pendingCount,
      total: nodes.length,
    },
  };
}

export type QuickOverviewLens =
  | 'principal-synthesis'
  | 'security-guardrails'
  | 'production-execution';

export interface QuickOverviewTakeawayItem {
  id: string;
  principleBadge: string;
  title: string;
  takeaway: string;
  impactMetric: string;
}

export interface ModuleQuickOverviewPayload {
  moduleId: string;
  moduleNumber: number;
  lens: QuickOverviewLens;
  language: 'fa' | 'en';
  executiveHeadline: string;
  coreEngineeringPrinciple: string;
  takeaways: QuickOverviewTakeawayItem[];
  modelUsed: string;
  generatedAtIso: string;
  source: 'ai-live' | 'ai-curated';
}

export interface ModuleQuickOverviewInput {
  id: string;
  number: number;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  summaryEn?: string;
  difficulty: string;
  readingTime: string;
  keyTakeaways: ReadonlyArray<{
    titleFa?: string;
    descFa?: string;
    titleEn?: string;
    descEn?: string;
    metricOrBadge: string;
  }>;
  subSections?: ReadonlyArray<{
    id: string;
    titleFa: string;
    titleEn: string;
    bulletPoints?: ReadonlyArray<{
      termEn: string;
      descFa?: string;
      descEn?: string;
    }>;
  }>;
}

export function buildModuleQuickOverviewPrompt(params: {
  module: ModuleQuickOverviewInput;
  lens: QuickOverviewLens;
  language: 'fa' | 'en';
}): string {
  const { module, lens, language } = params;
  const isEn = language === 'en';

  const lensFocus =
    lens === 'security-guardrails'
      ? 'Zero-Trust Security, .agent/rules Guardrails, Terminal Governance, and Failure Prevention'
      : lens === 'production-execution'
      ? 'Production Implementation, Workflow Automation (// turbo), Artifact Verification, and Latency/Token Efficiency'
      : 'Principal Architectural Synthesis, Agent-First Paradigm Shift, and System Design Trade-offs';

  const takeawaysList = module.keyTakeaways
    .map(
      (kt, idx) =>
        `${idx + 1}. [${kt.metricOrBadge}] ${
          isEn ? kt.titleEn || kt.titleFa : kt.titleFa || kt.titleEn
        }: ${isEn ? kt.descEn || kt.descFa : kt.descFa || kt.descEn}`
    )
    .join('\n');

  const subSectionSummary = (module.subSections || [])
    .map((s) => {
      const terms = (s.bulletPoints || []).map((b) => b.termEn).join(', ');
      return `- ${s.titleEn} (${s.titleFa})${terms ? ` [Key terms: ${terms}]` : ''}`;
    })
    .join('\n');

  const langDirective = isEn
    ? 'Write all titles, takeaways, and executiveHeadline in concise, authoritative English.'
    : 'Write executiveHeadline, coreEngineeringPrinciple, and takeaway descriptions in fluent, natural Persian (RTL), while keeping technical terms, file paths (e.g., task.md, implementation_plan.md, walkthrough.md, .agent/rules/), and principleBadge / impactMetric in English.';

  return [
    `Generate a structured 'Quick Overview' with 3 high-signal AI-synthesized key takeaways for Module 0${module.number}: "${module.titleEn}" (${module.titleFa}).`,
    `Focus Lens: ${lensFocus}`,
    `Module Summary: ${isEn ? module.summaryEn || module.summaryFa : module.summaryFa}`,
    `Core Module Takeaways:\n${takeawaysList}`,
    subSectionSummary ? `Sub-sections & Engineering Primitives:\n${subSectionSummary}` : '',
    `Language & Formatting Rule: ${langDirective}`,
    `Return strict JSON matching the requested schema with executiveHeadline, coreEngineeringPrinciple, and exactly 3 takeaways.`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildDeterministicModuleQuickOverview(params: {
  module: ModuleQuickOverviewInput;
  lens: QuickOverviewLens;
  language: 'fa' | 'en';
  generatedAtIso?: string;
}): ModuleQuickOverviewPayload {
  const { module, lens, language } = params;
  const isEn = language === 'en';
  const nowIso = params.generatedAtIso || new Date().toISOString();

  const lensPrefixEn =
    lens === 'security-guardrails'
      ? 'Zero-Trust Guardrail'
      : lens === 'production-execution'
      ? 'Production Execution'
      : 'Principal Architecture';

  const lensPrefixFa =
    lens === 'security-guardrails'
      ? 'گاردریل امنیت Zero-Trust'
      : lens === 'production-execution'
      ? 'اجرای عملیاتی Production'
      : 'سنتز معماری Principal';

  const firstSub = module.subSections?.[0];
  const secondSub = module.subSections?.[1];
  const allBullets = (module.subSections || []).flatMap((s) => s.bulletPoints || []);

  const baseTakeaways: QuickOverviewTakeawayItem[] = module.keyTakeaways
    .slice(0, 3)
    .map((kt, idx) => {
      const rawTitle = isEn
        ? kt.titleEn || kt.titleFa || `Principle ${idx + 1}`
        : kt.titleFa || kt.titleEn || `اصل مهندسی ${idx + 1}`;
      const rawDesc = isEn
        ? kt.descEn || kt.descFa || ''
        : kt.descFa || kt.descEn || '';

      if (lens === 'security-guardrails') {
        const matchedBullet = allBullets[idx];
        const termTag = matchedBullet?.termEn || kt.metricOrBadge;
        return {
          id: `${module.id}-qo-${lens}-${idx + 1}`,
          principleBadge: termTag,
          title: isEn
            ? `${rawTitle} · Policy Enforcement`
            : `${rawTitle} · اعمال سیاست امنیتی`,
          takeaway: isEn
            ? `${rawDesc} Enforced via deterministic ${termTag} verification boundaries before any workspace mutation.`
            : `${rawDesc} اعمال‌شده از طریق مرزهای اعتبارسنجی قطعی ${termTag} پیش از هرگونه تغییر در فضای کاری.`,
          impactMetric: `Zero-Trust #0${idx + 1}`,
        };
      }

      if (lens === 'production-execution') {
        const subRef = (idx === 0 ? firstSub : secondSub) || firstSub;
        const subBadge = subRef?.titleEn?.split(':')[0]?.trim() || kt.metricOrBadge;
        return {
          id: `${module.id}-qo-${lens}-${idx + 1}`,
          principleBadge: kt.metricOrBadge,
          title: isEn
            ? `${rawTitle} in CI/CD & IDE`
            : `${rawTitle} در پایپ‌لاین عملیاتی`,
          takeaway: isEn
            ? `${rawDesc} Operationalized across ${subBadge} to eliminate manual debugging loops and reduce context overhead.`
            : `${rawDesc} پیاده‌سازی در سطح ${subBadge} جهت حذف حلقه‌های دیباگ دستی و بهینه‌سازی مصرف توکن.`,
          impactMetric: `Stage 0${idx + 1} · Ready`,
        };
      }

      return {
        id: `${module.id}-qo-${lens}-${idx + 1}`,
        principleBadge: kt.metricOrBadge,
        title: rawTitle,
        takeaway: rawDesc,
        impactMetric: `Principle 0${idx + 1}`,
      };
    });

  while (baseTakeaways.length < 3) {
    const idx = baseTakeaways.length;
    const bullet = allBullets[idx];
    baseTakeaways.push({
      id: `${module.id}-qo-${lens}-${idx + 1}`,
      principleBadge: bullet?.termEn || `MOD-0${module.number}.${idx + 1}`,
      title: isEn
        ? `${lensPrefixEn} Invariant #${idx + 1}: ${bullet?.termEn || module.titleEn}`
        : `${lensPrefixFa} #${idx + 1}: ${bullet?.termEn || module.titleFa}`,
      takeaway: isEn
        ? bullet?.descEn ||
          module.summaryEn ||
          module.summaryFa ||
          'Enforce structured artifact verification across asynchronous agent workflows.'
        : bullet?.descFa ||
          module.summaryFa ||
          'اعمال اعتبارسنجی ساخت‌یافته آرتیفکت‌ها در جریان‌های کاری ناهمگام ایجنت.',
      impactMetric: `Core #0${idx + 1}`,
    });
  }

  const executiveHeadline = isEn
    ? `${lensPrefixEn} Overview — ${
        module.summaryEn || module.titleEn
      }`
    : `خلاصه کلیدی (${lensPrefixFa}) — ${module.summaryFa}`;

  const coreEngineeringPrinciple = isEn
    ? `Module 0${module.number} Core Principle (${lensPrefixEn}): Combine ${
        baseTakeaways[0]?.principleBadge || 'Agent-First'
      } with ${
        baseTakeaways[1]?.principleBadge || 'Artifact Verification'
      } to achieve deterministic, auditable engineering throughput.`
    : `اصل محوری فصل ۰${module.number} (${lensPrefixFa}): ترکیب مکانیزم ${
        baseTakeaways[0]?.principleBadge || 'Agent-First'
      } با استاندارد ${
        baseTakeaways[1]?.principleBadge || 'Artifact Verification'
      } برای دستیابی به خروجی مهندسی قابل ممیزی و بدون خطا.`;

  return {
    moduleId: module.id,
    moduleNumber: module.number,
    lens,
    language,
    executiveHeadline,
    coreEngineeringPrinciple,
    takeaways: baseTakeaways.slice(0, 3),
    modelUsed: 'gemini-3.8-flash',
    generatedAtIso: nowIso,
    source: 'ai-curated',
  };
}

export function normalizeAiQuickOverviewResponse(
  raw: unknown,
  fallback: ModuleQuickOverviewPayload
): ModuleQuickOverviewPayload {
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;
  const executiveHeadline =
    typeof obj.executiveHeadline === 'string' && obj.executiveHeadline.trim().length > 8
      ? obj.executiveHeadline.trim()
      : fallback.executiveHeadline;

  const coreEngineeringPrinciple =
    typeof obj.coreEngineeringPrinciple === 'string' &&
    obj.coreEngineeringPrinciple.trim().length > 8
      ? obj.coreEngineeringPrinciple.trim()
      : fallback.coreEngineeringPrinciple;

  const rawTakeaways = Array.isArray(obj.takeaways) ? obj.takeaways : [];
  const normalizedTakeaways: QuickOverviewTakeawayItem[] = rawTakeaways
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null;
      const tObj = item as Record<string, unknown>;
      const fbItem = fallback.takeaways[idx] || fallback.takeaways[0];
      const title =
        typeof tObj.title === 'string' && tObj.title.trim().length > 2
          ? tObj.title.trim()
          : fbItem?.title || `Takeaway ${idx + 1}`;
      const takeaway =
        typeof tObj.takeaway === 'string' && tObj.takeaway.trim().length > 5
          ? tObj.takeaway.trim()
          : fbItem?.takeaway || '';
      const principleBadge =
        typeof tObj.principleBadge === 'string' && tObj.principleBadge.trim().length > 1
          ? tObj.principleBadge.trim()
          : fbItem?.principleBadge || `MOD-0${fallback.moduleNumber}`;
      const impactMetric =
        typeof tObj.impactMetric === 'string' && tObj.impactMetric.trim().length > 1
          ? tObj.impactMetric.trim()
          : fbItem?.impactMetric || `Key #0${idx + 1}`;

      if (!takeaway) return null;
      return {
        id: `${fallback.moduleId}-ai-${fallback.lens}-${idx + 1}`,
        principleBadge,
        title,
        takeaway,
        impactMetric,
      };
    })
    .filter((x): x is QuickOverviewTakeawayItem => x !== null);

  const finalTakeaways =
    normalizedTakeaways.length >= 2
      ? normalizedTakeaways.slice(0, 4)
      : fallback.takeaways;

  return {
    ...fallback,
    executiveHeadline,
    coreEngineeringPrinciple,
    takeaways: finalTakeaways,
    modelUsed:
      typeof obj.modelUsed === 'string' && obj.modelUsed.trim()
        ? obj.modelUsed.trim()
        : 'gemini-3.8-flash',
    generatedAtIso: new Date().toISOString(),
    source: obj.source === 'ai-curated' ? 'ai-curated' : 'ai-live',
  };
}

export type McpBaselineProfileId =
  | 'stdio-local-readonly'
  | 'sse-remote-zero-trust'
  | 'multi-worktree-ci';

export interface McpConfigurationDriftFinding {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'ALIGNED';
  parameterPath: string;
  expectedBaseline: string;
  detectedState: string;
  explanation: string;
  remediationPatch: string;
}

export interface KnowledgeBaseContextAwarenessSummary {
  entryId: string;
  keyPath: string;
  baselineProfile: McpBaselineProfileId;
  language: 'fa' | 'en';
  contextAwarenessSummary: string;
  architecturalIntent: string;
  driftRiskScore: number;
  driftSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  driftFindings: McpConfigurationDriftFinding[];
  recommendedMcpSnippet: string;
  modelUsed: string;
  generatedAtIso: string;
  source: 'ai-live' | 'ai-curated';
}

export function buildKbContextAwarenessPrompt(params: {
  entry: KnowledgeBaseEntryItem;
  baselineProfile: McpBaselineProfileId;
  language: 'fa' | 'en';
}): string {
  const { entry, baselineProfile, language } = params;
  const isEn = language === 'en';

  const baselineDescription =
    baselineProfile === 'sse-remote-zero-trust'
      ? 'Remote SSE FastMCP Cluster with mTLS / Bearer OAuth, strict read-only query timeout (3000ms), and explicit tool allowlist.'
      : baselineProfile === 'multi-worktree-ci'
      ? 'Isolated Git Worktree CI Pipeline with per-worktree database schema (test_db_wt_*), Glob-scoped .agent/rules, and zero stale AST dumps.'
      : 'Local stdio uv/FastMCP Server with DB_POOL_MODE=read_only, statement_timeout=2500ms, and fresh Context Rot (<25%).';

  const langRule = isEn
    ? 'Write contextAwarenessSummary, architecturalIntent, and finding explanations in clear, authoritative English.'
    : 'Write contextAwarenessSummary, architecturalIntent, and finding explanations in fluent Persian (RTL) while keeping parameterPath, expectedBaseline, detectedState, and remediationPatch in English.';

  return [
    `Analyze the following long-form Knowledge Base technical article/artifact and generate an AI 'Context Awareness' summary that identifies potential configuration drifts in the user's MCP (Model Context Protocol) and .agent/* setup.`,
    `Entry ID: ${entry.id}`,
    `Artifact Key Path: ${entry.keyPath}`,
    `Category: ${entry.category}`,
    `Title: ${entry.titleEn} (${entry.titleFa})`,
    `Token Weight: ${entry.tokenCount} tokens | Context Rot Staleness: ${entry.stalenessPercent}%`,
    `Target MCP Baseline Profile (${baselineProfile}): ${baselineDescription}`,
    `Article / Configuration Content:\n${entry.contentSnippet}`,
    `Language Directive: ${langRule}`,
    `Return strict JSON with contextAwarenessSummary, architecturalIntent, driftRiskScore (0-100), driftSeverity (LOW, MEDIUM, HIGH, CRITICAL), driftFindings (3 items), and recommendedMcpSnippet.`,
  ].join('\n\n');
}

export function buildDeterministicKbContextAwareness(params: {
  entry: KnowledgeBaseEntryItem;
  baselineProfile: McpBaselineProfileId;
  language: 'fa' | 'en';
  generatedAtIso?: string;
}): KnowledgeBaseContextAwarenessSummary {
  const { entry, baselineProfile, language } = params;
  const isEn = language === 'en';
  const nowIso = params.generatedAtIso || new Date().toISOString();
  const snippetLower = entry.contentSnippet.toLowerCase();

  const isStale = entry.stalenessPercent >= 65;
  const mentionsSse = snippetLower.includes('sse') || snippetLower.includes('http');
  const mentionsStdio = snippetLower.includes('stdio') || snippetLower.includes('uv');
  const mentionsReadOnly =
    snippetLower.includes('read_only') ||
    snippetLower.includes('readonly') ||
    snippetLower.includes('select ');
  const mentionsGlob =
    snippetLower.includes('glob:') ||
    snippetLower.includes('alembic') ||
    snippetLower.includes('src/');

  // Compute deterministic drift risk score based on entry staleness + baseline mismatch
  let baseRisk = Math.round(entry.stalenessPercent * 0.65);
  if (baselineProfile === 'sse-remote-zero-trust' && !mentionsSse) {
    baseRisk += 22;
  }
  if (baselineProfile === 'stdio-local-readonly' && !mentionsReadOnly) {
    baseRisk += 18;
  }
  if (baselineProfile === 'multi-worktree-ci' && isStale) {
    baseRisk += 20;
  }
  const driftRiskScore = Math.max(8, Math.min(96, baseRisk));

  const driftSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
    driftRiskScore >= 75
      ? 'CRITICAL'
      : driftRiskScore >= 50
      ? 'HIGH'
      : driftRiskScore >= 25
      ? 'MEDIUM'
      : 'LOW';

  const findings: McpConfigurationDriftFinding[] = [];

  // Finding 1: Transport & MCP Baseline Alignment
  if (baselineProfile === 'sse-remote-zero-trust') {
    const aligned = mentionsSse;
    findings.push({
      id: `${entry.id}-drift-transport`,
      severity: aligned ? 'ALIGNED' : 'WARNING',
      parameterPath: 'mcpServers.postgres_telemetry.transport',
      expectedBaseline: 'sse (https://mcp-gateway.internal/sse + Bearer Token)',
      detectedState: mentionsStdio
        ? 'stdio (local uv subprocess without mTLS/OAuth header)'
        : aligned
        ? 'sse (Remote SSE endpoint configured)'
        : 'implicit local transport (unspecified SSE gateway)',
      explanation: isEn
        ? aligned
          ? 'Transport layer matches the remote SSE Zero-Trust gateway specification.'
          : 'Configuration drift detected: local stdio or implicit transport is active while the target baseline requires remote SSE with mTLS/OAuth headers.'
        : aligned
        ? 'لایه ترنسپورت با مشخصات درگاه راه دور SSE Zero-Trust همخوانی دارد.'
        : 'انحراف پیکربندی در لایه Transport: حالت محلی stdio یا ترنسپورت ضمنی فعال است، در حالی که پروفایل هدف نیازمند SSE راه دور با هدر احراز هویت mTLS/OAuth است.',
      remediationPatch: `"transport": "sse", "url": "https://mcp-gateway.internal/sse", "headers": { "Authorization": "Bearer \${MCP_OAUTH_TOKEN}" }`,
    });
  } else if (baselineProfile === 'multi-worktree-ci') {
    findings.push({
      id: `${entry.id}-drift-worktree`,
      severity: mentionsGlob ? 'ALIGNED' : 'WARNING',
      parameterPath: 'mcpServers.*.env.WORKTREE_DB_ISOLATION',
      expectedBaseline: 'test_db_wt_${WORKTREE_ID} + Glob-scoped .agent/rules',
      detectedState: mentionsGlob
        ? 'Scoped rule/path bindings detected in artifact'
        : 'Shared default database schema across concurrent agent worktrees',
      explanation: isEn
        ? mentionsGlob
          ? 'Path-scoped guardrails are present, preventing cross-worktree rule leakage.'
          : 'Configuration drift: MCP tool environment lacks per-worktree database isolation, risking Alembic migration locks during parallel runs.'
        : mentionsGlob
        ? 'گاردریل‌های محدود به مسیر (Glob) تعریف شده‌اند و از نشت قوانین بین Worktreeها جلوگیری می‌کنند.'
        : 'انحراف پیکربندی: متغیر محیطی ایزولاسیون دیتابیس به ازای هر Worktree در سرور MCP تعریف نشده و خطر قفل شدن جدول در اجرای موازی وجود دارد.',
      remediationPatch: `"env": { "DB_NAME": "test_db_wt_\${ANTIGRAVITY_WORKTREE_ID}", "PGOPTIONS": "-c default_transaction_read_only=on" }`,
    });
  } else {
    findings.push({
      id: `${entry.id}-drift-pool`,
      severity: mentionsReadOnly ? 'ALIGNED' : 'WARNING',
      parameterPath: 'mcpServers.*.env.PGOPTIONS',
      expectedBaseline: '-c default_transaction_read_only=on -c statement_timeout=2500',
      detectedState: mentionsReadOnly
        ? 'Read-only pool / SELECT-only constraint referenced'
        : 'Unrestricted read-write connection pool or missing statement_timeout',
      explanation: isEn
        ? mentionsReadOnly
          ? 'Database telemetry tool enforces read-only transaction safety.'
          : 'Configuration drift: MCP server configuration does not explicitly enforce default_transaction_read_only=on, exposing local tables to accidental mutation.'
        : mentionsReadOnly
        ? 'ابزار تله‌متری دیتابیس محدودیت تراکنش فقط-خواندنی (Read-Only) را رعایت می‌کند.'
        : 'انحراف پیکربندی: در تنظیمات سرور MCP پارامتر default_transaction_read_only=on قید نشده و احتمال تغییر ناخواسته داده‌ها وجود دارد.',
      remediationPatch: `"env": { "DB_POOL_MODE": "read_only", "PGOPTIONS": "-c default_transaction_read_only=on -c statement_timeout=2500" }`,
    });
  }

  // Finding 2: Context Rot & Token Footprint Drift
  findings.push({
    id: `${entry.id}-drift-rot`,
    severity: isStale ? 'CRITICAL' : 'ALIGNED',
    parameterPath: `${entry.keyPath}#stalenessPercent`,
    expectedBaseline: 'stalenessPercent < 35% · Token footprint < 600 tokens',
    detectedState: `stalenessPercent = ${entry.stalenessPercent}% · ${entry.tokenCount} tokens`,
    explanation: isEn
      ? isStale
        ? `Critical Context Rot (${entry.stalenessPercent}%): This artifact contains outdated snapshot state that conflicts with live MCP tool schemas and pollutes the agent prompt window.`
        : `Context freshness is healthy (${entry.stalenessPercent}% rot, ${entry.tokenCount} tokens), keeping MCP schema resolution deterministic.`
      : isStale
      ? `پوسیدگی بحرانی زمینه (${entry.stalenessPercent}% Context Rot): این سند شامل وضعیت‌های منقضی‌شده است که با اسکیماهای زنده ابزار MCP تضاد داشته و پنجره پرامپت ایجنت را مسموم می‌کند.`
      : `طراوت زمینه در وضعیت سالم (${entry.stalenessPercent}% پوسیدگی، ${entry.tokenCount} توکن) قرار دارد و فراخوانی ابزارهای MCP را دقیق نگه می‌دارد.`,
    remediationPatch: `Prune stale AST/vendor dumps and resync ${entry.keyPath} with active mcp_config.json schema v2.1.`,
  });

  // Finding 3: Rule Activation & Schema Pinning
  findings.push({
    id: `${entry.id}-drift-schema-pin`,
    severity: entry.category === 'mcp-schema' && !isStale ? 'ALIGNED' : 'WARNING',
    parameterPath: '.agent/rules/mcp-schema-pin.md',
    expectedBaseline: 'activation: glob (mcp_config.json, src/mcp/**/*.py)',
    detectedState:
      entry.category === 'mcp-schema'
        ? `Pinned in ${entry.keyPath} (${entry.tokenCount} tokens)`
        : `Cross-referenced from ${entry.category} (${entry.keyPath})`,
    explanation: isEn
      ? 'Pinning FastMCP tool input schemas via Glob activation ensures the agent only loads MCP tool definitions when editing or invoking server endpoints.'
      : 'سنجاق کردن اسکیمای ورودی ابزارهای FastMCP با حالت فعال‌سازی Glob تضمین می‌کند که تعاریف ابزار تنها هنگام کار با سرویس‌های مربوطه در پنجره زمینه بارگذاری شوند.',
    remediationPatch: `---\nactivation: glob\nglob: "mcp_config.json,src/mcp/**/*.py"\n---`,
  });

  const profileLabelEn =
    baselineProfile === 'sse-remote-zero-trust'
      ? 'Remote SSE Zero-Trust Cluster'
      : baselineProfile === 'multi-worktree-ci'
      ? 'Multi-Worktree Isolated CI'
      : 'Local stdio Read-Only FastMCP';

  const profileLabelFa =
    baselineProfile === 'sse-remote-zero-trust'
      ? 'کلاستر راه دور SSE Zero-Trust'
      : baselineProfile === 'multi-worktree-ci'
      ? 'پایپ‌لاین ایزوله Multi-Worktree CI'
      : 'سرور محلی stdio با استخر Read-Only';

  const contextAwarenessSummary = isEn
    ? `Context Awareness Analysis for "${entry.titleEn}" (${entry.keyPath}): This ${entry.tokenCount}-token ${entry.category} artifact governs how the Antigravity agent resolves workspace state and MCP tool boundaries. Audited against the ${profileLabelEn} baseline, ${
        isStale
          ? `high Context Rot (${entry.stalenessPercent}%) introduces schema drift that can cause the agent to invoke outdated MCP parameters.`
          : `context freshness (${entry.stalenessPercent}% rot) keeps token overhead bounded while highlighting ${
              findings.filter((f) => f.severity !== 'ALIGNED').length
            } MCP configuration alignment opportunities.`
      }`
    : `تحلیل آگاهی زمینه (Context Awareness) برای «${entry.titleFa}» (${entry.keyPath}): این سند فنی با وزن ${entry.tokenCount} توکن در دسته ${entry.category} نحوه تفسیر وضعیت فضای کاری و مرزهای ابزار MCP توسط ایجنت Antigravity را تعیین می‌کند. در ممیزی مقابل پروفایل مرجع «${profileLabelFa}»، ${
        isStale
          ? `نرخ بالای پوسیدگی زمینه (${entry.stalenessPercent}% Context Rot) باعث انحراف اسکیما شده و ممکن است ایجنت را به فراخوانی پارامترهای منقضی‌شده MCP سوق دهد.`
          : `طراوت مناسب سند (${entry.stalenessPercent}% پوسیدگی) مصرف توکن را بهینه نگه داشته و ${
              findings.filter((f) => f.severity !== 'ALIGNED').length
            } نقطه کلیدی برای همگام‌سازی دقیق‌تر پیکربندی MCP را مشخص می‌کند.`
      }`;

  const architecturalIntent = isEn
    ? `Ensure ${entry.keyPath} remains synchronized with mcp_config.json and .agent/rules so long-form architectural documentation never drifts from live FastMCP tool contracts.`
    : `حفظ همگام‌سازی مستمر ${entry.keyPath} با فایل mcp_config.json و قوانین .agent/rules تا مستندات فنی طولانی هرگز از قراردادهای زنده سرور FastMCP منحرف نشوند.`;

  const recommendedMcpSnippet = JSON.stringify(
    {
      mcpServers: {
        antigravity_context_guard: {
          command: baselineProfile === 'sse-remote-zero-trust' ? undefined : 'uv',
          args:
            baselineProfile === 'sse-remote-zero-trust'
              ? undefined
              : ['run', 'fastmcp', 'run', 'src/mcp/context_guard_server.py'],
          transport: baselineProfile === 'sse-remote-zero-trust' ? 'sse' : 'stdio',
          url:
            baselineProfile === 'sse-remote-zero-trust'
              ? 'https://mcp-gateway.internal/sse'
              : undefined,
          env: {
            SynchronizedArtifact: entry.keyPath,
            DB_POOL_MODE: 'read_only',
            PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=2500',
            WORKTREE_ISOLATION:
              baselineProfile === 'multi-worktree-ci' ? 'enabled' : 'standard',
          },
        },
      },
    },
    null,
    2
  );

  return {
    entryId: entry.id,
    keyPath: entry.keyPath,
    baselineProfile,
    language,
    contextAwarenessSummary,
    architecturalIntent,
    driftRiskScore,
    driftSeverity,
    driftFindings: findings,
    recommendedMcpSnippet,
    modelUsed: 'gemini-3.8-flash',
    generatedAtIso: nowIso,
    source: 'ai-curated',
  };
}

export function normalizeAiKbContextAwarenessResponse(
  raw: unknown,
  fallback: KnowledgeBaseContextAwarenessSummary
): KnowledgeBaseContextAwarenessSummary {
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;
  const contextAwarenessSummary =
    typeof obj.contextAwarenessSummary === 'string' &&
    obj.contextAwarenessSummary.trim().length > 12
      ? obj.contextAwarenessSummary.trim()
      : fallback.contextAwarenessSummary;

  const architecturalIntent =
    typeof obj.architecturalIntent === 'string' &&
    obj.architecturalIntent.trim().length > 8
      ? obj.architecturalIntent.trim()
      : fallback.architecturalIntent;

  const rawScore = Number(obj.driftRiskScore);
  const driftRiskScore = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : fallback.driftRiskScore;

  const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  const driftSeverity = validSeverities.includes(
    obj.driftSeverity as (typeof validSeverities)[number]
  )
    ? (obj.driftSeverity as (typeof validSeverities)[number])
    : fallback.driftSeverity;

  const rawFindings = Array.isArray(obj.driftFindings) ? obj.driftFindings : [];
  const normalizedFindings: McpConfigurationDriftFinding[] = rawFindings
    .map((f, idx) => {
      if (!f || typeof f !== 'object') return null;
      const fObj = f as Record<string, unknown>;
      const fbFinding = fallback.driftFindings[idx] || fallback.driftFindings[0];
      const validFindingSev = ['CRITICAL', 'WARNING', 'ALIGNED'] as const;
      const severity = validFindingSev.includes(
        fObj.severity as (typeof validFindingSev)[number]
      )
        ? (fObj.severity as (typeof validFindingSev)[number])
        : fbFinding?.severity || 'WARNING';

      const parameterPath =
        typeof fObj.parameterPath === 'string' && fObj.parameterPath.trim()
          ? fObj.parameterPath.trim()
          : fbFinding?.parameterPath || 'mcpServers.*.env';
      const expectedBaseline =
        typeof fObj.expectedBaseline === 'string' && fObj.expectedBaseline.trim()
          ? fObj.expectedBaseline.trim()
          : fbFinding?.expectedBaseline || 'Read-only enforced';
      const detectedState =
        typeof fObj.detectedState === 'string' && fObj.detectedState.trim()
          ? fObj.detectedState.trim()
          : fbFinding?.detectedState || 'Unverified state';
      const explanation =
        typeof fObj.explanation === 'string' && fObj.explanation.trim().length > 5
          ? fObj.explanation.trim()
          : fbFinding?.explanation || '';
      const remediationPatch =
        typeof fObj.remediationPatch === 'string' && fObj.remediationPatch.trim()
          ? fObj.remediationPatch.trim()
          : fbFinding?.remediationPatch || '';

      if (!explanation) return null;
      return {
        id: `${fallback.entryId}-ai-drift-${idx + 1}`,
        severity,
        parameterPath,
        expectedBaseline,
        detectedState,
        explanation,
        remediationPatch,
      };
    })
    .filter((x): x is McpConfigurationDriftFinding => x !== null);

  const recommendedMcpSnippet =
    typeof obj.recommendedMcpSnippet === 'string' &&
    obj.recommendedMcpSnippet.trim().length > 10
      ? obj.recommendedMcpSnippet.trim()
      : fallback.recommendedMcpSnippet;

  return {
    ...fallback,
    contextAwarenessSummary,
    architecturalIntent,
    driftRiskScore,
    driftSeverity,
    driftFindings:
      normalizedFindings.length >= 2 ? normalizedFindings.slice(0, 4) : fallback.driftFindings,
    recommendedMcpSnippet,
    modelUsed:
      typeof obj.modelUsed === 'string' && obj.modelUsed.trim()
        ? obj.modelUsed.trim()
        : 'gemini-3.8-flash',
    generatedAtIso: new Date().toISOString(),
    source: obj.source === 'ai-curated' ? 'ai-curated' : 'ai-live',
  };
}

// ============================================================================
// ARCHITECT'S DAILY MISSION (SIDEBAR RANDOM TECHNICAL TASK WIDGET)
// ============================================================================

export type DailyMissionTargetSection =
  | 'guardrails'
  | 'mcp'
  | 'simulator'
  | 'knowledge-base'
  | 'scenarios'
  | 'curriculum';

export interface ArchitectDailyMissionTask {
  id: string;
  code: string;
  titleEn: string;
  titleFa: string;
  descEn: string;
  descFa: string;
  targetArtifact: string;
  targetSection: DailyMissionTargetSection;
  xpReward: number;
  categoryBadge: string;
}

export const ARCHITECT_DAILY_MISSIONS_POOL: ReadonlyArray<ArchitectDailyMissionTask> =
  [
    {
      id: 'mission-refactor-rule',
      code: 'ADM-01',
      titleEn: 'Refactor a .agent/rules Guardrail to Glob Mode',
      titleFa: 'بازآرایی یک قانون (Refactor a rule) در .agent/rules به حالت Glob',
      descEn:
        'Convert an Always-On database rule into a scoped Glob activation rule (alembic/versions/*.py) to reduce context overhead.',
      descFa:
        'تبدیل یک قانون سراسری دیتابیس به حالت فعال‌سازی هدفمند Glob (مسیر alembic/versions/*.py) جهت کاهش بار پنجره زمینه.',
      targetArtifact: '.agent/rules/db-migrations.md',
      targetSection: 'guardrails',
      xpReward: 150,
      categoryBadge: 'Refactor a Rule',
    },
    {
      id: 'mission-audit-plan',
      code: 'ADM-02',
      titleEn: 'Attach PR-Style Inline Review on implementation_plan.md',
      titleFa: 'ثبت کامنت ممیزی PR-Style روی implementation_plan.md',
      descEn:
        'Inspect a pending agent implementation plan in Mission Control and attach an inline architectural constraint before code execution.',
      descFa:
        'بررسی طرح پیاده‌سازی ایجنت در Mission Control و الصاق محدودیت معماری به‌صورت کامنت خطی پیش از اجرای کد.',
      targetArtifact: 'implementation_plan.md',
      targetSection: 'simulator',
      xpReward: 175,
      categoryBadge: 'Plan Review',
    },
    {
      id: 'mission-fastmcp-readonly',
      code: 'ADM-03',
      titleEn: 'Harden FastMCP Server Pool to Read-Only Mode',
      titleFa: 'ایمن‌سازی استخر سرور FastMCP در حالت Read-Only',
      descEn:
        'Audit mcp_config.json to enforce default_transaction_read_only=on and prevent autonomous DDL/DML mutations.',
      descFa:
        'ممیزی فایل mcp_config.json برای اعمال پارامتر default_transaction_read_only=on و جلوگیری از تغییرات ناخواسته دیتابیس.',
      targetArtifact: 'mcp_config.json',
      targetSection: 'mcp',
      xpReward: 180,
      categoryBadge: 'FastMCP Guard',
    },
    {
      id: 'mission-prune-context-rot',
      code: 'ADM-04',
      titleEn: 'Prune Stale AST Snapshot in Knowledge Base',
      titleFa: 'هرس اسنپ‌شات منسوخ AST برای مهار Context Rot',
      descEn:
        'Archive a high-staleness (>65% rot) artifact in .agent/knowledge-base/ and distill its core architectural invariants.',
      descFa:
        'آرشیو سند دارای فرسودگی بالای ۶۵٪ در مسیر .agent/knowledge-base/ و تقطیر قواعد کلیدی معماری آن.',
      targetArtifact: '.agent/knowledge-base/core-invariants.md',
      targetSection: 'knowledge-base',
      xpReward: 160,
      categoryBadge: 'Context Hygiene',
    },
    {
      id: 'mission-turbo-workflow',
      code: 'ADM-05',
      titleEn: 'Automate Verification Step with // turbo Directive',
      titleFa: 'خودکارسازی گام صحت‌سنجی با دایرکتیو // turbo',
      descEn:
        'Add a non-destructive unit test runner step annotated with // turbo inside .agent/workflows/verify.md.',
      descFa:
        'افزودن گام اجرای خودکار تست‌های واحد با دایرکتیو // turbo درون پایپ‌لاین .agent/workflows/verify.md.',
      targetArtifact: '.agent/workflows/verify.md',
      targetSection: 'guardrails',
      xpReward: 140,
      categoryBadge: 'Turbo Workflow',
    },
    {
      id: 'mission-worktree-isolation',
      code: 'ADM-06',
      titleEn: 'Resolve Parallel Git Worktree Merge Strategy',
      titleFa: 'تنظیم استراتژی ادغام Git Worktreeهای موازی',
      descEn:
        'Evaluate a multi-agent scenario in the Scenario Lab to isolate parallel feature branches without index.lock collisions.',
      descFa:
        'ارزیابی سناریوی چندایجنتی در آزمایشگاه سناریو برای ایزوله‌سازی شاخه‌های موازی بدون تداخل فایل index.lock.',
      targetArtifact: 'walkthrough.md',
      targetSection: 'scenarios',
      xpReward: 200,
      categoryBadge: 'Worktree Ops',
    },
  ];

export function selectArchitectDailyMission(params?: {
  seedOrIndex?: number | string;
  excludeMissionId?: string;
}): ArchitectDailyMissionTask {
  const pool = ARCHITECT_DAILY_MISSIONS_POOL;
  const excludeId = params?.excludeMissionId;
  const candidatePool =
    excludeId && pool.length > 1
      ? pool.filter((m) => m.id !== excludeId)
      : pool;

  if (typeof params?.seedOrIndex === 'number' && Number.isFinite(params.seedOrIndex)) {
    const normalizedIdx =
      ((Math.floor(params.seedOrIndex) % candidatePool.length) +
        candidatePool.length) %
      candidatePool.length;
    return candidatePool[normalizedIdx];
  }

  if (typeof params?.seedOrIndex === 'string' && params.seedOrIndex.trim().length > 0) {
    const str = params.seedOrIndex.trim();
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const idx = (hash >>> 0) % candidatePool.length;
    return candidatePool[idx];
  }

  const randomIdx = Math.floor(Math.random() * candidatePool.length);
  return candidatePool[randomIdx] || pool[0];
}

export function completeArchitectDailyMission(params: {
  mission: ArchitectDailyMissionTask;
  completedMissionIds: ReadonlyArray<string>;
  currentBonusXp: number;
}): {
  updatedCompletedIds: string[];
  updatedBonusXp: number;
  xpEarned: number;
  alreadyCompleted: boolean;
} {
  const { mission, completedMissionIds, currentBonusXp } = params;
  const safeCurrentXp = Math.max(0, Math.floor(currentBonusXp));
  if (completedMissionIds.includes(mission.id)) {
    return {
      updatedCompletedIds: [...completedMissionIds],
      updatedBonusXp: safeCurrentXp,
      xpEarned: 0,
      alreadyCompleted: true,
    };
  }

  const reward = Math.max(0, Math.floor(mission.xpReward));
  return {
    updatedCompletedIds: [...completedMissionIds, mission.id],
    updatedBonusXp: safeCurrentXp + reward,
    xpEarned: reward,
    alreadyCompleted: false,
  };
}

// ============================================================================
// MODULE KNOWLEDGE CHECK (BOTTOM-SCROLL AI QUIZ MODAL)
// ============================================================================

export interface ModuleKnowledgeCheckQuestion {
  id: string;
  principleBadge: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward: number;
}

export interface ModuleKnowledgeCheckQuizPayload {
  moduleId: string;
  moduleNumber: number;
  language: 'fa' | 'en';
  quizTitle: string;
  quizSubtitle: string;
  questions: ModuleKnowledgeCheckQuestion[];
  totalPossibleXp: number;
  modelUsed: string;
  generatedAtIso: string;
  source: 'ai-live' | 'ai-curated';
}

export interface ModuleKnowledgeCheckEvaluationResult {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  earnedXp: number;
  passed: boolean;
  resultsByQuestionId: Record<
    string,
    {
      selectedIndex: number;
      correctIndex: number;
      isCorrect: boolean;
      xpEarned: number;
    }
  >;
}

export function buildModuleKnowledgeCheckPrompt(params: {
  module: ModuleQuickOverviewInput;
  language: 'fa' | 'en';
}): string {
  const { module, language } = params;
  const isEn = language === 'en';

  const takeawaysText = module.keyTakeaways
    .map(
      (kt, idx) =>
        `${idx + 1}. [${kt.metricOrBadge}] ${
          isEn ? kt.titleEn || kt.titleFa : kt.titleFa || kt.titleEn
        }: ${isEn ? kt.descEn || kt.descFa : kt.descFa || kt.descEn}`
    )
    .join('\n');

  const bulletTerms = (module.subSections || [])
    .flatMap((s) => s.bulletPoints || [])
    .map((b) => `- ${b.termEn}: ${isEn ? b.descEn || b.descFa : b.descFa || b.descEn}`)
    .slice(0, 6)
    .join('\n');

  const langRule = isEn
    ? 'Write quizTitle, quizSubtitle, questions, options, and explanations in clear, authoritative English.'
    : 'Write quizTitle, quizSubtitle, questions, options, and explanations in fluent Persian (RTL) while keeping technical terms, file paths (.agent/rules/, task.md, implementation_plan.md, walkthrough.md, mcp_config.json), and principleBadge in English.';

  return [
    `Generate a short 3-question 'Knowledge Check' multiple-choice quiz testing a Systems Architect on the core engineering principles of Module 0${module.number}: "${module.titleEn}" (${module.titleFa}).`,
    `Module Summary: ${isEn ? module.summaryEn || module.summaryFa : module.summaryFa}`,
    `Core Engineering Takeaways:\n${takeawaysText}`,
    bulletTerms ? `Key Architectural Primitives:\n${bulletTerms}` : '',
    `Language Directive: ${langRule}`,
    `Each question must have exactly 4 options, a valid correctIndex (0 to 3), an architectural explanation, a principleBadge, and xpReward (75).`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildDeterministicModuleKnowledgeCheck(params: {
  module: ModuleQuickOverviewInput;
  language: 'fa' | 'en';
  generatedAtIso?: string;
}): ModuleKnowledgeCheckQuizPayload {
  const { module, language } = params;
  const isEn = language === 'en';
  const nowIso = params.generatedAtIso || new Date().toISOString();

  const kt0 = module.keyTakeaways[0];
  const kt1 = module.keyTakeaways[1] || module.keyTakeaways[0];
  const allBullets = (module.subSections || []).flatMap(
    (s) => s.bulletPoints || []
  );
  const bp0 = allBullets[0];

  const badge0 = kt0?.metricOrBadge || `MOD-0${module.number}.A`;
  const title0 = isEn
    ? kt0?.titleEn || kt0?.titleFa || module.titleEn
    : kt0?.titleFa || kt0?.titleEn || module.titleFa;
  const desc0 = isEn
    ? kt0?.descEn || kt0?.descFa || module.summaryEn || module.summaryFa
    : kt0?.descFa || kt0?.descEn || module.summaryFa;

  const badge1 = kt1?.metricOrBadge || `MOD-0${module.number}.B`;
  const title1 = isEn
    ? kt1?.titleEn || kt1?.titleFa || 'Artifact Governance'
    : kt1?.titleFa || kt1?.titleEn || 'حاکمیت آرتیفکت‌ها';
  const desc1 = isEn
    ? kt1?.descEn || kt1?.descFa || module.summaryEn || module.summaryFa
    : kt1?.descFa || kt1?.descEn || module.summaryFa;

  const badge2 = bp0?.termEn || `MOD-0${module.number}.C`;
  const desc2 = isEn
    ? bp0?.descEn ||
      bp0?.descFa ||
      'Enforce deterministic verification gates before committing multi-file agent diffs.'
    : bp0?.descFa ||
      bp0?.descEn ||
      'اعمال دروازه‌های صحت‌سنجی قطعی پیش از ثبت تغییرات چندفایلی ایجنت.';

  const questions: ModuleKnowledgeCheckQuestion[] = [
    {
      id: `${module.id}-kc-q1`,
      principleBadge: badge0,
      question: isEn
        ? `Which architectural requirement best represents the "${title0}" (${badge0}) principle in Module 0${module.number}?`
        : `کدام الزام معماری، اصل مهندسی «${title0}» (${badge0}) در فصل ۰${module.number} را به دقیق‌ترین شکل پیاده‌سازی می‌کند؟`,
      options: isEn
        ? [
            desc0,
            'Bypassing Planning Mode and writing unverified diffs directly into production branches without LSP indexing.',
            'Storing all project rules in a single monolithic 80k-token prompt file loaded on every keystroke.',
            'Disabling structured artifacts (task.md and implementation_plan.md) during multi-file refactoring.',
          ]
        : [
            desc0,
            'دور زدن حالت Planning Mode و اعمال مستقیم تغییرات بدون ایندکس گراف وابستگی LSP روی شاخه اصلی.',
            'نگهداری تمامی قوانین پروژه در یک پرامپت متورم ۸۰ هزار توکنی بدون تفکیک حوزه.',
            'غیرفعال کردن آرتیفکت‌های ساختاریافته (task.md و implementation_plan.md) در بازآرایی‌های چندفایلی.',
          ],
      correctIndex: 0,
      explanation: isEn
        ? `Core Principle (${badge0}): ${desc0}`
        : `اصل محوری (${badge0}): ${desc0}`,
      xpReward: 75,
    },
    {
      id: `${module.id}-kc-q2`,
      principleBadge: badge1,
      question: isEn
        ? `When operationalizing "${title1}" (${badge1}), how should a Principal Architect prevent regressions and Context Rot?`
        : `هنگام پیاده‌سازی مکانیزم «${title1}» (${badge1})، معمار ارشد چگونه باید از بروز خطا و Context Rot جلوگیری کند؟`,
      options: isEn
        ? [
            'Allow background agents unrestricted write access to production databases without read-only pools.',
            desc1,
            'Run all parallel feature agents inside a single shared working tree without Git Worktree isolation.',
            'Skip walkthrough.md verification and rely solely on ungrounded LLM console summaries.',
          ]
        : [
            'اعطای دسترسی نوشتن بدون محدودیت به ایجنت‌های پس‌زمینه روی دیتابیس عملیاتی بدون استخر Read-Only.',
            desc1,
            'اجرای همزمان تمام ایجنت‌های موازی روی یک دایرکتوری واحد بدون ایزولاسیون Git Worktree.',
            'حذف مرحله صحت‌سنجی در walkthrough.md و اکتفا به پاسخ متنی مدل بدون تست.',
          ],
      correctIndex: 1,
      explanation: isEn
        ? `Verified Guardrail (${badge1}): ${desc1}`
        : `گاردریل تاییدشده (${badge1}): ${desc1}`,
      xpReward: 75,
    },
    {
      id: `${module.id}-kc-q3`,
      principleBadge: badge2,
      question: isEn
        ? `In the context of Module 0${module.number}, what is the primary engineering role of "${badge2}"?`
        : `در چارچوب مهندسی فصل ۰${module.number}، نقش کلیدی مکانیزم «${badge2}» چیست؟`,
      options: isEn
        ? [
            'Replacing automated unit tests with manual copy-paste chat loops.',
            'Executing destructive shell commands without terminal policy review.',
            desc2,
            'Duplicating vendor lockfiles into the active prompt window on every turn.',
          ]
        : [
            'جایگزینی تست‌های خودکار واحد با کپی-پیست دستی کدها در پنجره چت.',
            'اجرای دستورات مخرب شل بدون عبور از فیلتر سیاست‌های امنیتی ترمینال.',
            desc2,
            'کپی کردن فایل‌های قفل وابستگی حجیم در پنجره پرامپت در هر نوبت گفتگو.',
          ],
      correctIndex: 2,
      explanation: isEn
        ? `Technical Specification (${badge2}): ${desc2}`
        : `مشخصات فنی (${badge2}): ${desc2}`,
      xpReward: 75,
    },
  ];

  const totalPossibleXp = questions.reduce((sum, q) => sum + q.xpReward, 0);

  return {
    moduleId: module.id,
    moduleNumber: module.number,
    language,
    quizTitle: isEn
      ? `Module 0${module.number} Knowledge Check · Core Engineering Principles`
      : `سنجش دانش فصل ۰${module.number} (Knowledge Check) · اصول مهندسی هسته`,
    quizSubtitle: isEn
      ? `You reached the end of "${module.titleEn}". Verify your architectural mastery with this short AI-generated quiz.`
      : `شما به پایان مطالعه «${module.titleFa}» رسیدید. تسلط مهندسی خود بر مفاهیم کلیدی این فصل را با این آزمون کوتاه هوش مصنوعی بسنجید.`,
    questions,
    totalPossibleXp,
    modelUsed: 'gemini-3.8-flash',
    generatedAtIso: nowIso,
    source: 'ai-curated',
  };
}

export function normalizeAiModuleKnowledgeCheckResponse(
  raw: unknown,
  fallback: ModuleKnowledgeCheckQuizPayload
): ModuleKnowledgeCheckQuizPayload {
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const candidate = raw as Record<string, unknown>;
  const quizTitle =
    typeof candidate.quizTitle === 'string' &&
    candidate.quizTitle.trim().length > 5
      ? candidate.quizTitle.trim()
      : fallback.quizTitle;

  const quizSubtitle =
    typeof candidate.quizSubtitle === 'string' &&
    candidate.quizSubtitle.trim().length > 8
      ? candidate.quizSubtitle.trim()
      : fallback.quizSubtitle;

  const rawQuestions = Array.isArray(candidate.questions)
    ? candidate.questions
    : [];

  const normalizedQuestions: ModuleKnowledgeCheckQuestion[] = rawQuestions
    .map((item, idx) => {
      if (!item || typeof item !== 'object') return null;
      const qObj = item as Record<string, unknown>;
      const fbQ =
        fallback.questions[idx % fallback.questions.length] ||
        fallback.questions[0];

      const questionText =
        typeof qObj.question === 'string' && qObj.question.trim().length > 6
          ? qObj.question.trim()
          : fbQ.question;

      const rawOpts = Array.isArray(qObj.options)
        ? qObj.options
            .filter((o): o is string => typeof o === 'string' && o.trim().length > 0)
            .map((o) => o.trim())
        : [];

      const options =
        rawOpts.length === 4 ? rawOpts : fbQ.options;

      const rawCorrect = Number(qObj.correctIndex);
      const correctIndex =
        Number.isInteger(rawCorrect) &&
        rawCorrect >= 0 &&
        rawCorrect < options.length
          ? rawCorrect
          : fbQ.correctIndex;

      const explanation =
        typeof qObj.explanation === 'string' &&
        qObj.explanation.trim().length > 5
          ? qObj.explanation.trim()
          : fbQ.explanation;

      const principleBadge =
        typeof qObj.principleBadge === 'string' &&
        qObj.principleBadge.trim().length > 1
          ? qObj.principleBadge.trim()
          : fbQ.principleBadge;

      const rawXp = Number(qObj.xpReward);
      const xpReward =
        Number.isFinite(rawXp) && rawXp >= 25 && rawXp <= 300
          ? Math.round(rawXp)
          : fbQ.xpReward;

      return {
        id: `${fallback.moduleId}-kc-ai-q${idx + 1}`,
        principleBadge,
        question: questionText,
        options,
        correctIndex,
        explanation,
        xpReward,
      };
    })
    .filter((q): q is ModuleKnowledgeCheckQuestion => q !== null);

  const finalQuestions =
    normalizedQuestions.length >= 2
      ? normalizedQuestions.slice(0, 4)
      : fallback.questions;

  const totalPossibleXp = finalQuestions.reduce(
    (sum, q) => sum + q.xpReward,
    0
  );

  return {
    ...fallback,
    quizTitle,
    quizSubtitle,
    questions: finalQuestions,
    totalPossibleXp,
    modelUsed:
      typeof candidate.modelUsed === 'string' && candidate.modelUsed.trim()
        ? candidate.modelUsed.trim()
        : fallback.modelUsed,
    generatedAtIso: new Date().toISOString(),
    source: candidate.source === 'ai-live' ? 'ai-live' : fallback.source,
  };
}

export function evaluateModuleKnowledgeCheckSubmission(params: {
  quiz: ModuleKnowledgeCheckQuizPayload;
  selectedAnswers: Record<string, number>;
}): ModuleKnowledgeCheckEvaluationResult {
  const { quiz, selectedAnswers } = params;
  const totalQuestions = quiz.questions.length;
  let correctCount = 0;
  let earnedXp = 0;
  const resultsByQuestionId: ModuleKnowledgeCheckEvaluationResult['resultsByQuestionId'] =
    {};

  for (const q of quiz.questions) {
    const selectedIndex =
      typeof selectedAnswers[q.id] === 'number' ? selectedAnswers[q.id] : -1;
    const isCorrect = selectedIndex === q.correctIndex;
    const xpEarned = isCorrect ? q.xpReward : 0;
    if (isCorrect) {
      correctCount += 1;
      earnedXp += xpEarned;
    }
    resultsByQuestionId[q.id] = {
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      xpEarned,
    };
  }

  const scorePercent =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = scorePercent >= 66;

  return {
    correctCount,
    totalQuestions,
    scorePercent,
    earnedXp,
    passed,
    resultsByQuestionId,
  };
}

// ============================================================================
// ACADEMY KNOWLEDGE CHECK LEADERBOARD (TOP 5 STUDENTS & CHALLENGE OTHERS)
// ============================================================================

export const KNOWLEDGE_CHECK_SCORES_STORAGE_KEY =
  'ag_module_knowledge_check_scores_v1';

export interface KnowledgeCheckModuleScoreRecord {
  moduleId: string;
  moduleNumber: number;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  earnedXp: number;
  completedAtIso: string;
}

export interface KnowledgeCheckLeaderboardStudent {
  studentId: string;
  rank: number;
  displayNameEn: string;
  displayNameFa: string;
  anonymizedHandle: string;
  isCurrentUser: boolean;
  cumulativeScoreXp: number;
  averageAccuracyPercent: number;
  quizzesCompletedCount: number;
  totalCorrectAnswers: number;
  totalQuestionsAttempted: number;
  topSpecialtyBadge: string;
}

export interface KnowledgeCheckTop5LeaderboardPayload {
  top5Students: KnowledgeCheckLeaderboardStudent[];
  currentUserEntry: KnowledgeCheckLeaderboardStudent;
  cohortAverageXp: number;
}

export interface KnowledgeCheckChallengeSharePayload {
  challengeCode: string;
  shareTitle: string;
  shareText: string;
  clipboardSummary: string;
}

export function recordModuleKnowledgeCheckScore(params: {
  existingScores: Record<string, KnowledgeCheckModuleScoreRecord>;
  moduleId: string;
  moduleNumber: number;
  evaluation: ModuleKnowledgeCheckEvaluationResult;
  completedAtIso?: string;
}): Record<string, KnowledgeCheckModuleScoreRecord> {
  const { existingScores, moduleId, moduleNumber, evaluation } = params;
  const nowIso = params.completedAtIso || new Date().toISOString();
  const prev = existingScores[moduleId];

  const nextRecord: KnowledgeCheckModuleScoreRecord = {
    moduleId,
    moduleNumber,
    correctCount: prev
      ? Math.max(prev.correctCount, evaluation.correctCount)
      : evaluation.correctCount,
    totalQuestions: Math.max(1, evaluation.totalQuestions),
    scorePercent: prev
      ? Math.max(prev.scorePercent, evaluation.scorePercent)
      : evaluation.scorePercent,
    earnedXp: prev
      ? Math.max(prev.earnedXp, evaluation.earnedXp)
      : evaluation.earnedXp,
    completedAtIso: nowIso,
  };

  return {
    ...existingScores,
    [moduleId]: nextRecord,
  };
}

export function getStoredKnowledgeCheckScores(): Record<
  string,
  KnowledgeCheckModuleScoreRecord
> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KNOWLEDGE_CHECK_SCORES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const PEER_KNOWLEDGE_CHECK_CANDIDATES: ReadonlyArray<{
  studentId: string;
  displayNameEn: string;
  displayNameFa: string;
  cumulativeScoreXp: number;
  averageAccuracyPercent: number;
  quizzesCompletedCount: number;
  totalCorrectAnswers: number;
  totalQuestionsAttempted: number;
  topSpecialtyBadge: string;
}> = [
  {
    studentId: 'kc-student-aria-rostami',
    displayNameEn: 'Aria Rostami',
    displayNameFa: 'آریا رستمی',
    cumulativeScoreXp: 1725,
    averageAccuracyPercent: 96,
    quizzesCompletedCount: 8,
    totalCorrectAnswers: 23,
    totalQuestionsAttempted: 24,
    topSpecialtyBadge: 'MCP Zero-Trust Master',
  },
  {
    studentId: 'kc-student-nika-farahani',
    displayNameEn: 'Nika Farahani',
    displayNameFa: 'نیکا فراهانی',
    cumulativeScoreXp: 1575,
    averageAccuracyPercent: 92,
    quizzesCompletedCount: 7,
    totalCorrectAnswers: 21,
    totalQuestionsAttempted: 21,
    topSpecialtyBadge: 'Git Worktree Specialist',
  },
  {
    studentId: 'kc-student-kian-mehrabi',
    displayNameEn: 'Kian Mehrabi',
    displayNameFa: 'کیان مهرابی',
    cumulativeScoreXp: 1350,
    averageAccuracyPercent: 89,
    quizzesCompletedCount: 6,
    totalCorrectAnswers: 18,
    totalQuestionsAttempted: 18,
    topSpecialtyBadge: 'LSP Supercomplete Pro',
  },
  {
    studentId: 'kc-student-tara-kaviani',
    displayNameEn: 'Tara Kaviani',
    displayNameFa: 'تارا کاویانی',
    cumulativeScoreXp: 1125,
    averageAccuracyPercent: 83,
    quizzesCompletedCount: 5,
    totalCorrectAnswers: 15,
    totalQuestionsAttempted: 15,
    topSpecialtyBadge: 'Context Rot Auditor',
  },
  {
    studentId: 'kc-student-sohrab-rad',
    displayNameEn: 'Sohrab Rad',
    displayNameFa: 'سهراب راد',
    cumulativeScoreXp: 975,
    averageAccuracyPercent: 78,
    quizzesCompletedCount: 5,
    totalCorrectAnswers: 13,
    totalQuestionsAttempted: 15,
    topSpecialtyBadge: 'Planning Mode Architect',
  },
];

function formatKnowledgeCheckHandle(name: string, seedId: string): string {
  let hash = 2166136261;
  const combined = `${name}:${seedId}`;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 4);
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0].toUpperCase()}.${parts[1][0].toUpperCase()}***`
      : `${(parts[0]?.[0] || 'A').toUpperCase()}***`;
  return `kc#${hex} · ${initials}`;
}

export function buildKnowledgeCheckTop5Leaderboard(params?: {
  userModuleScores?: Record<string, KnowledgeCheckModuleScoreRecord>;
  userSeedId?: string;
  baselineUserXp?: number;
  baselineQuizzesCount?: number;
}): KnowledgeCheckTop5LeaderboardPayload {
  const scoresMap = params?.userModuleScores || {};
  const records = Object.values(scoresMap);
  const userSeed = params?.userSeedId || 'local-principal-architect-kc';

  const recordedXp = records.reduce((sum, r) => sum + (r.earnedXp || 0), 0);
  const recordedQuizzes = records.length;
  const recordedCorrect = records.reduce(
    (sum, r) => sum + (r.correctCount || 0),
    0
  );
  const recordedTotalQ = records.reduce(
    (sum, r) => sum + (r.totalQuestions || 0),
    0
  );

  // Baseline ensures the user starts inside the competitive cohort (#4 with 1,200 XP across 5 module checks)
  // and climbs up to #1 as they complete more Knowledge Check quizzes.
  const baselineXp =
    typeof params?.baselineUserXp === 'number' ? params.baselineUserXp : 1200;
  const baselineQuizzes =
    typeof params?.baselineQuizzesCount === 'number'
      ? params.baselineQuizzesCount
      : 5;
  const baselineCorrect = Math.round(baselineXp / 75);
  const baselineQuestions = baselineQuizzes * 3;

  const cumulativeScoreXp = baselineXp + recordedXp;
  const quizzesCompletedCount = Math.min(8, baselineQuizzes + recordedQuizzes);
  const totalCorrectAnswers = baselineCorrect + recordedCorrect;
  const totalQuestionsAttempted = Math.max(
    1,
    baselineQuestions + recordedTotalQ
  );
  const averageAccuracyPercent = Math.min(
    100,
    Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100)
  );

  const userCandidate: Omit<KnowledgeCheckLeaderboardStudent, 'rank'> = {
    studentId: userSeed,
    displayNameEn: 'You (Active Student)',
    displayNameFa: 'شما (معمار فعال آکادمی)',
    anonymizedHandle: `${formatKnowledgeCheckHandle('Active Student', userSeed)} (YOU)`,
    isCurrentUser: true,
    cumulativeScoreXp,
    averageAccuracyPercent,
    quizzesCompletedCount,
    totalCorrectAnswers,
    totalQuestionsAttempted,
    topSpecialtyBadge:
      cumulativeScoreXp >= 1650
        ? 'Principal Quiz Grandmaster'
        : 'Agent-First Quiz Challenger',
  };

  const peerCandidates: Array<Omit<KnowledgeCheckLeaderboardStudent, 'rank'>> =
    PEER_KNOWLEDGE_CHECK_CANDIDATES.map((peer) => ({
      ...peer,
      anonymizedHandle: formatKnowledgeCheckHandle(
        peer.displayNameEn,
        peer.studentId
      ),
      isCurrentUser: false,
    }));

  const allCandidates = [...peerCandidates, userCandidate].sort((a, b) => {
    if (b.cumulativeScoreXp !== a.cumulativeScoreXp) {
      return b.cumulativeScoreXp - a.cumulativeScoreXp;
    }
    if (b.averageAccuracyPercent !== a.averageAccuracyPercent) {
      return b.averageAccuracyPercent - a.averageAccuracyPercent;
    }
    return b.quizzesCompletedCount - a.quizzesCompletedCount;
  });

  const rankedAll: KnowledgeCheckLeaderboardStudent[] = allCandidates.map(
    (entry, idx) => ({
      ...entry,
      rank: idx + 1,
    })
  );

  const top5Students = rankedAll.slice(0, 5);
  const currentUserEntry =
    rankedAll.find((s) => s.isCurrentUser) || rankedAll[0];

  const cohortAverageXp = Math.round(
    rankedAll.reduce((sum, s) => sum + s.cumulativeScoreXp, 0) /
      Math.max(1, rankedAll.length)
  );

  return {
    top5Students,
    currentUserEntry,
    cohortAverageXp,
  };
}

export function buildKnowledgeCheckChallengeSharePayload(params: {
  student: KnowledgeCheckLeaderboardStudent;
  language: 'fa' | 'en';
}): KnowledgeCheckChallengeSharePayload {
  const { student, language } = params;
  const isEn = language === 'en';
  const cleanHandle = student.anonymizedHandle.replace(/\s*\(YOU\)$/i, '');
  const challengeCode = `KC-RANK${student.rank}-${student.cumulativeScoreXp}XP`;

  const shareTitle = isEn
    ? `Google Antigravity Knowledge Check Challenge · Rank #${student.rank}`
    : `چالش لیدربورد سنجش دانش Google Antigravity · رتبه #${student.rank}`;

  const shareText = isEn
    ? `I just reached Rank #${student.rank} (${cleanHandle}) on the Academy Knowledge Check Leaderboard with ${student.cumulativeScoreXp} XP and ${student.averageAccuracyPercent}% accuracy across ${student.quizzesCompletedCount}/8 Module Knowledge Checks! Can you beat my score? Challenge Code: ${challengeCode}`
    : `من در لیدربورد آزمون‌های سنجش دانش (Knowledge Check) آکادمی Google Antigravity با کسب ${student.cumulativeScoreXp} XP و دقت ${student.averageAccuracyPercent}% در ${student.quizzesCompletedCount}/8 فصل به رتبه #${student.rank} (${cleanHandle}) رسیدم! آیا می‌توانید رکورد مرا بزنید؟ کد چالش: ${challengeCode}`;

  return {
    challengeCode,
    shareTitle,
    shareText,
    clipboardSummary: `${shareTitle}\n${shareText}`,
  };
}

