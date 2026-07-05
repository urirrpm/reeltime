import type { Ionicons } from '@expo/vector-icons';

/**
 * Conjunto fijo de emociones para la reacción por episodio ("¿Cómo te
 * sentiste?"). Sin emojis (regla de diseño): cada una se representa con un icono
 * de Ionicons + etiqueta. La `key` es lo que se guarda en la base de datos.
 */
export interface Emotion {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const EMOTIONS: Emotion[] = [
  { key: 'emocionante', label: 'Emocionante', icon: 'flash' },
  { key: 'conmovedor', label: 'Conmovedor', icon: 'heart' },
  { key: 'divertido', label: 'Divertido', icon: 'happy' },
  { key: 'triste', label: 'Triste', icon: 'sad' },
  { key: 'tenso', label: 'Tenso', icon: 'pulse' },
  { key: 'aterrador', label: 'Aterrador', icon: 'skull' },
  { key: 'sorprendente', label: 'Sorprendente', icon: 'sparkles' },
  { key: 'aburrido', label: 'Aburrido', icon: 'hourglass' },
];

const BY_KEY = new Map(EMOTIONS.map((e) => [e.key, e]));

export function emotionByKey(key: string): Emotion | undefined {
  return BY_KEY.get(key);
}
