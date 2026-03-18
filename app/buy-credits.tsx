// Powered by OnSpace.AI
// AI Credits Purchase Screen — 1 credit = 1 LKR, min 50, max 50,000, step 50

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, VaultButton } from '@/components';
import { Colors, BorderRadius } from '@/constants/theme';
import {
  CREDIT_MIN,
  CREDIT_MAX,
  CREDIT_STEP,
  snapToGrid,
  AICreditPackage,
  openPayHereCheckout,
  creditAICreditsAfterPayment,
} from '@/services/payhere.service';
import { fetchAICredits } from '@/services/enrollment.service';
import { useAlert } from '@/template';

const PRESETS = [100, 500, 1000, 2500, 5000, 10000];

export default function BuyCreditsScreen() {
  const { user, profile, enrollment } = useAuth();
  const [creditAmount, setCreditAmount] = useState(500);
  const [inputText, setInputText] = useState('500');
  const [currentCredits, setCurrentCredits] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const noAIAccess = enrollment?.tier === 'starter';
  const lkrAmount = creditAmount;

  useEffect(() => {
    if (!user || !enrollment) return;
    fetchAICredits(user.id, enrollment.id).then(setCurrentCredits);
  }, [user, enrollment]);

  const applyAmount = useCallback((raw: number) => {
    const snapped = snapToGrid(raw);
    setCreditAmount(snapped);
    setInputText(String(snapped));
  }, []);

  const handleSlider = (val: number) => {
    const steps = Math.round(val * ((CREDIT_MAX - CREDIT_MIN) / CREDIT_STEP));
    applyAmount(CREDIT_MIN + steps * CREDIT_STEP);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputText.replace(/[^0-9]/g, ''), 10);
    applyAmount(isNaN(parsed) ? CREDIT_MIN : parsed);
  };

  const sliderValue = (creditAmount - CREDIT_MIN) / (CREDIT_MAX - CREDIT_MIN);

  const handlePurchase = async () => {
    if (!user || !enrollment || !profile) return;
    if (!phone.trim()) {
      showAlert('Missing Info', 'Please enter your phone number to continue.');
      return;
    }
    if (creditAmount < CREDIT_MIN || creditAmount > CREDIT_MAX || creditAmount % CREDIT_STEP !== 0) {
      showAlert('Invalid Amount', `Credits must be between ${CREDIT_MIN.toLocaleString()} and ${CREDIT_MAX.toLocaleString()}, in multiples of ${CREDIT_STEP}.`);
      return;
    }

    setLoading(true);
    const orderId = `AIC-${Date.now()}`;
    const nameParts = (profile.full_name || 'ReadBase User').split(' ');

    const result = await openPayHereCheckout({
      orderId,
      items: `ReadBase AI Credits — ${creditAmount.toLocaleString()} credits`,
      amount: lkrAmount,
      firstName: nameParts[0] || 'ReadBase',
      lastName: nameParts.slice(1).join(' ') || 'Student',
      email: user.email || '',
      phone: phone.trim(),
      address: 'ReadBase Platform',
      city: 'Colombo',
    });
    setLoading(false);

    if (result.type === 'success') {
      const pkg: AICreditPackage = {
        id: orderId,
        label: `${creditAmount.toLocaleString()} Credits`,
        credits: creditAmount,
        price: lkrAmount,
      };
      try {
        await creditAICreditsAfterPayment(user.id, enrollment.id, pkg, result.paymentId);
      } catch (_) {}
      showAlert(
        'Credits Added!',
        `${creditAmount.toLocaleString()} AI credits have been added to your account.`,
        [{ text: 'Great!', onPress: () => router.back() }]
      );
    } else if (result.type === 'cancel') {
      showAlert('Payment Cancelled', 'No charges were made.');
    } else {
      showAlert('Payment Error', result.message || 'Could not complete payment. Please try again.');
    }
  };

  const creditUsed = currentCredits?.credits_used || 0;
  const creditLimit = (currentCredits?.credits_limit || 0) + (currentCredits?.bonus_credits || 0);
  const creditRemaining = Math.max(0, creditLimit - creditUsed);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Buy AI Credits</Text>
          <Text style={styles.headerSub}>1 credit = LKR 1.00</Text>
        </View>
        <View style={styles.aiIcon}>
          <MaterialIcons name="auto-awesome" size={18} color={Colors.gold} />
        </View>
      </View>

      {noAIAccess ? (
        <View style={styles.noAccessWrap}>
          <GlassCard style={styles.noAccessCard}>
            <MaterialIcons name="lock" size={44} color={Colors.gold} />
            <Text style={styles.noAccessTitle}>Gold or Platinum Required</Text>
            <Text style={styles.noAccessText}>
              AI credit purchases are available for Gold and Platinum members only. Upgrade on the ReadBase website to unlock AI access.
            </Text>
          </GlassCard>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Current Balance */}
          {currentCredits ? (
            <GlassCard style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <MaterialIcons name="auto-awesome" size={16} color={Colors.gold} />
                <Text style={styles.balanceLabel}>Current Balance</Text>
              </View>
              <Text style={styles.balanceAmount}>
                {creditRemaining.toLocaleString()}
                <Text style={styles.balanceSuffix}> credits</Text>
              </Text>
              {creditLimit > 0 ? (
                <View style={styles.creditTrack}>
                  <View style={[styles.creditFill, { width: `${Math.min(100, (creditRemaining / creditLimit) * 100)}%` as any }]} />
                </View>
              ) : null}
            </GlassCard>
          ) : null}

          {/* Amount Picker */}
          <GlassCard style={styles.pickerCard}>
            <Text style={styles.sectionTitle}>Choose Amount</Text>

            <View style={styles.inputRow}>
              <View style={styles.amountInputWrap}>
                <Text style={styles.amountPrefix}>LKR</Text>
                <TextInput
                  value={inputText}
                  onChangeText={(t) => setInputText(t.replace(/[^0-9]/g, ''))}
                  onBlur={handleInputBlur}
                  keyboardType="numeric"
                  style={styles.amountInput}
                  maxLength={6}
                  selectTextOnFocus
                />
              </View>
              <View style={styles.creditDisplay}>
                <Text style={styles.creditDisplayNum}>{creditAmount.toLocaleString()}</Text>
                <Text style={styles.creditDisplayLabel}>credits</Text>
              </View>
            </View>

            <View style={styles.sliderWrap}>
              <Slider
                value={sliderValue}
                onValueChange={handleSlider}
                minimumValue={0}
                maximumValue={1}
                step={0}
                minimumTrackTintColor={Colors.primary}
                maximumTrackTintColor={Colors.surfaceElevated}
                thumbTintColor={Colors.primary}
                style={styles.slider}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>{CREDIT_MIN.toLocaleString()}</Text>
                <Text style={styles.sliderLabel}>{CREDIT_MAX.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.presetGrid}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => applyAmount(p)}
                  style={({ pressed }) => [
                    styles.preset,
                    creditAmount === p ? styles.presetActive : {},
                    pressed ? { opacity: 0.75 } : {},
                  ]}
                >
                  <Text style={[styles.presetText, creditAmount === p ? { color: Colors.primary } : {}]}>
                    {p >= 1000 ? `${p / 1000}K` : p}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.hint}>
              Min {CREDIT_MIN.toLocaleString()} · Max {CREDIT_MAX.toLocaleString()} · Multiples of {CREDIT_STEP}
            </Text>
          </GlassCard>

          {/* Phone */}
          <View>
            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+94 7X XXX XXXX"
              placeholderTextColor={Colors.textSubtle}
              keyboardType="phone-pad"
              style={styles.fieldInput}
            />
          </View>

          {/* Order Summary */}
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>AI Credits</Text>
              <Text style={styles.summaryValue}>{creditAmount.toLocaleString()} credits</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>LKR 1.00 / credit</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>LKR {lkrAmount.toLocaleString()}</Text>
            </View>
          </GlassCard>

          <VaultButton
            label={loading ? 'Opening PayHere...' : `Pay LKR ${lkrAmount.toLocaleString()} via PayHere`}
            onPress={handlePurchase}
            loading={loading}
            fullWidth
            icon={<MaterialIcons name="payment" size={18} color="#fff" />}
          />

          <View style={styles.payhereBadge}>
            <MaterialIcons name="lock" size={12} color={Colors.success} />
            <Text style={styles.payhereText}>Opens PayHere in secure in-app browser · LKR only</Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.glassBorder,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  aiIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.goldGlow, borderWidth: 1, borderColor: Colors.gold + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
  noAccessWrap: { flex: 1, padding: 20, justifyContent: 'center' },
  noAccessCard: { alignItems: 'center', gap: 12, paddingVertical: 36 },
  noAccessTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: Colors.textPrimary, letterSpacing: -0.2 },
  noAccessText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },
  balanceCard: { gap: 8, padding: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceLabel: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: Colors.textMuted },
  balanceAmount: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 30, color: Colors.textPrimary, letterSpacing: -1 },
  balanceSuffix: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: Colors.textMuted },
  creditTrack: { height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 4 },
  creditFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  pickerCard: { gap: 14, padding: 16 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.primary + '60',
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10, gap: 6,
  },
  amountPrefix: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: Colors.textMuted },
  amountInput: { flex: 1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 22, color: Colors.primary, padding: 0, includeFontPadding: false },
  creditDisplay: { alignItems: 'center', minWidth: 70 },
  creditDisplayNum: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: Colors.textPrimary, letterSpacing: -0.5 },
  creditDisplayLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: Colors.textMuted },
  sliderWrap: { gap: 4 },
  slider: { width: '100%', height: 36 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: Colors.textSubtle },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.glassBorder },
  presetActive: { borderColor: Colors.primary + '80', backgroundColor: Colors.primaryLight },
  presetText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: Colors.textMuted },
  hint: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: Colors.textSubtle, textAlign: 'center' },
  fieldLabel: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: Colors.textPrimary,
  },
  summaryCard: { gap: 8, padding: 16 },
  summaryTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: Colors.textPrimary, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  summaryLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMuted },
  summaryValue: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: Colors.textPrimary },
  summaryTotal: { borderTopWidth: 1, borderTopColor: Colors.glassBorder, paddingTop: 10, marginTop: 4 },
  summaryTotalLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: Colors.textPrimary },
  summaryTotalValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: Colors.primary },
  payhereBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' },
  payhereText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: Colors.textSubtle },
});
