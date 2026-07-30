import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AVI_DIFFICULTIES, type AviDifficulty } from '@/game/word-duel-bot/difficulty';
import { DEFAULT_DUEL_RULES, type DuelRules } from '@/game/duel-rules';
import type { GameLanguage } from '@/game/word-duel-engine';
import { experienceCopy } from '@/i18n/experience-copy';
import { t, type InterfaceLocale } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { PaperCard } from '@/ui/brand';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';
import { GameLanguagePicker } from './components/game-language-picker';
import { DuelRulesCard } from './components/duel-rules-card';
import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS, type WordDuelRouteMode } from './word-duel-route-params';

type SetupMode = Extract<WordDuelRouteMode, 'bot_duel' | 'human_duel' | 'practice'>;

type SetupCopy = {
  start: string;
  subtitle: string;
  title: string;
  difficulty: string;
  friendly: string;
  friendlyDetail: string;
  balanced: string;
  balancedDetail: string;
  expert: string;
  expertDetail: string;
  languageHelp: string;
};

const SETUP_COPY: Record<InterfaceLocale, SetupCopy> = {
  en: { start: 'Start game', subtitle: 'Choose this game’s settings. Your saved defaults stay unchanged.', title: 'Game setup', difficulty: 'Avi difficulty', friendly: 'Friendly', friendlyDetail: 'More time and fewer clues remembered.', balanced: 'Balanced', balancedDetail: 'A steady challenge.', expert: 'Expert', expertDetail: 'Fast, precise play.', languageHelp: 'Game language' },
  es: { start: 'Empezar partida', subtitle: 'Elige los ajustes de esta partida. Tus valores predeterminados no cambian.', title: 'Configuración de partida', difficulty: 'Dificultad de Avi', friendly: 'Amable', friendlyDetail: 'Más tiempo y menos pistas recordadas.', balanced: 'Equilibrada', balancedDetail: 'Un reto constante.', expert: 'Experta', expertDetail: 'Juego rápido y preciso.', languageHelp: 'Idioma del juego' },
  ca: { start: 'Començar partida', subtitle: 'Tria els ajustos d’aquesta partida. Els valors predeterminats no canviaran.', title: 'Configuració de partida', difficulty: 'Dificultat de l’Avi', friendly: 'Amable', friendlyDetail: 'Més temps i menys pistes recordades.', balanced: 'Equilibrada', balancedDetail: 'Un repte constant.', expert: 'Experta', expertDetail: 'Joc ràpid i precís.', languageHelp: 'Idioma del joc' },
  fr: { start: 'Commencer la partie', subtitle: 'Choisissez les réglages de cette partie. Vos réglages enregistrés ne changent pas.', title: 'Réglages de la partie', difficulty: 'Difficulté d’Avi', friendly: 'Amical', friendlyDetail: 'Plus de temps et moins d’indices retenus.', balanced: 'Équilibrée', balancedDetail: 'Un défi régulier.', expert: 'Experte', expertDetail: 'Jeu rapide et précis.', languageHelp: 'Langue du jeu' },
  de: { start: 'Spiel starten', subtitle: 'Wähle die Einstellungen für dieses Spiel. Deine gespeicherten Standardwerte bleiben unverändert.', title: 'Spieleinstellungen', difficulty: 'Avi-Schwierigkeit', friendly: 'Freundlich', friendlyDetail: 'Mehr Zeit und weniger gemerkte Hinweise.', balanced: 'Ausgewogen', balancedDetail: 'Eine konstante Herausforderung.', expert: 'Experte', expertDetail: 'Schnelles, präzises Spiel.', languageHelp: 'Spielsprache' },
};

