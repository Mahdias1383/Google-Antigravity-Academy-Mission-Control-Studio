export type MissionThemePresetId = 'midnight' | 'deep-space';

export interface MissionThemePresetConfig {
  id: MissionThemePresetId;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
  contrastRatioLabel: string;
  badgeText: string;
}

const THEME_STORAGE_KEY = 'railpulse_mission_theme_preset_v1';
let memoryThemePreset: MissionThemePresetId = 'midnight';

const PRESETS: Record<MissionThemePresetId, MissionThemePresetConfig> = {
  midnight: {
    id: 'midnight',
    nameFa: 'پوسته پیش‌فرض نیمه‌شب (Midnight)',
    nameEn: 'Midnight Default',
    descriptionFa: 'کنتراست متوازن سازمانی مناسب محیط‌های کاری استاندارد',
    descriptionEn: 'Balanced enterprise dark theme for standard control rooms',
    contrastRatioLabel: '14.5:1 WCAG AA+',
    badgeText: 'MIDNIGHT',
  },
  'deep-space': {
    id: 'deep-space',
    nameFa: 'پوسته کنتراست بالا (Deep Space)',
    nameEn: 'Deep Space High-Contrast',
    descriptionFa: 'کنتراست فوق‌العاده بالا ویژه اتاق‌های فرمان کم‌نور (Low-Light Mission Control)',
    descriptionEn: 'Ultra-high contrast obsidian mode for low-light mission control',
    contrastRatioLabel: '21:1 WCAG AAA',
    badgeText: 'DEEP SPACE',
  },
};

export function getThemePresetConfig(
  id: MissionThemePresetId
): MissionThemePresetConfig {
  return PRESETS[id] || PRESETS.midnight;
}

export function getAllThemePresets(): MissionThemePresetConfig[] {
  return [PRESETS.midnight, PRESETS['deep-space']];
}

export function resolveNextThemePreset(
  current: MissionThemePresetId
): MissionThemePresetId {
  return current === 'midnight' ? 'deep-space' : 'midnight';
}

export function loadPersistedThemePreset(): MissionThemePresetId {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'midnight' || saved === 'deep-space') {
        memoryThemePreset = saved;
        return saved;
      }
    } catch {
      // Fallback
    }
  }
  return memoryThemePreset;
}

export function savePersistedThemePreset(id: MissionThemePresetId): void {
  memoryThemePreset = id;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Fallback
    }
  }
}
