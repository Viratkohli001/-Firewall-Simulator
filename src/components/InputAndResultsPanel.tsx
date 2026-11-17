import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  RotateCcw,
  Unlock,
} from 'lucide-react';
import { useState } from 'react';
import {
  AesMode,
  BlockMode,
  InputEncoding,
  bytesToHex,
  bytesToSafeAsciiPreview,
  tryDecodeUtf8,
} from '../crypto/aes128.ts';
import { PRESET_VECTORS, PresetVector } from '../data/education.ts';

interface InputAndResultsPanelProps {
  blockMode: BlockMode;
  onChangeBlockMode: (mode: BlockMode) => void;
  plaintextValue: string;
  plaintextEncoding: InputEncoding;
  onChangePlaintext: (val: string) => void;
  onChangePlaintextEncoding: (enc: InputEncoding) => void;
  keyValue: string;
  keyEncoding: InputEncoding;
  onChangeKey: (val: string) => void;
  onChangeKeyEncoding: (enc: InputEncoding) => void;
  ivHexValue: string;
  onChangeIvHex: (val: string) => void;
  plaintextError: string | null;
  keyError: string | null;
  ivError: string | null;
  plaintextByteCount: number;
  keyByteCount: number;
  activeSimMode: AesMode;
  originalPlaintextBytes: number[] | null;
  encryptedCipherBytes: number[] | null;
  decryptedPlaintextBytes: number[] | null;
  customCiphertextHex: string;
  ciphertextError: string | null;
  onChangeCustomCiphertextHex: (val: string) => void;
  multiBlockList: { blockIndex: number; plaintextBlock: number[]; cipherBlock: number[] }[];
  inspectedBlockIndex: number;
  onSelectInspectedBlock: (idx: number) => void;
  onSelectPreset: (preset: PresetVector) => void;
  onEncrypt: () => void;
  onDecrypt: () => void;
  onReset: () => void;
}

