// Powered by OnSpace.AI
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading]);

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 64,
      android: insets.bottom + 64,
      default: 70,
    }),
    paddingTop: 10,
    paddingBottom: Platform.select({
      ios: insets.bottom + 10,
      android: insets.bottom + 10,
      default: 10,
    }),
    paddingHorizontal: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSubtle,
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_500Medium',
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* 2. AI Tutor */}
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Tutor',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-awesome" size={size} color={color} />
          ),
        }}
      />

      {/* 3. Inbox */}
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <MaterialIcons name="notifications" size={size} color={color} />
            </View>
          ),
        }}
      />

      {/* 4. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden — subjects accessible via Home dashboard */}
      <Tabs.Screen
        name="subjects"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
