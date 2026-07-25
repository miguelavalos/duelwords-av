import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getLocalDictionary, getLocalTargetCount, getPracticeTarget } from '@/game/dictionaries/local-fixtures';
import {
  advanceTargetSelection,
  commitTargetSelection,
  planTargetSelection,
  type TargetRotationSelection,
} from '@/game/dictionaries/target-rotation';
import {
  applyGuess,
  createLocalGame,
  createLocalPracticeSummary,
  normalizeGuess,
  type GameLanguage,
  type GuessRejection,
  type LocalWordDuelState,
  WORD_DUEL_WORD_LENGTH,
} from '@/game/word-duel-engine';
import { experienceCopy } from '@/i18n/experience-copy';
import { t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow } from '@/ui/brand';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';
import { WordDuelBoard } from './components/word-duel-board';
import { GameLanguagePicker } from './components/game-language-picker';
import { WordDuelKeyboard, WORD_DUEL_KEY_ROWS } from './components/word-duel-keyboard';
import {
  createKeyboardFeedbackFromGuesses,
  createRowsFromLocalWordDuelState,
} from './components/word-duel-ui-model';
import {
  finalizeWordDuelResult,
  reportWordDuelResultFinalizationError,
} from './result-finalization';
import { buildWordDuelResultHandoffHref } from './word-duel-route-params';

type WordDuelPracticeScreenProps = {
  initialGameLanguage?: GameLanguage;
};

