// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, TierBadge, SkeletonCard, SubjectCard } from '@/components';
import { Colors, Typography, BorderRadius, GRADE_DISPLAY, STREAM_DISPLAY, TIER_DISPLAY } from '@/constants/theme';
import { fetchSubjectsForEnrollment, fetchAICredits, fetchInboxMessages } from '@/services/enrollment.service';
import { isEnrollmentExpired } from '@/services/enrollment.service';

export default function HomeScreen() {
  const { user, profile, enrollment, userSubjects, refreshUserData } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [credits, setCredits] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const loadData = async () => {
    if (!enrollment || !userSubjects) return;
    try {
      const [subs, cr, msgs] = await Promise.all([
        fetchSubjectsForEnrollment(enrollment, userSubjects),
        fetchAICredits(user!.id, enrollment.id),
        fetchInboxMessages(user!.id),
      ]);
      setSubjects(subs);
      setCredits(cr);
      setMessages(msgs.filter((m: any) => !m.is_read).slice(0, 3));
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [enrollment, userSubjects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUserData();
    await loadData();
    setRefreshing(false);
  };

  const expired = enrollment ? isEnrollmentExpired(enrollment) : false;
  const tierInfo = enrollment ? TIER_DISPLAY[enrollment.tier] || { label: enrollment.tier, color: Colors.primary } : null;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';

  const creditUsed = credits?.credits_used || 0;
  const creditLimit = credits?.credits_limit || 0;
  const creditPct = creditLimit > 0 ? Math.min(1, creditUsed / creditLimit) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good {getGreeting()},</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/inbox')}
            style={({ pressed }) => [styles.inboxBtn, pressed ? { opacity: 0.7 } : {}]}
            hitSlop={8}
          >
            <MaterialIcons name="notifications" size={22} color={Colors.textMuted} />
            {messages.length > 0 ? <View style={styles.notifDot} /> : null}
          </Pressable>
        </View>

        {/* Expiry Warning */}
        {expired ? (
          <GlassCard style={[styles.expiredBanner, { borderColor: Colors.error + '60' }]}>
            <MaterialIcons name="warning" size={18} color={Colors.error} />
            <Text style={styles.expiredText}>
              Your subscription has expired. Please renew on the ReadBase website.
            </Text>
          </GlassCard>
        ) : null}

        {/* Enrollment Card */}
        {enrollment ? (
          <LinearGradient
            colors={[Colors.primaryGlow + 'cc', Colors.surface, Colors.surface]}
            style={styles.enrollCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.enrollTop}>
              <View>
                <Text style={styles.enrollGrade}>{GRADE_DISPLAY[enrollment.grade] || enrollment.grade}</Text>
                {enrollment.stream ? (
                  <Text style={styles.enrollStream}>{STREAM_DISPLAY[enrollment.stream] || enrollment.stream}</Text>
                ) : null}
                <Text style={styles.enrollMedium}>{enrollment.medium?.charAt(0).toUpperCase() + enrollment.medium?.slice(1)} Medium</Text>
              </View>
              {tierInfo ? <TierBadge tier={enrollment.tier} /> : null}
            </View>
            {enrollment.expires_at ? (
              <Text style={styles.expiryText}>
                Expires: {new Date(enrollment.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </Text>
            ) : (
              <Text style={styles.expiryText}>Lifetime Access</Text>
            )}
          </LinearGradient>
        ) : null}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: 'library-books', label: 'My Subjects', route: '/(tabs)/subjects', color: Colors.primary },
              { icon: 'auto-awesome', label: 'AI Tutor', route: '/(tabs)/ai-chat', color: Colors.gold },
              { icon: 'local-print-shop', label: 'Print Notes', route: '/print-request', color: Colors.blue },
              { icon: 'inbox', label: 'Inbox', route: '/inbox', color: Colors.success },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  styles.quickCard,
                  pressed ? { opacity: 0.75, transform: [{ scale: 0.95 }] } : {},
                ]}
              >
                <View style={[styles.quickIcon, { backgroundColor: item.color + '22' }]}>
                  <MaterialIcons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* AI Credits */}
        {enrollment?.tier !== 'starter' && credits ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Credits</Text>
            <GlassCard style={styles.creditCard}>
              <View style={styles.creditTop}>
                <MaterialIcons name="auto-awesome" size={16} color={Colors.gold} />
                <Text style={styles.creditMonth}>
                  {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.creditRow}>
                <Text style={styles.creditUsed}>{(creditLimit - creditUsed).toLocaleString()}</Text>
                <Text style={styles.creditTotal}> / {creditLimit.toLocaleString()} remaining</Text>
              </View>
              <View style={styles.creditTrack}>
                <View style={[styles.creditFill, {
                  width: `${creditPct * 100}%` as any,
                  backgroundColor: creditPct > 0.85 ? Colors.error : creditPct > 0.6 ? Colors.warning : Colors.primary,
                }]} />
              </View>
            </GlassCard>
          </View>
        ) : null}

        {/* My Subjects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <Pressable onPress={() => router.push('/(tabs)/subjects')} hitSlop={8}>
              <Text style={styles.sectionLink}>View all</Text>
            </Pressable>
          </View>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : subjects.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <MaterialIcons name="library-books" size={32} color={Colors.textSubtle} />
              <Text style={styles.emptyText}>No subjects found. Please complete your subject selection on the ReadBase website.</Text>
            </GlassCard>
          ) : (
            subjects.slice(0, 3).map((s) => (
              <SubjectCard
                key={s.id}
                subject={s}
                onPress={() => router.push(`/subject/${s.id}`)}
              />
            ))
          )}
        </View>

        {/* Messages */}
        {messages.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inbox</Text>
              <Pressable onPress={() => router.push('/inbox')} hitSlop={8}>
                <Text style={styles.sectionLink}>View all</Text>
              </Pressable>
            </View>
            {messages.map((msg) => (
              <GlassCard key={msg.id} style={styles.msgCard}>
                <View style={styles.msgRow}>
                  <MaterialIcons
                    name={msg.notification_type === 'warning' ? 'warning' : 'notifications'}
                    size={16}
                    color={msg.notification_type === 'warning' ? Colors.warning : Colors.primary}
                  />
                  <Text style={styles.msgTitle} numberOfLines={1}>{msg.subject || 'Notification'}</Text>
                </View>
                <Text style={styles.msgBody} numberOfLines={2}>{msg.body}</Text>
              </GlassCard>
            ))}
          </View>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  userName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  inboxBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 12,
  },
  expiredText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.error,
  },
  enrollCard: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 20,
  },
  enrollTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  enrollGrade: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  enrollStream: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 2,
  },
  enrollMedium: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  expiryText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: Colors.textSubtle,
  },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  sectionLink: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: Colors.primary,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '47%',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  creditCard: { padding: 16, gap: 10 },
  creditTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creditMonth: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  creditRow: { flexDirection: 'row', alignItems: 'baseline' },
  creditUsed: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  creditTotal: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  creditTrack: {
    height: 5,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  creditFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  emptyText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  msgCard: { padding: 12, gap: 6, marginBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  msgBody: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
