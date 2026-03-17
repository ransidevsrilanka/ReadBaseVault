// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '@/constants/theme';

interface TopicCardProps {
  topic: any;
  onPress: () => void;
  index: number;
}

export function TopicCard({ topic, onPress, index }: TopicCardProps) {
  const accent = index % 3 === 0 ? Colors.primary : index % 3 === 1 ? Colors.blue : Colors.gold;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : {},
      ]}
    >
      <View style={[styles.indexBadge, { backgroundColor: accent + '22', borderColor: accent + '44' }]}>
        <Text style={[styles.indexText, { color: accent }]}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{topic.name}</Text>
        {topic.description ? (
          <Text style={styles.desc} numberOfLines={1}>{topic.description}</Text>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={20} color={Colors.textSubtle} />
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
  indexBadge: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
  },
  info: { flex: 1 },
  name: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  desc: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
