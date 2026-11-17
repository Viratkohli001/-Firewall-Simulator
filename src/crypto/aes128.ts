export type AesMode = 'encrypt' | 'decrypt';

export type AesOperation =
  | 'Input'
  | 'SubBytes'
  | 'ShiftRows'
  | 'MixColumns'
  | 'AddRoundKey'
  | 'InvShiftRows'
  | 'InvSubBytes'
  | 'InvMixColumns';

export type InputEncoding = 'hex' | 'utf8';
export type BlockMode = 'single' | 'ecb-pkcs7' | 'cbc-pkcs7';

export interface KeyWordTrace {
  wordIndex: number;
  roundIndex: number;
  columnInRound: number;
  prevWord: number[];
  prevNkWord: number[];
  isKeyCore: boolean;
  afterRotWord?: number[];
  afterSubWord?: number[];
  rconByte?: number;
  afterRcon?: number[];
  resultWord: number[];
}

export interface RoundKeyInfo {
  round: number;
  bytes: number[]; // 16 bytes in column-major order
  hex: string;
  words: KeyWordTrace[];
}

export interface AesStep {
  stepIndex: number;
  mode: AesMode;
  round: number;
  operation: AesOperation;
  title: string;
  subtitle: string;
  explanation: string;
  beforeState: number[];
  afterState: number[];
  changedIndices: number[];
  roundKeyIndex: number | null;
  roundKeyBytes: number[] | null;
  isFinalRound?: boolean;
}

export interface AesSimulationResult {
  mode: AesMode;
  inputBytes: number[];
  keyBytes: number[];
  outputBytes: number[];
  roundKeys: RoundKeyInfo[];
  steps: AesStep[];
}

export interface MultiBlockResult {
  cipherBytes: number[];
  ivBytes: number[] | null;
  blocks: {
    blockIndex: number;
    plaintextBlock: number[];
    cipherBlock: number[];
  }[];
}

// FIPS 197 Figure 7: S-box lookup table (256 bytes)
export const SBOX: readonly number[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
];

// FIPS 197 Figure 14: Inverse S-box lookup table (256 bytes)
export const INV_SBOX: readonly number[] = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
  0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
  0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
  0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
  0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
  0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
  0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
  0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
  0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
  0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
  0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
  0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
  0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
  0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
  0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
  0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d,
];

// Round constants Rcon[1..10] (only first byte is non-zero)
export const RCON: readonly number[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

// Forward and Inverse MixColumns matrices
export const MIX_MATRIX: readonly number[][] = [
  [0x02, 0x03, 0x01, 0x01],
  [0x01, 0x02, 0x03, 0x01],
  [0x01, 0x01, 0x02, 0x03],
  [0x03, 0x01, 0x01, 0x02],
];

export const INV_MIX_MATRIX: readonly number[][] = [
  [0x0e, 0x0b, 0x0d, 0x09],
  [0x09, 0x0e, 0x0b, 0x0d],
  [0x0d, 0x09, 0x0e, 0x0b],
  [0x0b, 0x0d, 0x09, 0x0e],
];

// Column-major index helpers: state[r][c] = bytes[r + 4 * c]
export function stateIndex(row: number, col: number): number {
  return row + 4 * col;
}

export function getCell(bytes: readonly number[], row: number, col: number): number {
  return bytes[row + 4 * col] ?? 0;
}

export function formatHexByte(byte: number): string {
  return (byte & 0xff).toString(16).padStart(2, '0').toLowerCase();
}

export function formatBinaryByte(byte: number): string {
  return (byte & 0xff).toString(2).padStart(8, '0');
}

export function bytesToHex(bytes: readonly number[]): string {
  return bytes.map(formatHexByte).join('');
}

export function bytesToSpacedHex(bytes: readonly number[]): string {
  return bytes.map(formatHexByte).join(' ');
}

export function bytesToSafeAsciiPreview(bytes: readonly number[]): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const decoded = decoder.decode(new Uint8Array(bytes));
    // Replace non-printable control characters with middot for clean display
    return Array.from(decoded)
      .map((ch) => {
        const code = ch.charCodeAt(0);
        return code < 0x20 || code === 0x7f ? '·' : ch;
      })
      .join('');
  } catch {
    return bytes
      .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '·'))
      .join('');
  }
}

