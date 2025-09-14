export type CellState = 'correct' | 'present' | 'absent';

export function evaluateGuess(secretWord: string, guess: string): CellState[] {
  const length = secretWord.length;
  const states: CellState[] = Array.from({ length }, () => 'absent');
  const lowerSecret = secretWord.toLowerCase();
  const lowerGuess = guess.toLowerCase();

  for (let i = 0; i < length; i++) {
    const g = lowerGuess[i] ?? '';
    const s = lowerSecret[i] ?? '';
    if (!g) continue;
    if (g === s) {
      states[i] = 'correct';
    } else if (g !== ' ' && lowerSecret.includes(g)) {
      states[i] = 'present';
    } else {
      states[i] = 'absent';
    }
  }
  return states;
}
