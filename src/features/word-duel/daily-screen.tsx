import { getDuelWordsAppsApiRuntimeConfig } from '@/config/expo-apps-api';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  applyOfficialDailyGuess,
  createSafeOfficialDailyShare,
  localDateForTimeZone,
  OfficialDailyLoader,
  readOfficialDailySession,
  readOfficialDailyStats,
  type OfficialDailySession,
} from '@/game/word-duel-daily/official-daily';
import {
  normalizeGuess,
  type GameLanguage,
  type GuessRejection,
} from '@/game/word-duel-engine';
import { createDuelWordsRuntimeApiClient } from '@/game/word-duel-lobby/runtime-api-client';
import { experienceCopy } from '@/i18n/experience-copy';
import { gameLanguageLabel, t, type InterfaceLocale } from '@/i18n/locales';
import { useAppPreferences } from '@/preferences/use-app-preferences';
import { AppScreen } from '@/ui/app-screen';
import { AppButton } from '@/ui/buttons';
import { AviArtwork, InkEyebrow, PaperCard } from '@/ui/brand';
import { InteriorScreenHeader, ScreenInfoButton } from '@/ui/screen-navigation';
import { radii, spacing, typeScale, useAppTheme } from '@/ui/theme';
import { createKeyboardFeedbackFromGuesses, createRowsFromLocalWordDuelState } from './components/word-duel-ui-model';
import { GameLanguagePicker } from './components/game-language-picker';
import { useWordDuelInputBuffer } from './components/use-word-duel-input-buffer';
import { WordDuelBoard } from './components/word-duel-board';
import { WordDuelKeyboard, WORD_DUEL_KEY_ROWS } from './components/word-duel-keyboard';
import { dailyCopy } from './daily-copy';
import { buildWordDuelHref, WORD_DUEL_ROUTE_PATHS } from './word-duel-route-params';

const DEVICE_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const DAILY_API_BUNDLE = createDuelWordsRuntimeApiClient({
  platform: apiPlatform(),
  runtimeConfig: getDuelWordsAppsApiRuntimeConfig(),
});
const DAILY_LOADER = DAILY_API_BUNDLE.ok ? new OfficialDailyLoader(DAILY_API_BUNDLE.client) : null;
const DAILY_DATE_FORMATTERS: Record<InterfaceLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }),
  es: new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeZone: 'UTC' }),
  ca: new Intl.DateTimeFormat('ca', { dateStyle: 'medium', timeZone: 'UTC' }),
  fr: new Intl.DateTimeFormat('fr', { dateStyle: 'medium', timeZone: 'UTC' }),
  de: new Intl.DateTimeFormat('de', { dateStyle: 'medium', timeZone: 'UTC' }),
};

type DailyScreenProps = {
  initialGameLanguage?: GameLanguage;
};

