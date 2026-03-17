// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, TierBadge, VaultButton } from '@/components';
import { Colors, Typography, BorderRadius, GRADE_DISPLAY, STREAM_DISPLAY, TIER_DISPLAY } from '@/constants/theme';
import { useAlert } from '@/template';

export default function ProfileScreen() {
  const { user, profile, enrollment, userSubjects, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const handleSignOut = () => {
    showAlert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
            router.replace('/login');
          } catch (_) {}
          setSigningOut(false);
        },
      },
    ]);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Student';
  const tierInfo = enrollment ? TIER_DISPLAY[enrollment.tier] : null;

  const subjects = [
    userSubjects?.subject_1,
    userSubjects?.subject_2,
    userSubjects?.subject_3,
  ].filter(Boolean);

  const menuItems = [
    { icon: 'local-print-shop', label: 'Print Requests', route: '/print-request' },
    { icon: 'inbox', label: 'Inbox', route: '/inbox' },
    { icon: 'bolt', label: 'Buy AI Credits', route: '/buy-credits' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            {tierInfo ? <TierBadge tier={enrollment!.tier} size="sm" style={{ marginTop: 4 }} /> : null}
          </View>
        </View>

        {/* Enrollment Details */}
        {enrollment ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enrollment</Text>
            <GlassCard>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Grade</Text>
                <Text style={styles.detailValue}>{GRADE_DISPLAY[enrollment.grade] || enrollment.grade}</Text>
              </View>
              {enrollment.stream ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Stream</Text>
                  <Text style={styles.detailValue}>{STREAM_DISPLAY[enrollment.stream] || enrollment.stream}</Text>
                </View>
              ) : null}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medium</Text>
                <Text style={styles.detailValue}>
                  {enrollment.medium?.charAt(0).toUpperCase() + enrollment.medium?.slice(1)}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Expires</Text>
                <Text style={styles.detailValue}>
                  {enrollment.expires_at
                    ? new Date(enrollment.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Lifetime'}
                </Text>
              </View>
            </GlassCard>
          </View>
        ) : null}

        {/* Selected Subjects */}
        {subjects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <GlassCard>
              {subjects.map((s, i) => (
                <View key={i} style={[styles.detailRow, i === subjects.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <View style={[styles.subjNumBadge]}>
                    <Text style={styles.subjNum}>{i + 1}</Text>
                  </View>
                  <Text style={styles.subjName}>{s}</Text>
                </View>
              ))}
            </GlassCard>
          </View>
        ) : null}

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <GlassCard noPad>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  styles.menuItem,
                  index < menuItems.length - 1 ? styles.menuDivider : {},
                  pressed ? { backgroundColor: Colors.glass } : {},
                ]}
              >
                <MaterialIcons name={item.icon as any} size={20} color={Colors.primary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={18} color={Colors.textSubtle} />
              </Pressable>
            ))}
          </GlassCard>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <VaultButton
            label="Sign Out"
            onPress={handleSignOut}
            variant="danger"
            loading={signingOut}
            fullWidth
            icon={<MaterialIcons name="logout" size={16} color={Colors.error} />}
          />
        </View>

        {/* App Info */}
        <Text style={styles.appInfo}>ReadBase — The Vault v1.0</Text>
        <Text style={styles.appInfo}>For premium members only</Text>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 16,
    paddingBottom: 20,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 26,
    color: Colors.primary,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
  },
  detailLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },
  detailValue: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  subjNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjNum: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: Colors.primary,
  },
  subjName: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMuted,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  appInfo: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: Colors.textSubtle,
    textAlign: 'center',
    marginBottom: 2,
  },
});
