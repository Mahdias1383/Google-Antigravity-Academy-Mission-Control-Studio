import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AppLanguage,
  TranslationDictionary,
  getTranslation,
  getLayoutDirection,
  getInitialLanguagePreference,
  LANGUAGE_STORAGE_KEY,
} from '../utils/translations';

export interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  t: (key: keyof TranslationDictionary, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'fa',
  setLanguage: () => {},
  toggleLanguage: () => {},
  isRTL: true,
  t: (key, params) => getTranslation('fa', key, params),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => getInitialLanguagePreference());

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fa' ? 'en' : 'fa');
  };

  const isRTL = language === 'fa';

  useEffect(() => {
    const rootEl = document.documentElement;
    rootEl.lang = language;
    rootEl.dir = isRTL ? 'rtl' : 'ltr';

    if (isRTL) {
      rootEl.classList.remove('font-sans-en');
      rootEl.classList.add('font-vazirmatn');
    } else {
      rootEl.classList.remove('font-vazirmatn');
      rootEl.classList.add('font-sans-en');
    }
  }, [language, isRTL]);

  const t = (key: keyof TranslationDictionary, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isRTL,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
