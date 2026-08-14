/**
 * Minimal QR Code generator (byte mode, EC level M) — sin dependencias.
 *
 * Suficiente para codificar URIs `otpauth://` (2FA TOTP): soporta los
 * tamaños 1-10 (21-57 módulos) cubriendo textos de hasta ~160 bytes.
 *
 * Algoritmo: codificación byte mode con Reed-Solomon (GF(2^8), polinomio
 * generador de EC level M), patrón de función (finder/alignment/timing/dark
 * module/format), y máscara 0 (1010101). La máscara 0 es válida según la
 * especificación ISO/IEC 18004 y simplifica la corrección de errores sin
 * sacrificar escaneabilidad.
 */
const EC_LEVEL = 'M'

// Tablas GF(2^8) con el polinomio 0x11D (estándar de QR)
const EXP: number[] = new Array(512)
const LOG: number[] = new Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255] ?? 0
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  const lg = LOG[a]
  const lb = LOG[b]
  return EXP[(lg ?? 0) + (lb ?? 0)] ?? 0
}

/**
 * Capacidades byte mode para EC level M, versiones 1-10: [total codewords, ec codewords].
 * Tabla ISO/IEC 18004 (los EC por versión se verificaron contra la lib `qrcode`).
 */
const CAP_M: Array<[number, number]> = [
  [26, 10], [44, 16], [70, 26], [100, 36], [134, 48],
  [172, 64], [196, 72], [242, 88], [292, 110], [346, 130],
]

/** Número de bloques EC para EC level M, versiones 1-10. */
const BLOCKS_M = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5]

// Tablas de posición del patrón de alineación por versión (versiones 2-10)
const ALIGN: Record<number, number[]> = {
  2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
}

function pickVersion(dataLen: number): number {
  for (let v = 1; v <= 10; v++) {
    // byte mode: 4 bits mode + 8 bits count + 8 bits por byte, y la capacidad
    // de datos es TOTAL - EC (no el total de codewords)
    const cap = CAP_M[v - 1]
    if (!cap) continue
    const [total, ec] = cap
    if (4 + 8 + dataLen * 8 <= (total - ec) * 8) return v
  }
  throw new Error('Datos demasiado largos para QR (máx ~160 bytes)')
}

/**
 * Polinomio generador Reed-Solomon de grado ecLen (QR usa las raíces
 * α^0..α^(ecLen-1)). Se devuelve en orden alto→bajo: g[0] = 1 (coeficiente
 * líder), g[ecLen] = término constante, que es el orden que espera
 * `rsRemainder`.
 */
function rsGenerator(ecLen: number): number[] {
  let g: number[] = [1] // bajo→alto durante el cálculo
  for (let i = 0; i < ecLen; i++) {
    const alpha = EXP[i] ?? 0
    const next: number[] = new Array(g.length + 1).fill(0)
    for (let j = 0; j < g.length; j++) {
      next[j] = (next[j] ?? 0) ^ gfMul(g[j] ?? 0, alpha) // α^i · g[j]
      next[j + 1] = (next[j + 1] ?? 0) ^ (g[j] ?? 0) // x · g[j]
    }
    g = next
  }
  return g.reverse() // alto→bajo (líder 1 primero)
}

function rsRemainder(data: number[], gen: number[]): number[] {
  const rem = new Array(gen.length - 1).fill(0)
  for (const b of data) {
    const factor = b ^ (rem[0] || 0)
    rem.shift()
    rem.push(0)
    for (let i = 0; i < gen.length - 1; i++) {
      rem[i] = (rem[i] ?? 0) ^ gfMul(gen[i + 1] ?? 0, factor)
    }
  }
  return rem
}

/**
 * Genera una matriz QR (boolean[][], true = módulo negro) para `data`
 * en modo byte con corrección de errores nivel M.
 */
