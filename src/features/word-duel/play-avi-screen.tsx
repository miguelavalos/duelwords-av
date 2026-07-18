import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { GameLanguage, GuessRejection, LocalWordDuelState } from '@/game/word-duel-engine';
import { WORD_DUEL_WORD_LENGTH } from '@/game/word-duel-engine';
import {
  createAviBotDuelSession,
  createAviBotDuelViewModel,
  normalizeAviBotInput,
  resolveAviBotRound,
  submitAviBotDuelGuess,
  type AviBotDuelStatus,
  type AviBotOpponentMarkerState,
  type AviBotReactionId,
} from '@/game/word-duel-bot/view-model';
import type { WordDuelResultOutcome, WordDuelResultReason } from '@/game/word-duel-result/view-model';
import { GAME_LANGUAGES, t } from '@/i18n/locales';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';
import { WordDuelBoard } from './components/word-duel-board';
import { WordDuelKeyboard, WORD_DUEL_KEY_ROWS } from './components/word-duel-keyboard';
import { fillEditingRow } from './components/word-duel-ui-model';
import {
  finalizeWordDuelResult,
  reportWordDuelResultFinalizationError,
} from './result-finalization';
import { buildWordDuelResultHandoffHref } from './word-duel-route-params';

type PlayAviScreenProps = {
  initialGameLanguage?: GameLanguage;
};

const REACTION_LABELS: Record<AviBotReactionId, string> = {
  gg: 'GG',
  nice: 'Nice',
  no_pressure: 'No pressure',
  tick_tock: 'Time',
  your_turn: 'Turn',
};

