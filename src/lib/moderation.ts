/**
 * Filtro de contenido del cliente: aviso inmediato antes de enviar. La
 * verificación REAL la hace el servidor (trigger + tabla banned_words), esto es
 * solo para dar feedback rápido. Se centra en slurs/insultos graves, no en
 * tacos suaves (en una app de series son normales).
 */
const BANNED = [
  'maricon', 'marica', 'bollera', 'travelo', 'sudaca', 'negrata',
  'panchito', 'subnormal', 'retrasado', 'mongolo', 'mongolico',
  'faggot', 'nigger', 'nigga', 'retard', 'tranny', 'spic', 'chink',
  'kike', 'dyke',
];

/** True si el texto contiene un término vetado (palabra completa). */
export function containsBannedWord(text: string): boolean {
  const t = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // quita acentos para comparar
  return BANNED.some((w) => new RegExp(`\\b${w}\\b`).test(t));
}

export const POLICY_MESSAGE =
  'Tu comentario infringe las normas de la comunidad.';
