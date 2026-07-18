import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { GameLanguage } from '@/game/word-duel-engine';
import {
  acceptRematchProposal,
  cancelRematchProposal,
  createIdleRematchProposal,
  declineRematchProposal,
  draftRematchProposal,
  expireRematchProposal,
  rematchCanStart,
  sendRematchProposal,
  type WordDuelRematchProposal,
  viewRematchProposalAsOwner,
  viewRematchProposalAsRecipient,
} from '@/game/word-duel-result/rematch-proposal';
import {
  createDefaultWordDuelResultSource,
  type WordDuelResultMode,
  type WordDuelResultSource,
} from '@/game/word-duel-result/source';
import {
  type WordDuelResultBoardRow,
  type WordDuelResultOutcome,
  type WordDuelResultReason,
  type WordDuelResultViewModel,
} from '@/game/word-duel-result/view-model';
import { GAME_LANGUAGES } from '@/i18n/locales';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import { WordDuelBoard, type WordDuelBoardRow } from './components/word-duel-board';
import {
  buildWordDuelHref,
  WORD_DUEL_ROUTE_PATHS,
} from './word-duel-route-params';

const LOCAL_REMATCH_NOW_MS = Date.parse('2026-07-05T09:30:00.000Z');
const LOCAL_PREVIOUS_RESULT_REF = 'local-finalized-result';

type WordDuelResultScreenProps = {
  resultSource?: WordDuelResultSource;
};

