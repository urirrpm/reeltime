/** Utilidades de formato para fechas y duraciones. */

const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** "2025-03-14" -> "14 mar 2025". Devuelve '' si no hay fecha. */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return `${d} ${MONTHS_ES[m - 1]} ${y}`;
}

/** Año de una fecha ISO. */
export function year(date: string | null | undefined): string {
  if (!date) return '';
  return date.slice(0, 4);
}

/** 128 -> "2h 8min". */
export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** Días hasta una fecha (negativo = pasada). null si no hay fecha. */
export function daysUntil(date: string | null | undefined, today: Date): number | null {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - t0.getTime()) / 86_400_000);
}
