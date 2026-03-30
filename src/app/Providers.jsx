"use client";
import { useEffect } from 'react';
import { LanguageProvider } from '@/store/LanguageContext';
import { AuthProvider } from '@/store/AuthContext';
import { SocketProvider } from '@/store/SocketContext';
import { ThemeProvider } from '@/store/ThemeContext';

export function Providers({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Config failed', err));
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
