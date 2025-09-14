import { Devvit } from '@devvit/public-api';
import { generateDailyWordsUTC, getTimeUntilNextUTCChallenge, getTodayUTCDateString } from './lib/daily';
import { emojiHints } from './data/wordData';
import { evaluateGuess } from './lib/evaluate';
import { deriveKeyboardStates } from './lib/keyboard';
import { COLORS } from './ui/colors';
import { loadDaily, saveDaily, loadStats, saveStats } from './lib/storage';
import type { DailyProgress, Stats } from './lib/models';

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

    // Keyboard state from past guesses
    const keyStates = deriveKeyboardStates(secretWord, progress.guesses);

    // Helpers
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

      // Evaluate only completed rows
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
          await ctx.ui.showToast(`Word must be ${currentSecret.length} letters`);
          return;
        }
        const newGuesses = [...p.guesses, p.currentGuess ?? ''];
        p.guesses = newGuesses;
        p.currentGuess = '';

        if (newGuesses[newGuesses.length - 1].toLowerCase() === currentSecret) {
          // Win
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

          // Move to next or finish
          if (p.completed.every(Boolean)) {
            await saveDaily(kv, userId, today, p);
            await ctx.ui.showToast('All puzzles complete!');
          } else {
            p.currentIndex = Math.min(p.currentIndex + 1, 9);
            p.guesses = [];
            p.currentGuess = '';
            await saveDaily(kv, userId, today, p);
            await ctx.ui.showToast(`Moving to puzzle ${p.currentIndex + 1}...`);
          }
        } else if (newGuesses.length >= maxGuesses) {
          // Loss
          const s: Stats = await loadStats(kv, userId);
          const newStats: Stats = { ...s, gamesPlayed: s.gamesPlayed + 1, currentStreak: 0 };
          await saveStats(kv, userId, newStats);

          if (p.currentIndex < 9) {
            p.currentIndex += 1;
            p.guesses = [];
            p.currentGuess = '';
            await saveDaily(kv, userId, today, p);
            await ctx.ui.showToast('Moving to next puzzle...');
          } else {
            await saveDaily(kv, userId, today, p);
            await ctx.ui.showToast('Daily challenge over!');
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

    return (
      <vstack padding="medium" gap="medium" backgroundColor={COLORS.bg}>
        {/* Header */}
        <hstack alignment="center space-between">
          <button onPress={() => ctx.ui.showToast('How to play will be added shortly')}>
            <text size="large">❓</text>
          </button>
          <vstack alignment="center middle" gap="xxsmall">
            <text size="xxlarge">🆆🅾🆁🅳</text>
            <text size="xxlarge">🅼🆄🅹🅸</text>
          </vstack>
          <button onPress={() => ctx.ui.showToast('Stats will be added shortly')}>
            <text size="large">📊</text>
          </button>
        </hstack>

        {/* Progress */}
        <vstack gap="small" backgroundColor={`${COLORS.brandBlue}11`} cornerRadius="large" padding="small">
          <hstack alignment="center space-between">
            <text color={COLORS.brandBlue}>Puzzle {index + 1} of 10</text>
            <text color={COLORS.brandBlue}>{completedCount}/10 completed</text>
          </hstack>
          {progressBar}
        </vstack>

        {/* Emoji hints */}
        <box cornerRadius="large" padding="small" backgroundColor={`${COLORS.brandBlue}11`}>
          {emojiRow}
        </box>

        {/* Board */}
        <vstack gap="small" alignment="center">
          {rows}
        </vstack>

        {/* Keyboard */}
        {keyboard}

        {/* Footer message placeholder */}
        <text color={COLORS.brandBlue}></text>

        {/* Completion footer when done */}
        {progress.completed.every(Boolean) && (
          <vstack gap="small" cornerRadius="large" padding="small" backgroundColor={`${COLORS.brandYellow}22`}>
            <text size="xlarge" color={COLORS.brandBlue}>All Puzzles Complete!</text>
            <text color={COLORS.brandBlue}>Next Challenge: {getTimeUntilNextUTCChallenge()}</text>
          </vstack>
        )}
      </vstack>
    );
  },
});

export default Devvit;
