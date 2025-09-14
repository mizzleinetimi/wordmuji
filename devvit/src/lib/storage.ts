import { Stats, DailyProgress } from './models';

const defaultStats: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0],
};

export function statsKey(userId: string): string {
  return `user:${userId}:stats`;
}

export function dailyKey(userId: string, yyyyMMdd: string): string {
  return `user:${userId}:daily:${yyyyMMdd}`;
}

export async function loadStats(kv: { get: (k: string) => Promise<string | undefined> }): Promise<Stats> {
  const raw = await kv.get(statsKey('self'));
  if (!raw) return { ...defaultStats };
  try {
    const parsed = JSON.parse(raw);
    // Basic shape validation
    if (
      typeof parsed === 'object' && parsed &&
      typeof parsed.gamesPlayed === 'number' &&
      typeof parsed.gamesWon === 'number' &&
      typeof parsed.currentStreak === 'number' &&
      typeof parsed.maxStreak === 'number' &&
      Array.isArray(parsed.guessDistribution)
    ) {
      return parsed as Stats;
    }
  } catch {}
  return { ...defaultStats };
}

export async function saveStats(kv: { set: (k: string, v: string) => Promise<void> }, userId: string, s: Stats): Promise<void> {
  await kv.set(statsKey(userId), JSON.stringify(s));
}

export async function loadDaily(
  kv: { get: (k: string) => Promise<string | undefined> },
  userId: string,
  yyyyMMdd: string
): Promise<DailyProgress | undefined> {
  const raw = await kv.get(dailyKey(userId, yyyyMMdd));
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' && parsed &&
      typeof parsed.currentIndex === 'number' &&
      Array.isArray(parsed.completed) &&
      Array.isArray(parsed.guesses)
    ) {
      return parsed as DailyProgress;
    }
  } catch {}
  return undefined;
}

export async function saveDaily(
  kv: { set: (k: string, v: string) => Promise<void> },
  userId: string,
  yyyyMMdd: string,
  progress: DailyProgress
): Promise<void> {
  await kv.set(dailyKey(userId, yyyyMMdd), JSON.stringify(progress));
}
