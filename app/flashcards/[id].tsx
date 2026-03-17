// Powered by OnSpace.AI
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard, VaultButton } from '@/components';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { fetchFlashcards } from '@/services/content.service';
import { supabase } from '@/services/supabase';

const { width } = Dimensions.get('window');

export default function FlashcardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [set, setSet] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: s } = await supabase.from('flashcard_sets').select('*').eq('id', id).single();
        setSet(s);
        const c = await fetchFlashcards(id);
        setCards(c);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [id]);

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start(() => setFlipped(!flipped));
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const nextCard = () => {
    if (currentIdx + 1 >= cards.length) {
      setCompleted(true);
      return;
    }
    setFlipped(false);
    flipAnim.setValue(0);
    setCurrentIdx((i) => i + 1);
  };

  const prevCard = () => {
    if (currentIdx === 0) return;
    setFlipped(false);
    flipAnim.setValue(0);
    setCurrentIdx((i) => i - 1);
  };

  const restart = () => {
    setCurrentIdx(0);
    setFlipped(false);
    flipAnim.setValue(0);
    setCompleted(false);
  };

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const current = cards[currentIdx];

  if (completed) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{set?.title || 'Flashcards'}</Text>
        </View>
        <View style={styles.completeView}>
          <GlassCard style={styles.completeCard}>
            <MaterialIcons name="emoji-events" size={56} color={Colors.gold} />
            <Text style={styles.completeTitle}>Session Complete!</Text>
            <Text style={styles.completeSub}>You reviewed all {cards.length} cards.</Text>
            <VaultButton label="Review Again" onPress={restart} fullWidth variant="glass" />
            <VaultButton label="Back to Topic" onPress={() => router.back()} fullWidth />
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{set?.title || 'Flashcards'}</Text>
        <Text style={styles.cardCount}>{currentIdx + 1}/{cards.length}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentIdx + 1) / cards.length) * 100}%` as any }]} />
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Pressable onPress={flipCard} style={styles.cardPressable}>
          {/* Front */}
          <Animated.View
            style={[
              styles.flashcard,
              styles.flashcardFront,
              { transform: [{ rotateY: frontRotate }] },
            ]}
          >
            <Text style={styles.cardSide}>Front</Text>
            <Text style={styles.cardContent}>{current?.front_text}</Text>
            <View style={styles.tapHint}>
              <MaterialIcons name="touch-app" size={14} color={Colors.textSubtle} />
              <Text style={styles.tapText}>Tap to flip</Text>
            </View>
          </Animated.View>

          {/* Back */}
          <Animated.View
            style={[
              styles.flashcard,
              styles.flashcardBack,
              { transform: [{ rotateY: backRotate }] },
            ]}
          >
            <Text style={[styles.cardSide, { color: Colors.primary }]}>Answer</Text>
            <Text style={styles.cardContent}>{current?.back_text}</Text>
            <View style={styles.tapHint}>
              <MaterialIcons name="touch-app" size={14} color={Colors.textSubtle} />
              <Text style={styles.tapText}>Tap to flip back</Text>
            </View>
          </Animated.View>
        </Pressable>
      </View>

      {/* Navigation */}
      <View style={[styles.nav, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={prevCard}
          disabled={currentIdx === 0}
          style={[styles.navBtn, currentIdx === 0 ? { opacity: 0.3 } : {}]}
        >
          <MaterialIcons name="arrow-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.navCenter}>
          {flipped ? (
            <VaultButton label="Next Card →" onPress={nextCard} style={styles.nextBtn} />
          ) : (
            <Pressable onPress={flipCard} style={styles.flipHintBtn}>
              <Text style={styles.flipHintText}>Tap card to reveal answer</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={nextCard} style={styles.navBtn}>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.glassBorder,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17, color: Colors.textPrimary, letterSpacing: -0.3,
  },
  cardCount: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14, color: Colors.primary,
  },
  progressTrack: { height: 3, backgroundColor: Colors.surfaceElevated },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardPressable: { width: '100%', aspectRatio: 1.4 },
  flashcard: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.glassBorder,
    padding: 28,
    alignItems: 'center', justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  flashcardFront: {
    backgroundColor: Colors.surfaceElevated,
    gap: 14,
  },
  flashcardBack: {
    backgroundColor: Colors.primaryGlow + 'aa',
    borderColor: Colors.primary + '60',
    gap: 14,
  },
  cardSide: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12, color: Colors.textSubtle,
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  cardContent: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 18, color: Colors.textPrimary,
    textAlign: 'center', lineHeight: 28, letterSpacing: -0.3,
  },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tapText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11, color: Colors.textSubtle,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  navBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  navCenter: { flex: 1, alignItems: 'center' },
  nextBtn: { paddingHorizontal: 24 },
  flipHintBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  flipHintText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13, color: Colors.textMuted,
  },
  completeView: { flex: 1, padding: 24, justifyContent: 'center' },
  completeCard: { alignItems: 'center', gap: 12, padding: 32 },
  completeTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22, color: Colors.textPrimary, letterSpacing: -0.3,
  },
  completeSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14, color: Colors.textMuted, marginBottom: 8,
  },
});
