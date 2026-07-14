/**
 * Paleta derivada do design "Central de Mensagens Corporativas"
 * (design/central-de-mensagens-corporativas — handoff Claude Design).
 * Não inventar cores: qualquer cor nova deve vir do design.
 */
export const palette = {
  // Marca (accent white-label — default roxo)
  purple: '#9079d7',
  purpleTintLight: '#efeafb',
  purpleTintDark: '#241f36',
  bubbleOutLight: '#e9e1fb',
  bubbleOutDark: '#3f3466',

  // Neutros light
  white: '#ffffff',
  grayBgLight: '#f2f2f7',
  grayChipLight: '#eeeef2',
  inkLight: '#0b0b0f',
  gray2Light: '#8a8a8e',
  gray3Light: '#c2c2c8',
  separatorLight: 'rgba(60,60,67,0.12)',
  chatBgLight: '#ece7e1',

  // Neutros dark
  black: '#000000',
  bgDark: '#0c0c10',
  surfaceDark: '#151519',
  chipDark: '#1e1e24',
  inkDark: '#f5f5f7',
  gray2Dark: '#95959c',
  gray3Dark: '#5c5c63',
  separatorDark: 'rgba(255,255,255,0.09)',
  chatBgDark: '#08080b',

  // Feedback
  greenOnlineLight: '#34c759',
  greenOnlineDark: '#32d74b',
  redDangerLight: '#e5484d',
  redDangerDark: '#ff453a',

  // Atendimento
  orangeAttendance: '#e0864f',
  orangeAttendanceText: '#c9743c',
  orangeAttendanceTint: 'rgba(224,134,79,0.14)',

  // Avatares (cores brutas usadas em avatares/iniciais)
  avatarPurple: '#9079d7',
  avatarOrange: '#e0864f',
  avatarTeal: '#3f9d8f',
  avatarPink: '#c85c8e',
  avatarBlue: '#5b8def',
  avatarGold: '#c9a227',
  avatarGray: '#7a7f87',
  avatarRed: '#d15b5b',
} as const;

const light = {
  primary: palette.purple,
  primaryContrast: palette.white,
  primaryTint: palette.purpleTintLight,

  background: palette.white,
  backgroundSecondary: palette.grayBgLight,
  surface: palette.white, // headers/barras
  card: palette.white,
  chip: palette.grayChipLight,
  separator: palette.separatorLight,

  text: palette.inkLight,
  textSecondary: palette.gray2Light,
  textTertiary: palette.gray3Light,

  chatBackground: palette.chatBgLight,
  bubbleIncoming: palette.white,
  bubbleOutgoing: palette.bubbleOutLight,

  online: palette.greenOnlineLight,
  danger: palette.redDangerLight,

  attendance: palette.orangeAttendance,
  attendanceText: palette.orangeAttendanceText,
  attendanceTint: palette.orangeAttendanceTint,
};

export type ThemeColors = {[K in keyof typeof light]: string};

export const lightColors: ThemeColors = light;

export const darkColors: ThemeColors = {
  primary: palette.purple,
  primaryContrast: palette.white,
  primaryTint: palette.purpleTintDark,

  background: palette.bgDark,
  backgroundSecondary: palette.black,
  surface: palette.surfaceDark,
  card: palette.surfaceDark,
  chip: palette.chipDark,
  separator: palette.separatorDark,

  text: palette.inkDark,
  textSecondary: palette.gray2Dark,
  textTertiary: palette.gray3Dark,

  chatBackground: palette.chatBgDark,
  bubbleIncoming: palette.chipDark,
  bubbleOutgoing: palette.bubbleOutDark,

  online: palette.greenOnlineDark,
  danger: palette.redDangerDark,

  attendance: palette.orangeAttendance,
  attendanceText: palette.orangeAttendanceText,
  attendanceTint: palette.orangeAttendanceTint,
};

export const avatarColors = [
  palette.avatarPurple,
  palette.avatarOrange,
  palette.avatarTeal,
  palette.avatarPink,
  palette.avatarBlue,
  palette.avatarGold,
  palette.avatarGray,
  palette.avatarRed,
] as const;