export function InputAndResultsPanel({
  blockMode,
  onChangeBlockMode,
  plaintextValue,
  plaintextEncoding,
  onChangePlaintext,
  onChangePlaintextEncoding,
  keyValue,
  keyEncoding,
  onChangeKey,
  onChangeKeyEncoding,
  ivHexValue,
  onChangeIvHex,
  plaintextError,
  keyError,
  ivError,
  plaintextByteCount,
  keyByteCount,
  activeSimMode,
  originalPlaintextBytes,
  encryptedCipherBytes,
  decryptedPlaintextBytes,
  customCiphertextHex,
  ciphertextError,
  onChangeCustomCiphertextHex,
  multiBlockList,
  inspectedBlockIndex,
  onSelectInspectedBlock,
  onSelectPreset,
  onEncrypt,
  onDecrypt,
  onReset,
}: InputAndResultsPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // Clipboard fallback ignored if blocked in headless sandbox
    }
  };

  const originalHex = originalPlaintextBytes ? bytesToHex(originalPlaintextBytes) : '—';
  const encryptedHex = encryptedCipherBytes ? bytesToHex(encryptedCipherBytes) : '—';
  const decryptedHex = decryptedPlaintextBytes ? bytesToHex(decryptedPlaintextBytes) : '—';

  const originalUtf8 = originalPlaintextBytes
    ? tryDecodeUtf8(originalPlaintextBytes)
    : { valid: false, text: '' };
  const decryptedUtf8 = decryptedPlaintextBytes
    ? tryDecodeUtf8(decryptedPlaintextBytes)
    : { valid: false, text: '' };

  const isExactRoundTrip =
    originalPlaintextBytes !== null &&
    decryptedPlaintextBytes !== null &&
    originalHex === decryptedHex;

  return (
    <div className="space-y-6">
      {/* Section 1: Input Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">1. Input &amp; Key Configuration</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Choose single-block FIPS 197 simulation (exact 16 bytes) or full-message PKCS#7 mode.
            </p>
          </div>

          {/* Single-block vs Full-message selector */}
          <div className="inline-flex flex-wrap items-center p-1 bg-slate-100 border border-slate-200 rounded-lg gap-1">
            <button
              type="button"
              onClick={() => onChangeBlockMode('single')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                blockMode === 'single'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Single Block (16B)
            </button>
            <button
              type="button"
              onClick={() => onChangeBlockMode('ecb-pkcs7')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                blockMode === 'ecb-pkcs7'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Block ECB (PKCS#7)
            </button>
            <button
              type="button"
              onClick={() => onChangeBlockMode('cbc-pkcs7')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                blockMode === 'cbc-pkcs7'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Block CBC (PKCS#7)
            </button>
          </div>
        </div>

        {/* Sample Preset Loader */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-500">Test Vectors &amp; Samples:</span>
          {PRESET_VECTORS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Plaintext & Key Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Plaintext Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="aes-plaintext-input" className="text-sm font-semibold text-slate-800">
                Plaintext Input
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono tabular-nums ${
                    blockMode === 'single' && plaintextByteCount !== 16
                      ? 'text-red-600 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {blockMode === 'single'
                    ? `${plaintextByteCount} / 16 bytes`
                    : `${plaintextByteCount} bytes`}
                </span>
                <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => onChangePlaintextEncoding('hex')}
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      plaintextEncoding === 'hex'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hex
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangePlaintextEncoding('utf8')}
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      plaintextEncoding === 'utf8'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    UTF-8
                  </button>
                </div>
              </div>
            </div>

            <input
              id="aes-plaintext-input"
              type="text"
              value={plaintextValue}
              onChange={(e) => onChangePlaintext(e.target.value)}
              placeholder={
                plaintextEncoding === 'hex'
                  ? '32 hex characters (e.g. 00112233445566778899aabbccddeeff)'
                  : blockMode === 'single'
                  ? 'Exact 16 UTF-8 bytes (e.g. AES-128 Sandbox!)'
                  : 'Enter any UTF-8 message...'
              }
              spellCheck={false}
              className={`w-full px-3.5 py-2.5 font-mono text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                plaintextError
                  ? 'border-red-400 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />

            {plaintextError ? (
              <p className="flex items-start gap-1.5 text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{plaintextError}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {blockMode === 'single'
                  ? 'Single-Block mode requires an exact 128-bit (16-byte) block without truncation or custom padding.'
                  : 'Multi-Block mode splits arbitrary-length input into 16-byte blocks with standard PKCS#7 padding.'}
              </p>
            )}
          </div>

          {/* Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="aes-key-input" className="text-sm font-semibold text-slate-800">
                128-Bit Secret Key
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono tabular-nums ${
                    keyByteCount !== 16 ? 'text-red-600 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {keyByteCount} / 16 bytes
                </span>
                <div className="inline-flex p-0.5 bg-slate-100 border border-slate-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => onChangeKeyEncoding('hex')}
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      keyEncoding === 'hex'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hex
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeKeyEncoding('utf8')}
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      keyEncoding === 'utf8'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    UTF-8
                  </button>
                </div>
              </div>
            </div>

            <input
              id="aes-key-input"
              type="text"
              value={keyValue}
              onChange={(e) => onChangeKey(e.target.value)}
              placeholder={
                keyEncoding === 'hex'
                  ? '32 hex characters (e.g. 000102030405060708090a0b0c0d0e0f)'
                  : 'Exact 16 UTF-8 bytes (e.g. SecretKey1234567)'
              }
              spellCheck={false}
              className={`w-full px-3.5 py-2.5 font-mono text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-colors ${
                keyError
                  ? 'border-red-400 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />

            {keyError ? (
              <p className="flex items-start gap-1.5 text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{keyError}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                AES-128 requires an exact 128-bit (16-byte) key expanded into Round Keys K0–K10.
              </p>
            )}
          </div>
        </div>

        {/* Optional CBC Initialization Vector */}
        {blockMode === 'cbc-pkcs7' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="aes-iv-input" className="text-xs font-semibold text-slate-700">
                CBC Initialization Vector (IV · 32 Hex Characters / 16 Bytes)
              </label>
            </div>
            <input
              id="aes-iv-input"
              type="text"
              value={ivHexValue}
              onChange={(e) => onChangeIvHex(e.target.value)}
              placeholder="000102030405060708090a0b0c0d0e0f"
              spellCheck={false}
              className={`w-full px-3.5 py-2 font-mono text-xs sm:text-sm rounded-lg border bg-white text-slate-900 focus:outline-none focus:ring-2 ${
                ivError
                  ? 'border-red-400 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
            {ivError && (
              <p className="flex items-start gap-1.5 text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{ivError}</span>
              </p>
            )}
          </div>
        )}

        {/* Action Buttons + Ciphertext Direct Decrypt Input */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onEncrypt}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                activeSimMode === 'encrypt'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Encrypt</span>
            </button>

            <button
              type="button"
              onClick={onDecrypt}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 ${
                activeSimMode === 'decrypt'
                  ? 'bg-violet-700 border-violet-700 text-white hover:bg-violet-800 shadow-sm'
                  : 'bg-violet-50 border-violet-300 text-violet-800 hover:bg-violet-100'
              }`}
            >
              <Unlock className="w-4 h-4" aria-hidden="true" />
              <span>Decrypt</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Active trace:{' '}
            <span
              className={`font-semibold ${
                activeSimMode === 'encrypt' ? 'text-blue-700' : 'text-violet-700'
              }`}
            >
              {activeSimMode === 'encrypt' ? 'Encryption (Forward Cipher)' : 'Decryption (Inverse Cipher)'}
            </span>
          </div>
        </div>
      </section>

      {/* Section 4: Encryption & Decryption Results */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Encryption &amp; Decryption Results</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hexadecimal output is lossless; UTF-8/ASCII previews are shown alongside.
            </p>
          </div>

          {isExactRoundTrip && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Decrypted Plaintext Matches Original</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Original Plaintext */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">Original Plaintext</span>
              {originalPlaintextBytes && (
                <button
                  type="button"
                  onClick={() => handleCopy('orig', originalHex)}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
                >
                  {copiedField === 'orig' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="font-mono text-xs text-slate-900 break-all bg-white border border-slate-200 rounded px-2.5 py-2">
              {originalHex}
            </div>
            {originalPlaintextBytes && (
              <div className="text-xs text-slate-600 truncate">
                UTF-8:{' '}
                <span className="font-mono text-slate-800">
                  {originalUtf8.valid
                    ? originalUtf8.text
                    : bytesToSafeAsciiPreview(originalPlaintextBytes)}
                </span>
              </div>
            )}
          </div>

          {/* Encrypted Ciphertext (also editable for custom decryption testing!) */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="ciphertext-hex-box" className="text-xs font-semibold text-blue-950">
                Encrypted Ciphertext (Hex)
              </label>
              {encryptedCipherBytes && (
                <button
                  type="button"
                  onClick={() => handleCopy('cipher', encryptedHex)}
                  className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                >
                  {copiedField === 'cipher' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              id="ciphertext-hex-box"
              type="text"
              value={customCiphertextHex}
              onChange={(e) => onChangeCustomCiphertextHex(e.target.value)}
              spellCheck={false}
              className={`w-full font-mono text-xs text-blue-950 bg-white border rounded px-2.5 py-2 focus:outline-none focus:ring-2 ${
                ciphertextError
                  ? 'border-red-400 focus:ring-red-500/20'
                  : 'border-blue-200 focus:border-blue-600 focus:ring-blue-600/20'
              }`}
            />
            {ciphertextError ? (
              <p className="text-xs text-red-700">{ciphertextError}</p>
            ) : (
              <p className="text-[11px] text-blue-800">
                Edit hex here and click Decrypt to test any ciphertext block.
              </p>
            )}
          </div>

          {/* Decrypted Plaintext */}
          <div className="bg-violet-50/50 border border-violet-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-violet-950">Decrypted Plaintext</span>
              {decryptedPlaintextBytes && (
                <button
                  type="button"
                  onClick={() => handleCopy('dec', decryptedHex)}
                  className="inline-flex items-center gap-1 text-xs text-violet-700 hover:text-violet-900"
                >
                  {copiedField === 'dec' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="font-mono text-xs text-violet-950 break-all bg-white border border-violet-200 rounded px-2.5 py-2">
              {decryptedPlaintextBytes ? decryptedHex : 'Click Decrypt to recover plaintext'}
            </div>
            {decryptedPlaintextBytes && (
              <div className="text-xs text-slate-600 truncate">
                UTF-8:{' '}
                <span className="font-mono text-slate-800">
                  {decryptedUtf8.valid
                    ? decryptedUtf8.text
                    : bytesToSafeAsciiPreview(decryptedPlaintextBytes)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-block Inspector Selector */}
        {blockMode !== 'single' && multiBlockList.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">
              Multi-Block Visualizer Target ({multiBlockList.length} padded 16-byte blocks):
            </span>
            {multiBlockList.map((blk) => (
              <button
                key={blk.blockIndex}
                type="button"
                onClick={() => onSelectInspectedBlock(blk.blockIndex)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-colors ${
                  inspectedBlockIndex === blk.blockIndex
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Block {blk.blockIndex + 1}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
