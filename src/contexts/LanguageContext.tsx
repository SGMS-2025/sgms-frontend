/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import i18n from '../configs/i18n';

interface LanguageContextProps {
  language: string;
  setLanguage: (lang: string) => void;
}

export const LanguageContext = createContext<LanguageContextProps>({
  language: 'vi',
  setLanguage: () => {}
});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language');
    if (storedLang) {
      setLanguage(storedLang);
      i18n.changeLanguage(storedLang);
    }
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const contextValue = useMemo(() => ({ language, setLanguage: handleSetLanguage }), [language]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};
