import type { CellState } from './evaluate';

export type KeyState = 'correct' | 'present' | 'absent' | 'unused';

export function deriveKeyboardStates(secretWord: string, guesses: string[]): Record<string, KeyState> {
  const states: Record<string, KeyState> = {};
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((k) => (states[k] = 'unused'));

  const upperSecret = secretWord.toUpperCase();

  for (const guess of guesses) {
    const upperGuess = guess.toUpperCase();
    for (let i = 0; i < upperGuess.length; i++) {
      const letter = upperGuess[i];
      const secretLetter = upperSecret[i] ?? '';
      if (!letter) continue;

      if (letter === secretLetter) {
        states[letter] = 'correct';
      } else if (upperSecret.includes(letter)) {
        if (states[letter] !== 'correct') states[letter] = 'present';
      } else {
        if (states[letter] !== 'correct' && states[letter] !== 'present') {
          states[letter] = 'absent';
        }
      }
    }
  }

  return states;
}
