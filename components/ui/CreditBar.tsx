// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

interface CreditBarProps {
  used: number;
  limit: number;
  remaining: number;
}

export function CreditBar({ used, limit, remaining }: CreditBarProps) {
  const pct = limit > 0 ? Math.min(1, used / limit) : 0;
  const barColor = pct > 0.85 ? Colors.error : pct > 0.6 ? Colors.warning : Colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>AI Credits</Text>
        <Text style={styles.value}>
          {remaining.toLocaleString()} / {limit.toLocaleString()} remaining
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: Colors.textMuted,
  },
  value: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: Colors.textSubtle,
  },
  track: {
    height: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
