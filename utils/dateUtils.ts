export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatTime(timeStr: string): string {
  return timeStr;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Up at this hour?";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Late night";
}
