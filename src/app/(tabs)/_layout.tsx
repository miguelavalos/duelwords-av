import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/ui/theme';

type TabIconProps = {
  color: string;
  label: string;
};

function TabIcon({ color, label }: TabIconProps) {
  return <Text style={{ color, fontSize: 17, fontWeight: '900' }}>{label}</Text>;
}

export default function TabsLayout() {
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
          title: 'Play',
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} label="P" />,
        }}
      />
      <Tabs.Screen
        name="rivals"
        options={{
          title: 'Rivals',
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} label="R" />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} label="S" />,
        }}
      />
    </Tabs>
  );
}
