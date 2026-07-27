import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { experienceCopy } from '@/i18n/experience-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { DuelWordsWordmark, aviAssets } from '@/ui/brand';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface } from '@/ui/shared-apple-surface';
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
  const [{ appearance, interfaceLocale }] = useAppPreferences();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const copy = experienceCopy(interfaceLocale);
  const tablet = width >= 760;

  return (
    <Tabs
      tabBar={(props) => (
        <DuelWordsTabBar
          {...props}
          appearance={appearance}
          copy={copy}
          colors={colors}
          interfaceLocale={interfaceLocale}
          tablet={tablet}
        />
      )}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: tablet ? colors.surfaceSoft : 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarStyle: {
          backgroundColor: isSharedAppleSurfaceAvailable && !tablet ? 'transparent' : colors.surface,
          borderColor: colors.border,
          borderTopWidth: isSharedAppleSurfaceAvailable && !tablet ? 0 : undefined,
          minHeight: tablet ? undefined : 72,
          position: isSharedAppleSurfaceAvailable && !tablet ? 'absolute' : 'relative',
          width: tablet ? 232 : undefined,
          paddingTop: tablet ? 18 : 8,
          paddingBottom: tablet ? 18 : 8,
        },
        tabBarPosition: tablet ? 'left' : 'bottom',
        tabBarLabelPosition: tablet ? 'beside-icon' : 'below-icon',
        tabBarItemStyle: !isSharedAppleSurfaceAvailable && tablet ? styles.tabletTabItem : undefined,
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
      <Tabs.Screen name="settings" options={{ href: null, title: copy.settings }} />
      <Tabs.Screen name="account" options={{ href: null, title: copy.account }} />
    </Tabs>
  );
}

type AppColors = ReturnType<typeof useAppTheme>['colors'];

