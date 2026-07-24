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
import { experienceCopy } from '@/i18n/experience-copy';
import { GAME_LANGUAGES, t, type InterfaceLocale } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork } from '@/ui/brand';
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

type AviDuelCopy = {
  aviSubmits: string;
  botDuel: string;
  close: string;
  couldNotOpenResult: string;
  draw: string;
  home: string;
  issue: string;
  lost: string;
  newChallenge: string;
  noWinner: string;
  normal: string;
  offlineDuel: string;
  openResult: string;
  opening: string;
  opponent: string;
  playAvi: string;
  resultReady: string;
  round: string;
  roundLocked: string;
  solved: string;
  submitted: string;
  thinking: string;
  unavailable: string;
  waitingForAvi: string;
  won: string;
  yourTurn: string;
  reactions: Record<AviBotReactionId, string>;
};

const AVI_DUEL_COPY: Record<InterfaceLocale, AviDuelCopy> = {
  en: { aviSubmits: 'Avi submits', botDuel: 'Local duel', close: 'Close', couldNotOpenResult: 'Could not open result', draw: 'Draw', home: 'Home', issue: 'Issue', lost: 'Lost', newChallenge: 'New challenge', noWinner: 'No winner', normal: 'Normal', offlineDuel: 'Offline duel', openResult: 'Open result', opening: 'Opening…', opponent: 'Opponent', playAvi: 'Play Avi', resultReady: 'Result ready', round: 'Round', roundLocked: 'Round locked', solved: 'Solved', submitted: 'Submitted', thinking: 'Thinking', unavailable: 'Unavailable', waitingForAvi: 'Waiting for Avi', won: 'Won', yourTurn: 'Your turn', reactions: { gg: 'GG', nice: 'Nice', no_pressure: 'No pressure', tick_tock: 'Time', your_turn: 'Your turn' } },
  es: { aviSubmits: 'Avi responde', botDuel: 'Duelo local', close: 'Cerrar', couldNotOpenResult: 'No se pudo abrir el resultado', draw: 'Empate', home: 'Inicio', issue: 'Incidencia', lost: 'Perdiste', newChallenge: 'Nuevo duelo', noWinner: 'Sin ganador', normal: 'Normal', offlineDuel: 'Duelo sin conexión', openResult: 'Abrir resultado', opening: 'Abriendo…', opponent: 'Rival', playAvi: 'Jugar con Avi', resultReady: 'Resultado listo', round: 'Ronda', roundLocked: 'Ronda cerrada', solved: 'Resuelto', submitted: 'Enviado', thinking: 'Pensando', unavailable: 'No disponible', waitingForAvi: 'Esperando a Avi', won: 'Ganaste', yourTurn: 'Tu turno', reactions: { gg: 'GG', nice: 'Bien', no_pressure: 'Sin presión', tick_tock: 'Tiempo', your_turn: 'Tu turno' } },
  ca: { aviSubmits: 'L’Avi respon', botDuel: 'Duel local', close: 'Tancar', couldNotOpenResult: 'No s’ha pogut obrir el resultat', draw: 'Empat', home: 'Inici', issue: 'Incidència', lost: 'Has perdut', newChallenge: 'Duel nou', noWinner: 'Sense guanyador', normal: 'Normal', offlineDuel: 'Duel sense connexió', openResult: 'Obrir resultat', opening: 'Obrint…', opponent: 'Rival', playAvi: 'Jugar amb l’Avi', resultReady: 'Resultat preparat', round: 'Ronda', roundLocked: 'Ronda tancada', solved: 'Resolt', submitted: 'Enviat', thinking: 'Pensant', unavailable: 'No disponible', waitingForAvi: 'Esperant l’Avi', won: 'Has guanyat', yourTurn: 'El teu torn', reactions: { gg: 'GG', nice: 'Bé', no_pressure: 'Sense pressió', tick_tock: 'Temps', your_turn: 'El teu torn' } },
  fr: { aviSubmits: 'Avi répond', botDuel: 'Duel local', close: 'Fermer', couldNotOpenResult: 'Impossible d’ouvrir le résultat', draw: 'Égalité', home: 'Accueil', issue: 'Problème', lost: 'Perdu', newChallenge: 'Nouveau duel', noWinner: 'Aucun gagnant', normal: 'Normal', offlineDuel: 'Duel hors ligne', openResult: 'Ouvrir le résultat', opening: 'Ouverture…', opponent: 'Rival', playAvi: 'Jouer contre Avi', resultReady: 'Résultat prêt', round: 'Manche', roundLocked: 'Manche terminée', solved: 'Résolu', submitted: 'Envoyé', thinking: 'Réflexion', unavailable: 'Indisponible', waitingForAvi: 'En attente d’Avi', won: 'Gagné', yourTurn: 'À vous', reactions: { gg: 'GG', nice: 'Bien joué', no_pressure: 'Sans pression', tick_tock: 'Temps', your_turn: 'À vous' } },
  de: { aviSubmits: 'Avi antwortet', botDuel: 'Lokales Duell', close: 'Schließen', couldNotOpenResult: 'Ergebnis konnte nicht geöffnet werden', draw: 'Unentschieden', home: 'Start', issue: 'Problem', lost: 'Verloren', newChallenge: 'Neues Duell', noWinner: 'Kein Gewinner', normal: 'Normal', offlineDuel: 'Offline-Duell', openResult: 'Ergebnis öffnen', opening: 'Wird geöffnet…', opponent: 'Gegner', playAvi: 'Gegen Avi spielen', resultReady: 'Ergebnis bereit', round: 'Runde', roundLocked: 'Runde beendet', solved: 'Gelöst', submitted: 'Gesendet', thinking: 'Denkt nach', unavailable: 'Nicht verfügbar', waitingForAvi: 'Warten auf Avi', won: 'Gewonnen', yourTurn: 'Du bist dran', reactions: { gg: 'GG', nice: 'Gut', no_pressure: 'Kein Druck', tick_tock: 'Zeit', your_turn: 'Du bist dran' } },
};

