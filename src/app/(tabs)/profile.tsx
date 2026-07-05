import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { ProfileStats } from '@/components/ProfileStats';
import { Screen } from '@/components/Screen';
import { REGIONS } from '@/config/region';
import { useProfile } from '@/hooks/useSocial';
import { useAuth } from '@/providers/AuthProvider';
import { usePush } from '@/providers/PushProvider';
import { useRegion } from '@/providers/RegionProvider';
import { colors, radius, spacing, type } from '@/theme';

export default function ProfileScreen() {
  const { session, configured, signOut } = useAuth();
  const { region, setRegion } = useRegion();
  const { enabled: pushEnabled, busy: pushBusy, toggle: togglePush } = usePush();
  const { data: profile } = useProfile(session?.user.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Perfil</Text>

        {session && (
          <>
            <View style={styles.hero}>
              <View style={styles.cover}>
                {profile?.cover_url ? (
                  <Image
                    source={{ uri: profile.cover_url }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
              </View>
              <View style={styles.heroBody}>
                <View style={styles.avatar}>
                  {profile?.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : (
                    <Ionicons name="person" size={30} color={colors.primary} />
                  )}
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.username}>
                    @{profile?.username ?? 'usuario'}
                  </Text>
                  {!!profile?.bio && (
                    <Text style={styles.bio}>{profile.bio}</Text>
                  )}
                </View>
                <Link href="/edit-profile" asChild>
                  <Pressable style={styles.editBtn}>
                    <Text style={styles.editText}>Editar</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            <ProfileStats userId={session.user.id} />
          </>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Cuenta</Text>
          {session ? (
            <>
              <Text style={styles.value}>{session.user.email}</Text>
              <Pressable style={styles.outlineBtn} onPress={() => signOut()}>
                <Text style={styles.outlineBtnText}>Cerrar sesión</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.muted}>
                {configured
                  ? 'No has iniciado sesión.'
                  : 'Supabase aún no está configurado (ver docs/SETUP.md).'}
              </Text>
              {configured && (
                <Link href="/sign-in" asChild>
                  <Pressable style={styles.primaryBtn}>
                    <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
                  </Pressable>
                </Link>
              )}
            </>
          )}
        </View>

        {session && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Notificaciones</Text>
            <View style={styles.switchRow}>
              <View style={styles.switchTextCol}>
                <Text style={styles.value}>Nuevos episodios</Text>
                <Text style={styles.muted}>
                  Te avisamos el día que se estrena un episodio de las series que
                  sigues.
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                disabled={pushBusy}
                trackColor={{ false: colors.surfaceHigh, true: colors.primary }}
                thumbColor={colors.onAccent}
                ios_backgroundColor={colors.surfaceHigh}
              />
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Región (dónde ver / idioma)</Text>
          <Text style={styles.muted}>
            Determina en qué plataformas se muestra la disponibilidad.
          </Text>
          <View style={styles.regionGrid}>
            {REGIONS.map((r) => {
              const active = r.code === region.code;
              return (
                <Pressable
                  key={r.code}
                  onPress={() => setRegion(r.code)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.footer}>
          Reeltime · MVP 0.1 · Datos de TMDB y JustWatch
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, ...type.hero },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cover: { height: 110, backgroundColor: colors.surfaceHigh },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -36,
    borderWidth: 3,
    borderColor: colors.surface,
    overflow: 'hidden',
  },
  heroText: { flex: 1, gap: 2, paddingBottom: 2 },
  username: { color: colors.text, ...type.heading },
  bio: { color: colors.textMuted, ...type.caption },
  editBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHigh,
  },
  editText: { color: colors.text, ...type.caption, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  value: { color: colors.text, fontSize: 15 },
  muted: { color: colors.textMuted, fontSize: 13 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchTextCol: { flex: 1, gap: 2 },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.onAccent },
  primaryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 16 },
  outlineBtn: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  outlineBtnText: { color: colors.text, fontWeight: '600' },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
