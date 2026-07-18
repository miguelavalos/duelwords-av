import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { useAppTheme } from '@/ui/theme';

type TabIconProps = {
  color: string;
  label: string;
};

function TabIcon({ color, label }: TabIconProps) {
  return <Text style={{ color, fontSize: 17, fontWeight: '900' }}>{label}</Text>;
}

export default function TabsLayout() {
  const [{ interfaceLocale }] = useAppPreferences();
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="play"
        options={{
          title: t(interfaceLocale, 'play'),
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} label="P" />,
        }}
      />
      <Tabs.Screen
        name="rivals"
        options={{
          title: t(interfaceLocale, 'rivals'),
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} label="R" />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t(interfaceLocale, 'stats'),
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} label="S" />,
        }}
      />
    </Tabs>
  );
}