export function DailyScreen({ initialGameLanguage = 'en' }: DailyScreenProps) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const compact = width <= 480 && height <= 900;
  const tablet = width >= 760;
  const [{ interfaceLocale }] = useAppPreferences();
  const commonCopy = experienceCopy(interfaceLocale);
  const copy = dailyCopy(interfaceLocale);
  const styles = useStyles();
  const dateFormatter = DAILY_DATE_FORMATTERS[interfaceLocale];
  const timeZone = DEVICE_TIME_ZONE;
  const loader = DAILY_LOADER;
  const requestController = useRef<AbortController | null>(null);
  const inputBuffer = useWordDuelInputBuffer();
  const [gameLanguage, setGameLanguage] = useState<GameLanguage>(initialGameLanguage);
  const [session, setSession] = useState<OfficialDailySession | null>(() => cachedSession(initialGameLanguage, timeZone));
  const [isLoading, setIsLoading] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => {
    const controller = requestController.current;
    requestController.current = null;
    controller?.abort();
  }, []);

  const rows = session ? createRowsFromLocalWordDuelState(session.state, inputBuffer.input) : [];
  const feedback = session ? createKeyboardFeedbackFromGuesses(session.state.guesses) : {};
  const stats = readOfficialDailyStats(gameLanguage);
  const boardWidth = Math.min(width - spacing.lg * 2, tablet ? 420 : 340);
  const regularTileSize = Math.max(42, Math.min(tablet ? 68 : 56, Math.floor((boardWidth - spacing.sm * 4) / 5)));
  const tileSize = compact ? Math.min(46, regularTileSize) : regularTileSize;

  function changeLanguage(language: GameLanguage) {
    setGameLanguage(language);
    setSession(cachedSession(language, timeZone));
    inputBuffer.clear();
    setMessage('');
  }

  function startOrResume() {
    if (!loader || isLoading) return;
    const controller = new AbortController();
    requestController.current = controller;
    setIsLoading(true);
    setMessage('');
    void loader.load({
        language: gameLanguage,
        signal: controller.signal,
        timeZone,
      })
      .then((loaded) => setSession(loaded.session))
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setMessage(copy.unavailableDetail);
        }
      })
      .finally(() => {
        if (requestController.current !== controller) return;
        requestController.current = null;
        setIsLoading(false);
      });
  }

  function handleKey(key: string) {
    if (!session || session.state.status !== 'playing') return;
    if (key === 'DEL') {
      inputBuffer.deleteLast();
      setMessage('');
      return;
    }
    if (key === 'ENTER') {
      submit();
      return;
    }
    const normalized = normalizeGuess(key, session.language);
    if (normalized) {
      inputBuffer.append(normalized);
      setMessage('');
    }
  }

  function submit() {
    if (!session) return;
    const result = applyOfficialDailyGuess({
      input: inputBuffer.read(),
      now: new Date(),
      session,
    });
    if (!result.accepted) {
      setMessage(rejectionMessage(result.rejection, interfaceLocale));
      return;
    }
    setSession(result.session);
    inputBuffer.clear();
    setMessage('');
  }

  async function shareResult() {
    if (!session || session.state.status === 'playing') return;
    try {
      await Share.share({ message: createSafeOfficialDailyShare(session) });
    } catch {
      setMessage(copy.sharingError);
    }
  }

  const playing = session?.state.status === 'playing';
  const finished = session && !playing;
  const sessionDetail = session
    ? `${gameLanguageLabel(session.language)} · ${session.state.guesses.length}/${session.state.maxAttempts}`
    : undefined;

  return (
    <AppScreen
      bottomInset={session ? spacing.sm : compact ? spacing.md : spacing.xxl}
      contentGap={session ? spacing.sm : compact ? spacing.md : spacing.lg}>
      <InteriorScreenHeader
        backLabel={t(interfaceLocale, 'back')}
        detail={sessionDetail}
        onBack={() => router.back()}
        title={session ? copy.eyebrow : undefined}
        trailing={session ? (
          <ScreenInfoButton
            accessibilityLabel={showGameInfo ? copy.hideInformation : copy.information}
            expanded={showGameInfo}
            onPress={() => setShowGameInfo((visible) => !visible)}
          />
        ) : undefined}
      />

      {!session ? (
        <>
          <View style={styles.hero}>
            <AviArtwork size={94} />
            <View style={styles.heroCopy}>
              <InkEyebrow>{copy.eyebrow}</InkEyebrow>
              <Text accessibilityRole="header" aria-level={1} style={styles.title}>{copy.title}</Text>
              <Text style={styles.detail}>{copy.detail}</Text>
            </View>
          </View>

          <GameLanguagePicker
            dismissLabel={t(interfaceLocale, 'done')}
            label={commonCopy.gameLanguage}
            onChange={changeLanguage}
            value={gameLanguage}
          />
        </>
      ) : null}

      {session && showGameInfo ? (
        <PaperCard>
          <View style={styles.infoRow}>
            <View style={styles.flexCopy}>
              <Text style={styles.statusLabel}>{copy.today}</Text>
              <Text style={styles.statusValue}>{dateFormatter.format(new Date(`${session.dailyDate}T12:00:00.000Z`))}</Text>
            </View>
            <View style={styles.infoLanguage}>
              <Text style={styles.statusLabel}>{commonCopy.gameLanguage}</Text>
              <Text style={styles.statusValue}>{gameLanguageLabel(session.language)}</Text>
            </View>
          </View>
          <Text style={styles.privacy}>{copy.privacy}</Text>
        </PaperCard>
      ) : null}

      {!session ? (
        <>
          <PaperCard emphasized>
            <View style={styles.aviBrief}>
              <View style={styles.calendarMark}><Text style={styles.calendarNumber}>{new Date().getDate()}</Text></View>
              <View style={styles.flexCopy}>
                <Text style={styles.cardTitle}>{copy.aviTitle}</Text>
                <Text style={styles.cardDetail}>{copy.aviDetail}</Text>
              </View>
            </View>
            <Text style={styles.privacy}>{copy.privacy}</Text>
            <AppButton disabled={isLoading || !loader} onPress={() => { void startOrResume(); }}>
              {isLoading ? copy.loading : copy.start}
            </AppButton>
          </PaperCard>
          {message || !loader ? (
            <PaperCard>
              <Text style={styles.cardTitle}>{copy.unavailableTitle}</Text>
              <Text style={styles.cardDetail}>{message || copy.unavailableDetail}</Text>
              {loader ? <AppButton tone="quiet" onPress={() => { void startOrResume(); }}>{copy.tryAgain}</AppButton> : null}
            </PaperCard>
          ) : null}
          <StatsCard copy={copy} stats={stats} />
        </>
      ) : (
        <>
          <WordDuelBoard
            accessibilityLabel={copy.boardLabel}
            density={compact ? 'compact' : 'regular'}
            rows={rows}
            tileSize={tileSize}
          />

          {message ? <View style={styles.messageArea}><Text style={styles.errorText}>{message}</Text></View> : null}

          {finished ? (
            <PaperCard emphasized>
              <InkEyebrow>{session.state.status === 'won' ? copy.solvedTitle : copy.failedTitle}</InkEyebrow>
              <Text style={styles.resultDetail}>{session.state.status === 'won' ? copy.solvedDetail : copy.failedDetail}</Text>
              <Text style={styles.targetLabel}>{copy.targetLabel}</Text>
              <Text style={styles.targetWord}>{session.targetDisplayWord.toLocaleUpperCase(session.language)}</Text>
              <View style={styles.actionRow}>
                <AppButton onPress={() => { void shareResult(); }} style={styles.actionButton}>{copy.share}</AppButton>
                <AppButton
                  tone="quiet"
                  onPress={() => router.replace(buildWordDuelHref(WORD_DUEL_ROUTE_PATHS.practice, { gameLanguage: session.language, mode: 'practice' }))}
                  style={styles.actionButton}>
                  {copy.practice}
                </AppButton>
              </View>
            </PaperCard>
          ) : null}

          {finished ? <StatsCard copy={copy} stats={readOfficialDailyStats(session.language)} /> : null}

          {playing ? (
            <WordDuelKeyboard
              density={compact ? 'compact' : 'regular'}
              disabled={false}
              feedbackByKey={feedback}
              interfaceLocale={interfaceLocale}
              keyRows={WORD_DUEL_KEY_ROWS[session.language]}
              onKeyPress={handleKey}
            />
          ) : null}
        </>
      )}
    </AppScreen>
  );
}

