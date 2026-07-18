import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getLocalDictionary, getPracticeTarget } from '@/game/dictionaries/local-fixtures';
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
import { GAME_LANGUAGES, t } from '@/i18n/locales';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';
import { WordDuelBoard } from './components/word-duel-board';
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
  const styles = usePracticeStyles();
  const { width } = useWindowDimensions();
  const isOpeningResultRef = useRef(false);
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(initialGameLanguage);
  const [gameIndex, setGameIndex] = useState(0);
  const [gameState, setGameState] = useState(() => buildGame(initialGameLanguage, 0));
  const [input, setInput] = useState('');
  const [isOpeningResult, setIsOpeningResult] = useState(false);
  const [message, setMessage] = useState('');

  const dictionary = useMemo(() => getLocalDictionary(gameState.language), [gameState.language]);
  const targetEntry = getPracticeTarget(gameState.language, gameIndex);
  const summary = createLocalPracticeSummary(gameState);
  const rows = createRowsFromLocalWordDuelState(gameState, input);
  const keyFeedback = createKeyboardFeedbackFromGuesses(gameState.guesses);
  const boardWidth = Math.min(width - spacing.lg * 2, 340);
  const tileSize = Math.max(42, Math.min(56, Math.floor((boardWidth - spacing.sm * 4) / 5)));

  function reset(language = gameLanguage, index = gameIndex) {
    setGameLanguage(language);
    setGameIndex(index);
    setGameState(buildGame(language, index));
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

    if (Array.from(input).length >= WORD_DUEL_WORD_LENGTH) {
      return;
    }

    const normalizedKey = normalizeGuess(key, gameState.language);
    if (!normalizedKey) {
      return;
    }

    setInput((current) => `${current}${normalizedKey}`);
    setMessage('');
  }

  function submit() {
    const result = applyGuess(gameState, input, dictionary);

    if (!result.accepted) {
      setMessage(rejectionMessage(result.rejection));
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
    <AppScreen bottomInset={spacing.xxl}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{t('en', 'localOnly')}</Text>
          <Text style={styles.title}>{t('en', 'wordDuel')}</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>
          Play
        </AppButton>
      </View>

      <View style={styles.languageRow}>
        {GAME_LANGUAGES.map((language) => {
          const selected = language.code === gameLanguage;
          return (
            <Pressable
              key={language.code}
              accessibilityRole="button"
              onPress={() => reset(language.code, 0)}
              style={[styles.languageButton, selected && styles.languageButtonSelected]}>
              <Text style={[styles.languageText, selected && styles.languageTextSelected]}>
                {language.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statusRow}>
        <View>
          <Text style={styles.statusLabel}>{t('en', 'attempts')}</Text>
          <Text style={styles.statusValue}>
            {summary.attemptsUsed}/{summary.maxAttempts}
          </Text>
        </View>
        <View style={styles.statusRight}>
          <Text style={styles.statusLabel}>Language</Text>
          <Text style={styles.statusValue}>{gameState.language.toUpperCase()}</Text>
        </View>
      </View>

      <WordDuelBoard accessibilityLabel="Local Word Duel board" rows={rows} tileSize={tileSize} />

      <View style={styles.messageArea}>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
        {gameState.status === 'won' ? (
          <ResultLine label={t('en', 'won')} target={targetEntry.displayWord} />
        ) : null}
        {gameState.status === 'lost' ? (
          <ResultLine label={t('en', 'lost')} target={targetEntry.displayWord} />
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
          <AppButton onPress={() => reset(gameLanguage, gameIndex + 1)} style={styles.actionButton}>
            {t('en', 'newGame')}
          </AppButton>
        </View>
      ) : null}

      <WordDuelKeyboard
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

function rejectionMessage(rejection: GuessRejection): string {
  if (rejection === 'not_enough_letters') {
    return t('en', 'notEnoughLetters');
  }
  if (rejection === 'too_many_letters') {
    return t('en', 'tooManyLetters');
  }
  if (rejection === 'game_over') {
    return 'This local game is finished';
  }
  return t('en', 'invalidWord');
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
  kicker: {
    color: colors.accent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typeScale.title,
    fontWeight: '900',
  },
  languageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  languageButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceSoft,
  },
  languageText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  languageTextSelected: {
    color: colors.accent,
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
    alignItems: 'flex-end',
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