export function tryDecodeUtf8(bytes: readonly number[]): { valid: boolean; text: string } {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return { valid: true, text: decoder.decode(new Uint8Array(bytes)) };
  } catch {
    return { valid: false, text: '' };
  }
}

export interface ValidationResult {
  valid: boolean;
  bytes: number[];
  error?: string;
}

/**
 * Validates strict 16-byte (128-bit) input without silent truncation or custom padding.
 */
export function validateSingleBlockInput(
  rawValue: string,
  encoding: InputEncoding,
  fieldLabel: string
): ValidationResult {
  if (encoding === 'hex') {
    const cleaned = rawValue.replace(/\s+/g, '');
    if (cleaned.length === 0) {
      return { valid: false, bytes: [], error: `${fieldLabel} cannot be empty.` };
    }
    if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
      return {
        valid: false,
        bytes: [],
        error: `${fieldLabel} contains invalid characters. Only hexadecimal digits (0-9, a-f) are allowed.`,
      };
    }
    if (cleaned.length !== 32) {
      return {
        valid: false,
        bytes: [],
        error: `${fieldLabel} must be exactly 32 hex characters (16 bytes / 128 bits). Currently ${cleaned.length} characters (${(cleaned.length / 2).toFixed(cleaned.length % 2 === 0 ? 0 : 1)} bytes).`,
      };
    }
    const bytes: number[] = [];
    for (let i = 0; i < 32; i += 2) {
      bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
    }
    return { valid: true, bytes };
  }

  // UTF-8 encoding
  const encoded = Array.from(new TextEncoder().encode(rawValue));
  if (encoded.length !== 16) {
    return {
      valid: false,
      bytes: encoded,
      error: `${fieldLabel} in Single-Block UTF-8 mode must encode to exactly 16 bytes (128 bits). Currently ${encoded.length} UTF-8 byte${encoded.length === 1 ? '' : 's'}. Adjust the text or switch to Multi-Block (PKCS#7) mode.`,
    };
  }
  return { valid: true, bytes: encoded };
}

/**
 * Validates arbitrary-length plaintext for Multi-Block PKCS#7 mode.
 */
export function validateMultiBlockPlaintext(
  rawValue: string,
  encoding: InputEncoding
): ValidationResult {
  if (encoding === 'hex') {
    const cleaned = rawValue.replace(/\s+/g, '');
    if (cleaned.length === 0) {
      return { valid: false, bytes: [], error: 'Plaintext cannot be empty.' };
    }
    if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
      return {
        valid: false,
        bytes: [],
        error: 'Plaintext contains non-hexadecimal characters.',
      };
    }
    if (cleaned.length % 2 !== 0) {
      return {
        valid: false,
        bytes: [],
        error: 'Hexadecimal plaintext must have an even number of digits (complete bytes).',
      };
    }
    const bytes: number[] = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
    }
    return { valid: true, bytes };
  }

  const encoded = Array.from(new TextEncoder().encode(rawValue));
  if (encoded.length === 0) {
    return { valid: false, bytes: [], error: 'Plaintext cannot be empty.' };
  }
  return { valid: true, bytes: encoded };
}

/**
 * Validates ciphertext hex for Multi-Block decryption (must be a non-empty multiple of 16 bytes).
 */
export function validateCiphertextBlocksHex(rawHex: string): ValidationResult {
  const cleaned = rawHex.replace(/\s+/g, '');
  if (cleaned.length === 0) {
    return { valid: false, bytes: [], error: 'Ciphertext cannot be empty.' };
  }
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
    return {
      valid: false,
      bytes: [],
      error: 'Ciphertext must contain only valid hexadecimal digits (0-9, a-f).',
    };
  }
  if (cleaned.length % 32 !== 0) {
    return {
      valid: false,
      bytes: [],
      error: `Ciphertext length must be a multiple of 32 hex characters (16-byte blocks). Currently ${cleaned.length} characters.`,
    };
  }
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16));
  }
  return { valid: true, bytes };
}

// GF(2^8) multiplication modulo irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11b)
export function xtime(byte: number): number {
  const b = byte & 0xff;
  return b & 0x80 ? ((b << 1) ^ 0x1b) & 0xff : (b << 1) & 0xff;
}

export function gfMul(a: number, b: number): number {
  let x = a & 0xff;
  let y = b & 0xff;
  let result = 0;
  for (let i = 0; i < 8; i++) {
    if (y & 1) {
      result ^= x;
    }
    const highBit = x & 0x80;
    x = (x << 1) & 0xff;
    if (highBit) {
      x ^= 0x1b;
    }
    y >>= 1;
  }
  return result & 0xff;
}

