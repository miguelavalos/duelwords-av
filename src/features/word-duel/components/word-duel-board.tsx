import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LetterFeedback } from '@/game/word-duel-engine';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';

export type WordDuelBoardRowState =
  | 'current'
  | 'editing'
  | 'empty'
  | 'revealed'
  | 'scored'
  | 'submitted_pending'
  | 'timeout';

export type WordDuelBoardCell = {
  feedback: LetterFeedback | null;
  letter: string | null;
};

export type WordDuelBoardRow = {
  cells: WordDuelBoardCell[];
  state: WordDuelBoardRowState;
};

type WordDuelBoardProps = {
  accessibilityLabel: string;
  density?: 'regular' | 'compact';
  rows: readonly WordDuelBoardRow[];
  showSubmittedPendingMark?: boolean;
  tileSize: number;
};

export function WordDuelBoard({
  accessibilityLabel,
  density = 'regular',
  rows,
  showSubmittedPendingMark = false,
  tileSize,
}: WordDuelBoardProps) {
  const styles = useWordDuelBoardStyles();
  const compact = density === 'compact';

  return (
    <View style={[styles.board, compact && styles.boardCompact]} accessibilityLabel={accessibilityLabel}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.boardRow, compact && styles.boardRowCompact]}>
          {row.cells.map((cell, columnIndex) => (
            <View
              key={`tile-${rowIndex}-${columnIndex}`}
              style={[
                styles.tile,
                compact && styles.tileCompact,
                { width: tileSize, height: tileSize },
                (row.state === 'current' || row.state === 'editing') && styles.tileCurrent,
                row.state === 'submitted_pending' && styles.tilePending,
                row.state === 'timeout' && styles.tileTimeout,
                cell.feedback === 'exact' && styles.tileExact,
                cell.feedback === 'present' && styles.tilePresent,
                cell.feedback === 'absent' && styles.tileAbsent,
              ]}>
              <Text
                style={[
                  styles.tileLetter,
                  compact && styles.tileLetterCompact,
                  cell.feedback && styles.tileLetterScored,
                ]}>
                {cell.letter ?? ''}
              </Text>
              {cell.feedback ? <Text style={styles.feedbackMark}>{feedbackMarker(cell.feedback)}</Text> : null}
              {showSubmittedPendingMark && row.state === 'submitted_pending' && columnIndex === 0 ? (
                <Text style={styles.pendingMark}>...</Text>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function feedbackMarker(feedback: LetterFeedback): string {
  if (feedback === 'exact') {
    return '=';
  }
  if (feedback === 'present') {
    return '~';
  }
  return 'x';
}

function useWordDuelBoardStyles() {
  const { colors } = useAppTheme();

  return useMemo(() => StyleSheet.create({
  board: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  boardCompact: {
    gap: spacing.xs,
  },
  boardRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  boardRowCompact: {
    gap: spacing.xs,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.feedbackPending,
  },
  tileCompact: {
    borderRadius: radii.sm,
  },
  tileCurrent: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  tilePending: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  tileTimeout: {
    borderColor: colors.pressure,
    backgroundColor: colors.pressureSoft,
  },
  tileExact: {
    borderColor: colors.feedbackExact,
    backgroundColor: colors.feedbackExact,
  },
  tilePresent: {
    borderColor: colors.feedbackPresent,
    backgroundColor: colors.feedbackPresent,
  },
  tileAbsent: {
    borderColor: colors.feedbackAbsent,
    backgroundColor: colors.feedbackAbsent,
  },
  tileLetter: {
    color: colors.text,
    fontSize: typeScale.subtitle,
    fontWeight: '900',
  },
  tileLetterCompact: {
    fontSize: typeScale.lead,
  },
  tileLetterScored: {
    color: colors.onAccent,
  },
  feedbackMark: {
    position: 'absolute',
    right: 5,
    bottom: 3,
    color: colors.onAccent,
    fontSize: typeScale.tiny,
    fontWeight: '900',
  },
  pendingMark: {
    position: 'absolute',
    right: 5,
    bottom: 2,
    color: colors.secondary,
    fontSize: typeScale.tiny,
    fontWeight: '900',
  },
  }), [colors]);
}
