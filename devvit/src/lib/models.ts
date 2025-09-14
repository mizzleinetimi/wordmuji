export type GameStatus = 'playing' | 'won' | 'lost';

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[]; // length 5
}

export interface DailyProgress {
  currentIndex: number; // 0..9
  completed: boolean[]; // length 10
  guesses: string[]; // guesses for the current puzzle
  currentGuess?: string; // transient current input
}

export type UIView = 'game' | 'help' | 'stats' | 'share';