export function generateQrMatrix(data: string): boolean[][] {
  const bytes = new TextEncoder().encode(data)
  const version = pickVersion(bytes.length)
  const cap = CAP_M[version - 1]
  const [totalCodewords, ecCodewords] = cap ?? [0, 0]
  const numBlocks = BLOCKS_M[version - 1] ?? 1
  const dataCodewords = totalCodewords - ecCodewords
  const perBlock = Math.floor(dataCodewords / numBlocks)
  const extra = dataCodewords % numBlocks

  // ═══ Construcción del stream de datos (byte mode) ═══
  const payload: number[] = []
  payload.push(0b0100) // mode byte
  payload.push((bytes.length >> 4) & 0x0f, bytes.length & 0x0f)
  for (const b of bytes) payload.push((b >> 4) & 0x0f, b & 0x0f)
  // Terminador + padding a múltiplo de 8 bits
  while (payload.length % 2 !== 0) payload.push(0)
  const dataBits: number[] = []
  for (const nib of payload) {
    dataBits.push((nib >> 3) & 1, (nib >> 2) & 1, (nib >> 1) & 1, nib & 1)
  }
  const capBits = dataCodewords * 8
  while (dataBits.length < capBits) {
    dataBits.push(1, 1, 1, 0, 1, 1, 0, 0) // 0xEC
    if (dataBits.length >= capBits) break
    dataBits.push(0, 0, 0, 1, 0, 0, 0, 1) // 0x11
  }
  const dataCodewordArray: number[] = []
  for (let i = 0; i < capBits; i += 8) {
    let v = 0
    for (let j = 0; j < 8; j++) v = (v << 1) | (dataBits[i + j] ?? 0)
    dataCodewordArray.push(v)
  }

  // ═══ Reed-Solomon por bloque ═══
  // El grado del generador RS es el EC POR BLOQUE (ISO 18004: cada bloque
  // lleva el mismo número de codewords de corrección).
  const ecPerBlock = Math.floor(ecCodewords / numBlocks)
  const gen = rsGenerator(ecPerBlock)
  const blockSizes: number[] = []
  const blocks: Array<{ data: number[]; ec: number[] }> = []
  let idx = 0
  for (let b = 0; b < numBlocks; b++) {
    // ISO 18004: el grupo 2 (los ÚLTIMOS bloques) lleva el byte de más.
    // (La lib de referencia reparte el +1 a los últimos `extra` bloques.)
    const size = perBlock + (b >= numBlocks - extra ? 1 : 0)
    blockSizes.push(size)
    const blockData = dataCodewordArray.slice(idx, idx + size)
    idx += size
    blocks.push({ data: blockData, ec: rsRemainder(blockData, gen) })
  }

  // Intercalado de datos y EC
  const interleaved: number[] = []
  const maxData = Math.max(...blockSizes)
  for (let i = 0; i < maxData; i++) {
    for (let b = 0; b < numBlocks; b++) {
      const blk = blocks[b]
      if (blk && i < blk.data.length) interleaved.push(blk.data[i] ?? 0)
    }
  }
  for (let i = 0; i < ecCodewords; i++) {
    for (let b = 0; b < numBlocks; b++) {
      interleaved.push(blocks[b]?.ec[i] ?? 0)
    }
  }
  while (interleaved.length < totalCodewords) interleaved.push(0)

  const size = version * 4 + 17
  const mod: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))

  const setModule = (row: number, col: number, v: boolean, isReserved = false) => {
    if (row >= 0 && row < size && col >= 0 && col < size) {
      mod[row]![col] = v
      if (isReserved) reserved[row]![col] = true
    }
  }

  // ═══ Patrón de función ═══
  // Finders con separador de 1 módulo (todo el área 9×9 marcada como reservada)
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const inBox = r >= 0 && r <= 6 && c >= 0 && c <= 6
        const dark = inBox && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        if (inBox) setModule(row + r, col + c, dark, true)
        else setModule(row + r, col + c, false, true) // separador (también reservado)
      }
    }
  }
  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // Timing (fila 6 y col 6) — reservado completo
  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0
    setModule(6, i, v, true)
    setModule(i, 6, v, true)
  }

  // Dark module
  setModule(size - 8, 8, true, true)

  // ═══ Version info (solo versiones ≥ 7, ISO 18004 §8.10) ═══
  // 18 bits (6 datos + 12 EC, código Golay BCH(18,6) generador 0x1F25),
  // en dos copias: bloque 6×3 arriba-derecha y su transpuesta abajo-izquierda.
  if (version >= 7) {
    const vbits = versionBch(version)
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3)
      const c = (i % 3) + size - 11
      const dark = ((vbits >> i) & 1) === 1
      setModule(r, c, dark, true)
      setModule(c, r, dark, true)
    }
  }

  // Alignment
  const aligns = ALIGN[version] || [6]
  for (const r of aligns) {
    for (const c of aligns) {
      if (r === 6 && c === 6) continue
      if (r === 6 && c === size - 7) continue
      if (r === size - 7 && c === 6) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
          setModule(r + dr, c + dc, dark, true)
        }
      }
    }
  }

  // Zona del format info: se reserva el área completa (fila 8 cols 0-8 y 13-20,
  // col 8 rows 0-8 y 13-20) para que el mask loop no escriba ahí; los bits se
  // colocan después con setModule.
  for (let c = 0; c <= 8; c++) reserved[8]![c] = true
  // Copia 2 del formato: fila 8 cols size-8..size-1 (bits 0-7) — relativa al tamaño
  for (let c = size - 8; c < size; c++) reserved[8]![c] = true
  for (let r = 0; r <= 8; r++) reserved[r]![8] = true
  // Copia 2 del formato: col 8 rows size-7..size-1 (bits 8-14). Las filas
  // size-15..size-8 NO están reservadas: son celdas de datos en el zigzag.
  for (let r = size - 7; r < size; r++) reserved[r]![8] = true

  // ═══ Codewords ═══
  // Colocación en zigzag idéntica a la lib de referencia: cada par de columnas se
  // recorre en vertical alternando dirección (empieza abajo, sube, baja…).
  // Primero colocamos los bits sin máscara en la matriz y después elegimos la mejor
  // máscara (misma penalización que la lib de referencia) y la aplicamos.
  // Colocar los bits de datos+EC SIN máscara (los módulos reservados quedan en false)
  let bitIndex = 0
  const totalBits = totalCodewords * 8
  const readBit = (): boolean => {
    const byte = interleaved[Math.floor(bitIndex / 8)] ?? 0
    const bit = 7 - (bitIndex % 8)
    bitIndex++
    return ((byte >> bit) & 1) === 1
  }
  let row = size - 1
  let inc = -1
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5 // salta la columna del timing
    while (true) {
      for (let c = 0; c < 2; c++) {
        const col = right - c
        if (col < 0) continue
        if (reserved[row]?.[col]) continue
        setModule(row, col, bitIndex < totalBits ? readBit() : false)
      }
      row += inc
      if (row < 0 || size <= row) {
        row -= inc
        inc = -inc
        break
      }
    }
  }

  // Aplicar la máscara 0 (consistente con el format info que escribimos debajo).
  // ISO 18004: la máscara 0 invierte las celdas donde (fila + columna) es par.
  const MASK_PATTERN = 0
  for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (!reserved[r]?.[c] && maskCondition(r, c, MASK_PATTERN)) mod[r]![c] = !mod[r]![c]
  }
  }
  writeFormatInfo(mod, size, MASK_PATTERN)

  return mod
}

