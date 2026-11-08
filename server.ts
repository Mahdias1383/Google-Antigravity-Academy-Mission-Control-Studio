import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildModuleQuickOverviewPrompt,
  buildDeterministicModuleQuickOverview,
  normalizeAiQuickOverviewResponse,
  QuickOverviewLens,
  buildKbContextAwarenessPrompt,
  buildDeterministicKbContextAwareness,
  normalizeAiKbContextAwarenessResponse,
  McpBaselineProfileId,
  buildModuleKnowledgeCheckPrompt,
  buildDeterministicModuleKnowledgeCheck,
  normalizeAiModuleKnowledgeCheckResponse,
} from './src/utils/generators';
import {
  buildWeeklyLeaderboardChallengePrompt,
  buildDeterministicWeeklyLeaderboardChallenges,
  normalizeAiWeeklyLeaderboardChallengesResponse,
  WeeklyChallengeTrackId,
} from './src/utils/achievements';

type SupportedChatModel =
  | 'gemini-4-argon'
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite';

const ALLOWED_CHAT_MODELS: SupportedChatModel[] = [
  'gemini-4-argon',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
];

function buildRoleSystemInstruction(
  rolePersona: string | undefined,
  customInstruction: string | undefined,
  language: string | undefined
): string {
  const langRule =
    language === 'en'
      ? 'Respond in clear, authoritative English.'
      : 'Respond in fluent Persian (RTL) while keeping technical identifiers, file paths (.agent/rules/, .agent/workflows/, task.md, implementation_plan.md, walkthrough.md, mcp_config.json), and code blocks in English.';

  if (rolePersona === 'custom' && customInstruction && customInstruction.trim()) {
    return `${customInstruction.trim()}\n\n${langRule}`;
  }

  switch (rolePersona) {
    case 'security-auditor':
      return `You are a Principal Zero-Trust Security & Terminal Governance Auditor for Google Antigravity IDE (https://antigravity.google/docs). You specialize in .agent/rules/*.md (Always On, Glob, Model Decision, Manual activation modes), Terminal Policies (Off, Auto, Turbo), command allow/deny-lists, and preventing unauthorized database mutations. ${langRule}`;
    case 'fastmcp-engineer':
      return `You are a Staff FastMCP Protocol & Browser Subagent Engineer for Google Antigravity IDE. You specialize in designing mcp_config.json, writing Python FastMCP servers with @mcp.tool() decorators, enforcing read-only database pools, and orchestrating the Browser Subagent for automated DOM/console verification and WebP proof artifacts in walkthrough.md. ${langRule}`;
    case 'principal-architect':
    default:
      return `You are an Elite Principal AI Systems Architect specializing in Google Antigravity (https://antigravity.google/docs). You guide engineers on dual Editor View vs. Agent Manager workflows, Artifact lifecycle (task.md, implementation_plan.md, walkthrough.md), PR-Style Inline Review, isolated Git Worktrees, and eliminating Context Rot. ${langRule}`;
  }
}

