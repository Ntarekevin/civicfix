"use client";
import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { login } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      // Success: AuthContext will pick up the change and useEffect above will redirect.
    } catch (err) {
      setError(err.message || 'Login failed. Check your authority credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-surface rounded-3xl p-8 shadow-card border border-border space-y-8">
        <div className="text-center space-y-2">
          <button
            onClick={() => router.push('/')}
            className="text-muted hover:text-primary transition-colors mb-4 inline-flex items-center gap-2 text-sm font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToHome')}
          </button>
          <h1 className="text-4xl font-outfit font-bold text-text uppercase tracking-tighter">
            {t('authorityPortal')}
          </h1>
          <p className="text-muted font-medium tracking-tight text-sm uppercase">{t('restrictedAccess')}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">{t('usernameHandle')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                name="username"
                autocomplete="username"
                className="w-full pl-12 pr-4 py-3.5 bg-surface-2/50 border border-border rounded-2xl text-text focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-muted"
                placeholder={t('usernameOrEmail')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">{t('secretPassword')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                name="password"
                autocomplete="current-password"
                className="w-full pl-12 pr-4 py-3.5 bg-surface-2/50 border border-border rounded-2xl text-text focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-muted"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 dark:bg-primary hover:bg-black dark:hover:bg-primary-dark disabled:opacity-50 text-white rounded-2xl font-bold font-outfit shadow-xl shadow-gray-400/20 dark:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? t('verifying') : t('secureAuthorization')}
          </button>
        </form>

        <div className="text-center pt-4 space-y-4">
          <p className="text-xs text-gray-400 italic">
            {t('authorizedOnly')}
          </p>
          <div className="pt-2 border-t dark:border-gray-800">
            <p className="text-sm text-gray-500">
              {t('firstTimeUser')} <button onClick={() => router.push('/signup')} className="text-primary font-bold hover:underline">{t('createAccount')}</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
