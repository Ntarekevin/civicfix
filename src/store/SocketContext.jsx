"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [authorityNotifications, setAuthorityNotifications] = useState([]);
  const [citizenNotifications, setCitizenNotifications] = useState([]);

  const { user } = useAuth();

  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to public reports
    const reportsSub = supabase.channel('public-reports')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, payload => {
        const event = new CustomEvent('new-report', { detail: payload.new });
        window.dispatchEvent(event);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports' }, payload => {
        const event = new CustomEvent('report-updated', { detail: payload.new });
        window.dispatchEvent(event);
      })
      .subscribe();
      
    // Subscribe to notifications
    const notifSub = supabase.channel('public-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const notif = payload.new;
        
        // Filter: only show if for this user or for all citizens (no target_user_id)
        if (notif.target_user_id) {
          if (user && notif.target_user_id === user.id) {
            setAuthorityNotifications(prev => [notif, ...prev]);
          }
        } else {
          setCitizenNotifications(prev => [notif, ...prev]);
        }
        
        // Browser Notification Logic (only if relevant to current session)
        const isSelfNotif = notif.target_user_id === user?.id;
        const isCitizenNotif = !notif.target_user_id;

        if ((isSelfNotif || isCitizenNotif) && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('CivicFIX Update', { body: notif.content });
        }
      })
      .subscribe();
      
    // Mock socket interface for components migrating from socket.io-client
    const listeners = new Map();
    const mockSocket = {
      on: (event, callback) => {
        const wrapper = (e) => callback(e.detail);
        if (!listeners.has(event)) listeners.set(event, []);
        listeners.get(event).push({ callback, wrapper });
        window.addEventListener(event, wrapper);
      },
      off: (event, callback) => {
        if (!listeners.has(event)) return;
        const matches = listeners.get(event).filter(l => !callback || l.callback === callback);
        matches.forEach(m => window.removeEventListener(event, m.wrapper));
      },
      emit: () => { /* No-op: Supabase Realtime Broadcast or DB triggers handle data flow */ }
    };
    
    setSocket(mockSocket);

    return () => {
      supabase.removeChannel(reportsSub);
      supabase.removeChannel(notifSub);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      authorityNotifications, 
      citizenNotifications,
      setAuthorityNotifications,
      setCitizenNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
