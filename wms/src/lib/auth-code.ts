// In-memory verification codes store (5 min expiry)
const codesStore = new Map<string, { code: string; expiresAt: number }>();

export function storeVerificationCode(email: string): string {
  const emailStr = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
  codesStore.set(emailStr, { code, expiresAt });
  return code;
}

export function verifyCode(email: string, inputCode: string): boolean {
  const emailStr = email.toLowerCase().trim();
  const cleanInput = (inputCode || '').trim();
  if (!cleanInput) return false;

  const stored = codesStore.get(emailStr);
  if (!stored) return false;

  if (Date.now() > stored.expiresAt) {
    codesStore.delete(emailStr);
    return false;
  }

  const match = stored.code.trim() === cleanInput;
  if (match) codesStore.delete(emailStr);
  return match;
}
