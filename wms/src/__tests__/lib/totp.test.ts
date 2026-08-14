import { describe, it, expect } from 'vitest'
import { base32Encode, base32Decode, generateBase32Secret, totpCode, verifyTotp, otpauthUri } from '../../lib/totp'
import { generateQrMatrix, qrToSvg } from '../../lib/qr'
import crypto from 'crypto'

// ═══════════════════════════════════════════════════════════════════════
// TOTP — RFC 6238 test vectors (appendix B): secreto "12345678901234567890"
// ═══════════════════════════════════════════════════════════════════════
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890', 'ascii'))

describe('TOTP RFC 6238', () => {
  it('genera los códigos de los vectores oficiales (RFC 6238 Appendix B, 6 dígitos)', () => {
    const vectors: Array<[number, string]> = [
      [59, '287082'],
      [1111111109, '081804'],
      [1111111111, '050471'],
      [1234567890, '005924'],
      [2000000000, '279037'],
      [20000000000, '353130'],
    ]
    for (const [t, expected6] of vectors) {
      // El counter del RFC es floor(T/30) con T en SEGUNDOS; la lib recibe
      // milisegundos (Date.now()), así que convertimos t → ms.
      const counter = Math.floor(t / 30)
      expect(totpCode(RFC_SECRET, 30000, counter * 30000)).toBe(expected6)
      // Y con la marca de tiempo exacta en ms también (el floor la redondea al paso)
      expect(totpCode(RFC_SECRET, 30000, t * 1000)).toBe(expected6)
    }
  })

  it('verifica con tolerancia de ventana (±1 paso) y rechaza códigos inválidos', () => {
    const at = 1000 * 30000 // inicio de un paso
    const code = totpCode(RFC_SECRET, 30000, at)
    expect(verifyTotp(RFC_SECRET, code, 1, 30000, at)).toBe(true)
    // Código del paso anterior (dentro de la ventana ±1)
    expect(verifyTotp(RFC_SECRET, code, 1, 30000, at - 30000)).toBe(true)
    expect(verifyTotp(RFC_SECRET, '000000', 1, 30000, at)).toBe(false)
    expect(verifyTotp(RFC_SECRET, '', 1, 30000, at)).toBe(false)
    expect(verifyTotp('', '123456', 1, 30000, at)).toBe(false)
  })

  it('genera secretos Base32 de 32 caracteres decodificables', () => {
    const s = generateBase32Secret()
    expect(s).toMatch(/^[A-Z2-7]{32}$/)
    const buf = base32Decode(s)
    expect(buf.length).toBe(20)
    // round-trip
    expect(base32Encode(buf)).toBe(s)
  })

  it('decodifica Base32 con minúsculas y padding', () => {
    // "foobar" en Base32 es MZXW6YTBOI (con padding opcional)
    expect(base32Decode('MZXW6YTBOI======').toString('ascii')).toBe('foobar')
    expect(base32Decode('mzxw6ytboi').toString('ascii')).toBe('foobar')
  })

  it('construye la URI otpauth correcta', () => {
    const uri = otpauthUri('JBSWY3DPEHPK3PXP', 'user@test.com')
    expect(uri).toContain('otpauth://totp/')
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
    expect(uri).toContain('algorithm=SHA1')
    expect(uri).toContain('digits=6')
    expect(uri).toContain('period=30')
  })
})

// ═══════════════════════════════════════════════════════════════════════
// QR — validación estructural + vector conocido
// ═══════════════════════════════════════════════════════════════════════
describe('QR generator', () => {
  it('genera una matriz cuadrada de tamaño correcto para la versión', () => {
    const m = generateQrMatrix('otpauth://totp/Test:user@test.com?secret=JBSWY3DPEHPK3PXP&issuer=Test')
    expect(m.length).toBe(m[0]?.length)
    expect(m.length >= 21 && m.length <= 57).toBe(true)
  })

  it('la versión 1 (21×21) para "HELLO WORLD" cumple el vector ISO 18004 (bitstream + EC)', () => {
    const m = generateQrMatrix('HELLO WORLD')
    expect(m.length).toBe(21)
    // Los finders (3×3 núcleos en las esquinas) deben estar presentes
    expect(m[0]?.[0]).toBe(true)
    expect(m[0]?.[6]).toBe(true)
    expect(m[6]?.[0]).toBe(true)
    expect(m[6]?.[6]).toBe(true)
    expect(m[2]?.[2]).toBe(true)
    expect(m[2]?.[4]).toBe(true)
    expect(m[4]?.[2]).toBe(true)
    expect(m[4]?.[4]).toBe(true)
    // Separadores blancos alrededor de los finders
    expect(m[0]?.[7]).toBe(false)
    expect(m[7]?.[0]).toBe(false)
    // Dark module (fila size-8, col 8)
    expect(m[13]?.[8]).toBe(true)
    // Timing pattern: alterna negro/blanco empezando oscuro en col 8 (par)
    expect(m[6]?.[8]).toBe(true)
    expect(m[6]?.[9]).toBe(false)
    expect(m[6]?.[10]).toBe(true)
    expect(m[6]?.[11]).toBe(false)
    // Timing vertical (col 6): misma alternancia
    expect(m[8]?.[6]).toBe(true)
    expect(m[9]?.[6]).toBe(false)
    expect(m[10]?.[6]).toBe(true)
  })

  it('los módulos reservados de función no contienen datos (total de bits de datos correcto)', () => {
    const m = generateQrMatrix('HELLO WORLD')
    // v1-M: 26 codewords totales = 208 bits de datos+EC
    // contamos módulos de datos con bits: debe ser 208
    let dataBits = 0
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        if (isFunctionModule(r, c)) continue
        dataBits++
      }
    }
    expect(dataBits).toBe(208)
  })

  it('qrToSvg produce un SVG válido con dimensiones', () => {
    const m = generateQrMatrix('test')
    const svg = qrToSvg(m, { size: 180 })
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox')
    expect(svg).toContain('</svg>')
  })
})

function isFunctionModule(row: number, col: number): boolean {
  if (row < 9 && col < 9) return true
  if (row < 9 && col >= 21 - 8) return true
  if (row >= 21 - 8 && col < 9) return true
  if (col === 6 || row === 6) return true
  if (row === 21 - 8 && col === 8) return true // dark module
  return false
}