export function PlayAviScreen({ initialGameLanguage = 'en' }: PlayAviScreenProps) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compactViewport = width <= 480 && height <= 900;
  const [{ interfaceLocale }] = useAppPreferences();
  const copy = experienceCopy(interfaceLocale);
  const duelCopy = AVI_DUEL_COPY[interfaceLocale];
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
  const tileSize = compactViewport ? Math.min(34, regularTileSize) : regularTileSize;

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
      setMessage(rejectionMessage(result.rejection, interfaceLocale, duelCopy));
      return;
    }

    setSession(result.session);
    setInput('');
    setMessage(duelCopy.waitingForAvi);
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
      setMessage(duelCopy.couldNotOpenResult);
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
          <Text style={styles.kicker}>{duelCopy.offlineDuel}</Text>
          <Text style={styles.title}>{duelCopy.playAvi}</Text>
        </View>
        <AppButton tone="quiet" onPress={() => router.back()}>
          {duelCopy.close}
        </AppButton>
      </View>

      <View style={styles.gameSettings}>
        <Text style={styles.gameSettingsLabel}>⚙︎ {copy.gameSettings} · {copy.gameLanguage}</Text>
        <View style={styles.languageRow}>
          {GAME_LANGUAGES.map((language) => {
            const selected = language.code === gameLanguage;
            return (
              <Pressable
                key={language.code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => changeLanguage(language.code)}
                style={[styles.languageButton, selected && styles.languageButtonSelected]}>
                <Text style={[styles.languageText, selected && styles.languageTextSelected]}>
                  {language.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.timerRow, compactViewport && styles.timerRowCompact]}>
        <View>
          <Text style={styles.metaLabel}>{duelCopy.round}</Text>
          <Text style={styles.metaValue}>
            {viewModel.roundNumber}/{viewModel.maxAttempts}
          </Text>
        </View>
        <View style={[styles.timerPill, compactViewport && styles.timerPillCompact]}>
          <Text style={styles.timerText}>{viewModel.remainingSeconds}s</Text>
        </View>
        <View style={styles.sideBlock}>
          <Text style={styles.metaLabel}>{t(interfaceLocale, 'gameLanguage')}</Text>
          <Text style={styles.metaValue}>{viewModel.gameLanguage.toUpperCase()}</Text>
        </View>
      </View>

      <OpponentSummary
        activeReaction={activeReaction}
        compact={compactViewport}
        markers={viewModel.opponent.attemptMarkers}
        roundState={viewModel.opponent.roundState}
        copy={duelCopy}
      />

      <WordDuelBoard
        accessibilityLabel="Play Avi local board"
        density={compactViewport ? 'compact' : 'regular'}
        rows={boardRows}
        tileSize={tileSize}
      />

      <View style={[styles.stateRow, compactViewport && styles.stateRowCompact]}>
        <Text style={styles.stateLabel}>{stateLabel(viewModel.phase, viewModel.status, duelCopy)}</Text>
        <Text style={styles.stateDetail}>{message || detailLabel(viewModel.phase, viewModel.status, duelCopy)}</Text>
      </View>

      {viewModel.canResolveRound ? (
        <AppButton onPress={resolveRound}>{duelCopy.aviSubmits}</AppButton>
      ) : null}

      {viewModel.targetReveal.visible && viewModel.targetReveal.displayWord ? (
        <View style={styles.resultLine}>
          <Text style={styles.resultLabel}>{resultLabel(viewModel.status, duelCopy)}</Text>
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

      {viewModel.status !== 'active' ? (
        <View style={styles.actionRow}>
          <AppButton
            disabled={isOpeningResult}
            onPress={() => {
              void openResult();
            }}
            style={styles.actionButton}>
            {isOpeningResult ? duelCopy.opening : duelCopy.openResult}
          </AppButton>
          <AppButton onPress={newChallenge} style={styles.actionButton}>
            {duelCopy.newChallenge}
          </AppButton>
          <AppButton tone="quiet" onPress={() => router.push('/')} style={styles.actionButton}>
            {duelCopy.home}
          </AppButton>
        </View>
      ) : null}

      <ReactionTray
        activeReaction={activeReaction}
        compact={compactViewport}
        onReactionPress={(reaction) => setActiveReaction(reaction)}
        reactions={viewModel.availableReactions}
        copy={duelCopy}
      />

      <WordDuelKeyboard
        density={compactViewport ? 'compact' : 'regular'}
        disabled={!viewModel.isInputOpen}
        feedbackByKey={viewModel.ownKeyboardFeedback}
        interfaceLocale={interfaceLocale}
        keyRows={WORD_DUEL_KEY_ROWS[viewModel.gameLanguage]}
        onKeyPress={handleKey}
      />
    </AppScreen>
  );
}

function OpponentSummary({
  activeReaction,
  compact,
  copy,
  markers,
  roundState,
}: {
  activeReaction: AviBotReactionId | null;
  compact: boolean;
  copy: AviDuelCopy;
  markers: readonly AviBotOpponentMarkerState[];
  roundState: AviBotOpponentMarkerState;
}) {
  const styles = usePlayAviStyles();
  return (
    <View style={[styles.opponentStrip, compact && styles.opponentStripCompact]}>
      <View style={styles.opponentTopRow}>
        <View style={styles.opponentIdentity}>
          <AviArtwork size={compact ? 42 : 54} />
          <View>
            <Text style={styles.metaLabel}>{copy.opponent}</Text>
            <Text style={[styles.opponentName, compact && styles.opponentNameCompact]}>Avi · {copy.normal}</Text>
          </View>
        </View>
        <View style={[styles.presencePill, compact && styles.presencePillCompact]}>
          <Text style={styles.presenceText}>{opponentStateLabel(roundState, copy)}</Text>
        </View>
      </View>
      <View style={styles.markerRow}>
        {markers.map((marker, index) => (
          <View key={`avi-marker-${index}`} style={[styles.marker, compact && styles.markerCompact, markerStyle(marker, styles)]}>
            <Text style={styles.markerText}>{markerLabel(marker)}</Text>
          </View>
        ))}
      </View>
      {activeReaction ? (
        <View style={styles.reactionBubble}>
          <Text style={styles.reactionBubbleText}>{copy.reactions[activeReaction]}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReactionTray({
  activeReaction,
  compact,
  copy,
  onReactionPress,
  reactions,
}: {
  activeReaction: AviBotReactionId | null;
  compact: boolean;
  copy: AviDuelCopy;
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
              {copy.reactions[reaction]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function rejectionMessage(rejection: GuessRejection, locale: InterfaceLocale, copy: AviDuelCopy): string {
  if (rejection === 'not_enough_letters') {
    return t(locale, 'notEnoughLetters');
  }
  if (rejection === 'too_many_letters') {
    return t(locale, 'tooManyLetters');
  }
  if (rejection === 'game_over') {
    return copy.roundLocked;
  }
  return t(locale, 'invalidWord');
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

function opponentStateLabel(state: AviBotOpponentMarkerState, copy: AviDuelCopy): string {
  if (state === 'solved') {
    return copy.solved;
  }
  if (state === 'failed') {
    return copy.resultReady;
  }
  if (state === 'submitted') {
    return copy.submitted;
  }
  if (state === 'technical_error') {
    return copy.issue;
  }
  return copy.thinking;
}

function stateLabel(phase: string, status: string, copy: AviDuelCopy): string {
  if (status !== 'active') {
    return resultLabel(status, copy);
  }
  if (phase === 'waiting_for_avi') {
    return copy.submitted;
  }
  return copy.yourTurn;
}

function detailLabel(phase: string, status: string, copy: AviDuelCopy): string {
  if (status !== 'active') {
    return copy.resultReady;
  }
  if (phase === 'waiting_for_avi') {
    return copy.thinking;
  }
  return copy.botDuel;
}

function resultLabel(status: string, copy: AviDuelCopy): string {
  if (status === 'won') {
    return copy.won;
  }
  if (status === 'lost') {
    return copy.lost;
  }
  if (status === 'draw') {
    return copy.draw;
  }
  if (status === 'technical_error_bot') {
    return copy.unavailable;
  }
  return copy.noWinner;
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
  gameSettings: { gap: spacing.xs },
  gameSettingsLabel: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
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
  timerRowCompact: {
    minHeight: 48,
    paddingHorizontal: spacing.sm,
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
  timerPillCompact: {
    minWidth: 64,
    minHeight: 32,
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
  opponentStripCompact: {
    gap: spacing.xs,
    padding: spacing.sm,
  },
  opponentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  opponentIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  opponentName: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: '900',
  },
  opponentNameCompact: {
    fontSize: typeScale.body,
  },
  presencePill: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
  },
  presencePillCompact: {
    minHeight: 26,
    paddingHorizontal: spacing.sm,
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
  markerCompact: {
    height: 18,
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
  stateRowCompact: {
    minHeight: 36,
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
