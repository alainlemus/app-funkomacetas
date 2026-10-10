import React from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors, fonts } from './src/theme';

// Fuente base de toda la app (los títulos usan fonts.display en sus estilos).
const baseFont = { fontFamily: fonts.regular };
(Text as any).defaultProps = { ...(Text as any).defaultProps, style: baseFont };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, style: baseFont };

export default function App() {
  const [loaded] = useFonts({ Fredoka_600SemiBold, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
