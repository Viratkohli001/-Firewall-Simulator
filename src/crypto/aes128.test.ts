import {
  SBOX,
  INV_SBOX,
  bytesToHex,
  decryptBlockWithTrace,
  decryptMultiBlock,
  encryptBlockWithTrace,
  encryptMultiBlock,
  expandKey,
  invMixColumns,
  mixColumns,
  validateSingleBlockInput,
} from './aes128.ts';

export interface AesTestCaseResult {
  id: string;
  name: string;
  standard: string;
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
}

function hexToBytes(hex: string): number[] {
  const res: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    res.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return res;
}

export function runAes128TestSuite(): AesTestCaseResult[] {
  const results: AesTestCaseResult[] = [];

  // 1. S-Box & Inverse S-Box Bijectivity
  let sboxValid = true;
  for (let i = 0; i < 256; i++) {
    if (INV_SBOX[SBOX[i]] !== i || SBOX[INV_SBOX[i]] !== i) {
      sboxValid = false;
      break;
    }
  }
  results.push({
    id: 'sbox-bijective',
    name: 'S-Box & Inverse S-Box Bijectivity (256 entries)',
    standard: 'FIPS 197 §5.1.1 / §5.3.2',
    passed: sboxValid && SBOX[0x00] === 0x63 && SBOX[0x53] === 0xed,
    expected: 'INV_SBOX[SBOX[x]] == x for all 256 bytes',
    actual: sboxValid ? 'All 256 mappings invertible' : 'Mismatch detected',
    details: 'Verifies that every S-Box substitution has an exact 1-to-1 inverse.',
  });

  // 2. MixColumns & InvMixColumns Identity
  const sampleState = hexToBytes('00112233445566778899aabbccddeeff');
  const mixRoundTrip = bytesToHex(invMixColumns(mixColumns(sampleState)));
  results.push({
    id: 'mixcolumns-inverse',
    name: 'MixColumns / InvMixColumns GF(2⁸) Identity',
    standard: 'FIPS 197 §5.1.3 / §5.3.3',
    passed: mixRoundTrip === '00112233445566778899aabbccddeeff',
    expected: '00112233445566778899aabbccddeeff',
    actual: mixRoundTrip,
    details: 'Confirms GF(2⁸) polynomial matrix multiplication reverses cleanly.',
  });

  // 3. FIPS 197 Appendix A.1 Key Expansion
  const keyA1 = hexToBytes('2b7e151628aed2a6abf7158809cf4f3c');
  const rkA1 = expandKey(keyA1);
  const k1Match = rkA1[1].hex === 'a0fafe1788542cb123a339392a6c7605';
  const k10Match = rkA1[10].hex === 'd014f9a8c9ee2589e13f0cc8b6630ca6';
  results.push({
    id: 'fips-197-key-expansion',
    name: 'Key Expansion (K0 → K10, 44 Words)',
    standard: 'FIPS 197 Appendix A.1',
    passed: rkA1.length === 11 && k1Match && k10Match,
    expected: 'K1=a0fafe17...7605, K10=d014f9a8...0ca6',
    actual: `K1=${rkA1[1].hex.slice(0, 8)}...${rkA1[1].hex.slice(-4)}, K10=${rkA1[10].hex.slice(0, 8)}...${rkA1[10].hex.slice(-4)}`,
    details: 'Validates RotWord, SubWord, Rcon, and word XOR recurrence across 11 round keys.',
  });

  // 4. FIPS 197 Appendix B Official Encryption Vector
  const ptB = hexToBytes('00112233445566778899aabbccddeeff');
  const keyB = hexToBytes('000102030405060708090a0b0c0d0e0f');
  const encB = encryptBlockWithTrace(ptB, keyB);
  const ctBHex = bytesToHex(encB.outputBytes);
  results.push({
    id: 'fips-197-appendix-b-encrypt',
    name: 'FIPS 197 Appendix B Encryption Test Vector',
    standard: 'FIPS 197 Appendix B',
    passed: ctBHex === '69c4e0d86a7b0430d8cdb78070b4c55a' && encB.steps.length === 41,
    expected: '69c4e0d86a7b0430d8cdb78070b4c55a',
    actual: ctBHex,
    details: `Executed ${encB.steps.length} recorded trace states (Initial + 10 rounds, MixColumns omitted in R10).`,
  });

  // 5. FIPS 197 Appendix B Official Decryption Vector
  const decB = decryptBlockWithTrace(encB.outputBytes, keyB);
  const recBHex = bytesToHex(decB.outputBytes);
  results.push({
    id: 'fips-197-appendix-b-decrypt',
    name: 'FIPS 197 Appendix B Decryption Round-Trip',
    standard: 'FIPS 197 §5.3 Inverse Cipher',
    passed: recBHex === '00112233445566778899aabbccddeeff' && decB.steps.length === 41,
    expected: '00112233445566778899aabbccddeeff',
    actual: recBHex,
    details: 'Recovers original plaintext via InvShiftRows, InvSubBytes, AddRoundKey, and InvMixColumns.',
  });

  // 6. NIST SP 800-38A F.1.1 Known Answer Test
  const ptNist = hexToBytes('6bc1bee22e409f96e93d7e117393172a');
  const encNist = encryptBlockWithTrace(ptNist, keyA1);
  const ctNistHex = bytesToHex(encNist.outputBytes);
  const decNist = decryptBlockWithTrace(encNist.outputBytes, keyA1);
  results.push({
    id: 'nist-sp800-38a-ecb',
    name: 'NIST SP 800-38A AES-128 Block KAT',
    standard: 'NIST SP 800-38A F.1.1',
    passed:
      ctNistHex === '3ad77bb40d7a3660a89ecaf32466ef97' &&
      bytesToHex(decNist.outputBytes) === '6bc1bee22e409f96e93d7e117393172a',
    expected: '3ad77bb40d7a3660a89ecaf32466ef97',
    actual: ctNistHex,
    details: 'Secondary independent vector verification for both encryption and inverse decryption.',
  });

  // 7. UTF-8 Multi-Block CBC + PKCS#7 Round-Trip
  const utf8Message = 'AES-128 UTF-8 Check: π, € & Cryptography!';
  const utf8Bytes = Array.from(new TextEncoder().encode(utf8Message));
  const iv = hexToBytes('000102030405060708090a0b0c0d0e0f');
  const cbcEnc = encryptMultiBlock(utf8Bytes, keyA1, 'cbc-pkcs7', iv);
  const cbcDec = decryptMultiBlock(cbcEnc.cipherBytes, keyA1, 'cbc-pkcs7', iv);
  const decodedMsg = new TextDecoder().decode(new Uint8Array(cbcDec.plaintextBytes));
  results.push({
    id: 'utf8-cbc-pkcs7',
    name: 'Multi-Block UTF-8 CBC + PKCS#7 Round-Trip',
    standard: 'RFC 5652 PKCS#7 / NIST CBC',
    passed: decodedMsg === utf8Message && cbcEnc.blocks.length === 3,
    expected: utf8Message,
    actual: decodedMsg,
    details: `Encoded ${utf8Bytes.length} UTF-8 bytes across ${cbcEnc.blocks.length} padded 16-byte blocks.`,
  });

  // 8. Input Validation (No Silent Truncation)
  const shortKeyCheck = validateSingleBlockInput('001122', 'hex', 'Key');
  const badUtf8Len = validateSingleBlockInput('Short text', 'utf8', 'Plaintext');
  results.push({
    id: 'strict-input-validation',
    name: 'Strict 128-bit Input Validation (No Silent Truncation)',
    standard: 'Input Integrity Check',
    passed: !shortKeyCheck.valid && !badUtf8Len.valid,
    expected: 'Reject non-16-byte single-block inputs',
    actual: !shortKeyCheck.valid && !badUtf8Len.valid ? 'Rejected with descriptive errors' : 'Failed',
    details: 'Ensures invalid lengths or non-hex inputs fail loudly instead of silently padding or slicing.',
  });

  return results;
}

// Allow direct CLI execution via `npx tsx src/crypto/aes128.test.ts`
const isDirectCli =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1]?.endsWith('aes128.test.ts');

if (isDirectCli) {
  const results = runAes128TestSuite();
  let failures = 0;
  for (const r of results) {
    const badge = r.passed ? 'PASS' : 'FAIL';
    console.log(`[${badge}] ${r.name} (${r.standard})`);
    if (!r.passed) {
      failures++;
      console.error(`  Expected: ${r.expected}`);
      console.error(`  Actual:   ${r.actual}`);
    }
  }
  console.log(`\nSummary: ${results.length - failures}/${results.length} tests passed.`);
  if (failures > 0) {
    process.exit(1);
  }
}
