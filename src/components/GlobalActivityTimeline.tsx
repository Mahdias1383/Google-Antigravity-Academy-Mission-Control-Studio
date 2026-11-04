import React, { useState, useEffect, useMemo } from 'react';
import { User, AuditLog } from '../types/railpulse';
import {
  getStoredAuditLogs,
  subscribeToAuditLogs,
  seedInitialAuditLogs,
  recordAuditAction,
} from '../services/auditLogService';
import {
  TimelineCategory,
  buildGlobalActivityTimeline,
  recordPortalSwitchEvent,
} from '../services/activityTimelineService';
import { Language } from '../i18n/translations';
import { Clock, Activity, UserCheck, ArrowUpDown, ShieldAlert } from 'lucide-react';

interface GlobalActivityTimelineProps {
  language: Language;
  currentUser: User;
  refreshTick?: number;
  onRefreshData?: () => void;
}

export const GlobalActivityTimeline: React.FC<GlobalActivityTimelineProps> = ({
  language,
  currentUser,
  refreshTick = 0,
  onRefreshData,
}) => {
  const isRtl = language === 'fa';
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    seedInitialAuditLogs();
    return getStoredAuditLogs();
  });
  const [category, setCategory] = useState<TimelineCategory>('all');
  const [actorRole, setActorRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const unsub = subscribeToAuditLogs(() => {
      setLogs(getStoredAuditLogs());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setLogs(getStoredAuditLogs());
  }, [refreshTick]);

  const { items, metrics } = useMemo(
    () =>
      buildGlobalActivityTimeline(logs, {
        category,
        actorRole,
        searchQuery,
        sortOrder,
      }),
    [logs, category, actorRole, searchQuery, sortOrder]
  );

  const handleSimulateLogin = () => {
    recordAuditAction({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      actionType: 'user_login',
      entityType: 'user',
      entityId: currentUser.id,
      summaryFa: `ورود موفق کاربر «${currentUser.fullName}» به سامانه فرماندهی`,
      summaryEn: `Authenticated login by ${currentUser.fullName} to Command Center`,
      metadata: { username: currentUser.username },
      riskLevel: 'low',
      status: 'success',
    });
    setLogs(getStoredAuditLogs());
    onRefreshData?.();
  };

  const handleSimulatePortalSwitch = () => {
    recordPortalSwitchEvent(currentUser, 'admin', 'operations');
    setLogs(getStoredAuditLogs());
    onRefreshData?.();
  };

  return (
    <div
      data-testid="global-activity-timeline"
      className="no-print p-5 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {isRtl
                ? 'خط زمانی جامع فعالیت‌های سامانه (Global Activity Timeline)'
                : 'Global Activity Timeline'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-[10px]">
              LIVE STREAM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isRtl
              ? 'جریان زمانی و پیوسته کلیه رویدادهای سامانه شامل ورود کاربران، جابجایی بین پرتال‌ها، عملیات سیر و تراکنش‌های بلیت'
              : 'Chronological scrollable stream of all system events including user logins, portal switches, and dispatch actions'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimulateLogin}
            className="h-8 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer"
          >
            {isRtl ? '+ ثبت ورود آزمایشی کاربر' : '+ Simulate User Login'}
          </button>
          <button
            type="button"
            onClick={handleSimulatePortalSwitch}
            className="h-8 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold cursor-pointer"
          >
            {isRtl ? '+ ثبت جابجایی پرتال' : '+ Simulate Portal Switch'}
          </button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'کل رویدادهای ثبت‌شده' : 'Total Events'}</div>
          <div className="text-lg font-bold text-white font-mono mt-0.5">
            {metrics.totalEvents.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'ورود کاربران و تغییر نقش' : 'User Logins'}</div>
          <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
            {metrics.loginCount.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'جابجایی بین پرتال‌ها' : 'Portal Switches'}</div>
          <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">
            {metrics.portalSwitchCount.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="text-slate-400">{isRtl ? 'عملیات سیر و بلیت' : 'Ops & Ticketing'}</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {(metrics.dispatchAndOpsCount + metrics.ticketsAndWalletCount).toLocaleString(
              isRtl ? 'fa-IR' : 'en-US'
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Feed */}
      <div className="max-h-72 overflow-y-auto space-y-2 pe-1">
        {items.map((item) => (
          <div
            key={item.log.id}
            className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-white">{item.log.actorName}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]" dir="ltr">
                  {item.log.actionType}
                </span>
                {item.portalTransition && (
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono text-[10px]" dir="ltr">
                    [{item.portalTransition.fromPortal.toUpperCase()} → {item.portalTransition.toPortal.toUpperCase()}]
                  </span>
                )}
              </div>
              <p className="text-slate-300">
                {isRtl ? item.log.summaryFa : item.log.summaryEn}
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-400 shrink-0" dir="ltr">
              {item.log.timestamp.replace('T', ' ').slice(0, 19)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