export function WordDuelResultScreen({ resultSource = createDefaultWordDuelResultSource() }: WordDuelResultScreenProps) {
  const router = useRouter();
  const styles = useResultStyles();
  const { width } = useWindowDimensions();
  const sourceMode = resultSource.mode;
  const [result, setResult] = useState(() => resultSource.viewModel);
  const [shareVisible, setShareVisible] = useState(false);
  const boardWidth = Math.min(width - spacing.lg * 2, 326);
  const tileSize = Math.max(31, Math.min(39, Math.floor((boardWidth - spacing.xs * 4) / result.wordLength)));
  const showOpponentBoard = shouldShowOpponentBoard(sourceMode, result);
  const pendingProposal = result.rematch.status === 'draft'
    || result.rematch.status === 'sent'
    || result.rematch.status === 'accepted';
  const canOpenAcceptedDuel = rematchCanStart(result.rematch);

  function updateRematch(updater: (proposal: WordDuelRematchProposal) => WordDuelRematchProposal) {
    setResult((current) => ({
      ...current,
      rematch: updater(current.rematch),
    }));
  }

  function beginRematch() {
    setResult((current) => {
      if (current.rematch.status === 'idle' || current.rematch.status === 'draft') {
        return {
          ...current,
          rematch: draftRematchProposal(current.rematch),
        };
      }

      const idle = createIdleRematchProposal({
        gameLanguage: current.rematch.settings.gameLanguage,
        viewerRole: 'owner',
        viewerSide: current.own.side,
      });

      return {
        ...current,
        rematch: draftRematchProposal(idle),
      };
    });
  }

  function beginNewRematchSetup() {
    setResult((current) => {
      const idle = createIdleRematchProposal({
        gameLanguage: current.rematch.settings.gameLanguage,
        viewerRole: 'owner',
        viewerSide: current.own.side,
      });

      return {
        ...current,
        rematch: draftRematchProposal(idle),
      };
    });
  }

  function changeRematchLanguage(language: GameLanguage) {
    updateRematch((proposal) => draftRematchProposal(proposal, { gameLanguage: language }));
  }

  function sendRematch() {
    updateRematch((proposal) =>
      sendRematchProposal({
        nowMs: LOCAL_REMATCH_NOW_MS,
        proposal,
        proposalRef: 'local-rematch-proposal',
      }),
    );
  }

  function viewAsRecipient() {
    updateRematch((proposal) => viewRematchProposalAsRecipient(proposal, LOCAL_REMATCH_NOW_MS + 15_000));
  }

  function viewAsOwner() {
    updateRematch((proposal) => viewRematchProposalAsOwner(proposal, LOCAL_REMATCH_NOW_MS + 15_000));
  }

  function acceptRematch() {
    updateRematch((proposal) =>
      acceptRematchProposal({
        nowMs: LOCAL_REMATCH_NOW_MS + 15_000,
        previousResultRef: LOCAL_PREVIOUS_RESULT_REF,
        proposal,
      }),
    );
  }

  function declineRematch() {
    updateRematch((proposal) =>
      declineRematchProposal({
        nowMs: LOCAL_REMATCH_NOW_MS + 15_000,
        proposal,
      }),
    );
  }

  function cancelRematch() {
    updateRematch((proposal) =>
      cancelRematchProposal({
        nowMs: LOCAL_REMATCH_NOW_MS + 15_000,
        proposal,
      }),
    );
  }

  function expireRematch() {
    updateRematch((proposal) =>
      expireRematchProposal({
        nowMs: LOCAL_REMATCH_NOW_MS + 61_000,
        proposal,
      }),
    );
  }

  return (
    <AppScreen bottomInset={spacing.md} contentGap={spacing.md}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>Word Duel</Text>
          <Text style={styles.title}>{outcomeTitle(result.outcome)}</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()} style={styles.closeButton}>
          Done
        </AppButton>
      </View>

      <View style={[styles.resultBand, outcomeStyle(result.outcome, styles)]}>
        <View>
          <Text style={styles.resultLabel}>{reasonLabel(result.resultReason)}</Text>
          <Text style={styles.resultValue}>
            {showOpponentBoard
              ? `${result.own.attemptsUsed}/${result.maxAttempts} vs ${result.opponent.attemptsUsed}/${result.maxAttempts}`
              : `${result.own.attemptsUsed}/${result.maxAttempts}`}
          </Text>
        </View>
        <View style={styles.targetBox}>
          <Text style={styles.targetLabel}>Answer</Text>
          <Text style={styles.targetValue}>{result.targetReveal.displayWord ?? 'Hidden'}</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryPill label="Language" value={languageLabel(result.gameLanguage)} />
        <SummaryPill label="Mode" value={modeLabel(sourceMode)} />
        <SummaryPill label="Result" value={shortOutcomeLabel(result.outcome)} />
      </View>

      <View style={styles.boardSection}>
        <CompletedBoard
          attemptsUsed={result.own.attemptsUsed}
          boardLabel="Your path"
          rows={result.own.boardRows}
          solved={result.own.solved}
          tileSize={tileSize}
        />
        {showOpponentBoard ? (
          <CompletedBoard
            attemptsUsed={result.opponent.attemptsUsed}
            boardLabel={`${result.opponent.safeDisplayName}'s path`}
            rows={result.opponent.boardRows}
            solved={result.opponent.solved}
            tileSize={tileSize}
          />
        ) : null}
      </View>

      {shareVisible ? <SharePreview result={result} /> : null}

      {result.adSlot.visible ? <ResultAdSlot /> : null}

      {sourceMode === 'human_duel' ? (
        <RematchPanel
          result={result}
          onAccept={acceptRematch}
          onCancel={cancelRematch}
          onDecline={declineRematch}
          onExpire={expireRematch}
          onLanguageChange={changeRematchLanguage}
          onNewSetup={beginNewRematchSetup}
          onOpenAcceptedDuel={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.active, {
            gameLanguage: result.rematch.settings.gameLanguage,
            mode: 'human_duel',
          }))}
          onSend={sendRematch}
          onViewAsOwner={viewAsOwner}
          onViewAsRecipient={viewAsRecipient}
        />
      ) : null}

      {sourceMode === 'human_duel' ? (
        <>
          <View style={styles.actionRow}>
            <AppButton disabled={pendingProposal} onPress={beginRematch} style={styles.actionButton}>
              Rematch
            </AppButton>
            <AppButton
              tone="secondary"
              onPress={() => setShareVisible((current) => !current)}
              style={styles.actionButton}>
              Share result
            </AppButton>
          </View>
          <View style={styles.actionRow}>
            <AppButton
              disabled={!canOpenAcceptedDuel}
              tone="quiet"
              onPress={() => router.push(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.active, {
                gameLanguage: result.rematch.settings.gameLanguage,
                mode: 'human_duel',
              }))}
              style={styles.actionButton}>
              Open accepted duel
            </AppButton>
            <AppButton tone="quiet" onPress={() => router.push('/')} style={styles.actionButton}>
              Home
            </AppButton>
          </View>
        </>
      ) : (
        <View style={styles.actionRow}>
          <AppButton
            onPress={() => router.push(buildReplayHref(sourceMode, result.gameLanguage))}
            style={styles.actionButton}>
            {replayLabel(sourceMode)}
          </AppButton>
          <AppButton
            tone="secondary"
            onPress={() => setShareVisible((current) => !current)}
            style={styles.actionButton}>
            Share result
          </AppButton>
          <AppButton tone="quiet" onPress={() => router.push('/')} style={styles.actionButton}>
            Home
          </AppButton>
        </View>
      )}
    </AppScreen>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  const styles = useResultStyles();
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function CompletedBoard({
  attemptsUsed,
  boardLabel,
  rows,
  solved,
  tileSize,
}: {
  attemptsUsed: number;
  boardLabel: string;
  rows: WordDuelResultBoardRow[];
  solved: boolean;
  tileSize: number;
}) {
  const styles = useResultStyles();
  return (
    <View style={styles.boardBlock}>
      <View style={styles.boardHeader}>
        <Text style={styles.boardTitle}>{boardLabel}</Text>
        <Text style={[styles.boardBadge, solved ? styles.boardBadgeSolved : styles.boardBadgeOpen]}>
          {solved ? `${attemptsUsed} tries` : 'Not solved'}
        </Text>
      </View>
      <WordDuelBoard
        accessibilityLabel={`${boardLabel} completed board`}
        density="compact"
        rows={resultRowsToBoardRows(rows)}
        tileSize={tileSize}
      />
    </View>
  );
}