/**
 * FIPS 197 Section 5.2 Key Expansion for AES-128 (Nk = 4, Nr = 10 -> 44 words / 11 round keys)
 */
export function expandKey(keyBytes: readonly number[]): RoundKeyInfo[] {
  if (keyBytes.length !== 16) {
    throw new Error(`AES-128 requires a 16-byte key, received ${keyBytes.length} bytes.`);
  }

  const words: number[][] = [];
  const traces: KeyWordTrace[] = [];

  for (let i = 0; i < 4; i++) {
    const word = [keyBytes[4 * i], keyBytes[4 * i + 1], keyBytes[4 * i + 2], keyBytes[4 * i + 3]];
    words.push(word);
    traces.push({
      wordIndex: i,
      roundIndex: 0,
      columnInRound: i,
      prevWord: [...word],
      prevNkWord: [...word],
      isKeyCore: false,
      resultWord: [...word],
    });
  }

  for (let i = 4; i < 44; i++) {
    const prevWord = [...words[i - 1]];
    const prevNkWord = [...words[i - 4]];
    let temp = [...prevWord];

    const trace: KeyWordTrace = {
      wordIndex: i,
      roundIndex: Math.floor(i / 4),
      columnInRound: i % 4,
      prevWord,
      prevNkWord,
      isKeyCore: i % 4 === 0,
      resultWord: [],
    };

    if (i % 4 === 0) {
      const rotated = [temp[1], temp[2], temp[3], temp[0]];
      const subbed = rotated.map((b) => SBOX[b]);
      const rconByte = RCON[i / 4 - 1];
      const withRcon = [subbed[0] ^ rconByte, subbed[1], subbed[2], subbed[3]];

      trace.afterRotWord = rotated;
      trace.afterSubWord = subbed;
      trace.rconByte = rconByte;
      trace.afterRcon = withRcon;
      temp = withRcon;
    }

    const resultWord = [
      prevNkWord[0] ^ temp[0],
      prevNkWord[1] ^ temp[1],
      prevNkWord[2] ^ temp[2],
      prevNkWord[3] ^ temp[3],
    ];
    trace.resultWord = resultWord;
    words.push(resultWord);
    traces.push(trace);
  }

  const roundKeys: RoundKeyInfo[] = [];
  for (let r = 0; r <= 10; r++) {
    const roundWords = traces.slice(r * 4, r * 4 + 4);
    const bytes = roundWords.flatMap((w) => w.resultWord);
    roundKeys.push({
      round: r,
      bytes,
      hex: bytesToHex(bytes),
      words: roundWords,
    });
  }

  return roundKeys;
}

// Core FIPS 197 State Transformations
export function subBytes(state: readonly number[]): number[] {
  return state.map((b) => SBOX[b & 0xff]);
}

export function invSubBytes(state: readonly number[]): number[] {
  return state.map((b) => INV_SBOX[b & 0xff]);
}

export function shiftRows(state: readonly number[]): number[] {
  const next = new Array<number>(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      next[r + 4 * c] = state[r + 4 * ((c + r) % 4)];
    }
  }
  return next;
}

export function invShiftRows(state: readonly number[]): number[] {
  const next = new Array<number>(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      next[r + 4 * c] = state[r + 4 * ((c - r + 4) % 4)];
    }
  }
  return next;
}

export function mixColumns(state: readonly number[]): number[] {
  const next = new Array<number>(16);
  for (let c = 0; c < 4; c++) {
    const s0 = state[0 + 4 * c];
    const s1 = state[1 + 4 * c];
    const s2 = state[2 + 4 * c];
    const s3 = state[3 + 4 * c];

    next[0 + 4 * c] = gfMul(0x02, s0) ^ gfMul(0x03, s1) ^ s2 ^ s3;
    next[1 + 4 * c] = s0 ^ gfMul(0x02, s1) ^ gfMul(0x03, s2) ^ s3;
    next[2 + 4 * c] = s0 ^ s1 ^ gfMul(0x02, s2) ^ gfMul(0x03, s3);
    next[3 + 4 * c] = gfMul(0x03, s0) ^ s1 ^ s2 ^ gfMul(0x02, s3);
  }
  return next;
}

