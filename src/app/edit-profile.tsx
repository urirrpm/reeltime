import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { useProfile, useUpdateProfile } from '@/hooks/useSocial';
import { haptics } from '@/lib/haptics';
import { pickAndUploadImage } from '@/lib/upload';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing, type } from '@/theme';

export default function EditProfileScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const { data: profile } = useProfile(uid);
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null);
  const [cover, setCover] = useState<string | null>(profile?.cover_url ?? null);
  const [uploading, setUploading] = useState<null | 'avatar' | 'cover'>(null);
  const [ready, setReady] = useState(false);

  // Prellena una vez que llega el perfil.
  if (profile && !ready) {
    setUsername(profile.username ?? '');
    setBio(profile.bio ?? '');
    setAvatar(profile.avatar_url ?? null);
    setCover(profile.cover_url ?? null);
    setReady(true);
  }

  const pick = async (kind: 'avatar' | 'cover') => {
    if (!uid) return;
    haptics.selection();
    setUploading(kind);
    try {
      const url = await pickAndUploadImage(
        uid,
        kind,
        kind === 'avatar' ? [1, 1] : [16, 9],
      );
      if (url) (kind === 'avatar' ? setAvatar : setCover)(url);
    } catch {
      Alert.alert('No se pudo subir la imagen', 'Inténtalo de nuevo.');
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    const name = username.trim();
    if (name.length < 2) {
      Alert.alert('Nombre de usuario', 'Escribe al menos 2 caracteres.');
      return;
    }
    try {
      await updateProfile({
        username: name,
        bio: bio.trim() || null,
        avatar_url: avatar,
        cover_url: cover,
      });
      haptics.success();
      router.back();
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      Alert.alert(
        'No se pudo guardar',
        msg.includes('duplicate') || msg.includes('unique')
          ? 'Ese nombre de usuario ya está en uso.'
          : 'Inténtalo de nuevo.',
      );
    }
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Portada */}
        <Pressable onPress={() => pick('cover')} style={styles.cover}>
          {cover ? (
            <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.coverOverlay}>
            {uploading === 'cover' ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Ionicons name="camera-outline" size={22} color={colors.onAccent} />
            )}
            <Text style={styles.coverText}>Portada</Text>
          </View>
        </Pressable>

        {/* Avatar */}
        <Pressable onPress={() => pick('avatar')} style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} />
          ) : (
            <Ionicons name="person" size={34} color={colors.primary} />
          )}
          <View style={styles.avatarBadge}>
            {uploading === 'avatar' ? (
              <ActivityIndicator color={colors.onAccent} size="small" />
            ) : (
              <Ionicons name="camera" size={14} color={colors.onAccent} />
            )}
          </View>
        </Pressable>

        <Text style={styles.label}>Nombre de usuario</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="tu_usuario"
          placeholderTextColor={colors.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          style={styles.input}
        />

        <Text style={styles.label}>Biografía</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Cuéntale al mundo qué te gusta ver"
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={160}
          style={[styles.input, styles.bio]}
        />

        <Pressable
          style={[styles.saveBtn, isPending && { opacity: 0.6 }]}
          onPress={save}
          disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.saveText}>Guardar</Text>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  cover: {
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  coverText: { color: colors.onAccent, ...type.caption, fontWeight: '600' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
    marginLeft: spacing.md,
    borderWidth: 4,
    borderColor: colors.bg,
    overflow: 'hidden',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  label: {
    color: colors.textMuted,
    ...type.caption,
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    ...type.body,
  },
  bio: { minHeight: 90, textAlignVertical: 'top' },
  saveBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  saveText: { color: colors.onAccent, ...type.bodyStrong },
});
