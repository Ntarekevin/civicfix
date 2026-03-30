"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSocket } from '../store/SocketContext';
import { useAuth } from '../store/AuthContext';
import { getAuthorityNotifications } from '../services/api';
import { useLanguage } from '../store/LanguageContext';

export default function TopNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const { authorityNotifications: liveNotifs, setAuthorityNotifications } = useSocket() || {};
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [dbNotifs, setDbNotifs] = useState([]);
  const dropdownRef = useRef(null);

  const isAdminPath = pathname?.startsWith('/admin');
  const isAdmin = user && ['admin', 'authority', 'official'].includes(user.role);

  // Fetch DB notifications for admins
  useEffect(() => {
    if (isAdmin && user?.firebase_uid) {
      getAuthorityNotifications(user.firebase_uid)
        .then(setDbNotifs)
        .catch(err => console.error('Failed to fetch TopNav notifications:', err));
    }
  }, [isAdmin, user?.firebase_uid]);

  // Merge and Limit to 4
  const allNotifications = [...(liveNotifs || []), ...dbNotifs].reduce((acc, current) => {
    const x = acc.find(item => item.id === current.id);
    if (!x) return acc.concat([current]);
    return acc;
  }, []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const previewNotifications = allNotifications.slice(0, 4);
  const unreadCount = allNotifications.filter(n => n.is_unread !== false).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = (n) => {
    setShowNotifs(false);
    if (n.report_id) {
      const targetPath = ['mention', 'thread_reply'].includes(n.type) ? '/mentions' : '/dashboard';
      router.push(`${targetPath}?id=${n.report_id}`);
    } else {
      router.push('/notifications');
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 z-50 transition-colors duration-200">
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-outfit font-bold text-text md:hidden">
          <span className="text-primary italic">Civic</span>FIX
        </h2>

        <nav className="hidden lg:flex items-center gap-6 h-16">
          <Link
            href="/dashboard"
            className={`h-full flex items-center px-1 border-b-2 text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
              }`}
          >
            {t('home')}
          </Link>
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className={`h-full flex items-center px-1 border-b-2 text-sm font-medium transition-colors ${pathname === '/admin/dashboard' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
                }`}
            >
              {t('authorityPortal')}
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-6 justify-end">
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className={`p-2 rounded-full relative transition-all ${showNotifs ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-2'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-[10px] font-bold text-white rounded-full border-2 border-surface flex items-center justify-center">
                  {unreadCount > 9 ? '+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-60 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-border bg-surface-2/30 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-text">{t('recentUpdates')}</h4>
                  <Link href="/notifications" onClick={() => setShowNotifs(false)} className="text-[10px] font-bold text-primary uppercase hover:underline">{t('markAll')}</Link>
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {previewNotifications.length > 0 ? (
                    previewNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`p-4 border-b border-border/50 hover:bg-surface-2/50 transition-colors cursor-pointer group ${n.is_unread !== false ? 'bg-primary/2' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">{n.type?.replace('_', ' ')}</span>
                          <span className="text-[9px] text-muted font-medium">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-text font-medium leading-relaxed line-clamp-2">{n.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-xs text-muted italic">{t('noNewNotifications')}</p>
                    </div>
                  )}
                </div>

                <Link
                  href="/notifications"
                  onClick={() => setShowNotifs(false)}
                  className="block w-full py-3 text-center bg-surface-2/30 hover:bg-surface-2 text-xs font-bold text-primary transition-colors border-t border-border"
                >
                  {t('showMoreNotifications')}
                </Link>
              </div>
            )}
          </div>

          <Link href="/settings" className="flex items-center gap-3 border-l border-border pl-4 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-xs font-semibold text-muted hidden sm:inline">
              {user?.username || 'Guest'}
            </span>
            <img
              src={`https://ui-avatars.com/api/?name=${user?.username || 'Guest'}&background=2d5bff&color=fff`}
              alt="User"
              className="w-8 h-8 rounded-full border-2 border-surface shadow-sm"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
