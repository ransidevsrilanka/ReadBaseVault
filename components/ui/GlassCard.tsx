// Powered by OnSpace.AI
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  noPad?: boolean;
  glowColor?: string;
}

export function GlassCard({ children, style, noPad, glowColor }: GlassCardProps) {
  return (
    <View style={[styles.card, noPad ? {} : styles.pad, style]}>
      {glowColor ? (
        <View style={[styles.glow, { backgroundColor: glowColor }]} />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  pad: {
    padding: 16,
  },
  glow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.15,
  },
});
