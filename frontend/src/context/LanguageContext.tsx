import React, { createContext, useState, useEffect, ReactNode } from 'react';
import en from '../locales/en.json';
import id from '../locales/id.json';

type Language = 'en' | 'id';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextProps>({
  language: 'id',
  setLanguage: () => {},
  t: (key: string, _params?: Record<string, string | number>) => key,
});

const translations: Record<Language, any> = { en, id };

// Helper to get nested object property by string path (e.g. 'sidebar.dashboard')
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const savedLang = localStorage.getItem('app-language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'id')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = getNestedValue(translations[language], key);
    if (!translation) return key; // fallback to key if not found
    
    if (params) {
      Object.keys(params).forEach(k => {
        translation = translation.replace(new RegExp(`{{${k}}}`, 'g'), String(params[k]));
      });
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
