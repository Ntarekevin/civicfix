"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../store/LanguageContext';

export default function BottomNav() {
  const { t } = useLanguage();
  const bottomTabs = [
    { name: t('feed'), path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: t('reportNav'), path: '/report', icon: 'M12 4v16m8-8H4' },
    { name: t('mentions'), path: '/mentions', icon: 'M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207' },
    { name: t('settings'), path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-surface-dark border-t dark:border-gray-800 flex items-center justify-around px-2 z-50 md:hidden pb-safe">
      {bottomTabs.map((tab) => (
        <Link
          key={tab.name}
          href={tab.path}
          className={`flex flex-col items-center gap-1 px-3 py-1 transition-all ${pathname === tab.path
              ? 'text-primary'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`
          }
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">{tab.name}</span>
        </Link>
      ))}
    </nav>
  );
}
