export function validateAuthInput(mode: 'login' | 'create', name: string, email: string, password: string): string {
  if (mode === 'create' && (!name.trim() || name.trim().length > 120)) return 'Enter your full name (up to 120 characters).';
  if (email.trim().length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  if (!password) return 'Enter your password.';
  if (mode === 'create' && [...password].length < 8) return 'Use a password with at least 8 characters.';
  const bytes = [...password].reduce((total, character) => {
    const point = character.codePointAt(0)!;
    return total + (point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4);
  }, 0);
  if (bytes > 72) return 'This password is too long. Use fewer characters.';
  return '';
}
export function safeAuthReturnRoute(route?: string): string {
  if (!route?.startsWith('/') || route.startsWith('//') || /[\\\s]/.test(route)) return '/';
  try {
    const url = new URL(route, 'https://stayfinder.invalid');
    if (url.origin !== 'https://stayfinder.invalid' || /^\/auth(?:\/|$)/.test(url.pathname)) return '/';
    return url.pathname + url.search;
  } catch { return '/'; }
}
