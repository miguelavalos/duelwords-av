import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import {
  DUEL_ATTEMPT_OPTIONS,
  DUEL_RULES_PRESETS,
  duelRulesPresetId,
  type DuelRules,
  type DuelRulesPresetId,
} from '@/game/duel-rules';
import { WORD_DUEL_WORD_LENGTHS } from '@/game/word-duel-engine';
import type { InterfaceLocale } from '@/i18n/locales';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

type DuelRulesCardProps = {
  compact?: boolean;
  editable?: boolean;
  interfaceLocale: InterfaceLocale;
  onChange?: (rules: DuelRules) => void;
  rules: DuelRules;
  title?: string;
};

type RulesCopy = {
  attempts: string;
  attemptsHelp: string;
  locked: string;
  presets: Record<DuelRulesPresetId, { detail: string; glyph: string; title: string }>;
  summary: (rules: DuelRules) => string;
  title: string;
  wordLength: string;
  wordLengthHelp: string;
};

const COPY: Record<InterfaceLocale, RulesCopy> = {
  en: rulesCopy('Duel rules', 'Letters', 'Longer words need more deduction.', 'Attempts', 'How many guesses each player gets.', 'Rules chosen by the host', 'letters', 'attempts', {
    classic: ['Classic', 'The familiar, balanced duel.', '◆'], quick: ['Quick', 'Short and tense.', '⚡'], strategic: ['Strategic', 'More letters, more clues.', '◎'], epic: ['Epic', 'Long words and room to fight.', '✦'],
  }),
  es: rulesCopy('Reglas del duelo', 'Letras', 'Cuantas más letras, más deducción.', 'Intentos', 'Cuántas palabras puede probar cada jugador.', 'Reglas elegidas por el anfitrión', 'letras', 'intentos', {
    classic: ['Clásico', 'El duelo conocido y equilibrado.', '◆'], quick: ['Rápido', 'Corto y con tensión.', '⚡'], strategic: ['Estratégico', 'Más letras, más pistas.', '◎'], epic: ['Épico', 'Palabras largas y margen para luchar.', '✦'],
  }),
  ca: rulesCopy('Regles del duel', 'Lletres', 'Com més lletres, més deducció.', 'Intents', 'Quantes paraules pot provar cada jugador.', 'Regles triades per l’amfitrió', 'lletres', 'intents', {
    classic: ['Clàssic', 'El duel conegut i equilibrat.', '◆'], quick: ['Ràpid', 'Curt i amb tensió.', '⚡'], strategic: ['Estratègic', 'Més lletres, més pistes.', '◎'], epic: ['Èpic', 'Paraules llargues i marge per lluitar.', '✦'],
  }),
  fr: rulesCopy('Règles du duel', 'Lettres', 'Plus de lettres, plus de déduction.', 'Essais', 'Le nombre de mots que chaque joueur peut tenter.', 'Règles choisies par l’hôte', 'lettres', 'essais', {
    classic: ['Classique', 'Le duel familier et équilibré.', '◆'], quick: ['Rapide', 'Court et tendu.', '⚡'], strategic: ['Stratégique', 'Plus de lettres, plus d’indices.', '◎'], epic: ['Épique', 'Des mots longs et de la marge.', '✦'],
  }),
  de: rulesCopy('Duellregeln', 'Buchstaben', 'Mehr Buchstaben brauchen mehr Kombinationsgabe.', 'Versuche', 'So viele Wörter darf jeder Spieler probieren.', 'Vom Gastgeber gewählte Regeln', 'Buchstaben', 'Versuche', {
    classic: ['Klassisch', 'Das vertraute, ausgewogene Duell.', '◆'], quick: ['Schnell', 'Kurz und spannend.', '⚡'], strategic: ['Strategisch', 'Mehr Buchstaben, mehr Hinweise.', '◎'], epic: ['Episch', 'Lange Wörter mit mehr Spielraum.', '✦'],
  }),
};

