import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  Zap,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  FileCode2,
  Check,
  X,
} from 'lucide-react';
import { KnowledgeBaseEntryItem } from '../utils/generators';
import {
  KnowledgeQuizQuestion,
  getKnowledgeQuizQuestionsForDoc,
  evaluateQuizAnswer,
  calculateQuizScoreSummary,
  getAccumulatedQuizXpFromStorage,
  persistRewardedQuizXpToStorage,
  CURATED_KNOWLEDGE_QUIZ_BANK,
} from '../utils/quizGenerators';
import { ExportSectionPdfButton, PrintableDocumentPayload } from './CodeAndPdfTools';
import { useLanguage } from '../context/LanguageContext';

export interface KnowledgeQuizProps {
  entries: KnowledgeBaseEntryItem[];
  selectedDocId?: string | null;
  onSelectDoc?: (docId: string) => void;
  onRewardXp?: (xpAmount: number, docId: string) => void;
  onExportPdf?: (payload: PrintableDocumentPayload) => void;
  className?: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const KnowledgeQuiz: React.FC<KnowledgeQuizProps> = ({
  entries,
  selectedDocId,
  onSelectDoc,
  onRewardXp,
  onExportPdf,
  className = '',
  isModal = false,
  onClose,
}) => {
  const { language, isRTL } = useLanguage();

  // Current active doc for the quiz
  const [activeDocId, setActiveDocId] = useState<string>(() => {
    if (selectedDocId) return selectedDocId;
    return entries[0]?.id || 'kb-user-state-sync';
  });

  // Sync when prop changes
  useEffect(() => {
    if (selectedDocId && selectedDocId !== activeDocId) {
      setActiveDocId(selectedDocId);
    }
  }, [selectedDocId]);

  // Find the selected document object
  const activeDoc = useMemo(() => {
    return (
      entries.find((e) => e.id === activeDocId) ||
      entries[0] || {
        id: 'kb-user-state-sync',
        keyPath: '.agent/knowledge-base/user-state.json',
        titleFa: 'وضعیت همگام‌سازی‌شده نشست کاربر',
        titleEn: 'Synced Cross-Session User State',
        category: 'user-state',
        contentSnippet: '{}',
        tokenCount: 320,
        stalenessPercent: 5,
        bentoSpan: 'normal',
        updatedAtIso: new Date().toISOString(),
      }
    );
  }, [entries, activeDocId]);

  // Questions for active document
  const questions: KnowledgeQuizQuestion[] = useMemo(() => {
    return getKnowledgeQuizQuestionsForDoc(activeDoc);
  }, [activeDoc]);

  // State within current quiz session
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOptionByQuestionId, setSelectedOptionByQuestionId] = useState<
    Record<string, number>
  >({});
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState<
    Record<string, boolean>
  >({});
  const [sessionClaimedXp, setSessionClaimedXp] = useState<number>(0);
  const [persistedTotalQuizXp, setPersistedTotalQuizXp] = useState<number>(() =>
    getAccumulatedQuizXpFromStorage()
  );
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [xpRewardToast, setXpRewardToast] = useState<string | null>(null);

  // Reset question index and responses when document changes
  const handleSwitchDoc = (newDocId: string) => {
    setActiveDocId(newDocId);
    if (onSelectDoc) {
      onSelectDoc(newDocId);
    }
    setCurrentQuestionIndex(0);
    setSelectedOptionByQuestionId({});
    setSubmittedQuestionIds({});
    setQuizFinished(false);
    setSessionClaimedXp(0);
  };

  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const isCurrentSubmitted = Boolean(
    currentQuestion && submittedQuestionIds[currentQuestion.id]
  );
  const currentSelectedOption =
    currentQuestion && selectedOptionByQuestionId[currentQuestion.id] !== undefined
      ? selectedOptionByQuestionId[currentQuestion.id]
      : null;

  // Handle option select
  const handleSelectOption = (optIndex: number) => {
    if (isCurrentSubmitted) return;
    if (!currentQuestion) return;
    setSelectedOptionByQuestionId((prev) => ({
      ...prev,
      [currentQuestion.id]: optIndex,
    }));
  };

