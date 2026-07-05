import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/theme';

interface Props {
  children: ReactNode;
  edges?: Edge[];
}

/** Contenedor de pantalla con fondo del tema y safe-area. */
export function Screen({ children, edges = ['top'] }: Props) {
  return (
    <View style={styles.bg}>
      <SafeAreaView style={styles.flex} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
});
