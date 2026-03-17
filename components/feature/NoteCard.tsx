// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, TIER_DISPLAY } from '@/constants/theme';

interface NoteCardProps {
  note: any;
  onPress: () => void;
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const tierInfo = TIER_DISPLAY[note.min_tier] || { label: note.min_tier, color: Colors.textMuted };
  const canAccess = note.canAccess !== false;

  return (
    <Pressable
      onPress={canAccess ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        !canAccess ? styles.locked : {},
        pressed && canAccess ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : {},
      ]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons
          name={note.is_model_paper ? 'assignment' : 'description'}
          size={22}
          color={canAccess ? Colors.primary : Colors.textSubtle}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !canAccess ? styles.titleLocked : {}]} numberOfLines={2}>
            {note.title}
          </Text>
          {note.is_model_paper ? (
            <View style={styles.mpBadge}>
              <Text style={styles.mpText}>Model</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.meta}>
          {note.page_count ? (
            <Text style={styles.metaText}>{note.page_count} pages</Text>
          ) : null}
          <View style={[styles.tierDot, { backgroundColor: tierInfo.color + '33' }]}>
            <Text style={[styles.tierLabel, { color: tierInfo.color }]}>{tierInfo.label}</Text>
          </View>
        </View>
      </View>
      {!canAccess ? (
        <MaterialIcons name="lock" size={18} color={Colors.textSubtle} />
      ) : (
        <MaterialIcons name="open-in-new" size={18} color={Colors.textSubtle} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: 8,
  },
  locked: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  title: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: -0.1,
  },
  titleLocked: { color: Colors.textMuted },
  mpBadge: {
    backgroundColor: Colors.gold + '22',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mpText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: Colors.gold,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: Colors.textSubtle,
  },
  tierDot: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
  },
});
