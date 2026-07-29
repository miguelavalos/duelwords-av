import { Redirect } from 'expo-router';

import { ConnectedResultPanel } from '@/features/word-duel/public-challenge-screen';
import type {
  DuelWordsApiFinalResult,
  DuelWordsApiRematchProposal,
} from '@/game/word-duel-lobby/api-client';

export default function ConnectedResultDemoRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ConnectedResultDevelopmentRoute />;
}

function ConnectedResultDevelopmentRoute() {
  return (
    <ConnectedResultPanel
      busy={false}
      finalResult={DEMO_RESULT}
      interfaceLocale="en"
      onClose={() => undefined}
      onCreateRematch={() => undefined}
      onRespond={() => undefined}
      proposal={DEMO_REMATCH}
      statusMessage={null}
    />
  );
}

const DEMO_RESULT: DuelWordsApiFinalResult = {
  game: {
    countdownEndsAt: null,
    currentRound: 3,
    gameId: 'demo-game',
    language: 'en',
    maxAttempts: 6,
    mode: 'human_duel',
    players: [],
    roomToken: 'demo-room',
    roundDeadlineAt: null,
    status: 'finalized',
    wordLength: 5,
  },
  opponent: {
    attemptsUsed: 2,
    guesses: [
      scoredGuess(1, 'stale', ['present', 'absent', 'absent', 'correct', 'absent']),
      scoredGuess(2, 'blush', ['absent', 'present', 'absent', 'present', 'absent']),
    ],
    safeDisplayName: 'Guest D7B8',
    side: 'b',
    solved: false,
  },
  own: {
    attemptsUsed: 3,
    guesses: [
      scoredGuess(1, 'stale', ['present', 'absent', 'absent', 'correct', 'absent']),
      scoredGuess(2, 'blush', ['absent', 'present', 'absent', 'present', 'absent']),
      scoredGuess(3, 'pride', ['absent', 'absent', 'present', 'absent', 'absent']),
    ],
    safeDisplayName: 'Guest 2261',
    side: 'a',
    solved: false,
  },
  result: {
    finalizedAt: '2026-07-29T14:42:00.000Z',
    resultReason: 'attempts_exhausted',
    targetDisplayWord: 'gills',
    winnerSide: 'draw',
  },
  viewer: {
    outcome: 'draw',
    playerId: 'player-a',
    side: 'a',
  },
};

const DEMO_REMATCH: DuelWordsApiRematchProposal = {
  createdAt: '2026-07-29T14:43:00.000Z',
  expiresAt: '2026-07-29T14:44:00.000Z',
  nextGame: null,
  owner: { playerId: 'player-b', safeDisplayName: 'Guest D7B8', side: 'b' },
  previousGameId: 'demo-game',
  proposalId: 'demo-rematch',
  recipient: { playerId: 'player-a', safeDisplayName: 'Guest 2261', side: 'a' },
  remainingSeconds: 42,
  respondedAt: null,
  settings: { language: 'en', maxAttempts: 6, wordLength: 5 },
  status: 'sent',
  viewer: {
    canAccept: true,
    canCancel: false,
    canDecline: true,
    playerId: 'player-a',
    role: 'recipient',
    side: 'a',
  },
};

function scoredGuess(
  roundNumber: number,
  displayWord: string,
  states: ('absent' | 'correct' | 'present')[],
) {
  return {
    displayWord,
    feedback: {
      isCorrect: false,
      states,
      version: 'duelwords-feedback-v1' as const,
      wordLength: 5,
    },
    roundNumber,
    status: 'accepted' as const,
    submittedAt: '2026-07-29T14:40:00.000Z',
  };
}
