import { createContext, createElement, type ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { useAppPreferences } from '@/preferences/use-app-preferences';

export const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSoft: '#EEF6F3',
  surfaceStrong: '#E7ECF3',
  text: '#111827',
  textMuted: '#64748B',
  border: '#CBD5E1',
  accent: '#0F766E',
  accentPressed: '#115E59',
  onAccent: '#FFFFFF',
  secondary: '#4F46E5',
  secondarySoft: '#EEF2FF',
  pressure: '#EA580C',
  pressureSoft: '#FFF7ED',
  danger: '#B91C1C',
  feedbackExact: '#0F766E',
  feedbackPresent: '#4F46E5',
  feedbackAbsent: '#334155',
  feedbackPending: '#F8FAFC',
};

export type AppThemeColors = typeof lightColors;

export const darkColors: AppThemeColors = {
  background: '#0B1220',
  surface: '#111827',
  surfaceSoft: '#12312F',
  surfaceStrong: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#A9B7CA',
  border: '#475569',
  accent: '#5EEAD4',
  accentPressed: '#2DD4BF',
  onAccent: '#06201D',
  secondary: '#A5B4FC',
  secondarySoft: '#262A4A',
  pressure: '#FDBA74',
  pressureSoft: '#422006',
  danger: '#FCA5A5',
  feedbackExact: '#14B8A6',
  feedbackPresent: '#818CF8',
  feedbackAbsent: '#475569',
  feedbackPending: '#0F172A',
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
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 4,
  md: 8,
};

export const typeScale = {
  tiny: 11,
  small: 13,
  body: 15,
  lead: 17,
  subtitle: 20,
  title: 28,
};

export const layout = {
  maxContentWidth: 720,
};