function resultRowsToBoardRows(rows: readonly WordDuelResultBoardRow[]): WordDuelBoardRow[] {
  return rows.map((row) => ({
    cells: row.cells,
    state: row.cells.some((cell) => cell.letter || cell.feedback) ? 'revealed' : 'empty',
  }));
}

function SharePreview({ result }: { result: WordDuelResultViewModel }) {
  const styles = useResultStyles();
  return (
    <View style={styles.shareBox}>
      <Text style={styles.shareTitle}>Share preview</Text>
      <Text selectable style={styles.shareText}>
        {result.safeSharePreview.text}
      </Text>
    </View>
  );
}

function ResultAdSlot() {
  const styles = useResultStyles();
  return (
    <View style={styles.adSlot}>
      <Text style={styles.adText}>Ad</Text>
    </View>
  );
}

function RematchPanel({
  onAccept,
  onCancel,
  onDecline,
  onExpire,
  onLanguageChange,
  onNewSetup,
  onOpenAcceptedDuel,
  onSend,
  onViewAsOwner,
  onViewAsRecipient,
  result,
}: {
  onAccept: () => void;
  onCancel: () => void;
  onDecline: () => void;
  onExpire: () => void;
  onLanguageChange: (language: GameLanguage) => void;
  onNewSetup: () => void;
  onOpenAcceptedDuel: () => void;
  onSend: () => void;
  onViewAsOwner: () => void;
  onViewAsRecipient: () => void;
  result: WordDuelResultViewModel;
}) {
  const styles = useResultStyles();
  const proposal = result.rematch;

  if (proposal.status === 'idle') {
    return null;
  }

  if (proposal.status === 'sent') {
    const isOwner = proposal.viewerRole === 'owner';

    return (
      <View style={styles.rematchPanel}>
        <View>
          <Text style={styles.rematchTitle}>{isOwner ? 'Waiting for rival' : 'Rematch request'}</Text>
          <Text style={styles.rematchText}>
            {languageLabel(proposal.settings.gameLanguage)} · {proposal.remainingSeconds ?? 0}s left
          </Text>
        </View>
        <View style={styles.panelButtonRow}>
          {isOwner ? (
            <>
              <AppButton tone="secondary" onPress={onViewAsRecipient} style={styles.panelButton}>
                View rival
              </AppButton>
              <AppButton disabled={!proposal.canCancel} tone="quiet" onPress={onCancel} style={styles.panelButton}>
                Cancel
              </AppButton>
            </>
          ) : (
            <>
              <AppButton disabled={!proposal.canAccept} onPress={onAccept} style={styles.panelButton}>
                Accept
              </AppButton>
              <AppButton disabled={!proposal.canDecline} tone="quiet" onPress={onDecline} style={styles.panelButton}>
                Decline
              </AppButton>
              <AppButton tone="secondary" onPress={onViewAsOwner} style={styles.panelButton}>
                View owner
              </AppButton>
            </>
          )}
          <AppButton tone="quiet" onPress={onExpire} style={styles.panelButton}>
            Expire
          </AppButton>
        </View>
      </View>
    );
  }

  if (proposal.status === 'accepted') {
    return (
      <View style={styles.rematchPanel}>
        <View>
          <Text style={styles.rematchTitle}>Rematch accepted</Text>
          <Text style={styles.rematchText}>
            {languageLabel(proposal.settings.gameLanguage)} · next duel ready
          </Text>
        </View>
        <AppButton onPress={onOpenAcceptedDuel}>Open duel</AppButton>
      </View>
    );
  }

  if (proposal.status === 'declined' || proposal.status === 'expired' || proposal.status === 'cancelled') {
    return (
      <View style={styles.rematchPanel}>
        <View>
          <Text style={styles.rematchTitle}>{rematchTerminalTitle(proposal.status)}</Text>
          <Text style={styles.rematchText}>{languageLabel(proposal.settings.gameLanguage)} · no next duel opened</Text>
        </View>
        <AppButton tone="secondary" onPress={onNewSetup}>New setup</AppButton>
      </View>
    );
  }

  return (
    <View style={styles.rematchPanel}>
      <View style={styles.rematchHeader}>
        <View>
          <Text style={styles.rematchTitle}>Rematch setup</Text>
          <Text style={styles.rematchText}>{languageLabel(proposal.settings.gameLanguage)} · five letters</Text>
        </View>
        <AppButton disabled={!proposal.canCancel} tone="quiet" onPress={onCancel} style={styles.panelButton}>
          Cancel
        </AppButton>
      </View>
      <View style={styles.segmented}>
        {GAME_LANGUAGES.map((language) => {
          const selected = language.code === proposal.settings.gameLanguage;
          return (
            <Pressable
              key={language.code}
              accessibilityRole="button"
              disabled={!proposal.canEditSettings}
              onPress={() => onLanguageChange(language.code)}
              style={[styles.segment, selected && styles.segmentSelected, !proposal.canEditSettings && styles.segmentDisabled]}>
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {language.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <AppButton disabled={!proposal.canSend} onPress={onSend}>Send rematch</AppButton>
    </View>
  );
}

function rematchTerminalTitle(status: WordDuelRematchProposal['status']): string {
  if (status === 'declined') {
    return 'Rematch declined';
  }
  if (status === 'expired') {
    return 'Rematch expired';
  }
  if (status === 'cancelled') {
    return 'Rematch cancelled';
  }
  return 'Rematch closed';
}

function languageLabel(language: GameLanguage): string {
  return language === 'es' ? 'Spanish' : 'English';
}

function modeLabel(mode: WordDuelResultMode): string {
  if (mode === 'bot_duel') {
    return 'Play Avi';
  }
  if (mode === 'daily_preview') {
    return 'Daily';
  }
  if (mode === 'practice') {
    return 'Practice';
  }
  if (mode === 'solo_practice') {
    return 'Solo';
  }
  return '1v1';
}

function shouldShowOpponentBoard(mode: WordDuelResultMode, result: WordDuelResultViewModel): boolean {
  return mode === 'human_duel' || mode === 'bot_duel' || result.opponent.attemptsUsed > 0;
}

function replayLabel(mode: WordDuelResultMode): string {
  if (mode === 'bot_duel') {
    return 'Play Avi again';
  }
  if (mode === 'daily_preview') {
    return 'Daily again';
  }
  if (mode === 'practice') {
    return 'Practice again';
  }
  return 'Play again';
}

function buildReplayHref(mode: WordDuelResultMode, gameLanguage: GameLanguage) {
  if (mode === 'bot_duel') {
    return buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.playAvi, { gameLanguage, mode });
  }
  if (mode === 'practice') {
    return buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, { gameLanguage, mode });
  }
  if (mode === 'daily_preview' || mode === 'solo_practice') {
    return buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.soloDaily, { gameLanguage, mode });
  }

  return buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.active, { gameLanguage, mode: 'human_duel' });
}

function outcomeTitle(outcome: WordDuelResultOutcome): string {
  if (outcome === 'win') {
    return 'You won';
  }
  if (outcome === 'loss') {
    return 'You lost';
  }
  if (outcome === 'draw') {
    return 'Draw';
  }
  if (outcome === 'technical') {
    return 'Result saved';
  }
  return 'No winner';
}

function shortOutcomeLabel(outcome: WordDuelResultOutcome): string {
  if (outcome === 'win') {
    return 'Win';
  }
  if (outcome === 'loss') {
    return 'Loss';
  }
  if (outcome === 'draw') {
    return 'Draw';
  }
  if (outcome === 'technical') {
    return 'Technical';
  }
  return 'No winner';
}

function reasonLabel(reason: WordDuelResultReason): string {
  if (reason === 'solved') {
    return 'Solved faster';
  }
  if (reason === 'attempts_exhausted') {
    return 'Attempts exhausted';
  }
  if (reason === 'round_timeout') {
    return 'Timeout';
  }
  if (reason === 'technical_result') {
    return 'Technical result';
  }
  if (reason === 'cancelled_before_first_round') {
    return 'Cancelled';
  }
  return 'Final result';
}

function outcomeStyle(outcome: WordDuelResultOutcome, styles: ReturnType<typeof useResultStyles>) {
  if (outcome === 'win') {
    return styles.resultWin;
  }
  if (outcome === 'loss') {
    return styles.resultLoss;
  }
  return styles.resultNeutral;
}

function useResultStyles() {
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
  closeButton: {
    minWidth: 84,
  },
  resultBand: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  resultWin: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.accent,
  },
  resultLoss: {
    backgroundColor: colors.pressureSoft,
    borderColor: colors.pressure,
  },
  resultNeutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  resultLabel: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  resultValue: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  targetBox: {
    minWidth: 112,
    minHeight: 58,
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  targetLabel: {
    color: colors.textMuted,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  targetValue: {
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
    borderRadius: radii.md,
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
  boardSection: {
    gap: spacing.md,
  },
  boardBlock: {
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  boardTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  boardBadge: {
    minWidth: 74,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typeScale.tiny,
    fontWeight: '900',
    overflow: 'hidden',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  boardBadgeSolved: {
    color: colors.accent,
    backgroundColor: colors.surfaceSoft,
  },
  boardBadgeOpen: {
    color: colors.textMuted,
    backgroundColor: colors.surfaceStrong,
  },
  shareBox: {
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  adText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    fontWeight: '900',
  },
  rematchPanel: {
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
    padding: spacing.md,
  },
  rematchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rematchTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  rematchText: {
    color: colors.textMuted,
    fontSize: typeScale.small,
    lineHeight: 18,
  },
  panelButton: {
    flexGrow: 1,
    flexBasis: 104,
    minWidth: 84,
    minHeight: 38,
  },
  panelButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.surfaceSoft,
  },
  segmentDisabled: {
    opacity: 0.62,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  segmentTextSelected: {
    color: colors.accent,
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
