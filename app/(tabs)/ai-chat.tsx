// Powered by OnSpace.AI
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, CreditBar } from '@/components';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { sendAIMessage, fetchChatHistory, AIMessage } from '@/services/ai.service';
import { fetchAICredits } from '@/services/enrollment.service';
import { useRouter } from 'expo-router';

export default function AIChatScreen() {
  const { user, enrollment } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [credits, setCredits] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isTaxMode, setIsTaxMode] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const noAIAccess = enrollment?.tier === 'starter';
  const creditsExhausted = credits && credits.credits_remaining <= 0;
  const router = useRouter();

  useEffect(() => {
    if (!user || !enrollment) return;
    Promise.all([
      fetchChatHistory(user.id, enrollment.id),
      fetchAICredits(user.id, enrollment.id),
    ]).then(([hist, cr]) => {
      setMessages(hist);
      setCredits(cr);
    }).finally(() => setLoadingHistory(false));
  }, [user, enrollment]);

  const send = async () => {
    if (!input.trim() || sending || noAIAccess || creditsExhausted) return;
    const text = input.trim();
    setInput('');
    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await sendAIMessage(text, enrollment!.id, isTaxMode);
      const aiMsg: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setCredits((prev: any) =>
        prev ? { ...prev, credits_used: (prev.credits_used || 0) + res.creditsUsed, credits_remaining: res.creditsRemaining } : prev
      );
    } catch (err: any) {
      const errMsg: AIMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const quickActions = ['Explain this concept', 'Summarize this topic', 'Quiz me on this', 'Give examples'];

  if (noAIAccess) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <MaterialIcons name="auto-awesome" size={22} color={Colors.gold} />
          <Text style={styles.headerTitle}>AI Study Co-Pilot</Text>
        </View>
        <View style={styles.noAccessContainer}>
          <GlassCard style={styles.noAccessCard}>
            <MaterialIcons name="lock" size={48} color={Colors.gold} />
            <Text style={styles.noAccessTitle}>AI Tutor — Gold & Platinum</Text>
            <Text style={styles.noAccessText}>
              Upgrade to Gold or Platinum to unlock your personal AI study co-pilot with streaming responses and LaTeX math support.
            </Text>
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="auto-awesome" size={18} color={Colors.gold} />
          <Text style={styles.headerTitle}>AI Study Co-Pilot</Text>
          {isTaxMode ? (
            <View style={styles.taxBadge}>
              <Text style={styles.taxBadgeText}>Tax Mode</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={() => setIsTaxMode((prev) => !prev)}
          style={[styles.modePill, isTaxMode ? { borderColor: Colors.gold } : {}]}
          hitSlop={8}
        >
          <Text style={[styles.modeText, isTaxMode ? { color: Colors.gold } : {}]}>
            {isTaxMode ? '📊 Tax' : '🎓 General'}
          </Text>
        </Pressable>
      </View>

      {/* Credit Bar */}
      {credits ? (
        <View style={styles.creditSection}>
          <View style={styles.creditRow}>
            <CreditBar
              used={credits.credits_used || 0}
              limit={credits.credits_limit || 0}
              remaining={credits.credits_remaining || 0}
            />
            <Pressable
              onPress={() => router.push('/buy-credits')}
              style={styles.buyCreditsBtn}
              hitSlop={6}
            >
              <MaterialIcons name="add" size={13} color={Colors.primary} />
              <Text style={styles.buyCreditsBtnText}>Buy</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Messages */}
      {loadingHistory ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <MaterialIcons name="auto-awesome" size={36} color={Colors.primary + '60'} />
              <Text style={styles.emptyChatTitle}>Start a conversation</Text>
              <Text style={styles.emptyChatSub}>Ask anything about your subjects, get explanations, or practice with quizzes.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {item.role === 'assistant' ? (
                <View style={styles.aiAvatar}>
                  <MaterialIcons name="auto-awesome" size={12} color={Colors.gold} />
                </View>
              ) : null}
              <View style={[styles.bubbleInner, item.role === 'user' ? styles.userBubbleInner : styles.aiBubbleInner]}>
                <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.aiText]}>
                  {item.content}
                </Text>
                <Text style={styles.bubbleTime}>
                  {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Quick Actions */}
      {messages.length === 0 ? (
        <View style={styles.quickActionsRow}>
          <FlatList
            data={quickActions}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setInput(item)}
                style={styles.quickChip}
              >
                <Text style={styles.quickChipText}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* Input */}
      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 8 }]}>
        {creditsExhausted ? (
          <GlassCard style={styles.exhaustedBanner}>
            <MaterialIcons name="warning" size={16} color={Colors.warning} />
            <Text style={styles.exhaustedText}>Credits exhausted.</Text>
            <Pressable onPress={() => router.push('/buy-credits')} style={styles.buyNowBtn}>
              <Text style={styles.buyNowText}>Buy More</Text>
            </Pressable>
          </GlassCard>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask your AI tutor..."
              placeholderTextColor={Colors.textSubtle}
              style={styles.textInput}
              multiline
              maxLength={1000}
              onSubmitEditing={send}
            />
            <Pressable
              onPress={send}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                (!input.trim() || sending) ? styles.sendDisabled : {},
                pressed ? { opacity: 0.7 } : {},
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  taxBadge: {
    backgroundColor: Colors.gold + '22',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  taxBadgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: Colors.gold,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  modeText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  creditSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buyCreditsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  buyCreditsBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: Colors.primary,
  },
  buyNowBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  buyNowText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12, flexGrow: 1 },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyChatTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Colors.textSecondary,
  },
  emptyChatSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gold + '22',
    borderWidth: 1,
    borderColor: Colors.gold + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleInner: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 4,
  },
  userBubbleInner: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubbleInner: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, lineHeight: 21 },
  userText: { color: '#fff' },
  aiText: { color: Colors.textPrimary },
  bubbleTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
  },
  quickActionsRow: { paddingVertical: 8 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  quickChipText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
  },
  exhaustedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  exhaustedText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.warning,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: Colors.textSubtle },
  noAccessContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  noAccessCard: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  noAccessTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  noAccessText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});
