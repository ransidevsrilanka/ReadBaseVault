// Powered by OnSpace.AI
import { supabase } from './supabase';
import { TIER_HIERARCHY } from '@/constants/config';

export async function fetchTopicsForSubject(subjectId: string) {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function fetchNotesForTopic(topicId: string, userTier: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('topic_id', topicId)
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;

  const userLevel = TIER_HIERARCHY[userTier] ?? 0;
  return (data || []).map((note) => ({
    ...note,
    canAccess: (TIER_HIERARCHY[note.min_tier] ?? 0) <= userLevel,
  }));
}

export async function fetchServePDF(noteId: string) {
  const { data, error } = await supabase.functions.invoke('serve-pdf', {
    body: { noteId },
  });
  if (error) throw error;
  return data as {
    signedUrl: string;
    canDownload: boolean;
    watermark: { text: string; opacity: number };
    noteTitle: string;
  };
}

export async function fetchFlashcardSets(topicId: string, userTier: string) {
  const userLevel = TIER_HIERARCHY[userTier] ?? 0;
  const { data, error } = await supabase
    .from('flashcard_sets')
    .select('*')
    .eq('topic_id', topicId)
    .eq('is_active', true);
  if (error) throw error;
  return (data || []).filter((s) => (TIER_HIERARCHY[s.min_tier] ?? 0) <= userLevel);
}

export async function fetchFlashcards(setId: string) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('set_id', setId)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function fetchQuizzesForTopic(topicId: string, userTier: string) {
  const userLevel = TIER_HIERARCHY[userTier] ?? 0;
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('topic_id', topicId)
    .eq('is_active', true);
  if (error) throw error;
  return (data || []).filter((q) => (TIER_HIERARCHY[q.min_tier] ?? 0) <= userLevel);
}

export async function fetchRandomQuestions(
  topicId: string,
  count: number,
  tier: string
) {
  const { data, error } = await supabase.rpc('get_random_questions', {
    p_topic_id: topicId,
    p_count: count,
    p_min_tier: tier,
  });
  if (error) throw error;
  return data || [];
}

export async function saveQuizResult(
  userId: string,
  quizId: string,
  score: number,
  totalQuestions: number,
  answers: any[],
  timeTaken: number
) {
  const { error } = await supabase.from('quiz_results').insert({
    user_id: userId,
    quiz_id: quizId,
    score,
    total_questions: totalQuestions,
    answers,
    time_taken: timeTaken,
    completed_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchPrintSettings() {
  const { data } = await supabase
    .from('print_settings')
    .select('*')
    .eq('is_active', true)
    .single();
  return data;
}

export async function calculatePrintPrice(
  topicIds: string[],
  paperIds: string[],
  printType: string
) {
  const { data, error } = await supabase.functions.invoke('calculate-print-price', {
    body: { topic_ids: topicIds, selected_paper_ids: paperIds, print_type: printType },
  });
  if (error) throw error;
  return data;
}

export async function submitPrintRequest(payload: any) {
  const requestNumber = 'PR' + Math.floor(10000 + Math.random() * 90000);
  const { data, error } = await supabase
    .from('print_requests')
    .insert({ ...payload, request_number: requestNumber, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return { ...data, request_number: requestNumber };
}

export async function fetchPrintRequests(userId: string) {
  const { data } = await supabase
    .from('print_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}
