"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../store/LanguageContext';

export default function OfflineBanner() {
  const { t } = useLanguage();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <div className={`offline-banner ${offline ? 'visible' : ''}`} role="alert" aria-live="polite">
      {t('offlineMessage')}
    </div>
  );
}
