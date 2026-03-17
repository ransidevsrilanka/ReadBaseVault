// Powered by OnSpace.AI
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, VaultButton } from '@/components';
import { Colors, BorderRadius, Typography } from '@/constants/theme';
import { fetchRandomQuestions, saveQuizResult } from '@/services/content.service';
import { supabase } from '@/services/supabase';

type QuizPhase = 'loading' | 'intro' | 'active' | 'results';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, enrollment } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selected: number; correct: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: q } = await supabase.from('quizzes').select('*').eq('id', id).single();
        if (!q) return;
        setQuiz(q);
        const qs = await fetchRandomQuestions(q.topic_id, q.question_count, enrollment?.tier || 'starter');
        setQuestions(qs);
        setTimeLeft(q.time_limit || 600);
        setPhase('intro');
      } catch (_) {
        setPhase('intro');
      }
    };
    load();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [id]);

  const startQuiz = () => {
    setPhase('active');
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishQuiz([...answers]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected === null || !questions[currentIdx]) return;
    const q = questions[currentIdx];
    const correct = selected === q.correct_answer;
    const newAnswers = [...answers, { questionId: q.id, selected, correct }];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentIdx + 1 >= questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      finishQuiz(newAnswers);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const finishQuiz = async (finalAnswers: typeof answers) => {
    setPhase('results');
    if (!user || !quiz) return;
    const score = finalAnswers.filter((a) => a.correct).length;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    try {
      await saveQuizResult(user.id, quiz.id, score, finalAnswers.length, finalAnswers, timeTaken);
    } catch (_) {}
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const score = answers.filter((a) => a.correct).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = quiz ? pct >= (quiz.pass_percentage || 60) : false;

  if (phase === 'loading') {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (phase === 'intro') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Quiz</Text>
        </View>
        <View style={styles.introContent}>
          <GlassCard style={styles.introCard}>
            <MaterialIcons name="quiz" size={48} color={Colors.blue} />
            <Text style={styles.introTitle}>{quiz?.question_count || questions.length} Questions</Text>
            <View style={styles.introMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="timer" size={16} color={Colors.textMuted} />
                <Text style={styles.metaText}>{formatTime(quiz?.time_limit || 600)}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                <Text style={styles.metaText}>Pass: {quiz?.pass_percentage || 60}%</Text>
              </View>
            </View>
            <VaultButton label="Start Quiz" onPress={startQuiz} fullWidth style={{ marginTop: 8 }} />
          </GlassCard>
        </View>
      </View>
    );
  }

  if (phase === 'results') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quiz Results</Text>
        </View>
        <ScrollView contentContainerStyle={styles.resultsScroll}>
          <GlassCard style={[styles.resultsCard, { borderColor: passed ? Colors.success + '60' : Colors.error + '60' }]}>
            <MaterialIcons
              name={passed ? 'emoji-events' : 'replay'}
              size={52}
              color={passed ? Colors.gold : Colors.error}
            />
            <Text style={[styles.resultScore, { color: passed ? Colors.success : Colors.error }]}>{pct}%</Text>
            <Text style={styles.resultLabel}>{passed ? 'Passed!' : 'Not yet'}</Text>
            <Text style={styles.resultSub}>{score} of {questions.length} correct</Text>
          </GlassCard>

          {/* Answer review */}
          {questions.map((q, i) => {
            const ans = answers[i];
            if (!ans) return null;
            return (
              <GlassCard key={q.id} style={[styles.reviewCard, ans.correct ? { borderColor: Colors.success + '40' } : { borderColor: Colors.error + '40' }]}>
                <View style={styles.reviewHeader}>
                  <MaterialIcons name={ans.correct ? 'check-circle' : 'cancel'} size={16} color={ans.correct ? Colors.success : Colors.error} />
                  <Text style={styles.reviewQ} numberOfLines={3}>{q.question_text}</Text>
                </View>
                {!ans.correct && q.explanation ? (
                  <Text style={styles.reviewExplanation}>{q.explanation}</Text>
                ) : null}
              </GlassCard>
            );
          })}

          <VaultButton label="Back to Topic" onPress={() => router.back()} fullWidth style={{ marginTop: 8 }} />
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  }

  const current = questions[currentIdx];
  if (!current) return null;

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Quiz Header */}
      <View style={styles.header}>
        <Text style={styles.questionProgress}>
          {currentIdx + 1} / {questions.length}
        </Text>
        <View style={styles.timer}>
          <MaterialIcons name="timer" size={14} color={timeLeft < 60 ? Colors.error : Colors.textMuted} />
          <Text style={[styles.timerText, timeLeft < 60 ? { color: Colors.error } : {}]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentIdx) / questions.length) * 100}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.quizScroll} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <GlassCard style={styles.questionCard}>
          <Text style={styles.questionText}>{current.question_text}</Text>
          {current.difficulty ? (
            <View style={styles.diffBadge}>
              <Text style={styles.diffText}>{current.difficulty}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Options */}
        <View style={styles.optionsWrap}>
          {(current.options || []).map((opt: string, idx: number) => {
            const isSelected = selected === idx;
            const isCorrect = selected !== null && idx === current.correct_answer;
            const isWrong = isSelected && idx !== current.correct_answer;

            return (
              <Pressable
                key={idx}
                onPress={() => handleSelect(idx)}
                style={[
                  styles.option,
                  isSelected ? styles.optionSelected : {},
                  isCorrect ? styles.optionCorrect : {},
                  isWrong ? styles.optionWrong : {},
                ]}
              >
                <View style={[styles.optionLetter, isSelected ? { backgroundColor: Colors.primary } : {}]}>
                  <Text style={[styles.optionLetterText, isSelected ? { color: '#fff' } : {}]}>
                    {optionLetters[idx] || idx}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected ? { color: Colors.textPrimary } : {}]}>
                  {opt}
                </Text>
                {isCorrect ? <MaterialIcons name="check-circle" size={18} color={Colors.success} /> : null}
                {isWrong ? <MaterialIcons name="cancel" size={18} color={Colors.error} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* Explanation */}
        {selected !== null && current.explanation ? (
          <GlassCard style={styles.explanationCard}>
            <MaterialIcons name="lightbulb" size={16} color={Colors.gold} />
            <Text style={styles.explanationText}>{current.explanation}</Text>
          </GlassCard>
        ) : null}

        {selected !== null ? (
          <VaultButton
            label={currentIdx + 1 >= questions.length ? 'Finish Quiz' : 'Next Question'}
            onPress={handleNext}
            fullWidth
            style={{ marginTop: 8 }}
          />
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.textMuted },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.glass, borderWidth: 1,
    borderColor: Colors.glassBorder, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  questionProgress: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
  },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 16,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  progressTrack: { height: 3, backgroundColor: Colors.surfaceElevated },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  quizScroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },
  questionCard: { padding: 20, gap: 10 },
  questionText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
  },
  diffText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  optionsWrap: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: 14,
  },
  optionSelected: { borderColor: Colors.primary + '80', backgroundColor: Colors.primaryLight },
  optionCorrect: { borderColor: Colors.success + '80', backgroundColor: Colors.successLight },
  optionWrong: { borderColor: Colors.error + '80', backgroundColor: Colors.errorLight },
  optionLetter: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  optionLetterText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13, color: Colors.textMuted,
  },
  optionText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14, color: Colors.textSecondary,
    lineHeight: 20,
  },
  explanationCard: { flexDirection: 'row', gap: 8, padding: 12, alignItems: 'flex-start' },
  explanationText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13, color: Colors.textMuted,
    lineHeight: 19,
  },
  introContent: { flex: 1, padding: 20, justifyContent: 'center' },
  introCard: { alignItems: 'center', gap: 14, padding: 28 },
  introTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22, color: Colors.textPrimary, letterSpacing: -0.3,
  },
  introMeta: { flexDirection: 'row', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: Colors.textMuted },
  resultsScroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },
  resultsCard: { alignItems: 'center', gap: 8, padding: 28 },
  resultScore: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 52, letterSpacing: -1,
  },
  resultLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20, color: Colors.textPrimary,
  },
  resultSub: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14, color: Colors.textMuted,
  },
  reviewCard: { padding: 12, gap: 6 },
  reviewHeader: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reviewQ: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13, color: Colors.textPrimary, lineHeight: 19,
  },
  reviewExplanation: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginLeft: 24,
  },
});
