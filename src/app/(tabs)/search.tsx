import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PosterCard } from '@/components/PosterCard';
import { Screen } from '@/components/Screen';
import { useSearch } from '@/hooks/useTmdb';
import { colors, radius, spacing } from '@/theme';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useSearch(query);

  return (
    <Screen>
      <View style={styles.header}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar series y películas…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {isLoading && <ActivityIndicator color={colors.primary} style={styles.pad} />}
      {isError && <Text style={styles.msg}>Error al buscar. Inténtalo de nuevo.</Text>}
      {!isLoading && query.trim().length > 1 && data?.length === 0 && (
        <Text style={styles.msg}>Sin resultados para “{query}”.</Text>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => `${item.media_type}-${item.id}`}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <PosterCard item={item} width={104} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
  },
  pad: { marginTop: spacing.xl },
  msg: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});
