import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { type Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';

import { experienceCopy } from '@/i18n/experience-copy';
import { GAME_LANGUAGES, INTERFACE_LOCALES, t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { DuelWordsWordmark, InkEyebrow, PaperCard, SectionHeading } from '@/ui/brand';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

const links = {
  deleteAccount: 'https://duelwords-av.avalsys.com/delete-account/',
  notices: 'https://duelwords-av.avalsys.com/notices/',
  privacy: 'https://duelwords-av.avalsys.com/privacy/',
  support: 'https://duelwords-av.avalsys.com/support/',
  terms: 'https://duelwords-av.avalsys.com/terms/',
} as const;

export function SettingsScreen() {
  const router = useRouter();
  const styles = useStyles();
  const [preferences, setPreferences] = useAppPreferences();
  const { appearance, gameLanguage, hapticsEnabled, interfaceLocale } = preferences;
  const copy = experienceCopy(interfaceLocale);
  const version = Constants.expoConfig?.version ?? '0.1.0';
  const build = Constants.expoConfig?.ios?.buildNumber ?? '1';

  async function setHaptics(enabled: boolean) {
    setPreferences((current) => ({ ...current, hapticsEnabled: enabled }));
    if (enabled) await Haptics.selectionAsync().catch(() => undefined);
  }

  return (
    <AppScreen key={appearance} bottomInset={spacing.xxl}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <DuelWordsWordmark compact />
          <InkEyebrow>{copy.settings}</InkEyebrow>
          <Text aria-level={1} accessibilityRole="header" style={styles.title}>{t(interfaceLocale, 'settings')}</Text>
          <Text style={styles.subtitle}>{t(interfaceLocale, 'preferencesLocal')}</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>{t(interfaceLocale, 'done')}</AppButton>
      </View>

      <PaperCard>
        <SectionHeading title={t(interfaceLocale, 'interfaceLanguage')} detail="Language used by navigation, help, account, and game messages." />
        <View style={styles.optionList}>
          {INTERFACE_LOCALES.map((locale) => (
            <Option key={locale.code} label={locale.label} selected={locale.code === interfaceLocale} selectedLabel={t(interfaceLocale, 'selected')} onPress={() => setPreferences((current) => ({ ...current, interfaceLocale: locale.code }))} />
          ))}
        </View>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={t(interfaceLocale, 'gameLanguage')} detail="Default for new local games and challenges. Active games keep their locked language." />
        <View style={styles.optionList}>
          {GAME_LANGUAGES.map((language) => (
            <Option key={language.code} label={language.label} selected={language.code === gameLanguage} selectedLabel={t(interfaceLocale, 'selected')} onPress={() => setPreferences((current) => ({ ...current, gameLanguage: language.code }))} />
          ))}
        </View>
      </PaperCard>

      <PaperCard>
        <SectionHeading title={t(interfaceLocale, 'appearance')} detail="The paper, ink, boards, and chrome follow this choice." />
        <View style={styles.optionList}>
          {(['system', 'light', 'dark'] as const).map((option) => (
            <Option key={option} label={t(interfaceLocale, option)} selected={appearance === option} selectedLabel={t(interfaceLocale, 'selected')} onPress={() => setPreferences((current) => ({ ...current, appearance: option }))} />
          ))}
        </View>
        <SettingToggle
          detail="Short feedback for selections and accepted local actions. System accessibility settings still apply."
          label="Haptics"
          onValueChange={(value) => { void setHaptics(value); }}
          value={hapticsEnabled}
        />
      </PaperCard>

      <PaperCard>
        <SectionHeading title="Account & plan" detail="Account AV and DuelWords Pro remain separate from game-language preferences." />
        <View style={styles.buttonRow}>
          <AppButton tone="secondary" style={styles.flexButton} onPress={() => router.push('/account' as Href)}>{copy.account}</AppButton>
          <AppButton tone="quiet" style={styles.flexButton} onPress={() => router.push('/pro' as Href)}>DuelWords Pro</AppButton>
        </View>
      </PaperCard>

      <PaperCard>
        <SectionHeading title="Privacy, help & legal" detail="Public product information opens through secure HTTPS pages." />
        <ExternalRow label="Privacy policy" onPress={() => openLink(links.privacy)} />
        <ExternalRow label="Terms of use" onPress={() => openLink(links.terms)} />
        <ExternalRow label="Support" onPress={() => openLink(links.support)} />
        <ExternalRow label="Dictionary notices & licenses" onPress={() => openLink(links.notices)} />
        <ExternalRow label="Delete account information" destructive onPress={() => openLink(links.deleteAccount)} />
      </PaperCard>

      <PaperCard>
        <SectionHeading title="About DuelWords AV" detail="Word duels with friends, or Avi." />
        <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Version</Text><Text selectable style={styles.aboutValue}>{version} ({build})</Text></View>
        <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Word lists</Text><Text style={styles.aboutValue}>Bundled EN / ES</Text></View>
        <View style={styles.aboutRow}><Text style={styles.aboutLabel}>Daily word</Text><Text style={styles.aboutValue}>Server-selected only</Text></View>
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

function openLink(url: string) {
  void Linking.openURL(url);
}

function useStyles() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  return useMemo(() => StyleSheet.create({
    header: { flexDirection: width <= 360 ? 'column' : 'row', alignItems: width <= 360 ? 'stretch' : 'flex-start', gap: spacing.md },
    headerCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    title: { color: colors.text, fontFamily: 'Georgia', fontSize: 35, fontWeight: '700', letterSpacing: -1 },
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
  }), [colors, width]);
}