function StatsCard({ copy, stats }: { copy: ReturnType<typeof dailyCopy>; stats: ReturnType<typeof readOfficialDailyStats> }) {
  const styles = useStyles();
  return (
    <PaperCard>
      <Text style={styles.cardTitle}>{copy.statsTitle}</Text>
      <View style={styles.statsRow}>
        <Stat label={copy.streak} value={`${stats.currentStreak}`} />
        <Stat label={copy.completed} value={`${stats.completed}`} />
        <Stat label={copy.solved} value={`${stats.solved}`} />
        <Stat label={copy.failed} value={`${stats.failed}`} />
        <Stat label={copy.best} value={stats.bestAttempts === null ? '—' : `${stats.bestAttempts}/6`} />
      </View>
    </PaperCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function cachedSession(language: GameLanguage, timeZone: string) {
  return readOfficialDailySession({
    dailyDate: localDateForTimeZone(new Date(), timeZone),
    language,
    timeZone,
  });
}

function apiPlatform() {
  return Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : undefined;
}

function rejectionMessage(rejection: GuessRejection, locale: Parameters<typeof t>[0]): string {
  if (rejection === 'not_enough_letters') return t(locale, 'notEnoughLetters');
  if (rejection === 'too_many_letters') return t(locale, 'tooManyLetters');
  if (rejection === 'game_over') return t(locale, 'gameFinished');
  return t(locale, 'invalidWord');
}

function useStyles() {
  const { colors } = useAppTheme();
  return StyleSheet.create({
    hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    heroCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    title: { color: colors.text, fontFamily: 'Georgia', fontSize: 35, lineHeight: 39, fontWeight: '700', letterSpacing: -1 },
    detail: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 23 },
    aviBrief: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    calendarMark: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.surfaceStrong, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    calendarNumber: { color: colors.accent, fontFamily: 'Georgia', fontSize: typeScale.title, fontWeight: '700' },
    flexCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
    cardTitle: { color: colors.text, fontFamily: 'Georgia', fontSize: typeScale.lead, fontWeight: '700' },
    cardDetail: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22 },
    privacy: { color: colors.textMuted, fontSize: typeScale.small, lineHeight: 19 },
    infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    infoLanguage: { flex: 1, alignItems: 'flex-end' },
    statusLabel: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
    statusValue: { color: colors.text, fontSize: typeScale.body, fontWeight: '900', fontVariant: ['tabular-nums'] },
    messageArea: { minHeight: 24, justifyContent: 'center' },
    errorText: { color: colors.danger, fontSize: typeScale.body, fontWeight: '800', textAlign: 'center' },
    resultDetail: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 22 },
    targetLabel: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '900', textTransform: 'uppercase' },
    targetWord: { color: colors.accent, fontFamily: 'Georgia', fontSize: 32, fontWeight: '700', letterSpacing: 1.5 },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    actionButton: { flexBasis: 150, flexGrow: 1 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    stat: { minWidth: 82, flexGrow: 1, padding: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.surfaceSoft },
    statValue: { color: colors.text, fontSize: typeScale.lead, fontWeight: '900' },
    statLabel: { color: colors.textMuted, fontSize: typeScale.tiny, fontWeight: '800' },
  });
}
