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

// PayHere credentials — paste your values directly here.
// OnSpace Cloud Secrets are server-side only; Expo client cannot read them.
// Merchant ID is public. Merchant Secret is used only for hash generation.
export const PAYHERE_MC_ID = '1233393';
export const PAYHERE_MC_SECRET = 'Mjk5MTM0MzExOTIxMTUwNDEzNzEzMzk3NDExMTI1MjQ2ODQwMDU2Ng==';
export const SESSION_TIMEOUT_MINUTES = 30;
export const OFFLINE_PURGE_DAYS = 7;
export const MAX_CACHE_MB = 500;
