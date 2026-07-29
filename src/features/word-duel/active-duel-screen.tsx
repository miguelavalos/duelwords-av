import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
import { DuelWordsClientError } from '@/game/word-duel-active/api-adapter';
import {
  createWordDuelActiveController,
  type WordDuelActiveController,
} from '@/game/word-duel-active/controller';
import {
  createWordDuelActiveDemoHandoff,
  type WordDuelActiveHandoff,
} from '@/game/word-duel-active/handoff';
import { startActiveDuelPresenceHeartbeat } from '@/game/word-duel-active/presence-heartbeat';
import {
  applyRealtimeProjectionToActiveDuelViewModel,
  latestActiveDuelReactionFromRealtimeProjection,
  type DuelWordsRealtimeRoomStatus,
} from '@/game/word-duel-active/realtime-projection';
import {
  isActiveDuelInputOpen,
  shouldReportActiveDuelTimeoutFailure,
  updateActiveDuelEditingLetters,
  type ActiveDuelOpponentMarkerState,
  type ActiveDuelReactionId,
  type ActiveDuelViewModel,
} from '@/game/word-duel-active/view-model';
import type { DuelWordsApiFinalResult } from '@/game/word-duel-lobby/api-client';
import type { InterfaceLocale } from '@/i18n/locales';
import { GAME_LANGUAGES } from '@/i18n/locales';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import { WordDuelBoard } from './components/word-duel-board';
import { WordDuelKeyboard, WORD_DUEL_KEY_ROWS } from './components/word-duel-keyboard';
import {
  ACTIVE_DUEL_AUTO_ADVANCE_DELAY_MS,
  ACTIVE_DUEL_CLOCK_TICK_MS,
  activeDuelRemainingSeconds,
  advanceResolvedActiveDuelRound,
  createActiveDuelRoundClock,
  formatActiveDuelSeconds,
  shouldAutoAdvanceActiveDuelRound,
  shouldOpenActiveDuelFinalResult,
  type ActiveDuelRoundClock,
} from './active-duel-live-round';
import {
  finalizeActiveWordDuelResult,
  reportWordDuelResultFinalizationError,
} from './result-finalization';
import { buildWordDuelResultHandoffHref } from './word-duel-route-params';
import { publicDuelT, type PublicDuelCopyKey } from './public-duel-copy';

const REACTION_LABELS: Record<ActiveDuelReactionId, string> = {
  gg: 'GG',
  nice: 'Nice',
  close: 'Close',
  almost: 'Almost',
  your_turn: 'Turn',
  tick_tock: 'Time',
};

type ActiveDuelScreenProps = {
  controller?: WordDuelActiveController;
  initialHandoff?: WordDuelActiveHandoff;
  initialGameLanguage?: GameLanguage;
  interfaceLocale?: InterfaceLocale;
  onFinalResult?: (result: DuelWordsApiFinalResult) => void;
  onLeave?: () => void;
};

