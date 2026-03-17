// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, VaultButton, SkeletonCard } from '@/components';
import { Colors, BorderRadius } from '@/constants/theme';
import {
  fetchTopicsForSubject,
  calculatePrintPrice,
  submitPrintRequest,
  fetchPrintRequests,
} from '@/services/content.service';
import { fetchSubjectsForEnrollment } from '@/services/enrollment.service';
import {
  generatePayHereHash,
  buildPayHereCheckoutHtml,
  updatePrintPaymentStatus,
  PAYHERE_SANDBOX,
} from '@/services/payhere.service';
import { PayHereWebView } from '@/components/feature/PayHereWebView';
import { useAlert } from '@/template';

type Step = 'select' | 'review' | 'delivery' | 'confirm';

export default function PrintRequestScreen() {
  const { user, profile, enrollment, userSubjects } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [priceData, setPriceData] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cod'>('bank_transfer');
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingRequestNumber, setPendingRequestNumber] = useState('');
  const [checkoutHtml, setCheckoutHtml] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (!enrollment || !userSubjects || !user) return;
    Promise.all([
      fetchSubjectsForEnrollment(enrollment, userSubjects),
      fetchPrintRequests(user.id),
    ]).then(([subs, reqs]) => {
      setSubjects(subs);
      setMyRequests(reqs);
      setLoadingSubjects(false);
    });
  }, [enrollment, userSubjects]);

  useEffect(() => {
    if (!selectedSubject) return;
    fetchTopicsForSubject(selectedSubject.id).then(setTopics);
  }, [selectedSubject]);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const goToReview = async () => {
    if (selectedTopicIds.length === 0) {
      showAlert('Selection Required', 'Please select at least one topic.');
      return;
    }
    setLoading(true);
    try {
      const data = await calculatePrintPrice(selectedTopicIds, [], 'notes');
      setPriceData(data);
      setStep('review');
    } catch {
      showAlert('Error', 'Could not calculate price. Please try again.');
    }
    setLoading(false);
  };

  const submitRequest = async () => {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      showAlert('Missing Details', 'Please fill in all delivery details.');
      return;
    }
    setLoading(true);
    try {
      const result = await submitPrintRequest({
        user_id: user!.id,
        subject_id: selectedSubject?.id,
        subject_name: selectedSubject?.name,
        print_type: 'notes',
        topic_ids: selectedTopicIds,
        selected_paper_ids: [],
        full_name: fullName,
        phone,
        address,
        city,
        payment_method: paymentMethod,
        estimated_pages: priceData?.totalPages,
        estimated_price: priceData?.subtotal,
        delivery_fee: priceData?.deliveryFee,
        total_amount: priceData?.totalAmount,
        payment_status: paymentMethod === 'cod' ? 'pending_payment' : 'pending',
        status: 'pending',
      });

      if (paymentMethod === 'bank_transfer') {
        // Launch PayHere for online payment
        await launchPayHereForPrint(result.request_number, priceData.totalAmount);
      } else {
        // COD — no online payment
        showAlert(
          'Request Submitted!',
          `Your print request #${result.request_number} has been submitted. Cash on delivery applies.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch {
      showAlert('Error', 'Failed to submit request. Please try again.');
    }
    setLoading(false);
  };

  const launchPayHereForPrint = async (requestNumber: string, amount: number) => {
    if (!user || !profile) return;
    try {
      setPendingRequestNumber(requestNumber);
      const nameParts = (profile.full_name || fullName || 'ReadBase User').split(' ');
      const firstName = nameParts[0] || 'ReadBase';
      const lastName = nameParts.slice(1).join(' ') || 'Student';

      const { hash, merchantId } = await generatePayHereHash(requestNumber, amount, 'LKR');

      const html = buildPayHereCheckoutHtml({
        merchantId,
        hash,
        orderId: requestNumber,
        items: `Print Request — ${selectedSubject?.name || 'Study Notes'}`,
        amount: amount.toFixed(2),
        currency: 'LKR',
        firstName,
        lastName,
        email: user.email || '',
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        country: 'Sri Lanka',
        sandbox: PAYHERE_SANDBOX,
      });

      setCheckoutHtml(html);
      setShowPayment(true);
    } catch (err: any) {
      showAlert('Payment Error', err?.message || 'Could not initiate PayHere payment.');
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setShowPayment(false);
    try {
      await updatePrintPaymentStatus(pendingRequestNumber, paymentId, 'paid');
    } catch (_) {}
    showAlert(
      'Payment Successful!',
      `Request #${pendingRequestNumber} confirmed. Your notes will be printed and shipped shortly.`,
      [{ text: 'Great!', onPress: () => router.back() }]
    );
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    showAlert(
      'Payment Cancelled',
      `Your request #${pendingRequestNumber} is saved as pending. You can pay later or choose COD.`
    );
  };

  const handlePaymentError = (msg: string) => {
    setShowPayment(false);
    showAlert('Payment Error', msg || 'An error occurred. Request saved — please try again.');
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: Colors.warning,
    approved: Colors.blue,
    shipped: Colors.primary,
    delivered: Colors.success,
    rejected: Colors.error,
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step === 'review') { setStep('select'); return; }
            if (step === 'delivery') { setStep('review'); return; }
            if (step === 'confirm') { setStep('delivery'); return; }
            router.back();
          }}
          style={styles.backBtn}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Print Notes</Text>
        <Pressable onPress={() => setShowHistory(!showHistory)} style={styles.historyBtn} hitSlop={8}>
          <MaterialIcons name="history" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        {(['select', 'review', 'delivery', 'confirm'] as Step[]).map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, step === s ? styles.stepDotActive : {},
              (['select', 'review', 'delivery', 'confirm'].indexOf(step) > i) ? styles.stepDotDone : {}]}>
              <Text style={styles.stepNum}>{i + 1}</Text>
            </View>
            {i < 3 ? <View style={[styles.stepLine, (['select', 'review', 'delivery', 'confirm'].indexOf(step) > i) ? styles.stepLineDone : {}]} /> : null}
          </View>
        ))}
      </View>

      {/* History Panel */}
      {showHistory ? (
        <ScrollView style={styles.historyPanel} contentContainerStyle={{ padding: 16, gap: 8 }}>
          <Text style={styles.sectionTitle}>My Print Requests</Text>
          {myRequests.length === 0 ? (
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMuted }}>
              No print requests yet.
            </Text>
          ) : myRequests.map((r) => (
            <GlassCard key={r.id} style={{ padding: 12, gap: 6 }}>
              <View style={styles.reqRow}>
                <Text style={styles.reqNum}>#{r.request_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[r.status] || Colors.textSubtle) + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[r.status] || Colors.textSubtle }]}>
                    {r.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.reqSubject}>{r.subject_name}</Text>
              <View style={styles.reqBottomRow}>
                <Text style={styles.reqTotal}>LKR {(r.total_amount || 0).toLocaleString()}</Text>
                {r.payment_status ? (
                  <View style={[styles.statusBadge, {
                    backgroundColor: r.payment_status === 'paid' ? Colors.success + '22' : Colors.warning + '22'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: r.payment_status === 'paid' ? Colors.success : Colors.warning
                    }]}>
                      {r.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                    </Text>
                  </View>
                ) : null}
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* STEP 1: Select */}
          {step === 'select' ? (
            <View style={{ gap: 16 }}>
              <Text style={styles.stepLabel}>Step 1: Select Content</Text>

              {/* Subject Selection */}
              <View>
                <Text style={styles.sectionTitle}>Choose Subject</Text>
                {loadingSubjects ? <SkeletonCard /> : subjects.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => { setSelectedSubject(s); setSelectedTopicIds([]); }}
                    style={[styles.selectCard, selectedSubject?.id === s.id ? styles.selectCardActive : {}]}
                  >
                    <Text style={styles.selectCardText}>{s.name}</Text>
                    {selectedSubject?.id === s.id ? <MaterialIcons name="check-circle" size={18} color={Colors.primary} /> : null}
                  </Pressable>
                ))}
              </View>

              {/* Topic Selection */}
              {selectedSubject && topics.length > 0 ? (
                <View>
                  <View style={styles.topicHeader}>
                    <Text style={styles.sectionTitle}>Select Topics</Text>
                    <Pressable onPress={() => setSelectedTopicIds(selectedTopicIds.length === topics.length ? [] : topics.map((t) => t.id))}>
                      <Text style={styles.selectAll}>
                        {selectedTopicIds.length === topics.length ? 'Deselect All' : 'Select All'}
                      </Text>
                    </Pressable>
                  </View>
                  {topics.map((t, i) => (
                    <Pressable
                      key={t.id}
                      onPress={() => toggleTopic(t.id)}
                      style={[styles.topicCard, selectedTopicIds.includes(t.id) ? styles.topicCardActive : {}]}
                    >
                      <View style={[styles.checkbox, selectedTopicIds.includes(t.id) ? styles.checkboxActive : {}]}>
                        {selectedTopicIds.includes(t.id) ? <MaterialIcons name="check" size={14} color="#fff" /> : null}
                      </View>
                      <Text style={styles.topicText}>{i + 1}. {t.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <VaultButton
                label={`Calculate Price (${selectedTopicIds.length} topics)`}
                onPress={goToReview}
                loading={loading}
                disabled={selectedTopicIds.length === 0}
                fullWidth
              />
            </View>
          ) : null}

          {/* STEP 2: Review */}
          {step === 'review' && priceData ? (
            <View style={{ gap: 16 }}>
              <Text style={styles.stepLabel}>Step 2: Review & Price</Text>
              <GlassCard style={{ gap: 12 }}>
                <Text style={styles.sectionTitle}>{selectedSubject?.name}</Text>
                <Text style={styles.reviewSub}>{selectedTopicIds.length} topic(s) selected</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Total Pages</Text>
                  <Text style={styles.priceValue}>{priceData.totalPages}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Notes Cost</Text>
                  <Text style={styles.priceValue}>LKR {priceData.subtotal?.toLocaleString()}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Fee</Text>
                  <Text style={styles.priceValue}>LKR {priceData.deliveryFee?.toLocaleString()}</Text>
                </View>
                <View style={[styles.priceRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>LKR {priceData.totalAmount?.toLocaleString()}</Text>
                </View>
              </GlassCard>
              <VaultButton label="Continue to Delivery" onPress={() => setStep('delivery')} fullWidth />
            </View>
          ) : null}

          {/* STEP 3: Delivery */}
          {step === 'delivery' ? (
            <View style={{ gap: 14 }}>
              <Text style={styles.stepLabel}>Step 3: Delivery Details</Text>
              {[
                { label: 'Full Name', value: fullName, set: setFullName, placeholder: 'Your full name' },
                { label: 'Phone', value: phone, set: setPhone, placeholder: '+94 7X XXX XXXX', keyboardType: 'phone-pad' },
                { label: 'Address', value: address, set: setAddress, placeholder: 'Street address' },
                { label: 'City', value: city, set: setCity, placeholder: 'City' },
              ].map((f) => (
                <View key={f.label}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    value={f.value}
                    onChangeText={f.set}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.textSubtle}
                    keyboardType={(f as any).keyboardType}
                    style={styles.fieldInput}
                  />
                </View>
              ))}

              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.payRow}>
                {[
                  { key: 'bank_transfer', label: 'Pay Online', sublabel: 'Card / Bank · via PayHere', icon: 'payment' },
                  { key: 'cod', label: 'Cash on Delivery', sublabel: 'Pay when delivered', icon: 'local-shipping' },
                ].map((pm) => (
                  <Pressable
                    key={pm.key}
                    onPress={() => setPaymentMethod(pm.key as any)}
                    style={[styles.payOption, paymentMethod === pm.key ? styles.payOptionActive : {}]}
                  >
                    <MaterialIcons name={pm.icon as any} size={22} color={paymentMethod === pm.key ? Colors.primary : Colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payLabel, paymentMethod === pm.key ? { color: Colors.primary } : {}]}>{pm.label}</Text>
                      <Text style={styles.paySublabel}>{pm.sublabel}</Text>
                    </View>
                    {paymentMethod === pm.key ? (
                      <MaterialIcons name="check-circle" size={18} color={Colors.primary} />
                    ) : null}
                  </Pressable>
                ))}
              </View>

              {/* PayHere badge */}
              {paymentMethod === 'bank_transfer' ? (
                <View style={styles.payhereBadge}>
                  <MaterialIcons name="lock" size={13} color={Colors.success} />
                  <Text style={styles.payhereText}>Secured by PayHere · 256-bit SSL</Text>
                </View>
              ) : null}

              <VaultButton
                label={paymentMethod === 'bank_transfer' ? 'Submit & Pay via PayHere' : 'Submit (Cash on Delivery)'}
                onPress={submitRequest}
                loading={loading}
                fullWidth
                icon={<MaterialIcons name={paymentMethod === 'bank_transfer' ? 'payment' : 'local-shipping'} size={18} color="#fff" />}
              />
            </View>
          ) : null}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* PayHere WebView Modal */}
      <PayHereWebView
        visible={showPayment}
        checkoutHtml={checkoutHtml}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
        onError={handlePaymentError}
        onDismiss={() => setShowPayment(false)}
      />
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
  headerTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18, color: Colors.textPrimary, letterSpacing: -0.3,
  },
  historyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderMuted,
  },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  stepDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepNum: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: Colors.textMuted },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.surfaceElevated, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  historyPanel: { flex: 1 },
  stepLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16, color: Colors.textPrimary, letterSpacing: -0.2, marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  selectCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg, padding: 14, marginBottom: 8,
  },
  selectCardActive: { borderColor: Colors.primary + '80', backgroundColor: Colors.primaryLight },
  selectCardText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14, color: Colors.textPrimary,
  },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  selectAll: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, color: Colors.primary },
  topicCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.md, padding: 12, marginBottom: 6,
  },
  topicCardActive: { borderColor: Colors.primary + '60', backgroundColor: Colors.primaryLight },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  topicText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13, color: Colors.textPrimary,
  },
  reviewSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13, color: Colors.textMuted,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  priceLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.textMuted },
  priceValue: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  totalRow: {
    borderTopWidth: 1, borderTopColor: Colors.glassBorder, paddingTop: 10, marginTop: 4,
  },
  totalLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: Colors.textPrimary },
  totalValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: Colors.primary },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13, color: Colors.textMuted, marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15, color: Colors.textPrimary,
  },
  payRow: { gap: 10 },
  payOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.md, padding: 14,
  },
  payOptionActive: { borderColor: Colors.primary + '80', backgroundColor: Colors.primaryLight },
  payLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14, color: Colors.textMuted,
  },
  paySublabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11, color: Colors.textSubtle, marginTop: 2,
  },
  payhereBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center',
  },
  payhereText: {
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: Colors.textSubtle,
  },
  reqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqNum: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: Colors.textPrimary },
  reqBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  statusText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, textTransform: 'capitalize' },
  reqSubject: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMuted },
  reqTotal: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: Colors.primary },
});
