"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../store/LanguageContext';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { logout } from '../services/api';

const sidebarLinks = [
  { name: 'posts', path: '/dashboard', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
  { name: 'notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { name: 'trackReport', path: '/track', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { name: 'settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

export default function Sidebar() {
  const { darkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <aside className="w-64 bg-surface border-r border-border hidden md:flex flex-col transition-colors duration-200">
      <div className="p-6">
        <h1 className="text-2xl font-outfit font-bold text-text flex items-center gap-2">
          <span className="text-primary italic">Civic</span>FIX
        </h1>
        <p className="text-xs text-gray-400 mt-1 font-inter">{t('anonymousCivicReporting')}</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {sidebarLinks.map((link) => {
          const isAdmin = ['admin', 'authority', 'official'].includes(user?.role);
          let name = link.name;
          let path = link.path;

          if (isAdmin && link.name === 'posts') {
            path = '/admin/dashboard';
          }

          if (isAdmin && link.name === 'trackReport') {
            name = 'mentions';
            path = '/mentions';
          }

          return (
            <Link
              key={link.name}
              href={path}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${pathname === path
                  ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                  : 'text-muted hover:bg-surface-2 hover:text-text'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
              </svg>
              {t(name)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t dark:border-gray-800 space-y-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted hover:text-text w-full transition-all rounded-xl hover:bg-surface-2 border border-transparent hover:border-border"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {darkMode ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            )}
          </svg>
          {darkMode ? t('lightMode') : t('darkMode')}
        </button>

        {/* User info or Login as Admin */}
        {user ? (
          <div className="space-y-2">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${pathname?.startsWith('/admin') ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 opacity-80'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${pathname?.startsWith('/admin') ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                {user.username?.slice(0, 2).toUpperCase() || 'AC'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">
                  {user.fullName || user.username}
                </p>
                {pathname?.startsWith('/admin') && (
                  <p className="text-[10px] text-gray-500 font-medium capitalize">{user.role}</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                title={t('logOut')}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            {/* If admin is on citizen page, show link back to admin dashboard */}
            {!pathname?.startsWith('/admin') && ['admin', 'authority', 'official'].includes(user.role) && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {t('goToAdminPortal')}
              </Link>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t('loginAsAdmin')}
          </button>
        )}
      </div>
    </aside>
  );
}