export function invMixColumns(state: readonly number[]): number[] {
  const next = new Array<number>(16);
  for (let c = 0; c < 4; c++) {
    const s0 = state[0 + 4 * c];
    const s1 = state[1 + 4 * c];
    const s2 = state[2 + 4 * c];
    const s3 = state[3 + 4 * c];

    next[0 + 4 * c] = gfMul(0x0e, s0) ^ gfMul(0x0b, s1) ^ gfMul(0x0d, s2) ^ gfMul(0x09, s3);
    next[1 + 4 * c] = gfMul(0x09, s0) ^ gfMul(0x0e, s1) ^ gfMul(0x0b, s2) ^ gfMul(0x0d, s3);
    next[2 + 4 * c] = gfMul(0x0d, s0) ^ gfMul(0x09, s1) ^ gfMul(0x0e, s2) ^ gfMul(0x0b, s3);
    next[3 + 4 * c] = gfMul(0x0b, s0) ^ gfMul(0x0d, s1) ^ gfMul(0x09, s2) ^ gfMul(0x0e, s3);
  }
  return next;
}

export function addRoundKey(state: readonly number[], roundKey: readonly number[]): number[] {
  return state.map((b, i) => (b ^ roundKey[i]) & 0xff);
}

function findChangedIndices(before: readonly number[], after: readonly number[]): number[] {
  const changed: number[] = [];
  for (let i = 0; i < 16; i++) {
    if (before[i] !== after[i]) {
      changed.push(i);
    }
  }
  return changed;
}

/**
 * Full FIPS 197 AES-128 Encryption with step-by-step state recording.
 */
