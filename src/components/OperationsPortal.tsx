import React, { useState, useMemo } from 'react';
import {
  TrainSchedule,
  TrainLine,
  User,
  SafetyConflict,
} from '../types/railpulse';
import { checkAccident, calculateTrainTrajectory } from '../services/collisionEngine';
import { updateTrainSchedule, createTrainSchedule } from '../services/bookingEngine';
import { MareyScheduleGraph } from './MareyScheduleGraph';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Clock,
  Gauge,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Train,
  Check,
  X,
  Sparkles,
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

  // Form states for new train
  const [formTrainNumber, setFormTrainNumber] = useState('');
  const [formTrainNameFa, setFormTrainNameFa] = useState('');
  const [formDeparture, setFormDeparture] = useState('08:00');
  const [formSpeed, setFormSpeed] = useState(130);
  const [formCapacity, setFormCapacity] = useState(300);
  const [formPrice, setFormPrice] = useState(350000);

  const selectedLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0];
  }, [lines, selectedLineId]);

  // Live Collision Detection calculations
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
      setToastMessage(
        isRtl
          ? `برنامه حرکت قطار ${editingSchedule.trainNumber} با موفقیت ذخیره و در سامانه حسابرسی ثبت شد.`
          : `Schedule for train ${editingSchedule.trainNumber} successfully updated and audited.`
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
      setToastMessage(
        isRtl
          ? `قطار جدید ${formTrainNumber} در خط ${selectedLine?.nameFa} زمان‌بندی شد.`
          : `New train ${formTrainNumber} scheduled successfully.`
      );
      setNewTrainModalOpen(false);
      setFormTrainNumber('');
      onRefreshData();
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-xs text-emerald-400 underline">
            ✕
          </button>
        </div>
      )}

      {/* Corridor Line Selector Header */}
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
            value={selectedLineId}
            onChange={(e) => setSelectedLineId(e.target.value)}
            className="h-9 bg-slate-800 border border-slate-600 text-white text-xs rounded-xl px-3 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
          >
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {isRtl ? l.nameFa : l.nameEn} ({l.totalDistanceKm} km)
              </option>
            ))}
          </select>

          <button
            onClick={() => setNewTrainModalOpen(true)}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-lg shadow-blue-900/30 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{isRtl ? 'ثبت قطار جدید در برنامه' : 'Schedule New Train'}</span>
          </button>
        </div>
      </div>

      {/* Safety Collision Engine Status Banner */}
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
            <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 animate-bounce" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-sm text-rose-100 flex items-center gap-2">
                <span>{t.hazardsDetectedTitle}</span>
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-bold">
                  {lineConflicts.length} {isRtl ? 'مورد تداخل' : 'Conflicts'}
                </span>
              </div>
              <p className="text-rose-200">
                {isRtl
                  ? 'برنامه حرکت جاری دارای ریسک برخورد در بلاک یا تداخل همزمان سکو است. جزئیات و اثبات ریاضی را در زیر بررسی نمایید.'
                  : 'Current schedules contain spatial overlaps or block overtakes. Review mathematical proofs below.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lineConflicts.map((conf) => (
              <div
                key={conf.id}
                className="p-4 rounded-xl bg-slate-900 border border-rose-800/60 shadow space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-rose-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    {conf.locationName}
                  </span>
                  <span className="font-mono text-rose-200 bg-rose-950 px-2 py-0.5 rounded border border-rose-700/50">
                    {conf.estimatedConflictTime}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{isRtl ? conf.detailsFa : conf.detailsEn}</p>
                <div className="p-2 rounded bg-black/60 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto text-start" dir="ltr">
                  {conf.mathematicalProof}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Marey Time-Distance Schedule Graph */}
      {selectedLine && (
        <MareyScheduleGraph
          line={selectedLine}
          schedules={schedules}
          conflicts={conflicts}
          language={language}
        />
      )}

      {/* Train Schedule Table */}
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
                <th className="py-3 px-4 text-center">{isRtl ? 'وضعیت' : 'Status'}</th>
                <th className="py-3 px-4 text-center">{isRtl ? 'اقدامات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {schedules
                .filter((s) => s.lineId === selectedLineId)
                .map((train) => {
                  const remaining = train.totalCapacity - train.bookedSeats;
                  const traj = selectedLine ? calculateTrainTrajectory(train, selectedLine) : null;
                  const finalArr = traj?.timePoints[traj.timePoints.length - 1]?.arrivalTimeStr;

                  return (
                    <tr key={train.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{train.trainNumber}</div>
                        <div className="text-[11px] text-slate-400">{isRtl ? train.trainNameFa : train.trainNameEn}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-emerald-400 font-semibold">
                        {train.departureTime}
                        {finalArr && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {isRtl ? `ورود مقصد: ${finalArr}` : `Arrival: ${finalArr}`}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                          {train.speedKmh} km/h
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono">{train.totalCapacity}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className="font-mono text-slate-200">{train.bookedSeats}</span>
                        <span className="text-[10px] text-emerald-400 block">
                          ({remaining} {isRtl ? 'صندلی خالی' : 'free'})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono text-amber-300">
                        {train.ticketPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {train.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setEditingSchedule({ ...train })}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 transition cursor-pointer inline-flex items-center gap-1"
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

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isRtl ? `ویرایش زمان‌بندی قطار ${editingSchedule.trainNumber}` : `Edit Train ${editingSchedule.trainNumber}`}</span>
              </h3>
              <button
                onClick={() => setEditingSchedule(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.departureTime} (HH:MM)</label>
                  <input
                    type="text"
                    value={editingSchedule.departureTime}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, departureTime: e.target.value })}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.trainSpeed} (km/h)</label>
                  <input
                    type="number"
                    value={editingSchedule.speedKmh}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, speedKmh: Number(e.target.value) })}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    min="40"
                    max="300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.trainCapacity}</label>
                  <input
                    type="number"
                    value={editingSchedule.totalCapacity}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, totalCapacity: Number(e.target.value) })}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    min="50"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.priceToman}</label>
                  <input
                    type="number"
                    value={editingSchedule.ticketPrice}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, ticketPrice: Number(e.target.value) })}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    step="10000"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl text-amber-200 text-[11px] leading-relaxed">
                {isRtl
                  ? 'توجه: هرگونه تغییر در زمان حرکت یا سرعت قطار به‌صورت خودکار در لاگ حسابرسی امنیتی (Activity Monitor) ثبت و امضا می‌شود.'
                  : 'Notice: Modifications to departure time or speed are automatically tracked in the Admin Activity Monitor audit log.'}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="h-9 px-4 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition cursor-pointer shadow-lg shadow-amber-900/30"
                >
                  {isRtl ? 'ذخیره تغییرات و اعمال' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Train Modal */}
      {newTrainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{isRtl ? `تعریف قطار جدید در خط ${selectedLine?.nameFa}` : `Schedule New Train on ${selectedLine?.nameEn}`}</span>
              </h3>
              <button
                onClick={() => setNewTrainModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrain} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'شماره قطار (کد سیر):' : 'Train Number:'}</label>
                  <input
                    type="text"
                    value={formTrainNumber}
                    onChange={(e) => setFormTrainNumber(e.target.value)}
                    placeholder="۱۰۴ صبا"
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{isRtl ? 'نام قطار و کلاس سرویس:' : 'Train Name & Class:'}</label>
                  <input
                    type="text"
                    value={formTrainNameFa}
                    onChange={(e) => setFormTrainNameFa(e.target.value)}
                    placeholder="قطار تندرو ۴ ستاره صبا"
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.departureTime} (HH:MM)</label>
                  <input
                    type="text"
                    value={formDeparture}
                    onChange={(e) => setFormDeparture(e.target.value)}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.trainSpeed} (km/h)</label>
                  <input
                    type="number"
                    value={formSpeed}
                    onChange={(e) => setFormSpeed(Number(e.target.value))}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    min="60"
                    max="250"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-auto gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.trainCapacity}</label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    min="50"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 font-semibold">{t.priceToman}</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full h-10 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3 text-white font-mono focus:outline-none"
                    step="10000"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewTrainModalOpen(false)}
                  className="h-9 px-4 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer shadow-lg shadow-blue-900/30"
                >
                  {isRtl ? 'ثبت و ثبت در لاگ حسابرسی' : 'Schedule & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
