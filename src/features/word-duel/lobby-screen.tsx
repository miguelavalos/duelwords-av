import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
import { gameLanguageLabel as languageLabel, t } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { createWordDuelActiveHandoffFromLobby } from '@/game/word-duel-active/handoff';
import {
  createLocalMockWordDuelLobbyControllerState,
  createWordDuelLobbyController,
  type WordDuelLobbyController,
  type WordDuelLobbyControllerState,
} from '@/game/word-duel-lobby/controller';
import {
  type WordDuelLobbyPlayer,
  type WordDuelLobbySide,
  type WordDuelLobbyStatus,
  type WordDuelLobbyViewModel,
} from '@/game/word-duel-lobby/view-model';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { InteriorScreenHeader } from '@/ui/screen-navigation';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import {
  buildWordDuelActiveHandoffHref,
} from './word-duel-route-params';

const LOCAL_LOBBY_NOW_MS = Date.parse('2026-07-05T09:30:00.000Z');

type WordDuelLobbyScreenProps = {
  initialGameLanguage?: GameLanguage;
};

export function WordDuelLobbyScreen({ initialGameLanguage = 'en' }: WordDuelLobbyScreenProps) {
  const router = useRouter();
  const [{ interfaceLocale }] = useAppPreferences();
  const styles = useLobbyStyles();
  const controller = useMemo(() => createWordDuelLobbyController({ mode: 'local_mock' }), []);
  const [controllerState, setControllerState] = useState(() =>
    createLocalMockWordDuelLobbyControllerState({
      gameLanguage: initialGameLanguage,
      nowMs: LOCAL_LOBBY_NOW_MS,
    }),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lobby = controllerState.lobby;

  async function applyControllerAction(
    action: (current: WordDuelLobbyControllerState) => Promise<WordDuelLobbyControllerState>,
  ) {
    try {
      const nextState = await action(controllerState);
      setControllerState(nextState);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Action unavailable.');
    }
  }

  async function resetLocalInvite() {
    try {
      const nextState = await controller.createHostInvite({
        gameLanguage: lobby.invitePreview.gameLanguage,
        nowMs: LOCAL_LOBBY_NOW_MS,
      });
      setControllerState(nextState);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Action unavailable.');
    }
  }

  function openActiveDuel() {
    try {
      const handoff = createWordDuelActiveHandoffFromLobby(lobby);
      router.push(buildWordDuelActiveHandoffHref(handoff));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Active duel unavailable.');
    }
  }

  return (
    <AppScreen bottomInset={spacing.md} contentGap={spacing.md}>
      <InteriorScreenHeader backLabel={t(interfaceLocale, 'back')} detail="Word Duel" onBack={() => router.back()} title="Invite lobby" />

      <View style={[styles.statusBand, statusBandStyle(lobby.status, styles)]}>
        <View>
          <Text style={styles.statusLabel}>{statusEyebrow(lobby.status)}</Text>
          <Text style={styles.statusTitle}>{statusTitle(lobby)}</Text>
        </View>
        <View style={styles.languagePill}>
          <Text style={styles.languageLabel}>Language</Text>
          <Text style={styles.languageValue}>{languageLabel(lobby.invitePreview.gameLanguage)}</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryPill label="Mode" value="1v1" />
        <SummaryPill label="Letters" value={`${lobby.invitePreview.wordLength}`} />
        <SummaryPill label="Attempts" value={`${lobby.invitePreview.maxAttempts}`} />
      </View>

      <PlayersPanel players={lobby.players} />

      {lobby.status === 'invite_review' ? <JoinReviewPanel lobby={lobby} /> : null}

      {lobby.status === 'waiting_for_player' || lobby.status === 'lobby' ? <InvitePanel lobby={lobby} /> : null}

      {lobby.status === 'countdown' ? <CountdownPanel lobby={lobby} /> : null}

      {lobby.status === 'active_round' ? <ActiveReadyPanel lobby={lobby} /> : null}

      {isTerminalStatus(lobby.status) ? <TerminalPanel status={lobby.status} /> : null}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text selectable style={styles.errorText}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        {lobby.status === 'waiting_for_player' ? (
          <AppButton onPress={() => applyControllerAction((state) => controller.viewInviteReview({
            nowMs: LOCAL_LOBBY_NOW_MS + 1_000,
            state,
          }))}>
            Open join review
          </AppButton>
        ) : null}

        {lobby.status === 'invite_review' ? (
          <AppButton onPress={() => applyControllerAction((state) => controller.joinInvite({
            nowMs: LOCAL_LOBBY_NOW_MS + 2_000,
            safeDisplayName: 'Rival',
            state,
          }))}>
            Join challenge
          </AppButton>
        ) : null}

        {lobby.status === 'lobby' && lobby.canPressReady ? (
          <AppButton onPress={() => applyControllerAction((state) => controller.markReady({
            nowMs: LOCAL_LOBBY_NOW_MS + 3_000,
            state,
          }))}>
            Ready
          </AppButton>
        ) : null}

        {lobby.status === 'lobby' && !lobby.readyBySide[lobby.viewerSide] ? (
          <AppButton tone="secondary" onPress={() => applyControllerAction((state) =>
            markPreviewOpponentReady({
              controller,
              nowMs: LOCAL_LOBBY_NOW_MS + 3_000,
              state,
            }),
          )}>
            Rival ready
          </AppButton>
        ) : null}

        {lobby.status === 'lobby' && lobby.readyBySide[lobby.viewerSide] ? (
          <AppButton tone="secondary" onPress={() => applyControllerAction((state) =>
            markPreviewOpponentReady({
              controller,
              nowMs: LOCAL_LOBBY_NOW_MS + 4_000,
              state,
            }),
          )}>
            Rival ready
          </AppButton>
        ) : null}

        {lobby.status === 'countdown' ? (
          <AppButton onPress={() => applyControllerAction((state) => controller.openFirstRoundIfDue({
            nowMs: LOCAL_LOBBY_NOW_MS + 7_000,
            state,
          }))}>
            Open round 1
          </AppButton>
        ) : null}

        {lobby.canOpenActiveDuel ? (
          <AppButton onPress={openActiveDuel}>
            Open active duel
          </AppButton>
        ) : null}

        {lobby.status === 'invite_review' || lobby.status === 'lobby' ? (
          <View style={styles.controlRow}>
            <AppButton
              tone="quiet"
              onPress={() => applyControllerAction((state) => controller.viewAsHost({
                nowMs: LOCAL_LOBBY_NOW_MS + 2_500,
                state,
              }))}
              style={styles.controlButton}>
              View host
            </AppButton>
            <AppButton
              tone="quiet"
              onPress={() => applyControllerAction((state) => controller.viewAsRecipient({
                nowMs: LOCAL_LOBBY_NOW_MS + 2_500,
                state,
              }))}
              style={styles.controlButton}>
              View rival
            </AppButton>
          </View>
        ) : null}

        <View style={styles.controlRow}>
          {lobby.canCancel ? (
            <AppButton
              tone="quiet"
              onPress={() => applyControllerAction((state) => controller.cancelInvite({
                nowMs: LOCAL_LOBBY_NOW_MS + 5_000,
                state,
              }))}
              style={styles.controlButton}>
              Cancel
            </AppButton>
          ) : null}
          {lobby.canExpire ? (
            <AppButton
              tone="quiet"
              onPress={() => applyControllerAction((state) => controller.expireInvite({
                nowMs: LOCAL_LOBBY_NOW_MS + 601_000,
                state,
              }))}
              style={styles.controlButton}>
              Expire
            </AppButton>
          ) : null}
          {isTerminalStatus(lobby.status) ? (
            <AppButton tone="secondary" onPress={resetLocalInvite} style={styles.controlButton}>
              New invite
            </AppButton>
          ) : null}
        </View>
      </View>
    </AppScreen>
  );
}

async function markPreviewOpponentReady(input: {
  controller: WordDuelLobbyController;
  nowMs: number;
  state: WordDuelLobbyControllerState;
}): Promise<WordDuelLobbyControllerState> {
  const originalSide = input.state.lobby.viewerSide;
  const opponentSide = oppositeLobbySide(originalSide);
  if (input.state.lobby.readyBySide[opponentSide]) {
    return input.state;
  }

  const opponentView = await viewLobbyAsSide({
    controller: input.controller,
    nowMs: input.nowMs,
    side: opponentSide,
    state: input.state,
  });
  const opponentReady = await input.controller.markReady({
    nowMs: input.nowMs,
    state: opponentView,
  });

  return viewLobbyAsSide({
    controller: input.controller,
    nowMs: input.nowMs,
    side: originalSide,
    state: opponentReady,
  });
}

function viewLobbyAsSide(input: {
  controller: WordDuelLobbyController;
  nowMs: number;
  side: WordDuelLobbySide;
  state: WordDuelLobbyControllerState;
}): Promise<WordDuelLobbyControllerState> {
  return input.side === 'a'
    ? input.controller.viewAsHost({
        nowMs: input.nowMs,
        state: input.state,
      })
    : input.controller.viewAsRecipient({
        nowMs: input.nowMs,
        state: input.state,
      });
}

function oppositeLobbySide(side: WordDuelLobbySide): WordDuelLobbySide {
  return side === 'a' ? 'b' : 'a';
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  const styles = useLobbyStyles();
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function PlayersPanel({ players }: { players: WordDuelLobbyPlayer[] }) {
  const styles = useLobbyStyles();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Players</Text>
      {players.map((player) => (
        <View key={player.side} style={styles.playerRow}>
          <View style={styles.playerSide}>
            <Text style={styles.playerSideText}>{player.side.toUpperCase()}</Text>
          </View>
          <View style={styles.playerText}>
            <Text style={styles.playerName}>
              {player.safeDisplayName}{player.isViewer ? ' (you)' : ''}
            </Text>
            <Text style={styles.playerMeta}>{player.role} - {playerStateLabel(player.state)}</Text>
          </View>
          <Text style={[styles.readyBadge, player.state === 'ready' && styles.readyBadgeOn]}>
            {player.state === 'ready' ? 'Ready' : player.state === 'joined' ? 'Joined' : 'Waiting'}
          </Text>
        </View>
      ))}
    </View>
  );
}

function InvitePanel({ lobby }: { lobby: WordDuelLobbyViewModel }) {
  const styles = useLobbyStyles();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Invite</Text>
      <View style={styles.codeRow}>
        <View style={styles.codeBlock}>
          <Text style={styles.metaLabel}>Room code</Text>
          <Text selectable style={styles.codeText}>{lobby.invitePreview.roomCode}</Text>
        </View>
        <View style={styles.codeBlock}>
          <Text style={styles.metaLabel}>Link</Text>
          <Text selectable numberOfLines={1} style={styles.linkText}>{lobby.invitePreview.inviteUrl}</Text>
        </View>
      </View>
      <Text selectable style={styles.shareText}>{lobby.sharePayload}</Text>
    </View>
  );
}

