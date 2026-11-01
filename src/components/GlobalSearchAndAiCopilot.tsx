import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  ExternalLink,
  BookOpen,
  Sparkles,
  FileCode,
  X,
  Bot,
  User as UserIcon,
  Globe,
  Image as ImageIcon,
  Wand2,
  Upload,
  Download,
  Trash2,
  ShieldCheck,
  Cpu,
  Terminal,
  Cloud,
  LogIn,
  LogOut,
  CheckCircle2,
  Gamepad2,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  signInWithGooglePopup,
  signOutArchitect,
  subscribeToAuthChanges,
  syncArchitectProgressToCloud,
  loadArchitectProgressFromCloud,
} from '../lib/firebase';
import {
  ALL_CURRICULUM_MODULES,
} from '../data/curriculumIndex';
import { useLanguage } from '../context/LanguageContext';

export type StudioNavigationTarget =
  | 'achievements'
  | 'simulator'
  | 'guardrails'
  | 'mcp'
  | 'cheatsheets'
  | 'scenarios'
  | 'ai-architect'
  | 'knowledge-base'
  | 'game-3d';

export const GlobalCommandSearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (moduleId: string) => void;
  onNavigateToStudio: (studioId: StudioNavigationTarget) => void;
}> = ({ isOpen, onClose, onNavigateToModule, onNavigateToStudio }) => {
  const { language, isRTL, t } = useLanguage();
  const [query, setQuery] = useState<string>('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedModules = ALL_CURRICULUM_MODULES.filter(
    (m) =>
      !q ||
      m.titleFa.toLowerCase().includes(q) ||
      m.titleEn.toLowerCase().includes(q) ||
      m.summaryFa.toLowerCase().includes(q) ||
      m.subSections.some(
        (s) =>
          s.titleFa.toLowerCase().includes(q) ||
          s.titleEn.toLowerCase().includes(q)
      )
  );

  const studiosList: {
    id: StudioNavigationTarget;
    titleFa: string;
    titleEn: string;
  }[] = [
    {
      id: 'game-3d',
      titleFa: 'میدان نبرد سه‌بعدی Antigravity (Three.js 3D Cyber-Defense Arena)',
      titleEn: '3D Cyber-Defense Game: Context Rot Purge (Three.js WebGL)',
    },
    {
      id: 'ai-architect',
      titleFa: 'چت‌بات چندنوبته Gemini، جستجوی زنده Google و استودیوی تصویر Nano Banana 2.1',
      titleEn: 'Gemini Multi-Turn Chatbot, Search Grounding & Nano Banana 2.1 Image Studio',
    },
    {
      id: 'knowledge-base',
      titleFa: 'کاوشگر پایگاه دانش (.agent/knowledge-base) و مهار Context Rot',
      titleEn: 'Knowledge Base Explorer & Context Rot Bento Grid',
    },
    {
      id: 'achievements',
      titleFa: 'دستاوردها، پیوستگی مطالعه و کارنامه گواهینامه (Achievements & Certification)',
      titleEn: 'Badges, Study Streak Counter & Shareable Progress Report Card',
    },
    {
      id: 'simulator',
      titleFa: 'شبیه‌ساز زنده محیط Antigravity (Mission Control Simulator)',
      titleEn: 'Interactive Artifact Review & Execution Simulator',
    },
    {
      id: 'guardrails',
      titleFa: 'استودیوی طراحی Rule، Workflow و پالیسی ترمینال',
      titleEn: '.agent/rules & /slash-command Automation Studio',
    },
    {
      id: 'mcp',
      titleFa: 'استودیوی بصری ساخت سرور و کانفیگ MCP',
      titleEn: 'mcp_config.json & FastMCP Python Generator',
    },
    {
      id: 'cheatsheets',
      titleFa: 'مرکز چیت‌شیت‌های تعاملی و خروجی PDF موضوعی',
      titleEn: 'Interactive Cheat Sheets & Modular PDF Exporter',
    },
    {
      id: 'scenarios',
      titleFa: 'آزمایشگاه ۸ چالش معماری (Principal Architect Lab)',
      titleEn: '8 Production Architectural Case Studies',
    },
  ];

  const matchedStudios = studiosList.filter(
    (s) => !q || s.titleFa.toLowerCase().includes(q) || s.titleEn.toLowerCase().includes(q)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm pt-16 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Search"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0c121e] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-slate-50/80 dark:bg-[#090d16] border-b border-slate-200/80 dark:border-white/[0.07]">
          <Search className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchModalPlaceholder')}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <kbd
            dir="ltr"
            className="ltr-inline hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-white/10 rounded"
          >
            ESC
          </kbd>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {matchedModules.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-slate-400">
                {t('searchModulesHeader')}
              </div>
              {matchedModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onNavigateToModule(mod.id);
                    onClose();
                  }}
                  className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'en'
                        ? `Module 0${mod.number}: ${mod.titleEn}`
                        : `فصل ۰${mod.number}: ${mod.titleFa}`}
                    </div>
                    <div
                      dir="ltr"
                      className="text-[11px] font-mono text-slate-500"
                    >
                      {language === 'en' ? `${mod.readingTime} · ${mod.difficulty}` : mod.titleEn}
                    </div>
                  </div>
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {matchedStudios.length > 0 && (
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-bold text-slate-400">
                {t('searchStudiosHeader')}
              </div>
              {matchedStudios.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    onNavigateToStudio(st.id);
                    onClose();
                  }}
                  className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors cursor-pointer`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'en' ? st.titleEn : st.titleFa}
                    </div>
                    <div
                      dir="ltr"
                      className="text-[11px] font-mono text-blue-500"
                    >
                      {language === 'en' ? `Interactive Studio · ${st.id}` : st.titleEn}
                    </div>
                  </div>
                  {st.id === 'game-3d' ? (
                    <Gamepad2 className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <FileCode className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export type GeminiModelTier =
  | 'gemini-4-argon'
  | 'gemini-3.8-flash'
  | 'gemini-3.1-flash-lite';

export type ArchitectRolePersona =
  | 'principal-architect'
  | 'security-auditor'
  | 'fastmcp-engineer'
  | 'custom';

export interface ChatTurnMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  personaUsed?: string;
  groundingSources?: { title: string; uri: string }[];
}

export interface GeneratedVisualItem {
  id: string;
  prompt: string;
  editInstruction?: string;
  imageUrl: string;
  aspectRatio: '16:9' | '1:1' | '4:3' | '9:16';
  imageSize: '1K' | '2K';
  isEdited: boolean;
  createdAt: string;
}

const INITIAL_VISUAL_BLUEPRINT_SVG = `data:image/svg+xml;base64,${btoa(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#070c18" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#3b82f6" stroke-width="1" stroke-opacity="0.15" />
      </pattern>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)" />
    <rect width="1280" height="720" fill="url(#grid)" />
    <rect x="40" y="40" width="1200" height="640" rx="18" fill="none" stroke="#3b82f6" stroke-width="2" stroke-opacity="0.45" />
    <text x="80" y="95" fill="#93c5fd" font-family="monospace" font-size="18" font-weight="bold">NANO BANANA 2.1 - ANTIGRAVITY MULTI-AGENT WORKTREE TOPOLOGY (16:9 &#183; 1K)</text>
    <g transform="translate(640, 360)">
      <polygon points="0,-130 130,-65 130,65 0,130 -130,65 -130,-65" fill="#0f172a" stroke="#3b82f6" stroke-width="3" />
      <circle cx="0" cy="0" r="40" fill="#3b82f6" fill-opacity="0.2" stroke="#60a5fa" stroke-width="2" />
      <text x="0" y="5" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="15" font-weight="bold">AGENT MANAGER</text>
      <line x1="-130" y1="-30" x2="-260" y2="-90" stroke="#3b82f6" stroke-width="2.5" />
      <rect x="-410" y="-130" width="150" height="68" rx="10" fill="#090d16" stroke="#3b82f6" stroke-width="2" />
      <text x="-335" y="-92" text-anchor="middle" fill="#93c5fd" font-family="monospace" font-size="13" font-weight="bold">Worktree A (API)</text>
      <line x1="130" y1="-30" x2="260" y2="-90" stroke="#10b981" stroke-width="2.5" />
      <rect x="260" y="-130" width="150" height="68" rx="10" fill="#090d16" stroke="#10b981" stroke-width="2" />
      <text x="335" y="-92" text-anchor="middle" fill="#6ee7b7" font-family="monospace" font-size="13" font-weight="bold">Worktree B (UI)</text>
    </g>
    <text x="80" y="640" fill="#cbd5e1" font-family="monospace" font-size="14">MODEL: gemini-nano-banana-2.1 &#183; Ready for Prompt Generation or Inline Image Editing</text>
  </svg>`
)}`;

export const GroundedAiArchitectCopilot: React.FC<{
  onLaunch3DGame?: () => void;
}> = ({ onLaunch3DGame }) => {
  const { language, isRTL } = useLanguage();
  const [activeStudioTab, setActiveStudioTab] = useState<'chat' | 'image-studio'>('chat');

  // Multi-turn Chatbot State
  const [selectedModel, setSelectedModel] = useState<GeminiModelTier>('gemini-3.8-flash');
  const [rolePersona, setRolePersona] = useState<ArchitectRolePersona>('principal-architect');
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>('');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatTurnMessage[]>(() => [
    {
      id: 'turn-init-1',
      role: 'user',
      text:
        language === 'en'
          ? 'How do we execute a zero-downtime Alembic migration in Google Antigravity using .agent/workflows/safe-migration.md and Browser Subagent without PostgreSQL table locks?'
          : 'چگونه در Google Antigravity با استفاده از .agent/workflows/safe-migration.md و Browser Subagent یک مایگریشن Alembic بدون قفل شدن جدول در PostgreSQL اجرا و صحت‌سنجی کنیم؟',
      timestamp: '10:14:00',
    },
    {
      id: 'turn-init-2',
      role: 'model',
      text:
        language === 'en'
          ? `### Recommended Safe Migration Architecture via \`/safe-migration\` & \`Browser Subagent\`

1. **Guardrail Invariant in \`.agent/rules/01-fastapi-sqlalchemy-async.md\`:**
   - Enforce \`postgresql_concurrently=True\` for building indexes on high-traffic tables combined with \`op.get_bind().execution_options(isolation_level="AUTOCOMMIT")\`.
2. **Execute Pipeline in \`.agent/workflows/safe-migration.md\`:**
   - Step 1 uses the \`// turbo\` directive to run \`poetry run alembic heads\`, ensuring no parallel branched heads exist.
   - Step 4 executes a full reversibility cycle (\`upgrade head -> downgrade -1 -> upgrade head\`) against the ephemeral test database.
3. **Autonomous End-to-End Proof via \`Browser Subagent\`:**
   - After applying the revision, the browser subagent navigates to the financial reporting dashboard, monitors the network stream for zero 422 or 500 errors, and records a visual WebP proof artifact in \`walkthrough.md\`.`
          : `### معماری پیشنهادی اجرای ایمن مایگریشن با \`/safe-migration\` و \`Browser Subagent\`

1. **تعریف گاردریل در \`.agent/rules/01-fastapi-sqlalchemy-async.md\`:**
   - الزام به استفاده از \`postgresql_concurrently=True\` برای ساخت ایندکس‌ها در جداول پرترافیک به همراه \`op.get_bind().execution_options(isolation_level="AUTOCOMMIT")\`.
2. **اجرای پایپ‌لاین \`/safe-migration\` در \`.agent/workflows/safe-migration.md\`:**
   - گام اول با دایرکتیو \`// turbo\` دستور \`poetry run alembic heads\` را بررسی می‌کند تا از نبود دو شاخه موازی (Branched Heads) اطمینان حاصل شود.
   - گام چهارم چرخه برگشت‌پذیری کامل (\`upgrade head -> downgrade -1 -> upgrade head\`) را روی دیتابیس تست اجرا می‌نماید.
3. **صحت‌سنجی نهایی با \`Browser Subagent\`:**
   - پس از اعمال مایگریشن، ساب‌ایجنت مرورگر داشبورد گزارش‌گیری را باز کرده، استریم شبکه را برای عدم بروز خطای \`422\` یا \`500\` شنود می‌کند و ویدیوی \`WebP\` را در \`walkthrough.md\` ثبت می‌نماید.`,
      timestamp: '10:14:04',
      modelUsed: 'gemini-3.8-flash',
      personaUsed: 'principal-architect',
      groundingSources: [
        {
          title: 'Google Antigravity Official Documentation — Artifacts & Workflows',
          uri: 'https://antigravity.google/docs',
        },
      ],
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Nano Banana 2.1 Image Studio State
  const [imagePrompt, setImagePrompt] = useState<string>(
    'Isometric cybernetic blueprint of Google Antigravity Agent Manager orchestrating 3 Git Worktrees with FastMCP security gates'
  );
  const [editInstruction, setEditInstruction] = useState<string>(
    'Add an emerald Zero-Trust Firewall perimeter and Browser Subagent telemetry overlay'
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '9:16'>('16:9');
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [visualGallery, setVisualGallery] = useState<GeneratedVisualItem[]>([
    {
      id: 'vis-seed-1',
      prompt:
        'Isometric cybernetic blueprint of Google Antigravity Agent Manager orchestrating 3 Git Worktrees',
      imageUrl: INITIAL_VISUAL_BLUEPRINT_SVG,
      aspectRatio: '16:9',
      imageSize: '1K',
      isEdited: false,
      createdAt: '10:10:00',
    },
  ]);
  const [activeVisualId, setActiveVisualId] = useState<string>('vis-seed-1');

  // Firebase Auth & Cloud Firestore Telemetry State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string>('');
  const [cloudSyncBusy, setCloudSyncBusy] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeToAuthChanges((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  const activeVisual =
    visualGallery.find((v) => v.id === activeVisualId) || visualGallery[0];

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const nowTime = new Date().toTimeString().slice(0, 8);
    const userTurn: ChatTurnMessage = {
      id: `turn-u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: nowTime,
    };

    const updatedHistory = [...messages, userTurn];
    setMessages(updatedHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, text: m.text })),
          model: selectedModel,
          rolePersona,
          customSystemInstruction,
          useSearchGrounding,
          language,
        }),
      });
      const data = await response.json();
      const replyTurn: ChatTurnMessage = {
        id: `turn-m-${Date.now()}`,
        role: 'model',
        text:
          data.text ||
          (language === 'en'
            ? 'Synthesized response from Antigravity Architecture Engine.'
            : 'پاسخ سنتزشده از موتور معماری Antigravity.'),
        timestamp: new Date().toTimeString().slice(0, 8),
        modelUsed: data.modelUsed || (useSearchGrounding ? 'gemini-3.8-flash' : selectedModel),
        personaUsed: rolePersona,
        groundingSources: Array.isArray(data.groundingSources)
          ? data.groundingSources
          : [],
      };
      setMessages((prev) => [...prev, replyTurn]);
    } catch {
      const fallbackTurn: ChatTurnMessage = {
        id: `turn-m-${Date.now()}`,
        role: 'model',
        text:
          language === 'en'
            ? `### [${selectedModel}] Architectural Guidance\nEnforce \`implementation_plan.md\` review gates and isolate parallel agents in Git Worktrees.`
            : `### راهنمای معماری [${selectedModel}]\nگیت‌های بازبینی \`implementation_plan.md\` را فعال کرده و ایجنت‌های موازی را در Git Worktrees ایزوله نمایید.`,
        timestamp: new Date().toTimeString().slice(0, 8),
        modelUsed: selectedModel,
        personaUsed: rolePersona,
        groundingSources: [
          { title: 'Google Antigravity Docs', uri: 'https://antigravity.google/docs' },
        ],
      };
      setMessages((prev) => [...prev, fallbackTurn]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }
  };

  const handleGenerateOrEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageLoading) return;
    const promptToSend = isEditMode ? editInstruction.trim() : imagePrompt.trim();
    if (!promptToSend) return;

    setImageLoading(true);
    try {
      const response = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          editInstruction: isEditMode ? editInstruction : undefined,
          aspectRatio,
          imageSize,
          sourceImageDataUrl: isEditMode && activeVisual ? activeVisual.imageUrl : undefined,
        }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        const newItem: GeneratedVisualItem = {
          id: `vis-${Date.now()}`,
          prompt: imagePrompt,
          editInstruction: isEditMode ? editInstruction : undefined,
          imageUrl: data.imageUrl,
          aspectRatio,
          imageSize,
          isEdited: Boolean(isEditMode),
          createdAt: new Date().toTimeString().slice(0, 8),
        };
        setVisualGallery((prev) => [newItem, ...prev]);
        setActiveVisualId(newItem.id);
      }
    } catch {
      // Retain existing gallery if network error
    } finally {
      setImageLoading(false);
    }
  };

  const handleUploadReferenceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const uploadedItem: GeneratedVisualItem = {
          id: `vis-upload-${Date.now()}`,
          prompt: file.name,
          imageUrl: reader.result,
          aspectRatio: '16:9',
          imageSize: '1K',
          isEdited: false,
          createdAt: new Date().toTimeString().slice(0, 8),
        };
        setVisualGallery((prev) => [uploadedItem, ...prev]);
        setActiveVisualId(uploadedItem.id);
        setIsEditMode(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleSignIn = async () => {
    setCloudSyncBusy(true);
    setCloudSyncStatus('');
    try {
      const user = await signInWithGooglePopup();
      const cloudData = await loadArchitectProgressFromCloud(user.uid);
      if (cloudData) {
        setCloudSyncStatus(
          language === 'en'
            ? `Synced profile from Firestore (${cloudData.totalCombinedXp} XP)`
            : `پروفایل از Firestore بازیابی شد (${cloudData.totalCombinedXp} XP)`
        );
      } else {
        await syncArchitectProgressToCloud(user.uid, {
          architectName: user.displayName || 'Senior AI Systems Architect',
          roleTitle: 'Principal Agentic Engineer',
          organization: 'Google Antigravity Studio',
          completedModules: ['module-1', 'module-2'],
          completedScenarioIds: ['scenario-zero-downtime-alembic'],
          dailyTargetMinutes: 45,
          totalMinutesStudied: 120,
          totalCombinedXp: 1450,
          currentLevel: 3,
        });
        setCloudSyncStatus(
          language === 'en'
            ? 'Initialized cloud ArchitectProgress in Firestore!'
            : 'سند ArchitectProgress در Firestore ایجاد و همگام‌سازی شد!'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Auth popup closed';
      setCloudSyncStatus(
        language === 'en'
          ? `Auth status: ${msg.slice(0, 60)}`
          : `وضعیت احراز هویت: ${msg.slice(0, 60)}`
      );
    } finally {
      setCloudSyncBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12" data-testid="ai-architect-studio-root">
      {/* Top Banner: Firebase Auth & Cloud Firestore Telemetry + 3D Game Quick Launch */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {language === 'en'
                  ? 'Firebase Auth & Cloud Firestore Telemetry'
                  : 'احراز هویت Firebase و پایگاه داده ابری Firestore'}
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span
                dir="ltr"
                className="ltr-inline text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold"
              >
                /users/&#123;uid&#125; · Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {currentUser
                ? language === 'en'
                  ? `Signed in as ${currentUser.displayName || currentUser.email}`
                  : `متصل به حساب ${currentUser.displayName || currentUser.email}`
                : language === 'en'
                ? 'Sign in with Google to persist Academy XP, Daily Study Goals, and 3D Arena scores in Firestore.'
                : 'برای ذخیره ابری XP، اهداف مطالعه روزانه و امتیاز میدان نبرد سه‌بعدی با حساب گوگل وارد شوید.'}
            </p>
            {cloudSyncStatus && (
              <div className="text-[11px] font-mono text-emerald-500 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{cloudSyncStatus}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onLaunch3DGame && (
            <button
              type="button"
              onClick={onLaunch3DGame}
              data-testid="ai-studio-launch-3d-game-btn"
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>
                {language === 'en'
                  ? 'Launch 3D Cyber Arena'
                  : 'ورود به بازی سه‌بعدی (Three.js)'}
              </span>
            </button>
          )}

          {currentUser ? (
            <button
              type="button"
              onClick={() => void signOutArchitect()}
              data-testid="firebase-signout-btn"
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>{language === 'en' ? 'Sign Out' : 'خروج از حساب'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={cloudSyncBusy}
              data-testid="firebase-google-signin-btn"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>
                {language === 'en' ? 'Sign in with Google' : 'ورود با حساب Google'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Main AI Architect & Nano Banana 2.1 Visual Studio Card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0c121e] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/[0.06] pb-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? 'Studio 07 · Gemini Multi-Turn · Search Grounding · Nano Banana 2.1'
                  : 'استودیو ۰۷ · چت‌بات Gemini · جستجوی زنده · استودیوی تصویر Nano Banana 2.1'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {language === 'en'
                ? 'AI Systems Architect & Visual Blueprint Studio'
                : 'میز کار هوش مصنوعی معمار سیستم و تولید/ویرایش دیاگرام'}
            </h1>
          </div>

          {/* Studio Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#090d16] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.07] shrink-0">
            <button
              type="button"
              onClick={() => setActiveStudioTab('chat')}
              data-testid="tab-gemini-chat"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeStudioTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>
                {language === 'en' ? 'Multi-Turn Gemini Chat' : 'چت‌بات چندنوبته Gemini'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStudioTab('image-studio')}
              data-testid="tab-nano-banana-image"
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeStudioTab === 'image-studio'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? 'Create & Edit Images (Nano Banana 2.1)'
                  : 'ساخت و ویرایش تصویر (Nano Banana 2.1)'}
              </span>
            </button>
          </div>
        </div>

        {activeStudioTab === 'chat' ? (
          <div className="space-y-5">
            {/* Control Grid: Model Tier Selector + Role Persona Selector + Search Grounding Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800">
              {/* 1. Gemini Model Tier Selector */}
              <div className="space-y-1.5">
                <label
                  htmlFor="gemini-model-select"
                  className="block text-[11px] font-bold text-slate-500 dark:text-slate-400"
                >
                  {language === 'en'
                    ? '1. Select Gemini Model Tier:'
                    : '۱. انتخاب مدل هوش مصنوعی (Model Tier):'}
                </label>
                <select
                  id="gemini-model-select"
                  data-testid="gemini-model-selector"
                  dir="ltr"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as GeminiModelTier)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
                >
                  <option value="gemini-3.8-flash">
                    gemini-3.8-flash (General & Search Grounding)
                  </option>
                  <option value="gemini-4-argon">
                    gemini-4-argon (Complex Systems Architecture)
                  </option>
                  <option value="gemini-3.1-flash-lite">
                    gemini-3.1-flash-lite (Fast Low-Latency Triage)
                  </option>
                </select>
              </div>

              {/* 2. System Instruction Role Persona */}
              <div className="space-y-1.5">
                <label
                  htmlFor="gemini-persona-select"
                  className="block text-[11px] font-bold text-slate-500 dark:text-slate-400"
                >
                  {language === 'en'
                    ? '2. System Role Instruction (Persona):'
                    : '۲. نقش سیستمی چت‌بات (System Instruction):'}
                </label>
                <select
                  id="gemini-persona-select"
                  data-testid="gemini-persona-selector"
                  value={rolePersona}
                  onChange={(e) => setRolePersona(e.target.value as ArchitectRolePersona)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="principal-architect">
                    {language === 'en'
                      ? 'Principal Antigravity Architect'
                      : 'معمار ارشد سیستم‌های Antigravity'}
                  </option>
                  <option value="security-auditor">
                    {language === 'en'
                      ? 'Zero-Trust Guardrail & Terminal Auditor'
                      : 'ممیز امنیتی Zero-Trust و پالیسی ترمینال'}
                  </option>
                  <option value="fastmcp-engineer">
                    {language === 'en'
                      ? 'FastMCP & Browser Subagent Engineer'
                      : 'مهندس پروتکل FastMCP و Browser Subagent'}
                  </option>
                  <option value="custom">
                    {language === 'en'
                      ? 'Custom System Instruction...'
                      : 'دستورالعمل سیستمی سفارشی...'}
                  </option>
                </select>
              </div>

              {/* 3. Google Search Grounding Toggle */}
              <div className="space-y-1.5 flex flex-col justify-between">
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {language === 'en'
                    ? '3. Live Web Grounding (googleSearch):'
                    : '۳. جستجوی زنده وب (Google Search Grounding):'}
                </span>
                <button
                  type="button"
                  onClick={() => setUseSearchGrounding((prev) => !prev)}
                  data-testid="google-search-grounding-toggle"
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    useSearchGrounding
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span dir="ltr">googleSearch Tool</span>
                  </span>
                  <span dir="ltr" className="px-1.5 py-0.5 rounded bg-black/20 text-[10px]">
                    {useSearchGrounding ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {rolePersona === 'custom' && (
              <div>
                <input
                  type="text"
                  value={customSystemInstruction}
                  onChange={(e) => setCustomSystemInstruction(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Enter custom system instruction for the Gemini assistant...'
                      : 'دستورالعمل سیستمی دلخواه (System Instruction) را برای چت‌بات بنویسید...'
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-blue-500/40 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Quick Starter Prompts */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    labelFa: 'مقایسه Planning Mode و Fast Mode',
                    labelEn: 'Compare Planning vs. Fast Mode',
                    promptFa:
                      'تفاوت دقیق Planning Mode و Fast Mode در Google Antigravity و زمان استفاده از implementation_plan.md چیست؟',
                    promptEn:
                      'What is the exact architectural difference between Planning Mode and Fast Mode in Google Antigravity?',
                  },
                  {
                    labelFa: 'طراحی سرور FastMCP امن',
                    labelEn: 'Design Read-Only FastMCP Server',
                    promptFa:
                      'چگونه یک سرور پایتون FastMCP با دکوراتور @mcp.tool() و تراکنش Read-Only برای اتصال به PostgreSQL بنویسیم؟',
                    promptEn:
                      'How do we write a read-only Python FastMCP server with @mcp.tool() for PostgreSQL inspection?',
                  },
                  {
                    labelFa: 'جلوگیری از Context Rot با قوانین Glob',
                    labelEn: 'Prevent Context Rot with Glob Rules',
                    promptFa:
                      'چگونه با استفاده از حالت فعال‌سازی Glob در .agent/rules/ از پدیده Context Rot جلوگیری کنیم؟',
                    promptEn:
                      'How do we prevent Context Rot using Glob activation in .agent/rules/?',
                  },
                ].map((qItem, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setChatInput(language === 'en' ? qItem.promptEn : qItem.promptFa)
                    }
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 hover:border-blue-500/50 text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {language === 'en' ? qItem.labelEn : qItem.labelFa}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMessages(messages.slice(0, 2))}
                data-testid="clear-chat-history-btn"
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{language === 'en' ? 'Reset Thread' : 'پاک‌سازی گفتگو'}</span>
              </button>
            </div>

            {/* Scrollable Multi-Turn Conversation Thread */}
            <div
              data-testid="gemini-chat-thread"
              className="max-h-[440px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/90 p-4 space-y-4"
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    data-testid={`chat-message-${msg.role}`}
                    className={`flex flex-col ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-3xl w-full rounded-xl p-4 border ${
                        isUser
                          ? 'border-blue-500/40 bg-blue-600/10 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isUser ? (
                            <>
                              <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                              <span>
                                {language === 'en' ? 'Systems Engineer (You)' : 'مهندس سیستم (شما)'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5 text-emerald-500" />
                              <span>
                                {language === 'en'
                                  ? 'Gemini Antigravity Architect'
                                  : 'معمار هوش مصنوعی Gemini'}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 tabular-nums" dir="ltr">
                          {msg.modelUsed && (
                            <>
                              <span className="text-blue-500 font-bold">
                                {msg.modelUsed}
                              </span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm leading-7 whitespace-pre-wrap">
                        {msg.text}
                      </div>

                      {!isUser &&
                        msg.groundingSources &&
                        msg.groundingSources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-emerald-500" />
                              <span>
                                {language === 'en'
                                  ? 'Google Search Grounded Sources:'
                                  : 'منابع استخراج‌شده از Google Search Grounding:'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.groundingSources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  dir="ltr"
                                  className="ltr-inline inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 hover:underline text-[11px] font-mono"
                                >
                                  <span>{src.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                data-testid="gemini-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Ask a follow-up architectural question in this multi-turn thread...'
                    : 'پیام بعدی خود را در این گفتگوی چندنوبته بنویسید...'
                }
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={chatLoading}
                data-testid="gemini-chat-send-btn"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>
                  {chatLoading
                    ? language === 'en'
                      ? 'Synthesizing...'
                      : 'در حال پردازش...'
                    : language === 'en'
                    ? 'Send Message'
                    : 'ارسال پیام'}
                </span>
              </button>
            </form>
          </div>
        ) : (
          /* Nano Banana 2.1 Image Generation & Editing Studio */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-testid="nano-banana-studio-panel">
            {/* Left Controls Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  data-testid="create-image-mode-btn"
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    !isEditMode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {language === 'en' ? 'Create New Image' : 'ساخت تصویر جدید'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  data-testid="edit-image-mode-btn"
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    isEditMode
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'en' ? 'Edit Current Image' : 'ویرایش تصویر فعلی'}
                  </span>
                </button>
              </div>

              <form onSubmit={handleGenerateOrEditImage} className="space-y-4">
                {!isEditMode ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'en'
                        ? 'Image Generation Prompt (gemini-nano-banana-2.1):'
                        : 'پرامپت تولید تصویر معماری (gemini-nano-banana-2.1):'}
                    </label>
                    <textarea
                      rows={3}
                      data-testid="nano-banana-prompt-input"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {language === 'en'
                          ? 'Image Edit Instructions (Applied to Selected Image):'
                          : 'دستور ویرایش تصویر (اعمال روی تصویر انتخاب‌شده):'}
                      </label>
                      <textarea
                        rows={3}
                        data-testid="nano-banana-edit-input"
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        className="w-full p-3 rounded-xl border border-emerald-500/50 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-400 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {language === 'en'
                          ? 'Or Upload Reference Image to Edit'
                          : 'یا بارگذاری تصویر از سیستم برای ویرایش'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadReferenceImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Aspect Ratio
                    </label>
                    <select
                      dir="ltr"
                      value={aspectRatio}
                      onChange={(e) =>
                        setAspectRatio(e.target.value as '16:9' | '1:1' | '4:3' | '9:16')
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                    >
                      <option value="16:9">16:9 (Widescreen)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="4:3">4:3 (Blueprint)</option>
                      <option value="9:16">9:16 (Vertical)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Resolution Size
                    </label>
                    <select
                      dir="ltr"
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value as '1K' | '2K')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                    >
                      <option value="1K">1K Standard</option>
                      <option value="2K">2K High-DPI</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={imageLoading}
                  data-testid="generate-image-btn"
                  className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer ${
                    isEditMode
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {imageLoading
                      ? language === 'en'
                        ? 'Rendering with Nano Banana 2.1...'
                        : 'در حال رندر با Nano Banana 2.1...'
                      : isEditMode
                      ? language === 'en'
                        ? 'Apply Edit with Nano Banana 2.1'
                        : 'اعمال ویرایش با Nano Banana 2.1'
                      : language === 'en'
                      ? 'Generate Image with Nano Banana 2.1'
                      : 'تولید تصویر با Nano Banana 2.1'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right Preview & Gallery Column */}
            <div className="lg:col-span-7 space-y-4">
              {activeVisual && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono" dir="ltr">
                      <span
                        className={`font-bold ${
                          activeVisual.isEdited ? 'text-emerald-400' : 'text-blue-400'
                        }`}
                      >
                        {activeVisual.isEdited
                          ? 'EDITED · gemini-nano-banana-2.1'
                          : 'GENERATED · gemini-nano-banana-2.1'}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        {activeVisual.aspectRatio} · {activeVisual.imageSize}
                      </span>
                    </div>

                    <a
                      href={activeVisual.imageUrl}
                      download={`antigravity-${activeVisual.id}.svg`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>{language === 'en' ? 'Download' : 'دانلود تصویر'}</span>
                    </a>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center max-h-[340px]">
                    <img
                      src={activeVisual.imageUrl}
                      alt={activeVisual.prompt}
                      data-testid="nano-banana-active-image"
                      className="w-full h-auto max-h-[340px] object-contain"
                    />
                  </div>

                  <div className="text-xs text-slate-300 font-mono" dir="ltr">
                    <div>Prompt: {activeVisual.prompt}</div>
                    {activeVisual.editInstruction && (
                      <div className="text-emerald-400 mt-0.5">
                        Edit Applied: {activeVisual.editInstruction}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thumbnail History Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {visualGallery.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveVisualId(item.id)}
                    className={`shrink-0 w-28 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      item.id === activeVisualId
                        ? 'border-blue-500 scale-105'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-16 object-cover bg-slate-950"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
