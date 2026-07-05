import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Poster } from '@/components/Poster';
import { Screen } from '@/components/Screen';
import {
  useDeleteList,
  useListItems,
  useRemoveFromList,
} from '@/hooks/useLists';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const { data: list } = useQuery({
    queryKey: ['list', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('id, name, user_id')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as { id: string; name: string; user_id: string };
    },
  });

  const { data: items, isLoading } = useListItems(id);
  const remove = useRemoveFromList();
  const deleteList = useDeleteList();

  const isOwner = !!session && list?.user_id === session.user.id;

  const confirmDelete = () => {
    Alert.alert('Eliminar lista', `¿Eliminar "${list?.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          if (id) deleteList.mutate(id, { onSuccess: () => router.back() });
        },
      },
    ]);
  };

  return (
    <Screen edges={[]}>
      <Stack.Screen
        options={{
          title: list?.name ?? 'Lista',
          headerRight: isOwner
            ? () => (
                <Pressable onPress={confirmDelete} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.text} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <ActivityIndicator color={colors.primary} />}

        {!isLoading && (items?.length ?? 0) === 0 && (
          <Text style={styles.empty}>
            Esta lista está vacía. Añade títulos desde su ficha.
          </Text>
        )}

        <View style={styles.grid}>
          {items?.map((it) => (
            <View key={`${it.media_type}-${it.tmdb_id}`} style={styles.cell}>
              <Link href={`/title/${it.media_type}/${it.tmdb_id}`} asChild>
                <Pressable>
                  <Poster path={it.poster_path} width={POSTER_W} size="w342" />
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {it.title}
                  </Text>
                </Pressable>
              </Link>
              {isOwner && (
                <Pressable
                  onPress={() => {
                    haptics.light();
                    remove.mutate({
                      listId: id!,
                      tmdbId: it.tmdb_id,
                      mediaType: it.media_type,
                    });
                  }}
                  hitSlop={6}
                  style={styles.removeBadge}>
                  <Ionicons name="close" size={14} color={colors.onAccent} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const POSTER_W = 104;

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  empty: { color: colors.textMuted, ...type.body, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: POSTER_W },
  itemTitle: { color: colors.text, ...type.caption, marginTop: spacing.xs },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
