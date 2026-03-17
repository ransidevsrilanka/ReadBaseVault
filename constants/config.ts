// Powered by OnSpace.AI
export const SUPABASE_URL = 'https://csqqorcnrwkkwpfbravh.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcXFvcmNucndra3dwZmJyYXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMjUwODQsImV4cCI6MjA4MjkwMTA4NH0.0908kEp96dAM6trGwpmpVScJYBYdpegJ5ztLSB4Wj1E';

export const TIER_HIERARCHY: Record<string, number> = {
  starter: 1,
  standard: 2,
  lifetime: 3,
};

export const AI_CREDIT_LIMITS: Record<string, number> = {
  starter: 0,
  standard: 1000,
  lifetime: 10000,
};

export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// PayHere — set these in your .env file:
// EXPO_PUBLIC_PAYHERE_MC_ID=<your merchant ID>
// EXPO_PUBLIC_PAYHERE_MC_SECRET=<your merchant secret>
export const PAYHERE_MC_ID = process.env.EXPO_PUBLIC_PAYHERE_MC_ID || '';
export const PAYHERE_MC_SECRET = process.env.EXPO_PUBLIC_PAYHERE_MC_SECRET || '';
export const SESSION_TIMEOUT_MINUTES = 30;
export const OFFLINE_PURGE_DAYS = 7;
export const MAX_CACHE_MB = 500;
