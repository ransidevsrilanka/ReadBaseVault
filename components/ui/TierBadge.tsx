// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TIER_DISPLAY } from '@/constants/theme';
import { Colors, BorderRadius } from '@/constants/theme';

interface TierBadgeProps {
  tier: string;
  size?: 'sm' | 'md';
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const info = TIER_DISPLAY[tier] || { label: tier, color: Colors.textMuted, level: 0 };
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { borderColor: info.color },
        small ? styles.badgeSm : styles.badgeMd,
      ]}
    >
      <Text style={[styles.text, { color: info.color }, small ? styles.textSm : styles.textMd]}>
        ✦ {info.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.5,
  },
  textMd: { fontSize: 12 },
  textSm: { fontSize: 10 },
});
