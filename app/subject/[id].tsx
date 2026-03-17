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
import { TopicCard, SkeletonCard, GlassCard } from '@/components';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import { fetchTopicsForSubject } from '@/services/content.service';
import { fetchSubjectsForEnrollment } from '@/services/enrollment.service';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { enrollment, userSubjects } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      if (!enrollment || !userSubjects) return;
      try {
        const subs = await fetchSubjectsForEnrollment(enrollment, userSubjects);
        const sub = subs.find((s) => s.id === id);
        if (sub) {
          setSubject(sub);
          const t = await fetchTopicsForSubject(id);
          setTopics(t);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [id, enrollment, userSubjects]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={2}>{subject?.name || 'Subject'}</Text>
          {subject?.grade ? (
            <Text style={styles.headerGrade}>{subject.grade.replace('al_', 'Grade ').replace('grade', '')}</Text>
          ) : null}
        </View>
      </View>

      {/* Topics count */}
      {!loading && topics.length > 0 ? (
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <MaterialIcons name="list" size={14} color={Colors.primary} />
            <Text style={styles.statText}>{topics.length} Topics</Text>
          </View>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : topics.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <MaterialIcons name="folder-open" size={36} color={Colors.textSubtle} />
            <Text style={styles.emptyText}>No topics available for this subject yet.</Text>
          </GlassCard>
        ) : (
          topics.map((t, i) => (
            <TopicCard
              key={t.id}
              topic={t}
              index={i}
              onPress={() => router.push(`/topic/${t.id}`)}
            />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
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
  headerInfo: { flex: 1 },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerGrade: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
  },
  statText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 36 },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
