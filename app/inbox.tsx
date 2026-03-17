// Powered by OnSpace.AI
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components';
import { Colors, BorderRadius } from '@/constants/theme';
import { fetchInboxMessages, markMessageRead } from '@/services/enrollment.service';

export default function InboxScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    fetchInboxMessages(user.id).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await markMessageRead(id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  };

  const getIcon = (type: string) => {
    if (type === 'warning') return { name: 'warning', color: Colors.warning };
    if (type === 'success') return { name: 'check-circle', color: Colors.success };
    return { name: 'notifications', color: Colors.primary };
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Inbox</Text>
        <Text style={styles.unread}>
          {messages.filter((m) => !m.is_read).length} unread
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <GlassCard style={{ alignItems: 'center', gap: 10, paddingVertical: 36 }}>
                <MaterialIcons name="inbox" size={40} color={Colors.textSubtle} />
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: Colors.textMuted }}>
                  No messages yet
                </Text>
              </GlassCard>
            </View>
          }
          renderItem={({ item }) => {
            const icon = getIcon(item.notification_type);
            return (
              <Pressable
                onPress={() => { if (!item.is_read) handleMarkRead(item.id); }}
                style={({ pressed }) => [
                  styles.msgCard,
                  !item.is_read ? styles.unreadCard : {},
                  pressed ? { opacity: 0.8 } : {},
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: icon.color + '22' }]}>
                  <MaterialIcons name={icon.name as any} size={18} color={icon.color} />
                </View>
                <View style={styles.msgContent}>
                  <View style={styles.msgTopRow}>
                    <Text style={styles.msgSubject} numberOfLines={1}>
                      {item.subject || 'Notification'}
                    </Text>
                    {!item.is_read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.msgBody} numberOfLines={3}>{item.body}</Text>
                  <Text style={styles.msgTime}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.glassBorder,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18, color: Colors.textPrimary, letterSpacing: -0.3,
  },
  unread: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13, color: Colors.primary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  emptyView: { flex: 1 },
  msgCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    padding: 14,
  },
  unreadCard: {
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primaryGlow,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  msgContent: { flex: 1, gap: 4 },
  msgTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  msgSubject: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14, color: Colors.textPrimary,
  },
  unreadDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  msgBody: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13, color: Colors.textMuted, lineHeight: 19,
  },
  msgTime: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11, color: Colors.textSubtle,
  },
});
