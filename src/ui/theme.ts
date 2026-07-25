import { createContext, createElement, type ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { useAppPreferences } from '@/preferences/use-app-preferences';

export const lightColors = {
  background: '#FBF7EB',
  surface: '#FFF9EA',
  surfaceSoft: '#E5E7D4',
  surfaceStrong: '#D9D0B9',
  text: '#15194A',
  textMuted: '#627079',
  border: '#C8D1CB',
  accent: '#6DBE45',
  accentPressed: '#589E36',
  onAccent: '#15194A',
  secondary: '#A8731A',
  secondarySoft: '#F1DFC0',
  pressure: '#B9563F',
  pressureSoft: '#F3D9CD',
  danger: '#A33E36',
  feedbackExact: '#6DBE45',
  feedbackPresent: '#B47B1C',
  feedbackAbsent: '#53616A',
  feedbackPending: '#FBF4E3',
  paperLine: '#9FB8B6',
  paperMargin: '#C98270',
  inkSoft: '#31526A',
};

export type AppThemeColors = typeof lightColors;

export const darkColors: AppThemeColors = {
  background: '#151B20',
  surface: '#20292D',
  surfaceSoft: '#293735',
  surfaceStrong: '#354047',
  text: '#F4EBD8',
  textMuted: '#B8B4A8',
  border: '#515A59',
  accent: '#6DBE45',
  accentPressed: '#82CB60',
  onAccent: '#15194A',
  secondary: '#E0B25A',
  secondarySoft: '#463C29',
  pressure: '#E98369',
  pressureSoft: '#4B2D28',
  danger: '#F09A8C',
  feedbackExact: '#6DBE45',
  feedbackPresent: '#D5A04A',
  feedbackAbsent: '#4A575E',
  feedbackPending: '#242D31',
  paperLine: '#395358',
  paperMargin: '#744B45',
  inkSoft: '#A9C8D0',
};

// Compatibility palette for local preview slices that have not migrated to reactive appearance yet.
export const colors = lightColors;

export type AppTheme = { colors: AppThemeColors; isDark: boolean };

const AppThemeContext = createContext<AppTheme>({
  colors: lightColors,
  isDark: false,
});

export function useResolvedAppTheme(): AppTheme {
  const systemColorScheme = useColorScheme();
  const [{ appearance }] = useAppPreferences();
  const isDark = appearance === 'dark' || (appearance === 'system' && systemColorScheme === 'dark');

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}

export function AppThemeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AppTheme;
}) {
  return createElement(AppThemeContext.Provider, { value }, children);
}

export function useAppTheme(): AppTheme {
  return useContext(AppThemeContext);
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  xxl: 36,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
};

export const typeScale = {
  tiny: 11,
  small: 13,
  body: 16,
  lead: 18,
  subtitle: 22,
  title: 30,
};

export const layout = {
  maxContentWidth: 840,
  phoneShellBottomInset: 126,
};