export function encryptBlockWithTrace(
  plaintextBytes: readonly number[],
  keyBytes: readonly number[]
): AesSimulationResult {
  if (plaintextBytes.length !== 16) {
    throw new Error(`AES-128 block must be 16 bytes, got ${plaintextBytes.length}.`);
  }
  const roundKeys = expandKey(keyBytes);
  const steps: AesStep[] = [];

  let state = [...plaintextBytes];

  steps.push({
    stepIndex: 0,
    mode: 'encrypt',
    round: 0,
    operation: 'Input',
    title: 'Initial State Matrix',
    subtitle: '16-byte plaintext loaded into 4 × 4 column-major state',
    explanation:
      'AES arranges the 16 input bytes column by column: state[row, col] = input[row + 4 × col]. No transformation has been applied yet.',
    beforeState: [...state],
    afterState: [...state],
    changedIndices: [],
    roundKeyIndex: null,
    roundKeyBytes: null,
  });

  // Initial Round (Round 0): AddRoundKey with K0
  const afterR0 = addRoundKey(state, roundKeys[0].bytes);
  steps.push({
    stepIndex: steps.length,
    mode: 'encrypt',
    round: 0,
    operation: 'AddRoundKey',
    title: 'Initial Round · AddRoundKey (K0)',
    subtitle: 'Bitwise XOR of initial state with original 128-bit key K0',
    explanation:
      'Before Round 1 begins, every byte in the state matrix is XORed with the corresponding byte of Round Key K0 (key whitening).',
    beforeState: [...state],
    afterState: [...afterR0],
    changedIndices: findChangedIndices(state, afterR0),
    roundKeyIndex: 0,
    roundKeyBytes: [...roundKeys[0].bytes],
  });
  state = afterR0;

  // Rounds 1 to 9
  for (let round = 1; round <= 9; round++) {
    const afterSub = subBytes(state);
    steps.push({
      stepIndex: steps.length,
      mode: 'encrypt',
      round,
      operation: 'SubBytes',
      title: `Round ${round} · SubBytes`,
      subtitle: 'Non-linear byte substitution via AES S-Box',
      explanation:
        'Each byte is split into high nibble (row) and low nibble (column) to look up its replacement in the 16 × 16 S-Box, providing confusion.',
      beforeState: [...state],
      afterState: [...afterSub],
      changedIndices: findChangedIndices(state, afterSub),
      roundKeyIndex: null,
      roundKeyBytes: null,
    });
    state = afterSub;

    const afterShift = shiftRows(state);
    steps.push({
      stepIndex: steps.length,
      mode: 'encrypt',
      round,
      operation: 'ShiftRows',
      title: `Round ${round} · ShiftRows`,
      subtitle: 'Circular left shift by 0, 1, 2, and 3 bytes per row',
      explanation:
        'Row 0 stays unchanged; Rows 1, 2, and 3 shift cyclically left by 1, 2, and 3 positions so bytes diffuse across columns.',
      beforeState: [...state],
      afterState: [...afterShift],
      changedIndices: findChangedIndices(state, afterShift),
      roundKeyIndex: null,
      roundKeyBytes: null,
    });
    state = afterShift;

    const afterMix = mixColumns(state);
    steps.push({
      stepIndex: steps.length,
      mode: 'encrypt',
      round,
      operation: 'MixColumns',
      title: `Round ${round} · MixColumns`,
      subtitle: 'Column-wise GF(2⁸) polynomial matrix multiplication',
      explanation:
        'Each 4-byte column is multiplied by the fixed MDS matrix in GF(2⁸) modulo x⁸ + x⁴ + x³ + x + 1, diffusing each byte across all 4 bytes of its column.',
      beforeState: [...state],
      afterState: [...afterMix],
      changedIndices: findChangedIndices(state, afterMix),
      roundKeyIndex: null,
      roundKeyBytes: null,
    });
    state = afterMix;

    const afterAddKey = addRoundKey(state, roundKeys[round].bytes);
    steps.push({
      stepIndex: steps.length,
      mode: 'encrypt',
      round,
      operation: 'AddRoundKey',
      title: `Round ${round} · AddRoundKey (K${round})`,
      subtitle: `XOR state matrix with expanded Round Key K${round}`,
      explanation: `Each byte of the state matrix is XORed with Round Key K${round}, injecting secret key material into the round output.`,
      beforeState: [...state],
      afterState: [...afterAddKey],
      changedIndices: findChangedIndices(state, afterAddKey),
      roundKeyIndex: round,
      roundKeyBytes: [...roundKeys[round].bytes],
    });
    state = afterAddKey;
  }

  // Round 10 (Final Round): SubBytes -> ShiftRows -> AddRoundKey (MixColumns is omitted)
  const afterR10Sub = subBytes(state);
  steps.push({
    stepIndex: steps.length,
    mode: 'encrypt',
    round: 10,
    operation: 'SubBytes',
    title: 'Final Round (10) · SubBytes',
    subtitle: 'Final S-Box substitution',
    explanation:
      'Round 10 begins with SubBytes just like Rounds 1–9, applying the invertible S-Box to every byte.',
    beforeState: [...state],
    afterState: [...afterR10Sub],
    changedIndices: findChangedIndices(state, afterR10Sub),
    roundKeyIndex: null,
    roundKeyBytes: null,
    isFinalRound: true,
  });
  state = afterR10Sub;

  const afterR10Shift = shiftRows(state);
  steps.push({
    stepIndex: steps.length,
    mode: 'encrypt',
    round: 10,
    operation: 'ShiftRows',
    title: 'Final Round (10) · ShiftRows',
    subtitle: 'Final row permutation (MixColumns is skipped after this)',
    explanation:
      'Rows are cyclically shifted left by 0, 1, 2, 3 bytes. MixColumns is deliberately omitted in Round 10 because a final unkeyed linear mix would add zero security and break encryption/decryption symmetry.',
    beforeState: [...state],
    afterState: [...afterR10Shift],
    changedIndices: findChangedIndices(state, afterR10Shift),
    roundKeyIndex: null,
    roundKeyBytes: null,
    isFinalRound: true,
  });
  state = afterR10Shift;

  const afterR10AddKey = addRoundKey(state, roundKeys[10].bytes);
  steps.push({
    stepIndex: steps.length,
    mode: 'encrypt',
    round: 10,
    operation: 'AddRoundKey',
    title: 'Final Round (10) · AddRoundKey (K10)',
    subtitle: 'Final XOR with Round Key K10 produces the 128-bit ciphertext',
    explanation:
      'XORing with the final round key K10 completes AES-128 encryption. Note that MixColumns was NOT performed in Round 10.',
    beforeState: [...state],
    afterState: [...afterR10AddKey],
    changedIndices: findChangedIndices(state, afterR10AddKey),
    roundKeyIndex: 10,
    roundKeyBytes: [...roundKeys[10].bytes],
    isFinalRound: true,
  });
  state = afterR10AddKey;

  return {
    mode: 'encrypt',
    inputBytes: [...plaintextBytes],
    keyBytes: [...keyBytes],
    outputBytes: [...state],
    roundKeys,
    steps,
  };
}

