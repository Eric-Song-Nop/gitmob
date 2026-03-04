const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

/**
 * Format a date string into a human-readable relative time.
 * e.g. "2m ago", "3h ago", "5d ago"
 */
export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < MINUTE) return 'just now';
  if (diffSeconds < HOUR) return `${Math.floor(diffSeconds / MINUTE)}m ago`;
  if (diffSeconds < DAY) return `${Math.floor(diffSeconds / HOUR)}h ago`;
  if (diffSeconds < WEEK) return `${Math.floor(diffSeconds / DAY)}d ago`;
  if (diffSeconds < MONTH) return `${Math.floor(diffSeconds / WEEK)}w ago`;
  if (diffSeconds < YEAR) return `${Math.floor(diffSeconds / MONTH)}mo ago`;
  return `${Math.floor(diffSeconds / YEAR)}y ago`;
}