export function GameSetupScreen({ initialGameLanguage, mode }: { initialGameLanguage?: GameLanguage; mode: SetupMode }) {
  const router = useRouter();
  const [preferences] = useAppPreferences();
  const locale = preferences.interfaceLocale;
  const commonCopy = experienceCopy(locale);
  const copy = SETUP_COPY[locale];
  const [gameLanguage, setGameLanguage] = useState(initialGameLanguage ?? preferences.gameLanguage);
  const [aviDifficulty, setAviDifficulty] = useState<AviDifficulty>(preferences.aviDifficulty);
  const [duelRules, setDuelRules] = useState<DuelRules>(DEFAULT_DUEL_RULES);
  const styles = useStyles();

  const destination = mode === 'bot_duel'
    ? WORD_DUEL_ROUTE_PATHS.playAvi
    : mode === 'human_duel'
      ? WORD_DUEL_ROUTE_PATHS.challenge
      : WORD_DUEL_ROUTE_PATHS.practice;

  function startGame() {
    router.replace(buildWordDuelHref(destination, {
      aviDifficulty: mode === 'bot_duel' ? aviDifficulty : undefined,
      gameLanguage,
      interfaceLocale: locale,
      maxAttempts: mode === 'bot_duel' ? duelRules.maxAttempts : undefined,
      mode,
      wordLength: mode === 'bot_duel' ? duelRules.wordLength : undefined,
    }));
  }

  return (
    <AppScreen bottomInset={spacing.xxl} contentGap={spacing.md}>
      <InteriorScreenHeader backLabel={t(locale, 'back')} detail={modeLabel(mode, commonCopy)} onBack={() => router.back()} title={copy.title} />
      <Text style={styles.subtitle}>{copy.subtitle}</Text>
      <GameLanguagePicker dismissLabel={t(locale, 'done')} label={copy.languageHelp} onChange={setGameLanguage} value={gameLanguage} />
      {mode === 'bot_duel' ? (
        <>
          <DuelRulesCard editable interfaceLocale={locale} onChange={setDuelRules} rules={duelRules} />
          <PaperCard style={styles.card}>
            <Text style={styles.sectionLabel}>{copy.difficulty}</Text>
            <View style={styles.options}>
              {AVI_DIFFICULTIES.map((difficulty) => (
                <DifficultyOption
                  detail={copy[`${difficulty}Detail`]}
                  key={difficulty}
                  label={copy[difficulty]}
                  onPress={() => setAviDifficulty(difficulty)}
                  selected={aviDifficulty === difficulty}
                />
              ))}
            </View>
          </PaperCard>
        </>
      ) : null}
      <AppButton onPress={startGame}>{copy.start}</AppButton>
    </AppScreen>
  );
}

function DifficultyOption({ detail, label, onPress, selected }: { detail: string; label: string; onPress: () => void; selected: boolean }) {
  const styles = useStyles();
  const { colors } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.option, selected && { borderColor: colors.accent, backgroundColor: colors.secondarySoft }, pressed && styles.pressed]}>
      <View style={styles.optionCopy}><Text style={styles.optionTitle}>{label}</Text><Text style={styles.optionDetail}>{detail}</Text></View>
      <Text style={[styles.check, { color: selected ? colors.accent : colors.textMuted }]}>{selected ? '✓' : '○'}</Text>
    </Pressable>
  );
}

function modeLabel(mode: SetupMode, copy: ReturnType<typeof experienceCopy>): string {
  return mode === 'bot_duel' ? copy.playAvi : mode === 'human_duel' ? copy.challenge : copy.practice;
}

function useStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
    card: { gap: spacing.md },
    check: { fontSize: 21, fontWeight: '800' },
    option: { alignItems: 'center', borderColor: colors.border, borderRadius: radii.md, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.md, minHeight: 68, padding: spacing.md },
    optionCopy: { flex: 1, gap: 2 },
    optionDetail: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 18 },
    optionTitle: { color: colors.text, fontSize: typeScale.body, fontWeight: '800' },
    options: { gap: spacing.sm },
    pressed: { opacity: 0.76 },
    sectionLabel: { color: colors.text, fontSize: typeScale.body, fontWeight: '800' },
    subtitle: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22 },
  }), [colors]);
}
