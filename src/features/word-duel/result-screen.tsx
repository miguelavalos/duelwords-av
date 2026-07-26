import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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
  type WordDuelResultViewModel,
} from '@/game/word-duel-result/view-model';
import { GAME_LANGUAGES, gameLanguageLabel as languageLabel } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

import { WordDuelBoard, type WordDuelBoardRow } from './components/word-duel-board';
import {
  buildLocalizedSafeShareText,
  wordDuelResultCopy,
  type WordDuelResultCopy,
} from './result-copy';
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
  const [{ interfaceLocale }] = useAppPreferences();
  const copy = wordDuelResultCopy(interfaceLocale);
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
          <Text style={styles.kicker}>{copy.wordDuel}</Text>
          <Text style={styles.title}>{copy.outcomeTitles[result.outcome]}</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()} style={styles.closeButton}>
          {copy.done}
        </AppButton>
      </View>

      <View style={[styles.resultBand, outcomeStyle(result.outcome, styles)]}>
        <View>
          <Text style={styles.resultLabel}>{copy.reasonLabels[result.resultReason]}</Text>
          <Text style={styles.resultValue}>
            {showOpponentBoard
              ? `${result.own.attemptsUsed}/${result.maxAttempts} ${copy.versus} ${result.opponent.attemptsUsed}/${result.maxAttempts}`
              : `${result.own.attemptsUsed}/${result.maxAttempts}`}
          </Text>
        </View>
        <View style={styles.targetBox}>
          <Text style={styles.targetLabel}>{copy.answer}</Text>
          <Text style={styles.targetValue}>{result.targetReveal.displayWord ?? copy.hidden}</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryPill label={copy.language} value={languageLabel(result.gameLanguage)} />
        <SummaryPill label={copy.mode} value={copy.modeLabels[sourceMode]} />
        <SummaryPill label={copy.result} value={copy.outcomeLabels[result.outcome]} />
      </View>

      <View style={styles.boardSection}>
        <CompletedBoard
          attemptsUsed={result.own.attemptsUsed}
          boardLabel={copy.yourPath}
          copy={copy}
          rows={result.own.boardRows}
          solved={result.own.solved}
          tileSize={tileSize}
        />
        {showOpponentBoard ? (
          <CompletedBoard
            attemptsUsed={result.opponent.attemptsUsed}
            boardLabel={copy.opponentPath(result.opponent.safeDisplayName)}
            copy={copy}
            rows={result.opponent.boardRows}
            solved={result.opponent.solved}
            tileSize={tileSize}
          />
        ) : null}
      </View>

      {shareVisible ? <SharePreview copy={copy} result={result} /> : null}

      {sourceMode === 'human_duel' ? (
        <RematchPanel
          copy={copy}
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
              {copy.rematch}
            </AppButton>
            <AppButton
              tone="secondary"
              onPress={() => setShareVisible((current) => !current)}
              style={styles.actionButton}>
              {copy.shareResult}
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
              {copy.openAcceptedDuel}
            </AppButton>
            <AppButton tone="quiet" onPress={() => router.push('/')} style={styles.actionButton}>
              {copy.home}
            </AppButton>
          </View>
        </>
      ) : (
        <View style={styles.actionRow}>
          <AppButton
            onPress={() => router.push(buildReplayHref(sourceMode, result.gameLanguage))}
            style={styles.actionButton}>
            {copy.replayLabels[sourceMode]}
          </AppButton>
          <AppButton
            tone="secondary"
            onPress={() => setShareVisible((current) => !current)}
            style={styles.actionButton}>
            {copy.shareResult}
          </AppButton>
          <AppButton tone="quiet" onPress={() => router.push('/')} style={styles.actionButton}>
            {copy.home}
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
  copy,
  rows,
  solved,
  tileSize,
}: {
  attemptsUsed: number;
  boardLabel: string;
  copy: WordDuelResultCopy;
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
          {solved ? copy.tries(attemptsUsed) : copy.notSolved}
        </Text>
      </View>
      <WordDuelBoard
        accessibilityLabel={copy.completedBoard(boardLabel)}
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

function SharePreview({ copy, result }: { copy: WordDuelResultCopy; result: WordDuelResultViewModel }) {
  const styles = useResultStyles();
  const safeShareText = buildLocalizedSafeShareText(result, copy);
  return (
    <View style={styles.shareBox}>
      <Text style={styles.shareTitle}>{copy.shareResult}</Text>
      <Text selectable style={styles.shareText}>
        {safeShareText}
      </Text>
      <AppButton tone="secondary" onPress={() => void Share.share({ message: safeShareText })}>{copy.openShareSheet}</AppButton>
    </View>
  );
}

function RematchPanel({
  copy,
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
  copy: WordDuelResultCopy;
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
          <Text style={styles.rematchTitle}>{isOwner ? copy.waitingForRival : copy.rematchRequest}</Text>
          <Text style={styles.rematchText}>
            {languageLabel(proposal.settings.gameLanguage)} · {copy.secondsLeft(proposal.remainingSeconds ?? 0)}
          </Text>
        </View>
        <View style={styles.panelButtonRow}>
          {isOwner ? (
            <>
              <AppButton tone="secondary" onPress={onViewAsRecipient} style={styles.panelButton}>
                {copy.viewRival}
              </AppButton>
              <AppButton disabled={!proposal.canCancel} tone="quiet" onPress={onCancel} style={styles.panelButton}>
                {copy.cancel}
              </AppButton>
            </>
          ) : (
            <>
              <AppButton disabled={!proposal.canAccept} onPress={onAccept} style={styles.panelButton}>
                {copy.accept}
              </AppButton>
              <AppButton disabled={!proposal.canDecline} tone="quiet" onPress={onDecline} style={styles.panelButton}>
                {copy.decline}
              </AppButton>
              <AppButton tone="secondary" onPress={onViewAsOwner} style={styles.panelButton}>
                {copy.viewOwner}
              </AppButton>
            </>
          )}
          <AppButton tone="quiet" onPress={onExpire} style={styles.panelButton}>
            {copy.expire}
          </AppButton>
        </View>
      </View>
    );
  }

  if (proposal.status === 'accepted') {
    return (
      <View style={styles.rematchPanel}>
        <View>
          <Text style={styles.rematchTitle}>{copy.rematchAccepted}</Text>
          <Text style={styles.rematchText}>
            {languageLabel(proposal.settings.gameLanguage)} · {copy.nextDuelReady}
          </Text>
        </View>
        <AppButton onPress={onOpenAcceptedDuel}>{copy.openDuel}</AppButton>
      </View>
    );
  }

  if (proposal.status === 'declined' || proposal.status === 'expired' || proposal.status === 'cancelled') {
    return (
      <View style={styles.rematchPanel}>
        <View>
          <Text style={styles.rematchTitle}>{copy.rematchTerminalTitles[proposal.status]}</Text>
          <Text style={styles.rematchText}>{languageLabel(proposal.settings.gameLanguage)} · {copy.noNextDuelOpened}</Text>
        </View>
        <AppButton tone="secondary" onPress={onNewSetup}>{copy.newSetup}</AppButton>
      </View>
    );
  }

  return (
    <View style={styles.rematchPanel}>
      <View style={styles.rematchHeader}>
        <View>
          <Text style={styles.rematchTitle}>{copy.rematchSetup}</Text>
          <Text style={styles.rematchText}>{languageLabel(proposal.settings.gameLanguage)} · {copy.fiveLetters}</Text>
        </View>
        <AppButton disabled={!proposal.canCancel} tone="quiet" onPress={onCancel} style={styles.panelButton}>
          {copy.cancel}
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
      <AppButton disabled={!proposal.canSend} onPress={onSend}>{copy.sendRematch}</AppButton>
    </View>
  );
}

function shouldShowOpponentBoard(mode: WordDuelResultMode, result: WordDuelResultViewModel): boolean {
  return mode === 'human_duel' || mode === 'bot_duel' || result.opponent.attemptsUsed > 0;
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
