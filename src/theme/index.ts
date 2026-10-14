/** Couleurs hex pour SVG, icônes et TextInput (hors classes Tailwind). */
export const PLACEHOLDER_HEX = '#707088';
export const ICON_ACCENT_HEX = '#ff2d78';

/** Halos « néon » pour textShadow (titres display). */
export const NEON_GLOW_PINK = 'rgba(255, 45, 120, 0.6)';
export const NEON_GLOW_CYAN = 'rgba(61, 255, 192, 0.5)';
export const NEON_GLOW_RED = 'rgba(255, 80, 80, 0.48)';
export const NEON_GLOW_GOLD = 'rgba(255, 210, 60, 0.45)';
export const NEON_GLOW_FROST = 'rgba(200, 190, 230, 0.32)';

/** Palette graphique score (fond sombre Arcane). */
export const CHART_GRID_MINOR = '#1a1225';
export const CHART_GRID_MAJOR = '#261835';
export const CHART_AXIS = '#4a4a62';
export const CHART_LABEL = '#a8a8c0';
export const CHART_LABEL_FAINT = '#707088';
export const CHART_CURSOR = '#ff2d78';
export const CHART_DOT_STROKE = '#0d0a12';

/** Podium : accents néon or / argent / bronze sur panneaux sombres. */
export const PODIUM_METALS = {
  1: {
    base: '#f5c518',
    text: '#ffd23c',
    glow: 'rgba(255, 210, 60, 0.6)',
    tint: 'rgba(245, 197, 24, 0.3)',
  },
  2: {
    base: '#c0c7d6',
    text: '#e3e7f0',
    glow: 'rgba(205, 212, 232, 0.5)',
    tint: 'rgba(192, 199, 214, 0.2)',
  },
  3: {
    base: '#cd7f32',
    text: '#ec9f5c',
    glow: 'rgba(230, 140, 70, 0.55)',
    tint: 'rgba(205, 127, 50, 0.26)',
  },
} as const;
