import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
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
  latestActiveDuelReactionEventFromRealtimeProjection,
  type ActiveDuelReactionEvent,
  type DuelWordsRealtimeRoomStatus,
} from '@/game/word-duel-active/realtime-projection';
import {
  isActiveDuelInputOpen,
  reconcileActiveDuelResolvedOwnRow,
  shouldReportActiveDuelTimeoutFailure,
  updateActiveDuelEditingLetters,
  type ActiveDuelOpponentMarkerState,
  type ActiveDuelOpponentRoundSummary,
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
  reconcileResolvedActiveDuelRoundTransition,
  resolvedActiveDuelRoundsBeforeProjection,
  shouldAutoAdvanceActiveDuelRound,
  shouldOpenActiveDuelFinalResult,
  type ActiveDuelRoundClock,
} from './active-duel-live-round';
import {
  classifyActiveDuelSubmitFailure,
  type ActiveDuelSubmitFailure,
} from './active-duel-submit';
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
  const recoveryRoundRef = useRef<number | null>(null);
  const roundSnapshotRecoveryInFlightRef = useRef(new Set<number>());
  const submissionInFlightRef = useRef(false);
  const timedOutRoundRef = useRef<number | null>(null);
  const activeHandoff = useMemo(
    () => initialHandoff ?? createWordDuelActiveDemoHandoff({ gameLanguage: initialGameLanguage ?? 'en' }),
    [initialGameLanguage, initialHandoff],
  );
  const [muted, setMuted] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [showRecoveryAction, setShowRecoveryAction] = useState(false);
  const [submissionInFlight, setSubmissionInFlight] = useState(false);
  const [activeReaction, setActiveReaction] = useState<ActiveDuelReactionEvent | null>(null);
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
  const keyboardDisabled = submissionInFlight || !isActiveDuelInputOpen(viewModel.ownRoundState);
  const boardWidth = Math.min(width - spacing.lg * 2, 418);
  const regularTileSize = Math.max(40, Math.min(54, Math.floor((boardWidth - spacing.sm * 4) / viewModel.wordLength)));
  const tileSize = compactViewport ? Math.min(36, regularTileSize) : regularTileSize;

  useEffect(() => {
    viewModelRef.current = viewModel;
  }, [viewModel]);

  useEffect(() => {
    clearDraft();
    isOpeningResultRef.current = false;
    autoAdvanceRoundRef.current = null;
    recoveryRoundRef.current = null;
    roundSnapshotRecoveryInFlightRef.current.clear();
    submissionInFlightRef.current = false;
    timedOutRoundRef.current = null;
    setReactionsOpen(false);
    setShowRecoveryAction(false);
    setSubmissionInFlight(false);
    setRealtimeRound(null);
    setStatusDetail(copy('roundLive'));
    setViewModel(activeDuelController.getViewModel());
  }, [activeDuelController, copy]);

  const recoverResolvedRoundSnapshot = useCallback(async (roundNumber: number) => {
    if (roundSnapshotRecoveryInFlightRef.current.has(roundNumber)) {
      return;
    }

    roundSnapshotRecoveryInFlightRef.current.add(roundNumber);
    try {
      const snapshot = await activeDuelController.refreshOwnRoundSnapshot({ roundNumber });
      setViewModel((current) => reconcileActiveDuelResolvedOwnRow(
        current,
        snapshot.viewModel,
        roundNumber,
      ));
      if (recoveryRoundRef.current === roundNumber) {
        recoveryRoundRef.current = null;
        setShowRecoveryAction(false);
      }
    } catch {
      recoveryRoundRef.current = roundNumber;
      setStatusDetail(copy('couldNotSync'));
      setShowRecoveryAction(true);
    } finally {
      roundSnapshotRecoveryInFlightRef.current.delete(roundNumber);
    }
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
          setViewModel((current) => reconcileResolvedActiveDuelRoundTransition(
            current,
            transition,
            resolvedRoundNumber,
          ));
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
        for (const resolvedRoundNumber of resolvedActiveDuelRoundsBeforeProjection(
          previousRoundNumber,
          projection.room.roundNumber,
        )) {
          void recoverResolvedRoundSnapshot(resolvedRoundNumber);
        }
      }
      setShowRecoveryAction(false);
      setClockNowMs(receivedAtMs);
      setRealtimeRound({
        clock: createActiveDuelRoundClock(projection.room, receivedAtMs),
        roundNumber: projection.room.roundNumber,
        status: projection.room.status,
      });
      setViewModel((current) => applyRealtimeProjectionToActiveDuelViewModel(current, projection));
      setActiveReaction(latestActiveDuelReactionEventFromRealtimeProjection(projection));

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
  }, [activeDuelController, copy, onFinalResult, recoverResolvedRoundSnapshot]);

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
    if (submissionInFlightRef.current || keyboardDisabled) {
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
    if (submissionInFlightRef.current) {
      return;
    }

    const currentDraft = draftRef.current;
    const letters = Array.from(currentDraft);
    if (letters.length !== viewModel.wordLength) {
      setStatusDetail(copy('wordLength', { count: viewModel.wordLength }));
      return;
    }

    clientRequestNumber.current += 1;
    submissionInFlightRef.current = true;
    setSubmissionInFlight(true);
    setStatusDetail(copy('submitting'));

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
      const failure = classifyActiveDuelSubmitFailure(error);
      setStatusDetail(activeDuelSubmitFailureLabel(
        interfaceLocale,
        failure,
        gameLanguageLabel,
        currentDraft,
        viewModel.wordLength,
      ));
      if (failure === 'round_changed') {
        setShowRecoveryAction(true);
      }
    } finally {
      submissionInFlightRef.current = false;
      setSubmissionInFlight(false);
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
    const roundNumber = recoveryRoundRef.current ?? viewModel.roundNumber;
    try {
      const snapshot = await activeDuelController.refreshOwnRoundSnapshot({
        roundNumber,
      });
      setViewModel((current) => roundNumber < current.roundNumber
        ? reconcileActiveDuelResolvedOwnRow(current, snapshot.viewModel, roundNumber)
        : snapshot.viewModel);
      recoveryRoundRef.current = null;
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
        roundSummaries={viewModel.opponent.roundSummaries}
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
        <Text accessibilityLiveRegion="polite" style={styles.stateDetail}>{statusDetail}</Text>
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
  roundSummaries,
  safeDisplayName,
}: {
  activeReaction: ActiveDuelReactionEvent | null;
  interfaceLocale: InterfaceLocale;
  markers: ActiveDuelOpponentMarkerState[];
  presence: string;
  roundState: ActiveDuelOpponentMarkerState;
  roundSummaries: ActiveDuelOpponentRoundSummary[];
  safeDisplayName: string;
}) {
  const styles = useActiveDuelStyles();
  return (
    <View style={styles.opponentStrip}>
      <View style={styles.opponentTopRow}>
        <View>
          <Text style={styles.metaLabel}>{publicDuelT(interfaceLocale, 'rival')}</Text>
          <Text numberOfLines={1} style={styles.opponentName}>{safeDisplayName}</Text>
        </View>
        <View style={styles.presencePill}>
          <Text style={styles.presenceText}>{presenceLabel(interfaceLocale, presence)}</Text>
        </View>
      </View>
      <View style={styles.markerGroup}>
        <View style={styles.markerLegendRow}>
          <Text style={styles.markerLegend}>{publicDuelT(interfaceLocale, 'rivalRounds')}</Text>
          <View style={styles.scoreLegend}>
            <Text style={styles.scoreLegendText}>● {publicDuelT(interfaceLocale, 'validLetters')}</Text>
            <Text style={styles.scoreLegendText}>◎ {publicDuelT(interfaceLocale, 'correctPosition')}</Text>
          </View>
        </View>
        <View style={styles.markerRow}>
          {markers.map((marker, markerIndex) => {
            const roundNumber = markerIndex + 1;
            const summary = roundSummaries.find((candidate) => candidate.roundNumber === roundNumber);
            const accessibilityLabel = summary?.state === 'scored'
              ? publicDuelT(interfaceLocale, 'rivalRoundScore', {
                  exact: summary.exactCount,
                  number: summary.roundNumber,
                  valid: summary.validCount,
                })
              : publicDuelT(interfaceLocale, 'opponentAttempt', {
                  number: roundNumber,
                  state: opponentStateLabel(interfaceLocale, marker),
                });
            return (
              <View
                key={`opponent-round-${roundNumber}`}
                accessibilityLabel={accessibilityLabel}
                style={[styles.marker, markerStyle(marker, styles), summary?.state === 'scored' && styles.markerScored]}>
                <Text style={styles.markerNumber}>{roundNumber}</Text>
                <Text style={styles.markerText}>{markerSymbol(marker, summary)}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.opponentStatusSlot}>
        {activeReaction ? (
          <View style={[
            styles.reactionBubble,
            activeReaction.sender === 'own' ? styles.reactionBubbleOwn : styles.reactionBubbleOpponent,
          ]}>
            <Text style={[
              styles.reactionBubbleText,
              activeReaction.sender === 'own' ? styles.reactionBubbleTextOwn : styles.reactionBubbleTextOpponent,
            ]}>
              {publicDuelT(interfaceLocale, 'reactionFrom', {
                reaction: reactionLabel(interfaceLocale, activeReaction.reaction),
                sender: activeReaction.sender === 'own' ? publicDuelT(interfaceLocale, 'you') : safeDisplayName,
              })}
            </Text>
          </View>
        ) : (
          <Text style={styles.opponentStatus}>{opponentStateLabel(interfaceLocale, roundState)}</Text>
        )}
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

function activeDuelSubmitFailureLabel(
  locale: InterfaceLocale,
  failure: ActiveDuelSubmitFailure,
  language: string,
  word: string,
  wordLength: number,
): string {
  if (failure === 'invalid_word') {
    return publicDuelT(locale, 'wordNotInDictionary', { language, word });
  }
  if (failure === 'word_length') {
    return publicDuelT(locale, 'wordLength', { count: wordLength });
  }
  if (failure === 'round_changed') {
    return publicDuelT(locale, 'roundChanged');
  }
  return publicDuelT(locale, 'tryAgain');
}

function markerSymbol(
  marker: ActiveDuelOpponentMarkerState,
  summary?: ActiveDuelOpponentRoundSummary,
): string {
  if (summary?.state === 'scored') {
    return `${summary.validCount}·${summary.exactCount}`;
  }
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
    minHeight: 126,
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  opponentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  opponentName: {
    maxWidth: 250,
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
  markerLegendRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scoreLegend: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scoreLegendText: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  marker: {
    minWidth: 0,
    height: 34,
    flex: 1,
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
  markerScored: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.border,
  },
  markerNumber: {
    position: 'absolute',
    top: 2,
    left: 5,
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '900',
  },
  markerText: {
    color: colors.text,
    fontSize: typeScale.tiny,
    fontWeight: '900',
  },
  opponentStatusSlot: {
    minHeight: 34,
    alignItems: 'stretch',
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
    paddingHorizontal: spacing.md,
  },
  reactionBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.secondarySoft,
  },
  reactionBubbleOpponent: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pressureSoft,
  },
  reactionBubbleText: {
    fontWeight: '900',
  },
  reactionBubbleTextOwn: {
    color: colors.secondary,
  },
  reactionBubbleTextOpponent: {
    color: colors.pressure,
  },
  stateRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stateLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '900',
  },
  stateDetail: {
    flex: 1,
    flexShrink: 1,
    color: colors.accent,
    fontSize: typeScale.small,
    fontWeight: '900',
    textAlign: 'right',
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
