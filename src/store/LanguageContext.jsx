"use client";
import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

const DEFAULT_CONTEXT = {
  language: 'English',
  setLanguage: () => { },
  t: (key) => key,
};

const LanguageContext = createContext(DEFAULT_CONTEXT);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved) setLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key) => {
    let langKey = 'en';
    if (language === 'Kinyarwanda') langKey = 'rw';
    if (language === 'French') langKey = 'fr';
    if (!translations[langKey]) return key;
    return translations[langKey][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);