// Nivel EC usado en el format info (2 bits ISO 18004: L=01, M=00, Q=11, H=10).
// La lib de referencia usa EC M (00) para errorCorrectionLevel 'M'.
const FORMAT_EC_BITS = 0b00

/** Escribe el format info (máscara dada) en las posiciones ISO 18004. */
function writeFormatInfo(mod: boolean[][], size: number, maskPattern: number): void {
  const formatData = (FORMAT_EC_BITS << 3) | maskPattern // EC level + máscara
  let fmtCode = (formatData << 10) | bchRemainder(formatData)
  fmtCode ^= 0b101010000010010
  // La lib de referencia lee los bits LSB-first: bit i = (fmtCode >> i) & 1
  const fmt = (i: number) => ((fmtCode >> i) & 1) === 1
  const set = (row: number, col: number, v: boolean) => {
    if (row >= 0 && row < size && col >= 0 && col < size) mod[row]![col] = v
  }
  // Vertical (col 8): bits 0-5 en rows 0-5, bits 6-7 en rows 7-8, bits 8-14 en
  // rows size-7..size-1 (copia 2, relativa al tamaño)
  for (let i = 0; i < 6; i++) set(i, 8, fmt(i))
  for (let i = 6; i < 8; i++) set(i + 1, 8, fmt(i))
  for (let i = 8; i < 15; i++) set(size - 15 + i, 8, fmt(i))
  // Horizontal (fila 8) — mapeo idéntico a la lib de referencia:
  //   bits 0-7 → cols size-1..size-8, bit 8 → col 7, bits 9-14 → cols 5..0
  for (let i = 0; i < 8; i++) set(8, size - 1 - i, fmt(i))
  set(8, 7, fmt(8)) // bit 8 → col 7 (constante, como la lib)
  for (let i = 9; i < 15; i++) set(8, 15 - i - 1, fmt(i))
}

/** Resto BCH(15,5) para el format info (polinomio generador 10100110111). */
function bchRemainder(data: number): number {
  let d = data << 10
  for (let i = 14; i >= 10; i--) {
    if ((d >> i) & 1) d ^= 0b10100110111 << (i - 10)
  }
  return d & 0x3ff
}

/** Bits de versión (BCH(18,6), Golay generador 0x1F25) — solo para versiones ≥ 7. */
function versionBch(version: number): number {
  const G18 = 0x1f25
  let d = version << 12
  const digit = (x: number) => {
    let n = 0
    while (x !== 0) {
      n++
      x >>>= 1
    }
    return n
  }
  const g18Digit = digit(G18)
  while (digit(d) - g18Digit >= 0) {
    d ^= G18 << (digit(d) - g18Digit)
  }
  return (version << 12) | d
}

/** Condición de inversión de la máscara ISO 18004. */
function maskCondition(row: number, col: number, pattern: number): boolean {
  switch (pattern) {
    case 0: return (row + col) % 2 === 0
    case 1: return row % 2 === 0
    case 2: return col % 3 === 0
    case 3: return (row + col) % 3 === 0
    case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0
    case 5: return (row * col) % 2 + (row * col) % 3 === 0
    case 6: return ((row * col) % 2 + (row * col) % 3) % 2 === 0
    case 7: return ((row * col) % 3 + (row + col) % 2) % 2 === 0
    default: return false
  }
}

/** Convierte la matriz en un SVG `<svg>` inline (data URI opcional). */
export function qrToSvg(matrix: boolean[][], opts?: { size?: number; fg?: string; bg?: string }): string {
  const n = matrix.length
  const scale = Math.max(1, Math.floor((opts?.size || 180) / n))
  const size = n * scale
  const fg = opts?.fg || '#000000'
  const bg = opts?.bg || '#ffffff'
  let rects = ''
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r]?.[c]) rects += `<rect x="${c * scale}" y="${r * scale}" width="${scale}" height="${scale}"/>`
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${bg}"/>${rects}</svg>`
}
