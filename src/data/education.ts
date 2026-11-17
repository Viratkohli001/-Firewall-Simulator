export interface OperationConcept {
  id: string;
  name: string;
  role: string;
  shortSummary: string;
  details: string;
  inverseName: string;
  accentColor: string;
}

export interface VivaQuestion {
  id: number;
  question: string;
  answer: string;
  keyTakeaway: string;
}

export interface PresetVector {
  id: string;
  label: string;
  description: string;
  encoding: 'hex' | 'utf8';
  plaintext: string;
  key: string;
  expectedCiphertextHex?: string;
}

export const PRESET_VECTORS: PresetVector[] = [
  {
    id: 'fips-197',
    label: 'FIPS 197 Appendix B Vector',
    description: 'Official NIST standard test vector for verifying exact AES-128 output.',
    encoding: 'hex',
    plaintext: '00112233445566778899aabbccddeeff',
    key: '000102030405060708090a0b0c0d0e0f',
    expectedCiphertextHex: '69c4e0d86a7b0430d8cdb78070b4c55a',
  },
  {
    id: 'nist-kat',
    label: 'NIST SP 800-38A Vector',
    description: 'Standard FIPS 197 / SP 800-38A known-answer block test.',
    encoding: 'hex',
    plaintext: '6bc1bee22e409f96e93d7e117393172a',
    key: '2b7e151628aed2a6abf7158809cf4f3c',
    expectedCiphertextHex: '3ad77bb40d7a3660a89ecaf32466ef97',
  },
  {
    id: 'utf8-sample',
    label: 'UTF-8 Text Block (16 Bytes)',
    description: 'Human-readable 16-byte ASCII/UTF-8 block and 16-byte secret key.',
    encoding: 'utf8',
    plaintext: 'AES-128 Sandbox!',
    key: 'SecretKey1234567',
  },
];

export const AES_SPECS = [
  { label: 'Standard', value: 'FIPS 197 (Rijndael)' },
  { label: 'Cipher Type', value: 'Symmetric Block Cipher' },
  { label: 'Block Size', value: '128 bits (16 bytes)' },
  { label: 'Key Size', value: '128 bits (16 bytes)' },
  { label: 'State Matrix', value: '4 × 4 bytes (Column-major)' },
  { label: 'Total Rounds', value: '10 Rounds (11 Round Keys)' },
];

export const OPERATION_CONCEPTS: OperationConcept[] = [
  {
    id: 'subbytes',
    name: 'SubBytes',
    role: 'Confusion (Non-linear Substitution)',
    shortSummary: 'Replaces every byte in the 4 × 4 matrix using a fixed 16 × 16 S-Box lookup table.',
    details:
      'Each byte is split into two 4-bit nibbles: the upper nibble picks the S-Box row and the lower nibble picks the column. Mathematically derived from the multiplicative inverse in GF(2⁸) followed by an affine transformation, breaking linear patterns between input and output.',
    inverseName: 'InvSubBytes (uses the 16 × 16 Inverse S-Box)',
    accentColor: 'blue',
  },
  {
    id: 'shiftrows',
    name: 'ShiftRows',
    role: 'Diffusion (Inter-column Permutation)',
    shortSummary: 'Cyclically shifts rows 0, 1, 2, and 3 to the left by 0, 1, 2, and 3 bytes respectively.',
    details:
      'Without ShiftRows, each column of the state matrix would be encrypted independently. Shifting rows spreads bytes from every input column across all four columns before MixColumns runs.',
    inverseName: 'InvShiftRows (cyclically shifts rows 1, 2, 3 to the right)',
    accentColor: 'sky',
  },
  {
    id: 'mixcolumns',
    name: 'MixColumns',
    role: 'Diffusion (GF(2⁸) Linear Mixing)',
    shortSummary: 'Multiplies each 4-byte column by a fixed MDS matrix in Galois Field GF(2⁸).',
    details:
      'Each output byte in a column becomes a weighted XOR combination of all 4 input bytes in that column using polynomials modulo x⁸ + x⁴ + x³ + x + 1. Combined with ShiftRows, every plaintext byte influences all 16 state bytes after just 2 rounds. Omitted in Round 10.',
    inverseName: 'InvMixColumns (multiplies by [0e, 0b, 0d, 09] matrix in GF(2⁸))',
    accentColor: 'violet',
  },
  {
    id: 'addroundkey',
    name: 'AddRoundKey',
    role: 'Key Mixing (Bitwise XOR)',
    shortSummary: 'Combines the 4 × 4 state matrix with the active 128-bit Round Key using bitwise XOR.',
    details:
      'Each byte of the state is XORed with the corresponding byte of Round Key Kr (for r = 0..10). Because XOR is its own inverse (A ⊕ K ⊕ K = A), decryption uses the exact same AddRoundKey operation with keys applied in reverse order (K10 down to K0).',
    inverseName: 'AddRoundKey (self-inverse via XOR)',
    accentColor: 'emerald',
  },
  {
    id: 'keyexpansion',
    name: 'Key Expansion',
    role: 'Schedule Generation (11 Round Keys)',
    shortSummary: 'Expands the original 128-bit key (4 words) into 44 words forming Round Keys K0–K10.',
    details:
      'Every 4th word undergoes RotWord (1-byte circular rotation), SubWord (S-Box substitution), and XOR with the round constant Rcon[i] to eliminate symmetry and resist related-key attacks.',
    inverseName: 'Uses the same 11 round keys in reverse order (K10 → K0)',
    accentColor: 'indigo',
  },
];

