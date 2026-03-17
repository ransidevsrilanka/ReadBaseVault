// Powered by OnSpace.AI
import { supabase } from './supabase';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendAIMessage(
  message: string,
  enrollmentId: string,
  isTaxMode = false
): Promise<{ reply: string; creditsUsed: number; creditsRemaining: number }> {
  const fn = isTaxMode ? 'tax-knowledge-chat' : 'ai-chat';
  const { data, error } = await supabase.functions.invoke(fn, {
    body: { message, enrollmentId },
  });
  if (error) throw error;
  return data;
}

export async function fetchChatHistory(userId: string, enrollmentId: string): Promise<AIMessage[]> {
  const { data } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: true })
    .limit(50);

  return (data || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.created_at),
  }));
}
