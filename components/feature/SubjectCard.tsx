// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, GRADE_DISPLAY } from '@/constants/theme';

const SUBJECT_ICONS: Record<string, string> = {
  CM: 'functions',
  PHY: 'science',
  BIO: 'biotech',
  CHEM: 'science',
  ICT: 'computer',
  ACC: 'account-balance',
  ECO: 'trending-up',
  BUS: 'business',
  ART: 'palette',
  LIT: 'menu-book',
};

const SUBJECT_COLORS: Record<string, string> = {
  CM: 'hsl(262, 83%, 57%)',
  PHY: '#1da1f2',
  BIO: 'hsl(142, 76%, 36%)',
  CHEM: '#f59e0b',
  ICT: '#06b6d4',
  ACC: Colors.gold,
  ECO: '#10b981',
  BUS: Colors.gold,
  ART: '#ec4899',
  LIT: '#8b5cf6',
};

interface SubjectCardProps {
  subject: any;
  onPress: () => void;
}

export function SubjectCard({ subject, onPress }: SubjectCardProps) {
  const code = subject.subject_code || '';
  const icon = SUBJECT_ICONS[code] || 'book';
  const color = SUBJECT_COLORS[code] || Colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : {},
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <MaterialIcons name={icon as any} size={28} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{subject.name}</Text>
        <Text style={styles.grade}>{GRADE_DISPLAY[subject.grade] || subject.grade}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  grade: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
