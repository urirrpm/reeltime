import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import {
  useAddToList,
  useCreateList,
  useLists,
  useRemoveFromList,
} from '@/hooks/useLists';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';
import type { MediaType } from '@/types/tmdb';

export default function AddToListScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const params = useLocalSearchParams<{
    tmdb_id: string;
    media_type: MediaType;
    title: string;
    poster_path: string;
  }>();
  const tmdbId = Number(params.tmdb_id);
  const item = {
    tmdb_id: tmdbId,
    media_type: params.media_type,
    title: params.title,
    poster_path: params.poster_path || null,
  };

  const { data: lists, isLoading } = useLists(uid);
  const add = useAddToList();
  const remove = useRemoveFromList();
  const createList = useCreateList();
  const [newName, setNewName] = useState('');

  // Qué listas (mías) ya contienen este título.
  const { data: memberIds } = useQuery({
    queryKey: ['item-lists', tmdbId, params.media_type, uid, lists?.length],
    enabled: !!uid && !!lists,
    queryFn: async (): Promise<string[]> => {
      const ids = (lists ?? []).map((l) => l.id);
      if (!ids.length) return [];
      const { data } = await supabase
        .from('list_items')
        .select('list_id')
        .eq('tmdb_id', tmdbId)
        .eq('media_type', params.media_type)
        .in('list_id', ids);
      return (data ?? []).map((r) => r.list_id as string);
    },
  });
  const memberSet = new Set(memberIds ?? []);

  const toggle = (listId: string, isMember: boolean) => {
    haptics.selection();
    if (isMember) {
      remove.mutate({ listId, tmdbId, mediaType: params.media_type });
    } else {
      add.mutate({ listId, item });
    }
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    haptics.light();
    const list = await createList.mutateAsync(name);
    await add.mutateAsync({ listId: list.id, item });
    setNewName('');
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Añadir a lista</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {params.title}
        </Text>

        <View style={styles.createRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Crear una lista nueva"
            placeholderTextColor={colors.textFaint}
            maxLength={60}
            style={styles.input}
          />
          <Pressable
            onPress={create}
            disabled={!newName.trim() || createList.isPending}
            style={[
              styles.createBtn,
              (!newName.trim() || createList.isPending) && { opacity: 0.4 },
            ]}>
            <Ionicons name="add" size={22} color={colors.onAccent} />
          </Pressable>
        </View>

        {isLoading && <ActivityIndicator color={colors.primary} />}

        {!isLoading && (lists?.length ?? 0) === 0 && (
          <Text style={styles.empty}>
            Aún no tienes listas. Crea la primera arriba.
          </Text>
        )}

        {lists?.map((l) => {
          const isMember = memberSet.has(l.id);
          return (
            <Pressable
              key={l.id}
              onPress={() => toggle(l.id, isMember)}
              style={styles.listRow}>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{l.name}</Text>
                <Text style={styles.listCount}>
                  {l.count} {l.count === 1 ? 'título' : 'títulos'}
                </Text>
              </View>
              <Ionicons
                name={isMember ? 'checkmark-circle' : 'add-circle-outline'}
                size={26}
                color={isMember ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { color: colors.text, ...type.title },
  subtitle: { color: colors.textMuted, ...type.body, marginTop: -spacing.xs },
  createRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    ...type.body,
  },
  createBtn: {
    width: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { color: colors.textMuted, ...type.body, marginTop: spacing.md },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  listInfo: { flex: 1, gap: 2 },
  listName: { color: colors.text, ...type.bodyStrong },
  listCount: { color: colors.textMuted, ...type.caption },
});
