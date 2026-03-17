// Powered by OnSpace.AI
import React, { createContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/services/supabase';
import {
  signIn as serviceSignIn,
  signOut as serviceSignOut,
  registerDeviceSession,
  sendHeartbeat,
  checkSessionConflict,
  getStoredSessionId,
  fetchProfile,
} from '@/services/auth.service';
import {
  fetchEnrollment,
  fetchUserSubjects,
} from '@/services/enrollment.service';
import { HEARTBEAT_INTERVAL_MS } from '@/constants/config';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  enrollment: any | null;
  userSubjects: any | null;
  sessionId: string | null;
  isLoading: boolean;
  isSessionConflict: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [userSubjects, setUserSubjects] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionConflict, setIsSessionConflict] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const loadUserData = async (u: User) => {
    try {
      const [p, e] = await Promise.all([
        fetchProfile(u.id).catch(() => null),
        fetchEnrollment(u.id).catch(() => null),
      ]);
      setProfile(p);
      setEnrollment(e);

      if (e) {
        const us = await fetchUserSubjects(u.id, e.id).catch(() => null);
        setUserSubjects(us);
      }
    } catch (_) {}
  };

  const startHeartbeat = (sid: string, uid: string) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(async () => {
      try {
        await sendHeartbeat(sid);
        const conflict = await checkSessionConflict(uid, sid);
        if (conflict) {
          setIsSessionConflict(true);
          clearInterval(heartbeatRef.current!);
        }
      } catch (_) {}
    }, HEARTBEAT_INTERVAL_MS);
  };

  const initSession = async (u: User) => {
    try {
      const sid = await registerDeviceSession(u.id);
      setSessionId(sid);
      sessionIdRef.current = sid;
      startHeartbeat(sid, u.id);
    } catch (_) {}
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsLoading(true);
          await Promise.all([
            loadUserData(session.user),
            initSession(session.user),
          ]);
          setIsLoading(false);
        } else {
          setUser(null);
          setProfile(null);
          setEnrollment(null);
          setUserSubjects(null);
          setSessionId(null);
          sessionIdRef.current = null;
          if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          setIsLoading(false);
        }
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await serviceSignIn(email, password);
    // Auth state change will handle the rest
  };

  const signOut = async () => {
    const sid = sessionIdRef.current;
    await serviceSignOut(sid || undefined);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    setIsSessionConflict(false);
  };

  const refreshUserData = async () => {
    if (user) await loadUserData(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        enrollment,
        userSubjects,
        sessionId,
        isLoading,
        isSessionConflict,
        signIn,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
