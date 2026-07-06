import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Pressable, Share } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';

/**
 * Botón de compartir. Genera un enlace profundo (reeltime://... en build, exp://
 * en Expo Go) que abre la app en ese título/episodio.
 */
export function ShareButton({
  path,
  title,
  color = colors.text,
}: {
  path: string;
  title: string;
  color?: string;
}) {
  const onPress = async () => {
    haptics.light();
    const url = Linking.createURL(path);
    try {
      await Share.share({ message: `${title} · en Reeltime\n${url}` });
    } catch {
      // el usuario canceló el diálogo de compartir
    }
  };

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Ionicons name="share-outline" size={22} color={color} />
    </Pressable>
  );
}