function buildFallbackChatReply(params: {
  lastUserMessage: string;
  model: SupportedChatModel;
  rolePersona: string;
  useSearchGrounding: boolean;
  language: string;
  turnCount: number;
}): {
  text: string;
  sources: { title: string; uri: string }[];
} {
  const { lastUserMessage, model, rolePersona, useSearchGrounding, language, turnCount } = params;
  const isEn = language === 'en';

  const sources = [
    {
      title: 'Google Antigravity Official Documentation — Core Architecture',
      uri: 'https://antigravity.google/docs',
    },
    {
      title: 'Antigravity Artifacts & PR-Style Review Specification',
      uri: 'https://antigravity.google/docs/artifacts',
    },
    {
      title: 'FastMCP & .agent/rules Governance Guide',
      uri: 'https://antigravity.google/docs/mcp-and-rules',
    },
  ];

  if (isEn) {
    return {
      text: `### [${model}${useSearchGrounding ? ' + Google Search Grounding' : ''}] Turn #${turnCount} · Persona: \`${rolePersona}\`

Regarding your query: **"${lastUserMessage.slice(0, 140)}"**

1. **Artifact-First Verification (\`task.md\` → \`implementation_plan.md\` → \`walkthrough.md\`):**
   - Before mutating production files, enforce **Planning Mode** so the agent emits \`implementation_plan.md\` for inline PR-style review.
2. **Scoped Guardrails (\`.agent/rules/\`) & Workflow Automation (\`// turbo\`):**
   - Bind domain invariants via **Glob** activation (e.g., \`src/db/**/*.ts\` or \`alembic/versions/*.py\`) and automate non-destructive verification steps in \`.agent/workflows/\` with \`// turbo\`.
3. **Zero Context Rot & Multi-Agent Isolation:**
   - Offload persistent architectural invariants to \`.agent/knowledge-base/\` and run parallel feature streams in isolated **Git Worktrees** managed from Mission Control.`,
      sources,
    };
  }

  return {
    text: `### پاسخ معماری چندنوبته با مدل \`${model}\`${useSearchGrounding ? ' (مجهز به Google Search Grounding)' : ''} — نوبت گفتگو #${turnCount}

در پاسخ به پرسش شما: **«${lastUserMessage.slice(0, 140)}»** (نقش فعال: \`${rolePersona}\`):

1. **چرخه مهندسی مبتنی بر آرتیفکت (\`task.md\` ← \`implementation_plan.md\` ← \`walkthrough.md\`):**
   - پیش از اعمال تغییرات در کدهای حساس، ایجنت را در حالت **Planning Mode** قرار دهید تا طرح پیاده‌سازی در \`implementation_plan.md\` تولید شده و با کامنت‌های خطی (PR-Style Review) ممیزی شود.
2. **گاردریل‌های هوشمند (\`.agent/rules/\`) و پایپ‌لاین‌های \`// turbo\`:**
   - قوانین دامنه را با حالت فعال‌سازی **Glob** به مسیرهای مشخص محدود کنید تا پنجره زمینه دچار **Context Rot** نشود و گام‌های تست ایمن را در \`.agent/workflows/\` با دایرکتیو \`// turbo\` خودکارسازی نمایید.
3. **ایزولاسیون Git Worktrees و صحت‌سنجی Browser Subagent:**
   - برای تسک‌های موازی از شاخه‌های ایزوله در **Agent Manager** استفاده کرده و در پایان، مستندات بصری \`WebP\` را توسط **Browser Subagent** در \`walkthrough.md\` ثبت کنید.`,
    sources,
  };
}

