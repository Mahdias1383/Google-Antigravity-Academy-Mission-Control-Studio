import React, { useState } from 'react';
import {
  User,
  TrainLine,
  TrainSchedule,
  Ticket,
  WalletTransaction,
} from '../types/railpulse';
import { reserveTickets, depositToWallet } from '../services/bookingEngine';
import { Language } from '../i18n/translations';
import { Ticket as TicketIcon, Wallet, Train, CheckCircle, AlertCircle } from 'lucide-react';

interface PassengerPortalProps {
  currentUser: User;
  lines: TrainLine[];
  schedules: TrainSchedule[];
  tickets: Ticket[];
  transactions: WalletTransaction[];
  language: Language;
  onRefreshData: () => void;
}

export const PassengerPortal: React.FC<PassengerPortalProps> = ({
  currentUser,
  schedules,
  tickets,
  language,
  onRefreshData,
}) => {
  const isRtl = language === 'fa';
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id || '');
  const [seatCount, setSeatCount] = useState(1);
  const [depositAmount, setDepositAmount] = useState(1000000);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const res = reserveTickets(currentUser, selectedScheduleId, Number(seatCount));
    if (res.success) {
      setFeedback({
        ok: true,
        msg: isRtl
          ? `بلیت شما با کد پیگیری ${res.ticket?.pnr} صادر شد.`
          : `Ticket booked successfully: ${res.ticket?.pnr}`,
      });
      onRefreshData();
    } else {
      setFeedback({
        ok: false,
        msg: (isRtl ? res.errorMessageFa : res.errorMessageEn) || 'Error',
      });
    }
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = depositToWallet(currentUser, Number(depositAmount));
    if (res.success) {
      setFeedback({
        ok: true,
        msg: isRtl ? 'کیف پول با موفقیت شارژ شد.' : 'Wallet topped up successfully.',
      });
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.ok
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Train className="w-5 h-5 text-blue-400" />
            <span>{isRtl ? 'رزرو آنلاین بلیت قطار' : 'Online Train Reservation'}</span>
          </h2>
          <form onSubmit={handleBook} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-auto gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">{isRtl ? 'انتخاب قطار:' : 'Select Train:'}</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trainNumber} ({s.departureTime}) - {s.ticketPrice.toLocaleString()} TMN
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 font-semibold">{isRtl ? 'تعداد صندلی:' : 'Seats:'}</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={seatCount}
                  onChange={(e) => setSeatCount(Number(e.target.value))}
                  className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white font-mono"
                />
              </div>
            </div>
            <button type="submit" className="h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer">
              {isRtl ? 'خرید قطعی و صدور بلیت' : 'Confirm & Issue Ticket'}
            </button>
          </form>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>
              {isRtl ? 'کیف پول دیجیتال:' : 'Digital Wallet:'}{' '}
              <span className="font-mono text-emerald-400">
                {currentUser.walletBalance.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'تومان' : 'TMN'}
              </span>
            </span>
          </h2>
          <form onSubmit={handleDeposit} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 font-semibold">{isRtl ? 'مبلغ افزایش اعتبار (تومان):' : 'Top-up Amount (TMN):'}</label>
              <input
                type="number"
                step={100000}
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white font-mono"
              />
            </div>
            <button type="submit" className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer">
              {isRtl ? 'افزایش موجودی آنی' : 'Top Up Wallet'}
            </button>
          </form>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TicketIcon className="w-4 h-4 text-cyan-400" />
          <span>{isRtl ? 'بلیت‌های صادرشده مسافر' : 'Issued Boarding Passes'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {tickets.map((tk) => (
            <div key={tk.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-emerald-400" dir="ltr">{tk.pnr}</div>
                <div className="text-white font-semibold mt-0.5">{tk.trainNumber} — {isRtl ? tk.lineNameFa : tk.lineNameEn}</div>
              </div>
              <div className="text-end font-mono text-slate-300" dir="ltr">
                {tk.seatCount} Seats • {tk.totalPrice.toLocaleString()} TMN
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
