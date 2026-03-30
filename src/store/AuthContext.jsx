"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { createClient } from '@/utils/supabase/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('civifix_user');
      if (cached) return JSON.parse(cached);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        if (!navigator.onLine) {
          const cachedUser = localStorage.getItem('civifix_user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            setUser(null);
          }
          setLoading(false);
          return;
        }

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('firebase_uid', firebaseUser.uid)
            .maybeSingle();

          if (profile) {
            const userObj = { ...profile, email: firebaseUser.email };
            const idToken = await firebaseUser.getIdToken();

            setUser(userObj);
            localStorage.setItem('civifix_user', JSON.stringify(userObj));
            localStorage.setItem('civifix_auth_token', idToken);
          } else {
            console.warn('No Supabase profile found for Firebase user:', firebaseUser.uid);
            setUser(null);
            localStorage.removeItem('civifix_user');
          }
        } catch (err) {
          console.error('Error syncing auth profile:', err);
          const cachedUser = localStorage.getItem('civifix_user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem('civifix_user');
        localStorage.removeItem('civifix_auth_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
