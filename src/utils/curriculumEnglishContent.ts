export interface EnglishSubSectionContent {
  contentEn: string[];
  bulletPoints?: { termEn: string; descEn: string }[];
  callout?: {
    type: 'warning' | 'best-practice' | 'architecture';
    titleEn: string;
    contentEn: string;
  };
}

export interface EnglishModuleContent {
  summaryEn: string;
  keyTakeaways: {
    titleEn: string;
    metricOrBadge: string;
    descEn: string;
  }[];
  subSections: Record<string, EnglishSubSectionContent>;
}

export const ENGLISH_CURRICULUM_CONTENT: Record<string, EnglishModuleContent> = {
  'module-1': {
    summaryEn:
      'The foundational paradigm shift from synchronous line-by-line coding (Synchronous Copilot Era) to asynchronous multi-agent orchestration (Agent-First Engineering) inside Google Antigravity dual workspaces.',
    keyTakeaways: [
      {
        titleEn: 'Dual Workspace Partitioning',
        metricOrBadge: 'Editor View + Mission Control',
        descEn: 'Separating synchronous surgical code editing from parallel asynchronous background agent orchestration.',
      },
      {
        titleEn: 'Supercomplete Predictive Engine',
        metricOrBadge: 'LSP + Diff-History Aware',
        descEn: 'Predicting multi-line, multi-file diffs driven by LSP dependency graphs and recent diff history.',
      },
      {
        titleEn: 'Tab-to-Jump Navigation Chain',
        metricOrBadge: 'Zero-Friction AST Navigation',
        descEn: 'Autonomously jumping the cursor across ORM models, Pydantic schemas, and FastAPI routers with single Tab presses.',
      },
      {
        titleEn: 'Structured Context Mentions',
        metricOrBadge: '@file · @rule · @mcp',
        descEn: 'Minimizing context noise by pinning specific files, architectural rules, MCP servers, and terminal telemetry.',
      },
    ],
    subSections: {
      'm1-s1': {
        contentEn: [
          'In the first generation of AI programming assistants, engineers were trapped in a synchronous loop: you wrote code line-by-line, paused for autocomplete suggestions, or copied snippets from side chat panels. While helpful for micro-tasks, this approach failed to scale because the developer remained the single-threaded bottleneck.',
          'Google Antigravity inverts this dynamic through an Agent-First architecture. As a Principal Systems Architect, you operate across two complementary workspaces: the Editor View for surgical inline authoring, and the Agent Manager (Mission Control) to supervise autonomous agents executing parallel background tasks.',
        ],
        callout: {
          type: 'architecture',
          titleEn: 'Golden Workload Allocation Invariant',
          contentEn:
            'Whenever a change spans more than 2 files or requires running Pytest validation and browser checks, launch it through the Agent Manager as a structured task with reviewable artifacts.',
        },
      },
      'm1-s2': {
        contentEn: [
          'The Editor View in Google Antigravity is not merely a text buffer; it incorporates three real-time prediction engines integrated with the Language Server Protocol (LSP), Abstract Syntax Trees (AST), and git diff telemetry.',
          'Supercomplete inspects your active edit buffer and recent LSP diagnostics to generate multi-line diff blocks. As soon as you commit a model change, Tab-to-Jump predicts the exact downstream file requiring synchronized updates.',
        ],
        bulletPoints: [
          {
            termEn: 'Supercomplete',
            descEn: 'Multi-line predictive diff engine synthesizing type-safe edits across related AST nodes.',
          },
          {
            termEn: 'Tab-to-Jump & Tab-to-Import',
            descEn: 'Zero-friction cursor navigation leaping across dependent schemas and auto-inserting missing imports.',
          },
          {
            termEn: 'Inline Command (Cmd/Ctrl + I)',
            descEn: 'Surgical AST-level transformations inside the active buffer without losing cursor focus.',
          },
          {
            termEn: '@ Mentions',
            descEn: 'Scoped context injection pinning files, folders, rules, MCP servers, and terminal logs.',
          },
        ],
      },
    },
  },

  'module-2': {
    summaryEn:
      'The engineering lifecycle of task.md, implementation_plan.md, and walkthrough.md artifacts, featuring PR-style inline review comments to govern autonomous agent turns.',
    keyTakeaways: [
      {
        titleEn: 'The Artifact Trinity',
        metricOrBadge: 'task.md · plan.md · walkthrough.md',
        descEn: 'The core artifact pipeline transforming underspecified prompts into auditable, deterministic deliverables.',
      },
      {
        titleEn: 'Pre-Execution Review Gates',
        metricOrBadge: 'Zero Runaway Terminal Execution',
        descEn: 'Halting agent modifications until architectural review gates in implementation_plan.md are human-approved.',
      },
      {
        titleEn: 'Inline PR-Style Commenting',
        metricOrBadge: 'Line-by-Line Ast Guardrails',
        descEn: 'Annotating plan lines with precise architectural constraints before any source code is mutated.',
      },
      {
        titleEn: 'Automated Walkthrough Proof',
        metricOrBadge: 'Telemetry Proof & Visual Evidence',
        descEn: 'Requiring verifiable test logs and browser screenshots in walkthrough.md before merging.',
      },
    ],
    subSections: {
      'm2-s1': {
        contentEn: [
          'Autonomous agents without verifiable artifacts inevitably suffer from hallucinations and unintended side effects. Antigravity establishes the Artifact Trinity as mandatory contract boundaries for every task.',
          'task.md tracks state machines with todo, in_progress, and completed flags. implementation_plan.md outlines precise file-by-file modifications and critical user review gates. walkthrough.md records verifiable proof of completion.',
        ],
      },
      'm2-s2': {
        contentEn: [
          'Rather than granting agents carte blanche terminal execution, Antigravity introduces PR-Style inline comments. You can review proposed architectural changes directly within the planning artifact.',
          'If a plan attempts to run destructive database migrations or introduce blocking I/O, you insert a review directive that halts execution until the agent refactors the approach.',
        ],
      },
    },
  },

  'module-3': {
    summaryEn:
      'Balancing agent velocity and system safety through Planning vs. Fast Execution Modes, and calibrating Terminal Autonomy policies between Off, Auto, and Turbo.',
    keyTakeaways: [
      {
        titleEn: 'Dual Execution Modes',
        metricOrBadge: 'Planning vs. Fast Mode',
        descEn: 'Switching between rigorous multi-turn deliberation and high-velocity single-turn refactorings.',
      },
      {
        titleEn: 'Terminal Safety Matrix',
        metricOrBadge: 'Off · Auto · Turbo (YOLO)',
        descEn: 'Calibrating terminal execution risk across read-only inspection, sandbox scripts, and production environments.',
      },
      {
        titleEn: 'Allowlist & Denylist Guardrails',
        metricOrBadge: 'Regex & AST Command Governance',
        descEn: 'Strictly forbidding rm -rf, drop table, and credential logging across all autonomy levels.',
      },
      {
        titleEn: 'Human-in-the-Loop Interventions',
        metricOrBadge: 'One-Click Escalation Gates',
        descEn: 'Requiring architect authorization whenever confidence drops or risk thresholds are exceeded.',
      },
    ],
    subSections: {
      'm3-s1': {
        contentEn: [
          'Not all engineering tasks require identical cognitive depth. Simple typography fixes or test refactorings benefit from Fast Mode, which bypasses formal planning overhead to apply immediate diffs.',
          'Conversely, complex domain refactoring, database migrations, or authentication overhauls demand Planning Mode, where the agent gathers evidence, outlines dependencies, and solicits approval.',
        ],
      },
    },
  },

  'module-4': {
    summaryEn:
      'Engineering deterministic agent behavior with .agent/rules/*.md, mastering 4 activation modes, and managing token overhead across large codebases.',
    keyTakeaways: [
      {
        titleEn: 'Rules as System Guardrails',
        metricOrBadge: '.agent/rules/*.md',
        descEn: 'Codifying enterprise architecture rules into markdown files parsed by the agent runtime.',
      },
      {
        titleEn: '4 Activation Modes',
        metricOrBadge: 'Always On · Glob · Model · Manual',
        descEn: 'Balancing context coverage and token budgets by dynamically scoping rule activation.',
      },
      {
        titleEn: 'Token Economy & Context Budget',
        metricOrBadge: '< 500 Tokens Per Rule',
        descEn: 'Preventing context rot by keeping rules compact, atomic, and strictly domain-focused.',
      },
      {
        titleEn: 'Conflict-Free Priority Hierarchies',
        metricOrBadge: 'Deterministic Rule Resolution',
        descEn: 'Resolving overlapping guidelines through explicit scoping and specific file glob matching.',
      },
    ],
    subSections: {
      'm4-s1': {
        contentEn: [
          'Traditional coding style guides live in wiki pages and are forgotten by developers. In Antigravity, rules reside in .agent/rules/*.md with frontmatter metadata controlling their activation lifecycle.',
          'Always On rules protect core workspace invariants, while Glob rules activate strictly when matching target file paths (e.g. src/repositories/**/*.py), saving valuable context tokens.',
        ],
      },
    },
  },

  'module-5': {
    summaryEn:
      'Orchestrating repetitive multi-step SOPs via .agent/workflows/*.md, slash commands, and accelerating execution with // turbo directives.',
    keyTakeaways: [
      {
        titleEn: 'Workflow SOP Directives',
        metricOrBadge: '.agent/workflows/*.md',
        descEn: 'Encapsulating repeatable engineering protocols into version-controlled slash commands.',
      },
      {
        titleEn: '// turbo Directives',
        metricOrBadge: 'Zero-Prompt Step Acceleration',
        descEn: 'Executing pre-approved commands without pausing for interactive confirmation.',
      },
      {
        titleEn: 'Deterministic Rollbacks',
        metricOrBadge: 'Safe Rollback Counterparts',
        descEn: 'Ensuring every forward migration step includes verified rollback instructions.',
      },
      {
        titleEn: 'Telemetry & Gate Validation',
        metricOrBadge: 'Automated Health Verifications',
        descEn: 'Running lint, type checks, and smoke tests automatically before workflow completion.',
      },
    ],
    subSections: {
      'm5-s1': {
        contentEn: [
          'Engineering workflows often involve tedious sequences: creating a migration revision, applying it, running tests, and updating documentation. Antigravity workflows turn these sequences into single slash commands.',
          'The // turbo directive instructs the runtime to execute deterministic steps autonomously, eliminating needless round-trips while preserving full audit logs in the terminal.',
        ],
      },
    },
  },

  'module-6': {
    summaryEn:
      'Leveraging the autonomous Browser Subagent for end-to-end visual testing, DOM/network inspection, console telemetry, and WebP proof capture in walkthrough.md.',
    keyTakeaways: [
      {
        titleEn: 'Autonomous Browser Testing',
        metricOrBadge: 'Browser Subagent Integration',
        descEn: 'Deploying headless browser subagents to interact with web interfaces and verify UX workflows.',
      },
      {
        titleEn: 'DOM & Network Stream Telemetry',
        metricOrBadge: 'Real-Time 4xx/5xx Tracking',
        descEn: 'Intercepting network requests and console errors to diagnose runtime bugs automatically.',
      },
      {
        titleEn: 'Visual WebP Proof Artifacts',
        metricOrBadge: 'Definitive Delivery Evidence',
        descEn: 'Embedding timestamped screenshots and video recordings inside walkthrough.md.',
      },
      {
        titleEn: 'Accessibility & Contrast Audits',
        metricOrBadge: 'WCAG 2.1 AA Compliance',
        descEn: 'Automating contrast, screen-reader semantics, and layout shift verifications across viewports.',
      },
    ],
    subSections: {
      'm6-s1': {
        contentEn: [
          'Code that compiles is not necessarily code that works. The Antigravity Browser Subagent spins up a browser instance to test rendered web UIs, filling forms, clicking triggers, and validating layout stability.',
          'By streaming console logs, network responses, and DOM mutations back to the agent, bugs like 422 validation mismatches or broken websocket connections are caught before human review.',
        ],
      },
    },
  },

  'module-7': {
    summaryEn:
      'Extending agent capabilities with the Model Context Protocol (MCP), fast asynchronous Python tools via FastMCP, and enterprise stdio/SSE architectures.',
    keyTakeaways: [
      {
        titleEn: 'Standard Model Context Protocol',
        metricOrBadge: 'mcp_config.json Architecture',
        descEn: 'Connecting external databases, cloud telemetry, and internal microservices via standardized JSON-RPC.',
      },
      {
        titleEn: 'High-Velocity FastMCP Servers',
        metricOrBadge: '@mcp.tool() Python Runtime',
        descEn: 'Building async, type-safe MCP tools with Pydantic validation in under 20 lines of code.',
      },
      {
        titleEn: 'stdio vs. SSE Transports',
        metricOrBadge: 'Local Process vs. Cloud VPC',
        descEn: 'Selecting optimal transport mechanisms based on security, latency, and deployment topology.',
      },
      {
        titleEn: 'Safe Tool Governance',
        metricOrBadge: 'Read-Only & Mutation Boundaries',
        descEn: 'Segregating read-only discovery tools from high-impact state mutation operations.',
      },
    ],
    subSections: {
      'm7-s1': {
        contentEn: [
          'LLMs are limited by their training cutoff and isolated runtime. MCP provides a universal, open standard for agents to interact securely with real-world infrastructure.',
          'Through mcp_config.json, you bind FastMCP servers that expose structured tools, resources, and prompt templates, allowing agents to query databases, inspect metrics, and manage deployments.',
        ],
      },
    },
  },

  'module-8': {
    summaryEn:
      'Mastering parallel multi-agent missions across isolated Git Worktrees, inbox triage, preventing context rot, and coordinating mission command.',
    keyTakeaways: [
      {
        titleEn: 'Git Worktree Isolation',
        metricOrBadge: 'Parallel Independent Checkouts',
        descEn: 'Eliminating index.lock collisions and branch thrashing by giving each agent its own isolated worktree.',
      },
      {
        titleEn: 'Mission Control Inbox Triage',
        metricOrBadge: 'Asynchronous Agent Oversight',
        descEn: 'Reviewing, approving, and merging work streams across multiple concurrent background agents.',
      },
      {
        titleEn: 'Context Rot Eradication',
        metricOrBadge: 'Atomic Task Lifecycles',
        descEn: 'Preventing model attention degradation by isolating memory and resetting context between tasks.',
      },
      {
        titleEn: 'The Principal Architect Role',
        metricOrBadge: 'Commander vs. Code Monkey',
        descEn: 'Ascending to high-level systems design, governance, and orchestration of autonomous engineering teams.',
      },
    ],
    subSections: {
      'm8-s1': {
        contentEn: [
          'Running multiple autonomous agents in a single workspace folder leads to disaster: git index locks, database test collisions, and overwritten files. Antigravity solves this with Git Worktrees.',
          'Each agent works in a separate directory linked to the same repository. You triage completed tasks in Mission Control Inbox, review their walkthrough proof, and merge cleanly into main.',
        ],
      },
    },
  },
};

/**
 * Helper to get English module content with graceful fallback.
 */
export function getEnglishModuleContent(moduleId: string): EnglishModuleContent | null {
  return ENGLISH_CURRICULUM_CONTENT[moduleId] || null;
}