function JoinReviewPanel({ lobby }: { lobby: WordDuelLobbyViewModel }) {
  const styles = useLobbyStyles();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Join challenge</Text>
      <Text style={styles.panelText}>
        {languageLabel(lobby.invitePreview.gameLanguage)} word duel from {lobby.players[0]?.safeDisplayName ?? 'Host'}.
      </Text>
      <Text style={styles.panelText}>Joining is explicit and does not mark Ready.</Text>
    </View>
  );
}

function CountdownPanel({ lobby }: { lobby: WordDuelLobbyViewModel }) {
  const styles = useLobbyStyles();
  return (
    <View style={styles.countdownPanel}>
      <Text style={styles.countdownNumber}>{lobby.countdown?.remainingSeconds ?? 0}</Text>
      <Text style={styles.countdownText}>Round opens only after the authority says it is due.</Text>
    </View>
  );
}

function ActiveReadyPanel({ lobby }: { lobby: WordDuelLobbyViewModel }) {
  const styles = useLobbyStyles();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Round {lobby.activeRound?.roundNumber ?? 1} ready</Text>
      <Text style={styles.panelText}>The active board can open now. No target or feedback was exposed in lobby.</Text>
    </View>
  );
}

function TerminalPanel({ status }: { status: WordDuelLobbyStatus }) {
  const styles = useLobbyStyles();
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{status === 'expired' ? 'Invite expired' : 'Invite cancelled'}</Text>
      <Text style={styles.panelText}>No round, stats, result, or target reveal is created.</Text>
    </View>
  );
}

