export interface EnglishSubSectionContent {
  contentEn: string[];
  bulletPoints?: { termEn: string; descEn: string }[];
  callout?: {
    type: 'warning' | 'best-practice' | 'architecture';
    titleEn: string;
    contentEn: string;
  };
  comparisonTable?: {
    headers?: string[];
    rows: {
      criterion: string;
      optionA: string;
      optionB: string;
      architectVerdict: string;
    }[];
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
        comparisonTable: {
          headers: ['Architectural Dimension', 'Editor View (Synchronous IDE)', 'Agent Manager / Mission Control (Async)', 'Architectural Guidance'],
          rows: [
            {
              criterion: 'Primary Unit of Focus',
              optionA: 'File buffer, active cursor line, and local AST',
              optionB: 'Engineering task, state machines, and artifacts',
              architectVerdict: 'Use Editor for surgical logic tweaks; Agent Manager for multi-layer features',
            },
            {
              criterion: 'Concurrency Model',
              optionA: 'Single-threaded, tied to developer live attention',
              optionB: 'Parallel background autonomous agents',
              architectVerdict: 'Run 3+ concurrent agents across isolated Git Worktrees',
            },
            {
              criterion: 'Core AI Tooling',
              optionA: 'Supercomplete, Tab-to-Jump, Cmd/Ctrl + I',
              optionB: 'Planning Mode, Browser Subagent, Inbox Triage',
              architectVerdict: 'Combine both workspaces with instant hotkey toggling',
            },
            {
              criterion: 'Deliverables & Auditing',
              optionA: 'Direct file buffer mutations',
              optionB: 'task.md, implementation_plan.md, walkthrough.md',
              architectVerdict: 'PR-style review on artifacts prior to code merge',
            },
          ],
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
        bulletPoints: [
          {
            termEn: 'task.md',
            descEn:
              'Live hierarchical state-machine checklist with three standard states: [ ] Pending, [/] In-Progress, and [x] Completed.',
          },
          {
            termEn: 'implementation_plan.md',
            descEn:
              'Architectural blueprint containing four mandatory sections: Goal Description, User Review Required alert block, file mutation list tagged with [NEW]/[MODIFY]/[DELETE], and Verification Plan.',
          },
          {
            termEn: 'walkthrough.md',
            descEn:
              'Post-execution proof-of-work report demonstrating that the implemented code passes all terminal tests, key diffs, and Browser Subagent visual telemetry.',
          },
        ],
      },
      'm2-s2': {
        contentEn: [
          'Rather than granting agents carte blanche terminal execution, Antigravity introduces PR-Style inline comments. You can review proposed architectural changes directly within the planning artifact.',
          'If a plan attempts to run destructive database migrations or introduce blocking I/O, you insert a review directive that halts execution until the agent refactors the approach.',
        ],
        callout: {
          type: 'best-practice',
          titleEn: 'Batch Review Protocol',
          contentEn:
            'Instead of sending fragmented messages in chat, attach all your architectural review notes (e.g. changing an index type, renaming a variable, or adding a specific edge-case test) as inline comments directly on the relevant lines of implementation_plan.md and submit them together in a single batch.',
        },
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
        comparisonTable: {
          headers: ['Dimension', 'Planning Mode (Structured)', 'Fast Mode (Direct Execution)', 'Architect Guidance'],
          rows: [
            {
              criterion: 'Artifact Generation',
              optionA: 'Full task.md, implementation_plan.md, and walkthrough.md artifacts',
              optionB: 'No prerequisite artifacts; mutations applied directly to files',
              architectVerdict: 'Planning Mode for any task modifying >2 files or schemas',
            },
            {
              criterion: 'Token Overhead & Latency',
              optionA: 'Higher (deep multi-step reasoning and architectural specification)',
              optionB: 'Minimal initial latency; immediate code editing turn',
              architectVerdict: 'Fast Mode for rename, CSS fix, or single unit test additions',
            },
            {
              criterion: 'Architectural Drift Risk',
              optionA: 'Very low (line-by-line PR-style human auditing prior to execution)',
              optionB: 'Medium to high if the initial prompt was underspecified',
              architectVerdict: 'Never use Fast Mode for DB migrations or public API contracts',
            },
          ],
        },
      },
      'm3-s2': {
        contentEn: [
          'Antigravity agents access the terminal to execute test suites, inspect git status, and apply migrations. The built-in Command Safety Classifier evaluates every command before execution to determine if it is harmless or carries destructive side-effects.',
          'Combining terminal policies (Off, Auto, Turbo) with strictly configured Allow and Deny lists maximizes velocity without jeopardizing security. Commands in the Deny list are hard-blocked in all modes, even Turbo.',
        ],
        comparisonTable: {
          headers: ['Policy / List', 'System Behavior', 'Sample Commands / Use Case', 'Risk Profile & Target Scope'],
          rows: [
            {
              criterion: 'Terminal Policy: Off',
              optionA: 'Zero commands run without explicit manual user approval button click',
              optionB: 'Ideal for security audits across untrusted third-party repositories',
              architectVerdict: 'Maximum safety; reduces parallel background agent velocity',
            },
            {
              criterion: 'Terminal Policy: Auto',
              optionA: 'Auto-executes Allow List and safe commands evaluated by Classifier',
              optionB: 'Prompts user for approval on state mutations or unknown commands',
              architectVerdict: 'Recommended default for enterprise staging and team repositories',
            },
            {
              criterion: 'Terminal Policy: Turbo',
              optionA: 'Auto-executes all terminal commands except explicit Deny List entries',
              optionB: 'Best for ephemeral containerized sandboxes and local isolated checkouts',
              architectVerdict: 'Strictly require a comprehensive Deny List alongside Turbo',
            },
            {
              criterion: 'Artifact Review Policies',
              optionA: 'Always Proceed vs. Agent Decides vs. Request Review',
              optionB: 'Controls when the agent pauses after generating implementation_plan.md',
              architectVerdict: 'Use Request Review for Production changes and Agent Decides for daily iteration',
            },
          ],
        },
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
        comparisonTable: {
          headers: ['Activation Mode', 'YAML Frontmatter Configuration', 'Trigger Mechanism', 'Ideal Use Case'],
          rows: [
            {
              criterion: '1. Always On',
              optionA: 'alwaysApply: true',
              optionB: 'Permanently injected into system prompt of all workspace tasks',
              architectVerdict: 'Core project foundations only (<200-300 tokens) such as Python version & architecture',
            },
            {
              criterion: '2. Glob (File Pattern)',
              optionA: 'alwaysApply: false + globs: ["tests/**/*.py"]',
              optionB: 'Automatically activated when reading or editing matching file paths',
              architectVerdict: 'Best for framework conventions, Pytest rules, and UI component standards',
            },
            {
              criterion: '3. Model Decision',
              optionA: 'alwaysApply: false + description: "..." (no globs)',
              optionB: 'Agent semantic router chooses to load rule based on task description match',
              architectVerdict: 'Ideal for occasional rules like security audits, telemetry, or query tuning',
            },
            {
              criterion: '4. Manual (@rule)',
              optionA: 'alwaysApply: false (explicit @rule-name invocation)',
              optionB: 'Loaded only when the human explicitly mentions the rule in the prompt',
              architectVerdict: 'Suitable for specialized checklists like major migrations or rare refactorings',
            },
          ],
        },
      },
      'm4-s2': {
        contentEn: [
          'Below are three complete, production-grade rule files designed for modern Python backend architectures (FastAPI + SQLAlchemy 2.0 Async + Pydantic v2 + Pytest + Security Telemetry) that you can copy directly into your project .agent/rules/ directory and commit to Git.',
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
        comparisonTable: {
          headers: ['Comparison Dimension', 'Rules (.agent/rules/*.md)', 'Workflows (.agent/workflows/*.md)', 'Optimal Pattern'],
          rows: [
            {
              criterion: 'Engineering Nature',
              optionA: 'Declarative Guardrails (How to write code & enforce invariants)',
              optionB: 'Procedural SOPs (What exact step sequence to follow from start to finish)',
              architectVerdict: 'Workflows execute steps while active rules govern code modifications',
            },
            {
              criterion: 'Invocation Pattern',
              optionA: 'Automatic (Always On / Glob / Model Decision) or @rule',
              optionB: 'Explicit slash command invocation (e.g. /safe-migration)',
              architectVerdict: 'Use /slash-commands for standard daily team operations',
            },
            {
              criterion: 'Terminal Automation Control',
              optionA: 'Governed by general terminal policy (Off / Auto / Turbo)',
              optionB: 'Fine-grained command boosting via // turbo and // turbo-all',
              architectVerdict: 'Use // turbo for read/test steps; require human gate on mutations',
            },
          ],
        },
      },
      'm5-s2': {
        contentEn: [
          'Below is the complete source code for three mission-critical engineering workflows that standardize and automate database migrations, pre-merge Pull Request security audits, and telemetry-driven production incident triage.',
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
        bulletPoints: [
          {
            termEn: '1. DOM & Accessibility Tree Stream',
            descEn:
              'Inspects semantic element structure, computed styles, bidirectional RTL/LTR layout alignment, and zero visual overlap across viewports.',
          },
          {
            termEn: '2. Console Log & Runtime Exception Stream',
            descEn:
              'Captures Uncaught TypeError exceptions, React hydration warnings, and unexpected WebSocket disconnections in real time.',
          },
          {
            termEn: '3. Network Payload & Status Interceptor',
            descEn:
              'Intercepts all XHR/Fetch requests and responses, extracting 400/422/500 JSON error bodies and piping them back to the orchestrator agent for autonomous FastAPI router patching.',
          },
        ],
      },
      'm6-s2': {
        contentEn: [
          'In this real-world E2E scenario, after implementing the financial reporting filter endpoint and WebSocket stream, the primary agent dispatches the Browser Subagent to test the live page. When the subagent selects the SETTLED status filter, it intercepts an HTTP 422 Unprocessable Entity network error on the pagination query parameter, inspects the error payload, and autonomously patches the FastAPI Query alias and re-verifies the UI without human intervention.',
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
      'm8-s2': {
        contentEn: [
          'Context Rot occurs when an engineer uses a single chat thread for multiple unrelated tasks. Once conversational history exceeds 100k tokens, models suffer from Lost-in-the-Middle attention degradation, forgetting early system invariants and ballooning per-turn costs.',
          'The golden law in Google Antigravity is: 1 Feature = 1 Fresh Agent Task. Once the agent delivers walkthrough.md and the commit lands, close the task. Persistent architectural knowledge is committed to .agent/rules/ and the Knowledge Base rather than lingering in stale chats.',
        ],
        comparisonTable: {
          headers: ['Anti-Pattern', 'Root Cause', 'Observed Project Symptoms', 'Exact Engineering Solution'],
          rows: [
            {
              criterion: 'Continuing a single chat thread across multiple features',
              optionA: 'Accumulation of obsolete terminal logs and expired diffs in context window',
              optionB: 'Severe latency spikes, forgotten rule guardrails, and variable hallucinations',
              architectVerdict: 'Enforce 1 Feature = 1 Fresh Agent Task; commit persistent decisions to .agent/rules/',
            },
            {
              criterion: 'Running 2 concurrent agents in a single root repository folder',
              optionA: 'Concurrent file mutations and database race condition deadlocks',
              optionB: 'Intermittent Pytest failures and corrupted .git/index.lock files',
              architectVerdict: 'Full isolation of each agent into an independent git worktree with isolated test DB',
            },
            {
              criterion: 'Configuring all .agent/rules files to Always On',
              optionA: 'Injecting thousands of irrelevant tokens into every prompt turn',
              optionB: 'Sluggish response latency and attention dilution away from core instructions',
              architectVerdict: 'Convert specialized rules to Glob (e.g. tests/**/*.py) or Model Decision activation',
            },
            {
              criterion: 'Executing database schema mutation commands in Fast Mode',
              optionA: 'Bypassing the implementation_plan.md design phase and human PR-style gate',
              optionB: 'Irreversible migration revisions or production database table locks',
              architectVerdict: 'Mandate Planning Mode + /safe-migration workflow for all ORM/schema changes',
            },
          ],
        },
      },
    },
  },
};

/**
 * English translations for all CodeSandboxTabs examples across Modules 1-8.
 */
export const CODE_EXAMPLE_EN_MAP: Record<string, { titleEn: string; descriptionEn: string }> = {
  'm1-code-1': {
    titleEn: 'Step 1: SQLAlchemy 2.0 Async Model (Supercomplete Chain Trigger)',
    descriptionEn:
      'When you add the risk_score_bps column to the SQLAlchemy model, the Tab-to-Jump engine immediately predicts leaping to the dependent Pydantic schema and FastAPI router.',
  },
  'm1-code-2': {
    titleEn: 'Step 2: Pydantic v2 Schema & FastAPI Router (Tab-to-Jump Target)',
    descriptionEn:
      'After pressing Tab, the cursor leaps to the router and schema file where Supercomplete synthesizes the new field with strict Annotated validation.',
  },
  'm2-code-task': {
    titleEn: 'Artifact Sample 1: Live Execution State Machine (task.md)',
    descriptionEn:
      'Standard structure of task.md during an asynchronous idempotent settlement engine refactoring mission.',
  },
  'm2-code-plan': {
    titleEn: 'Artifact Sample 2: Architectural Blueprint (implementation_plan.md)',
    descriptionEn:
      'Implementation plan artifact presented to the Principal Architect for Inline PR-Style Review prior to any code mutation.',
  },
  'm2-code-walkthrough': {
    titleEn: 'Artifact Sample 3: Verified Delivery Proof (walkthrough.md)',
    descriptionEn:
      'Final verification artifact generated by the agent after completing code modifications and passing all terminal and Browser Subagent checks.',
  },
  'm3-code-policy': {
    titleEn: 'Enterprise Standard Terminal Allow List & Deny List Policy',
    descriptionEn:
      'Recommended configuration for Python/FastAPI backend teams to auto-execute test suites while hard-blocking destructive shell and database commands.',
  },
  'm4-rule-1': {
    titleEn: 'Rule File 1: FastAPI & SQLAlchemy 2.0 Async Standards (Always On)',
    descriptionEn:
      'Core backend guardrail enforcing SQLAlchemy 2.0 select() syntax, Pydantic v2 strict schemas, and standardized domain exception handling.',
  },
  'm4-rule-2': {
    titleEn: 'Rule File 2: QA & Pytest Async Standards (Glob-Triggered)',
    descriptionEn:
      'Activated automatically only when the agent reads or edits files inside the tests/ directory or conftest.py.',
  },
  'm4-rule-3': {
    titleEn: 'Rule File 3: Security, Structured Logging & Telemetry (Model-Decision)',
    descriptionEn:
      'Dynamically loaded by the semantic router when working on authentication, logging middlewares, PII scrubbing, or external HTTP integrations.',
  },
  'm5-wf-1': {
    titleEn: 'Workflow 1: Safe Migration & Reversibility Verification (/safe-migration)',
    descriptionEn:
      'Audits Alembic heads, generates revision, inspects for destructive operations, and executes the full upgrade -> downgrade -> upgrade reversibility cycle.',
  },
  'm5-wf-2': {
    titleEn: 'Workflow 2: Pre-Merge Security & Quality Audit (/pr-security-audit)',
    descriptionEn:
      'Autonomous execution of static security rules, Mypy type checks, and Pydantic schema contract verification powered by // turbo-all.',
  },
  'm5-wf-3': {
    titleEn: 'Workflow 3: Telemetry-Driven Incident Triage (/incident-triage)',
    descriptionEn:
      'Fetches 5xx error logs from the FastMCP server, writes a failing TDD reproduction test, patches the root cause, and compiles walkthrough.md.',
  },
  'm6-code-1': {
    titleEn: 'Browser Subagent Telemetry Interception & Autonomous FastAPI Patch',
    descriptionEn:
      'Autonomous resolution of Query parameter alias mismatch and pagination summary calculation after Browser Subagent intercepted an HTTP 422 error.',
  },
  'm7-code-json': {
    titleEn: 'Complete Copyable mcp_config.json Configuration File',
    descriptionEn:
      'Simultaneous connection to Read-Only PostgreSQL, GitHub Enterprise, and a custom Python FastMCP telemetry server.',
  },
  'm7-code-py': {
    titleEn: 'Complete Python FastMCP Server Implementation (telemetry_and_alert_mcp.py)',
    descriptionEn:
      'Production-ready Python MCP server using FastMCP and httpx.AsyncClient to query OpenSearch error logs and dispatch deployment reports to Rocket.Chat.',
  },
  'm8-code-worktree': {
    titleEn: 'Provisioning Script for 3 Isolated Git Worktrees & Parallel Agents',
    descriptionEn:
      'Creates 3 isolated working directories with dedicated test databases to run 3 concurrent autonomous agents in Google Antigravity without lock contention.',
  },
};

/**
 * English translations for all Cheat Sheet items in Studio 04.
 */
export const CHEAT_SHEET_ITEM_EN_MAP: Record<string, { labelEn: string; detailEn: string }> = {
  Tab: {
    labelEn: 'Accept Supercomplete or Execute Tab-to-Jump',
    detailEn: 'Applies multi-line diff prediction and jumps cursor to the next dependent schema or router location.',
  },
  'Cmd / Ctrl + I': {
    labelEn: 'Inline Command Transformation',
    detailEn: 'Surgical AST-level refactoring of the selected function or class without leaving the active editor buffer.',
  },
  'Cmd / Ctrl + K': {
    labelEn: 'Global Search & Command Launcher',
    detailEn: 'Instant navigation across all curriculum modules, studios, architectural rules, and slash commands.',
  },
  'Cmd / Ctrl + Shift + M': {
    labelEn: 'Instant Toggle: Editor View <-> Agent Manager',
    detailEn: 'Rapidly switch between synchronous inline coding and the asynchronous Mission Control & Inbox dashboard.',
  },
  '@file': {
    labelEn: 'Pin Specific File to Agent Prompt',
    detailEn: 'Example: @src/models/settlement.py to focus agent attention strictly on the database model.',
  },
  '@folder': {
    labelEn: 'Scan Directory Structure & Contained Files',
    detailEn: 'Example: @src/api/routers to audit consistency across all API endpoints.',
  },
  '@rule': {
    labelEn: 'Explicitly Invoke a Manual Rule',
    detailEn: 'Example: @03-security-and-telemetry to enforce the security checklist in the current task.',
  },
  '@mcp': {
    labelEn: 'Direct Agent to an MCP Server or Tool',
    detailEn: 'Example: @mcp:postgres-analytics-ro to inspect live read-only database schemas.',
  },
  '@terminal': {
    labelEn: 'Inject Latest Terminal Output & Stack Trace',
    detailEn: 'Pipes failing Pytest or Alembic stack traces directly into the agent context without manual copy-pasting.',
  },
  'alwaysApply: true': {
    labelEn: 'Always On Mode (Permanent Injection)',
    detailEn: 'Reserved for compact foundational rules (<300 tokens) that apply to 100% of workspace tasks.',
  },
  'globs: ["src/**/*.py"]': {
    labelEn: 'Glob Mode (Path-Pattern Activation)',
    detailEn: 'Automatically loads the rule strictly when reading or editing files matching the target glob pattern.',
  },
  'description: "Activate when..."': {
    labelEn: 'Model Decision Mode (Semantic Routing)',
    detailEn: 'Dynamically activated by the semantic router when the task intent matches the rule description.',
  },
  'alwaysApply: false (No globs)': {
    labelEn: 'Manual Mode (Explicit @rule Invocation)',
    detailEn: 'Consumes zero context tokens until explicitly invoked by the engineer via @rule-name.',
  },
  '.agent/workflows/<name>.md': {
    labelEn: 'Automatic Slash Command Registration Path',
    detailEn: 'The markdown filename directly registers as the /name command inside the agent input bar.',
  },
  '// turbo': {
    labelEn: 'Single-Step Auto-Run Directive',
    detailEn: 'Placed directly above a bash code block to auto-execute that specific step without confirmation.',
  },
  '// turbo-all': {
    labelEn: 'Full Pipeline Autonomous Execution Directive',
    detailEn: 'Placed at the top of a workflow file to execute all steps continuously from start to finish.',
  },
  'task.md · implementation_plan.md · walkthrough.md': {
    labelEn: 'The 3 Standard Artifact Lifecycle Files',
    detailEn: 'Structured deliverables inside brain/ enabling PR-style inline architectural review.',
  },
  'ALLOW: poetry run pytest / ruff check .': {
    labelEn: 'Safe Test & Static Analysis Commands',
    detailEn: 'Auto-executed in Auto policy mode to accelerate the autonomous TDD feedback loop.',
  },
  'ALLOW: alembic heads / current / history': {
    labelEn: 'Read-Only Database Schema Inspection Commands',
    detailEn: 'Purely read-only inspection commands with zero mutation risk to database tables.',
  },
  'DENY: rm -rf / git push --force / reset --hard': {
    labelEn: 'Hard-Block Destructive File & Git History Commands',
    detailEn: 'Strictly prevents file deletion or repository history rewrites even when running in Turbo mode.',
  },
  'DENY: alembic downgrade base / DROP TABLE': {
    labelEn: 'Database Destruction Guardrail',
    detailEn: 'Mandates explicit human intervention for any table drop or full schema rollback operation.',
  },
  'git worktree add -b feat/x ../wt-x main': {
    labelEn: 'Create Isolated Physical Workspace & Branch',
    detailEn: 'Assigns a dedicated directory to each concurrent agent to eliminate file and git index locks.',
  },
  'git worktree list': {
    labelEn: 'Inspect Active Worktrees & Checked-Out Commits',
    detailEn: 'Audits the status of all parallel directories currently operated by background agents.',
  },
  'git worktree remove ../wt-x': {
    labelEn: 'Clean Up Worktree After Pull Request Merge',
    detailEn: 'Safely removes the agent working directory after walkthrough.md delivery and branch merge.',
  },
  '1 Feature = 1 Fresh Agent Task': {
    labelEn: 'Golden Law for Eradicating Context Rot',
    detailEn: 'Never reuse a bloated chat thread for unrelated features; start fresh to preserve peak model attention.',
  },
};

/**
 * English translations for all 8 Principal Architect Scenarios in Studio 05.
 */
export const SCENARIO_EN_MAP: Record<
  string,
  {
    problemStatementEn: string;
    optionsEn: Record<string, { labelEn: string; explanationEn: string }>;
  }
> = {
  'scen-1': {
    problemStatementEn:
      'In Agent Manager, you dispatch three autonomous agents in parallel to implement three separate features. Within minutes, Pytest runs fail with erratic database lock errors and Git changes from Agent 1 collide with Agent 2. What is the optimal architectural solution?',
    optionsEn: {
      's1-opt1': {
        labelEn: 'Provision 3 isolated directories via git worktree add and assign a dedicated test database per worktree',
        explanationEn:
          'Spot on! Git Worktrees provide each agent with a completely independent physical directory and Git index, while isolating the test database name in .env.test eliminates all race conditions.',
      },
      's1-opt2': {
        labelEn: 'Switch Terminal Policy to Off and manually approve every command one by one',
        explanationEn:
          'Manual command approval does not prevent concurrent file overwrites inside a shared working tree and destroys asynchronous multi-agent velocity.',
      },
      's1-opt3': {
        labelEn: 'Combine all 3 unrelated features into a single mega-prompt inside one agent thread',
        explanationEn:
          'Combining 3 unrelated features in a single session causes severe Context Rot, Lost-in-the-Middle attention degradation, and tangled implementation_plan.md reviews.',
      },
    },
  },
  'scen-2': {
    problemStatementEn:
      'Your team authored a 2,500-token rule file containing exhaustive Pytest fixture patterns and load-testing guidelines, configured as Always On. Now, even when changing a button color in the UI, all 2,500 tokens are injected on every turn. How do you optimize this?',
    optionsEn: {
      's2-opt1': {
        labelEn: 'Change activation mode to Glob scoped strictly to test paths (tests/**/*.py, conftest.py)',
        explanationEn:
          'Exactly right! With Glob activation, this heavy rule file is loaded only when the agent opens or edits test files, consuming 0 tokens on unrelated frontend or infrastructure tasks.',
      },
      's2-opt2': {
        labelEn: 'Delete the rule file from Git and manually paste it into chat whenever needed',
        explanationEn:
          'Deleting version-controlled rules from Git destroys team standardization and leads to inconsistent test quality across developers.',
      },
      's2-opt3': {
        labelEn: 'Move the entire 2,500-token file into the Global ~/.gemini/GEMINI.md configuration',
        explanationEn:
          'Moving it to Global rules not only fails to solve permanent token overhead, it also pollutes every other unrelated repository on your machine.',
      },
    },
  },
  'scen-3': {
    problemStatementEn:
      'You ask an agent to refactor the core banking settlement model. You must guarantee that under no circumstances can the agent drop a column (drop_column) or mutate source files without your explicit prior sign-off. Which configuration is required?',
    optionsEn: {
      's3-opt1': {
        labelEn: 'Run in Planning Mode with Request Review policy and perform inline PR-style review on implementation_plan.md',
        explanationEn:
          'Optimal decision! The agent generates implementation_plan.md with a User Review Required alert block and halts execution until you audit and approve the exact line-by-line blueprint.',
      },
      's3-opt2': {
        labelEn: 'Run in Fast Mode paired with the Turbo terminal execution policy',
        explanationEn:
          'Extremely dangerous! Fast Mode bypasses implementation_plan.md generation and Turbo immediately executes database migrations without human review.',
      },
      's3-opt3': {
        labelEn: 'Place the // turbo-all directive at the top of the migration workflow',
        explanationEn:
          'The // turbo-all directive executes every workflow step continuously without pausing, removing the human review gate before migration execution.',
      },
    },
  },
  'scen-4': {
    problemStatementEn:
      'Your team wants every invocation of /safe-migration to automatically execute head checks and reversibility tests (upgrade -> downgrade -> upgrade), while keeping the actual migration revision generation step under human supervision. How do you architect the workflow file?',
    optionsEn: {
      's4-opt1': {
        labelEn: 'Place the single-step // turbo directive strictly above the head check, reversibility test, and Pytest steps',
        explanationEn:
          'Precision engineering! The // turbo directive auto-runs only the annotated step, allowing you to retain human-in-the-loop control on sensitive schema generation steps.',
      },
      's4-opt2': {
        labelEn: 'Add // turbo-all on line 1 of .agent/workflows/safe-migration.md',
        explanationEn:
          '// turbo-all forces all steps—including initial revision generation and schema application—to run non-stop without supervision.',
      },
      's4-opt3': {
        labelEn: 'Write the sequential bash steps inside .agent/rules/migrations.md',
        explanationEn:
          'Rules (.agent/rules) are declarative guardrails, not procedural execution pipelines, and do not register slash commands or support // turbo directives.',
      },
    },
  },
  'scen-5': {
    problemStatementEn:
      'After renaming a pagination query field in the FastAPI backend, backend unit tests pass, but when a user clicks the status filter in the frontend dashboard, the table remains empty. How should the agent detect and resolve this contract mismatch?',
    optionsEn: {
      's5-opt1': {
        labelEn: 'Dispatch Browser Subagent, intercept the HTTP 422 response in the Network stream, auto-patch Query(alias=...), and record WebP proof in walkthrough.md',
        explanationEn:
          'Excellent! The Browser Subagent clicks the real UI filter in instrumented Chromium, catches the HTTP 422 JSON payload in the network stream, patches the FastAPI Query alias, and embeds WebP video proof in walkthrough.md.',
      },
      's5-opt2': {
        labelEn: 'Rely solely on re-running pytest against existing mocked unit tests',
        explanationEn:
          'Backend unit tests using mocked payloads cannot detect live integration contract mismatches between frontend query strings and backend routers.',
      },
      's5-opt3': {
        labelEn: 'Disable Pydantic validation on the FastAPI router and parse raw Request query params',
        explanationEn:
          'Stripping Pydantic validation destroys API type safety and violates core architectural guardrails.',
      },
    },
  },
  'scen-6': {
    problemStatementEn:
      'The operations team wants Antigravity agents to directly query OpenSearch 5xx logs and inspect PostgreSQL table schemas during incident triage, while guaranteeing zero write/mutation risk against the Production database. What is the optimal MCP architecture?',
    optionsEn: {
      's6-opt1': {
        labelEn: 'Build an async @mcp.tool() with httpx.AsyncClient in FastMCP and set default_transaction_read_only=on for the Postgres server in mcp_config.json',
        explanationEn:
          'Gold-standard enterprise pattern! FastMCP with explicit async timeouts paired with a read-only database role and read-only transaction session flags guarantees zero production mutation risk.',
      },
      's6-opt2': {
        labelEn: 'Commit the PostgreSQL superuser password inside .agent/rules/ so all agents can read it',
        explanationEn:
          'Critical security violation! Committing credentials into Git rule files and granting superuser database privileges is strictly forbidden.',
      },
      's6-opt3': {
        labelEn: 'Use synchronous requests.post() without timeouts inside the Python MCP tool',
        explanationEn:
          'Unbounded synchronous network calls block the MCP server event loop whenever OpenSearch is slow, hanging the agent session.',
      },
    },
  },
  'scen-7': {
    problemStatementEn:
      'A senior engineer has used a single continuous agent chat thread since morning to build 4 unrelated features (Auth, PDF Export, Redis Cache, and Table Styling). By the fourth feature, the agent forgets SQLAlchemy 2.0 rules and responds sluggishly. What is the root cause and fix?',
    optionsEn: {
      's7-opt1': {
        labelEn: 'Context Rot (Lost-in-the-Middle); close the completed task and enforce 1 Feature = 1 Fresh Agent Task backed by the Knowledge Base',
        explanationEn:
          'Spot-on diagnosis! Accumulating stale terminal logs and obsolete diffs dilutes model attention (Context Rot). Spawning a fresh task per feature keeps the context window lean and enforces .agent/rules/ and Knowledge Base invariants with peak accuracy.',
      },
      's7-opt2': {
        labelEn: 'Paste 3,000 tokens of ALL CAPS rules at the bottom of the bloated 150k-token chat thread',
        explanationEn:
          'Appending more tokens to an already saturated context window increases per-turn cost and fails to cure Lost-in-the-Middle attention decay.',
      },
      's7-opt3': {
        labelEn: 'Disable the Language Server (LSP) and .agent/rules/ to free up context tokens',
        explanationEn:
          'Disabling LSP diagnostics and architectural guardrails leads to unverified syntax errors and severe architectural regressions.',
      },
    },
  },
  'scen-8': {
    problemStatementEn:
      'In Editor View, you just added a new settlement_fee_bps column to a SQLAlchemy model and want to propagate that exact field to the Pydantic schema and FastAPI router in under 10 seconds without touching the mouse. What is the optimal workflow?',
    optionsEn: {
      's8-opt1': {
        labelEn: 'Press Tab to trigger the Tab-to-Jump chain across dependent files and press Tab at each stop to accept the Supercomplete diff',
        explanationEn:
          'Purpose-built for this exact scenario! Tab-to-Jump analyzes the LSP dependency graph to leap directly to the dependent schema and router, while Supercomplete synthesizes the matching field diff from your recent edit.',
      },
      's8-opt2': {
        labelEn: 'Spawn a full Planning Mode task with 3 artifacts in Agent Manager for a 2-line field addition',
        explanationEn:
          'For a surgical 2-line synchronous edit where your cursor is already on the code, launching full Planning Mode introduces unnecessary latency.',
      },
      's8-opt3': {
        labelEn: 'Manually run grep in the terminal and copy-paste field definitions across files',
        explanationEn:
          'Manual grep and copy-pasting is slow and fails to leverage LSP dependency graphs and diff-aware Supercomplete in Editor View.',
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

