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
import { CompactDuelStatusRow } from './components/compact-duel-status-row';
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
import { ActiveDuelFeedbackOverlay } from './active-duel-feedback-overlay';
import { reactionEmoji, reactionLabel } from './active-duel-reactions';
import {
  activeDuelVisualFeedbackFromProjection,
  createOwnSubmittedVisualFeedback,
  type ActiveDuelVisualFeedback,
  type ActiveDuelVisualSnapshot,
} from './active-duel-visual-feedback';
import { buildWordDuelResultHandoffHref } from './word-duel-route-params';
import { publicDuelT, type PublicDuelCopyKey } from './public-duel-copy';

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
  const visualSnapshotRef = useRef<ActiveDuelVisualSnapshot | null>(null);
  const activeHandoff = useMemo(
    () => initialHandoff ?? createWordDuelActiveDemoHandoff({ gameLanguage: initialGameLanguage ?? 'en' }),
    [initialGameLanguage, initialHandoff],
  );
  const mutedRef = useRef(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [reactionPreferencePending, setReactionPreferencePending] = useState(false);
  const [sendingReaction, setSendingReaction] = useState<ActiveDuelReactionId | null>(null);
  const [showRecoveryAction, setShowRecoveryAction] = useState(false);
  const [submissionInFlight, setSubmissionInFlight] = useState(false);
  const [activeReaction, setActiveReaction] = useState<ActiveDuelReactionEvent | null>(null);
  const [visualFeedback, setVisualFeedback] = useState<ActiveDuelVisualFeedback | null>(null);
  const activeDuelController = useMemo(
    () => controller ?? createWordDuelActiveController({
      handoff: activeHandoff,
      mode: 'local_mock',
    }),
    [activeHandoff, controller],
  );
  const [statusDetail, setStatusDetail] = useState(() => copy('roundLive'));
  const [inputError, setInputError] = useState<string | null>(null);
  const [viewModel, setViewModel] = useState(() => activeDuelController.getViewModel());
  const muted = !viewModel.acceptsReactions;
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
    visualSnapshotRef.current = null;
    setReactionsOpen(false);
    setReactionPreferencePending(false);
    setSendingReaction(null);
    setShowRecoveryAction(false);
    setSubmissionInFlight(false);
    setRealtimeRound(null);
    setStatusDetail(copy('roundLive'));
    setVisualFeedback(null);
    const nextViewModel = activeDuelController.getViewModel();
    mutedRef.current = !nextViewModel.acceptsReactions;
    setViewModel(nextViewModel);
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
      const visualUpdate = activeDuelVisualFeedbackFromProjection(
        visualSnapshotRef.current,
        projection,
      );
      visualSnapshotRef.current = visualUpdate.snapshot;
      const projectionMuted = projection.own?.acceptsReactions === false;
      mutedRef.current = projectionMuted;
      if (
        visualUpdate.feedback
        && !(projectionMuted && visualUpdate.feedback.kind === 'opponent_reaction')
      ) {
        setVisualFeedback(visualUpdate.feedback);
      }
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
    setInputError(null);
    const clampedDraft = Array.from(nextDraft).slice(0, viewModel.wordLength).join('');
    draftRef.current = clampedDraft;
    setViewModel((current) => updateActiveDuelEditingLetters(current, Array.from(clampedDraft)));
    setStatusDetail(copy('roundLive'));
  }

  function clearDraft() {
    draftRef.current = '';
    setInputError(null);
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
      setInputError(copy('wordLength', { count: viewModel.wordLength }));
      return;
    }

    clientRequestNumber.current += 1;
    submissionInFlightRef.current = true;
    setSubmissionInFlight(true);
    setInputError(null);
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
      setVisualFeedback(createOwnSubmittedVisualFeedback(
        result.submission.roundNumber,
        clientRequestNumber.current,
      ));
      if (activeDuelController.source === 'local_mock') {
        activeDuelController.publishLocalPlayerSubmittedProjection({
          roundNumber: result.submission.roundNumber,
        });
      }
    } catch (error) {
      const failure = classifyActiveDuelSubmitFailure(error);
      const failureLabel = activeDuelSubmitFailureLabel(interfaceLocale, failure, viewModel.wordLength);
      if (failure === 'invalid_word' || failure === 'word_length') {
        setInputError(failureLabel);
      } else {
        setStatusDetail(failureLabel);
      }
      if (failure === 'round_changed') {
        setShowRecoveryAction(true);
      }
    } finally {
      submissionInFlightRef.current = false;
      setSubmissionInFlight(false);
    }
  }

  async function sendReaction(reaction: ActiveDuelReactionId) {
    if (sendingReaction !== null || !viewModel.opponentAcceptsReactions) {
      setStatusDetail(copy('reactionBlocked'));
      setReactionsOpen(false);
      return;
    }

    reactionRequestNumber.current += 1;
    setSendingReaction(reaction);
    try {
      const result = await activeDuelController.sendReaction({
        clientRequestId: `active-demo-reaction-${reactionRequestNumber.current}`,
        reaction,
      });

      if (!result.ok) {
        setStatusDetail(
          result.reason === 'rate_limited'
            ? copy('slowDown')
            : result.reason === 'opponent_reactions_disabled'
              ? copy('reactionBlocked')
              : copy('unavailable'),
        );
        if (result.reason === 'opponent_reactions_disabled') {
          setViewModel((current) => ({ ...current, opponentAcceptsReactions: false }));
          setReactionsOpen(false);
        }
        return;
      }
      setReactionsOpen(false);
      setStatusDetail(copy('reactionSent', { reaction: reactionLabel(interfaceLocale, reaction) }));
    } catch {
      setStatusDetail(copy('unavailable'));
    } finally {
      setSendingReaction(null);
    }
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

  const dismissVisualFeedback = useCallback((eventId: string) => {
    setVisualFeedback((current) => current?.id === eventId ? null : current);
  }, []);

  const toggleMuted = useCallback(async () => {
    if (reactionPreferencePending) return;

    const previousAcceptsReactions = viewModelRef.current.acceptsReactions;
    const acceptsReactions = !previousAcceptsReactions;
    mutedRef.current = !acceptsReactions;
    setReactionPreferencePending(true);
    setViewModel((current) => ({ ...current, acceptsReactions }));
    if (!acceptsReactions) {
      setVisualFeedback((current) => (
        current?.kind === 'opponent_reaction' ? null : current
      ));
    }

    try {
      const result = await activeDuelController.setReactionPreference({ acceptsReactions });
      if (!result.ok) {
        mutedRef.current = !previousAcceptsReactions;
        setViewModel((current) => ({ ...current, acceptsReactions: previousAcceptsReactions }));
        setStatusDetail(copy('unavailable'));
        return;
      }
      setStatusDetail(copy(acceptsReactions ? 'roundLive' : 'reactionsPaused'));
    } catch {
      mutedRef.current = !previousAcceptsReactions;
      setViewModel((current) => ({ ...current, acceptsReactions: previousAcceptsReactions }));
      setStatusDetail(copy('unavailable'));
    } finally {
      setReactionPreferencePending(false);
    }
  }, [activeDuelController, copy, reactionPreferencePending]);

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
    <View style={styles.screenFrame}>
      <AppScreen
        bottomInset={compactViewport ? spacing.xl * 2 : spacing.xl}
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

      <CompactDuelStatusRow
        compact={compactViewport}
        detail={inputError ?? statusDetail}
        error={inputError !== null}
        label={ownRoundStateLabel(interfaceLocale, viewModel)}
      />

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

      </AppScreen>

      <View
        pointerEvents="box-none"
        style={[
          styles.floatingReactionDock,
          reactionsOpen && styles.floatingReactionDockOpen,
        ]}>
        <ReactionTray
          compact={compactViewport}
          interfaceLocale={interfaceLocale}
          muted={muted}
          opponentAcceptsReactions={viewModel.opponentAcceptsReactions}
          onMuteToggle={toggleMuted}
          onOpenToggle={() => setReactionsOpen((current) => !current)}
          onReactionPress={(reaction) => {
            void sendReaction(reaction);
          }}
          open={reactionsOpen}
          preferencePending={reactionPreferencePending}
          reactions={viewModel.availableReactions}
          sendingReaction={sendingReaction}
        />
      </View>

      <ActiveDuelFeedbackOverlay
        event={visualFeedback}
        interfaceLocale={interfaceLocale}
        onDismiss={dismissVisualFeedback}
      />
    </View>
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
  compact,
  interfaceLocale,
  muted,
  opponentAcceptsReactions,
  onMuteToggle,
  onOpenToggle,
  onReactionPress,
  open,
  preferencePending,
  reactions,
  sendingReaction,
}: {
  compact: boolean;
  interfaceLocale: InterfaceLocale;
  muted: boolean;
  opponentAcceptsReactions: boolean;
  onMuteToggle: () => void;
  onOpenToggle: () => void;
  onReactionPress: (reaction: ActiveDuelReactionId) => void;
  open: boolean;
  preferencePending: boolean;
  reactions: ActiveDuelReactionId[];
  sendingReaction: ActiveDuelReactionId | null;
}) {
  const styles = useActiveDuelStyles();
  const reactDisabled = !opponentAcceptsReactions;

  return (
    <View style={styles.reactionTray}>
      {open ? (
        <View style={styles.reactionButtons}>
          <View style={styles.reactionPanelHeader}>
            <View style={styles.reactionPanelTitleBlock}>
              <Text style={styles.reactionPanelTitle}>{publicDuelT(interfaceLocale, 'reactionPanel')}</Text>
              <Text numberOfLines={1} style={styles.reactionPanelDetail}>
                {muted
                  ? publicDuelT(interfaceLocale, 'reactionsPaused')
                  : publicDuelT(interfaceLocale, 'quickReaction')}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={publicDuelT(interfaceLocale, muted ? 'resumeReactions' : 'pauseReactions')}
              accessibilityRole="button"
              accessibilityState={{ busy: preferencePending, checked: muted }}
              disabled={preferencePending}
              onPress={onMuteToggle}
              style={({ pressed }) => [
                styles.reactionPanelMuteButton,
                muted && styles.reactionPanelMuteButtonActive,
                pressed && styles.pressed,
                preferencePending && styles.disabled,
              ]}>
              <Text style={styles.muteText}>{muted ? '🔕' : '🔔'}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={publicDuelT(interfaceLocale, 'close')}
              accessibilityRole="button"
              onPress={onOpenToggle}
              style={({ pressed }) => [styles.reactionCloseButton, pressed && styles.pressed]}>
              <Text style={styles.reactionCloseText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.reactionGrid}>
            {reactions.map((reaction) => (
              <Pressable
                key={reaction}
                accessibilityLabel={reactionLabel(interfaceLocale, reaction)}
                accessibilityRole="button"
                accessibilityState={{ busy: sendingReaction === reaction, disabled: reactDisabled }}
                disabled={reactDisabled || sendingReaction !== null}
                onPress={() => onReactionPress(reaction)}
                style={({ pressed }) => [
                  styles.reactionButton,
                  compact && styles.reactionButtonCompact,
                  sendingReaction === reaction && styles.reactionButtonSending,
                  reactDisabled && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.reactionButtonEmoji}>{reactionEmoji(reaction)}</Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.reactionButtonText}>
                  {reactionLabel(interfaceLocale, reaction)}
                </Text>
              </Pressable>
            ))}
          </View>
          {reactDisabled ? (
            <Text accessibilityLiveRegion="polite" style={styles.reactionBlockedText}>
              {publicDuelT(interfaceLocale, 'rivalPausedReactions')}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.reactionHeader}>
          <Pressable
            accessibilityLabel={publicDuelT(
              interfaceLocale,
              reactDisabled ? 'rivalPausedReactions' : 'react',
            )}
            accessibilityRole="button"
            accessibilityState={{ disabled: reactDisabled, expanded: open }}
            disabled={reactDisabled}
            onPress={onOpenToggle}
            style={({ pressed }) => [
              styles.reactTrigger,
              reactDisabled && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.reactTriggerEmoji}>⚡</Text>
            <Text style={styles.reactTriggerText}>
              {publicDuelT(interfaceLocale, reactDisabled ? 'reactionsPaused' : 'react')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={publicDuelT(interfaceLocale, muted ? 'resumeReactions' : 'pauseReactions')}
            accessibilityRole="button"
            accessibilityState={{ busy: preferencePending, checked: muted }}
            disabled={preferencePending}
            onPress={onMuteToggle}
            style={({ pressed }) => [
              styles.muteButton,
              muted && styles.muteButtonActive,
              preferencePending && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.muteText}>{muted ? '🔕' : '🔔'}</Text>
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
  wordLength: number,
): string {
  if (failure === 'invalid_word') {
    return publicDuelT(locale, 'wordNotAccepted');
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
  screenFrame: {
    flex: 1,
    backgroundColor: colors.background,
  },
  floatingReactionDock: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.md,
    zIndex: 30,
    alignItems: 'flex-end',
  },
  floatingReactionDockOpen: {
    width: '92%',
    maxWidth: 430,
  },
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
  reactionTray: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  reactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reactTrigger: {
    minWidth: 94,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
    paddingHorizontal: spacing.sm,
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.16)',
  },
  reactTriggerEmoji: {
    fontSize: typeScale.lead,
  },
  reactTriggerText: {
    color: colors.secondary,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  reactionButtons: {
    width: '100%',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    boxShadow: '0 10px 18px rgba(0, 0, 0, 0.20)',
  },
  reactionPanelHeader: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reactionPanelTitleBlock: {
    flex: 1,
  },
  reactionPanelTitle: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '900',
  },
  reactionPanelDetail: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '800',
  },
  reactionPanelMuteButton: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  reactionPanelMuteButtonActive: {
    borderColor: colors.pressure,
    backgroundColor: colors.pressureSoft,
  },
  reactionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.xs,
  },
  reactionButton: {
    width: '23.5%',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.xs,
  },
  reactionButtonCompact: {
    minHeight: 56,
  },
  reactionButtonSending: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  reactionButtonEmoji: {
    fontSize: typeScale.lead,
  },
  reactionButtonText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '900',
  },
  reactionCloseButton: {
    width: 44,
    minHeight: 44,
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
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.12)',
  },
  muteButtonActive: {
    borderColor: colors.pressure,
    backgroundColor: colors.pressureSoft,
  },
  muteText: {
    fontSize: typeScale.lead,
  },
  reactionBlockedText: {
    color: colors.pressure,
    fontSize: typeScale.small,
    fontWeight: '900',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.45,
  },
  }), [colors]);
}