function playerStateLabel(state: WordDuelLobbyPlayer['state']): string {
  if (state === 'ready') {
    return 'ready locked';
  }
  if (state === 'joined') {
    return 'in lobby';
  }
  return 'waiting to join';
}

function statusEyebrow(status: WordDuelLobbyStatus): string {
  if (status === 'invite_review') {
    return 'Review';
  }
  if (status === 'countdown') {
    return 'Countdown';
  }
  if (status === 'active_round') {
    return 'Round open';
  }
  if (isTerminalStatus(status)) {
    return 'Closed';
  }
  return 'Lobby';
}

function statusTitle(lobby: WordDuelLobbyViewModel): string {
  if (lobby.status === 'invite_review') {
    return 'Accept before joining';
  }
  if (lobby.status === 'waiting_for_player') {
    return 'Waiting for rival';
  }
  if (lobby.status === 'lobby') {
    return lobby.readyBySide.a || lobby.readyBySide.b ? 'Ready is locked' : 'Both players joined';
  }
  if (lobby.status === 'countdown') {
    return 'Starting soon';
  }
  if (lobby.status === 'active_round') {
    return 'Round 1 is ready';
  }
  if (lobby.status === 'expired') {
    return 'Room expired';
  }
  return 'Room cancelled';
}

function isTerminalStatus(status: WordDuelLobbyStatus): boolean {
  return status === 'cancelled_before_first_round' || status === 'expired';
}

