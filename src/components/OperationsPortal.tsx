import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrainSchedule,
  TrainLine,
  User,
} from '../types/railpulse';
import { checkAccident, calculateTrainTrajectory } from '../services/collisionEngine';
import { updateTrainSchedule, createTrainSchedule } from '../services/bookingEngine';
import { MareyScheduleGraph } from './MareyScheduleGraph';
import {
  LoadingFeedbackState,
  LoadingOperationType,
  createLoadingFeedbackState,
} from '../services/loadingFeedbackService';
import {
  PortalProgressBar,
  PortalLoadingSkeleton,
} from './PortalLoadingFeedback';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  PlusCircle,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Train,
  RefreshCw,
  Server,
} from 'lucide-react';

interface OperationsPortalProps {
  currentUser: User;
  lines: TrainLine[];
  schedules: TrainSchedule[];
  language: Language;
  onRefreshData: () => void;
}

export const OperationsPortal: React.FC<OperationsPortalProps> = ({
  currentUser,
  lines,
  schedules,
  language,
  onRefreshData,
}) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'fa';

  const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.id || '');
  const [editingSchedule, setEditingSchedule] = useState<TrainSchedule | null>(null);
  const [newTrainModalOpen, setNewTrainModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formTrainNumber, setFormTrainNumber] = useState('');
  const [formTrainNameFa, setFormTrainNameFa] = useState('');
  const [formDeparture, setFormDeparture] = useState('08:00');
  const [formSpeed, setFormSpeed] = useState(130);
  const [formCapacity, setFormCapacity] = useState(300);
  const [formPrice, setFormPrice] = useState(350000);

  const [loadingFeedback, setLoadingFeedback] = useState<LoadingFeedbackState>(() =>
    createLoadingFeedbackState('ops_corridor_switch', 0, false, false, false, 'marey_graph')
  );
  const loadingTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearLoadingTimers = () => {
    loadingTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    loadingTimersRef.current = [];
  };

  const triggerOpsLoadingFeedback = (
    operationType: LoadingOperationType,
    durationMs = 420
  ) => {
    clearLoadingTimers();

    setLoadingFeedback((prev) =>
      createLoadingFeedbackState(operationType, 34, true, true, prev.isPinnedPreview, 'marey_graph')
    );

    const stepMidTimer = setTimeout(() => {
      setLoadingFeedback((prev) =>
        createLoadingFeedbackState(operationType, 76, true, true, prev.isPinnedPreview, 'marey_graph')
      );
    }, Math.round(durationMs * 0.45));

    const stepFullTimer = setTimeout(() => {
      setLoadingFeedback((prev) =>
        createLoadingFeedbackState(operationType, 100, true, false, prev.isPinnedPreview, 'marey_graph')
      );
    }, Math.round(durationMs * 0.8));

    const completeTimer = setTimeout(() => {
      setLoadingFeedback((prev) =>
        createLoadingFeedbackState(
          operationType,
          prev.isPinnedPreview ? 72 : 100,
          false,
          false,
          prev.isPinnedPreview,
          'marey_graph'
        )
      );
    }, durationMs);

    loadingTimersRef.current = [stepMidTimer, stepFullTimer, completeTimer];
  };

  useEffect(() => {
    return () => clearLoadingTimers();
  }, []);

  const handleSelectCorridor = (nextLineId: string) => {
    setSelectedLineId(nextLineId);
    triggerOpsLoadingFeedback('ops_corridor_switch', 420);
  };

  const handleSyncCorridorSafety = () => {
    triggerOpsLoadingFeedback('ops_collision_recalc', 460);
    onRefreshData();
  };

  const handleToggleOpsSkeletonPreview = () => {
    clearLoadingTimers();
    setLoadingFeedback((prev) => {
      const nextPinned = !prev.isPinnedPreview;
      return createLoadingFeedbackState(
        'ops_collision_recalc',
        nextPinned ? 72 : 0,
        nextPinned,
        nextPinned,
        nextPinned,
        'marey_graph'
      );
    });
  };

  const selectedLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0];
  }, [lines, selectedLineId]);

  const conflicts = useMemo(() => {
    return checkAccident(schedules, lines);
  }, [schedules, lines]);

  const lineConflicts = useMemo(() => {
    return conflicts.filter((c) => c.lineId === selectedLineId);
  }, [conflicts, selectedLineId]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    const res = updateTrainSchedule(
      editingSchedule.id,
      {
        departureTime: editingSchedule.departureTime,
        speedKmh: Number(editingSchedule.speedKmh),
        totalCapacity: Number(editingSchedule.totalCapacity),
        ticketPrice: Number(editingSchedule.ticketPrice),
        status: editingSchedule.status,
      },
      currentUser
    );

    if (res.success) {
      triggerOpsLoadingFeedback('ops_schedule_mutation', 400);
      setToastMessage(
        isRtl
          ? `برنامه حرکت قطار ${editingSchedule.trainNumber} با موفقیت ذخیره شد.`
          : `Schedule for train ${editingSchedule.trainNumber} updated.`
      );
      setEditingSchedule(null);
      onRefreshData();
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCreateTrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTrainNumber) return;

    const res = createTrainSchedule(
      {
        trainNumber: formTrainNumber,
        trainNameFa: formTrainNameFa || `قطار تندرو ${formTrainNumber}`,
        trainNameEn: `Express ${formTrainNumber}`,
        lineId: selectedLineId,
        departureTime: formDeparture,
        speedKmh: Number(formSpeed),
        stopTimesMinutes: [10, 10, 10],
        totalCapacity: Number(formCapacity),
        ticketPrice: Number(formPrice),
        trainType: 'express',
        status: 'scheduled',
      },
      currentUser
    );

    if (res.success) {
      triggerOpsLoadingFeedback('ops_schedule_mutation', 400);
      setToastMessage(
        isRtl
          ? `قطار جدید ${formTrainNumber} زمان‌بندی شد.`
          : `New train ${formTrainNumber} scheduled.`
      );
      setNewTrainModalOpen(false);
      setFormTrainNumber('');
      onRefreshData();
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="p-4 bg-emerald-950 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs text-emerald-400 underline">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Train className="w-5 h-5 text-blue-400 shrink-0" />
            <span>{t.operationsPortal}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'پایش حرکت قطارها، بهینه‌سازی جداول زمانی و پیشگیری لحظه‌ای از سوانح با الگوریتم checkAccident'
              : 'Real-time timetable dispatching and collision mitigation via mathematical checkAccident engine'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <label className="text-xs text-slate-300 font-semibold whitespace-nowrap">
            {isRtl ? 'انتخاب خط سیر:' : 'Select Corridor:'}
          </label>
          <select
            data-testid="ops-corridor-select"
            value={selectedLineId}
            onChange={(e) => handleSelectCorridor(e.target.value)}
            className="h-9 bg-slate-800 border border-slate-600 text-white text-xs rounded-xl px-3 font-medium cursor-pointer shrink-0"
          >
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {isRtl ? l.nameFa : l.nameEn} ({l.totalDistanceKm} km)
              </option>
            ))}
          </select>

          <button
            type="button"
            data-testid="ops-sync-corridor-btn"
            onClick={handleSyncCorridorSafety}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{isRtl ? 'همگام‌سازی گراف و ایمنی' : 'Sync Timetable'}</span>
          </button>

          <button
            type="button"
            data-testid="ops-toggle-skeleton-preview-btn"
            onClick={handleToggleOpsSkeletonPreview}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer whitespace-nowrap shrink-0 ${
              loadingFeedback.isPinnedPreview
                ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400/60 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              {loadingFeedback.isPinnedPreview
                ? isRtl
                  ? 'پایان پیش‌نمایش بارگذاری'
                  : 'Exit Loading View'
                : isRtl
                ? 'تست اسکلت بارگذاری'
                : 'Loading Skeleton'}
            </span>
          </button>

          <button
            onClick={() => setNewTrainModalOpen(true)}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-lg shadow-blue-900/30 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{isRtl ? 'ثبت قطار جدید در برنامه' : 'Schedule New Train'}</span>
          </button>
        </div>
      </div>

      <PortalProgressBar
        state={loadingFeedback}
        language={language}
        portalName="operations"
      />
      <PortalLoadingSkeleton
        state={loadingFeedback}
        language={language}
        portalName="operations"
      />

      {lineConflicts.length === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 shadow">
          <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div className="text-xs space-y-0.5">
            <div className="font-bold text-sm text-emerald-200">{t.collisionEngineTitle}</div>
            <p>{t.noHazardsDetected}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 shadow-xl">
            <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-sm text-rose-100">{t.hazardsDetectedTitle}</div>
            </div>
          </div>
        </div>
      )}

      {selectedLine && (
        <MareyScheduleGraph
          line={selectedLine}
          schedules={schedules}
          conflicts={conflicts}
          language={language}
        />
      )}

      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 shadow-xl overflow-hidden space-y-3 p-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          {isRtl ? `جدول زمان‌بندی قطارهای ${selectedLine?.nameFa}` : `Timetable: ${selectedLine?.nameEn}`}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-200">
            <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3 px-4 text-start">{isRtl ? 'شماره و نام قطار' : 'Train No. & Name'}</th>
                <th className="py-3 px-4 text-start">{t.departureTime}</th>
                <th className="py-3 px-4 text-center">{t.trainSpeed}</th>
                <th className="py-3 px-4 text-center">{t.trainCapacity}</th>
                <th className="py-3 px-4 text-center">{t.bookedCount}</th>
                <th className="py-3 px-4 text-center">{t.priceToman}</th>
                <th className="py-3 px-4 text-center">{isRtl ? 'اقدامات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {schedules
                .filter((s) => s.lineId === selectedLineId)
                .map((train) => {
                  const traj = selectedLine ? calculateTrainTrajectory(train, selectedLine) : null;
                  const finalArr = traj?.timePoints[traj.timePoints.length - 1]?.arrivalTimeStr;
                  return (
                    <tr key={train.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{train.trainNumber}</div>
                        <div className="text-[11px] text-slate-400">{isRtl ? train.trainNameFa : train.trainNameEn}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-emerald-400 font-semibold" dir="ltr">
                        {train.departureTime}
                        {finalArr && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            → {finalArr}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono" dir="ltr">
                        {train.speedKmh} km/h
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono">{train.totalCapacity}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono">{train.bookedSeats}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono text-amber-300">
                        {train.ticketPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setEditingSchedule({ ...train })}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-amber-400" />
                          <span>{isRtl ? 'ویرایش' : 'Edit'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isRtl ? `ویرایش زمان‌بندی قطار ${editingSchedule.trainNumber}` : `Edit Train ${editingSchedule.trainNumber}`}
            </h3>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.departureTime}</label>
                  <input
                    type="text"
                    value={editingSchedule.departureTime}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, departureTime: e.target.value })}
                    className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white font-mono"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.trainSpeed}</label>
                  <input
                    type="number"
                    value={editingSchedule.speedKmh}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, speedKmh: Number(e.target.value) })}
                    className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingSchedule(null)} className="h-9 px-4 rounded-xl bg-slate-800 text-slate-300">
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button type="submit" className="h-9 px-5 rounded-xl bg-amber-600 text-white font-semibold">
                  {isRtl ? 'ذخیره' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newTrainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {isRtl ? 'تعریف قطار جدید' : 'Schedule New Train'}
            </h3>
            <form onSubmit={handleCreateTrain} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'شماره قطار:' : 'Train Number:'}</label>
                  <input
                    type="text"
                    value={formTrainNumber}
                    onChange={(e) => setFormTrainNumber(e.target.value)}
                    className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.departureTime}</label>
                  <input
                    type="text"
                    value={formDeparture}
                    onChange={(e) => setFormDeparture(e.target.value)}
                    className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setNewTrainModalOpen(false)} className="h-9 px-4 rounded-xl bg-slate-800 text-slate-300">
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button type="submit" className="h-9 px-5 rounded-xl bg-blue-600 text-white font-semibold">
                  {isRtl ? 'ثبت' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
