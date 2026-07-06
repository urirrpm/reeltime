import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  useReportComment,
  useToggleCommentLike,
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

type SortMode = 'relevante' | 'likes' | 'recientes';

const SORTS: { mode: SortMode; label: string }[] = [
  { mode: 'relevante', label: 'Relevante' },
  { mode: 'likes', label: 'Con más Me gusta' },
  { mode: 'recientes', label: 'Más recientes' },
];

/** Ordena los comentarios según el modo elegido. */
function sortComments(list: CommentRow[], mode: SortMode): CommentRow[] {
  const byRecent = (a: CommentRow, b: CommentRow) =>
    b.created_at.localeCompare(a.created_at);
  if (mode === 'recientes') return [...list].sort(byRecent);
  if (mode === 'likes')
    return [...list].sort((a, b) => b.likeCount - a.likeCount || byRecent(a, b));
  // Relevante: mezcla likes y frescura (los muy recientes también asoman).
  const now = Date.now();
  const score = (c: CommentRow) =>
    c.likeCount * 3 -
    (now - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
  return [...list].sort((a, b) => score(b) - score(a));
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
  const [sort, setSort] = useState<SortMode>('relevante');

  const count = data?.length ?? 0;
  const ordered = useMemo(
    () => sortComments(data ?? [], sort),
    [data, sort],
  );

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
              <ActivityIndicator color={colors.onAccent} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={colors.onAccent} />
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

      {count > 1 && (
        <View style={styles.sortRow}>
          {SORTS.map((s) => {
            const active = s.mode === sort;
            return (
              <Pressable
                key={s.mode}
                onPress={() => {
                  haptics.selection();
                  setSort(s.mode);
                }}
                style={[styles.sortChip, active && styles.sortChipActive]}>
                <Text
                  style={[styles.sortText, active && styles.sortTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.list}>
        {ordered.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            isOwn={c.user_id === session?.user.id}
            canInteract={!!session}
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
  canInteract,
  tmdbId,
  mediaType,
}: {
  comment: CommentRow;
  isOwn: boolean;
  canInteract: boolean;
  tmdbId: number;
  mediaType: MediaType;
}) {
  const del = useDeleteComment(tmdbId, mediaType);
  const like = useToggleCommentLike();
  const report = useReportComment();
  const username = comment.author?.username ?? 'usuario';
  const initial = username.charAt(0).toUpperCase();

  const onLike = () => {
    if (!canInteract || like.isPending) return;
    haptics.light();
    like.mutate({ id: comment.id, liked: comment.liked });
  };

  const onReport = () => {
    Alert.alert(
      'Reportar comentario',
      '¿Quieres reportar este comentario por contenido inapropiado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reportar',
          style: 'destructive',
          onPress: () => {
            report.mutate(
              { id: comment.id },
              {
                onSuccess: () =>
                  Alert.alert('Gracias', 'Lo revisaremos. No volverás a ver este aviso.'),
              },
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.comment}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.time}>· {timeAgo(comment.created_at)}</Text>
          {isOwn ? (
            <Pressable
              onPress={() => del.mutate(comment.id)}
              hitSlop={8}
              style={styles.delete}>
              <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
            </Pressable>
          ) : (
            canInteract && (
              <Pressable onPress={onReport} hitSlop={8} style={styles.delete}>
                <Ionicons name="flag-outline" size={14} color={colors.textFaint} />
              </Pressable>
            )
          )}
        </View>
        {comment.hidden ? (
          <View style={styles.hiddenNote}>
            <Ionicons name="eye-off-outline" size={13} color={colors.textMuted} />
            <Text style={styles.hiddenText}>
              Oculto por moderación. Solo tú lo ves.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.text}>{comment.body}</Text>
            <Pressable
              onPress={onLike}
              disabled={!canInteract}
              hitSlop={8}
              style={styles.likeRow}>
              <Ionicons
                name={comment.liked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.liked ? colors.danger : colors.textMuted}
              />
              {comment.likeCount > 0 && (
                <Text
                  style={[styles.likeCount, comment.liked && styles.likeCountOn]}>
                  {comment.likeCount}
                </Text>
              )}
            </Pressable>
          </>
        )}
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
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  sortTextActive: { color: colors.onAccent },
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
  avatarText: { color: colors.onAccent, fontWeight: '800', fontSize: 15 },
  commentBody: { flex: 1, gap: 2 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  username: { color: colors.text, fontWeight: '700', fontSize: 14 },
  time: { color: colors.textMuted, fontSize: 12 },
  delete: { marginLeft: 'auto' },
  text: { color: colors.text, fontSize: 15, lineHeight: 21 },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  likeCount: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  likeCountOn: { color: colors.danger },
  hiddenNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  hiddenText: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic' },
});
