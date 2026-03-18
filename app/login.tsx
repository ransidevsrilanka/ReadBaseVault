// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { VaultInput, VaultButton, GlassCard } from '@/components';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { useAlert } from '@/template';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, isSessionConflict, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check your credentials.';
      showAlert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Background Hero */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80' }}
        style={styles.heroImage}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', Colors.background + 'dd', Colors.background]}
        style={styles.heroGradient}
        locations={[0, 0.5, 0.9]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Session Conflict Banner */}
          {isSessionConflict ? (
            <GlassCard style={[styles.conflictBanner, { borderColor: Colors.error + '60' }]}>
              <MaterialIcons name="security" size={18} color={Colors.error} />
              <Text style={styles.conflictText}>
                Session active on another device. Please log in again.
              </Text>
            </GlassCard>
          ) : null}

          {/* Brand Header */}
          <View style={styles.brandSection}>
            <View style={styles.vaultIconWrap}>
              <MaterialIcons name="shield" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.brandTitle}>ReadBase</Text>
            <Text style={styles.brandSubtitle}>The Vault</Text>
            <Text style={styles.brandDesc}>
              Premium Study Platform for A/L & O/L Students
            </Text>
          </View>

          {/* Login Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Access Your Vault</Text>
            <Text style={styles.cardSubtitle}>
              Sign in with your ReadBase account credentials
            </Text>

            <View style={styles.form}>
              <VaultInput
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
              />
              <VaultInput
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                isPassword
                error={errors.password}
              />
              <VaultButton
                label="Unlock the Vault"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                style={styles.loginBtn}
              />
            </View>
          </GlassCard>

          {/* Info */}
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="info-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.infoText}>
                This app is for premium members only. Enrollment and payment are handled on the ReadBase website.
              </Text>
            </View>
          </GlassCard>

          {/* Tier Icons */}
          <View style={styles.tierRow}>
            {[
              { label: 'Silver', color: Colors.tierSilver },
              { label: 'Gold', color: Colors.gold },
              { label: 'Platinum', color: Colors.tierPlatinum },
            ].map((t) => (
              <View key={t.label} style={styles.tierChip}>
                <Text style={[styles.tierText, { color: t.color }]}>✦ {t.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  conflictText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: Colors.error,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: height * 0.22,
    paddingBottom: 8,
    gap: 4,
  },
  vaultIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  brandTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: Typography.size['3xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: Typography.size.md,
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandDesc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  card: { padding: 20, gap: 0 },
  cardTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  form: { gap: 14 },
  loginBtn: { marginTop: 6 },
  infoCard: { flexDirection: 'row', padding: 12 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  tierChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  tierText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
});