  // Submit current answer
  const handleSubmitCurrentAnswer = () => {
    if (currentSelectedOption === null || !currentQuestion || isCurrentSubmitted) return;

    setSubmittedQuestionIds((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));

    const result = evaluateQuizAnswer(currentQuestion, currentSelectedOption);
    if (result.isCorrect) {
      // Award XP
      const gained = result.earnedXp;
      setSessionClaimedXp((prev) => prev + gained);
      const newTotal = persistRewardedQuizXpToStorage(gained);
      setPersistedTotalQuizXp(newTotal);

      if (onRewardXp) {
        onRewardXp(gained, activeDoc.id);
      }

      setXpRewardToast(
        language === 'en'
          ? `+${gained} XP awarded for correct answer on "${currentQuestion.topicEn}"`
          : `+${gained} XP برای پاسخ صحیح به مأموریت «${currentQuestion.topicFa}»`
      );
      setTimeout(() => setXpRewardToast(null), 4000);
    }
  };

  // Move to next question or complete
  const handleNextOrFinish = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  // Move to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Reset the quiz for the current document
  const handleResetQuiz = () => {
    setSelectedOptionByQuestionId({});
    setSubmittedQuestionIds({});
    setCurrentQuestionIndex(0);
    setQuizFinished(false);
  };

  // Score summary
  const scoreSummary = useMemo(() => {
    return calculateQuizScoreSummary(questions, selectedOptionByQuestionId);
  }, [questions, selectedOptionByQuestionId]);

  // PDF Export Payload Generator
  const handleExportQuizPdf = () => {
    const payload: PrintableDocumentPayload = {
      titleFa:
        language === 'en'
          ? `Knowledge Quiz Report: ${activeDoc.titleEn}`
          : `گزارش ارزشیابی و آزمون دانشی سند: ${activeDoc.titleFa}`,
      titleEn: `Knowledge Quiz Report — ${activeDoc.titleEn}`,
      subtitleOrCategory: `KNOWLEDGE BASE AUDIT QUIZ · ${scoreSummary.masteryTierEn} (+${scoreSummary.earnedXp} XP)`,
      sections: [
        {
          headingFa:
            language === 'en'
              ? 'Quiz Session Performance & XP Breakdown'
              : 'خلاصه عملکرد و امتیاز کسب‌شده در آزمون',
          headingEn: 'Quiz Session Performance & XP Breakdown',
          paragraphsFa:
            language === 'en'
              ? [
                  `Audited Document: ${activeDoc.titleEn} (${activeDoc.keyPath})`,
                  `Total Questions: ${scoreSummary.totalQuestions} Questions`,
                  `Correct Answers: ${scoreSummary.correctCount} of ${scoreSummary.totalQuestions} (${scoreSummary.accuracyPercent}%)`,
                  `Earned XP: ${scoreSummary.earnedXp} XP out of ${scoreSummary.totalPossibleXp} XP possible`,
                  `Mastery Tier Achieved: ${scoreSummary.masteryTierEn}`,
                ]
              : [
                  `سند آزمون: ${activeDoc.titleFa} (${activeDoc.keyPath})`,
                  `تعداد کل پرسش‌ها: ${scoreSummary.totalQuestions} پرسش`,
                  `پاسخ‌های صحیح: ${scoreSummary.correctCount} از ${scoreSummary.totalQuestions} (${scoreSummary.accuracyPercent}%)`,
                  `امتیاز XP دریافتی: ${scoreSummary.earnedXp} XP از مجموع ${scoreSummary.totalPossibleXp} XP ممکن`,
                  `سطح تسلط کسب‌شده: ${scoreSummary.masteryTierFa} (${scoreSummary.masteryTierEn})`,
                ],
        },
        ...questions.map((q, idx) => {
          const userChoiceIdx = selectedOptionByQuestionId[q.id];
          const userChoice =
            userChoiceIdx !== undefined ? q.options[userChoiceIdx] : null;
          const correctChoice = q.options[q.correctOptionIndex];
          const isUserCorrect = userChoiceIdx === q.correctOptionIndex;

          return {
            headingFa:
              language === 'en'
                ? `Question ${idx + 1}: ${q.topicEn} [${isUserCorrect ? 'Correct ✓' : 'Incorrect ✗'}]`
                : `پرسش ${idx + 1}: ${q.topicFa} [${isUserCorrect ? 'صحیح ✓' : 'نادرست ✗'}]`,
            headingEn: `Question ${idx + 1}: ${q.topicEn} (${q.xpReward} XP)`,
            paragraphsFa:
              language === 'en'
                ? [
                    `Question: ${q.questionEn}`,
                    `Selected Option: [${userChoice?.id || '—'}] ${userChoice?.textEn || 'Unanswered'}`,
                    `Verified Architectural Answer: [${correctChoice.id}] ${correctChoice.textEn}`,
                    `Engineering Analysis & Rationale: ${q.explanationEn}`,
                  ]
                : [
                    `صورت پرسش: ${q.questionFa}`,
                    `گزینه انتخابی کاربر: [${userChoice?.id || '—'}] ${userChoice?.textFa || 'بدون پاسخ'}`,
                    `پاسخ معتبر معماری: [${correctChoice.id}] ${correctChoice.textFa}`,
                    `تحلیل مهندسی و دلیل پاسخ: ${q.explanationFa}`,
                  ],
          };
        }),
      ],
    };

    if (onExportPdf) {
      onExportPdf(payload);
    }
  };

