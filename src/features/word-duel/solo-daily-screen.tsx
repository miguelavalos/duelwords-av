import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { GameLanguage, GuessRejection } from '@/game/word-duel-engine';
import { getLocalTargetCount } from '@/game/dictionaries/local-fixtures';
import {
  advanceTargetSelection,
  commitTargetSelection,
  planTargetSelection,
  type TargetRotationSelection,
} from '@/game/dictionaries/target-rotation';
import {
  WORD_DUEL_WORD_LENGTH,
} from '@/game/word-duel-engine';
import {
  applySoloDailyGuess,
  createSoloDailySession,
  createSoloDailyViewModel,
  normalizeSoloDailyInput,
  type WordDuelSoloDailyMode,
} from '@/game/word-duel-solo-daily/view-model';
import { t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
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

type WordDuelSoloDailyScreenProps = {
  initialGameLanguage?: GameLanguage;
  initialMode?: WordDuelSoloDailyMode;
};

export function WordDuelSoloDailyScreen({
  initialGameLanguage = 'en',
  initialMode = 'solo_practice',
}: WordDuelSoloDailyScreenProps) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compactViewport = width <= 480 && height <= 900;
  const [{ interfaceLocale }] = useAppPreferences();
  const styles = useSoloDailyStyles();
  const isOpeningResultRef = useRef(false);
  const [targetSelection, setTargetSelection] = useState(() =>
    planTargetSelection({
      language: initialGameLanguage,
      mode: 'solo_practice',
      targetCount: getLocalTargetCount(initialGameLanguage),
    }));
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(initialGameLanguage);
  const [mode, setMode] = useState<WordDuelSoloDailyMode>(initialMode);
  const [session, setSession] = useState(() =>
    createSoloDailySession({
      gameLanguage: initialGameLanguage,
      mode: initialMode,
      nowMs: Date.now(),
      seed: initialMode === 'solo_practice' ? targetSelection.index : 0,
    }),
  );
  const [input, setInput] = useState('');
  const [isOpeningResult, setIsOpeningResult] = useState(false);
  const [message, setMessage] = useState('');

  const viewModel = createSoloDailyViewModel(session);
  const rows = createRowsFromLocalWordDuelState(session.state, input);
  const keyFeedback = createKeyboardFeedbackFromGuesses(session.state.guesses);
  const boardWidth = Math.min(width - spacing.lg * 2, 340);
  const regularTileSize = Math.max(42, Math.min(56, Math.floor((boardWidth - spacing.sm * 4) / 5)));
  const tileSize = compactViewport ? Math.min(46, regularTileSize) : regularTileSize;

  useEffect(() => {
    if (mode === 'solo_practice') commitTargetSelection(targetSelection);
  }, [mode, targetSelection]);

  function reset(
    nextMode: WordDuelSoloDailyMode,
    nextLanguage: GameLanguage,
    selection: TargetRotationSelection,
  ) {
    setGameLanguage(nextLanguage);
    setMode(nextMode);
    setTargetSelection(selection);
    setSession(
      createSoloDailySession({
        gameLanguage: nextLanguage,
        mode: nextMode,
        nowMs: Date.now(),
        seed: nextMode === 'solo_practice' ? selection.index : 0,
      }),
    );
    setInput('');
    isOpeningResultRef.current = false;
    setIsOpeningResult(false);
    setMessage('');
  }

  function changeMode(nextMode: WordDuelSoloDailyMode) {
    const selection = nextMode === 'solo_practice'
      ? planTargetSelection({
          language: gameLanguage,
          mode: 'solo_practice',
          targetCount: getLocalTargetCount(gameLanguage),
        })
      : targetSelection;
    reset(nextMode, gameLanguage, selection);
  }

  function changeLanguage(language: GameLanguage) {
    const selection = mode === 'solo_practice'
      ? planTargetSelection({
          language,
          mode: 'solo_practice',
          targetCount: getLocalTargetCount(language),
        })
      : targetSelection;
    reset(mode, language, selection);
  }

  function newSoloGame() {
    reset('solo_practice', gameLanguage, advanceTargetSelection(targetSelection));
  }

  function handleKey(key: string) {
    if (session.state.status !== 'playing') {
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

    const normalizedKey = normalizeSoloDailyInput(key, session.state.language);
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
    const result = applySoloDailyGuess({
      input,
      nowMs: Date.now(),
      session,
    });

    if (!result.accepted) {
      setMessage(rejectionMessage(result.rejection));
      return;
    }

    setSession(result.session);
    setInput('');
    setMessage('');
  }

  function openResult() {
    if (isOpeningResultRef.current) {
      return;
    }

    isOpeningResultRef.current = true;
    setIsOpeningResult(true);
    setMessage('');

    const outcome = viewModel.status === 'won' ? 'win' : 'no_winner';
    const reason = viewModel.status === 'won' ? 'solved' : 'attempts_exhausted';
    void finalizeWordDuelResult({
        gameLanguage: viewModel.gameLanguage,
        outcome,
        own: {
          guesses: session.state.guesses,
          solved: viewModel.status === 'won',
        },
        resultReason: reason,
        targetDisplayWord: session.target.displayWord,
      }, { mode: viewModel.mode })
      .then((handoff) => {
        router.push(buildWordDuelResultHandoffHref({
        gameLanguage: viewModel.gameLanguage,
        mode: viewModel.mode,
        outcome,
        reason,
        ...handoff,
        }));
      })
      .catch((error: unknown) => {
        reportWordDuelResultFinalizationError({
          error,
          gameLanguage: viewModel.gameLanguage,
          mode: viewModel.mode,
          routeGroup: 'play',
        });
        setMessage('Could not open result');
      })
      .finally(() => {
        isOpeningResultRef.current = false;
        setIsOpeningResult(false);
      });
  }

  return (
    <AppScreen
      bottomInset={compactViewport ? spacing.md : spacing.xxl}
      contentGap={compactViewport ? spacing.md : spacing.lg}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{viewModel.isLocalPreviewOnly ? 'Local preview' : ''}</Text>
          <Text style={styles.title}>Solo / Daily</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>
          Close
        </AppButton>
      </View>

      <View style={styles.modeRow}>
        <SegmentButton
          label="Solo"
          selected={mode === 'solo_practice'}
          onPress={() => changeMode('solo_practice')}
        />
        <SegmentButton
          label="Daily preview"
          selected={mode === 'daily_preview'}
          onPress={() => changeMode('daily_preview')}
        />
      </View>

      <GameLanguagePicker
        dismissLabel={t(interfaceLocale, 'done')}
        label={t(interfaceLocale, 'gameLanguage')}
        onChange={changeLanguage}
        value={gameLanguage}
      />

      <View style={styles.statusRow}>
        <View>
          <Text style={styles.statusLabel}>{viewModel.modeLabel}</Text>
          <Text style={styles.statusValue}>
            {viewModel.attemptsUsed}/{viewModel.maxAttempts}
          </Text>
        </View>
        <View style={styles.statusRight}>
          <Text style={styles.statusLabel}>
            {viewModel.dailyDate ? viewModel.dailyDate : t('en', 'gameLanguage')}
          </Text>
          <Text style={styles.statusValue}>{viewModel.gameLanguage.toUpperCase()}</Text>
        </View>
      </View>

      <WordDuelBoard
        accessibilityLabel="Solo Daily local board"
        density={compactViewport ? 'compact' : 'regular'}
        rows={rows}
        tileSize={tileSize}
      />

      <View style={[styles.messageArea, compactViewport && styles.messageAreaCompact]}>
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
        {viewModel.status === 'won' && viewModel.targetReveal.displayWord ? (
          <ResultLine label={t('en', 'won')} target={viewModel.targetReveal.displayWord} />
        ) : null}
        {viewModel.status === 'lost' && viewModel.targetReveal.displayWord ? (
          <ResultLine label={t('en', 'lost')} target={viewModel.targetReveal.displayWord} />
        ) : null}
      </View>

      {viewModel.safeSharePreview ? (
        <View style={styles.shareBox}>
          <Text style={styles.shareTitle}>{viewModel.safeSharePreview.ctaLabel}</Text>
          <Text selectable style={styles.shareText}>
            {viewModel.safeSharePreview.text}
          </Text>
        </View>
      ) : null}

      {viewModel.adSlot.visible ? (
        <View style={styles.adSlot}>
          <Text style={styles.adLabel}>Ad preview</Text>
          <Text style={styles.adText}>Post-result slot</Text>
        </View>
      ) : null}

      {viewModel.status !== 'playing' ? (
        <View style={styles.actionRow}>
          <AppButton
            disabled={isOpeningResult}
            onPress={() => {
              void openResult();
            }}
            style={styles.actionButton}>
            {isOpeningResult ? 'Opening...' : 'Open result'}
          </AppButton>
          <AppButton onPress={newSoloGame} style={styles.actionButton}>
            Practice again
          </AppButton>
          <AppButton tone="quiet" onPress={() => changeMode('daily_preview')} style={styles.actionButton}>
            Daily today
          </AppButton>
        </View>
      ) : null}

      <WordDuelKeyboard
        density={compactViewport ? 'compact' : 'regular'}
        disabled={session.state.status !== 'playing'}
        feedbackByKey={keyFeedback}
        keyRows={WORD_DUEL_KEY_ROWS[session.state.language]}
        onKeyPress={handleKey}
      />
    </AppScreen>
  );
}

function SegmentButton({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const styles = useSoloDailyStyles();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}>
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
  );
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
  const styles = useSoloDailyStyles();
  return (
    <View style={styles.resultLine}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultTarget}>{target}</Text>
    </View>
  );
}

function useSoloDailyStyles() {
  const { colors } = useAppTheme();
  return StyleSheet.create({
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
  modeRow: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: colors.surfaceSoft,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  segmentTextSelected: {
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
  shareBox: {
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  shareTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  shareText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
  adSlot: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    gap: spacing.xs,
  },
  adLabel: {
    color: colors.text,
    fontSize: typeScale.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  adText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '700',
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
  });
}
