/**
 * TOTP (RFC 6238) — compatible con Google Authenticator, Authy, 1Password…
 * Implementación sin dependencias usando crypto de Node.
 *
 * - Secreto en Base32 (RFC 4648), 20 bytes → 32 caracteres sin padding.
 * - HMAC-SHA1 sobre contador de 8 bytes big-endian (no sobre el epoch en texto).
 * - 6 dígitos, ventana de 30s, tolerancia ±window pasos.
 */
import crypto from 'crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Base32 encode (RFC 4648, sin padding). */
export function base32Encode(input: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of input) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

/** Base32 decode (RFC 4648, tolera minúsculas y padding). */
export function base32Decode(input: string): Buffer {
  const clean = (input || '').toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/** Genera un secreto Base32 aleatorio (por defecto 20 bytes → 32 caracteres). */
export function generateBase32Secret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength))
}

/** Código TOTP de 6 dígitos para un secreto en una ventana de tiempo dada. */
export function totpCode(secret: string, timeStepMs = 30000, now = Date.now()): string {
  const counter = Math.floor(now / timeStepMs)
  const msg = Buffer.alloc(8)
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0) // 32 bits altos
  msg.writeUInt32BE(counter >>> 0, 4) // 32 bits bajos
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(msg).digest()
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f
  const bin =
    ((hmac[offset] ?? 0) & 0x7f) * 0x1000000 +
    ((hmac[offset + 1] ?? 0) & 0xff) * 0x10000 +
    ((hmac[offset + 2] ?? 0) & 0xff) * 0x100 +
    ((hmac[offset + 3] ?? 0) & 0xff)
  return (bin % 1000000).toString().padStart(6, '0')
}

/** Verifica un código TOTP contra el secreto, tolerando ±window ventanas (±30s por defecto). */
export function verifyTotp(secret: string, code: string, window = 1, timeStepMs = 30000, now = Date.now()): boolean {
  const clean = (code || '').trim()
  if (!clean || !secret) return false
  for (let i = -window; i <= window; i++) {
    if (totpCode(secret, timeStepMs, now + i * timeStepMs) === clean) return true
  }
  return false
}

/** URI otpauth:// para escanear con la app de autenticación (o entrada manual). */
export function otpauthUri(secret: string, accountName: string, issuer = 'WMS Platform'): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`
}