  return (
    <div
      data-testid="knowledge-quiz-component"
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]/95 shadow-xl p-5 sm:p-6 space-y-6 transition-all ${className}`}
    >
      {/* Quiz Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/35 flex items-center justify-center text-blue-500 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {language === 'en' ? (
                  'Knowledge Base Interactive Challenge & XP Rewards'
                ) : (
                  <>
                    آزمون تعاملی تسلط بر پایگاه دانش{' '}
                    <span
                      dir="ltr"
                      className="ltr-inline font-mono text-xs sm:text-sm text-blue-500"
                    >
                      (Knowledge Base Challenge &amp; XP Rewards)
                    </span>
                  </>
                )}
              </h2>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span dir="ltr" className="ltr-inline text-xs font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                +{currentQuestion?.xpReward || 40} XP Per Question
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'en'
                ? 'Multiple-choice challenges based on the selected document, architectural auditing, and XP points towards mastery rank.'
                : 'آزمون‌های چندگزینه‌ای مبتنی بر سند انتخابی، ممیزی معماری و دریافت امتیاز XP برای ارتقای رتبه معمار'}
            </p>
          </div>
        </div>

        {/* Right side: Global Quiz XP & Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Accumulated Quiz XP Counter */}
          <div
            data-testid="kb-quiz-total-xp-pill"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-extrabold tabular-nums"
          >
            <Zap className="w-3.5 h-3.5 fill-emerald-500" />
            <span>Total Quiz XP:</span>
            <strong data-testid="kb-quiz-total-xp-value" className="text-sm tabular-nums">
              {persistedTotalQuizXp} XP
            </strong>
          </div>

          {/* Export PDF Button */}
          {onExportPdf && (
            <button
              type="button"
              onClick={handleExportQuizPdf}
              data-testid="kb-quiz-export-pdf-btn"
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <span>{language === 'en' ? '📄 Export Quiz PDF' : '📄 خروجی PDF آزمون'}</span>
            </button>
          )}

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              data-testid="kb-quiz-close-modal-btn"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              aria-label="Close Quiz"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Document Selector Row */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {language === 'en' ? 'Select Knowledge Base Document:' : 'انتخاب سند پایگاه دانش برای آزمون:'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl justify-end">
          <select
            value={activeDocId}
            onChange={(e) => handleSwitchDoc(e.target.value)}
            data-testid="kb-quiz-doc-selector"
            className="w-full sm:w-auto min-w-[280px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {language === 'en' ? entry.titleEn : entry.titleFa} ({entry.keyPath.split('/').pop()})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleResetQuiz}
            data-testid="kb-quiz-reset-btn"
            title={language === 'en' ? 'Restart quiz for this document' : 'آزمون مجدد این سند'}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Restart' : 'شروع مجدد'}</span>
          </button>
        </div>
      </div>

      {/* Floating XP Reward Toast Notification */}
      {xpRewardToast && (
        <div
          data-testid="kb-quiz-xp-toast"
          className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 transition-opacity duration-200 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{xpRewardToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setXpRewardToast(null)}
            className="text-emerald-400 hover:text-emerald-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Quiz Body */}
      {!quizFinished && currentQuestion ? (
        <div className="space-y-5" data-testid="kb-quiz-active-question-card">
            {/* Question Stepper & Progress Tracker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span data-testid="kb-quiz-question-counter">
                  {language === 'en'
                    ? `Question ${currentQuestionIndex + 1} of ${questions.length}`
                    : `پرسش ${currentQuestionIndex + 1} از ${questions.length} · Question ${currentQuestionIndex + 1} of ${questions.length}`}
                </span>
                <span className="font-bold text-blue-500 tabular-nums">
                  {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Current Question Card */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-4">
              {/* Topic & Metadata Line */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {currentQuestion.difficulty.toUpperCase()}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span
                    dir="ltr"
                    className="ltr-inline text-slate-500 dark:text-slate-400 flex items-center gap-1"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-blue-500" />
                    {currentQuestion.keyPath}
                  </span>
                </div>

                <div
                  dir="ltr"
                  className="ltr-inline font-bold text-amber-500 tabular-nums"
                >
                  Reward: +{currentQuestion.xpReward} XP
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <h3
                  data-testid="kb-quiz-question-text-fa"
                  className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-7"
                >
                  {language === 'en' ? currentQuestion.questionEn : currentQuestion.questionFa}
                </h3>
                <div
                  dir="ltr"
                  data-testid="kb-quiz-question-text-en"
                  className="ltr-inline text-xs font-mono text-slate-500 dark:text-slate-400 block"
                >
                  {language === 'en' ? `Topic: ${currentQuestion.topicEn}` : currentQuestion.questionEn}
                </div>
              </div>

              {/* Multiple Choice Options List */}
              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {currentQuestion.options.map((option, optIdx) => {
                  const isSelected = currentSelectedOption === optIdx;
                  const isCorrectOption = optIdx === currentQuestion.correctOptionIndex;

                  let optionClass =
                    'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-600';

                  if (isCurrentSubmitted) {
                    if (isCorrectOption) {
                      optionClass =
                        'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold';
                    } else if (isSelected && !isCorrectOption) {
                      optionClass =
                        'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold';
                    } else {
                      optionClass =
                        'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 opacity-60 text-slate-500';
                    }
                  } else if (isSelected) {
                    optionClass =
                      'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300 font-bold shadow-sm';
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      disabled={isCurrentSubmitted}
                      data-testid={`kb-quiz-option-${option.id}`}
                      className={`w-full ${isRTL ? 'text-right' : 'text-left'} p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${optionClass}`}
                    >
                      <span
                        dir="ltr"
                        className={`ltr-inline w-6 h-6 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrentSubmitted
                            ? isCorrectOption
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {option.id}
                      </span>

