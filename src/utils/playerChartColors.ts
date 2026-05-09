/**
 * Couleurs stables par index de joueur (ASC-14) — palette Arcane/Zaun sur fond noir.
 */
export const PLAYER_CHART_COLORS = [
  '#ff2d78',
  '#3dffc0',
  '#9b59ff',
  '#ff9f1c',
  '#00d4ff',
  '#f72585',
  '#7209b7',
  '#4cc9f0',
  '#ff6b6b',
  '#06d6a0',
] as const;

export function getPlayerChartColor(playerIndex: number): string {
  return PLAYER_CHART_COLORS[playerIndex % PLAYER_CHART_COLORS.length];
}
