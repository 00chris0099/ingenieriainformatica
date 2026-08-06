import crypto from 'crypto';

const resetTokensMap = new Map<string, { email: string; expiresAt: number }>();

export function generateResetToken(email: string): string {
  const emailStr = email.toLowerCase().trim();
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
  resetTokensMap.set(token, { email: emailStr, expiresAt });
  return token;
}

export function verifyResetToken(token: string): { valid: boolean; email?: string } {
  const data = resetTokensMap.get(token);
  if (!data) return { valid: false };
  if (Date.now() > data.expiresAt) {
    resetTokensMap.delete(token);
    return { valid: false };
  }
  return { valid: true, email: data.email };
}

export function consumeResetToken(token: string): void {
  resetTokensMap.delete(token);
}
