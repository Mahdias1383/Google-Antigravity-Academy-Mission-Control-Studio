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
