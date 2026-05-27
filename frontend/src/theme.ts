export const colors = {
  background: "#050505",
  surface: "#121212",
  surfaceRaised: "#1E1E1E",
  surfaceMuted: "#0F0F0F",
  primary: "#00FF55",
  primaryHover: "#00CC44",
  primaryDim: "rgba(0, 255, 85, 0.15)",
  primarySoft: "rgba(0, 255, 85, 0.08)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  border: "#27272A",
  borderSoft: "#1F1F22",
  success: "#00FF55",
  warning: "#FFB800",
  error: "#FF3333",
  overlay: "rgba(0,0,0,0.6)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
};

export const fonts = {
  heading: "Outfit_700Bold",
  headingSemi: "Outfit_600SemiBold",
  headingMed: "Outfit_500Medium",
  body: "Manrope_400Regular",
  bodyMed: "Manrope_500Medium",
  bodyBold: "Manrope_700Bold",
};

export const text = {
  h1: { fontFamily: fonts.heading, fontSize: 36, lineHeight: 40, letterSpacing: -1, color: colors.textPrimary },
  h2: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 32, letterSpacing: -0.5, color: colors.textPrimary },
  h3: { fontFamily: fonts.headingSemi, fontSize: 22, lineHeight: 26, color: colors.textPrimary },
  h4: { fontFamily: fonts.headingSemi, fontSize: 18, lineHeight: 22, color: colors.textPrimary },
  bodyLg: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  overline: { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.5, color: colors.textSecondary, textTransform: "uppercase" as const },
  button: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18, letterSpacing: 1, textTransform: "uppercase" as const, color: colors.background },
};

export const SPORTS = [
  { key: "football", label: "Football", icon: "soccer", iconLib: "MaterialCommunityIcons" },
  { key: "basketball", label: "Basketball", icon: "basketball", iconLib: "MaterialCommunityIcons" },
  { key: "tennis", label: "Tennis", icon: "tennis", iconLib: "MaterialCommunityIcons" },
  { key: "padel", label: "Padel", icon: "tennis-ball", iconLib: "MaterialCommunityIcons" },
  { key: "volleyball", label: "Volleyball", icon: "volleyball", iconLib: "MaterialCommunityIcons" },
  { key: "pingpong", label: "Ping-Pong", icon: "table-tennis", iconLib: "MaterialCommunityIcons" },
] as const;

export const sportIcon: Record<string, string> = {
  football: "soccer",
  basketball: "basketball",
  tennis: "tennis",
  padel: "tennis-ball",
  volleyball: "volleyball",
  pingpong: "table-tennis",
};