export function WordDuelPracticeScreen({ initialGameLanguage = 'en' }: WordDuelPracticeScreenProps) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compactViewport = width <= 480 && height <= 900;
  const [{ interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const styles = usePracticeStyles();
  const isOpeningResultRef = useRef(false);
  const [targetSelection, setTargetSelection] = useState(() =>
    planTargetSelection({
      language: initialGameLanguage,
      mode: 'practice',
      targetCount: getLocalTargetCount(initialGameLanguage),
    }));
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(initialGameLanguage);
  const [gameState, setGameState] = useState(() => buildGame(initialGameLanguage, targetSelection.index));
  const [input, setInput] = useState('');
  const [isOpeningResult, setIsOpeningResult] = useState(false);
  const [message, setMessage] = useState('');

  const dictionary = useMemo(() => getLocalDictionary(gameState.language), [gameState.language]);
  const targetEntry = getPracticeTarget(gameState.language, targetSelection.index);
  const summary = createLocalPracticeSummary(gameState);
  const rows = createRowsFromLocalWordDuelState(gameState, input);
  const keyFeedback = createKeyboardFeedbackFromGuesses(gameState.guesses);
  const boardWidth = Math.min(width - spacing.lg * 2, 340);
  const regularTileSize = Math.max(42, Math.min(56, Math.floor((boardWidth - spacing.sm * 4) / 5)));
  const tileSize = compactViewport ? Math.min(46, regularTileSize) : regularTileSize;

  useEffect(() => {
    commitTargetSelection(targetSelection);
  }, [targetSelection]);

  function reset(selection: TargetRotationSelection) {
    setGameLanguage(selection.language);
    setTargetSelection(selection);
    setGameState(buildGame(selection.language, selection.index));
    setInput('');
    isOpeningResultRef.current = false;
    setIsOpeningResult(false);
    setMessage('');
  }

  function handleKey(key: string) {
    if (gameState.status !== 'playing') {
      return;
    }

    if (key === 'DEL') {
      setInput((current) => Array.from(current).slice(0, -1).join(''));
      setMessage('');
      return;
    }

    if (key === 'ENTER') {
      submit();
      return;
    }

    const normalizedKey = normalizeGuess(key, gameState.language);
    if (!normalizedKey) {
      return;
    }

    setInput((current) => {
      if (Array.from(current).length >= WORD_DUEL_WORD_LENGTH) return current;
      return `${current}${normalizedKey}`;
    });
    setMessage('');
  }

  function submit() {
    const result = applyGuess(gameState, input, dictionary);

    if (!result.accepted) {
      setMessage(rejectionMessage(result.rejection, interfaceLocale));
      return;
    }

    setGameState(result.state);
    setInput('');
    setMessage('');
  }

  async function openResult() {
    if (isOpeningResultRef.current) {
      return;
    }

    isOpeningResultRef.current = true;
    setIsOpeningResult(true);
    setMessage('');

    try {
      const outcome = gameState.status === 'won' ? 'win' : 'no_winner';
      const reason = gameState.status === 'won' ? 'solved' : 'attempts_exhausted';
      const handoff = await finalizeWordDuelResult({
        gameLanguage: gameState.language,
        outcome,
        own: {
          guesses: gameState.guesses,
          solved: gameState.status === 'won',
        },
        resultReason: reason,
        targetDisplayWord: targetEntry.displayWord,
      }, { mode: 'practice' });

      router.push(buildWordDuelResultHandoffHref({
        gameLanguage: gameState.language,
        mode: 'practice',
        outcome,
        reason,
        ...handoff,
      }));
    } catch (error) {
      reportWordDuelResultFinalizationError({
        error,
        gameLanguage: gameState.language,
        mode: 'practice',
        routeGroup: 'play',
      });
      setMessage('Could not open result');
    } finally {
      isOpeningResultRef.current = false;
      setIsOpeningResult(false);
    }
  }

  return (
    <AppScreen
      bottomInset={compactViewport ? spacing.md : spacing.xxl}
      contentGap={compactViewport ? spacing.md : spacing.lg}>
      <View style={styles.header}>
        <View>
          <InkEyebrow>{t(interfaceLocale, 'localOnly')}</InkEyebrow>
          <Text accessibilityRole="header" aria-level={1} style={styles.title}>{copy.practice}</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>
          {t(interfaceLocale, 'done')}
        </AppButton>
      </View>

      <GameLanguagePicker
        dismissLabel={t(interfaceLocale, 'done')}
        label={`${copy.gameSettings} · ${copy.gameLanguage}`}
        onChange={(language) => reset(planTargetSelection({
          language,
          mode: 'practice',
          targetCount: getLocalTargetCount(language),
        }))}
        value={gameLanguage}
      />

      <View style={styles.statusRow}>
        <View>
          <Text style={styles.statusLabel}>{t(interfaceLocale, 'attempts')}</Text>
          <Text style={styles.statusValue}>
            {summary.attemptsUsed}/{summary.maxAttempts}
          </Text>
        </View>
        <View style={styles.aviStatus}>
          <AviArtwork size={42} />
          <View style={styles.statusRight}>
            <Text style={styles.statusLabel}>{copy.avi}</Text>
            <Text style={styles.aviNote}>{copy.practiceDetail}</Text>
          </View>
        </View>
      </View>

      <WordDuelBoard
        accessibilityLabel="Local Word Duel board"
        density={compactViewport ? 'compact' : 'regular'}
        rows={rows}
        tileSize={tileSize}
      />

      <View style={[styles.messageArea, compactViewport && styles.messageAreaCompact]}>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
        {gameState.status === 'won' ? (
          <ResultLine label={t(interfaceLocale, 'won')} target={targetEntry.displayWord} />
        ) : null}
        {gameState.status === 'lost' ? (
          <ResultLine label={t(interfaceLocale, 'lost')} target={targetEntry.displayWord} />
        ) : null}
      </View>

      {gameState.status !== 'playing' ? (
        <View style={styles.actionRow}>
          <AppButton
            disabled={isOpeningResult}
            onPress={() => {
              void openResult();
            }}
            style={styles.actionButton}>
            {isOpeningResult ? 'Opening...' : 'Open result'}
          </AppButton>
          <AppButton onPress={() => reset(advanceTargetSelection(targetSelection))} style={styles.actionButton}>
            {t(interfaceLocale, 'newGame')}
          </AppButton>
        </View>
      ) : null}

      <WordDuelKeyboard
        density={compactViewport ? 'compact' : 'regular'}
        disabled={gameState.status !== 'playing'}
        feedbackByKey={keyFeedback}
        keyRows={WORD_DUEL_KEY_ROWS[gameState.language]}
        onKeyPress={handleKey}
      />
    </AppScreen>
  );
}

function buildGame(language: GameLanguage, index: number): LocalWordDuelState {
  const target = getPracticeTarget(language, index);
  return createLocalGame({
    dictionary: getLocalDictionary(language),
    language,
    target: target.displayWord,
  });
}

function rejectionMessage(rejection: GuessRejection, locale: Parameters<typeof t>[0]): string {
  if (rejection === 'not_enough_letters') {
    return t(locale, 'notEnoughLetters');
  }
  if (rejection === 'too_many_letters') {
    return t(locale, 'tooManyLetters');
  }
  if (rejection === 'game_over') {
    return 'This local game is finished';
  }
  return t(locale, 'invalidWord');
}

function ResultLine({ label, target }: { label: string; target: string }) {
  const styles = usePracticeStyles();
  return (
    <View style={styles.resultLine}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultTarget}>{target.toUpperCase()}</Text>
    </View>
  );
}

function usePracticeStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '900',
  },
  statusRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  statusRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  aviStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  aviNote: {
    maxWidth: 160,
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '700',
    textAlign: 'right',
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusValue: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  messageArea: {
    minHeight: 42,
    justifyContent: 'center',
  },
  messageAreaCompact: {
    minHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: typeScale.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultLine: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
  },
  resultLabel: {
    color: colors.text,
    fontWeight: '900',
  },
  resultTarget: {
    color: colors.accent,
    fontWeight: '900',
    letterSpacing: 0,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexBasis: 112,
    flexGrow: 1,
  },
  }), [colors]);
}
