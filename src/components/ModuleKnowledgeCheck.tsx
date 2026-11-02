import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatLocalizedNumber, renderBidiText } from '../utils/bidiText';
import {
  buildDeterministicModuleKnowledgeCheck,
  evaluateModuleKnowledgeCheckSubmission,
  KNOWLEDGE_CHECK_SCORES_STORAGE_KEY,
  KnowledgeCheckModuleScoreRecord,
  ModuleKnowledgeCheckEvaluationResult,
  ModuleKnowledgeCheckQuizPayload,
  ModuleQuickOverviewInput,
  normalizeAiModuleKnowledgeCheckResponse,
  recordModuleKnowledgeCheckScore,
} from '../utils/generators';

export interface ModuleKnowledgeCheckProps {
  moduleInput: ModuleQuickOverviewInput;
  isModuleCompleted: boolean;
  onToggleModuleComplete: (moduleId: string) => void;
}

export const ModuleKnowledgeCheck: React.FC<ModuleKnowledgeCheckProps> = ({
  moduleInput,
  isModuleCompleted,
  onToggleModuleComplete,
}) => {
  const { language, isRTL } = useLanguage();
  const safeLang: 'fa' | 'en' = language === 'en' ? 'en' : 'fa';

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const autoTriggeredModulesRef = useRef<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [quizCache, setQuizCache] = useState<
    Record<string, ModuleKnowledgeCheckQuizPayload>
  >({});

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    {}
  );
  const selectedAnswersRef = useRef<Record<string, number>>({});
  const [evaluationResult, setEvaluationResult] =
    useState<ModuleKnowledgeCheckEvaluationResult | null>(null);

  const cacheKey = `${moduleInput.id}:${safeLang}`;

  const fallbackQuiz = useMemo(
    () =>
      buildDeterministicModuleKnowledgeCheck({
        module: moduleInput,
        language: safeLang,
      }),
    [moduleInput, safeLang]
  );

  const activeQuiz = quizCache[cacheKey] || fallbackQuiz;

  // Reset answer selection when module changes
  useEffect(() => {
    selectedAnswersRef.current = {};
    setSelectedAnswers({});
    setEvaluationResult(null);
    setIsModalOpen(false);
  }, [moduleInput.id]);

  const handleSynthesizeAiQuiz = useCallback(async () => {
    setIsGenerating(true);
    selectedAnswersRef.current = {};
    setSelectedAnswers({});
    setEvaluationResult(null);

    const targetKey = `${moduleInput.id}:${safeLang}`;
    const fb = buildDeterministicModuleKnowledgeCheck({
      module: moduleInput,
      language: safeLang,
    });

    try {
      const response = await fetch('/api/gemini/module-knowledge-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: moduleInput,
          language: safeLang,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const normalized = normalizeAiModuleKnowledgeCheckResponse(data, fb);
      setQuizCache((prev) => ({
        ...prev,
        [targetKey]: {
          ...normalized,
          source: 'ai-live',
        },
      }));
    } catch {
      setQuizCache((prev) => ({
        ...prev,
        [targetKey]: {
          ...fb,
          source: 'ai-live',
        },
      }));
    } finally {
      setIsGenerating(false);
    }
  }, [moduleInput, safeLang]);

  // Trigger modal automatically when user scrolls to the bottom of the module content
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const triggerOnceForModule = () => {
      if (autoTriggeredModulesRef.current.has(moduleInput.id)) {
        return;
      }
      // Only auto-trigger if the user has actually scrolled down (scrollTop > 120) or sentinel enters viewport after scroll
      const mainContainer = el.closest('main');
      const currentScrollTop = mainContainer
        ? mainContainer.scrollTop
        : window.scrollY;

      if (currentScrollTop > 120) {
        autoTriggeredModulesRef.current.add(moduleInput.id);
        setIsModalOpen(true);
        void handleSynthesizeAiQuiz();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            triggerOnceForModule();
          }
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    const scrollTarget: HTMLElement | Window =
      (el.closest('main') as HTMLElement | null) || window;

    const handleScroll = () => {
      if (autoTriggeredModulesRef.current.has(moduleInput.id)) return;
      const rect = el.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      if (rect.top <= viewportHeight + 40) {
        triggerOnceForModule();
      }
    };

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [moduleInput.id, handleSynthesizeAiQuiz]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    const next = {
      ...selectedAnswersRef.current,
      [questionId]: optionIndex,
    };
    selectedAnswersRef.current = next;
    setSelectedAnswers(next);
  };

  const handleSubmitQuiz = () => {
    const evalRes = evaluateModuleKnowledgeCheckSubmission({
      quiz: activeQuiz,
      selectedAnswers: selectedAnswersRef.current,
    });
    setEvaluationResult(evalRes);
    try {
      const rawExisting = localStorage.getItem(
        KNOWLEDGE_CHECK_SCORES_STORAGE_KEY
      );
      const parsedExisting: Record<string, KnowledgeCheckModuleScoreRecord> =
        rawExisting ? JSON.parse(rawExisting) : {};
      const updatedScores = recordModuleKnowledgeCheckScore({
        existingScores: parsedExisting,
        moduleId: moduleInput.id,
        moduleNumber: moduleInput.number,
        evaluation: evalRes,
      });
      localStorage.setItem(
        KNOWLEDGE_CHECK_SCORES_STORAGE_KEY,
        JSON.stringify(updatedScores)
      );
      window.dispatchEvent(new Event('ag-knowledge-check-updated'));
    } catch {
      // Ignore storage errors in restricted environments
    }
  };

  const handleOpenModalManually = () => {
    autoTriggeredModulesRef.current.add(moduleInput.id);
    setIsModalOpen(true);
    if (!quizCache[cacheKey]) {
      void handleSynthesizeAiQuiz();
    }
  };

  return (
    <>
      {/* Bottom-of-Content Sentinel & Knowledge Check Trigger Banner */}
      <div
        ref={sentinelRef}
        data-testid="module-knowledge-check-section"
        className="rounded-2xl border border-indigo-500/30 dark:border-indigo-400/25 bg-gradient-to-br from-indigo-500/[0.07] via-white to-blue-500/[0.06] dark:from-[#0e1528] dark:via-[#0b1220] dark:to-[#090f1c] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'en' ? (
                  'Knowledge Check · AI Core Principles Quiz'
                ) : (
                  <>
                    سنجش دانش (<span dir="ltr" className="ltr-inline">Knowledge Check</span>) · آزمون هوشمند اصول مهندسی
                  </>
                )}
              </h3>
              <span
                dir="ltr"
                className="ltr-inline px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-mono text-[11px] font-bold tabular-nums"
              >
                +{activeQuiz.totalPossibleXp} XP
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {language === 'en'
                ? 'Triggered automatically when you scroll to the bottom of the chapter. Test your grasp of this module’s core engineering principles.'
                : 'با اسکرول به انتهای محتوای فصل، این آزمون کوتاه هوش مصنوعی به‌صورت خودکار فعال می‌شود تا تسلط شما بر اصول مهندسی فصل سنجیده شود.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {evaluationResult && (
            <span
              dir="ltr"
              data-testid="knowledge-check-inline-score-pill"
              className={`ltr-inline px-2.5 py-1 rounded-lg font-mono text-xs font-bold border tabular-nums ${
                evaluationResult.passed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
              }`}
            >
              {evaluationResult.correctCount}/{evaluationResult.totalQuestions} (
              {evaluationResult.scorePercent}%)
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenModalManually}
            data-testid="knowledge-check-open-modal-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {evaluationResult
                ? language === 'en'
                  ? 'Review / Retake Knowledge Check'
                  : 'مشاهده نتیجه / تکرار آزمون دانش'
                : language === 'en'
                ? 'Launch Knowledge Check Quiz'
                : 'شروع آزمون سنجش دانش فصل'}
            </span>
          </button>
        </div>
      </div>

      {/* Knowledge Check Modal */}
      {isModalOpen && (
        <div
          data-testid="module-knowledge-check-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="knowledge-check-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
        >
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-indigo-500/35 bg-white dark:bg-[#0b111e] text-slate-900 dark:text-slate-100 shadow-2xl p-5 sm:p-7 space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    dir="ltr"
                    className="ltr-inline px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/35 text-indigo-600 dark:text-indigo-300 font-mono text-[11px] font-extrabold tabular-nums"
                  >
                    MOD-{formatLocalizedNumber(moduleInput.number, 'en', true)} · KNOWLEDGE CHECK
                  </span>
                  <span
                    dir="ltr"
                    data-testid="knowledge-check-ai-badge"
                    className={`ltr-inline inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                      activeQuiz.source === 'ai-live'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                        : 'bg-cyan-500/15 border-cyan-500/35 text-cyan-600 dark:text-cyan-300'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {activeQuiz.source === 'ai-live'
                      ? `${activeQuiz.modelUsed} · Live AI Quiz`
                      : `${activeQuiz.modelUsed} · AI Quiz Ready`}
                  </span>
                </div>

                <h2
                  id="knowledge-check-modal-title"
                  data-testid="knowledge-check-modal-title"
                  className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
                >
                  {renderBidiText(activeQuiz.quizTitle, safeLang)}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {renderBidiText(activeQuiz.quizSubtitle, safeLang)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => void handleSynthesizeAiQuiz()}
                  data-testid="knowledge-check-regenerate-ai-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-60 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isGenerating
                      ? language === 'en'
                        ? 'Synthesizing...'
                        : 'در حال تولید...'
                      : language === 'en'
                      ? 'Regenerate with AI'
                      : 'بازتولید با هوش مصنوعی'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  data-testid="knowledge-check-close-modal-btn"
                  aria-label="Close Knowledge Check Modal"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score Summary Banner (Visible after submission) */}
            {evaluationResult && (
              <div
                data-testid="knowledge-check-score-banner"
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  evaluationResult.passed
                    ? 'border-emerald-500/45 bg-emerald-500/10'
                    : 'border-amber-500/45 bg-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      evaluationResult.passed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {evaluationResult.passed
                        ? language === 'en'
                          ? 'Engineering Mastery Verified!'
                          : 'تسلط مهندسی شما بر این فصل تایید شد!'
                        : language === 'en'
                        ? 'Review Core Principles & Retry'
                        : 'نیاز به مرور مجدد اصول مهندسی این فصل'}
                    </div>
                    <div
                      dir="ltr"
                      data-testid="knowledge-check-score-details"
                      className="ltr-inline text-xs font-mono font-bold text-slate-700 dark:text-slate-200 tabular-nums"
                    >
                      Score: {evaluationResult.correctCount}/
                      {evaluationResult.totalQuestions} (
                      {evaluationResult.scorePercent}%) · Earned +
                      {evaluationResult.earnedXp} XP
                    </div>
                  </div>
                </div>

                {evaluationResult.passed && !isModuleCompleted && (
                  <button
                    type="button"
                    onClick={() => onToggleModuleComplete(moduleInput.id)}
                    data-testid="knowledge-check-complete-module-btn"
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {language === 'en'
                        ? 'Mark Chapter Completed'
                        : 'ثبت تکمیل این فصل'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-5">
              {activeQuiz.questions.map((q, qIdx) => {
                const selectedIdx = selectedAnswers[q.id];
                const qResult = evaluationResult?.resultsByQuestionId[q.id];

                return (
                  <div
                    key={q.id}
                    data-testid={`knowledge-check-question-${qIdx}`}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-4 sm:p-5 space-y-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        dir="ltr"
                        className="ltr-inline px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-bold"
                      >
                        Q0{qIdx + 1} · {q.principleBadge}
                      </span>
                      <span
                        dir="ltr"
                        className="ltr-inline text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums"
                      >
                        +{q.xpReward} XP
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      {renderBidiText(q.question, safeLang)}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((optText, optIdx) => {
                        const isSelected = selectedIdx === optIdx;
                        const isCorrectOpt = q.correctIndex === optIdx;

                        let optStyle =
                          'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 hover:border-indigo-500/40 text-slate-700 dark:text-slate-300';

                        if (qResult) {
                          if (isCorrectOpt) {
                            optStyle =
                              'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isSelected && !isCorrectOpt) {
                            optStyle =
                              'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200';
                          }
                        } else if (isSelected) {
                          optStyle =
                            'border-indigo-500 bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            data-testid={`knowledge-check-q${qIdx}-opt-${optIdx}`}
                            className={`w-full p-3 rounded-lg border text-xs transition-all flex items-start justify-between gap-3 cursor-pointer ${
                              isRTL ? 'text-right' : 'text-left'
                            } ${optStyle}`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                dir="ltr"
                                className="ltr-inline w-5 h-5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums"
                              >
                                {optIdx + 1}
                              </span>
                              <span className="leading-relaxed">
                                {renderBidiText(optText, safeLang)}
                              </span>
                            </div>

                            {qResult && isCorrectOpt && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            )}
                            {qResult && isSelected && !isCorrectOpt && (
                              <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {qResult && (
                      <div
                        data-testid={`knowledge-check-explanation-${qIdx}`}
                        className="p-3 rounded-lg border border-blue-500/25 bg-blue-500/[0.06] text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          {renderBidiText(q.explanation, safeLang)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? 'Select an option for each engineering principle question and submit.'
                  : 'گزینه صحیح هر سوال را انتخاب کرده و برای ثبت امتیاز دکمه بررسی را بزنید.'}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {language === 'en' ? 'Close' : 'بستن'}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  data-testid="knowledge-check-submit-btn"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {language === 'en'
                      ? 'Submit & Verify Mastery'
                      : 'بررسی پاسخ‌ها و دریافت XP'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