export function PlayAviScreen({ initialGameLanguage = 'en' }: PlayAviScreenProps) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compactViewport = width <= 480 && height <= 900;
  const styles = usePlayAviStyles();
  const isOpeningResultRef = useRef(false);
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(initialGameLanguage);
  const [gameSeed, setGameSeed] = useState(0);
  const [input, setInput] = useState('');
  const [isOpeningResult, setIsOpeningResult] = useState(false);
  const [message, setMessage] = useState('');
  const [activeReaction, setActiveReaction] = useState<AviBotReactionId | null>(null);
  const [session, setSession] = useState(() =>
    createAviBotDuelSession({
      gameLanguage: initialGameLanguage,
      gameSeed: 0,
      nowMs: Date.now(),
    }),
  );
  const viewModel = createAviBotDuelViewModel(session);
  const boardRows = fillEditingRow(viewModel.ownBoardRows, input);
  const boardWidth = Math.min(width - spacing.lg * 2, 338);
  const regularTileSize = Math.max(34, Math.min(44, Math.floor((boardWidth - spacing.sm * 4) / viewModel.wordLength)));
  const tileSize = compactViewport ? Math.min(38, regularTileSize) : regularTileSize;

  function reset(language: GameLanguage, seed: number) {
    setGameLanguage(language);
    setGameSeed(seed);
    setSession(
      createAviBotDuelSession({
        gameLanguage: language,
        gameSeed: seed,
        nowMs: Date.now(),
      }),
    );
    setActiveReaction(null);
    setInput('');
    isOpeningResultRef.current = false;
    setIsOpeningResult(false);
    setMessage('');
  }

  function changeLanguage(language: GameLanguage) {
    reset(language, gameSeed);
  }

  function newChallenge() {
    reset(gameLanguage, gameSeed + 1);
  }

  function handleKey(key: string) {
    if (!viewModel.isInputOpen) {
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

    const normalizedKey = normalizeAviBotInput(key, gameLanguage);
    if (!normalizedKey) {
      return;
    }

    setInput((current) => `${current}${normalizedKey}`);
    setMessage('');
  }

  function submit() {
    const result = submitAviBotDuelGuess({
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
    setMessage('Waiting for Avi');
  }

  function resolveRound() {
    setSession((current) => resolveAviBotRound({ nowMs: Date.now(), session: current }));
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
      const outcome = botResultOutcome(viewModel.status);
      const reason = botResultReason(viewModel.status);
      const handoff = await finalizeWordDuelResult({
        gameLanguage: viewModel.gameLanguage,
        opponent: {
          guesses: session.botState.guesses,
          safeDisplayName: 'Avi',
          side: 'b',
          solved: didLocalStateSolve(session.botState),
        },
        outcome,
        own: {
          guesses: session.humanState.guesses,
          side: 'a',
          solved: didLocalStateSolve(session.humanState),
        },
        resultReason: reason,
        targetDisplayWord: session.target.displayWord,
      }, { mode: 'bot_duel' });

      router.push(buildWordDuelResultHandoffHref({
        gameLanguage: viewModel.gameLanguage,
        mode: 'bot_duel',
        outcome,
        reason,
        ...handoff,
      }));
    } catch (error) {
      reportWordDuelResultFinalizationError({
        error,
        gameLanguage: viewModel.gameLanguage,
        mode: 'bot_duel',
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
      bottomInset={compactViewport ? spacing.sm : spacing.xxl}
      contentGap={compactViewport ? spacing.sm : spacing.md}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Local bot preview</Text>
          <Text style={styles.title}>Play Avi</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>
          Close
        </AppButton>
      </View>

      <View style={styles.languageRow}>
        {GAME_LANGUAGES.map((language) => {
          const selected = language.code === gameLanguage;
          return (
            <Pressable
              key={language.code}
              accessibilityRole="button"
              onPress={() => changeLanguage(language.code)}
              style={[styles.languageButton, selected && styles.languageButtonSelected]}>
              <Text style={[styles.languageText, selected && styles.languageTextSelected]}>
                {language.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.timerRow}>
        <View>
          <Text style={styles.metaLabel}>Round</Text>
          <Text style={styles.metaValue}>
            {viewModel.roundNumber}/{viewModel.maxAttempts}
          </Text>
        </View>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>{viewModel.remainingSeconds}s</Text>
        </View>
        <View style={styles.sideBlock}>
          <Text style={styles.metaLabel}>{t('en', 'gameLanguage')}</Text>
          <Text style={styles.metaValue}>{viewModel.gameLanguage.toUpperCase()}</Text>
        </View>
      </View>

      <OpponentSummary
        activeReaction={activeReaction}
        markers={viewModel.opponent.attemptMarkers}
        roundState={viewModel.opponent.roundState}
      />

      <WordDuelBoard
        accessibilityLabel="Play Avi local board"
        density={compactViewport ? 'compact' : 'regular'}
        rows={boardRows}
        tileSize={tileSize}
      />

      <View style={styles.stateRow}>
        <Text style={styles.stateLabel}>{stateLabel(viewModel.phase, viewModel.status)}</Text>
        <Text style={styles.stateDetail}>{message || detailLabel(viewModel.phase, viewModel.status)}</Text>
      </View>

      {viewModel.canResolveRound ? (
        <AppButton onPress={resolveRound}>Avi submits</AppButton>
      ) : null}

      {viewModel.targetReveal.visible && viewModel.targetReveal.displayWord ? (
        <View style={styles.resultLine}>
          <Text style={styles.resultLabel}>{resultLabel(viewModel.status)}</Text>
          <Text style={styles.resultTarget}>{viewModel.targetReveal.displayWord}</Text>
        </View>
      ) : null}

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

      {viewModel.status !== 'active' ? (
        <View style={styles.actionRow}>
          <AppButton
            disabled={isOpeningResult}
            onPress={() => {
              void openResult();
            }}
            style={styles.actionButton}>
            {isOpeningResult ? 'Opening...' : 'Open result'}
          </AppButton>
          <AppButton onPress={newChallenge} style={styles.actionButton}>
            New challenge
          </AppButton>
          <AppButton tone="quiet" onPress={() => router.push('/')} style={styles.actionButton}>
            Home
          </AppButton>
        </View>
      ) : null}

      <ReactionTray
        activeReaction={activeReaction}
        compact={compactViewport}
        onReactionPress={(reaction) => setActiveReaction(reaction)}
        reactions={viewModel.availableReactions}
      />

      <WordDuelKeyboard
        density={compactViewport ? 'compact' : 'regular'}
        disabled={!viewModel.isInputOpen}
        feedbackByKey={viewModel.ownKeyboardFeedback}
        keyRows={WORD_DUEL_KEY_ROWS[viewModel.gameLanguage]}
        onKeyPress={handleKey}
      />
    </AppScreen>
  );
}

function OpponentSummary({
  activeReaction,
  markers,
  roundState,
}: {
  activeReaction: AviBotReactionId | null;
  markers: readonly AviBotOpponentMarkerState[];
  roundState: AviBotOpponentMarkerState;
}) {
  const styles = usePlayAviStyles();
  return (
    <View style={styles.opponentStrip}>
      <View style={styles.opponentTopRow}>
        <View>
          <Text style={styles.metaLabel}>Opponent</Text>
          <Text style={styles.opponentName}>Avi · Bot Normal</Text>
        </View>
        <View style={styles.presencePill}>
          <Text style={styles.presenceText}>{opponentStateLabel(roundState)}</Text>
        </View>
      </View>
      <View style={styles.markerRow}>
        {markers.map((marker, index) => (
          <View key={`avi-marker-${index}`} style={[styles.marker, markerStyle(marker, styles)]}>
            <Text style={styles.markerText}>{markerLabel(marker)}</Text>
          </View>
        ))}
      </View>
      {activeReaction ? (
        <View style={styles.reactionBubble}>
          <Text style={styles.reactionBubbleText}>{REACTION_LABELS[activeReaction]}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReactionTray({
  activeReaction,
  compact,
  onReactionPress,
  reactions,
}: {
  activeReaction: AviBotReactionId | null;
  compact: boolean;
  onReactionPress: (reaction: AviBotReactionId) => void;
  reactions: readonly AviBotReactionId[];
}) {
  const styles = usePlayAviStyles();
  return (
    <View style={[styles.reactions, compact && styles.reactionsCompact]}>
      {reactions.map((reaction) => {
        const selected = activeReaction === reaction;
        return (
          <Pressable
            key={reaction}
            accessibilityRole="button"
            onPress={() => onReactionPress(reaction)}
            style={[
              styles.reactionButton,
              compact && styles.reactionButtonCompact,
              selected && styles.reactionButtonSelected,
            ]}>
            <Text
              style={[
                styles.reactionText,
                compact && styles.reactionTextCompact,
                selected && styles.reactionTextSelected,
              ]}>
              {REACTION_LABELS[reaction]}
            </Text>
          </Pressable>
        );
      })}
    </View>
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
    return 'Round locked';
  }
  return t('en', 'invalidWord');
}

function markerLabel(marker: AviBotOpponentMarkerState): string {
  if (marker === 'solved') {
    return '=';
  }
  if (marker === 'submitted') {
    return '•';
  }
  if (marker === 'technical_error') {
    return '!';
  }
  if (marker === 'failed') {
    return 'x';
  }
  return '';
}

function markerStyle(marker: AviBotOpponentMarkerState, styles: ReturnType<typeof usePlayAviStyles>) {
  if (marker === 'solved') {
    return styles.markerSolved;
  }
  if (marker === 'failed') {
    return styles.markerFailed;
  }
  if (marker === 'submitted') {
    return styles.markerSubmitted;
  }
  if (marker === 'technical_error') {
    return styles.markerTechnical;
  }
  return styles.markerWaiting;
}

function opponentStateLabel(state: AviBotOpponentMarkerState): string {
  if (state === 'solved') {
    return 'Solved';
  }
  if (state === 'failed') {
    return 'Done';
  }
  if (state === 'submitted') {
    return 'Submitted';
  }
  if (state === 'technical_error') {
    return 'Issue';
  }
  return 'Thinking';
}

function stateLabel(phase: string, status: string): string {
  if (status !== 'active') {
    return resultLabel(status);
  }
  if (phase === 'waiting_for_avi') {
    return 'Submitted';
  }
  return 'Your turn';
}

function detailLabel(phase: string, status: string): string {
  if (status !== 'active') {
    return 'Result ready';
  }
  if (phase === 'waiting_for_avi') {
    return 'Avi is thinking';
  }
  return 'Bot duel';
}

function resultLabel(status: string): string {
  if (status === 'won') {
    return 'Won';
  }
  if (status === 'lost') {
    return 'Lost';
  }
  if (status === 'draw') {
    return 'Draw';
  }
  if (status === 'technical_error_bot') {
    return 'Unavailable';
  }
  return 'No winner';
}

function botResultOutcome(status: AviBotDuelStatus): WordDuelResultOutcome {
  if (status === 'won') {
    return 'win';
  }
  if (status === 'lost') {
    return 'loss';
  }
  if (status === 'draw') {
    return 'draw';
  }
  if (status === 'technical_error_bot') {
    return 'technical';
  }
  return 'no_winner';
}

function botResultReason(status: AviBotDuelStatus): WordDuelResultReason {
  if (status === 'technical_error_bot') {
    return 'technical_result';
  }
  if (status === 'no_winner') {
    return 'attempts_exhausted';
  }
  return 'solved';
}

function didLocalStateSolve(state: LocalWordDuelState): boolean {
  return state.status === 'won';
}

function usePlayAviStyles() {
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
  timerRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerPill: {
    minWidth: 76,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.pressureSoft,
  },
  timerText: {
    color: colors.pressure,
    fontSize: typeScale.lead,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  sideBlock: {
    alignItems: 'flex-end',
  },
  opponentStrip: {
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  opponentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  opponentName: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  presencePill: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
  },
  presenceText: {
    color: colors.accent,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  markerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  marker: {
    flex: 1,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  markerWaiting: {
    borderColor: colors.border,
    backgroundColor: colors.feedbackPending,
  },
  markerSubmitted: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  markerSolved: {
    borderColor: colors.feedbackExact,
    backgroundColor: colors.feedbackExact,
  },
  markerFailed: {
    borderColor: colors.feedbackAbsent,
    backgroundColor: colors.feedbackAbsent,
  },
  markerTechnical: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  markerText: {
    color: colors.onAccent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
  },
  reactionBubble: {
    alignSelf: 'flex-start',
    borderRadius: radii.md,
    backgroundColor: colors.pressureSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  reactionBubbleText: {
    color: colors.pressure,
    fontWeight: '900',
  },
  stateRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
  },
  stateLabel: {
    color: colors.text,
    fontWeight: '900',
  },
  stateDetail: {
    color: colors.textMuted,
    fontWeight: '800',
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
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reactionsCompact: {
    flexWrap: 'nowrap',
    gap: spacing.xs,
  },
  reactionButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  reactionButtonCompact: {
    flexGrow: 1,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
  },
  reactionButtonSelected: {
    borderColor: colors.pressure,
    backgroundColor: colors.pressureSoft,
  },
  reactionText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  reactionTextCompact: {
    fontSize: typeScale.tiny,
  },
  reactionTextSelected: {
    color: colors.pressure,
  },
  }), [colors]);
}