export function ActiveDuelScreen({
  controller,
  initialGameLanguage,
  initialHandoff,
  interfaceLocale = 'en',
  onFinalResult,
  onLeave,
}: ActiveDuelScreenProps) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compactViewport = width <= 480 && height <= 900;
  const styles = useActiveDuelStyles();
  const copy = useCallback(
    (key: PublicDuelCopyKey, values?: Record<string, string | number>) =>
      publicDuelT(interfaceLocale, key, values),
    [interfaceLocale],
  );
  const clientRequestNumber = useRef(0);
  const draftRef = useRef('');
  const isOpeningResultRef = useRef(false);
  const presenceReconciliationInFlightRef = useRef(false);
  const reactionRequestNumber = useRef(0);
  const autoAdvanceRoundRef = useRef<number | null>(null);
  const timedOutRoundRef = useRef<number | null>(null);
  const activeHandoff = useMemo(
    () => initialHandoff ?? createWordDuelActiveDemoHandoff({ gameLanguage: initialGameLanguage ?? 'en' }),
    [initialGameLanguage, initialHandoff],
  );
  const [muted, setMuted] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [showRecoveryAction, setShowRecoveryAction] = useState(false);
  const [activeReaction, setActiveReaction] = useState<ActiveDuelReactionId | null>(null);
  const activeDuelController = useMemo(
    () => controller ?? createWordDuelActiveController({
      handoff: activeHandoff,
      mode: 'local_mock',
    }),
    [activeHandoff, controller],
  );
  const [statusDetail, setStatusDetail] = useState(() => copy('roundLive'));
  const [viewModel, setViewModel] = useState(() => activeDuelController.getViewModel());
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [realtimeRound, setRealtimeRound] = useState<{
    clock: ActiveDuelRoundClock | null;
    roundNumber: number;
    status: DuelWordsRealtimeRoomStatus;
  } | null>(null);
  const viewModelRef = useRef(viewModel);
  const realtimeRoundNumber = realtimeRound?.roundNumber;
  const realtimeRoundStatus = realtimeRound?.status;
  const liveRemainingSeconds = realtimeRound?.clock?.roundNumber === viewModel.roundNumber
    ? activeDuelRemainingSeconds(realtimeRound.clock, clockNowMs)
    : viewModel.remainingSeconds;
  const keyboardDisabled = !isActiveDuelInputOpen(viewModel.ownRoundState);
  const boardWidth = Math.min(width - spacing.lg * 2, 418);
  const regularTileSize = Math.max(40, Math.min(54, Math.floor((boardWidth - spacing.sm * 4) / viewModel.wordLength)));
  const tileSize = compactViewport ? Math.min(40, regularTileSize) : regularTileSize;

  useEffect(() => {
    viewModelRef.current = viewModel;
  }, [viewModel]);

  useEffect(() => {
    clearDraft();
    isOpeningResultRef.current = false;
    autoAdvanceRoundRef.current = null;
    timedOutRoundRef.current = null;
    setReactionsOpen(false);
    setShowRecoveryAction(false);
    setRealtimeRound(null);
    setStatusDetail(copy('roundLive'));
    setViewModel(activeDuelController.getViewModel());
  }, [activeDuelController, copy]);

  useEffect(() => {
    if (realtimeRound?.clock === null || realtimeRound?.clock === undefined) {
      return undefined;
    }

    const interval = setInterval(() => {
      setClockNowMs(Date.now());
    }, ACTIVE_DUEL_CLOCK_TICK_MS);

    return () => clearInterval(interval);
  }, [realtimeRound?.clock]);

  useEffect(() => {
    if (
      activeDuelController.source !== 'apps_av_api'
      || !isActiveDuelInputOpen(viewModel.ownRoundState)
      || realtimeRound?.clock?.roundNumber !== viewModel.roundNumber
      || timedOutRoundRef.current === viewModel.roundNumber
    ) {
      return undefined;
    }

    const attemptedRoundNumber = viewModel.roundNumber;
    const timeout = setTimeout(() => {
      timedOutRoundRef.current = attemptedRoundNumber;
      void activeDuelController.timeoutRound({ roundNumber: attemptedRoundNumber })
        .then((result) => {
          if (viewModelRef.current.roundNumber !== attemptedRoundNumber) {
            return;
          }
          setViewModel(result.viewModel);
          clearDraft();
          setStatusDetail(copy('roundTimedOut'));
        })
        .catch(() => {
          if (!shouldReportActiveDuelTimeoutFailure(viewModelRef.current, attemptedRoundNumber)) {
            return;
          }
          timedOutRoundRef.current = null;
          setStatusDetail(copy('couldNotCloseTimeout'));
          setShowRecoveryAction(true);
        });
    }, Math.max(0, realtimeRound.clock.deadlineAtMs - Date.now()) + 100);

    return () => clearTimeout(timeout);
  }, [activeDuelController, copy, realtimeRound?.clock, viewModel.ownRoundState, viewModel.roundNumber]);

  useEffect(() => {
    if (
      activeDuelController.source !== 'apps_av_api'
      || realtimeRoundNumber === undefined
      || realtimeRoundStatus === undefined
      || !shouldAutoAdvanceActiveDuelRound(realtimeRoundStatus)
      || autoAdvanceRoundRef.current === realtimeRoundNumber
    ) {
      return undefined;
    }

    const resolvedRoundNumber = realtimeRoundNumber;
    autoAdvanceRoundRef.current = resolvedRoundNumber;
    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const transition = await advanceResolvedActiveDuelRound(
            activeDuelController,
            resolvedRoundNumber,
          );
          if (viewModelRef.current.roundNumber !== resolvedRoundNumber) {
            return;
          }
          setViewModel(transition.nextRound.advanced
            ? transition.nextRound.viewModel
            : transition.snapshot.viewModel);
          clearDraft();
          setStatusDetail(transition.nextRound.advanced ? copy('nextRoundReady') : copy('roundResolving'));
          if (!transition.nextRound.advanced) {
            autoAdvanceRoundRef.current = null;
          }
        } catch {
          autoAdvanceRoundRef.current = null;
          setStatusDetail(copy('couldNotOpenNext'));
          setShowRecoveryAction(true);
        }
      })();
    }, ACTIVE_DUEL_AUTO_ADVANCE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [activeDuelController, copy, realtimeRoundNumber, realtimeRoundStatus]);

  useEffect(() => {
    const unsubscribe = activeDuelController.subscribeActiveRoomView((projection) => {
      if (!projection) {
        setStatusDetail(copy('reconnecting'));
        setShowRecoveryAction(true);
        return;
      }

      const receivedAtMs = Date.now();
      const previousRoundNumber = viewModelRef.current.roundNumber;
      if (projection.room.roundNumber > previousRoundNumber) {
        clearDraft();
        timedOutRoundRef.current = null;
        autoAdvanceRoundRef.current = null;
        setStatusDetail(copy('roundStarted', { number: projection.room.roundNumber }));
      }
      setShowRecoveryAction(false);
      setClockNowMs(receivedAtMs);
      setRealtimeRound({
        clock: createActiveDuelRoundClock(projection.room, receivedAtMs),
        roundNumber: projection.room.roundNumber,
        status: projection.room.status,
      });
      setViewModel((current) => applyRealtimeProjectionToActiveDuelViewModel(current, projection));
      setActiveReaction(latestActiveDuelReactionFromRealtimeProjection(projection));

      if (
        activeDuelController.source === 'apps_av_api'
        && projection.opponent?.presenceState === 'disconnected'
        && !presenceReconciliationInFlightRef.current
      ) {
        presenceReconciliationInFlightRef.current = true;
        void activeDuelController.reconcilePresence()
          .then(async (reconciliation) => {
            if (reconciliation.status === 'finalized' || reconciliation.status === 'already_finalized') {
              setStatusDetail(copy('openingResult'));
              if (onFinalResult) {
                onFinalResult(await activeDuelController.getFinalResult());
              }
            }
          })
          .catch(() => {
            setStatusDetail(copy('reconnecting'));
            setShowRecoveryAction(true);
          })
          .finally(() => {
            presenceReconciliationInFlightRef.current = false;
          });
      }
    });
    const stopHeartbeat = startActiveDuelPresenceHeartbeat({
      sendHeartbeat: () => activeDuelController.sendPresenceHeartbeat(),
    });

    return () => {
      stopHeartbeat();
      unsubscribe();
    };
  }, [activeDuelController, copy, onFinalResult]);

  function updateDraft(nextDraft: string) {
    const clampedDraft = Array.from(nextDraft).slice(0, viewModel.wordLength).join('');
    draftRef.current = clampedDraft;
    setViewModel((current) => updateActiveDuelEditingLetters(current, Array.from(clampedDraft)));
    setStatusDetail(copy('roundLive'));
  }

  function clearDraft() {
    draftRef.current = '';
  }

  function handleKeyPress(key: string) {
    if (keyboardDisabled) {
      return;
    }

    if (key === 'DEL') {
      updateDraft(Array.from(draftRef.current).slice(0, -1).join(''));
      return;
    }

    if (key === 'ENTER') {
      void submitDraft();
      return;
    }

    updateDraft(`${draftRef.current}${key}`);
  }

  async function submitDraft() {
    const currentDraft = draftRef.current;
    const letters = Array.from(currentDraft);
    if (letters.length !== viewModel.wordLength) {
      setStatusDetail(copy('wordLength', { count: viewModel.wordLength }));
      return;
    }

    clientRequestNumber.current += 1;

    try {
      const result = await activeDuelController.submitGuess({
        clientRequestId: `active-demo-submit-${viewModel.roundNumber}-${clientRequestNumber.current}`,
        guess: currentDraft,
        roundNumber: viewModel.roundNumber,
      });
      setViewModel(result.viewModel);
      clearDraft();
      setStatusDetail(copy('submitted'));
      if (activeDuelController.source === 'local_mock') {
        activeDuelController.publishLocalPlayerSubmittedProjection({
          roundNumber: result.submission.roundNumber,
        });
      }
    } catch (error) {
      setStatusDetail(error instanceof DuelWordsClientError
        ? activeDuelErrorLabel(interfaceLocale, error.code)
        : copy('tryAgain'));
    }
  }

  async function sendReaction(reaction: ActiveDuelReactionId) {
    reactionRequestNumber.current += 1;
    const result = await activeDuelController.sendReaction({
      clientRequestId: `active-demo-reaction-${reactionRequestNumber.current}`,
      reaction,
    });

    if (!result.ok) {
      setStatusDetail(result.reason === 'rate_limited' ? copy('slowDown') : copy('unavailable'));
      return;
    }
    setReactionsOpen(false);
    setStatusDetail(copy('reactionSent', { reaction: reactionLabel(interfaceLocale, reaction) }));
  }

  const openFinalResult = useCallback(async () => {
    if (isOpeningResultRef.current) {
      return;
    }

    isOpeningResultRef.current = true;
    setStatusDetail(copy('openingResult'));

    try {
      if (onFinalResult) {
        const finalResult = await activeDuelController.getFinalResult();
        onFinalResult(finalResult);
        return;
      }

      const handoff = await finalizeActiveWordDuelResult(viewModel, { mode: 'human_duel' });

      router.push(buildWordDuelResultHandoffHref({
        gameLanguage: viewModel.gameLanguage,
        mode: 'human_duel',
        outcome: 'win',
        reason: 'solved',
        ...handoff,
      }));
    } catch (error) {
      reportWordDuelResultFinalizationError({
        error,
        gameLanguage: viewModel.gameLanguage,
        mode: 'human_duel',
        routeGroup: 'active_duel',
      });
      setStatusDetail(copy('couldNotOpenResult'));
      setShowRecoveryAction(true);
    } finally {
      isOpeningResultRef.current = false;
    }
  }, [activeDuelController, copy, onFinalResult, router, viewModel]);

  async function syncRound() {
    try {
      const snapshot = await activeDuelController.refreshOwnRoundSnapshot({
        roundNumber: viewModel.roundNumber,
      });
      setViewModel(snapshot.viewModel);
      setShowRecoveryAction(false);
      setStatusDetail(snapshot.feedbackAvailable ? copy('feedbackReady') : copy('waitingForRival'));
    } catch {
      setStatusDetail(copy('couldNotSync'));
      setShowRecoveryAction(true);
    }
  }

  useEffect(() => {
    if (
      activeDuelController.source === 'apps_av_api'
      && realtimeRoundStatus !== undefined
      && shouldOpenActiveDuelFinalResult(realtimeRoundStatus)
      && !isOpeningResultRef.current
    ) {
      void openFinalResult();
    }
  }, [activeDuelController, openFinalResult, realtimeRoundStatus]);

  const gameLanguageLabel = GAME_LANGUAGES.find(
    (language) => language.code === viewModel.gameLanguage,
  )?.label ?? viewModel.gameLanguage.toUpperCase();

  return (
    <AppScreen
      bottomInset={compactViewport ? spacing.sm : spacing.md}
      contentGap={compactViewport ? spacing.sm : spacing.md}>
      <InteriorScreenHeader
        backLabel={copy('back')}
        detail={copy('duel')}
        onBack={onLeave ?? (() => router.replace('/play'))}
        title={copy('wordDuel')}
      />

      <View style={styles.timerRow}>
        <View>
          <Text style={styles.metaLabel}>{copy('round')}</Text>
          <Text style={styles.metaValue}>
            {viewModel.roundNumber}/{viewModel.maxAttempts}
          </Text>
        </View>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>{formatActiveDuelSeconds(liveRemainingSeconds)}</Text>
        </View>
        <View style={styles.languageBlock}>
          <Text style={styles.metaLabel}>{copy('language')}</Text>
          <Text numberOfLines={1} style={styles.languageValue}>{gameLanguageLabel}</Text>
        </View>
      </View>

      <OpponentSummary
        activeReaction={muted ? null : activeReaction}
        interfaceLocale={interfaceLocale}
        markers={viewModel.opponent.attemptMarkers}
        presence={viewModel.opponent.presence}
        roundState={viewModel.opponent.roundState}
        safeDisplayName={viewModel.opponent.safeDisplayName}
      />

      <WordDuelBoard
        accessibilityLabel={copy('ownBoard')}
        density={compactViewport ? 'compact' : 'regular'}
        rows={viewModel.ownBoardRows}
        showSubmittedPendingMark
        tileSize={tileSize}
      />

      <View style={styles.stateRow}>
        <Text style={styles.stateLabel}>{ownRoundStateLabel(interfaceLocale, viewModel)}</Text>
        <Text style={styles.stateDetail}>{statusDetail}</Text>
      </View>

      <WordDuelKeyboard
        density={compactViewport ? 'compact' : 'regular'}
        disabled={keyboardDisabled}
        feedbackByKey={viewModel.ownKeyboardFeedback}
        interfaceLocale={interfaceLocale}
        keyRows={WORD_DUEL_KEY_ROWS[viewModel.gameLanguage]}
        onKeyPress={handleKeyPress}
      />

      {showRecoveryAction ? (
        <AppButton
          tone="secondary"
          onPress={() => void syncRound()}>
          {copy('tryAgain')}
        </AppButton>
      ) : null}

      <ReactionTray
        interfaceLocale={interfaceLocale}
        muted={muted}
        onMuteToggle={() => setMuted((current) => !current)}
        onOpenToggle={() => setReactionsOpen((current) => !current)}
        onReactionPress={(reaction) => {
          void sendReaction(reaction);
        }}
        open={reactionsOpen}
        reactions={viewModel.availableReactions}
      />

    </AppScreen>
  );
}

