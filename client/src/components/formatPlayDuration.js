export function formatPlayDuration(durationSeconds) {
  if (durationSeconds == null) return null;
  const seconds = Math.max(0, Math.floor(durationSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}
