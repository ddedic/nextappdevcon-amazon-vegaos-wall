/** "14:05" for today; "Oct 7, 14:05" for anything older. */
export function formatTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return time;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}
