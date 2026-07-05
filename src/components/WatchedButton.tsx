import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';

interface Props {
  watched: boolean;
  onToggle: (next: boolean) => void;
  size?: number;
  disabled?: boolean;
}

/** Círculo de "visto": relleno verde con check cuando está activo. */
export function WatchedButton({
  watched,
  onToggle,
  size = 30,
  disabled,
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      hitSlop={10}
      onPress={() => {
        haptics.medium();
        onToggle(!watched);
      }}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          watched ? styles.on : styles.off,
        ]}>
        {watched && (
          <Ionicons name="checkmark" size={size * 0.62} color={colors.bg} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  on: { backgroundColor: colors.green, borderColor: colors.green },
  off: { backgroundColor: 'transparent', borderColor: colors.textFaint },
  pressed: { opacity: 0.6 },
});
