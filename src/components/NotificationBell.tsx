import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useUnreadCount } from '@/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius } from '@/theme';

/** Campana de notificaciones con contador de no leídas. */
export function NotificationBell() {
  const { session } = useAuth();
  const { data: unread } = useUnreadCount();

  if (!session) return null;
  const count = unread ?? 0;

  return (
    <Link href="/activity" asChild>
      <Pressable hitSlop={8} style={styles.wrap}>
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 2 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onAccent, fontSize: 11, fontWeight: '800' },
});
