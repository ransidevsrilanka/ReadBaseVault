// Powered by OnSpace.AI
import { supabase } from './supabase';
import { TIER_HIERARCHY } from '@/constants/config';

export async function fetchEnrollment(userId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchUserSubjects(userId: string, enrollmentId: string) {
  const { data, error } = await supabase
    .from('user_subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('enrollment_id', enrollmentId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSubjectsForEnrollment(
  enrollment: any,
  userSubjects: any
) {
  const codes = [
    userSubjects.subject_1_code,
    userSubjects.subject_2_code,
    userSubjects.subject_3_code,
  ].filter(Boolean);

  const mediums = [
    userSubjects.subject_1_medium || enrollment.medium,
    userSubjects.subject_2_medium || enrollment.medium,
    userSubjects.subject_3_medium || enrollment.medium,
  ];

  let query = supabase.from('subjects').select('*').in('subject_code', codes).eq('is_active', true);

  if (enrollment.grade === 'al_combo') {
    query = query.in('grade', ['al_grade12', 'al_grade13']);
  } else {
    query = query.eq('grade', enrollment.grade);
  }

  const { data: subjects, error } = await query;
  if (error) throw error;

  // Filter by per-subject medium
  const filtered = (subjects || []).filter((s) => {
    const idx = codes.indexOf(s.subject_code);
    if (idx < 0) return false;
    return s.medium === mediums[idx];
  });

  // Deduplicate by subject_code (for combo)
  const seen = new Set<string>();
  return filtered.filter((s) => {
    if (seen.has(s.subject_code)) return false;
    seen.add(s.subject_code);
    return true;
  });
}

export function isEnrollmentExpired(enrollment: any): boolean {
  if (!enrollment.expires_at) return false;
  return new Date(enrollment.expires_at) < new Date();
}

export function canAccessNote(userTier: string, noteTier: string): boolean {
  const userLevel = TIER_HIERARCHY[userTier] ?? 0;
  const noteLevel = TIER_HIERARCHY[noteTier] ?? 0;
  return userLevel >= noteLevel;
}

export async function fetchAICredits(userId: string, enrollmentId: string) {
  const monthYear = new Date().toISOString().slice(0, 7);
  const { data } = await supabase
    .from('ai_credits')
    .select('*')
    .eq('user_id', userId)
    .eq('enrollment_id', enrollmentId)
    .eq('month_year', monthYear)
    .single();
  return data;
}

export async function fetchInboxMessages(userId: string) {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`recipient_user_id.eq.${userId},recipient_type.eq.broadcast`)
    .order('created_at', { ascending: false })
    .limit(30);
  return data || [];
}

export async function markMessageRead(messageId: string) {
  await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', messageId);
}
