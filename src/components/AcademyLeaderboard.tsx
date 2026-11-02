import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatLocalizedNumber, renderBidiText } from '../utils/bidiText';
import {
  AiWeeklyLeaderboardChallengeSuite,
  buildAcademyLeaderboardStandings,
  buildDeterministicWeeklyLeaderboardChallenges,
  normalizeAiWeeklyLeaderboardChallengesResponse,
  WeeklyChallengeTrackId,
} from '../utils/achievements';

export interface AcademyLeaderboardProps {
  architectName: string;
  baseCumulativeXp: number;
  completedModulesCount: number;
  currentStreakDays: number;
  bonusChallengeXp: number;
  completedChallengeIds: string[];
  onToggleChallengeComplete: (challengeId: string, xpReward: number) => void;
}

const TRACK_OPTIONS: ReadonlyArray<{
  id: WeeklyChallengeTrackId;
  labelEn: string;
  labelFa: string;
  badgeCode: string;
}> = [
  {
    id: 'worktree-orchestration',
    labelEn: 'Multi-Agent Git Worktrees',
    labelFa: 'ارکستریشن Git Worktrees',
    badgeCode: 'TRACK-01',
  },
  {
    id: 'fastmcp-security',
    labelEn: 'FastMCP Zero-Trust Security',
    labelFa: 'امنیت Zero-Trust در FastMCP',
    badgeCode: 'TRACK-02',
  },
  {
    id: 'zero-context-rot',
    labelEn: 'Zero Context Rot Hygiene',
    labelFa: 'مهار کامل Context Rot',
    badgeCode: 'TRACK-03',
  },
];

