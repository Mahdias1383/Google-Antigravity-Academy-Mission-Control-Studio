import React, { useState, useEffect, useRef } from 'react';
import {
  Target,
  CheckCircle2,
  Flame,
  Zap,
  ChevronDown,
  Sparkles,
  ExternalLink,
  RotateCcw,
  FileCode,
} from 'lucide-react';
import {
  ARCHITECT_DAILY_MISSIONS_POOL,
  DailyMissionTargetSection,
} from '../utils/generators';
import {
  DAILY_OBJECTIVE_UPDATED_EVENT,
  StoredDailyObjective,
  getStoredDailyObjective,
  evaluateDailyObjective,
  changeDailyObjectiveMission,
  claimDailyObjective,
} from '../utils/dailyObjectives';
import { useLanguage } from '../context/LanguageContext';
import { formatLocalizedNumber, localizeDigits } from '../utils/bidiText';

export interface DailyObjectivesHeaderWidgetProps {
  currentStreakDays: number;
  onAwardXp: (xpAmount: number) => void;
  onNavigateToSection?: (section: any) => void;
  className?: string;
}

export const DailyObjectivesHeaderWidget: React.FC<DailyObjectivesHeaderWidgetProps> = ({
  currentStreakDays,
  onAwardXp,
  onNavigateToSection,
  className = '',
}) => {
  const { language, isRTL } = useLanguage();
  const isEn = language === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [showSwitchList, setShowSwitchList] = useState(false);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);

  const [objective, setObjective] = useState<StoredDailyObjective>(() => {
    return getStoredDailyObjective();
  });

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Sync objective state and listen for storage updates
  useEffect(() => {
    const handleSync = () => {
      setObjective(getStoredDailyObjective());
    };

    window.addEventListener(DAILY_OBJECTIVE_UPDATED_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(DAILY_OBJECTIVE_UPDATED_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSwitchList(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowSwitchList(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const evaluation = evaluateDailyObjective(objective, currentStreakDays);
  const currentMission = evaluation.mission;

  const handleClaim = () => {
    if (objective.completed) return;

    const result = claimDailyObjective(currentMission.id, currentStreakDays);
    if (result.success) {
      setObjective(result.objective);
      onAwardXp(result.awardedXp);
      setClaimedNotice(
        isEn
          ? `+${result.awardedXp} XP Awarded! (${result.multiplier}x Multiplier Applied)`
          : `+${formatLocalizedNumber(result.awardedXp, 'fa')} امتیاز XP دریافت شد! (ضریب ${localizeDigits(`${result.multiplier}x`, 'fa')})`
      );
      setTimeout(() => {
        setClaimedNotice(null);
      }, 4000);
    }
  };

  const handleSwitchMission = (missionId: string) => {
    const updated = changeDailyObjectiveMission(missionId);
    setObjective(updated);
    setShowSwitchList(false);
  };

  const handleNavigate = (targetSection: DailyMissionTargetSection) => {
    if (onNavigateToSection) {
      onNavigateToSection(targetSection);
      setIsOpen(false);
    }
  };

  const localizedProgress = objective.completed
    ? localizeDigits('1/1', language)
    : localizeDigits('0/1', language);

  const localizedMultiplier = localizeDigits(`${evaluation.streakMultiplier}x`, language);
  const boostPercent = Math.round((evaluation.streakMultiplier - 1) * 100);

  return (
    <div className={`relative inline-flex items-center shrink-0 ${className}`} ref={popoverRef}>
      {/* Sleek Single-Line Header Trigger Button */}
      <button
        type="button"
        data-testid="daily-objective-header-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-9 flex items-center gap-2 px-3 rounded-xl border text-xs transition-all cursor-pointer font-semibold whitespace-nowrap shrink-0 ${
          objective.completed
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-500/60'
            : 'border-slate-800/90 bg-slate-900/70 text-slate-200 hover:text-white hover:border-slate-700 hover:bg-slate-800/70'
        }`}
        title={
          isEn
            ? `Daily Objective: ${currentMission.titleEn} (${objective.completed ? 'Completed' : 'Pending'})`
            : `هدف روزانه: ${currentMission.titleFa} (${objective.completed ? 'تکمیل شده' : 'در حال انجام'})`
        }
        aria-expanded={isOpen}
      >
        {objective.completed ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        ) : (
          <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        )}

        <span className="hidden md:inline whitespace-nowrap">
          {isEn ? 'Daily Goal' : 'هدف روزانه'}
        </span>

        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums whitespace-nowrap ${
            objective.completed
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border border-slate-700/80'
          }`}
        >
          {localizedProgress}
        </span>

        <span
          className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 tabular-nums whitespace-nowrap"
          title={`${evaluation.streakMultiplier}x XP Multiplier Active`}
        >
          <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
          <span>{localizedMultiplier}</span>
        </span>

        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute ${
            isRTL ? 'left-0' : 'right-0'
          } top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150 text-start font-sans`}
          style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  {isEn ? 'Daily Mission Objective' : 'مأموریت و هدف روزانه معمار'}
                </h4>
                <p className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                  {localizeDigits(objective.dateIso, language)} ·{' '}
                  {isEn ? `Multiplier ${localizedMultiplier}` : `ضریب ${localizedMultiplier}`}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                objective.completed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
              }`}
            >
              {objective.completed
                ? isEn
                  ? 'Completed'
                  : 'تکمیل شده'
                : isEn
                ? 'In Progress'
                : 'در حال انجام'}
            </span>
          </div>

          {/* Streak Boost Multiplier Banner */}
          <div className="p-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent mb-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 tabular-nums">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span>
                  {isEn
                    ? `${currentStreakDays}-Day Streak (${localizedMultiplier} Multiplier)`
                    : `استمرار ${formatLocalizedNumber(currentStreakDays, 'fa')} روزه (ضریب ${localizedMultiplier})`}
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold tabular-nums">
                +{formatLocalizedNumber(boostPercent, language)}{isEn ? '% Boost' : '٪ پاداش'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 tabular-nums bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">
                {isEn ? 'Base XP:' : 'پاداش پایه:'}{' '}
                <strong className="text-white">
                  {formatLocalizedNumber(currentMission.xpReward, language)}
                </strong>
              </span>
              <span className="text-amber-400 font-semibold">
                + {formatLocalizedNumber(evaluation.potentialBonusXp, language)}{' '}
                {isEn ? 'Bonus' : 'ضریب استمرار'}
              </span>
              <span className="text-emerald-400 font-bold">
                = {formatLocalizedNumber(evaluation.potentialFinalXp, language)} XP
              </span>
            </div>
          </div>

          {/* Active Mission Details */}
          {!showSwitchList ? (
            <div>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 mb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="bidi-ltr-run px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 whitespace-nowrap"
                  >
                    {currentMission.code} · {currentMission.categoryBadge}
                  </span>
                  <span
                    dir="ltr"
                    className="bidi-ltr-run text-[11px] text-slate-400 font-mono flex items-center gap-1 min-w-0"
                  >
                    <FileCode className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate max-w-[140px]" title={currentMission.targetArtifact}>
                      {currentMission.targetArtifact}
                    </span>
                  </span>
                </div>

                <h5 className="text-xs font-bold text-slate-100 leading-snug">
                  {isEn ? currentMission.titleEn : currentMission.titleFa}
                </h5>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isEn ? currentMission.descEn : currentMission.descFa}
                </p>
              </div>

              {/* Toast Feedback */}
              {claimedNotice && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{claimedNotice}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {objective.completed ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-center text-xs font-semibold flex items-center justify-center gap-2 tabular-nums">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      {isEn
                        ? `Objective Completed (+${objective.awardedXp} XP Claimed)`
                        : `هدف روزانه تکمیل شد (+${formatLocalizedNumber(objective.awardedXp, 'fa')} XP ثبت گردید)`}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleClaim}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer tabular-nums"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {isEn
                        ? `Complete & Claim ${evaluation.potentialFinalXp} XP`
                        : `تکمیل مأموریت و دریافت ${formatLocalizedNumber(evaluation.potentialFinalXp, 'fa')} XP`}
                    </span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate(currentMission.targetSection)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>
                      {isEn ? 'Navigate to Studio' : 'ورود به استودیو هدف'}
                    </span>
                  </button>

                  {!objective.completed && (
                    <button
                      type="button"
                      onClick={() => setShowSwitchList(true)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                      title={isEn ? 'Switch Mission' : 'تغییر مأموریت'}
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isEn ? 'Switch' : 'تغییر هدف'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Mission Switcher View */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 text-xs text-slate-400">
                <span className="font-bold text-white">
                  {isEn ? 'Choose Daily Objective' : 'انتخاب هدف روزانه از بانک مأموریت‌ها'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSwitchList(false)}
                  className="text-cyan-400 hover:underline text-[11px] font-semibold cursor-pointer"
                >
                  {isEn ? 'Back' : 'بازگشت'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pe-1">
                {ARCHITECT_DAILY_MISSIONS_POOL.map((mission) => {
                  const isCurrent = mission.id === currentMission.id;
                  return (
                    <button
                      key={mission.id}
                      type="button"
                      onClick={() => handleSwitchMission(mission.id)}
                      className={`w-full p-2.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-1 ${
                        isCurrent
                          ? 'border-cyan-500 bg-cyan-500/10 text-white'
                          : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span
                          dir="ltr"
                          className="bidi-ltr-run font-mono font-bold text-cyan-400"
                        >
                          {mission.code} · {mission.categoryBadge}
                        </span>
                        <span className="text-amber-400 font-bold tabular-nums">
                          {formatLocalizedNumber(mission.xpReward, language)} XP
                        </span>
                      </div>
                      <div className="text-xs font-semibold line-clamp-1">
                        {isEn ? mission.titleEn : mission.titleFa}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