function statusBandStyle(status: WordDuelLobbyStatus, styles: ReturnType<typeof useLobbyStyles>) {
  if (status === 'countdown' || status === 'active_round') {
    return styles.statusBandActive;
  }
  if (isTerminalStatus(status)) {
    return styles.statusBandClosed;
  }
  return styles.statusBandLobby;
}

function useLobbyStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create({
  header: {
    minHeight: 50,
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
    fontSize: typeScale.title,
    fontWeight: '900',
  },
  doneButton: {
    minWidth: 84,
  },
  statusBand: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  statusBandLobby: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusBandActive: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.accent,
  },
  statusBandClosed: {
    backgroundColor: colors.pressureSoft,
    borderColor: colors.pressure,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusTitle: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '900',
  },
  languagePill: {
    minWidth: 110,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  languageLabel: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  languageValue: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryPill: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  },
  panel: {
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  panelTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  panelText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
  playerRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerSide: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
  },
  playerSideText: {
    color: colors.accent,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  playerText: {
    flex: 1,
    gap: spacing.xs,
  },
  playerName: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: '900',
  },
  playerMeta: {
    color: colors.textMuted,
    fontSize: typeScale.small,
  },
  readyBadge: {
    minWidth: 74,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceStrong,
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  readyBadgeOn: {
    backgroundColor: colors.surfaceSoft,
    color: colors.accent,
  },
  codeRow: {
    gap: spacing.sm,
  },
  codeBlock: {
    gap: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
  },
  codeText: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  linkText: {
    color: colors.secondary,
    fontSize: typeScale.small,
    fontWeight: '800',
  },
  shareText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    lineHeight: 19,
  },
  countdownPanel: {
    minHeight: 156,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceSoft,
    padding: spacing.lg,
  },
  countdownNumber: {
    color: colors.accent,
    fontSize: 58,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  countdownText: {
    color: colors.text,
    fontSize: typeScale.small,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorBox: {
    borderRadius: radii.md,
    backgroundColor: colors.pressureSoft,
    padding: spacing.md,
  },
  errorText: {
    color: colors.pressure,
    fontSize: typeScale.small,
    fontWeight: '800',
  },
  controls: {
    gap: spacing.sm,
  },
  controlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  controlButton: {
    flexGrow: 1,
    flexBasis: 132,
  },
  }), [colors]);
}
