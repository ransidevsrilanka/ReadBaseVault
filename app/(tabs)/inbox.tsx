// Powered by OnSpace.AI
// Inbox — Tab Screen (bell icon, no back button)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components';
import { Colors, BorderRadius } from '@/constants/theme';
import { fetchInboxMessages, markMessageRead } from '@/services/enrollment.service';

export default function InboxTabScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const load = async () => {
    if (!user) return;
    const msgs = await fetchInboxMessages(user.id);
    setMessages(msgs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkRead = async (id: string) => {
    await markMessageRead(id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  const getIcon = (type: string) => {
    if (type === 'warning') return { name: 'warning', color: Colors.warning };
    if (type === 'success') return { name: 'check-circle', color: Colors.success };
    return { name: 'notifications', color: Colors.primary };
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="notifications" size={22} color={Colors.primary} />
          <Text style={styles.title}>Inbox</Text>
        </View>
        {unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        ) : null}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <GlassCard style={styles.emptyCard}>
                <MaterialIcons name="notifications-none" size={44} color={Colors.textSubtle} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>
                  Announcements, updates, and notifications from ReadBase will appear here.
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.glassBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22, color: Colors.textPrimary, letterSpacing: -0.5,
  },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11, color: '#fff',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  emptyView: { flex: 1, marginTop: 40 },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: Colors.textSecondary },
  emptyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  msgCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg, padding: 14,
  },
  unreadCard: { borderColor: Colors.primary + '40', backgroundColor: Colors.primaryGlow },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  msgContent: { flex: 1, gap: 4 },
  msgTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  msgSubject: { flex: 1, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: Colors.textPrimary },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  msgBody: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: Colors.textMuted, lineHeight: 19 },
  msgTime: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: Colors.textSubtle },
});