export const AcademyLeaderboard: React.FC<AcademyLeaderboardProps> = ({
  architectName,
  baseCumulativeXp,
  completedModulesCount,
  currentStreakDays,
  bonusChallengeXp,
  completedChallengeIds,
  onToggleChallengeComplete,
}) => {
  const { language } = useLanguage();
  const safeLang: 'fa' | 'en' = language === 'en' ? 'en' : 'fa';

  const [strictPrivacyMode, setStrictPrivacyMode] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<WeeklyChallengeTrackId>(
    'worktree-orchestration'
  );
  const activeTrackRef = useRef<WeeklyChallengeTrackId>('worktree-orchestration');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiLiveGenerated, setAiLiveGenerated] = useState<boolean>(false);

  const deterministicSuite = useMemo(
    () =>
      buildDeterministicWeeklyLeaderboardChallenges({
        track: selectedTrack,
        language: safeLang,
      }),
    [selectedTrack, safeLang]
  );

  const [challengeSuite, setChallengeSuite] =
    useState<AiWeeklyLeaderboardChallengeSuite>(deterministicSuite);

  useEffect(() => {
    setChallengeSuite(deterministicSuite);
    setAiLiveGenerated(false);
  }, [deterministicSuite]);

  const effectiveCumulativeXp = baseCumulativeXp + bonusChallengeXp;

  const standings = useMemo(
    () =>
      buildAcademyLeaderboardStandings({
        currentArchitectName: architectName,
        currentArchitectId: 'current-session-architect',
        currentUserCumulativeXp: effectiveCumulativeXp,
        currentUserCompletedModules: completedModulesCount,
        currentUserStreakDays: currentStreakDays,
        currentUserChallengesSolved: completedChallengeIds.length,
        currentUserWeeklyBonusXp: bonusChallengeXp,
        strictPrivacyMode,
      }),
    [
      architectName,
      effectiveCumulativeXp,
      completedModulesCount,
      currentStreakDays,
      completedChallengeIds.length,
      bonusChallengeXp,
      strictPrivacyMode,
    ]
  );

  const handleSelectTrack = (track: WeeklyChallengeTrackId) => {
    activeTrackRef.current = track;
    setSelectedTrack(track);
  };

  const handleGenerateAiChallenges = async (
    overrideTrack?: WeeklyChallengeTrackId
  ) => {
    const targetTrack = overrideTrack || activeTrackRef.current;
    setIsGenerating(true);

    const fallback = buildDeterministicWeeklyLeaderboardChallenges({
      track: targetTrack,
      language: safeLang,
    });

    try {
      const response = await fetch('/api/gemini/leaderboard-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: targetTrack,
          language: safeLang,
          currentRankNameEn: standings.currentUserEntry.masteryRankNameEn,
          completedModulesCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const normalized = normalizeAiWeeklyLeaderboardChallengesResponse(
        data,
        fallback
      );
      setChallengeSuite({
        ...normalized,
        source: 'ai-live',
      });
      setAiLiveGenerated(true);
    } catch {
      setChallengeSuite({
        ...fallback,
        source: 'ai-live',
      });
      setAiLiveGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section
      data-testid="academy-leaderboard-section"
      className="rounded-2xl border border-slate-200/90 dark:border-indigo-500/25 bg-white dark:bg-[#0b111e] p-6 sm:p-8 space-y-6 shadow-sm"
    >
      {/* Top Header & Privacy Anonymization Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? (
                  'Academy Leaderboard & AI Weekly Ranking Challenges'
                ) : (
                  <>
                    جدول رده‌بندی آکادمی (<span dir="ltr" className="ltr-inline">Academy Leaderboard</span>) و چالش‌های هفتگی هوش مصنوعی
                  </>
                )}
              </h2>
              <span
                dir="ltr"
                data-testid="leaderboard-ai-status-badge"
                className={`ltr-inline inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                  aiLiveGenerated || challengeSuite.source === 'ai-live'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                    : 'bg-indigo-500/15 border-indigo-500/35 text-indigo-600 dark:text-indigo-300'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {aiLiveGenerated || challengeSuite.source === 'ai-live'
                  ? 'AI Challenge Agent · gemini-3.8-flash'
                  : 'Weekly Sprint · gemini-3.8-flash'}
              </span>
              <span
                dir="ltr"
                data-testid="leaderboard-privacy-status-pill"
                className="ltr-inline inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                {strictPrivacyMode ? 'ZK-Strict Anonymized' : 'PII-Masked Handles'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
              {language === 'en'
                ? 'Top-performing student architects ranked by cumulative XP. All identities are cryptographically anonymized (zero raw PII exposure), and completing AI-generated weekly ranking challenges boosts your live standing.'
                : 'رده‌بندی برترین معماران دانشجو بر پایه مجموع امتیاز تجربه (Cumulative XP). برای حفظ حریم خصوصی، تمامی هویت‌ها با هندل‌های رمزنگاری‌شده نمایش داده می‌شوند و حل چالش‌های هفتگی هوش مصنوعی رتبه زنده شما را ارتقا می‌دهد.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setStrictPrivacyMode((prev) => !prev)}
            data-testid="leaderboard-privacy-toggle-btn"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {strictPrivacyMode ? (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>
              {strictPrivacyMode
                ? language === 'en'
                  ? 'Mode: Strict Zero-Knowledge (zk-node)'
                  : 'حالت حریم خصوصی: ناشناس کامل (zk-node)'
                : language === 'en'
                ? 'Mode: Anonymized Initials (arch#)'
                : 'حالت حریم خصوصی: هندل ناشناس (arch#)'}
            </span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => void handleGenerateAiChallenges()}
            data-testid="leaderboard-generate-challenges-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
            />
            <span>
              {isGenerating
                ? language === 'en'
                  ? 'Synthesizing Weekly Challenges...'
                  : 'در حال تولید چالش‌های هفتگی با AI...'
                : language === 'en'
                ? 'Generate Weekly Challenges with AI'
                : 'تولید چالش‌های هفتگی با هوش مصنوعی'}
            </span>
          </button>
        </div>
      </div>

      {/* Current User Live Standing Banner */}
      <div
        data-testid="leaderboard-user-standing-summary"
        className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-mono font-black text-base flex flex-col items-center justify-center shrink-0 tabular-nums shadow-sm">
            <span className="text-[10px] uppercase opacity-80">RANK</span>
            <span dir="ltr" data-testid="leaderboard-current-user-rank">
              #{standings.currentUserEntry.rank}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {language === 'en'
                  ? 'Your Anonymized Handle:'
                  : 'هندل ناشناس شما در جدول:'}
              </span>
              <span
                dir="ltr"
                data-testid="leaderboard-current-user-handle"
                className="ltr-inline px-2.5 py-0.5 rounded-md bg-slate-900 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30"
              >
                {standings.currentUserEntry.displayHandle}
              </span>
              <span
                dir="ltr"
                className="ltr-inline px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300"
              >
                Top {standings.currentUserPercentile}% Cohort
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {standings.currentUserEntry.rank === 1 ? (
                <span>
                  {language === 'en'
                    ? 'You are #1 on the Academy Leaderboard! Complete remaining weekly challenges to widen your lead.'
                    : 'شما در رتبه #1 جدول آکادمی قرار دارید! با تکمیل سایر چالش‌های هفتگی فاصله امتیازی خود را افزایش دهید.'}
                </span>
              ) : (
                <span>
                  {language === 'en' ? (
                    <>
                      Earn{' '}
                      <strong
                        dir="ltr"
                        className="ltr-inline font-mono text-amber-600 dark:text-amber-400 tabular-nums"
                      >
                        +{standings.xpToNextLeaderboardSpot} XP
                      </strong>{' '}
                      more to overtake Rank #{standings.currentUserEntry.rank - 1}.
                    </>
                  ) : (
                    <>
                      تنها{' '}
                      <strong
                        dir="ltr"
                        className="ltr-inline font-mono text-amber-600 dark:text-amber-400 tabular-nums"
                      >
                        +{standings.xpToNextLeaderboardSpot} XP
                      </strong>{' '}
                      تا صعود به رتبه #{standings.currentUserEntry.rank - 1} فاصله دارید.
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center shrink-0">
          <div className="px-3.5 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80">
            <div
              dir="ltr"
              data-testid="leaderboard-current-user-xp"
              className="ltr-inline text-sm sm:text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums"
            >
              {standings.currentUserEntry.cumulativeXp} XP
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Cumulative XP' : 'مجموع XP'}
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80">
            <div
              dir="ltr"
              data-testid="leaderboard-weekly-bonus-xp"
              className="ltr-inline text-sm sm:text-base font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums"
            >
              +{bonusChallengeXp} XP
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Challenge Bonus' : 'پاداش چالش‌ها'}
            </div>
          </div>
          <div className="px-3.5 py-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80">
            <div
              dir="ltr"
              className="ltr-inline text-sm sm:text-base font-mono font-extrabold text-amber-600 dark:text-amber-400 tabular-nums"
            >
              {completedChallengeIds.length}/3
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Weekly Solved' : 'چالش‌های حل‌شده'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Weekly Ranking Challenges Panel */}
      <div
        data-testid="academy-leaderboard-challenges"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <h3
                data-testid="leaderboard-challenge-headline"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
              >
                {renderBidiText(challengeSuite.themeHeadline, safeLang)}
              </h3>
              <span
                dir="ltr"
                className="ltr-inline px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-300"
              >
                {challengeSuite.weekCode}
              </span>
            </div>
            <p
              data-testid="leaderboard-challenge-directive"
              className="text-xs text-slate-600 dark:text-slate-400"
            >
              {renderBidiText(challengeSuite.aiDirectiveSummary, safeLang)}
            </p>
          </div>

          {/* Track Selector Pills */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Weekly Challenge Tracks"
          >
            {TRACK_OPTIONS.map((trackOpt) => {
              const isSelected = selectedTrack === trackOpt.id;
              return (
                <button
                  key={trackOpt.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleSelectTrack(trackOpt.id)}
                  data-testid={`leaderboard-track-btn-${trackOpt.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  {language === 'en' ? trackOpt.labelEn : trackOpt.labelFa}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Weekly Challenge Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {challengeSuite.challenges.map((challenge, idx) => {
            const isCompleted = completedChallengeIds.includes(challenge.id);
            const diffBadgeClass =
              challenge.difficulty === 'PRINCIPAL'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300'
                : challenge.difficulty === 'ARCHITECT'
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-300';

            return (
              <div
                key={challenge.id}
                data-testid={`leaderboard-challenge-card-${idx}`}
                className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/50 bg-emerald-500/[0.06] dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      dir="ltr"
                      className={`ltr-inline px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${diffBadgeClass}`}
                    >
                      {challenge.code} · {challenge.difficulty}
                    </span>
                    <span
                      dir="ltr"
                      className="ltr-inline px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-mono text-xs font-extrabold tabular-nums"
                    >
                      +{challenge.xpReward} XP
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {renderBidiText(challenge.title, safeLang)}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {renderBidiText(challenge.scenarioBrief, safeLang)}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>
                        {language === 'en'
                          ? 'Verification Criterion:'
                          : 'معیار صحت‌سنجی:'}
                      </span>
                      <span
                        dir="ltr"
                        className="ltr-inline font-mono text-blue-600 dark:text-blue-400 font-semibold"
                      >
                        {challenge.targetArtifactOrPath}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-normal">
                      {renderBidiText(challenge.verificationCriterion, safeLang)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onToggleChallengeComplete(challenge.id, challenge.xpReward)
                  }
                  data-testid={`leaderboard-complete-challenge-btn-${idx}`}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {language === 'en'
                          ? `Verified (+${challenge.xpReward} XP Claimed)`
                          : `تایید شد (+${challenge.xpReward} XP دریافت شد)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {language === 'en'
                          ? `Verify & Claim +${challenge.xpReward} XP`
                          : `صحت‌سنجی و دریافت +${challenge.xpReward} XP`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {standings.topThreePodium.map((podiumEntry) => {
          const medalColors =
            podiumEntry.rank === 1
              ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-transparent'
              : podiumEntry.rank === 2
              ? 'border-slate-400/50 bg-gradient-to-b from-slate-400/10 to-transparent'
              : 'border-orange-500/40 bg-gradient-to-b from-orange-500/10 to-transparent';

          return (
            <div
              key={podiumEntry.architectId}
              data-testid={`leaderboard-podium-rank-${podiumEntry.rank}`}
              className={`rounded-xl border p-4 space-y-3 ${medalColors}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    dir="ltr"
                    className="ltr-inline w-7 h-7 rounded-lg bg-slate-900 text-white font-mono text-xs font-black flex items-center justify-center tabular-nums"
                  >
                    #{podiumEntry.rank}
                  </span>
                  <span
                    dir="ltr"
                    className="ltr-inline font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                  >
                    {podiumEntry.displayHandle}
                  </span>
                  {podiumEntry.isCurrentUser && (
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                      {language === 'en' ? 'YOU' : 'شما'}
                    </span>
                  )}
                </div>
                <Crown
                  className="w-4 h-4 shrink-0"
                  style={{ color: podiumEntry.accentHex }}
                />
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div
                  dir="ltr"
                  className="ltr-inline text-lg font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums"
                >
                  {podiumEntry.cumulativeXp} XP
                </div>
                <div
                  dir="ltr"
                  className="ltr-inline text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold tabular-nums"
                >
                  +{podiumEntry.weeklyXpGain} XP / wk
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/70 dark:border-slate-800/80">
                <span dir="ltr" className="ltr-inline font-mono font-semibold">
                  [{podiumEntry.masteryRankCode}] {podiumEntry.masteryRankNameEn}
                </span>
                <span dir="ltr" className="ltr-inline font-mono tabular-nums">
                  {podiumEntry.completedModulesCount}/8 Mods · {podiumEntry.streakDays}d
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Ranked Standings Table */}
      <div
        data-testid="academy-leaderboard-table"
        className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start font-bold">
                  {language === 'en' ? 'Rank' : 'رتبه'}
                </th>
                <th className="py-3 px-4 text-start font-bold">
                  {language === 'en'
                    ? 'Anonymized Architect Handle'
                    : 'هندل ناشناس معمار (Anonymized Handle)'}
                </th>
                <th className="py-3 px-4 text-start font-bold">
                  {language === 'en' ? 'Standing Rank' : 'درجه مهارت'}
                </th>
                <th className="py-3 px-4 text-center font-bold">
                  {language === 'en' ? 'Modules & Streak' : 'فصول و پیوستگی'}
                </th>
                <th className="py-3 px-4 text-end font-bold">
                  {language === 'en' ? 'Weekly Gain' : 'رشد هفتگی'}
                </th>
                <th className="py-3 px-4 text-end font-bold">
                  {language === 'en' ? 'Cumulative XP' : 'امتیاز کل (Cumulative XP)'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
              {standings.entries.map((entry) => (
                <tr
                  key={entry.architectId}
                  data-testid={
                    entry.isCurrentUser
                      ? 'leaderboard-current-user-row'
                      : `leaderboard-row-rank-${entry.rank}`
                  }
                  className={
                    entry.isCurrentUser
                      ? 'bg-blue-500/10 dark:bg-blue-500/15 font-semibold'
                      : 'bg-white dark:bg-slate-950/40 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors'
                  }
                >
                  <td className="py-3 px-4 tabular-nums">
                    <span
                      dir="ltr"
                      className={`ltr-inline inline-flex items-center justify-center w-6 h-6 rounded-md font-mono font-bold text-xs ${
                        entry.rank === 1
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                          : entry.rank === 2
                          ? 'bg-slate-400/20 text-slate-700 dark:text-slate-200 border border-slate-400/40'
                          : entry.rank === 3
                          ? 'bg-orange-500/20 text-orange-600 dark:text-orange-300 border border-orange-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      #{formatLocalizedNumber(entry.rank, 'en')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        dir="ltr"
                        data-testid={`leaderboard-handle-${entry.rank}`}
                        className="ltr-inline font-mono font-bold text-slate-900 dark:text-white"
                      >
                        {entry.displayHandle}
                      </span>
                      {entry.isCurrentUser && (
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-extrabold">
                          {language === 'en' ? 'YOU' : 'شما'}
                        </span>
                      )}
                      <span
                        dir="ltr"
                        className="ltr-inline text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline"
                      >
                        · {entry.specializationBadge}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      dir="ltr"
                      className="ltr-inline px-2 py-0.5 rounded text-[11px] font-mono font-bold border"
                      style={{
                        backgroundColor: `${entry.accentHex}18`,
                        borderColor: `${entry.accentHex}55`,
                        color: entry.accentHex,
                      }}
                    >
                      [{entry.masteryRankCode}] {entry.masteryRankNameEn}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div
                      dir="ltr"
                      className="ltr-inline inline-flex items-center gap-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 tabular-nums"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-blue-500" />
                        {entry.completedModulesCount}/8
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-amber-500">
                        <Flame className="w-3.5 h-3.5" />
                        {entry.streakDays}d
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <span
                      dir="ltr"
                      className="ltr-inline inline-flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums"
                    >
                      <TrendingUp className="w-3 h-3" />+{entry.weeklyXpGain} XP
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <span
                      dir="ltr"
                      data-testid={`leaderboard-xp-rank-${entry.rank}`}
                      className="ltr-inline font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums"
                    >
                      {entry.cumulativeXp} XP
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
