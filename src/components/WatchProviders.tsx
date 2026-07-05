import { Image } from 'expo-image';
import { View, Text, StyleSheet } from 'react-native';

import { imageUrl } from '@/lib/tmdb';
import { useRegion } from '@/providers/RegionProvider';
import { colors, radius, spacing } from '@/theme';
import type { WatchProvider, WatchProviderCountry } from '@/types/tmdb';

interface Props {
  providers: WatchProviderCountry | null;
}

const GROUPS: { key: keyof WatchProviderCountry; label: string }[] = [
  { key: 'flatrate', label: 'Incluido en suscripción' },
  { key: 'free', label: 'Gratis' },
  { key: 'ads', label: 'Gratis con anuncios' },
  { key: 'rent', label: 'Alquiler' },
  { key: 'buy', label: 'Compra' },
];

/** "¿Dónde verlo?" — logos de plataformas agrupados por tipo de oferta. */
export function WatchProviders({ providers }: Props) {
  const { region } = useRegion();

  if (!providers) {
    return (
      <Text style={styles.empty}>
        Sin datos de disponibilidad en {region.label} todavía.
      </Text>
    );
  }

  const groups = GROUPS.filter((g) => {
    const list = providers[g.key];
    return Array.isArray(list) && list.length > 0;
  });

  if (groups.length === 0) {
    return (
      <Text style={styles.empty}>
        No disponible en plataformas de {region.label} por ahora.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {groups.map((g) => (
        <View key={g.key} style={styles.group}>
          <Text style={styles.groupLabel}>{g.label}</Text>
          <View style={styles.logos}>
            {(providers[g.key] as WatchProvider[]).map((p) => (
              <View key={p.provider_id} style={styles.logoWrap}>
                <Image
                  source={{ uri: imageUrl(p.logo_path, 'w185') ?? undefined }}
                  style={styles.logo}
                  contentFit="cover"
                />
              </View>
            ))}
          </View>
        </View>
      ))}
      <Text style={styles.credit}>Datos de disponibilidad: JustWatch</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  group: { gap: spacing.sm },
  groupLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  logos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  logo: { width: 48, height: 48 },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
  },
  credit: {
    color: colors.textMuted,
    fontSize: 11,
    opacity: 0.7,
  },
});