function DuelWordsTabBar({
  appearance,
  colors,
  copy,
  descriptors,
  insets,
  interfaceLocale,
  navigation,
  state,
  tablet,
}: BottomTabBarProps & {
  appearance: 'dark' | 'light' | 'system';
  colors: AppColors;
  copy: ReturnType<typeof experienceCopy>;
  interfaceLocale: Parameters<typeof experienceCopy>[0];
  tablet: boolean;
}) {
  const labels: Record<string, string> = {
    avi: copy.avi,
    play: copy.home,
    rivals: copy.rivals,
    stats: copy.stats,
  };
  const primaryRoutes = state.routes
    .map((route, index) => ({ index, route }))
    .filter(({ route }) => ['play', 'rivals', 'stats', 'avi'].includes(route.name));
  const mainRoutes = primaryRoutes.filter(({ route }) => route.name !== 'avi');
  const aviRoute = primaryRoutes.find(({ route }) => route.name === 'avi');
  const selectedRoute = state.routes[state.index]?.name;

  if (isSharedAppleSurfaceAvailable) {
    return (
      <SharedAppleSurface
        appearance={appearance}
        interfaceLocale={interfaceLocale}
        onAction={({ action, value }) => {
          if (action !== 'tab' || !value) return;
          const destination = state.routes.find((route) => route.name === value);
          if (destination) navigation.navigate(destination.name, destination.params);
        }}
        selectedTab={selectedRoute}
        style={tablet ? styles.sharedSidebar : styles.sharedFooter}
        surface={tablet ? 'sidebar' : 'footer'}
      />
    );
  }

  function renderTab(route: typeof state.routes[number], index: number, tabletItem: boolean) {
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
          tabletItem ? styles.customTabItemTablet : styles.customTabItemPhone,
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
        {tabletItem ? <Text numberOfLines={1} style={[styles.customTabLabel, { color }]}>{label}</Text> : null}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.customTabBar,
        tablet ? styles.customTabBarTablet : styles.customTabBarPhone,
        {
          backgroundColor: tablet ? colors.surface : colors.background,
          borderColor: colors.border,
          paddingTop: tablet ? insets.top + 16 : 8,
          paddingBottom: tablet ? Math.max(insets.bottom, 18) : Math.max(insets.bottom, 8),
        },
      ]}>
      {tablet && selectedRoute === 'play' ? (
        <View style={styles.sidebarBrand}>
          <DuelWordsWordmark compact withIcon />
        </View>
      ) : null}
      {tablet ? primaryRoutes.map(({ index, route }) => renderTab(route, index, true)) : (
        <>
          <View style={[styles.phoneMainPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {mainRoutes.map(({ index, route }) => renderTab(route, index, false))}
          </View>
          {aviRoute ? (
            <View style={[styles.phoneAviPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {renderTab(aviRoute.route, aviRoute.index, false)}
            </View>
          ) : null}
        </>
      )}
      {tablet ? (
        <>
          <View style={styles.tabletSidebarSpacer} />
          <Pressable
            accessibilityLabel={copy.settings}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRoute === 'settings' }}
            onPress={() => navigation.navigate('settings')}
            style={({ pressed }) => [styles.tabletChromeItem, selectedRoute === 'settings' && { backgroundColor: colors.surfaceSoft }, pressed && styles.customTabItemPressed]}>
            <SettingsGlyph color={selectedRoute === 'settings' ? colors.accent : colors.textMuted} />
            <Text style={[styles.customTabLabel, { color: selectedRoute === 'settings' ? colors.accent : colors.textMuted }]}>{copy.settings}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={copy.account}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRoute === 'account' }}
            onPress={() => navigation.navigate('account')}
            style={({ pressed }) => [styles.tabletChromeItem, selectedRoute === 'account' && { backgroundColor: colors.surfaceSoft }, pressed && styles.customTabItemPressed]}>
            <AccountGlyph color={selectedRoute === 'account' ? colors.accent : colors.textMuted} />
            <Text style={[styles.customTabLabel, { color: selectedRoute === 'account' ? colors.accent : colors.textMuted }]}>{copy.account}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

function AccountGlyph({ color }: { color: string }) {
  return <View style={styles.sidebarAccountGlyph}><View style={[styles.sidebarAccountHead, { backgroundColor: color }]} /><View style={[styles.sidebarAccountBody, { borderColor: color }]} /></View>;
}

function SettingsGlyph({ color }: { color: string }) {
  return <View style={styles.sidebarSettingsGlyph}>{[18, 12, 18].map((size, index) => <View key={index} style={{ width: size, height: 2, borderRadius: 1, backgroundColor: color, alignSelf: index === 1 ? 'flex-end' : 'auto' }} />)}</View>;
}

const styles = StyleSheet.create({
  sharedFooter: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 104,
  },
  sharedSidebar: {
    width: 264,
    height: '100%',
  },
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
  sidebarBrand: { minHeight: 86, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 },
  customTabBarPhone: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },
  phoneMainPill: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 29,
    borderCurve: 'continuous',
    boxShadow: '0 8px 22px rgba(38, 45, 43, 0.12)',
  },
  phoneAviPill: {
    width: 58,
    height: 58,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 29,
    borderCurve: 'continuous',
    boxShadow: '0 8px 22px rgba(38, 45, 43, 0.12)',
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
    minHeight: 56,
  },
  customTabItemPressed: { opacity: 0.62 },
  customTabLabel: { fontSize: 12, fontWeight: '800' },
  tabletSidebarSpacer: { flex: 1, minHeight: 16 },
  tabletChromeItem: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, borderRadius: 14 },
  sidebarAccountGlyph: { width: 22, height: 22, alignItems: 'center' },
  sidebarAccountHead: { width: 8, height: 8, borderRadius: 4 },
  sidebarAccountBody: { position: 'absolute', bottom: 0, width: 20, height: 10, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  sidebarSettingsGlyph: { width: 20, gap: 4 },
});
