"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { register } from '../services/api';
import { useAuth } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';

export default function SignupPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('official');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, setUser } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user: newUser } = await register(email, username, password, fullName, role);
      if (newUser) {
        setUser(newUser);
        router.push('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
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
            Civic<span className="text-primary italic font-outfit">FIX</span>
          </h1>
          <p className="text-muted font-medium tracking-tight text-sm uppercase">{t('authorityRegistration')}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">{t('emailAddress')}</label>
            <input
              type="email"
              className="w-full px-6 py-3.5 bg-surface-2/50 border border-border rounded-2xl text-text focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-muted"
              placeholder="e.g. jean@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted uppercase tracking-widest pl-1">{t('fullName')}</label>
            <input
              type="text"
              className="w-full px-6 py-3.5 bg-surface-2/50 border border-border rounded-2xl text-text focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-muted"
              placeholder="e.g. Jean de Dieu"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-1">{t('authorityHandle')}</label>
            <input
              type="text"
              name="username"
              autocomplete="username"
              className="w-full px-6 py-3.5 bg-surface-2/50 border border-border rounded-2xl text-text focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-muted"
              placeholder="e.g. police, kigali_admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <p className="text-[10px] text-gray-400 font-medium pl-1 italic">
              * This is your public ID. Citizens use <span className="text-primary font-bold">#{username || 'handle'}</span> to tag you in reports.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-1">{t('officialRole')}</label>
            <select
              className="w-full px-6 py-3.5 bg-surface-2/50 border border-border rounded-2xl text-text focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-muted"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="official">{t('fieldOfficial')}</option>
              <option value="authority">{t('districtAuthority')}</option>
              <option value="admin">{t('systemAdmin')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-1">{t('secretPassword')}</label>
            <input
              type="password"
              name="password"
              autocomplete="new-password"
              className="w-full px-6 py-3.5 bg-surface-2/50 border border-border rounded-2xl text-text focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-muted"
              placeholder={t('min8Chars')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-black dark:hover:bg-primary-dark disabled:opacity-50 text-white rounded-2xl font-bold font-outfit shadow-xl shadow-gray-400/20 dark:shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? t('creatingAccount') : t('registerAsOfficial')}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {t('alreadyHaveAccount')} <Link href="/login" className="text-primary font-bold hover:underline">{t('signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
