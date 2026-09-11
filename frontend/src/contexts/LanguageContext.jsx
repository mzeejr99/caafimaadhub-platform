import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import so from '../i18n/so.json';

const translations = { en, so };

const LanguageContext = createContext();
const LANG_STORAGE_KEY = 'caafimaad_lang_v6';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      // Clean up all legacy keys
      ['caafimaad_lang', 'caafimaad_lang_v2', 'caafimaad_lang_v3', 'caafimaad_lang_v4', 'caafimaad_lang_v5'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'so') {
        return saved;
      }
    } catch (e) {
      console.error('Error reading language from localStorage', e);
    }
    // Strict Default to Somali (so)
    return 'so';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch (e) {
      console.error('Error saving language to localStorage', e);
    }
    document.documentElement.lang = language;
  }, [language]);

  const isSomali = language === 'so';

  const t = (keyPath, fallback = '') => {
    const keys = keyPath.split('.');
    let current = translations[language];

    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English if missing in Somali
        let enCurrent = translations['en'];
        for (const enKey of keys) {
          if (enCurrent && enCurrent[enKey] !== undefined) {
            enCurrent = enCurrent[enKey];
          } else {
            return fallback || keyPath;
          }
        }
        return enCurrent;
      }
    }
    return current;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'so' ? 'en' : 'so'));
  };

  const formatRole = (role) => {
    if (!role) return '';
    const r = String(role).toUpperCase().replace(/[\s-_]/g, '');
    if (r === 'SUPERADMIN' || r === 'SUPER_ADMIN') {
      return language === 'so' ? 'Maamulka Sare' : 'Super Admin';
    }
    if (r === 'ADMIN') {
      return language === 'so' ? 'Maamule' : 'Admin';
    }
    if (r === 'OPERATIONAL' || r === 'OPERATIONS') {
      return language === 'so' ? 'Hawl-geliye Guud' : 'Operations Manager';
    }
    if (r === 'DATAANALYST' || r === 'DATA_ANALYST' || r === 'ANALYST') {
      return language === 'so' ? 'Falanqeeye Xogta' : 'Data Analyst';
    }
    if (r === 'VOLUNTEER') {
      return language === 'so' ? 'Hawl-wadeen (CHV)' : 'Volunteer (CHV)';
    }
    if (r === 'PUBLIC' || r === 'PUBLICUSER' || r === 'PUBLIC_USER') {
      return language === 'so' ? 'Bulshada' : 'Public User';
    }
    return role;
  };

  const formatStatus = (status) => {
    if (!status) return '';
    const s = String(status).toLowerCase();
    if (s === 'active' || s === 'approved') {
      return language === 'so' ? 'Shaqeynaya' : 'Active';
    }
    if (s === 'pending' || s === 'under_review') {
      return language === 'so' ? 'Sugaya Ansixin' : 'Pending Approval';
    }
    if (s === 'deactivated' || s === 'suspended' || s === 'inactive') {
      return language === 'so' ? 'La Hakiyay' : 'Deactivated';
    }
    return status;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isSomali, t, formatRole, formatStatus }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

