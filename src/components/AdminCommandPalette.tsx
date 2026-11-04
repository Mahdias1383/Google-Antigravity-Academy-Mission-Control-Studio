import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminViewTabId,
  AdminQuickActionKey,
  CommandPaletteItem,
  getDefaultAdminCommands,
  filterCommandPaletteItems,
  moveCommandSelection,
} from '../services/commandPaletteService';
import { Language } from '../i18n/translations';
import { Command, Search, ArrowRight, Zap, Compass, X } from 'lucide-react';

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AdminViewTabId;
  onSelectTab: (tab: AdminViewTabId, commandTitle: string) => void;
  onExecuteAction: (actionKey: AdminQuickActionKey, commandTitle: string) => void;
  language: Language;
}

export const AdminCommandPalette: React.FC<AdminCommandPaletteProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onExecuteAction,
  language,
}) => {
  const isRtl = language === 'fa';
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'navigation' | 'quick_action'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allCommands = useMemo(() => getDefaultAdminCommands(), []);
  const filtered = useMemo(
    () => filterCommandPaletteItems(allCommands, query, categoryFilter),
    [allCommands, query, categoryFilter]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, categoryFilter, isOpen]);

  if (!isOpen) return null;

  const executeItem = (item: CommandPaletteItem) => {
    const title = isRtl ? item.titleFa : item.titleEn;
    if (item.targetTab) {
      onSelectTab(item.targetTab, title);
    } else if (item.actionKey) {
      onExecuteAction(item.actionKey, title);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => moveCommandSelection(prev, filtered.length, 'down'));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => moveCommandSelection(prev, filtered.length, 'up'));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      executeItem(filtered[selectedIndex]);
    }
  };

  return (
    <div
      data-testid="admin-command-palette-modal"
      className="no-print fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-black/80 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Command className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            data-testid="command-palette-input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isRtl
                ? 'جستجوی سریع نماها (Audit Logs, Performance Dashboard, System Settings)...'
                : 'Type a command or search views (Audit Logs, Performance Dashboard, System Settings)...'
            }
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 text-xs">
          {(['all', 'navigation', 'quick_action'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat === 'all'
                ? isRtl
                  ? 'همه دستورات'
                  : 'All'
                : cat === 'navigation'
                ? isRtl
                  ? 'ناوبری نماها'
                  : 'Navigation'
                : isRtl
                ? 'عملیات سریع'
                : 'Quick Actions'}
            </button>
          ))}
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const isCurrentTab = item.targetTab && item.targetTab === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`command-item-${item.id}`}
                onClick={() => executeItem(item)}
                className={`w-full p-3 rounded-xl flex items-center justify-between gap-3 text-start transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/25 border border-indigo-500/50 text-white'
                    : 'hover:bg-slate-800/70 text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.category === 'navigation' ? (
                    <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="truncate">{isRtl ? item.titleFa : item.titleEn}</span>
                      {isCurrentTab && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                          {isRtl ? 'فعال' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {isRtl ? item.subtitleFa : item.subtitleEn}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <kbd
                    dir="ltr"
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[10px] text-slate-300"
                  >
                    {item.shortcutHint}
                  </kbd>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
