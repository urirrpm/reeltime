import { Link } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { REGIONS } from '@/config/region';
import { useAuth } from '@/providers/AuthProvider';
import { usePush } from '@/providers/PushProvider';
import { useRegion } from '@/providers/RegionProvider';
import { colors, radius, spacing, type } from '@/theme';

export default function ProfileScreen() {
  const { session, configured, signOut } = useAuth();
  const { region, setRegion } = useRegion();
  const { enabled: pushEnabled, busy: pushBusy, toggle: togglePush } = usePush();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Perfil</Text>

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