/**
 * Full FIPS 197 Section 5.3 Inverse Cipher (Decryption) with step-by-step state recording.
 */
export function decryptBlockWithTrace(
  ciphertextBytes: readonly number[],
  keyBytes: readonly number[]
): AesSimulationResult {
  if (ciphertextBytes.length !== 16) {
    throw new Error(`AES-128 block must be 16 bytes, got ${ciphertextBytes.length}.`);
  }
  const roundKeys = expandKey(keyBytes);
  const steps: AesStep[] = [];

  let state = [...ciphertextBytes];

  steps.push({
    stepIndex: 0,
    mode: 'decrypt',
    round: 0,
    operation: 'Input',
    title: 'Ciphertext State Matrix',
    subtitle: '16-byte ciphertext loaded into 4 × 4 column-major state',
    explanation:
      'Decryption starts from the 128-bit ciphertext arranged column-major and applies inverse transformations in reverse round key order (K10 down to K0).',
    beforeState: [...state],
    afterState: [...state],
    changedIndices: [],
    roundKeyIndex: null,
    roundKeyBytes: null,
  });

  // Initial Decryption AddRoundKey with K10
  const afterR0 = addRoundKey(state, roundKeys[10].bytes);
  steps.push({
    stepIndex: steps.length,
    mode: 'decrypt',
    round: 0,
    operation: 'AddRoundKey',
    title: 'Initial Step · AddRoundKey (K10)',
    subtitle: 'Undo final encryption key addition using Round Key K10',
    explanation:
      'Since XOR is its own inverse, XORing the ciphertext with K10 reverses the final AddRoundKey step of encryption.',
    beforeState: [...state],
    afterState: [...afterR0],
    changedIndices: findChangedIndices(state, afterR0),
    roundKeyIndex: 10,
    roundKeyBytes: [...roundKeys[10].bytes],
  });
  state = afterR0;

  // Inverse Rounds 1 to 9 (using K9 down to K1)
  for (let round = 1; round <= 9; round++) {
    const keyIndex = 10 - round;

    const afterInvShift = invShiftRows(state);
    steps.push({
      stepIndex: steps.length,
      mode: 'decrypt',
      round,
      operation: 'InvShiftRows',
      title: `Round ${round} · InvShiftRows`,
      subtitle: 'Circular right shift by 0, 1, 2, and 3 bytes per row',
      explanation:
        'Rows 1, 2, and 3 shift cyclically right by 1, 2, and 3 bytes to undo the forward ShiftRows permutation.',
      beforeState: [...state],
      afterState: [...afterInvShift],
      changedIndices: findChangedIndices(state, afterInvShift),
      roundKeyIndex: null,
      roundKeyBytes: null,
    });
    state = afterInvShift;

    const afterInvSub = invSubBytes(state);
    steps.push({
      stepIndex: steps.length,
      mode: 'decrypt',
      round,
      operation: 'InvSubBytes',
      title: `Round ${round} · InvSubBytes`,
      subtitle: 'Reverse byte substitution via Inverse S-Box',
      explanation:
        'Each byte is mapped back to its original pre-S-Box value using the 16 × 16 Inverse S-Box lookup table.',
      beforeState: [...state],
      afterState: [...afterInvSub],
      changedIndices: findChangedIndices(state, afterInvSub),
      roundKeyIndex: null,
      roundKeyBytes: null,
    });
    state = afterInvSub;

    const afterAddKey = addRoundKey(state, roundKeys[keyIndex].bytes);
    steps.push({
      stepIndex: steps.length,
      mode: 'decrypt',
      round,
      operation: 'AddRoundKey',
      title: `Round ${round} · AddRoundKey (K${keyIndex})`,
      subtitle: `XOR state with Round Key K${keyIndex}`,
      explanation: `XORs the state with Round Key K${keyIndex} before applying InvMixColumns.`,
      beforeState: [...state],
      afterState: [...afterAddKey],
      changedIndices: findChangedIndices(state, afterAddKey),
      roundKeyIndex: keyIndex,
      roundKeyBytes: [...roundKeys[keyIndex].bytes],
    });
    state = afterAddKey;

    const afterInvMix = invMixColumns(state);
    steps.push({
      stepIndex: steps.length,
      mode: 'decrypt',
      round,
      operation: 'InvMixColumns',
      title: `Round ${round} · InvMixColumns`,
      subtitle: 'Inverse column mixing in GF(2⁸) with [0e, 0b, 0d, 09]',
      explanation:
        'Each column is multiplied by the inverse MDS matrix over GF(2⁸) to reverse the forward MixColumns diffusion.',
      beforeState: [...state],
      afterState: [...afterInvMix],
      changedIndices: findChangedIndices(state, afterInvMix),
      roundKeyIndex: null,
      roundKeyBytes: null,
    });
    state = afterInvMix;
  }

  // Final Decryption Round (Round 10): InvShiftRows -> InvSubBytes -> AddRoundKey(K0) (InvMixColumns omitted)
  const afterR10InvShift = invShiftRows(state);
  steps.push({
    stepIndex: steps.length,
    mode: 'decrypt',
    round: 10,
    operation: 'InvShiftRows',
    title: 'Final Round (10) · InvShiftRows',
    subtitle: 'Final circular right shift',
    explanation: 'Restores the byte positions within rows 1, 2, and 3 to their original columns.',
    beforeState: [...state],
    afterState: [...afterR10InvShift],
    changedIndices: findChangedIndices(state, afterR10InvShift),
    roundKeyIndex: null,
    roundKeyBytes: null,
    isFinalRound: true,
  });
  state = afterR10InvShift;

  const afterR10InvSub = invSubBytes(state);
  steps.push({
    stepIndex: steps.length,
    mode: 'decrypt',
    round: 10,
    operation: 'InvSubBytes',
    title: 'Final Round (10) · InvSubBytes',
    subtitle: 'Final Inverse S-Box lookup (InvMixColumns is skipped)',
    explanation:
      'Applies the Inverse S-Box one last time. Because encryption skipped MixColumns in Round 10, decryption omits InvMixColumns here.',
    beforeState: [...state],
    afterState: [...afterR10InvSub],
    changedIndices: findChangedIndices(state, afterR10InvSub),
    roundKeyIndex: null,
    roundKeyBytes: null,
    isFinalRound: true,
  });
  state = afterR10InvSub;

  const afterR10AddKey = addRoundKey(state, roundKeys[0].bytes);
  steps.push({
    stepIndex: steps.length,
    mode: 'decrypt',
    round: 10,
    operation: 'AddRoundKey',
    title: 'Final Round (10) · AddRoundKey (K0)',
    subtitle: 'Final XOR with K0 recovers the exact original plaintext',
    explanation:
      'XORing with Round Key K0 reverses the initial Round 0 key whitening, recovering the original 128-bit plaintext.',
    beforeState: [...state],
    afterState: [...afterR10AddKey],
    changedIndices: findChangedIndices(state, afterR10AddKey),
    roundKeyIndex: 0,
    roundKeyBytes: [...roundKeys[0].bytes],
    isFinalRound: true,
  });
  state = afterR10AddKey;

  return {
    mode: 'decrypt',
    inputBytes: [...ciphertextBytes],
    keyBytes: [...keyBytes],
    outputBytes: [...state],
    roundKeys,
    steps,
  };
}

