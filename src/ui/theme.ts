import { createContext, createElement, type ReactNode, useContext } from 'react';
import { useColorScheme } from 'react-native';

import { useAppPreferences } from '@/preferences/use-app-preferences';

export const lightColors = {
  background: '#F5F4EF',
  surface: '#FCFBF7',
  surfaceSoft: '#E6F0EC',
  surfaceStrong: '#E4E9E7',
  text: '#10212A',
  textMuted: '#607078',
  border: '#C8D0CD',
  accent: '#0A817A',
  accentPressed: '#076861',
  onAccent: '#FFFFFF',
  secondary: '#B98916',
  secondarySoft: '#F3E8C9',
  pressure: '#C65D43',
  pressureSoft: '#F8E5DE',
  danger: '#A83D35',
  feedbackExact: '#0A817A',
  feedbackPresent: '#C89520',
  feedbackAbsent: '#40515A',
  feedbackPending: '#F8F7F2',
};

export type AppThemeColors = typeof lightColors;

export const darkColors: AppThemeColors = {
  background: '#061722',
  surface: '#0D2633',
  surfaceSoft: '#103638',
  surfaceStrong: '#1A3541',
  text: '#F4F1E8',
  textMuted: '#A9B5B7',
  border: '#31505B',
  accent: '#2EB7AB',
  accentPressed: '#20958C',
  onAccent: '#031C1B',
  secondary: '#E0B443',
  secondarySoft: '#40371E',
  pressure: '#F08A69',
  pressureSoft: '#48271F',
  danger: '#F19A8E',
  feedbackExact: '#159B91',
  feedbackPresent: '#D5A62C',
  feedbackAbsent: '#384B56',
  feedbackPending: '#0A202C',
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
  sm: 6,
  md: 10,
  lg: 14,
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
};
