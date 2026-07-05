import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

interface Props {
  /** 0..1 */
  value: number;
  height?: number;
  color?: string;
  track?: string;
}

/** Barra de progreso fina y redondeada. */
export function ProgressBar({
  value,
  height = 6,
  color = colors.primary,
  track = colors.surfaceHigh,
}: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { height, backgroundColor: track }]}>
      <View
        style={[
          styles.fill,
          { width: `${pct}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
