"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../store/LanguageContext';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { auth as firebaseAuth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [notifications, setNotifications] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('civifix_notifications') !== 'false';
    }
    return true;
  });
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const toggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('civifix_notifications', String(next));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-outfit font-extrabold text-text tracking-tight">{t('settings')}</h1>
          <p className="text-muted mt-2 text-sm font-medium">{t('customizeExperience')}</p>
        </div>
        {user && (
          <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/20">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('activeSession')}</span>
          </div>
        )}
      </div>

      {/* Account Section */}
      {user && (
        <div className="bg-surface rounded-3xl p-8 shadow-card border border-border overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

          <h2 className="text-xl font-outfit font-bold text-text mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {t('account')}
          </h2>

          <div className="space-y-6">
            <div className="flex items-center gap-5 p-5 rounded-2xl bg-surface-2 border border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20">
                {user.username?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-text leading-tight">{user.username}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-tighter">
                    {user.role}
                  </span>
                  <p className="text-[11px] text-muted font-medium">{user.email}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 group/btn"
            >
              <svg className="w-5 h-5 transition-transform group-hover/btn:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('signOut')}
            </button>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      <div className="bg-surface rounded-3xl p-8 shadow-card border border-border space-y-8">
        <h2 className="text-xl font-outfit font-bold text-text border-b border-border pb-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {t('preferences')}
        </h2>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-2/50 rounded-2xl border border-transparent hover:border-border transition-all">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
              )}
            </div>
            <div>
              <p className="font-bold text-text leading-none">{t('darkMode')}</p>
              <p className="text-[10px] text-muted font-medium mt-1 uppercase tracking-tighter">{t('automaticSystemSync')}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${darkMode ? 'bg-primary shadow-glow' : 'bg-gray-200 dark:bg-surface-2'}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${darkMode ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between p-4 bg-surface-2/50 rounded-2xl border border-transparent hover:border-border transition-all">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-success/10 text-success rounded-xl text-xl">🌍</div>
            <div>
              <p className="font-bold text-text leading-none">{t('applicationLanguage')}</p>
              <p className="text-[10px] text-muted font-medium mt-1 uppercase tracking-tighter">{t('selectLanguage')}</p>
            </div>
          </div>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-surface border border-border rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text shadow-sm cursor-pointer"
          >
            <option value="English">English</option>
            <option value="Kinyarwanda">Kinyarwanda</option>
            <option value="French">Français</option>
          </select>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between p-4 bg-surface-2/50 rounded-2xl border border-transparent hover:border-border transition-all">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-text leading-none">{t('enableNotifications')}</p>
              <p className="text-[10px] text-muted font-medium mt-1 uppercase tracking-tighter">{t('inAppAlerts')}</p>
            </div>
          </div>
          <button
            onClick={toggleNotifications}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${notifications ? 'bg-primary shadow-glow' : 'bg-gray-200 dark:bg-surface-2'}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${notifications ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          className={`w-full py-5 rounded-3xl font-bold font-outfit text-lg transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 ${saved ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
            }`}
        >
          {saved ? (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              {t('settingsSaved')}
            </>
          ) : t('saveSettings')}
        </button>
        <p className="text-center text-[10px] text-muted mt-4 font-medium uppercase tracking-widest">
          {t('settingsStoredLocally')}
        </p>
      </div>
    </div>
  );
}
