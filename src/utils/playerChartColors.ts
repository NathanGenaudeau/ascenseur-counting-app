/**
 * Couleurs stables par index de joueur (ASC-14) — 10 teintes distinctes pour mobile.
 */
export const PLAYER_CHART_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#db2777',
  '#4f46e5',
  '#65a30d',
] as const;

export function getPlayerChartColor(playerIndex: number): string {
  return PLAYER_CHART_COLORS[playerIndex % PLAYER_CHART_COLORS.length];
}
