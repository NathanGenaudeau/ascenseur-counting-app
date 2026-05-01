/**
 * Couleurs stables par index de joueur (ASC-14) — 10 teintes distinctes pour mobile.
 * Palette harmonisée avec le bleu marine primaire (premier ton = marine).
 */
export const PLAYER_CHART_COLORS = [
  '#1f3d5e',
  '#d97706',
  '#15803d',
  '#b91c1c',
  '#6d28d9',
  '#0e7490',
  '#ca8a04',
  '#be185d',
  '#2563eb',
  '#65a30d',
] as const;

export function getPlayerChartColor(playerIndex: number): string {
  return PLAYER_CHART_COLORS[playerIndex % PLAYER_CHART_COLORS.length];
}
