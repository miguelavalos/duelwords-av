import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { experienceCopy } from '@/i18n/experience-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { aviAssets } from '@/ui/brand';
import { useAppTheme } from '@/ui/theme';

type TabIconProps = {
  color: string;
  kind: 'home' | 'rivals' | 'stats';
};

function TabIcon({ color, kind }: TabIconProps) {
  if (kind === 'home') {
    return (
      <View style={[styles.homeIcon, { borderColor: color }]}>
        <View style={[styles.homeRoof, { borderColor: color }]} />
      </View>
    );
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
  const { width } = useWindowDimensions();
  const copy = experienceCopy(interfaceLocale);
  const tablet = width >= 760;

  return (
    <Tabs
      tabBar={(props) => <DuelWordsTabBar {...props} copy={copy} colors={colors} tablet={tablet} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: tablet ? colors.surfaceSoft : 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          minHeight: tablet ? undefined : 72,
          width: tablet ? 232 : undefined,
          paddingTop: tablet ? 18 : 8,
          paddingBottom: tablet ? 18 : 8,
        },
        tabBarPosition: tablet ? 'left' : 'bottom',
        tabBarLabelPosition: tablet ? 'beside-icon' : 'below-icon',
        tabBarItemStyle: tablet ? styles.tabletTabItem : undefined,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="play"
        options={{
          title: copy.home,
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} kind="home" />,
        }}
      />
      <Tabs.Screen
        name="rivals"
        options={{
          title: copy.rivals,
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} kind="rivals" />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: copy.stats,
          tabBarIcon: ({ color }) => <TabIcon color={String(color)} kind="stats" />,
        }}
      />
      <Tabs.Screen
        name="avi"
        options={{
          title: copy.avi,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.aviIconFrame, focused && { borderColor: colors.accent, backgroundColor: colors.surfaceSoft }]}>
              <Image source={aviAssets.footer} contentFit="contain" style={styles.aviIcon} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

type AppColors = ReturnType<typeof useAppTheme>['colors'];

function DuelWordsTabBar({
  colors,
  copy,
  descriptors,
  insets,
  navigation,
  state,
  tablet,
}: BottomTabBarProps & {
  colors: AppColors;
  copy: ReturnType<typeof experienceCopy>;
  tablet: boolean;
}) {
  const labels: Record<string, string> = {
    avi: copy.avi,
    play: copy.home,
    rivals: copy.rivals,
    stats: copy.stats,
  };

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.customTabBar,
        tablet ? styles.customTabBarTablet : styles.customTabBarPhone,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingTop: tablet ? insets.top + 16 : 8,
          paddingBottom: tablet ? Math.max(insets.bottom, 18) : Math.max(insets.bottom, 8),
        },
      ]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = labels[route.name] ?? String(descriptors[route.key].options.title ?? route.name);
        const color = focused ? colors.accent : colors.textMuted;

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }

        return (
          <Pressable
            key={route.key}
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            onPress={onPress}
            style={({ pressed }) => [
              styles.customTabItem,
              tablet ? styles.customTabItemTablet : styles.customTabItemPhone,
              focused && { backgroundColor: colors.surfaceSoft },
              pressed && styles.customTabItemPressed,
            ]}>
            {route.name === 'avi' ? (
              <View style={[styles.aviIconFrame, focused && { borderColor: colors.accent, backgroundColor: colors.surfaceSoft }]}>
                <Image source={aviAssets.footer} contentFit="contain" style={styles.aviIcon} />
              </View>
            ) : (
              <TabIcon color={color} kind={route.name === 'play' ? 'home' : route.name === 'rivals' ? 'rivals' : 'stats'} />
            )}
            <Text numberOfLines={1} style={[styles.customTabLabel, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  homeIcon: {
    width: 19,
    height: 15,
    marginTop: 5,
    borderWidth: 2,
    borderTopWidth: 0,
    borderRadius: 3,
  },
  homeRoof: {
    position: 'absolute',
    width: 15,
    height: 15,
    left: 0,
    top: -8,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    transform: [{ rotate: '45deg' }],
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
  aviIconFrame: {
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    borderRadius: 15,
  },
  aviIcon: { width: 35, height: 25 },
  tabletTabItem: {
    maxHeight: 54,
    marginHorizontal: 14,
    marginVertical: 3,
    borderRadius: 14,
  },
  customTabBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  customTabBarTablet: {
    width: 232,
    borderTopWidth: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    gap: 4,
  },
  customTabBarPhone: {
    minHeight: 72,
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  customTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  customTabItemTablet: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 14,
    paddingHorizontal: 14,
  },
  customTabItemPhone: {
    flex: 1,
    gap: 4,
  },
  customTabItemPressed: { opacity: 0.62 },
  customTabLabel: { fontSize: 12, fontWeight: '800' },
});