// Fast block functions for Multi-Block modes
export function encryptBlock(plaintextBytes: readonly number[], keyBytes: readonly number[]): number[] {
  return encryptBlockWithTrace(plaintextBytes, keyBytes).outputBytes;
}

export function decryptBlock(ciphertextBytes: readonly number[], keyBytes: readonly number[]): number[] {
  return decryptBlockWithTrace(ciphertextBytes, keyBytes).outputBytes;
}

// Standard PKCS#7 Padding (RFC 5652 Section 6.3)
export function pkcs7Pad(data: readonly number[], blockSize = 16): number[] {
  const padLen = blockSize - (data.length % blockSize);
  const padded = [...data];
  for (let i = 0; i < padLen; i++) {
    padded.push(padLen);
  }
  return padded;
}

export function pkcs7Unpad(data: readonly number[], blockSize = 16): number[] {
  if (data.length === 0 || data.length % blockSize !== 0) {
    throw new Error('Invalid padded length: must be a non-empty multiple of 16 bytes.');
  }
  const padLen = data[data.length - 1];
  if (padLen < 1 || padLen > blockSize) {
    throw new Error(`Invalid PKCS#7 padding byte: 0x${formatHexByte(padLen)}.`);
  }
  for (let i = data.length - padLen; i < data.length; i++) {
    if (data[i] !== padLen) {
      throw new Error('Invalid PKCS#7 padding structure (padding bytes mismatch).');
    }
  }
  return data.slice(0, data.length - padLen);
}

