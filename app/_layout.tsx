// Powered by OnSpace.AI
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" backgroundColor={Colors.background} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="subject/[id]" />
            <Stack.Screen name="topic/[id]" />
            <Stack.Screen name="note/[id]" />
            <Stack.Screen name="quiz/[id]" />
            <Stack.Screen name="flashcards/[id]" />
            <Stack.Screen name="print-request" />
            <Stack.Screen name="buy-credits" />
            <Stack.Screen name="inbox" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
