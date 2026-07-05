import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useAddComment,
  useComments,
  useDeleteComment,
  type CommentRow,
  type CommentScope,
} from '@/hooks/useComments';
import { haptics } from '@/lib/haptics';
import { timeAgo } from '@/lib/format';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';
import type { MediaType } from '@/types/tmdb';

interface Props {
  tmdbId: number;
  mediaType: MediaType;
  scope?: CommentScope;
  title?: string;
}

export function CommentsSection({
  tmdbId,
  mediaType,
  scope = {},
  title = 'Comentarios',
}: Props) {
  const { session } = useAuth();
  const { data, isLoading } = useComments(tmdbId, mediaType, scope);
  const add = useAddComment(tmdbId, mediaType, scope);
  const [text, setText] = useState('');

  const count = data?.length ?? 0;

  const submit = () => {
    if (!text.trim() || add.isPending) return;
    haptics.light();
    add.mutate(text, { onSuccess: () => setText('') });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
        {count > 0 ? `  ${count}` : ''}
      </Text>

      {session ? (
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un comentario…"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={submit}
            disabled={!text.trim() || add.isPending}
            style={[
              styles.sendBtn,
              (!text.trim() || add.isPending) && styles.sendBtnDisabled,
            ]}>
            {add.isPending ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={colors.text} />
            )}
          </Pressable>
        </View>
      ) : (
        <Link href="/sign-in" asChild>
          <Pressable style={styles.signInPrompt}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
            <Text style={styles.signInPromptText}>
              Inicia sesión para comentar
            </Text>
          </Pressable>
        </Link>
      )}

      {add.isError && (
        <Text style={styles.error}>
          {add.error instanceof Error ? add.error.message : 'Error al publicar'}
        </Text>
      )}

      {isLoading && <ActivityIndicator color={colors.primary} />}

      {!isLoading && count === 0 && (
        <Text style={styles.empty}>Sé el primero en comentar.</Text>
      )}

      <View style={styles.list}>
        {data?.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            isOwn={c.user_id === session?.user.id}
            tmdbId={tmdbId}
            mediaType={mediaType}
          />
        ))}
      </View>
    </View>
  );
}

function CommentItem({
  comment,
  isOwn,
  tmdbId,
  mediaType,
}: {
  comment: CommentRow;
  isOwn: boolean;
  tmdbId: number;
  mediaType: MediaType;
}) {
  const del = useDeleteComment(tmdbId, mediaType);
  const username = comment.author?.username ?? 'usuario';
  const initial = username.charAt(0).toUpperCase();

  return (
    <View style={styles.comment}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.time}>· {timeAgo(comment.created_at)}</Text>
          {isOwn && (
            <Pressable
              onPress={() => del.mutate(comment.id)}
              hitSlop={8}
              style={styles.delete}>
              <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Text style={styles.text}>{comment.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, ...type.heading },
  composer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  signInPrompt: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signInPromptText: { color: colors.text, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13 },
  empty: { color: colors.textMuted, fontSize: 14 },
  list: { gap: spacing.lg },
  comment: { flexDirection: 'row', gap: spacing.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  commentBody: { flex: 1, gap: 2 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  username: { color: colors.text, fontWeight: '700', fontSize: 14 },
  time: { color: colors.textMuted, fontSize: 12 },
  delete: { marginLeft: 'auto' },
  text: { color: colors.text, fontSize: 15, lineHeight: 21 },
});
