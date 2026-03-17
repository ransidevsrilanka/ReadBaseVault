// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { SubjectCard, SkeletonCard, GlassCard } from '@/components';
import { Colors, Typography } from '@/constants/theme';
import { fetchSubjectsForEnrollment } from '@/services/enrollment.service';
import { MaterialIcons } from '@expo/vector-icons';

export default function SubjectsScreen() {
  const { user, enrollment, userSubjects, refreshUserData } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const load = async () => {
    if (!enrollment || !userSubjects) { setLoading(false); return; }
    try {
      const data = await fetchSubjectsForEnrollment(enrollment, userSubjects);
      setSubjects(data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [enrollment, userSubjects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUserData();
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Subjects</Text>
        <Text style={styles.subtitle}>Tap a subject to view its topics and notes</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : subjects.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <MaterialIcons name="library-books" size={40} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>No Subjects Found</Text>
            <Text style={styles.emptyText}>
              Complete your subject selection on the ReadBase website, then return here.
            </Text>
          </GlassCard>
        ) : (
          subjects.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              onPress={() => router.push(`/subject/${s.id}`)}
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
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: Typography.size['2xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: Colors.textSecondary,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});