function OpponentSummary({
  activeReaction,
  interfaceLocale,
  markers,
  presence,
  roundState,
  safeDisplayName,
}: {
  activeReaction: ActiveDuelReactionId | null;
  interfaceLocale: InterfaceLocale;
  markers: ActiveDuelOpponentMarkerState[];
  presence: string;
  roundState: ActiveDuelOpponentMarkerState;
  safeDisplayName: string;
}) {
  const styles = useActiveDuelStyles();
  return (
    <View style={styles.opponentStrip}>
      <View style={styles.opponentTopRow}>
        <View>
          <Text style={styles.metaLabel}>{publicDuelT(interfaceLocale, 'rival')}</Text>
          <Text style={styles.opponentName}>{safeDisplayName}</Text>
        </View>
        <View style={styles.presencePill}>
          <Text style={styles.presenceText}>{presenceLabel(interfaceLocale, presence)}</Text>
        </View>
      </View>
      <View style={styles.opponentBottomRow}>
        <View style={styles.markerGroup}>
          <Text style={styles.markerLegend}>{publicDuelT(interfaceLocale, 'attempts')}</Text>
          <View style={styles.markerRow}>
            {markers.map((marker, index) => (
              <View
                key={`opponent-marker-${index}`}
                accessibilityLabel={publicDuelT(interfaceLocale, 'opponentAttempt', {
                  number: index + 1,
                  state: opponentStateLabel(interfaceLocale, marker),
                })}
                style={[styles.marker, markerStyle(marker, styles)]}>
                <Text style={styles.markerText}>{markerSymbol(marker)}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.opponentStatusSlot}>
          {activeReaction ? (
            <View style={styles.reactionBubble}>
              <Text style={styles.reactionBubbleText}>{reactionLabel(interfaceLocale, activeReaction)}</Text>
            </View>
          ) : (
            <Text style={styles.opponentStatus}>{opponentStateLabel(interfaceLocale, roundState)}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function ReactionTray({
  interfaceLocale,
  muted,
  onMuteToggle,
  onOpenToggle,
  onReactionPress,
  open,
  reactions,
}: {
  interfaceLocale: InterfaceLocale;
  muted: boolean;
  onMuteToggle: () => void;
  onOpenToggle: () => void;
  onReactionPress: (reaction: ActiveDuelReactionId) => void;
  open: boolean;
  reactions: ActiveDuelReactionId[];
}) {
  const styles = useActiveDuelStyles();
  const compactReactions = reactions.filter((reaction) =>
    ['gg', 'nice', 'tick_tock', 'almost'].includes(reaction),
  );

  return (
    <View style={styles.reactionTray}>
      {open ? (
        <View style={styles.reactionButtons}>
          {compactReactions.map((reaction) => (
            <Pressable
              key={reaction}
              accessibilityRole="button"
              onPress={() => onReactionPress(reaction)}
              style={({ pressed }) => [styles.reactionButton, pressed && styles.pressed]}>
              <Text adjustsFontSizeToFit numberOfLines={1} style={styles.reactionButtonText}>
                {reactionLabel(interfaceLocale, reaction)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityLabel={publicDuelT(interfaceLocale, 'close')}
            accessibilityRole="button"
            onPress={onOpenToggle}
            style={({ pressed }) => [styles.reactionCloseButton, pressed && styles.pressed]}>
            <Text style={styles.reactionCloseText}>×</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.reactionHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            onPress={onOpenToggle}
            style={({ pressed }) => [styles.reactTrigger, pressed && styles.pressed]}>
            <Text style={styles.reactTriggerText}>{publicDuelT(interfaceLocale, 'react')}</Text>
            <Text style={styles.reactTriggerHint}>{publicDuelT(interfaceLocale, 'quickReaction')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onMuteToggle} style={styles.muteButton}>
            <Text style={styles.muteText}>{publicDuelT(interfaceLocale, muted ? 'muted' : 'mute')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ownRoundStateLabel(locale: InterfaceLocale, viewModel: ActiveDuelViewModel): string {
  if (viewModel.ownRoundState === 'waiting_for_rival') {
    return publicDuelT(locale, 'waitingForRival');
  }
  if (viewModel.ownRoundState === 'timed_out') {
    return publicDuelT(locale, 'timedOut');
  }
  if (viewModel.ownRoundState === 'submitting') {
    return publicDuelT(locale, 'submitting');
  }
  if (viewModel.ownRoundState === 'resolving') {
    return publicDuelT(locale, 'resolving');
  }
  if (viewModel.opponent.roundState === 'submitted') {
    return publicDuelT(locale, 'yourTurn');
  }
  return publicDuelT(locale, 'chooseLetters');
}

function activeDuelErrorLabel(locale: InterfaceLocale, code: DuelWordsClientError['code']): string {
  if (code === 'invalid_guess_length') {
    return publicDuelT(locale, 'wordLength', { count: 5 });
  }
  if (code === 'invalid_round') {
    return publicDuelT(locale, 'roundChanged');
  }
  return publicDuelT(locale, 'locked');
}

function markerSymbol(marker: ActiveDuelOpponentMarkerState): string {
  if (marker === 'submitted') {
    return 'S';
  }
  if (marker === 'solved') {
    return '=';
  }
  if (marker === 'timeout') {
    return 'T';
  }
  if (marker === 'failed') {
    return 'x';
  }
  return '';
}

function opponentStateLabel(locale: InterfaceLocale, marker: ActiveDuelOpponentMarkerState): string {
  if (marker === 'submitted') {
    return publicDuelT(locale, 'rivalSubmitted');
  }
  if (marker === 'timeout') {
    return publicDuelT(locale, 'timedOut');
  }
  if (marker === 'solved') {
    return publicDuelT(locale, 'solved');
  }
  return publicDuelT(locale, 'waiting');
}

function presenceLabel(locale: InterfaceLocale, presence: string): string {
  if (presence === 'connected') {
    return publicDuelT(locale, 'online');
  }
  if (presence === 'reconnecting') {
    return publicDuelT(locale, 'reconnecting');
  }
  return publicDuelT(locale, 'offline');
}

function reactionLabel(locale: InterfaceLocale, reaction: ActiveDuelReactionId): string {
  if (reaction === 'nice') return publicDuelT(locale, 'nice');
  if (reaction === 'almost') return publicDuelT(locale, 'almost');
  if (reaction === 'your_turn') return publicDuelT(locale, 'yourTurn');
  if (reaction === 'tick_tock') return publicDuelT(locale, 'time');
  return REACTION_LABELS[reaction];
}

function markerStyle(
  marker: ActiveDuelOpponentMarkerState,
  styles: ReturnType<typeof useActiveDuelStyles>,
) {
  if (marker === 'submitted') {
    return styles.markerSubmitted;
  }
  if (marker === 'solved') {
    return styles.markerSolved;
  }
  if (marker === 'timeout') {
    return styles.markerTimeout;
  }
  if (marker === 'failed') {
    return styles.markerFailed;
  }
  return styles.markerWaiting;
}

function useActiveDuelStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    color: colors.accent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '900',
  },
  leaveButton: {
    minWidth: 82,
  },
  timerRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.lg,
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
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  languageBlock: {
    alignItems: 'flex-end',
    maxWidth: 104,
  },
  languageValue: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '900',
  },
  timerPill: {
    minWidth: 96,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.pressureSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.pressure,
  },
  timerText: {
    color: colors.pressure,
    fontSize: typeScale.subtitle,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  opponentStrip: {
    minHeight: 100,
    gap: spacing.sm,
    borderRadius: radii.lg,
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
    letterSpacing: -0.3,
  },
  presencePill: {
    minHeight: 28,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
  },
  presenceText: {
    color: colors.accent,
    fontSize: typeScale.small,
    fontWeight: '800',
  },
  opponentBottomRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  markerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  markerGroup: {
    flex: 1,
    gap: 3,
  },
  markerLegend: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  marker: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  markerWaiting: {
    backgroundColor: colors.feedbackPending,
    borderColor: colors.border,
  },
  markerSubmitted: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
  },
  markerSolved: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.accent,
  },
  markerTimeout: {
    backgroundColor: colors.pressureSoft,
    borderColor: colors.pressure,
  },
  markerFailed: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
  },
  markerText: {
    color: colors.text,
    fontSize: typeScale.tiny,
    fontWeight: '900',
  },
  opponentStatusSlot: {
    minWidth: 112,
    minHeight: 34,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  opponentStatus: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '800',
    textAlign: 'right',
  },
  reactionBubble: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.pressureSoft,
    paddingHorizontal: spacing.md,
  },
  reactionBubbleText: {
    color: colors.pressure,
    fontWeight: '900',
  },
  stateRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
  },
  stateLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '900',
  },
  stateDetail: {
    color: colors.accent,
    fontSize: typeScale.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  reactionTray: {
    minHeight: 42,
    gap: spacing.sm,
  },
  reactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reactTrigger: {
    minHeight: 40,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  reactTriggerText: {
    color: colors.text,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  reactTriggerHint: {
    flex: 1,
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    textAlign: 'right',
  },
  reactionButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  reactionButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
  },
  reactionButtonText: {
    color: colors.text,
    fontSize: typeScale.tiny,
    fontWeight: '900',
  },
  reactionCloseButton: {
    width: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
  },
  reactionCloseText: {
    color: colors.textMuted,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  muteButton: {
    minWidth: 62,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.sm,
  },
  muteText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.45,
  },
  }), [colors]);
}