export function encryptMultiBlock(
  plaintextBytes: readonly number[],
  keyBytes: readonly number[],
  mode: 'ecb-pkcs7' | 'cbc-pkcs7',
  ivBytes?: readonly number[]
): MultiBlockResult {
  const padded = pkcs7Pad(plaintextBytes, 16);
  const iv = mode === 'cbc-pkcs7' ? [...(ivBytes ?? new Array(16).fill(0))] : null;
  if (iv && iv.length !== 16) {
    throw new Error('CBC Initialization Vector (IV) must be 16 bytes.');
  }

  const blocks: { blockIndex: number; plaintextBlock: number[]; cipherBlock: number[] }[] = [];
  const cipherBytes: number[] = [];
  let prevCipher = iv ? [...iv] : null;

  for (let b = 0; b < padded.length; b += 16) {
    const rawBlock = padded.slice(b, b + 16);
    const inputToCipher =
      mode === 'cbc-pkcs7' && prevCipher
        ? rawBlock.map((byte, idx) => byte ^ prevCipher![idx])
        : rawBlock;
    const cipherBlock = encryptBlock(inputToCipher, keyBytes);
    blocks.push({
      blockIndex: b / 16,
      plaintextBlock: rawBlock,
      cipherBlock,
    });
    cipherBytes.push(...cipherBlock);
    prevCipher = cipherBlock;
  }

  return { cipherBytes, ivBytes: iv, blocks };
}

export function decryptMultiBlock(
  cipherBytes: readonly number[],
  keyBytes: readonly number[],
  mode: 'ecb-pkcs7' | 'cbc-pkcs7',
  ivBytes?: readonly number[]
): { plaintextBytes: number[]; paddedBytes: number[]; blocks: { blockIndex: number; cipherBlock: number[]; plaintextBlock: number[] }[] } {
  if (cipherBytes.length === 0 || cipherBytes.length % 16 !== 0) {
    throw new Error('Ciphertext must be a non-empty multiple of 16 bytes.');
  }
  const iv = mode === 'cbc-pkcs7' ? [...(ivBytes ?? new Array(16).fill(0))] : null;
  if (iv && iv.length !== 16) {
    throw new Error('CBC Initialization Vector (IV) must be 16 bytes.');
  }

  const paddedBytes: number[] = [];
  const blocks: { blockIndex: number; cipherBlock: number[]; plaintextBlock: number[] }[] = [];
  let prevCipher = iv ? [...iv] : null;

  for (let b = 0; b < cipherBytes.length; b += 16) {
    const cipherBlock = cipherBytes.slice(b, b + 16);
    const decryptedRaw = decryptBlock(cipherBlock, keyBytes);
    const plainBlock =
      mode === 'cbc-pkcs7' && prevCipher
        ? decryptedRaw.map((byte, idx) => byte ^ prevCipher![idx])
        : decryptedRaw;
    paddedBytes.push(...plainBlock);
    blocks.push({
      blockIndex: b / 16,
      cipherBlock,
      plaintextBlock: plainBlock,
    });
    prevCipher = cipherBlock;
  }

  const plaintextBytes = pkcs7Unpad(paddedBytes, 16);
  return { plaintextBytes, paddedBytes, blocks };
}

export interface MixColumnRowComputation {
  row: number;
  coefficients: number[];
  columnInputs: number[];
  products: number[];
  result: number;
}

/**
 * Returns exact GF(2^8) multiplication details for a selected column during MixColumns or InvMixColumns.
 */
export function computeMixColumnBreakdown(
  beforeState: readonly number[],
  col: number,
  inverse: boolean
): MixColumnRowComputation[] {
  const matrix = inverse ? INV_MIX_MATRIX : MIX_MATRIX;
  const inputs = [0, 1, 2, 3].map((r) => beforeState[r + 4 * col]);

  return matrix.map((coeffs, row) => {
    const products = coeffs.map((coeff, i) => gfMul(coeff, inputs[i]));
    const result = products.reduce((acc, val) => acc ^ val, 0);
    return {
      row,
      coefficients: [...coeffs],
      columnInputs: [...inputs],
      products,
      result,
    };
  });
}
