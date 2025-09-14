export function generateShareTextUTC(completedCount: number, total: number): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = now.toLocaleString('en-US', { day: 'numeric', timeZone: 'UTC' });
  const today = `${month} ${day}`;
  return `WordMuji ${today}\n${completedCount}/${total} puzzles completed! 🎯`;
}
