import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { useAppTheme } from '@/ui/theme';

type TabIconProps = {
  color: string;
  kind: 'play' | 'rivals' | 'stats';
};

function TabIcon({ color, kind }: TabIconProps) {
  if (kind === 'play') {
    return <View style={[styles.playIcon, { borderLeftColor: color }]} />;
  }

  if (kind === 'rivals') {
    return (
      <View style={styles.rivalsIcon}>
        <View style={[styles.rivalHead, { backgroundColor: color }]} />
        <View style={[styles.rivalHead, styles.rivalHeadSecond, { backgroundColor: color }]} />
        <View style={[styles.rivalBody, { borderColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.statsIcon}>
      <View style={[styles.statBar, styles.statBarShort, { backgroundColor: color }]} />
      <View style={[styles.statBar, styles.statBarMedium, { backgroundColor: color }]} />
      <View style={[styles.statBar, styles.statBarTall, { backgroundColor: color }]} />
    </View>
  );
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
          minHeight: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="play"
        options={{
          title: t(interfaceLocale, 'play'),
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} kind="play" />,
        }}
      />
      <Tabs.Screen
        name="rivals"
        options={{
          title: t(interfaceLocale, 'rivals'),
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} kind="rivals" />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t(interfaceLocale, 'stats'),
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} kind="stats" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 13,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },
  rivalsIcon: {
    width: 24,
    height: 20,
  },
  rivalHead: {
    position: 'absolute',
    top: 1,
    left: 3,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rivalHeadSecond: {
    left: 14,
  },
  rivalBody: {
    position: 'absolute',
    left: 1,
    bottom: 1,
    width: 22,
    height: 9,
    borderWidth: 2,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomWidth: 0,
  },
  statsIcon: {
    width: 23,
    height: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statBar: {
    width: 5,
    borderRadius: 2,
  },
  statBarShort: { height: 7 },
  statBarMedium: { height: 13 },
  statBarTall: { height: 19 },
});