export const VIVA_QUESTIONS: VivaQuestion[] = [
  {
    id: 1,
    question: 'What is AES?',
    answer:
      'AES (Advanced Encryption Standard) is a symmetric-key block cipher standardized by NIST in FIPS 197 (2001), based on the Rijndael algorithm by Joan Daemen and Vincent Rijmen. It encrypts fixed 128-bit (16-byte) data blocks using 128-, 192-, or 256-bit keys.',
    keyTakeaway: 'FIPS 197 standard · 128-bit block cipher',
  },
  {
    id: 2,
    question: 'Why is AES called symmetric encryption?',
    answer:
      'AES is called symmetric because the exact same secret key (and its derived round keys) is used for both encryption and decryption—applied forward (K0 to K10) to encrypt and in reverse (K10 to K0) to decrypt.',
    keyTakeaway: 'Same shared secret key for encrypt & decrypt',
  },
  {
    id: 3,
    question: 'Why does AES-128 use 10 rounds?',
    answer:
      'Ten rounds provide a strong security margin against differential, linear, and algebraic cryptanalysis while remaining fast in hardware and software. Key size dictates round count: 128-bit uses 10 rounds, 192-bit uses 12, and 256-bit uses 14.',
    keyTakeaway: '10 rounds balance full diffusion & speed for 128-bit keys',
  },
  {
    id: 4,
    question: 'What is the purpose of SubBytes?',
    answer:
      'SubBytes is the only non-linear transformation in AES. By substituting every byte through the invertible S-Box, it provides Shannon’s "confusion", obscuring the algebraic relationship between the key and ciphertext.',
    keyTakeaway: 'Provides non-linearity & confusion via the S-Box',
  },
  {
    id: 5,
    question: 'What happens during ShiftRows?',
    answer:
      'ShiftRows performs a circular left byte shift on each row of the 4 × 4 state matrix: Row 0 shifts by 0 bytes, Row 1 by 1 byte, Row 2 by 2 bytes, and Row 3 by 3 bytes. This moves bytes across columns so columns do not remain isolated.',
    keyTakeaway: 'Circular left shifts (0, 1, 2, 3) diffuse bytes across columns',
  },
  {
    id: 6,
    question: 'Why is MixColumns required?',
    answer:
      'MixColumns mixes all four bytes within each column using polynomial matrix multiplication over GF(2⁸). Together with ShiftRows, it achieves full diffusion—changing a single input bit alters roughly half of the ciphertext bits within two rounds.',
    keyTakeaway: 'Vertical column diffusion in GF(2⁸)',
  },
  {
    id: 7,
    question: 'What is AddRoundKey?',
    answer:
      'AddRoundKey performs a bitwise XOR between the 16-byte state matrix and the current 16-byte round key Kr. It is the step that directly injects secret key material into the cipher and is self-inverse under XOR.',
    keyTakeaway: 'Bitwise XOR with Round Key Kr (self-inverse)',
  },
  {
    id: 8,
    question: 'What is Key Expansion?',
    answer:
      'Key Expansion (the AES key schedule) deterministically generates 11 distinct 128-bit round keys (K0 through K10, totaling 44 32-bit words) from the single user-supplied 128-bit key using RotWord, SubWord, and Rcon round constants.',
    keyTakeaway: 'Derives K0..K10 (44 words) from the single 128-bit key',
  },
  {
    id: 9,
    question: 'Why is MixColumns skipped in the final round?',
    answer:
      'In Round 10, MixColumns is omitted because an unkeyed linear transformation right before the final AddRoundKey can be inverted without the key, adding zero cryptographic strength while breaking the structural symmetry needed for fast decryption.',
    keyTakeaway: 'Adds no security at the end & preserves encrypt/decrypt symmetry',
  },
  {
    id: 10,
    question: 'Where is AES used in real life?',
    answer:
      'AES secures HTTPS/TLS web traffic, Wi-Fi networks (WPA2/WPA3), full-disk encryption (BitLocker, FileVault, LUKS), SSH, VPN tunnels, messaging apps, password managers, and banking/payment infrastructure worldwide.',
    keyTakeaway: 'TLS/HTTPS, WPA2/WPA3 Wi-Fi, disk encryption, VPNs',
  },
];
