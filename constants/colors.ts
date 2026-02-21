// GrindOS — Game HUD palette
// Monochromatic, dark, minimal. One accent color used sparingly.

export default {
  dark: {
    // Backgrounds — true blacks with subtle warmth
    background: '#08090A',
    surface: '#101114',
    surfaceLight: '#181B1F',
    surfaceBorder: '#22262C',

    // Accent — a cold, muted cyan (think terminal/HUD)
    toxic: '#00E5A0',
    toxicDim: '#0A1F18',
    toxicMuted: '#1A3D30',

    // Status — desaturated, not loud
    danger: '#E04050',
    dangerDim: '#1F0A0E',
    warning: '#C8A030',
    warningDim: '#1F1A0A',

    // Typography — high contrast but not pure white
    text: '#E8E8EC',
    textSecondary: '#6C7080',
    textMuted: '#3E424A',

    // Aliases
    accent: '#00E5A0',
    completed: '#00E5A0',

    // Navigation
    tabBar: '#0A0B0D',
    tabBarBorder: '#181B1F',

    // Subtle glow
    cardGlow: 'rgba(0, 229, 160, 0.04)',
  },
  light: {
    background: '#F0F1F3',
    surface: '#FFFFFF',
    surfaceLight: '#E8E9EB',
    surfaceBorder: '#D0D2D6',

    toxic: '#00A876',
    toxicDim: '#E0F5EE',
    toxicMuted: '#80D4B8',

    danger: '#C03040',
    dangerDim: '#FCE8EA',
    warning: '#A08020',
    warningDim: '#FBF4E0',

    text: '#16181C',
    textSecondary: '#5C6070',
    textMuted: '#9098A0',

    accent: '#00A876',
    completed: '#00A876',

    tabBar: '#FFFFFF',
    tabBarBorder: '#D8DAE0',

    cardGlow: 'rgba(0, 168, 118, 0.05)',
  },
};