export function DuelRulesCard({ compact = false, editable = false, interfaceLocale, onChange, rules, title }: DuelRulesCardProps) {
  const { colors } = useAppTheme();
  const copy = COPY[interfaceLocale];
  const selectedPreset = duelRulesPresetId(rules);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  function update(next: DuelRules) {
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.selectionAsync().catch(() => undefined);
    }
    onChange?.(next);
  }

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(220)}
      layout={reduceMotion ? undefined : LinearTransition.duration(180)}
      style={[styles.card, compact && styles.cardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title ?? copy.title}</Text>
          <Text style={[styles.summary, { color: colors.textMuted }]}>{copy.summary(rules)}</Text>
        </View>
        {!editable ? (
          <View style={[styles.lockedPill, { backgroundColor: colors.secondarySoft }]}>
            <Text style={[styles.lockedText, { color: colors.text }]}>{copy.locked}</Text>
          </View>
        ) : null}
      </View>

      {editable && !compact ? (
        <View accessibilityRole="radiogroup" style={styles.presetGrid}>
          {DUEL_RULES_PRESETS.map((preset) => {
            const selected = preset.id === selectedPreset;
            const content = copy.presets[preset.id];
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={preset.id}
                onPress={() => update(preset.rules)}
                style={({ pressed }) => [
                  styles.preset,
                  { backgroundColor: selected ? colors.secondarySoft : colors.background, borderColor: selected ? colors.secondary : colors.border },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.glyph}>{content.glyph}</Text>
                <View style={styles.presetText}>
                  <Text style={[styles.presetTitle, { color: colors.text }]}>{content.title}</Text>
                  <Text numberOfLines={2} style={[styles.presetDetail, { color: colors.textMuted }]}>{content.detail}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!compact ? (
        <>
          <RuleOption
            editable={editable}
            help={copy.wordLengthHelp}
            label={copy.wordLength}
            onSelect={(wordLength) => update({ ...rules, wordLength })}
            options={WORD_DUEL_WORD_LENGTHS}
            selected={rules.wordLength}
          />
          <RuleOption
            editable={editable}
            help={copy.attemptsHelp}
            label={copy.attempts}
            onSelect={(maxAttempts) => update({ ...rules, maxAttempts })}
            options={DUEL_ATTEMPT_OPTIONS}
            selected={rules.maxAttempts}
          />
        </>
      ) : null}
    </Animated.View>
  );
}

function RuleOption<T extends number>({ editable, help, label, onSelect, options, selected }: {
  editable: boolean;
  help: string;
  label: string;
  onSelect: (value: T) => void;
  options: readonly T[];
  selected: T;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.optionBlock}>
      <View style={styles.optionHeading}>
        <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.optionHelp, { color: colors.textMuted }]}>{help}</Text>
      </View>
      <View accessibilityRole="radiogroup" style={styles.segmentRow}>
        {options.map((option) => {
          const selectedOption = option === selected;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedOption, disabled: !editable }}
              disabled={!editable}
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.segment,
                { backgroundColor: selectedOption ? colors.accent : colors.background, borderColor: selectedOption ? colors.accent : colors.border },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.segmentText, { color: selectedOption ? colors.onAccent : colors.text }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function rulesCopy(
  title: string,
  wordLength: string,
  wordLengthHelp: string,
  attempts: string,
  attemptsHelp: string,
  locked: string,
  lettersUnit: string,
  attemptsUnit: string,
  presets: Record<DuelRulesPresetId, [string, string, string]>,
): RulesCopy {
  return {
    attempts,
    attemptsHelp,
    locked,
    presets: Object.fromEntries(Object.entries(presets).map(([id, [presetTitle, detail, glyph]]) => [id, { detail, glyph, title: presetTitle }])) as RulesCopy['presets'],
    summary: (rules) => `${rules.wordLength} ${lettersUnit} · ${rules.maxAttempts} ${attemptsUnit}`,
    title,
    wordLength,
    wordLengthHelp,
  };
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, gap: spacing.lg, padding: spacing.lg },
  cardCompact: { gap: spacing.sm, padding: spacing.md },
  headingRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  headingText: { flex: 1, gap: spacing.xs },
  title: { fontSize: typeScale.lead, fontWeight: '900' },
  summary: { fontSize: typeScale.small, fontWeight: '700' },
  lockedPill: { borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  lockedText: { fontSize: typeScale.tiny, fontWeight: '800' },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  preset: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flexBasis: '48%', flexDirection: 'row', flexGrow: 1, gap: spacing.sm, minHeight: 76, padding: spacing.md },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  glyph: { fontSize: 22 },
  presetText: { flex: 1, gap: 2 },
  presetTitle: { fontSize: typeScale.small, fontWeight: '900' },
  presetDetail: { fontSize: typeScale.tiny, lineHeight: 15 },
  optionBlock: { gap: spacing.sm },
  optionHeading: { gap: 2 },
  optionLabel: { fontSize: typeScale.body, fontWeight: '900' },
  optionHelp: { fontSize: typeScale.small, lineHeight: 18 },
  segmentRow: { flexDirection: 'row', gap: spacing.sm },
  segment: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center' },
  segmentText: { fontSize: typeScale.body, fontWeight: '900' },
});
