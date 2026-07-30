import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AVI_DIFFICULTIES, isAviDifficulty } from '@/game/word-duel-bot/difficulty';
import { type GameLanguage } from '@/game/word-duel-engine';
import { resetTargetRotation } from '@/game/dictionaries/target-rotation';
import { experienceCopy } from '@/i18n/experience-copy';
import { INTERFACE_LOCALES, t } from '@/i18n/locales';
import { sharedSurfaceT } from '@/i18n/shared-surface-copy';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppChromeHeader, PaperCard, SectionHeading } from '@/ui/brand';
import { isSharedAppleSurfaceAvailable, SharedAppleSurface, type SharedAppleAction } from '@/ui/shared-apple-surface';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';
import { GameLanguagePicker } from '../word-duel/components/game-language-picker';

const links = {
  notices: 'https://duelwords-av.avalsys.com/notices/',
  privacy: 'https://duelwords-av.avalsys.com/privacy/',
  source: 'https://github.com/miguelavalos/duelwords-av',
  support: 'https://duelwords-av.avalsys.com/support/',
  terms: 'https://duelwords-av.avalsys.com/terms/',
} as const;

export function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useStyles();
  const [preferences, setPreferences] = useAppPreferences();
  const { appearance, aviDifficulty, gameLanguage, hapticsEnabled, interfaceLocale, playerDisplayName } = preferences;
  const copy = experienceCopy(interfaceLocale);
  const surfaceCopy = (key: Parameters<typeof sharedSurfaceT>[1]) => sharedSurfaceT(interfaceLocale, key);
  const version = Constants.expoConfig?.version ?? '0.1.0';
  const build = Constants.expoConfig?.ios?.buildNumber ?? '1';

  async function setHaptics(enabled: boolean) {
    setPreferences((current) => ({ ...current, hapticsEnabled: enabled }));
    if (enabled) await Haptics.selectionAsync().catch(() => undefined);
  }

  function handleSharedAction({ action, value }: SharedAppleAction) {
    if (action === 'account') router.replace('/(tabs)/account' as Href);
    else if (action === 'openPrivacy') openLink(links.privacy);
    else if (action === 'openTerms') openLink(links.terms);
    else if (action === 'openSupport') openLink(links.support);
    else if (action === 'openNotices') openLink(links.notices);
    else if (action === 'openSource') openLink(links.source);
    else if (action === 'resetLocalData') resetTargetRotation();
    else if (action === 'setInterfaceLocale' && INTERFACE_LOCALES.some((locale) => locale.code === value)) {
      setPreferences((current) => ({ ...current, interfaceLocale: value as typeof current.interfaceLocale }));
    } else if (action === 'setAppearance' && (value === 'system' || value === 'light' || value === 'dark')) {
      setPreferences((current) => ({ ...current, appearance: value }));
    } else if (action === 'setGameLanguage' && isGameLanguage(value)) {
      setPreferences((current) => ({ ...current, gameLanguage: value }));
    } else if (action === 'setAviDifficulty' && isAviDifficulty(value)) {
      setPreferences((current) => ({ ...current, aviDifficulty: value }));
    } else if (action === 'setPlayerDisplayName') {
      setPreferences((current) => ({ ...current, playerDisplayName: value ?? '' }));
    } else if (action === 'setHaptics') {
      void setHaptics(value === 'true');
    }
  }

  if (isSharedAppleSurfaceAvailable) {
    return (
      <SharedAppleSurface
        appearance={appearance}
        aviDifficulty={aviDifficulty}
        gameLanguage={gameLanguage}
        hapticsEnabled={hapticsEnabled}
        interfaceLocale={interfaceLocale}
        onAction={handleSharedAction}
        playerDisplayName={playerDisplayName}
        selectedTab="settings"
        style={styles.sharedScreen}
        surface="settings"
      />
    );
  }

  return (
    <AppScreen key={appearance} bottomInset={spacing.xxl}>
      {width < 760 ? (
        <AppChromeHeader
          accountLabel={copy.account}
          onAccountPress={() => router.replace('/(tabs)/account' as Href)}
          onSettingsPress={() => undefined}
          selected="settings"
          settingsLabel={copy.settings}
        />
      ) : null}
      <View style={styles.headerCopy}>
        <Text accessibilityRole="header" aria-level={1} style={styles.screenTitle}>{t(interfaceLocale, 'settings')}</Text>
        <Text style={styles.subtitle}>{t(interfaceLocale, 'preferencesLocal')}</Text>
      </View>

      <PaperCard>
        <SectionHeading title={surfaceCopy('Game preferences')} detail={surfaceCopy('Defaults for new practice, Avi, and human games. You can change them before each game.')} />
        <GameLanguagePicker dismissLabel={t(interfaceLocale, 'done')} label={copy.gameLanguage} onChange={(nextGameLanguage) => setPreferences((current) => ({ ...current, gameLanguage: nextGameLanguage }))} value={gameLanguage} />
        <Text style={styles.settingLabel}>{surfaceCopy('Avi difficulty')}</Text>
        <View style={styles.optionList}>
          {AVI_DIFFICULTIES.map((difficulty) => <Option key={difficulty} label={difficultyLabel(difficulty, surfaceCopy)} selected={aviDifficulty === difficulty} selectedLabel={t(interfaceLocale, 'selected')} onPress={() => setPreferences((current) => ({ ...current, aviDifficulty: difficulty }))} />)}
        </View>
        <View style={styles.settingCopy}>
          <Text style={styles.settingLabel}>{surfaceCopy('DuelWords player name')}</Text>
          <Text style={styles.settingDetail}>{surfaceCopy('Used for human challenges from this device. It does not change your Account AV profile.')}</Text>
        </View>
        <TextInput accessibilityLabel={surfaceCopy('DuelWords player name')} maxLength={32} onChangeText={(value) => setPreferences((current) => ({ ...current, playerDisplayName: value }))} placeholder={surfaceCopy('Optional')} placeholderTextColor={styles.placeholder.color} style={styles.textInput} value={playerDisplayName} />
      </PaperCard>

      <PaperCard>
        <SectionHeading title={t(interfaceLocale, 'interfaceLanguage')} detail={surfaceCopy('Choose the language used by navigation, help, account, and game messages.')} />
        <View style={styles.optionList}>
          {INTERFACE_LOCALES.map((locale) => (
            <Option key={locale.code} label={locale.label} selected={locale.code === interfaceLocale} selectedLabel={t(interfaceLocale, 'selected')} onPress={() => setPreferences((current) => ({ ...current, interfaceLocale: locale.code }))} />
          ))}
        </View>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={t(interfaceLocale, 'appearance')} detail={surfaceCopy('Choose whether DuelWords AV follows the system or always uses a fixed appearance.')} />
        <View style={styles.optionList}>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <Option key={option} label={t(interfaceLocale, option)} selected={appearance === option} selectedLabel={t(interfaceLocale, 'selected')} onPress={() => setPreferences((current) => ({ ...current, appearance: option }))} />
          ))}
        </View>
        <SettingToggle
          detail={surfaceCopy('Short feedback for selections and accepted local actions.')}
          label={surfaceCopy('Haptics')}
          onValueChange={(value) => { void setHaptics(value); }}
          value={hapticsEnabled}
        />
      </PaperCard>

      <PaperCard>
        <SectionHeading title={surfaceCopy('Privacy, help & legal')} detail={surfaceCopy('Find support, privacy, terms, and notices below.')} />
        <ExternalRow label={surfaceCopy('Privacy policy')} onPress={() => openLink(links.privacy)} />
        <ExternalRow label={surfaceCopy('Terms of use')} onPress={() => openLink(links.terms)} />
        <ExternalRow label={surfaceCopy('Support')} onPress={() => openLink(links.support)} />
        <ExternalRow label={surfaceCopy('Open-source notices')} onPress={() => openLink(links.notices)} />
      </PaperCard>

      <PaperCard>
        <SectionHeading title="DuelWords AV" detail={surfaceCopy('Challenge a friend. Or play Avi.')} />
        <View style={styles.aboutRow}><Text style={styles.aboutLabel}>{surfaceCopy('Version')}</Text><Text selectable style={styles.aboutValue}>{version} ({build})</Text></View>
        <View style={styles.aboutRow}><Text style={styles.aboutLabel}>{surfaceCopy('Word lists')}</Text><Text style={styles.aboutValue}>{surfaceCopy('Bundled EN, ES, CA, FR, and DE')}</Text></View>
        <View style={styles.aboutRow}><Text style={styles.aboutLabel}>{surfaceCopy('Daily word')}</Text><Text style={styles.aboutValue}>{surfaceCopy('One official word for everyone')}</Text></View>
      </PaperCard>
    </AppScreen>
  );
}

