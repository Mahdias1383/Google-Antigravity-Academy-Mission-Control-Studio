import React, { useState, useMemo } from 'react';
import {
  User,
  TrainSchedule,
  TrainLine,
  Ticket,
  WalletTransaction,
} from '../types/railpulse';
import { reserveTickets, cancelTicket, topUpWallet } from '../services/bookingEngine';
import { Language, TRANSLATIONS } from '../i18n/translations';
import {
  Ticket as TicketIcon,
  Wallet,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  ArrowRight,
  Clock,
  Train,
  Check,
  CreditCard,
  MapPin,
  Sparkles,
} from 'lucide-react';

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
  lines,
  schedules,
  tickets,
  transactions,
  language,
  onRefreshData,
}) => {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'fa';

  const [selectedLineId, setSelectedLineId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'browse' | 'my-tickets' | 'wallet'>('browse');

  // Booking modal state
  const [bookingTrain, setBookingTrain] = useState<TrainSchedule | null>(null);
  const [selectedSeatCount, setSelectedSeatCount] = useState<number>(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessTicket, setBookingSuccessTicket] = useState<Ticket | null>(null);

  // Wallet top-up modal state
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(1000000); // 1,000,000 Tomans
  const [walletNotice, setWalletNotice] = useState<string | null>(null);

  // Inspection modal for QR boarding pass
  const [inspectTicket, setInspectTicket] = useState<Ticket | null>(null);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (s.status === 'cancelled') return false;
      if (selectedLineId !== 'all' && s.lineId !== selectedLineId) return false;
      return true;
    });
  }, [schedules, selectedLineId]);

  const userTickets = useMemo(() => {
    return tickets.filter((tk) => tk.passengerId === currentUser.id);
  }, [tickets, currentUser.id]);

  const userTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.userId === currentUser.id);
  }, [transactions, currentUser.id]);

  const handleExecuteBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTrain) return;

    setBookingError(null);
    const line = lines.find((l) => l.id === bookingTrain.lineId);
    const depStation = line?.stations[0]?.nameFa || 'تهران (مرکزی)';
    const arrStation = line?.stations[line?.stations.length - 1]?.nameFa || 'مشهد مقدس';

    const result = reserveTickets(
      currentUser,
      bookingTrain.id,
      selectedSeatCount,
      depStation,
      arrStation
    );

    if (result.success && result.ticket) {
      setBookingSuccessTicket(result.ticket);
      setBookingTrain(null);
      setSelectedSeatCount(1);
      onRefreshData();
    } else {
      setBookingError(isRtl ? result.errorMessageFa || 'خطا در انجام تراکنش' : result.errorMessageEn || 'Transaction failed');
    }
  };

  const handleCancelTicket = (ticketId: string) => {
    if (confirm(isRtl ? 'آیا از لغو این بلیت و استرداد وجه به کیف پول اطمینان دارید؟' : 'Are you sure you want to cancel this ticket and receive a full refund?')) {
      const res = cancelTicket(ticketId, currentUser);
      if (res.success) {
        onRefreshData();
      }
    }
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = topUpWallet(currentUser, Number(topUpAmount));
    if (res.success) {
      setTopUpModalOpen(false);
      setWalletNotice(
        isRtl
          ? `کیف پول شما به مبلغ ${Number(topUpAmount).toLocaleString('fa-IR')} تومان شارژ شد.`
          : `Wallet topped up with ${Number(topUpAmount).toLocaleString('en-US')} Tomans.`
      );
      onRefreshData();
      setTimeout(() => setWalletNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Success Toast */}
      {walletNotice && (
        <div className="p-4 bg-emerald-950 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{walletNotice}</span>
          </div>
          <button onClick={() => setWalletNotice(null)} className="text-xs text-emerald-400 underline">
            ✕
          </button>
        </div>
      )}

      {/* Top Banner with Passenger Info & Wallet Balance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 border border-slate-700 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{currentUser.fullName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-normal">
                {isRtl ? 'مسافر تایید شده' : 'Verified Passenger'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
          </div>
        </div>

        {/* Digital Wallet Card */}
        <div className="flex items-center gap-4 bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">{t.walletBalance}</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {currentUser.walletBalance.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                <span className="text-[11px] text-slate-400 font-normal">{isRtl ? 'تومان' : 'TMN'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setTopUpModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t.topUpWallet}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'browse'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Train className="w-4 h-4" />
          <span>{t.searchTrains}</span>
        </button>

        <button
          onClick={() => setActiveTab('my-tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'my-tickets'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>{t.myTickets}</span>
          {userTickets.filter((tk) => tk.status === 'confirmed').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white">
              {userTickets.filter((tk) => tk.status === 'confirmed').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'wallet'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isRtl ? 'گردش حساب و تراکنش‌ها' : 'Wallet Ledger'}</span>
        </button>
      </div>

      {/* Tab 1: Browse & Book Trains */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Corridor Filter */}
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>{isRtl ? 'فیلتر بر اساس مسیر ریلی:' : 'Filter by Route Corridor:'}</span>
            </div>
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">{isRtl ? 'همه خطوط سراسری' : 'All National Corridors'}</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {isRtl ? l.nameFa : l.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Train Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map((train) => {
              const line = lines.find((l) => l.id === train.lineId);
              const remaining = train.totalCapacity - train.bookedSeats;
              const isFull = remaining <= 0;

              return (
                <div
                  key={train.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-700/40">
                        {train.trainNumber}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {train.speedKmh} km/h
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                        {isRtl ? train.trainNameFa : train.trainNameEn}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{isRtl ? line?.nameFa : line?.nameEn}</p>
                    </div>

                    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          {t.departureTime}:
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{train.departureTime}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">{t.availableSeats}:</span>
                        <span className={`font-mono font-semibold ${isFull ? 'text-rose-400' : 'text-slate-200'}`}>
                          {isFull ? (isRtl ? 'تکمیل ظرفیت' : 'Sold Out') : `${remaining} ${isRtl ? 'صندلی' : 'seats'}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">{isRtl ? 'بهای بلیت هر مسافر:' : 'Ticket Price:'}</div>
                      <div className="text-sm font-bold text-amber-400 font-mono">
                        {train.ticketPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{isRtl ? 'تومان' : 'TMN'}</span>
                      </div>
                    </div>

                    <button
                      disabled={isFull}
                      onClick={() => {
                        setBookingTrain(train);
                        setSelectedSeatCount(1);
                        setBookingError(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-lg ${
                        isFull
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30'
                      }`}
                    >
                      <TicketIcon className="w-3.5 h-3.5" />
                      <span>{t.bookTicket}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: My Booked Tickets */}
      {activeTab === 'my-tickets' && (
        <div className="space-y-4">
          {userTickets.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
              <TicketIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">{isRtl ? 'شما تاکنون بلیتی رزرو نکرده‌اید.' : 'You have no booked tickets yet.'}</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                {t.searchTrains}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTickets.map((tk) => {
                const isCancelled = tk.status === 'cancelled';
                return (
                  <div
                    key={tk.id}
                    className={`p-5 rounded-2xl border shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden ${
                      isCancelled
                        ? 'bg-slate-900/50 border-slate-800 opacity-60'
                        : 'bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950/40 border-slate-700/80'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Train className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-white text-sm">{tk.trainNumber}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isCancelled ? (isRtl ? 'لغو شده' : 'Cancelled') : (isRtl ? 'تایید شده' : 'Confirmed')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                          <span>PNR: <strong className="text-blue-300">{tk.pnr}</strong></span>
                          <span>{tk.departureTime}</span>
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {tk.departureStation} ➔ {tk.arrivalStation}
                        </div>
                        <div className="text-xs text-slate-300">
                          {isRtl ? `صندلی‌های تخصیص‌یافته: ${tk.seatNumbers.join('، ')}` : `Assigned Seats: ${tk.seatNumbers.join(', ')}`}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs">
                        <span className="text-slate-400">{isRtl ? 'مبلغ کل پرداختی:' : 'Total Amount Paid:'}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {tk.totalPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'تومان' : 'TMN'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setInspectTicket(tk)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600 transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.boardingPass}</span>
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelTicket(tk.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-medium border border-rose-700/50 transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>{t.cancelAndRefund}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Wallet Ledger */}
      {activeTab === 'wallet' && (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              {isRtl ? 'دفتر کل و سوابق تراکنش‌های مالی مسافر' : 'Immutable Wallet Ledger'}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {userTransactions.length} {isRtl ? 'تراکنش' : 'records'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-200">
              <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 text-start">{isRtl ? 'زمان تراکنش' : 'Timestamp'}</th>
                  <th className="py-2.5 px-3 text-start">{isRtl ? 'نوع' : 'Type'}</th>
                  <th className="py-2.5 px-3 text-start">{isRtl ? 'کد رهگیری / مرجع' : 'Reference'}</th>
                  <th className="py-2.5 px-3 text-start">{isRtl ? 'شرح تراکنش' : 'Description'}</th>
                  <th className="py-2.5 px-3 text-end">{isRtl ? 'مبلغ' : 'Amount'}</th>
                  <th className="py-2.5 px-3 text-end">{isRtl ? 'موجودی پس از عملیات' : 'Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {userTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tx.type === 'credit' || tx.type === 'refund'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/30'
                            : 'bg-rose-950 text-rose-300 border border-rose-600/30'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{tx.referenceId}</td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs">{isRtl ? tx.descriptionFa : tx.descriptionEn}</td>
                    <td
                      className={`py-3 px-3 text-end font-mono font-bold ${
                        tx.type === 'credit' || tx.type === 'refund' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'debit' ? '-' : '+'}
                      {tx.amount.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                    </td>
                    <td className="py-3 px-3 text-end font-mono text-slate-200">
                      {tx.newBalance.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingTrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-blue-400" />
                {isRtl ? `رزرو بلیت قطار ${bookingTrain.trainNumber}` : `Book Train ${bookingTrain.trainNumber}`}
              </h3>
              <button
                onClick={() => setBookingTrain(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteBooking} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-700">
                <div className="flex justify-between text-slate-300">
                  <span>{isRtl ? 'قطار انتخابی:' : 'Selected Train:'}</span>
                  <span className="font-semibold text-white">{isRtl ? bookingTrain.trainNameFa : bookingTrain.trainNameEn}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{t.departureTime}:</span>
                  <span className="font-mono text-emerald-400 font-bold">{bookingTrain.departureTime}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isRtl ? 'قیمت هر صندلی:' : 'Unit Price:'}</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {bookingTrain.ticketPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'تومان' : 'TMN'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">{isRtl ? 'تعداد صندلی درخواستی:' : 'Seat Count:'}</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setSelectedSeatCount(cnt)}
                      className={`flex-1 py-2.5 rounded-xl font-bold transition cursor-pointer border ${
                        selectedSeatCount === cnt
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-blue-950/50 border border-blue-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{isRtl ? 'مجموع قابل پرداخت:' : 'Total Payable:'}</span>
                  <span className="text-base font-bold text-amber-300 font-mono">
                    {(selectedSeatCount * bookingTrain.ticketPrice).toLocaleString(isRtl ? 'fa-IR' : 'en-US')}{' '}
                    <span className="text-xs text-slate-400 font-normal">{isRtl ? 'تومان' : 'TMN'}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>{isRtl ? 'موجودی فعلی کیف پول:' : 'Current Wallet:'}</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {currentUser.walletBalance.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'تومان' : 'TMN'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBookingTrain(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  {isRtl ? 'تایید و صدور بلیت' : 'Confirm & Reserve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingSuccessTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/60 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {isRtl ? 'رزرو بلیت با موفقیت انجام شد!' : 'Ticket Successfully Booked!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isRtl ? 'این رویداد بلافاصله در لاگ حسابرسی امنیتی سامانه (Audit Log) ثبت گردید.' : 'This action has been audited and recorded in the system ledger.'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2 text-start">
              <div className="flex justify-between">
                <span className="text-slate-400">PNR:</span>
                <span className="font-mono font-bold text-blue-400 text-sm">{bookingSuccessTicket.pnr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isRtl ? 'قطار:' : 'Train:'}</span>
                <span className="text-white font-semibold">{bookingSuccessTicket.trainNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isRtl ? 'صندلی‌ها:' : 'Seats:'}</span>
                <span className="font-mono text-emerald-400 font-bold">{bookingSuccessTicket.seatNumbers.join('، ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isRtl ? 'مبلغ کسر شده:' : 'Deducted:'}</span>
                <span className="font-mono text-amber-300 font-bold">
                  {bookingSuccessTicket.totalPrice.toLocaleString(isRtl ? 'fa-IR' : 'en-US')} {isRtl ? 'تومان' : 'TMN'}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setInspectTicket(bookingSuccessTicket);
                  setBookingSuccessTicket(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                {t.boardingPass}
              </button>
              <button
                onClick={() => setBookingSuccessTicket(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isRtl ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boarding Pass / QR Modal */}
      {inspectTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.boardingPass}</span>
              <button
                onClick={() => setInspectTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* QR Simulation Card */}
            <div className="p-4 bg-white rounded-2xl text-slate-950 inline-block shadow-xl">
              <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center border-4 border-slate-950 p-2 rounded-lg bg-slate-50">
                <QrCode className="w-36 h-36 text-slate-950" />
                <span className="text-[10px] font-mono font-bold mt-1 tracking-widest">{inspectTicket.pnr}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-base font-bold text-white">{inspectTicket.passengerName}</div>
              <div className="text-slate-400 font-mono text-[11px]">{inspectTicket.lineNameFa}</div>
              <div className="text-emerald-400 font-bold font-mono">
                {isRtl ? `صندلی: ${inspectTicket.seatNumbers.join('، ')}` : `Seats: ${inspectTicket.seatNumbers.join(', ')}`}
              </div>
            </div>

            <button
              onClick={() => setInspectTicket(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              {isRtl ? 'بستن کارت پرواز' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* Top-Up Wallet Modal */}
      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                {t.topUpWallet}
              </h3>
              <button
                onClick={() => setTopUpModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">{isRtl ? 'مبلغ شارژ (تومان):' : 'Amount (Tomans):'}</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  step="100000"
                  min="100000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[500000, 1000000, 2000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-[11px] cursor-pointer"
                  >
                    {amt.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl text-[11px] text-slate-400">
                {isRtl
                  ? 'این شارژ به‌صورت آنی در کیف پول دیجیتال اعمال شده و رویداد آن در Activity Monitor ذخیره خواهد شد.'
                  : 'Balance is credited instantaneously and audited in the Activity Monitor.'}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTopUpModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  {isRtl ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition cursor-pointer"
                >
                  {isRtl ? 'شارژ آنلاین کیف پول' : 'Confirm Top-Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
