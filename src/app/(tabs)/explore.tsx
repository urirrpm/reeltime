import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CalendarView } from '@/components/CalendarView';
import { FeedView } from '@/components/FeedView';
import { Screen } from '@/components/Screen';
import { SearchResults } from '@/components/SearchResults';
import { haptics } from '@/lib/haptics';
import { colors, radius, spacing, type } from '@/theme';

type Pill = 'feed' | 'calendar';

const PILLS: { key: Pill; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'calendar', label: 'Calendario' },
];

/**
 * Pestaña Explorar: barra de búsqueda (títulos + usuarios) y, cuando está
 * vacía, píldoras Feed/Calendario. Consolida lo que antes eran tres pestañas.
 */
export default function ExploreScreen() {
  const [query, setQuery] = useState('');
  const [pill, setPill] = useState<Pill>('feed');
  const searching = query.trim().length > 1;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar títulos o usuarios"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

        {!searching && (
          <View style={styles.pills}>
            {PILLS.map((p) => {
              const active = pill === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => {
                    haptics.selection();
                    setPill(p.key);
                  }}
                  style={[styles.pill, active && styles.pillActive]}>
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.body}>
        {searching ? (
          <SearchResults query={query} />
        ) : pill === 'feed' ? (
          <FeedView />
        ) : (
          <CalendarView />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  title: { color: colors.text, ...type.hero },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, padding: 0 },
  pills: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { color: colors.textMuted, ...type.bodyStrong },
  pillTextActive: { color: colors.onAccent },
  body: { flex: 1 },
});
