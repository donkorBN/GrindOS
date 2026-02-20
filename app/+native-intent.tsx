export function redirectSystemPath({ path }: { path: string }) {
  if (path === '/') return '/(tabs)/(today)';
  return path;
}
