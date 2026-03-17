// Powered by OnSpace.AI
// This file is the fallback — platform-specific files (.native.ts / .web.ts) take precedence.
// Expo's module resolution picks supabase.native.ts for iOS/Android and supabase.web.ts for web.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export type { Session, User } from '@supabase/supabase-js';
