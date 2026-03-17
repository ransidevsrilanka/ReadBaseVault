// Powered by OnSpace.AI
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  const { user, isLoading, enrollment, userSubjects } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!enrollment) {
      router.replace('/login');
      return;
    }

    // Check if subjects have been selected
    if (!userSubjects || !userSubjects.is_confirmed) {
      router.replace('/login');
      return;
    }

    router.replace('/(tabs)');
  }, [user, isLoading, enrollment, userSubjects]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}
