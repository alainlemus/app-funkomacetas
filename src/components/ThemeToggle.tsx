import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 32 }: ThemeToggleProps) {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: isDark ? colors.surfaceAlt : 'rgba(255,255,255,0.2)' }]}
      onPress={toggleTheme}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={size - 16}
        color={isDark ? colors.warning : '#fff'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});