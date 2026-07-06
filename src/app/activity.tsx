import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlatList } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  useMarkNotificationsRead,
  useNotifications,
  type NotificationRow,
} from '@/hooks/useNotifications';
import { timeAgo } from '@/lib/format';
import { colors, radius, spacing, type } from '@/theme';

function text(n: NotificationRow): string {
  switch (n.type) {
    case 'follow':
      return 'empezó a seguirte';
    case 'comment_like':
      return 'le gustó tu comentario';
  }
}

function target(n: NotificationRow): string {
  if (n.type === 'follow') return `/user/${n.actor_id}`;
  if (n.season_number != null && n.episode_number != null && n.tmdb_id != null) {
    return `/episode/${n.tmdb_id}/${n.season_number}/${n.episode_number}`;
  }
  if (n.tmdb_id != null) return `/title/${n.media_type ?? 'tv'}/${n.tmdb_id}`;
  return `/user/${n.actor_id}`;
}

export default function ActivityScreen() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  // Al abrir (y volver a enfocar) marca todo como leído.
  useFocusEffect(
    useCallback(() => {
      markRead.mutate();
    }, []),
  );

  return (
    <Screen edges={[]}>
      <FlatList
        data={data ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xxl }}
            />
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="notifications-outline"
                size={30}
                color={colors.textFaint}
              />
              <Text style={styles.emptyText}>
                Aquí verás cuando alguien te siga o le guste tu comentario.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const username = item.actor?.username ?? 'alguien';
          const avatarUri = item.actor?.avatar_url ?? null;
          return (
            <Pressable
              onPress={() => router.push(target(item) as any)}
              style={[styles.row, !item.read && styles.rowUnread]}>
              <View style={styles.avatar}>
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {username.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.line}>
                  <Text style={styles.user}>@{username}</Text>
                  <Text style={styles.muted}> {text(item)}</Text>
                </Text>
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </View>
              <Ionicons
                name={item.type === 'follow' ? 'person-add' : 'heart'}
                size={16}
                color={item.type === 'follow' ? colors.primary : colors.danger}
              />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.sm, flexGrow: 1 },
  sep: { height: 1, backgroundColor: colors.hairline, marginLeft: 68 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowUnread: { backgroundColor: colors.primarySoft },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  body: { flex: 1, gap: 2 },
  line: {},
  user: { color: colors.text, ...type.bodyStrong },
  muted: { color: colors.textMuted, ...type.body },
  time: { color: colors.textFaint, ...type.micro },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  emptyText: {
    color: colors.textMuted,
    ...type.body,
    textAlign: 'center',
    maxWidth: 260,
  },
});