function Option({ label, onPress, selected, selectedLabel }: { label: string; onPress: () => void; selected: boolean; selectedLabel: string }) {
  const styles = useStyles();
  const { fontScale } = useWindowDimensions();
  return (
    <Pressable accessibilityLabel={selected ? `${label}, ${selectedLabel}` : label} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
      <Text accessibilityElementsHidden importantForAccessibility="no" style={[styles.optionMarker, selected && styles.optionMarkerSelected]}>{selected ? (fontScale >= 1.3 ? '✓' : selectedLabel) : ''}</Text>
    </Pressable>
  );
}

function SettingToggle({ detail, label, onValueChange, value }: { detail: string; label: string; onValueChange: (value: boolean) => void; value: boolean }) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}><Text style={styles.settingLabel}>{label}</Text><Text style={styles.settingDetail}>{detail}</Text></View>
      <Switch accessibilityLabel={label} onValueChange={onValueChange} trackColor={{ false: colors.surfaceStrong, true: colors.accent }} value={value} />
    </View>
  );
}

function ExternalRow({ destructive, label, onPress }: { destructive?: boolean; label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.externalRow, pressed && styles.pressed]}>
      <Text style={[styles.externalLabel, destructive && styles.destructive]}>{label}</Text><Text style={[styles.externalArrow, destructive && styles.destructive]}>↗</Text>
    </Pressable>
  );
}

