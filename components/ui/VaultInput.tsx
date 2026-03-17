// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '@/constants/theme';

interface VaultInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function VaultInput({ label, error, containerStyle, isPassword, ...rest }: VaultInputProps) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          focused ? styles.focused : {},
          error ? styles.errored : {},
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={isPassword && !showPass}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, rest.style as any]}
          placeholderTextColor={Colors.textSubtle}
        />
        {isPassword ? (
          <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn} hitSlop={8}>
            <MaterialIcons
              name={showPass ? 'visibility' : 'visibility-off'}
              size={20}
              color={Colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: -0.1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  focused: { borderColor: Colors.primary },
  errored: { borderColor: Colors.error },
  input: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  eyeBtn: { padding: 4 },
  error: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: Colors.error,
  },
});
