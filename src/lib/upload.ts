import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

/**
 * Abre la galería, deja recortar y sube la imagen al bucket `avatars` en la
 * carpeta del usuario (`<uid>/...`, exigido por la RLS de Storage). Devuelve la
 * URL pública, o null si el usuario cancela o no da permiso.
 */
export async function pickAndUploadImage(
  userId: string,
  kind: 'avatar' | 'cover',
  aspect: [number, number],
): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.8,
    base64: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset?.base64) return null;

  const ext = (asset.mimeType?.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, decode(asset.base64), {
      contentType: asset.mimeType ?? 'image/jpeg',
      upsert: true,
    });
  if (error) throw error;

  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
