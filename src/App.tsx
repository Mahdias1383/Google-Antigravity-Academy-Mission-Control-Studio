import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, TrainLine, TrainSchedule, Ticket, WalletTransaction } from './types/railpulse';
import { getDatabase, INITIAL_USERS } from './services/storageAndMigration';
import { getCurrentUser, setCurrentUser, switchPersona } from './services/authService';
import { seedInitialAuditLogs, subscribeToAuditLogs } from './services/auditLogService';
import { QuickRoleSwitcherBar } from './components/QuickRoleSwitcherBar';
import { AdminPortal } from './components/AdminPortal';
import { OperationsPortal } from './components/OperationsPortal';
import { PassengerPortal } from './components/PassengerPortal';
import { QaTestSuiteModal } from './components/QaTestSuiteModal';
import { Language, TRANSLATIONS } from './i18n/translations';

export default function App() {
  const [language, setLanguage] = useState<Language>('fa'); // Persian RTL default
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [currentUser, setCurrentUserState] = useState<User>(() => getCurrentUser());
  const [activePortal, setActivePortal] = useState<'admin' | 'operations' | 'passenger' | 'qa-suite'>('admin');

  // Database State
  const [database, setDatabase] = useState(() => {
    seedInitialAuditLogs();
    return getDatabase();
  });

  const refreshAllData = useCallback(() => {
    const freshDb = getDatabase();
    setDatabase(freshDb);
    const refreshedUser = freshDb.users.find((u) => u.id === currentUser.id) || freshDb.users[0];
    setCurrentUserState(refreshedUser);
  }, [currentUser.id]);

  // Handle language and direction changes
  useEffect(() => {
    const isRtl = language === 'fa';
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  // Handle dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Subscribe to automated audit log changes so data stays synchronized
  useEffect(() => {
    const unsub = subscribeToAuditLogs(() => {
      // Background synchronization
    });
    return () => unsub();
  }, []);

  const handleSwitchRole = (role: UserRole) => {
    const updated = switchPersona(role);
    setCurrentUserState(updated);
  };

  const t = TRANSLATIONS[language];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        darkMode ? 'bg-[#090d16] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Quick Role Switcher Bar */}
      <QuickRoleSwitcherBar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        activePortal={activePortal}
        onSelectPortal={setActivePortal}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'fa' ? 'en' : 'fa'))}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activePortal === 'admin' && (
          <AdminPortal
            currentUser={currentUser}
            lines={database.lines}
            schedules={database.schedules}
            tickets={database.tickets}
            transactions={database.transactions}
            language={language}
            onRefreshData={refreshAllData}
          />
        )}

        {activePortal === 'operations' && (
          <OperationsPortal
            currentUser={currentUser}
            lines={database.lines}
            schedules={database.schedules}
            language={language}
            onRefreshData={refreshAllData}
          />
        )}

        {activePortal === 'passenger' && (
          <PassengerPortal
            currentUser={currentUser}
            lines={database.lines}
            schedules={database.schedules}
            tickets={database.tickets}
            transactions={database.transactions}
            language={language}
            onRefreshData={refreshAllData}
          />
        )}

        {activePortal === 'qa-suite' && (
          <QaTestSuiteModal
            language={language}
            onRefreshData={refreshAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
          <span>RailPulse Enterprise v2.0 • High-Speed Railway Dispatching & Safety Platform</span>
          <span>Bilingual RTL/LTR Architecture • Automated Audit Logging Active</span>
        </div>
      </footer>
    </div>
  );
}
