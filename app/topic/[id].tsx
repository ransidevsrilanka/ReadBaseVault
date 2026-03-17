// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { NoteCard, SkeletonCard, GlassCard } from '@/components';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import {
  fetchNotesForTopic,
  fetchQuizzesForTopic,
  fetchFlashcardSets,
} from '@/services/content.service';
import { supabase } from '@/services/supabase';

type Tab = 'notes' | 'quizzes' | 'flashcards';

export default function TopicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { enrollment } = useAuth();
  const [topic, setTopic] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      if (!enrollment) return;
      try {
        // Fetch topic metadata
        const { data: t } = await supabase.from('topics').select('*').eq('id', id).single();
        setTopic(t);

        const [n, q, fs] = await Promise.all([
          fetchNotesForTopic(id, enrollment.tier),
          fetchQuizzesForTopic(id, enrollment.tier),
          fetchFlashcardSets(id, enrollment.tier),
        ]);
        setNotes(n);
        setQuizzes(q);
        setFlashcardSets(fs);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [id, enrollment]);

  const tabs: { key: Tab; label: string; icon: string; count: number }[] = [
    { key: 'notes', label: 'Notes', icon: 'description', count: notes.length },
    { key: 'quizzes', label: 'Quizzes', icon: 'quiz', count: quizzes.length },
    { key: 'flashcards', label: 'Flashcards', icon: 'style', count: flashcardSets.length },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={2}>{topic?.name || 'Topic'}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key ? styles.tabActive : {}]}
          >
            <MaterialIcons
              name={tab.icon as any}
              size={15}
              color={activeTab === tab.key ? Colors.primary : Colors.textSubtle}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : {}]}>
              {tab.label}
            </Text>
            {tab.count > 0 ? (
              <View style={[styles.tabBadge, activeTab === tab.key ? styles.tabBadgeActive : {}]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key ? styles.tabBadgeTextActive : {}]}>
                  {tab.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : activeTab === 'notes' ? (
          notes.length === 0 ? (
            <EmptyState icon="description" text="No notes available for this topic yet." />
          ) : (
            notes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                onPress={() => router.push(`/note/${n.id}`)}
              />
            ))
          )
        ) : activeTab === 'quizzes' ? (
          quizzes.length === 0 ? (
            <EmptyState icon="quiz" text="No quizzes available for this topic yet." />
          ) : (
            quizzes.map((q) => (
              <Pressable
                key={q.id}
                onPress={() => router.push(`/quiz/${q.id}`)}
                style={({ pressed }) => [
                  styles.quizCard,
                  pressed ? { opacity: 0.8, transform: [{ scale: 0.98 }] } : {},
                ]}
              >
                <View style={styles.quizIcon}>
                  <MaterialIcons name="quiz" size={22} color={Colors.blue} />
                </View>
                <View style={styles.quizInfo}>
                  <Text style={styles.quizTitle}>{topic?.name} Quiz</Text>
                  <Text style={styles.quizMeta}>
                    {q.question_count} questions · {Math.floor(q.time_limit / 60)} min · Pass {q.pass_percentage}%
                  </Text>
                </View>
                <MaterialIcons name="play-arrow" size={22} color={Colors.blue} />
              </Pressable>
            ))
          )
        ) : (
          flashcardSets.length === 0 ? (
            <EmptyState icon="style" text="No flashcard sets available for this topic yet." />
          ) : (
            flashcardSets.map((fs) => (
              <Pressable
                key={fs.id}
                onPress={() => router.push(`/flashcards/${fs.id}`)}
                style={({ pressed }) => [
                  styles.quizCard,
                  pressed ? { opacity: 0.8, transform: [{ scale: 0.98 }] } : {},
                ]}
              >
                <View style={[styles.quizIcon, { backgroundColor: Colors.gold + '22' }]}>
                  <MaterialIcons name="style" size={22} color={Colors.gold} />
                </View>
                <View style={styles.quizInfo}>
                  <Text style={styles.quizTitle}>{fs.title}</Text>
                  <Text style={styles.quizMeta}>{fs.card_count} cards</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
              </Pressable>
            ))
          )
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <GlassCard style={{ alignItems: 'center', gap: 10, paddingVertical: 36 }}>
      <MaterialIcons name={icon as any} size={36} color={Colors.textSubtle} />
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center' }}>
        {text}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
  },
  tabActive: {
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.primaryLight,
  },
  tabLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: Colors.textSubtle,
  },
  tabLabelActive: { color: Colors.primary },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: Colors.primary + '33' },
  tabBadgeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: Colors.textSubtle,
  },
  tabBadgeTextActive: { color: Colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: 8,
  },
  quizIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizInfo: { flex: 1 },
  quizTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  quizMeta: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
