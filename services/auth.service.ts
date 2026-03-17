// Powered by OnSpace.AI
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { generateUUID } from './uuid-gen';

const SESSION_ID_KEY = '@readbase_session_id';

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  return AsyncStorage.getItem(key);
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
    } catch {}
    return;
  }
  return AsyncStorage.setItem(key, value);
}

async function removeStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
    } catch {}
    return;
  }
  return AsyncStorage.removeItem(key);
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(sessionId?: string) {
  if (sessionId) {
    await supabase.from('device_sessions').delete().eq('session_id', sessionId);
  }
  await removeStorageItem(SESSION_ID_KEY);
  await supabase.auth.signOut();
}

export async function registerDeviceSession(userId: string): Promise<string> {
  let sessionId = await getStorageItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateUUID();
    await setStorageItem(SESSION_ID_KEY, sessionId);
  }

  // Delete old sessions for this user first (single session enforcement)
  await supabase.from('device_sessions').delete().eq('user_id', userId);

  await supabase.from('device_sessions').insert({
    user_id: userId,
    session_id: sessionId,
    device_info: JSON.stringify({
      platform: Platform.OS,
      model: 'unknown',
      os: Platform.Version,
    }),
    last_active_at: new Date().toISOString(),
  });

  return sessionId;
}

export async function sendHeartbeat(sessionId: string) {
  await supabase
    .from('device_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('session_id', sessionId);
}

export async function checkSessionConflict(
  userId: string,
  mySessionId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('device_sessions')
    .select('session_id, last_active_at')
    .eq('user_id', userId);

  if (!data) return false;

  const now = Date.now();
  const conflicting = data.find((s) => {
    if (s.session_id === mySessionId) return false;
    const lastActive = new Date(s.last_active_at).getTime();
    return now - lastActive < 6 * 60 * 1000;
  });

  return !!conflicting;
}

export async function getStoredSessionId(): Promise<string | null> {
  return getStorageItem(SESSION_ID_KEY);
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}