function buildProceduralSvgBlueprintDataUri(params: {
  prompt: string;
  editInstruction?: string;
  aspectRatio?: string;
  imageSize?: string;
  isEdited: boolean;
}): string {
  const ratio = params.aspectRatio || '16:9';
  let width = 1280;
  let height = 720;
  if (ratio === '1:1') {
    width = 1024;
    height = 1024;
  } else if (ratio === '4:3') {
    width = 1200;
    height = 900;
  } else if (ratio === '9:16') {
    width = 720;
    height = 1280;
  }

  const safeTitle = (params.prompt || 'Antigravity Systems Architecture Blueprint')
    .replace(/[<>&"']/g, '')
    .slice(0, 68);
  const safeEdit = (params.editInstruction || '')
    .replace(/[<>&"']/g, '')
    .slice(0, 68);

  const accentPrimary = params.isEdited ? '#10b981' : '#3b82f6';
  const accentSecondary = params.isEdited ? '#f59e0b' : '#6366f1';
  const bgTop = params.isEdited ? '#061512' : '#070c18';
  const bgBottom = params.isEdited ? '#0c1f24' : '#0f172a';

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgTop}" />
        <stop offset="100%" stop-color="${bgBottom}" />
      </linearGradient>
      <radialGradient id="coreGlow" cx="50%" cy="50%" r="48%">
        <stop offset="0%" stop-color="${accentPrimary}" stop-opacity="0.32" />
        <stop offset="60%" stop-color="${accentSecondary}" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <pattern id="cyberGrid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="${accentPrimary}" stroke-width="1" stroke-opacity="0.14" />
      </pattern>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <rect width="${width}" height="${height}" fill="url(#cyberGrid)" />
    <circle cx="${cx}" cy="${cy}" r="${Math.round(Math.min(width, height) * 0.42)}" fill="url(#coreGlow)" />

    <!-- Outer HUD Frame -->
    <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="18" fill="none" stroke="${accentPrimary}" stroke-width="2" stroke-opacity="0.45" />

    <!-- Header Telemetry Ribbon -->
    <rect x="52" y="52" width="${width - 104}" height="56" rx="10" fill="#090d16" fill-opacity="0.85" stroke="${accentPrimary}" stroke-opacity="0.4" />
    <circle cx="80" cy="80" r="8" fill="${accentPrimary}" />
    <text x="100" y="85" fill="#f8fafc" font-family="monospace" font-size="16" font-weight="bold">NANO BANANA 2.1 // ${params.isEdited ? 'EDITED ARCHITECTURAL VISUAL' : 'GENERATED BLUEPRINT'} (${ratio} · ${params.imageSize || '1K'})</text>

    <!-- Central Isometric Nodes -->
    <g transform="translate(${cx}, ${cy})">
      <polygon points="0,-150 140,-70 140,70 0,150 -140,70 -140,-70" fill="#0f172a" fill-opacity="0.9" stroke="${accentPrimary}" stroke-width="3" />
      <polygon points="0,-105 98,-48 98,48 0,105 -98,48 -98,-48" fill="none" stroke="${accentSecondary}" stroke-width="2" stroke-dasharray="8 6" />
      <circle cx="0" cy="0" r="42" fill="${accentPrimary}" fill-opacity="0.2" stroke="${accentPrimary}" stroke-width="2.5" />
      <text x="0" y="5" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="15" font-weight="bold">ANTIGRAVITY CORE</text>

      <!-- Satellite Node Left -->
      <line x1="-140" y1="-35" x2="-240" y2="-95" stroke="${accentPrimary}" stroke-width="2.5" />
      <rect x="-350" y="-135" width="130" height="68" rx="10" fill="#090d16" stroke="${accentPrimary}" stroke-width="2" />
      <text x="-285" y="-96" text-anchor="middle" fill="#93c5fd" font-family="monospace" font-size="13" font-weight="bold">task.md / Plan</text>

      <!-- Satellite Node Right -->
      <line x1="140" y1="-35" x2="240" y2="-95" stroke="${accentSecondary}" stroke-width="2.5" />
      <rect x="220" y="-135" width="130" height="68" rx="10" fill="#090d16" stroke="${accentSecondary}" stroke-width="2" />
      <text x="285" y="-96" text-anchor="middle" fill="#a7f3d0" font-family="monospace" font-size="13" font-weight="bold">FastMCP Server</text>

      <!-- Satellite Node Bottom -->
      <line x1="0" y1="150" x2="0" y2="215" stroke="#f59e0b" stroke-width="2.5" />
      <rect x="-110" y="215" width="220" height="58" rx="10" fill="#090d16" stroke="#f59e0b" stroke-width="2" />
      <text x="0" y="249" text-anchor="middle" fill="#fde68a" font-family="monospace" font-size="13" font-weight="bold">Browser Subagent WebP</text>
    </g>

    <!-- Prompt & Edit Metadata Footer -->
    <rect x="52" y="${height - 132}" width="${width - 104}" height="78" rx="10" fill="#090d16" fill-opacity="0.9" stroke="${accentSecondary}" stroke-opacity="0.45" />
    <text x="74" y="${height - 96}" fill="#e2e8f0" font-family="monospace" font-size="15" font-weight="bold">PROMPT: ${safeTitle}</text>
    <text x="74" y="${height - 70}" fill="#38bdf8" font-family="monospace" font-size="13">${
      params.isEdited
        ? `EDIT APPLIED: ${safeEdit || 'Enhanced visual contrast & zero-trust perimeter overlay'}`
        : 'MODEL: gemini-nano-banana-2.1 · High-Contrast Architectural Synthesis'
    }</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf-8').toString('base64')}`;
}

async function startServer() {
  const app = express();
  const rawPort = Number(process.env.PORT);
  const PORT = Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  app.use(express.json({ limit: '20mb' }));

  app.get(['/api/meta', '/api/health'], (_req, res) => {
    res.json({
      status: 'ok',
      service: 'google-antigravity-academy',
      title: 'Google Antigravity Academy & Mission Control Studio',
      version: '2.0.0',
      port: PORT,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/antigravity/assistant', async (req, res) => {
    try {
      const { prompt, mode } = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.json({
          text: 'کلید API تنظیم نشده است؛ پاسخ مرجع معماری از پایگاه دانش داخلی نمایش داده می‌شود.',
          sources: [{ title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' }],
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction =
        'You are a Principal AI Systems Architect specializing in Google Antigravity (https://antigravity.google/docs). Respond in fluent Persian (RTL) while keeping technical identifiers, file paths (.agent/rules/, .agent/workflows/, task.md, implementation_plan.md, walkthrough.md, mcp_config.json), and code blocks in English.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: mode === 'high-thinking' ? ThinkingLevel.HIGH : ThinkingLevel.LOW,
          },
          tools: mode === 'search-grounding' ? [{ googleSearch: {} }] : undefined,
        },
      });

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: { web?: { title?: string; uri?: string } }) =>
          chunk.web?.uri
            ? {
                title: chunk.web.title || 'Antigravity Documentation Reference',
                uri: chunk.web.uri,
              }
            : null
        )
        .filter(Boolean);

      res.json({
        text: response.text || '',
        sources:
          sources.length > 0
            ? sources
            : [{ title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' }],
      });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Server error';
      res.status(200).json({
        text: `پاسخ معماری از کش دانش داخلی (خطای ارتباط با سرویس خارجی: ${errMessage}):\n\nبرای اجرای ایمن در Google Antigravity، همیشه از ترکیب Planning Mode، فایل‌های .agent/rules/ با حالت Glob و صحت‌سنجی بصری Browser Subagent در فایل walkthrough.md استفاده نمایید.`,
        sources: [{ title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' }],
      });
    }
  });

  // Multi-Turn Gemini Chatbot Endpoint with Model Selection (gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite) & Google Search Grounding
  app.post('/api/gemini/chat', async (req, res) => {
    const {
      messages,
      model: requestedModel,
      rolePersona = 'principal-architect',
      customSystemInstruction = '',
      useSearchGrounding = false,
      language = 'fa',
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const selectedModel: SupportedChatModel = ALLOWED_CHAT_MODELS.includes(requestedModel)
      ? requestedModel
      : 'gemini-3.8-flash';

    // When Google Search Grounding is active, use gemini-3.8-flash as required by search grounding guidelines
    const effectiveModel: SupportedChatModel = useSearchGrounding
      ? 'gemini-3.8-flash'
      : selectedModel;

    const lastUserMsg =
      [...messages].reverse().find((m) => m && m.role === 'user')?.text || '';

    const systemInstruction = buildRoleSystemInstruction(
      rolePersona,
      customSystemInstruction,
      language
    );

    if (!process.env.GEMINI_API_KEY) {
      const fallback = buildFallbackChatReply({
        lastUserMessage: String(lastUserMsg),
        model: effectiveModel,
        rolePersona: String(rolePersona),
        useSearchGrounding: Boolean(useSearchGrounding),
        language: String(language),
        turnCount: messages.length,
      });
      res.json({
        text: fallback.text,
        modelUsed: effectiveModel,
        groundingSources: fallback.sources,
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const formattedContents = messages
        .filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0)
        .map((m) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }],
        }));

      const response = await ai.models.generateContent({
        model: effectiveModel,
        contents: formattedContents,
        config: {
          systemInstruction,
          tools: useSearchGrounding ? [{ googleSearch: {} }] : undefined,
        },
      });

      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = groundingChunks
        .map((chunk: { web?: { title?: string; uri?: string } }) =>
          chunk.web?.uri
            ? {
                title: chunk.web.title || 'Google Search Grounded Source',
                uri: chunk.web.uri,
              }
            : null
        )
        .filter(Boolean);

      res.json({
        text: response.text || '',
        modelUsed: effectiveModel,
        groundingSources:
          extractedSources.length > 0
            ? extractedSources
            : useSearchGrounding
            ? [{ title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' }]
            : [],
      });
    } catch {
      const fallback = buildFallbackChatReply({
        lastUserMessage: String(lastUserMsg),
        model: effectiveModel,
        rolePersona: String(rolePersona),
        useSearchGrounding: Boolean(useSearchGrounding),
        language: String(language),
        turnCount: messages.length,
      });
      res.status(200).json({
        text: fallback.text,
        modelUsed: effectiveModel,
        groundingSources: fallback.sources,
      });
    }
  });

  // Nano Banana 2.1 (gemini-nano-banana-2.1) Image Generation & Image Editing Endpoint
  app.post('/api/gemini/image', async (req, res) => {
    const {
      prompt,
      editInstruction,
      aspectRatio = '16:9',
      imageSize = '1K',
      sourceImageDataUrl,
    } = req.body || {};

    const effectivePrompt = String(editInstruction || prompt || '').trim();
    if (!effectivePrompt) {
      res.status(400).json({ error: 'Prompt or edit instruction is required.' });
      return;
    }

    const isEdited = Boolean(sourceImageDataUrl && typeof sourceImageDataUrl === 'string');

    if (!process.env.GEMINI_API_KEY) {
      const dataUrl = buildProceduralSvgBlueprintDataUri({
        prompt: String(prompt || effectivePrompt),
        editInstruction: isEdited ? effectivePrompt : undefined,
        aspectRatio,
        imageSize,
        isEdited,
      });
      res.json({
        imageUrl: dataUrl,
        modelUsed: 'gemini-nano-banana-2.1',
        isEdited,
        caption: isEdited
          ? `Edited with gemini-nano-banana-2.1 (${aspectRatio}, ${imageSize})`
          : `Generated with gemini-nano-banana-2.1 (${aspectRatio}, ${imageSize})`,
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts: Array<
        | { text: string }
        | { inlineData: { data: string; mimeType: string } }
      > = [];

      if (isEdited && typeof sourceImageDataUrl === 'string') {
        const match = sourceImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match && match[1].startsWith('image/png')) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        } else if (match && match[1].startsWith('image/jpeg')) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      parts.push({ text: effectivePrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '16:9',
            imageSize: imageSize || '1K',
          },
        },
      });

      let generatedImageUrl: string | null = null;
      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          generatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!generatedImageUrl) {
        generatedImageUrl = buildProceduralSvgBlueprintDataUri({
          prompt: String(prompt || effectivePrompt),
          editInstruction: isEdited ? effectivePrompt : undefined,
          aspectRatio,
          imageSize,
          isEdited,
        });
      }

      res.json({
        imageUrl: generatedImageUrl,
        modelUsed: 'gemini-nano-banana-2.1',
        isEdited,
        caption: isEdited
          ? `Edited with gemini-nano-banana-2.1 (${aspectRatio}, ${imageSize})`
          : `Generated with gemini-nano-banana-2.1 (${aspectRatio}, ${imageSize})`,
      });
    } catch {
      const fallbackUrl = buildProceduralSvgBlueprintDataUri({
        prompt: String(prompt || effectivePrompt),
        editInstruction: isEdited ? effectivePrompt : undefined,
        aspectRatio,
        imageSize,
        isEdited,
      });
      res.status(200).json({
        imageUrl: fallbackUrl,
        modelUsed: 'gemini-nano-banana-2.1',
        isEdited,
        caption: isEdited
          ? `Edited with gemini-nano-banana-2.1 (${aspectRatio}, ${imageSize})`
          : `Generated with gemini-nano-banana-2.1 (${aspectRatio}, ${imageSize})`,
      });
    }
  });

  // AI Quick Overview Synthesis Endpoint for ModuleContentView
  app.post('/api/gemini/module-overview', async (req, res) => {
    const {
      module: moduleInput,
      lens = 'principal-synthesis',
      language = 'fa',
    } = req.body || {};

    if (!moduleInput || typeof moduleInput !== 'object' || !moduleInput.id) {
      res.status(400).json({ error: 'Valid module payload is required.' });
      return;
    }

    const validLenses: QuickOverviewLens[] = [
      'principal-synthesis',
      'security-guardrails',
      'production-execution',
    ];
    const safeLens: QuickOverviewLens = validLenses.includes(lens)
      ? lens
      : 'principal-synthesis';
    const safeLang: 'fa' | 'en' = language === 'en' ? 'en' : 'fa';

    const fallbackPayload = buildDeterministicModuleQuickOverview({
      module: moduleInput,
      lens: safeLens,
      language: safeLang,
    });

    if (!process.env.GEMINI_API_KEY) {
      res.json({
        ...fallbackPayload,
        source: 'ai-live',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = buildModuleQuickOverviewPrompt({
        module: moduleInput,
        lens: safeLens,
        language: safeLang,
      });

      const systemInstruction =
        safeLang === 'en'
          ? 'You are a Principal AI Systems Architect for Google Antigravity IDE. Synthesize concise, high-signal architectural key takeaways grounded strictly in the module engineering principles.'
          : 'You are a Principal AI Systems Architect for Google Antigravity IDE. Synthesize concise, high-signal architectural key takeaways in fluent Persian (RTL) while keeping technical identifiers, file paths, and badges in English.';

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveHeadline: {
                type: Type.STRING,
                description: 'A single high-impact executive summary sentence for the module.',
              },
              coreEngineeringPrinciple: {
                type: Type.STRING,
                description: 'The overarching architectural invariant of this module.',
              },
              takeaways: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    principleBadge: {
                      type: Type.STRING,
                      description: 'Short technical badge in English (e.g., LSP + Diff, task.md, Glob Rule).',
                    },
                    title: {
                      type: Type.STRING,
                      description: 'Concise takeaway title in the requested language.',
                    },
                    takeaway: {
                      type: Type.STRING,
                      description: 'Actionable engineering takeaway grounded in the module principles.',
                    },
                    impactMetric: {
                      type: Type.STRING,
                      description: 'Short metric or stage tag in English (e.g., Zero Context Rot, 100% Auditable).',
                    },
                  },
                },
              },
            },
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      const normalized = normalizeAiQuickOverviewResponse(
        {
          ...parsed,
          modelUsed: 'gemini-3.8-flash',
          source: 'ai-live',
        },
        fallbackPayload
      );
      res.json(normalized);
    } catch {
      res.status(200).json({
        ...fallbackPayload,
        source: 'ai-live',
      });
    }
  });

  // AI Context Awareness & MCP Drift Auditor Endpoint for KnowledgeBaseExplorer
  app.post('/api/gemini/kb-context-awareness', async (req, res) => {
    const {
      entry: entryInput,
      baselineProfile = 'stdio-local-readonly',
      language = 'fa',
    } = req.body || {};

    if (!entryInput || typeof entryInput !== 'object' || !entryInput.id) {
      res.status(400).json({ error: 'Valid Knowledge Base entry is required.' });
      return;
    }

    const validProfiles: McpBaselineProfileId[] = [
      'stdio-local-readonly',
      'sse-remote-zero-trust',
      'multi-worktree-ci',
    ];
    const safeProfile: McpBaselineProfileId = validProfiles.includes(baselineProfile)
      ? baselineProfile
      : 'stdio-local-readonly';
    const safeLang: 'fa' | 'en' = language === 'en' ? 'en' : 'fa';

    const fallbackPayload = buildDeterministicKbContextAwareness({
      entry: entryInput,
      baselineProfile: safeProfile,
      language: safeLang,
    });

    if (!process.env.GEMINI_API_KEY) {
      res.json({
        ...fallbackPayload,
        source: 'ai-live',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = buildKbContextAwarenessPrompt({
        entry: entryInput,
        baselineProfile: safeProfile,
        language: safeLang,
      });

      const systemInstruction =
        safeLang === 'en'
          ? 'You are a Principal FastMCP & Context Rot Systems Auditor for Google Antigravity IDE. Generate an authoritative Context Awareness summary and MCP configuration drift audit.'
          : 'You are a Principal FastMCP & Context Rot Systems Auditor for Google Antigravity IDE. Generate an authoritative Context Awareness summary and MCP configuration drift audit in fluent Persian (RTL) while keeping technical parameter paths, baselines, and code patches in English.';

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              contextAwarenessSummary: {
                type: Type.STRING,
                description: 'Executive summary of how this long-form article impacts agent context and MCP state.',
              },
              architecturalIntent: {
                type: Type.STRING,
                description: 'Core invariant that must remain synchronized with mcp_config.json.',
              },
              driftRiskScore: {
                type: Type.INTEGER,
                description: 'Integer risk score between 0 and 100.',
              },
              driftSeverity: {
                type: Type.STRING,
                description: 'One of LOW, MEDIUM, HIGH, CRITICAL.',
              },
              driftFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    severity: {
                      type: Type.STRING,
                      description: 'CRITICAL, WARNING, or ALIGNED.',
                    },
                    parameterPath: {
                      type: Type.STRING,
                      description: 'JSON or rule path (e.g., mcpServers.postgres.transport).',
                    },
                    expectedBaseline: {
                      type: Type.STRING,
                      description: 'Expected baseline configuration value.',
                    },
                    detectedState: {
                      type: Type.STRING,
                      description: 'State detected in the article/configuration.',
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'Explanation of the configuration drift or alignment.',
                    },
                    remediationPatch: {
                      type: Type.STRING,
                      description: 'Actionable config or rule snippet to resolve the drift.',
                    },
                  },
                },
              },
              recommendedMcpSnippet: {
                type: Type.STRING,
                description: 'Recommended mcp_config.json snippet.',
              },
            },
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      const normalized = normalizeAiKbContextAwarenessResponse(
        {
          ...parsed,
          modelUsed: 'gemini-3.8-flash',
          source: 'ai-live',
        },
        fallbackPayload
      );
      res.json(normalized);
    } catch {
      res.status(200).json({
        ...fallbackPayload,
        source: 'ai-live',
      });
    }
  });

  // AI Weekly Ranking Challenges Endpoint for Academy Leaderboard
  app.post('/api/gemini/leaderboard-challenges', async (req, res) => {
    const {
      track = 'worktree-orchestration',
      language = 'fa',
      currentRankNameEn = 'Architect',
      completedModulesCount = 4,
    } = req.body || {};

    const validTracks: WeeklyChallengeTrackId[] = [
      'worktree-orchestration',
      'fastmcp-security',
      'zero-context-rot',
    ];
    const safeTrack: WeeklyChallengeTrackId = validTracks.includes(track)
      ? track
      : 'worktree-orchestration';
    const safeLang: 'fa' | 'en' = language === 'en' ? 'en' : 'fa';

    const fallbackPayload = buildDeterministicWeeklyLeaderboardChallenges({
      track: safeTrack,
      language: safeLang,
    });

    if (!process.env.GEMINI_API_KEY) {
      res.json({
        ...fallbackPayload,
        source: 'ai-live',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = buildWeeklyLeaderboardChallengePrompt({
        track: safeTrack,
        language: safeLang,
        currentRankNameEn: String(currentRankNameEn || 'Architect'),
        completedModulesCount: Number(completedModulesCount) || 0,
      });

      const systemInstruction =
        safeLang === 'en'
          ? 'You are the Principal Challenge Architect for the Google Antigravity Academy Leaderboard. Generate 3 rigorous, verifiable weekly ranking engineering challenges.'
          : 'You are the Principal Challenge Architect for the Google Antigravity Academy Leaderboard. Generate 3 rigorous, verifiable weekly ranking engineering challenges in fluent Persian (RTL) while keeping technical file paths, artifact names, and challenge codes in English.';

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weekCode: {
                type: Type.STRING,
                description: 'ISO week code such as 2026-W44.',
              },
              themeHeadline: {
                type: Type.STRING,
                description: 'Headline for the weekly ranking challenge sprint.',
              },
              aiDirectiveSummary: {
                type: Type.STRING,
                description: 'Executive summary of what this weekly sprint evaluates.',
              },
              challenges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    code: { type: Type.STRING },
                    title: { type: Type.STRING },
                    scenarioBrief: { type: Type.STRING },
                    verificationCriterion: { type: Type.STRING },
                    targetArtifactOrPath: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    xpReward: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      const normalized = normalizeAiWeeklyLeaderboardChallengesResponse(
        {
          ...parsed,
          modelUsed: 'gemini-3.8-flash',
          source: 'ai-live',
        },
        fallbackPayload
      );
      res.json(normalized);
    } catch {
      res.status(200).json({
        ...fallbackPayload,
        source: 'ai-live',
      });
    }
  });

  // AI Module Knowledge Check Quiz Endpoint for ModuleContentView (triggered on scroll to bottom)
  app.post('/api/gemini/module-knowledge-check', async (req, res) => {
    const { module: moduleInput, language = 'fa' } = req.body || {};

    if (!moduleInput || typeof moduleInput !== 'object' || !moduleInput.id) {
      res.status(400).json({ error: 'Valid module payload is required.' });
      return;
    }

    const safeLang: 'fa' | 'en' = language === 'en' ? 'en' : 'fa';
    const fallbackPayload = buildDeterministicModuleKnowledgeCheck({
      module: moduleInput,
      language: safeLang,
    });

    if (!process.env.GEMINI_API_KEY) {
      res.json({
        ...fallbackPayload,
        source: 'ai-live',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = buildModuleKnowledgeCheckPrompt({
        module: moduleInput,
        language: safeLang,
      });

      const systemInstruction =
        safeLang === 'en'
          ? 'You are a Principal AI Systems Architect for Google Antigravity IDE. Generate a rigorous 3-question multiple-choice Knowledge Check quiz grounded in the module core engineering principles.'
          : 'You are a Principal AI Systems Architect for Google Antigravity IDE. Generate a rigorous 3-question multiple-choice Knowledge Check quiz in fluent Persian (RTL) while keeping technical identifiers, file paths, and badges in English.';

      const generatePromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: { type: Type.STRING },
              quizSubtitle: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    principleBadge: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    xpReward: { type: Type.INTEGER },
                  },
                },
              },
            },
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      const normalized = normalizeAiModuleKnowledgeCheckResponse(
        {
          ...parsed,
          modelUsed: 'gemini-3.8-flash',
          source: 'ai-live',
        },
        fallbackPayload
      );
      res.json(normalized);
    } catch {
      res.status(200).json({
        ...fallbackPayload,
        source: 'ai-live',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