                      <div className="flex-1 space-y-1">
                        <div className="leading-5">
                          {language === 'en' ? option.textEn : option.textFa}
                        </div>
                        {language !== 'en' && (
                          <div
                            dir="ltr"
                            className="text-[11px] font-mono opacity-80 block text-left"
                          >
                            {option.textEn}
                          </div>
                        )}
                      </div>

                      {isCurrentSubmitted && isCorrectOption && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      {isCurrentSubmitted && isSelected && !isCorrectOption && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Answer Explanation Banner (Revealed after submission) */}
              {isCurrentSubmitted && (
                <div
                  data-testid="kb-quiz-explanation-banner"
                  className={`p-4 rounded-xl border space-y-2 ${
                    currentSelectedOption === currentQuestion.correctOptionIndex
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {currentSelectedOption === currentQuestion.correctOptionIndex ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>
                          {language === 'en'
                            ? `Correct Answer! (+${currentQuestion.xpReward} XP)`
                            : `پاسخ شما کاملاً صحیح است! (+${currentQuestion.xpReward} XP)`}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>
                          {language === 'en'
                            ? `Incorrect. Correct option: ${
                                currentQuestion.options[currentQuestion.correctOptionIndex]?.id
                              }`
                            : `پاسخ نادرست. گزینه صحیح: ${
                                currentQuestion.options[currentQuestion.correctOptionIndex]?.id
                              }`}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-xs leading-6">
                    {language === 'en' ? currentQuestion.explanationEn : currentQuestion.explanationFa}
                  </div>
                  {language !== 'en' && (
                    <div
                      dir="ltr"
                      className="text-[11px] font-mono opacity-80 block pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-left"
                    >
                      {currentQuestion.explanationEn}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions Row */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>{language === 'en' ? 'Previous Question' : 'پرسش قبلی'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {!isCurrentSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitCurrentAnswer}
                      disabled={currentSelectedOption === null}
                      data-testid="kb-quiz-submit-btn"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>{language === 'en' ? 'Submit Answer' : 'تأیید و ثبت پاسخ (Submit)'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextOrFinish}
                      data-testid="kb-quiz-next-btn"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>
                        {currentQuestionIndex < questions.length - 1
                          ? language === 'en' ? 'Next Question' : 'پرسش بعدی'
                          : language === 'en' ? 'View Final Results' : 'مشاهده کارنامه پایانی'}
                      </span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Quiz Finished Summary View */
          <div
            data-testid="kb-quiz-summary-card"
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-500">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {language === 'en'
                  ? 'Knowledge Base Quiz Performance Report'
                  : 'کارنامه و ارزشیابی آزمون دانشی پایگاه دانش'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Audited Document: ' : 'سند ارزیابی‌شده: '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {language === 'en' ? activeDoc.titleEn : activeDoc.titleFa}
                </strong>{' '}
                (<code dir="ltr" className="ltr-inline">{activeDoc.keyPath}</code>)
              </p>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl mx-auto">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="text-[11px] font-bold text-slate-500">
                  {language === 'en' ? 'Correct Answers' : 'پاسخ‌های صحیح'}
                </div>
                <div
                  dir="ltr"
                  data-testid="kb-quiz-correct-count"
                  className="text-lg font-mono font-black text-emerald-500"
                >
                  {scoreSummary.correctCount} / {scoreSummary.totalQuestions}
                </div>
                <div className="text-[10px] text-slate-400">
                  {language === 'en' ? `Accuracy: ${scoreSummary.accuracyPercent}%` : `دقت: ${scoreSummary.accuracyPercent}%`}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="text-[11px] font-bold text-slate-500">
                  {language === 'en' ? 'Earned XP' : 'امتیاز XP کسب‌شده'}
                </div>
                <div
                  dir="ltr"
                  data-testid="kb-quiz-session-earned-xp"
                  className="text-lg font-mono font-black text-amber-500"
                >
                  +{scoreSummary.earnedXp} XP
                </div>
                <div className="text-[10px] text-slate-400">
                  {language === 'en' ? `Out of ${scoreSummary.totalPossibleXp} XP` : `از مجموع ${scoreSummary.totalPossibleXp} XP`}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="text-[11px] font-bold text-slate-500">
                  {language === 'en' ? 'Mastery Tier' : 'سطح شایستگی'}
                </div>
                <div
                  dir="ltr"
                  data-testid="kb-quiz-mastery-tier"
                  className="text-xs font-mono font-bold text-indigo-400 truncate"
                  title={scoreSummary.masteryTierEn}
                >
                  {scoreSummary.masteryTierEn}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {language === 'en' ? scoreSummary.masteryTierEn : scoreSummary.masteryTierFa}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetQuiz}
                data-testid="kb-quiz-retake-btn"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'en' ? 'Retake Quiz' : 'تکرار آزمون این سند (Retake)'}</span>
              </button>

              {onExportPdf && (
                <button
                  type="button"
                  onClick={handleExportQuizPdf}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{language === 'en' ? '📄 Export Scorecard PDF' : '📄 دریافت کارنامه PDF'}</span>
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
