import { Devvit } from '@devvit/public-api';
import { generateDailyWordsUTC, getTimeUntilNextUTCChallenge, getTodayUTCDateString } from './lib/daily';
import { emojiHints } from './data/wordData';
import { evaluateGuess } from './lib/evaluate';
import { deriveKeyboardStates } from './lib/keyboard';
import { COLORS } from './ui/colors';
import { loadDaily, saveDaily, loadStats, saveStats, loadView, saveView, loadMessage, saveMessage, clearMessage } from './lib/storage';
import type { DailyProgress, Stats, UIView } from './lib/models';
import { generateShareTextUTC } from './lib/share';

// NOTE: This file sets up a custom post type that renders the game UI. In a real Devvit app,
// you will access KV and user info from context (e.g., ctx). Here, we focus on UI structure
// and state transitions; wiring to ctx.kv and ctx.userId will be completed during integration.

Devvit.addCustomPostType({
  name: 'wordmuji',
  description: 'Play WordMuji daily emoji word puzzles',
  render: async (ctx) => {
    const userId = ctx.userId ?? 'anonymous';
    const kv = ctx.kv;

    const today = getTodayUTCDateString();
    const dailyWords = generateDailyWordsUTC(today);

    let progress: DailyProgress | undefined = await loadDaily(kv, userId, today);
    if (!progress) {
      progress = { currentIndex: 0, completed: new Array(10).fill(false), guesses: [], currentGuess: '' };
      await saveDaily(kv, userId, today, progress);
    }

    const index = Math.min(Math.max(progress.currentIndex, 0), 9);
    const secretWord = dailyWords[index] ?? '';
    const completedCount = progress.completed.filter(Boolean).length;
    const currentView: UIView = await loadView(kv, userId, today);
    const message = await loadMessage(kv, userId, today);

    const keyStates = deriveKeyboardStates(secretWord, progress.guesses);

    const maxGuesses = 5;
    const wordLength = secretWord.length || 5;

    const makeTile = (letter: string, state: 'correct' | 'present' | 'absent' | 'empty') => {
      const bg = state === 'correct' ? COLORS.green
        : state === 'present' ? COLORS.brandYellow
        : state === 'absent' ? COLORS.gray
        : `${COLORS.brandBlue}22`;
      const color = state === 'present' ? COLORS.brandBlue : COLORS.white;
      return (
        <box backgroundColor={bg} borderColor={`${COLORS.brandBlue}33`} borderWidth="2" cornerRadius="medium" width="56px" height="56px" alignment="center middle">
          <text size="xlarge" weight="bold" color={state === 'empty' ? COLORS.brandBlue : color}>{letter.toUpperCase()}</text>
        </box>
      );
    };

    const rows = Array.from({ length: maxGuesses }, (_, rowIndex) => {
      const isCompleted = rowIndex < progress!.guesses.length;
      const isCurrent = rowIndex === progress!.guesses.length;
      const rowWord = isCompleted ? progress!.guesses[rowIndex] : (isCurrent ? (progress!.currentGuess ?? '') : '');
      const letters = rowWord.padEnd(wordLength, ' ').split('');
      const states = isCompleted ? evaluateGuess(secretWord, rowWord) : Array.from({ length: wordLength }, () => 'empty' as const);
      return (
        <hstack gap="small" alignment="center">
          {letters.map((ch, i) => makeTile(ch.trim() ? ch : '', (isCompleted ? (states[i] ?? 'empty') : (ch.trim() ? 'empty' : 'empty')) as any))}
        </hstack>
      );
    });

    const kbRows: string[][] = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    const onPressKey = async (key: string) => {
      const p = await loadDaily(kv, userId, today) as DailyProgress;
      if (!p) return;
      const currentSecret = generateDailyWordsUTC(today)[p.currentIndex];
      if (!currentSecret) return;

      if (key === 'ENTER') {
        if ((p.currentGuess ?? '').length !== currentSecret.length) {
          await saveMessage(kv, userId, today, `Word must be ${currentSecret.length} letters`);
          await ctx.refresh();
          return;
        }
        const newGuesses = [...p.guesses, p.currentGuess ?? ''];
        p.guesses = newGuesses;
        p.currentGuess = '';
        await clearMessage(kv, userId, today);

        if (newGuesses[newGuesses.length - 1].toLowerCase() === currentSecret) {
          p.completed[p.currentIndex] = true;
          const s: Stats = await loadStats(kv, userId);
          const guessNumber = newGuesses.length - 1;
          const newStats: Stats = {
            ...s,
            gamesPlayed: s.gamesPlayed + 1,
            gamesWon: s.gamesWon + 1,
            currentStreak: s.currentStreak + 1,
            maxStreak: Math.max(s.maxStreak, s.currentStreak + 1),
            guessDistribution: s.guessDistribution.map((c, i) => i === guessNumber ? c + 1 : c)
          };
          await saveStats(kv, userId, newStats);

          if (p.completed.every(Boolean)) {
            await saveDaily(kv, userId, today, p);
            await saveMessage(kv, userId, today, 'All puzzles complete!');
          } else {
            p.currentIndex = Math.min(p.currentIndex + 1, 9);
            p.guesses = [];
            p.currentGuess = '';
            await saveDaily(kv, userId, today, p);
            await saveMessage(kv, userId, today, `Moving to puzzle ${p.currentIndex + 1}...`);
          }
        } else if (newGuesses.length >= maxGuesses) {
          const s: Stats = await loadStats(kv, userId);
          const newStats: Stats = { ...s, gamesPlayed: s.gamesPlayed + 1, currentStreak: 0 };
          await saveStats(kv, userId, newStats);

          if (p.currentIndex < 9) {
            p.currentIndex += 1;
            p.guesses = [];
            p.currentGuess = '';
            await saveDaily(kv, userId, today, p);
            await saveMessage(kv, userId, today, 'Moving to next puzzle...');
          } else {
            await saveDaily(kv, userId, today, p);
            await saveMessage(kv, userId, today, 'Daily challenge over!');
          }
        } else {
          await saveDaily(kv, userId, today, p);
        }
      } else if (key === 'BACKSPACE') {
        p.currentGuess = (p.currentGuess ?? '').slice(0, -1);
        await saveDaily(kv, userId, today, p);
      } else if (/^[A-Z]$/.test(key)) {
        if ((p.currentGuess ?? '').length < currentSecret.length) {
          p.currentGuess = (p.currentGuess ?? '') + key;
          await saveDaily(kv, userId, today, p);
        }
      }
      await ctx.refresh();
    };

    const keyboard = (
      <vstack gap="xsmall">
        {kbRows.map((row) => (
          <hstack gap="xsmall" alignment="center">
            {row.map((key) => {
              const state = key !== 'ENTER' && key !== 'BACKSPACE' ? keyStates[key] : 'unused';
              const bg = state === 'correct' ? COLORS.green
                : state === 'present' ? COLORS.brandYellow
                : state === 'absent' ? COLORS.gray
                : `${COLORS.brandBlue}22`;
              const fg = state === 'present' ? COLORS.brandBlue : (state === 'unused' ? COLORS.brandBlue : COLORS.white);
              const label = key === 'BACKSPACE' ? '⌫' : key;
              return (
                <button onPress={() => onPressKey(key)} backgroundColor={bg} color={fg} cornerRadius="medium">
                  <text weight="bold">{label}</text>
                </button>
              );
            })}
          </hstack>
        ))}
      </vstack>
    );

    const emojiRow = (
      <hstack gap="small" alignment="center">
        {(emojiHints[secretWord] ?? ['❓', '❓', '❓']).map((e) => (
          <text size="xxlarge">{e}</text>
        ))}
      </hstack>
    );

    const progressBar = (
      <hstack gap="xsmall">
        {Array.from({ length: 10 }).map((_, i) => (
          <box width="100%" height="6px" cornerRadius="small" backgroundColor={progress!.completed[i] ? COLORS.green : (i === index ? COLORS.brandYellow : `${COLORS.brandBlue}33`)} />
        ))}
      </hstack>
    );

    const header = (
      <hstack alignment="center space-between">
        <button onPress={async () => { await saveView(kv, userId, today, 'help'); await ctx.refresh(); }}>
          <text size="large">❓</text>
        </button>
        <vstack alignment="center middle" gap="xxsmall">
          <text size="xxlarge">🆆🅾🆁🅳</text>
          <text size="xxlarge">🅼🆄🅹🅸</text>
        </vstack>
        <hstack gap="xsmall">
          <button onPress={async () => { await saveView(kv, userId, today, 'stats'); await ctx.refresh(); }}>
            <text size="large">📊</text>
          </button>
          <button onPress={async () => { await saveView(kv, userId, today, 'share'); await ctx.refresh(); }}>
            <text size="large">🔗</text>
          </button>
        </hstack>
      </hstack>
    );

    const helpView = (
      <vstack gap="small" padding="small" backgroundColor={COLORS.bg}>
        <text size="xlarge" color={COLORS.brandBlue} weight="bold">How to Play</text>
        <text color={COLORS.brandBlue}>Guess the WordMuji in 5 tries based on the emoji hints.</text>
        <hstack gap="small">
          <text size="xxlarge">🍎</text>
          <text size="xxlarge">🌳</text>
          <text size="xxlarge">🥧</text>
        </hstack>
        <text color={COLORS.brandBlue}>These might hint at "APPLE"</text>
        <vstack gap="xsmall">
          <text weight="bold" color={COLORS.brandBlue}>Letter Feedback</text>
          <hstack gap="xsmall" alignment="center">
            <box width="24px" height="24px" backgroundColor={COLORS.green} />
            <text color={COLORS.brandBlue}>Green: Correct and in the right position</text>
          </hstack>
          <hstack gap="xsmall" alignment="center">
            <box width="24px" height="24px" backgroundColor={COLORS.brandYellow} />
            <text color={COLORS.brandBlue}>Yellow: In the word but wrong position</text>
          </hstack>
          <hstack gap="xsmall" alignment="center">
            <box width="24px" height="24px" backgroundColor={COLORS.gray} />
            <text color={COLORS.brandBlue}>Gray: Not in the word</text>
          </hstack>
        </vstack>
        <button onPress={async () => { await saveView(kv, userId, today, 'game'); await ctx.refresh(); }} backgroundColor={COLORS.brandBlue} color={COLORS.white}>
          <text weight="bold">Back to game</text>
        </button>
      </vstack>
    );

    const stats = await loadStats(kv, userId);
    const winPercentage = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
    const totalGuesses = stats.guessDistribution.reduce((s, c) => s + c, 0);

    const statsView = (
      <vstack gap="medium" padding="small" backgroundColor={COLORS.bg}>
        <text size="xlarge" color={COLORS.brandBlue} weight="bold">Your WordMuji Stats</text>
        <hstack gap="small">
          <vstack padding="small" backgroundColor={`${COLORS.brandBlue}11`} cornerRadius="large">
            <text color={COLORS.brandBlue}>Puzzles</text>
            <text size="xxlarge" color={COLORS.brandBlue} weight="bold">{stats.gamesPlayed}</text>
          </vstack>
          <vstack padding="small" backgroundColor={`#22c55e22`} cornerRadius="large">
            <text color="#16a34a">Success</text>
            <text size="xxlarge" color="#16a34a" weight="bold">{winPercentage}%</text>
          </vstack>
          <vstack padding="small" backgroundColor={`${COLORS.brandYellow}22`} cornerRadius="large">
            <text color={COLORS.brandBlue}>Streak</text>
            <text size="xxlarge" color={COLORS.brandBlue} weight="bold">{stats.currentStreak}</text>
          </vstack>
        </hstack>
        <vstack gap="xsmall">
          <text color={COLORS.brandBlue} weight="bold">Guess Distribution</text>
          {stats.guessDistribution.map((count, index) => {
            const pct = totalGuesses > 0 ? Math.round((count / totalGuesses) * 100) : 0;
            const w = Math.max(pct, 15);
            return (
              <hstack alignment="center" gap="small">
                <text color={COLORS.brandBlue}>{index + 1}</text>
                <box width={`${w}%`} height="24px" cornerRadius="medium" backgroundColor={count > 0 ? COLORS.brandBlue : `${COLORS.brandBlue}22`}>
                  <hstack alignment="center space-between" padding="xsmall">
                    <text color={count > 0 ? COLORS.white : COLORS.brandBlue}>{count}</text>
                    {pct > 0 && <text color={count > 0 ? COLORS.white : COLORS.brandBlue}>{pct}%</text>}
                  </hstack>
                </box>
              </hstack>
            );
          })}
        </vstack>
        <button onPress={async () => { await saveView(kv, userId, today, 'game'); await ctx.refresh(); }} backgroundColor={COLORS.brandBlue} color={COLORS.white}>
          <text weight="bold">Continue Playing</text>
        </button>
      </vstack>
    );

    const shareText = generateShareTextUTC(progress.completed.filter(Boolean).length, 10);
    const shareView = (
      <vstack gap="small" padding="small" backgroundColor={COLORS.bg}>
        <text size="xlarge" color={COLORS.brandBlue} weight="bold">Share Results</text>
        <box padding="small" backgroundColor={`${COLORS.brandBlue}11`} cornerRadius="large">
          <text>{shareText}</text>
        </box>
        <hstack gap="small">
          <button onPress={async () => { await ctx.ui.copyToClipboard?.(shareText); await saveMessage(kv, userId, today, 'Copied to clipboard!'); await ctx.refresh(); }} backgroundColor={COLORS.brandYellow} color={COLORS.brandBlue}>
            <text weight="bold">Copy</text>
          </button>
          <button onPress={async () => { await saveView(kv, userId, today, 'game'); await ctx.refresh(); }} backgroundColor={COLORS.brandBlue} color={COLORS.white}>
            <text weight="bold">Back to game</text>
          </button>
        </hstack>
      </vstack>
    );

    const gameView = (
      <>
        <vstack gap="small" backgroundColor={`${COLORS.brandBlue}11`} cornerRadius="large" padding="small">
          <hstack alignment="center space-between">
            <text color={COLORS.brandBlue}>Puzzle {index + 1} of 10</text>
            <text color={COLORS.brandBlue}>{completedCount}/10 completed</text>
          </hstack>
          {progressBar}
        </vstack>
        <box cornerRadius="large" padding="small" backgroundColor={`${COLORS.brandBlue}11`}>
          {emojiRow}
        </box>
        <vstack gap="small" alignment="center">
          {rows}
        </vstack>
        {message && (
          <box padding="xsmall" cornerRadius="large" backgroundColor={`${COLORS.brandBlue}22`}>
            <text color={COLORS.brandBlue}>{message}</text>
          </box>
        )}
        {keyboard}
        {progress.completed.every(Boolean) && (
          <vstack gap="small" cornerRadius="large" padding="small" backgroundColor={`${COLORS.brandYellow}22`}>
            <text size="xlarge" color={COLORS.brandBlue}>All Puzzles Complete!</text>
            <text color={COLORS.brandBlue}>Next Challenge: {getTimeUntilNextUTCChallenge()}</text>
            <hstack gap="small">
              <button onPress={async () => { await saveView(kv, userId, today, 'stats'); await ctx.refresh(); }} backgroundColor={COLORS.brandBlue} color={COLORS.white}>
                <text weight="bold">View Stats</text>
              </button>
              <button onPress={async () => { await saveView(kv, userId, today, 'share'); await ctx.refresh(); }} backgroundColor={COLORS.brandYellow} color={COLORS.brandBlue}>
                <text weight="bold">Share</text>
              </button>
            </hstack>
          </vstack>
        )}
      </>
    );

    return (
      <vstack padding="medium" gap="medium" backgroundColor={COLORS.bg}>
        {header}
        {currentView === 'help' ? helpView : currentView === 'stats' ? statsView : currentView === 'share' ? shareView : gameView}
      </vstack>
    );
  },
});

export default Devvit;
