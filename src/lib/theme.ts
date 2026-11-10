// ──────────────────────────────────────────────────
// Golden Leaf Finance — Design Tokens
// Centralized theme constants for non-Tailwind usage
// (charts, programmatic styles, PDF generation, etc.)
// ──────────────────────────────────────────────────

export const colors = {
  gold: {
    50: '#FFF9E6',
    100: '#FFF0BF',
    200: '#FFE699',
    300: '#FFDB6B',
    400: '#E8C547',
    500: '#D4AF37',
    600: '#B8860B',
    700: '#9A7209',
    800: '#7C5B07',
    900: '#5E4505',
    950: '#3A2E12',
  },
  surface: {
    white: '#FFFFFF',
    cream: '#FAF8F3',
    warm: '#F5F0E8',
    muted: '#EDE8DD',
  },
  rich: {
    black: '#1A1A1A',
    charcoal: '#2D2D2D',
    gray: '#4A4A4A',
    silver: '#8A8A8A',
    light: '#BDBDBD',
  },
  status: {
    success: '#2E7D32',
    successLight: '#E8F5E9',
    error: '#C62828',
    errorLight: '#FFEBEE',
    warning: '#ED6C02',
    warningLight: '#FFF3E0',
    info: '#1565C0',
    infoLight: '#E3F2FD',
  },
} as const;

export const gradients = {
  hero: 'linear-gradient(135deg, #1A1A1A 0%, #3A2E12 50%, #D4AF37 100%)',
  gold: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
  dark: 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
  card: 'linear-gradient(145deg, #FFFFFF 0%, #FAF8F3 100%)',
  sidebar: 'linear-gradient(180deg, #1A1A1A 0%, #2D2D2D 100%)',
} as const;

export const shadows = {
  card: '0 1px 3px rgba(26, 26, 26, 0.06), 0 1px 2px rgba(26, 26, 26, 0.04)',
  cardHover: '0 10px 25px rgba(26, 26, 26, 0.08), 0 4px 10px rgba(26, 26, 26, 0.04)',
  gold: '0 4px 14px rgba(212, 175, 55, 0.25)',
  goldLg: '0 8px 30px rgba(212, 175, 55, 0.35)',
  modal: '0 20px 60px rgba(26, 26, 26, 0.15)',
} as const;

// Recharts color palette for consistent chart theming
export const chartColors = {
  primary: colors.gold[500],
  secondary: colors.gold[600],
  tertiary: colors.gold[300],
  success: colors.status.success,
  error: colors.status.error,
  warning: colors.status.warning,
  series: [
    colors.gold[500],
    colors.gold[600],
    colors.status.success,
    colors.status.info,
    colors.status.warning,
    colors.gold[300],
    colors.rich.silver,
    colors.status.error,
  ],
} as const;

export const typography = {
  display: "'Playfair Display', Georgia, serif",
  body: "'Inter', system-ui, -apple-system, sans-serif",
} as const;

export const breakpoints = {
  mobile: 640,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  wide: 1536,
} as const;
