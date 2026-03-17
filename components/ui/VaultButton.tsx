// Powered by OnSpace.AI
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

interface VaultButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'gold' | 'glass' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANTS = {
  primary: {
    bg: Colors.primary,
    text: '#fff',
    border: Colors.primary,
  },
  gold: {
    bg: Colors.gold,
    text: '#000',
    border: Colors.gold,
  },
  glass: {
    bg: Colors.glass,
    text: Colors.textPrimary,
    border: Colors.glassBorder,
  },
  danger: {
    bg: Colors.errorLight,
    text: Colors.error,
    border: Colors.error,
  },
};

export function VaultButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  textStyle,
  icon,
  fullWidth,
}: VaultButtonProps) {
  const v = VARIANTS[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        fullWidth ? styles.fullWidth : {},
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.inner}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.text, { color: v.text }, textStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: { width: '100%' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  text: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    letterSpacing: -0.2,
  },
});
