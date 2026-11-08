import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Share2,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatLocalizedNumber, formatLocalizedThousand, localizeDigits, renderBidiText } from '../utils/bidiText';
import {
  buildKnowledgeCheckChallengeSharePayload,
  buildKnowledgeCheckTop5Leaderboard,
  KNOWLEDGE_CHECK_SCORES_STORAGE_KEY,
  KnowledgeCheckModuleScoreRecord,
  recordModuleKnowledgeCheckScore,
} from '../utils/generators';

function loadStoredKnowledgeCheckScores(): Record<
  string,
  KnowledgeCheckModuleScoreRecord
> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KNOWLEDGE_CHECK_SCORES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export const AcademyKnowledgeCheckLeaderboard: React.FC = () => {
  const { language } = useLanguage();
  const safeLang: 'fa' | 'en' = language === 'en' ? 'en' : 'fa';

  const [userModuleScores, setUserModuleScores] = useState<
    Record<string, KnowledgeCheckModuleScoreRecord>
  >(() => loadStoredKnowledgeCheckScores());

  const [showChallengePanel, setShowChallengePanel] = useState<boolean>(false);
  const [copiedChallenge, setCopiedChallenge] = useState<boolean>(false);

  useEffect(() => {
    const syncFromStorage = () => {
      setUserModuleScores(loadStoredKnowledgeCheckScores());
    };
    window.addEventListener('ag-knowledge-check-updated', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('ag-knowledge-check-updated', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const leaderboard = useMemo(
    () =>
      buildKnowledgeCheckTop5Leaderboard({
        userModuleScores,
      }),
    [userModuleScores]
  );

  const sharePayload = useMemo(
    () =>
      buildKnowledgeCheckChallengeSharePayload({
        student: leaderboard.currentUserEntry,
        language: safeLang,
      }),
    [leaderboard.currentUserEntry, safeLang]
  );

  const handleChallengeOthers = useCallback(async () => {
    setShowChallengePanel(true);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sharePayload.clipboardSummary);
      }
    } catch {
      // Fallback for headless browser contexts
    }
    setCopiedChallenge(true);
  }, [sharePayload.clipboardSummary]);

  const handleLogModuleQuizBoost = useCallback(() => {
    const completedIds = Object.keys(userModuleScores);
    const nextModuleIndex = (completedIds.length % 8) + 1;
    const targetModuleId = `module-${nextModuleIndex}-kc-boost-${completedIds.length + 1}`;

    const updated = recordModuleKnowledgeCheckScore({
      existingScores: userModuleScores,
      moduleId: targetModuleId,
      moduleNumber: nextModuleIndex,
      evaluation: {
        correctCount: 3,
        totalQuestions: 3,
        scorePercent: 100,
        earnedXp: 225,
        passed: true,
        resultsByQuestionId: {},
      },
    });

    setUserModuleScores(updated);
    try {
      window.localStorage.setItem(
        KNOWLEDGE_CHECK_SCORES_STORAGE_KEY,
        JSON.stringify(updated)
      );
    } catch {
      // Ignore storage write errors
    }
  }, [userModuleScores]);

  const maxScoreXp = Math.max(
    1800,
    leaderboard.top5Students[0]?.cumulativeScoreXp || 1800
  );

  return (
    <section
      data-testid="kb-knowledge-check-leaderboard"
      className="rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-indigo-500/[0.06] via-white to-amber-500/[0.05] dark:from-[#0f172a] dark:via-[#111827] dark:to-[#0c1324] p-5 sm:p-6 shadow-md space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {language === 'en' ? (
                  'Academy Knowledge Check Leaderboard'
                ) : (
                  <>
                    لیدربورد آزمون‌های سنجش دانش آکادمی (
                    <span dir="ltr" className="ltr-inline">
                      Academy Knowledge Check Leaderboard
                    </span>
                    )
                  </>
                )}
              </h2>
              <span
                dir="ltr"
                className="ltr-inline px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-300 font-mono text-[11px] font-bold tabular-nums"
              >
                TOP 5 ARCHITECTS
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {language === 'en'
                ? 'Live ranking of the top 5 students based on cumulative scores and accuracy across Module Knowledge Check quizzes.'
                : 'رتبه‌بندی زنده ۵ دانشجوی برتر آکادمی بر اساس مجموع امتیازات (Cumulative XP) و دقت پاسخگویی در آزمون‌های سنجش دانش (Knowledge Check) فصول.'}
            </p>
          </div>
        </div>

        {/* User Standing Summary + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {language === 'en' ? 'Your Rank:' : 'رتبه شما:'}
            </span>
            <span
              dir="ltr"
              data-testid="kb-kc-leaderboard-user-rank"
              className="ltr-inline font-mono text-xs font-black text-indigo-600 dark:text-indigo-300 tabular-nums"
            >
              #{formatLocalizedNumber(leaderboard.currentUserEntry.rank, language)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span
              dir="ltr"
              data-testid="kb-kc-leaderboard-user-xp"
              className="ltr-inline font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums"
            >
              {formatLocalizedThousand(leaderboard.currentUserEntry.cumulativeScoreXp, language)} XP
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogModuleQuizBoost}
            data-testid="kb-kc-log-quiz-score-btn"
            className="px-3 py-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {language === 'en'
                ? 'Record Quiz Mastery (+225 XP)'
                : 'ثبت امتیاز آزمون فصل (+۲۲۵ XP)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleChallengeOthers}
            data-testid="kb-kc-challenge-others-btn"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>
              {language === 'en'
                ? 'Challenge Others'
                : 'به چالش کشیدن دیگران (Challenge Others)'}
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Challenge Others Share Banner */}
      {showChallengePanel && (
        <div
          data-testid="kb-kc-challenge-share-panel"
          className="rounded-xl border border-indigo-500/40 bg-indigo-500/[0.08] dark:bg-indigo-950/40 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {renderBidiText(sharePayload.shareTitle, language)}
              </span>
              <span
                dir="ltr"
                data-testid="kb-kc-challenge-code"
                className="ltr-inline px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-[11px] font-bold tabular-nums"
              >
                {sharePayload.challengeCode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {copiedChallenge && (
                <span
                  data-testid="kb-kc-challenge-copied-badge"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {language === 'en'
                      ? 'Rank Challenge Copied!'
                      : 'کارت دعوت به چالش کپی شد!'}
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={handleChallengeOthers}
                data-testid="kb-kc-copy-challenge-btn"
                className="px-3 py-1.5 rounded-lg border border-indigo-500/40 bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {language === 'en' ? 'Copy Invite' : 'کپی متن چالش'}
                </span>
              </button>
            </div>
          </div>

          <p
            data-testid="kb-kc-challenge-share-text"
            className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-white/80 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800"
          >
            {renderBidiText(sharePayload.shareText, language)}
          </p>
        </div>
      )}

      {/* Top 5 Students List */}
      <div
        data-testid="kb-kc-top5-list"
        className="grid grid-cols-1 gap-2.5"
      >
        {leaderboard.top5Students.map((student) => {
          const progressPct = Math.min(
            100,
            Math.round((student.cumulativeScoreXp / maxScoreXp) * 100)
          );

          const rankBadgeStyle =
            student.rank === 1
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
              : student.rank === 2
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400'
              : student.rank === 3
              ? 'bg-amber-700/80 text-white border-amber-600'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

          return (
            <div
              key={student.studentId}
              data-testid={`kb-kc-student-row-${student.rank}`}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                student.isCurrentUser
                  ? 'border-indigo-500/60 bg-indigo-500/[0.09] dark:bg-indigo-500/[0.12] shadow-xs'
                  : 'border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/70'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  dir="ltr"
                  className={`ltr-inline w-9 h-9 rounded-xl border font-mono text-xs font-black flex items-center justify-center shrink-0 tabular-nums ${rankBadgeStyle}`}
                >
                  #{formatLocalizedNumber(student.rank, language)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {language === 'en'
                        ? student.displayNameEn
                        : student.displayNameFa}
                    </span>
                    <span
                      dir="ltr"
                      className="ltr-inline px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-bold tabular-nums"
                    >
                      {student.anonymizedHandle}
                    </span>
                    {student.isCurrentUser && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-extrabold">
                        {language === 'en' ? 'YOU' : 'شما'}
                      </span>
                    )}
                    <span
                      dir="ltr"
                      className="ltr-inline px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-mono text-[10px] font-bold"
                    >
                      <Award className="w-3 h-3 inline mr-1" />
                      {student.topSpecialtyBadge}
                    </span>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="w-full sm:w-64 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        student.isCurrentUser
                          ? 'bg-indigo-500'
                          : student.rank === 1
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Metrics: Quizzes Completed, Accuracy, Cumulative Score XP */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-800/60">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {language === 'en' ? 'Quizzes:' : 'آزمون‌ها:'}{' '}
                  </span>
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums"
                  >
                    {formatLocalizedNumber(
                      `${student.quizzesCompletedCount}/8`,
                      language
                    )}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {language === 'en' ? 'Accuracy:' : 'دقت:'}{' '}
                  </span>
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums"
                  >
                    {formatLocalizedNumber(
                      `${student.averageAccuracyPercent}%`,
                      language
                    )}
                  </span>
                </div>

                <div
                  dir="ltr"
                  data-testid={`kb-kc-student-score-${student.rank}`}
                  className="ltr-inline px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:text-amber-300 font-mono text-xs sm:text-sm font-black tabular-nums"
                >
                  {formatLocalizedThousand(student.cumulativeScoreXp, language)} XP
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
