import { Stats, DailyProgress, UIView } from './models';

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

export function viewKey(userId: string, yyyyMMdd: string): string {
  return `user:${userId}:view:${yyyyMMdd}`;
}

export function messageKey(userId: string, yyyyMMdd: string): string {
  return `user:${userId}:message:${yyyyMMdd}`;
}

export async function loadStats(kv: { get: (k: string) => Promise<string | undefined> }, userId: string): Promise<Stats> {
  const raw = await kv.get(statsKey(userId));
  if (!raw) return { ...defaultStats };
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' && parsed &&
      typeof parsed.gamesPlayed === 'number' &&
      typeof parsed.gamesWon === 'number' &&
      typeof parsed.currentStreak === 'number' &&
      typeof parsed.maxStreak === 'number' &&
      Array.isArray(parsed.guessDistribution) && parsed.guessDistribution.length === 5 &&
      parsed.guessDistribution.every((n: unknown) => typeof n === 'number')
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
      Array.isArray(parsed.completed) && parsed.completed.length === 10 &&
      parsed.completed.every((b: unknown) => typeof b === 'boolean') &&
      Array.isArray(parsed.guesses) && parsed.guesses.every((s: unknown) => typeof s === 'string')
    ) {
      const dp = parsed as DailyProgress;
      if (typeof dp.currentGuess !== 'string') {
        dp.currentGuess = '';
      }
      return dp;
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

export async function loadView(
  kv: { get: (k: string) => Promise<string | undefined> },
  userId: string,
  yyyyMMdd: string
): Promise<UIView> {
  const v = await kv.get(viewKey(userId, yyyyMMdd));
  if (v === 'help' || v === 'stats' || v === 'game' || v === 'share') return v;
  return 'game';
}

export async function saveView(
  kv: { set: (k: string, v: string) => Promise<void> },
  userId: string,
  yyyyMMdd: string,
  view: UIView
): Promise<void> {
  await kv.set(viewKey(userId, yyyyMMdd), view);
}

export async function loadMessage(
  kv: { get: (k: string) => Promise<string | undefined> },
  userId: string,
  yyyyMMdd: string
): Promise<string> {
  return (await kv.get(messageKey(userId, yyyyMMdd))) ?? '';
}

export async function saveMessage(
  kv: { set: (k: string, v: string) => Promise<void> },
  userId: string,
  yyyyMMdd: string,
  message: string
): Promise<void> {
  await kv.set(messageKey(userId, yyyyMMdd), message);
}

export async function clearMessage(
  kv: { set: (k: string, v: string) => Promise<void> },
  userId: string,
  yyyyMMdd: string
): Promise<void> {
  await kv.set(messageKey(userId, yyyyMMdd), '');
}