function isGameLanguage(value: string | undefined): value is GameLanguage {
  return value === 'ca' || value === 'de' || value === 'en' || value === 'es' || value === 'fr';
}

function difficultyLabel(
  value: (typeof AVI_DIFFICULTIES)[number],
  copy: (key: Parameters<typeof sharedSurfaceT>[1]) => string,
): string {
  if (value === 'friendly') return copy('Friendly');
  if (value === 'balanced') return copy('Balanced');
  return copy('Expert');
}

function openLink(url: string) {
  void WebBrowser.openBrowserAsync(url);
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    sharedScreen: { flex: 1 },
    headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    screenTitle: { color: colors.text, fontFamily: 'Georgia', fontSize: 36, lineHeight: 40, fontWeight: '700', letterSpacing: -1 },
    subtitle: { maxWidth: 560, color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
    optionList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    option: { minHeight: 48, flexGrow: 1, flexBasis: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: spacing.md },
    optionSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
    optionText: { flexShrink: 1, color: colors.text, fontSize: typeScale.body, fontWeight: '700' },
    optionTextSelected: { color: colors.onAccent },
    optionMarker: { flexShrink: 0, color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
    optionMarkerSelected: { color: colors.onAccent },
    settingRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    settingCopy: { flex: 1, gap: 2 },
    settingLabel: { color: colors.text, fontSize: typeScale.body, fontWeight: '800' },
    settingDetail: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 18 },
    textInput: { borderColor: colors.border, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, color: colors.text, fontSize: typeScale.body, minHeight: 48, paddingHorizontal: spacing.md },
    placeholder: { color: colors.textMuted },
    buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    flexButton: { flexBasis: 160, flexGrow: 1 },
    externalRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    externalLabel: { flex: 1, color: colors.text, fontSize: typeScale.body, fontWeight: '700' },
    externalArrow: { color: colors.accent, fontSize: 18 },
    destructive: { color: colors.danger },
    pressed: { opacity: 0.62 },
    aboutRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: spacing.xs },
    aboutLabel: { color: colors.textMuted, fontSize: typeScale.small, fontWeight: '700' },
    aboutValue: { flex: 1, color: colors.text, fontSize: typeScale.small, fontWeight: '800', textAlign: 'right' },
  }), [colors]);
}
