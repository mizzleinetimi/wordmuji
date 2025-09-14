import { SeededRandom } from './random';
import { words } from '../data/wordData';

export function getTodayUTCDateString(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getUTCDateSeed(dateString: string): number {
  const [y, m, d] = dateString.split('-').map((x) => parseInt(x, 10));
  return y * 10000 + m * 100 + d;
}

export function generateDailyWordsUTC(dateString: string): string[] {
  const seed = getUTCDateSeed(dateString);
  const rng = new SeededRandom(seed);
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 10);
}

export function getTimeUntilNextUTCChallenge(): string {
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
