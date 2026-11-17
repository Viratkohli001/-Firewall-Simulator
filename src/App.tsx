import { ArrowRight, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EducationalHub } from './components/EducationalHub.tsx';
import { Header } from './components/Header.tsx';
import { InputAndResultsPanel } from './components/InputAndResultsPanel.tsx';
import { KeyExpansionPanel } from './components/KeyExpansionPanel.tsx';
import { OperationVisualizer } from './components/OperationVisualizer.tsx';
import { SimulationControls } from './components/SimulationControls.tsx';
import { StateMatrix } from './components/StateMatrix.tsx';
import {
  AesMode,
  AesSimulationResult,
  BlockMode,
  InputEncoding,
  bytesToHex,
  decryptBlockWithTrace,
  decryptMultiBlock,
  encryptBlockWithTrace,
  encryptMultiBlock,
  validateCiphertextBlocksHex,
  validateMultiBlockPlaintext,
  validateSingleBlockInput,
} from './crypto/aes128.ts';
import { PRESET_VECTORS, PresetVector } from './data/education.ts';

const DEFAULT_PRESET = PRESET_VECTORS[0];
const DEFAULT_IV_HEX = '000102030405060708090a0b0c0d0e0f';

type DemoPhase =
  | 'idle'
  | 'encrypting'
  | 'encrypt-pause'
  | 'decrypting'
  | 'complete';

function getByteLengthPreview(raw: string, encoding: InputEncoding): number {
  if (encoding === 'hex') {
    const cleaned = raw.replace(/\s+/g, '');
    return Math.ceil(cleaned.length / 2);
  }
  return new TextEncoder().encode(raw).length;
}

export default function App() {
  // Input configuration state
  const [blockMode, setBlockMode] = useState<BlockMode>('single');
  const [plaintextValue, setPlaintextValue] = useState<string>(DEFAULT_PRESET.plaintext);
  const [plaintextEncoding, setPlaintextEncoding] = useState<InputEncoding>('hex');
  const [keyValue, setKeyValue] = useState<string>(DEFAULT_PRESET.key);
  const [keyEncoding, setKeyEncoding] = useState<InputEncoding>('hex');
  const [ivHexValue, setIvHexValue] = useState<string>(DEFAULT_IV_HEX);

  // Validation error states
  const [plaintextError, setPlaintextError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [ivError, setIvError] = useState<string | null>(null);
  const [ciphertextError, setCiphertextError] = useState<string | null>(null);

  // Simulation trace state (initialized immediately with FIPS 197 vector)
  const initialPt = validateSingleBlockInput(DEFAULT_PRESET.plaintext, 'hex', 'Plaintext').bytes;
  const initialKey = validateSingleBlockInput(DEFAULT_PRESET.key, 'hex', 'Key').bytes;
  const initialSim = encryptBlockWithTrace(initialPt, initialKey);

  const [simulation, setSimulation] = useState<AesSimulationResult>(initialSim);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(900);

  // Results state
  const [originalPlaintextBytes, setOriginalPlaintextBytes] = useState<number[] | null>(initialPt);
  const [encryptedCipherBytes, setEncryptedCipherBytes] = useState<number[] | null>(
    initialSim.outputBytes
  );
  const [decryptedPlaintextBytes, setDecryptedPlaintextBytes] = useState<number[] | null>(null);
  const [customCiphertextHex, setCustomCiphertextHex] = useState<string>(
    bytesToHex(initialSim.outputBytes)
  );

  // Multi-block state
  const [multiBlockList, setMultiBlockList] = useState<
    { blockIndex: number; plaintextBlock: number[]; cipherBlock: number[] }[]
  >([]);
  const [inspectedBlockIndex, setInspectedBlockIndex] = useState<number>(0);
  const [activeKeyForMultiBlock, setActiveKeyForMultiBlock] = useState<number[]>(initialKey);

  // Interactive cell / column selection inside visualizer
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });
  const [selectedColumn, setSelectedColumn] = useState<number>(0);

  // Guided Demo Mode state
  const [demoPhase, setDemoPhase] = useState<DemoPhase>('idle');
  const demoTimerRef = useRef<number | null>(null);

  const clearDemoTimers = useCallback(() => {
    if (demoTimerRef.current !== null) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }, []);

  const stopDemo = useCallback(() => {
    clearDemoTimers();
    setDemoPhase('idle');
    setIsPlaying(false);
  }, [clearDemoTimers]);

  const currentStep = simulation.steps[currentStepIndex] ?? simulation.steps[0];

  // Auto-advance playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const total = simulation.steps.length;
    if (currentStepIndex >= total - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, total - 1));
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStepIndex, simulation.steps.length, speedMs]);

  // Demo Mode state machine: Encrypt -> Brief Ciphertext Pause -> Decrypt -> Complete
  useEffect(() => {
    if (demoPhase === 'idle') return;
    const atEnd = currentStepIndex >= simulation.steps.length - 1;

    if (demoPhase === 'encrypting' && atEnd && !isPlaying) {
      setDemoPhase('encrypt-pause');
      demoTimerRef.current = window.setTimeout(() => {
        const cipherBytes = simulation.outputBytes;
        const keyBytes = simulation.keyBytes;
        const decSim = decryptBlockWithTrace(cipherBytes, keyBytes);
        setSimulation(decSim);
        setDecryptedPlaintextBytes(decSim.outputBytes);
        setCurrentStepIndex(0);
        setDemoPhase('decrypting');
        setIsPlaying(true);
      }, 1400);
    } else if (demoPhase === 'decrypting' && atEnd && !isPlaying) {
      setDemoPhase('complete');
    }
  }, [demoPhase, currentStepIndex, isPlaying, simulation]);

  useEffect(() => {
    return () => clearDemoTimers();
  }, [clearDemoTimers]);

  // Keyboard shortcuts for classroom demo ergonomics
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStepIndex((prev) => Math.min(prev + 1, simulation.steps.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => {
          if (!prev && currentStepIndex >= simulation.steps.length - 1) {
            setCurrentStepIndex(0);
          }
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [simulation.steps.length, currentStepIndex]);

  // Helper to validate Key & optional IV
  const validateKeyAndIv = (): { keyBytes: number[]; ivBytes?: number[] } | null => {
    const keyRes = validateSingleBlockInput(keyValue, keyEncoding, '128-bit Key');
    setKeyError(keyRes.error ?? null);

    let ivBytes: number[] | undefined;
    if (blockMode === 'cbc-pkcs7') {
      const ivRes = validateSingleBlockInput(ivHexValue, 'hex', 'Initialization Vector (IV)');
      setIvError(ivRes.error ?? null);
      if (!ivRes.valid) return null;
      ivBytes = ivRes.bytes;
    } else {
      setIvError(null);
    }

    if (!keyRes.valid) return null;
    return { keyBytes: keyRes.bytes, ivBytes };
  };

  const handleEncrypt = () => {
    stopDemo();
    setCiphertextError(null);
    const keyAndIv = validateKeyAndIv();

    if (blockMode === 'single') {
      const ptRes = validateSingleBlockInput(plaintextValue, plaintextEncoding, 'Plaintext');
      setPlaintextError(ptRes.error ?? null);
      if (!ptRes.valid || !keyAndIv) return;

      const sim = encryptBlockWithTrace(ptRes.bytes, keyAndIv.keyBytes);
      setSimulation(sim);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setOriginalPlaintextBytes(ptRes.bytes);
      setEncryptedCipherBytes(sim.outputBytes);
      setCustomCiphertextHex(bytesToHex(sim.outputBytes));
      setDecryptedPlaintextBytes(null);
      setMultiBlockList([]);
    } else {
      const ptRes = validateMultiBlockPlaintext(plaintextValue, plaintextEncoding);
      setPlaintextError(ptRes.error ?? null);
      if (!ptRes.valid || !keyAndIv) return;

      const multi = encryptMultiBlock(ptRes.bytes, keyAndIv.keyBytes, blockMode, keyAndIv.ivBytes);
      setMultiBlockList(multi.blocks);
      setInspectedBlockIndex(0);
      setActiveKeyForMultiBlock(keyAndIv.keyBytes);
      setOriginalPlaintextBytes(ptRes.bytes);
      setEncryptedCipherBytes(multi.cipherBytes);
      setCustomCiphertextHex(bytesToHex(multi.cipherBytes));
      setDecryptedPlaintextBytes(null);

      // Load Block 0 (or CBC-XORed input if CBC? Wait: showing actual cipher block input is clearest)
      const firstBlockPlain =
        blockMode === 'cbc-pkcs7' && keyAndIv.ivBytes
          ? multi.blocks[0].plaintextBlock.map((b, i) => b ^ keyAndIv.ivBytes![i])
          : multi.blocks[0].plaintextBlock;

      const sim = encryptBlockWithTrace(firstBlockPlain, keyAndIv.keyBytes);
      setSimulation(sim);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    }
  };

  const handleDecrypt = () => {
    stopDemo();
    setPlaintextError(null);
    const keyAndIv = validateKeyAndIv();

    if (blockMode === 'single') {
      const ctRes = validateSingleBlockInput(customCiphertextHex, 'hex', 'Ciphertext');
      setCiphertextError(ctRes.error ?? null);
      if (!ctRes.valid || !keyAndIv) return;

      const sim = decryptBlockWithTrace(ctRes.bytes, keyAndIv.keyBytes);
      setSimulation(sim);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setEncryptedCipherBytes(ctRes.bytes);
      setDecryptedPlaintextBytes(sim.outputBytes);
    } else {
      const ctRes = validateCiphertextBlocksHex(customCiphertextHex);
      setCiphertextError(ctRes.error ?? null);
      if (!ctRes.valid || !keyAndIv) return;

      try {
        const multiDec = decryptMultiBlock(
          ctRes.bytes,
          keyAndIv.keyBytes,
          blockMode,
          keyAndIv.ivBytes
        );
        setEncryptedCipherBytes(ctRes.bytes);
        setDecryptedPlaintextBytes(multiDec.plaintextBytes);

        const targetIdx = Math.min(inspectedBlockIndex, multiDec.blocks.length - 1);
        const sim = decryptBlockWithTrace(
          multiDec.blocks[targetIdx].cipherBlock,
          keyAndIv.keyBytes
        );
        setSimulation(sim);
        setCurrentStepIndex(0);
        setIsPlaying(false);
      } catch (err) {
        setCiphertextError(
          err instanceof Error ? err.message : 'Decryption failed due to invalid PKCS#7 padding.'
        );
      }
    }
  };

  const handleReset = () => {
    stopDemo();
    setBlockMode('single');
    setPlaintextValue(DEFAULT_PRESET.plaintext);
    setPlaintextEncoding('hex');
    setKeyValue(DEFAULT_PRESET.key);
    setKeyEncoding('hex');
    setIvHexValue(DEFAULT_IV_HEX);
    setPlaintextError(null);
    setKeyError(null);
    setIvError(null);
    setCiphertextError(null);

    const pt = validateSingleBlockInput(DEFAULT_PRESET.plaintext, 'hex', 'Plaintext').bytes;
    const key = validateSingleBlockInput(DEFAULT_PRESET.key, 'hex', 'Key').bytes;
    const sim = encryptBlockWithTrace(pt, key);

    setSimulation(sim);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setSpeedMs(900);
    setOriginalPlaintextBytes(pt);
    setEncryptedCipherBytes(sim.outputBytes);
    setCustomCiphertextHex(bytesToHex(sim.outputBytes));
    setDecryptedPlaintextBytes(null);
    setMultiBlockList([]);
    setInspectedBlockIndex(0);
    setSelectedCell({ row: 0, col: 0 });
    setSelectedColumn(0);
  };

  const handleSelectPreset = (preset: PresetVector) => {
    stopDemo();
    setBlockMode('single');
    setPlaintextValue(preset.plaintext);
    setPlaintextEncoding(preset.encoding);
    setKeyValue(preset.key);
    setKeyEncoding(preset.encoding);
    setPlaintextError(null);
    setKeyError(null);
    setIvError(null);
    setCiphertextError(null);

    const ptRes = validateSingleBlockInput(preset.plaintext, preset.encoding, 'Plaintext');
    const keyRes = validateSingleBlockInput(preset.key, preset.encoding, 'Key');
    if (ptRes.valid && keyRes.valid) {
      const sim = encryptBlockWithTrace(ptRes.bytes, keyRes.bytes);
      setSimulation(sim);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setOriginalPlaintextBytes(ptRes.bytes);
      setEncryptedCipherBytes(sim.outputBytes);
      setCustomCiphertextHex(bytesToHex(sim.outputBytes));
      setDecryptedPlaintextBytes(null);
      setMultiBlockList([]);
    }
  };

  const handleSelectInspectedBlock = (blockIdx: number) => {
    stopDemo();
    setInspectedBlockIndex(blockIdx);
    const blk = multiBlockList[blockIdx];
    if (!blk) return;

    if (simulation.mode === 'encrypt') {
      let inputBlock = blk.plaintextBlock;
      if (blockMode === 'cbc-pkcs7') {
        const prev =
          blockIdx === 0
            ? validateSingleBlockInput(ivHexValue, 'hex', 'IV').bytes
            : multiBlockList[blockIdx - 1].cipherBlock;
        inputBlock = blk.plaintextBlock.map((b, i) => b ^ (prev[i] ?? 0));
      }
      setSimulation(encryptBlockWithTrace(inputBlock, activeKeyForMultiBlock));
    } else {
      setSimulation(decryptBlockWithTrace(blk.cipherBlock, activeKeyForMultiBlock));
    }
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleToggleDemo = () => {
    if (demoPhase !== 'idle') {
      stopDemo();
      return;
    }

    // Start automated classroom Demo Mode using FIPS 197 Appendix B
    clearDemoTimers();
    setBlockMode('single');
    setPlaintextValue(DEFAULT_PRESET.plaintext);
    setPlaintextEncoding('hex');
    setKeyValue(DEFAULT_PRESET.key);
    setKeyEncoding('hex');
    setPlaintextError(null);
    setKeyError(null);
    setIvError(null);
    setCiphertextError(null);

    const pt = validateSingleBlockInput(DEFAULT_PRESET.plaintext, 'hex', 'Plaintext').bytes;
    const key = validateSingleBlockInput(DEFAULT_PRESET.key, 'hex', 'Key').bytes;
    const encSim = encryptBlockWithTrace(pt, key);

    setSimulation(encSim);
    setOriginalPlaintextBytes(pt);
    setEncryptedCipherBytes(encSim.outputBytes);
    setCustomCiphertextHex(bytesToHex(encSim.outputBytes));
    setDecryptedPlaintextBytes(null);
    setMultiBlockList([]);
    setCurrentStepIndex(0);
    setSpeedMs(200);
    setDemoPhase('encrypting');
    setIsPlaying(true);

    document.getElementById('simulator-workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const plaintextByteCount = useMemo(
    () => getByteLengthPreview(plaintextValue, plaintextEncoding),
    [plaintextValue, plaintextEncoding]
  );
  const keyByteCount = useMemo(
    () => getByteLengthPreview(keyValue, keyEncoding),
    [keyValue, keyEncoding]
  );

  const isDecryptMode: boolean = simulation.mode === 'decrypt';
  const stateTone =
    currentStep.operation === 'AddRoundKey'
      ? 'emerald'
      : currentStep.operation === 'MixColumns' || currentStep.operation === 'InvMixColumns'
      ? 'violet'
      : 'blue';

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header demoActive={demoPhase !== 'idle'} onToggleDemo={handleToggleDemo} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Concise Academic Hero Intro */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-blue-700">
              <span>FIPS 197 Standard</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>128-bit Block &amp; Key</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>10 Rounds</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>4 × 4 Column-Major State</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              AES-128 Encryption &amp; Decryption Simulator
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Explore every byte substitution, row shift, Galois Field GF(2⁸) column mix, and
              round key XOR in real time using official NIST test vectors or your own UTF-8 and
              hexadecimal data.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-72">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500">Algorithm</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">Rijndael AES-128</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs text-slate-500">Trace Length</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 tabular-nums">
                41 States / Block
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Mode Narration Banner (only shown when Demo Mode is active) */}
        {demoPhase !== 'idle' && (
          <div
            role="status"
            className="bg-blue-50 border border-blue-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
              <div className="text-sm text-blue-950">
                <span className="font-semibold">Demo Mode:</span>{' '}
                {demoPhase === 'encrypting' &&
                  'Encrypting FIPS 197 sample plaintext (001122...eeff) across Rounds 0–10...'}
                {demoPhase === 'encrypt-pause' &&
                  'Encryption complete! Ciphertext 69c4e0d86a7b0430d8cdb78070b4c55a produced. Starting decryption...'}
                {demoPhase === 'decrypting' &&
                  'Running Inverse Cipher (InvShiftRows, InvSubBytes, AddRoundKey, InvMixColumns)...'}
                {demoPhase === 'complete' &&
                  'Demonstration complete! Original plaintext 00112233445566778899aabbccddeeff fully recovered.'}
              </div>
            </div>
            <button
              type="button"
              onClick={stopDemo}
              className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-white border border-blue-300 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
            >
              Exit Demo Mode
            </button>
          </div>
        )}

        {/* Section 1 & 4: Input Configuration + Results */}
        <InputAndResultsPanel
          blockMode={blockMode}
          onChangeBlockMode={(m) => {
            stopDemo();
            setBlockMode(m);
            setPlaintextError(null);
            setCiphertextError(null);
            setIvError(null);
          }}
          plaintextValue={plaintextValue}
          plaintextEncoding={plaintextEncoding}
          onChangePlaintext={(v) => {
            setPlaintextValue(v);
            setPlaintextError(null);
          }}
          onChangePlaintextEncoding={(enc) => {
            setPlaintextEncoding(enc);
            setPlaintextError(null);
          }}
          keyValue={keyValue}
          keyEncoding={keyEncoding}
          onChangeKey={(v) => {
            setKeyValue(v);
            setKeyError(null);
          }}
          onChangeKeyEncoding={(enc) => {
            setKeyEncoding(enc);
            setKeyError(null);
          }}
          ivHexValue={ivHexValue}
          onChangeIvHex={(v) => {
            setIvHexValue(v);
            setIvError(null);
          }}
          plaintextError={plaintextError}
          keyError={keyError}
          ivError={ivError}
          plaintextByteCount={plaintextByteCount}
          keyByteCount={keyByteCount}
          activeSimMode={simulation.mode as AesMode}
          originalPlaintextBytes={originalPlaintextBytes}
          encryptedCipherBytes={encryptedCipherBytes}
          decryptedPlaintextBytes={decryptedPlaintextBytes}
          customCiphertextHex={customCiphertextHex}
          ciphertextError={ciphertextError}
          onChangeCustomCiphertextHex={(v) => {
            setCustomCiphertextHex(v);
            setCiphertextError(null);
          }}
          multiBlockList={multiBlockList}
          inspectedBlockIndex={inspectedBlockIndex}
          onSelectInspectedBlock={handleSelectInspectedBlock}
          onSelectPreset={handleSelectPreset}
          onEncrypt={handleEncrypt}
          onDecrypt={handleDecrypt}
          onReset={handleReset}
        />

        {/* Section 2 & 3: Interactive AES Visualization & Simulation Controls */}
        <section id="simulator-workspace" className="space-y-4 scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                2. Step-by-Step AES-128 State Matrix &amp; Transformation Stage
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {blockMode !== 'single' && multiBlockList.length > 0
                  ? `Inspecting Block ${inspectedBlockIndex + 1} of ${multiBlockList.length} · `
                  : ''}
                Click any cell in the 4 × 4 matrix to inspect byte-level math below.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck
                className={`w-4 h-4 ${isDecryptMode ? 'text-violet-700' : 'text-blue-600'}`}
                aria-hidden="true"
              />
              <span className={isDecryptMode ? 'text-violet-800' : 'text-blue-800'}>
                {isDecryptMode ? 'Decryption Mode (Inverse Cipher)' : 'Encryption Mode (Forward Cipher)'}
              </span>
            </div>
          </div>

          {/* Section 3: Simulation Controls */}
          <SimulationControls
            steps={simulation.steps}
            currentStepIndex={currentStepIndex}
            isPlaying={isPlaying}
            speedMs={speedMs}
            onPrev={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
            }}
            onNext={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.min(prev + 1, simulation.steps.length - 1));
            }}
            onTogglePlay={() => {
              setIsPlaying((prev) => {
                if (!prev && currentStepIndex >= simulation.steps.length - 1) {
                  setCurrentStepIndex(0);
                }
                return !prev;
              });
            }}
            onRestart={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
            }}
            onSelectStep={(idx) => {
              setIsPlaying(false);
              setCurrentStepIndex(idx);
            }}
            onChangeSpeed={setSpeedMs}
          />

          {/* Active Step Header + Beginner Explanation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span className={isDecryptMode ? 'text-violet-700 font-semibold' : 'text-blue-700 font-semibold'}>
                    {isDecryptMode ? 'Decryption' : 'Encryption'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Round {currentStep.round} of 10</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-700">{currentStep.operation}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {currentStep.title}
                </h3>
                <p className="text-sm text-slate-600">{currentStep.subtitle}</p>
              </div>

              {currentStep.round === 10 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-xs font-medium text-violet-900">
                  <Info className="w-3.5 h-3.5 text-violet-700 shrink-0" aria-hidden="true" />
                  <span>
                    Final Round: {isDecryptMode ? 'InvMixColumns' : 'MixColumns'} is NOT performed
                  </span>
                </div>
              )}
            </div>

            {/* State Matrix Stage: Before -> (Round Key if AddRoundKey) -> After */}
            <div
              className={`grid grid-cols-1 gap-6 items-center ${
                currentStep.operation === 'AddRoundKey' && currentStep.roundKeyBytes
                  ? 'lg:grid-cols-[1fr_auto_1fr_auto_1fr]'
                  : currentStep.operation === 'Input'
                  ? 'lg:grid-cols-[minmax(0,360px)_1fr]'
                  : 'lg:grid-cols-[1fr_auto_1fr]'
              }`}
            >
              {currentStep.operation !== 'Input' && (
                <>
                  <StateMatrix
                    title="Input State (Before)"
                    subtitle="4 × 4 column-major matrix"
                    bytes={currentStep.beforeState}
                    selectedCell={selectedCell}
                    selectedColumn={
                      currentStep.operation === 'MixColumns' ||
                      currentStep.operation === 'InvMixColumns'
                        ? selectedColumn
                        : null
                    }
                    onSelectCell={(row, col) => {
                      setSelectedCell({ row, col });
                      setSelectedColumn(col);
                    }}
                    tone="neutral"
                  />

                  {currentStep.operation === 'AddRoundKey' && currentStep.roundKeyBytes ? (
                    <>
                      <div className="flex items-center justify-center font-mono text-xl font-bold text-emerald-700">
                        ⊕
                      </div>
                      <StateMatrix
                        title={`Round Key K${currentStep.roundKeyIndex}`}
                        subtitle="Expanded 128-bit subkey"
                        bytes={currentStep.roundKeyBytes}
                        selectedCell={selectedCell}
                        onSelectCell={(row, col) => {
                          setSelectedCell({ row, col });
                          setSelectedColumn(col);
                        }}
                        tone="violet"
                      />
                      <div className="flex items-center justify-center font-mono text-xl font-bold text-slate-400">
                        =
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0 text-blue-600" aria-hidden="true" />
                        <span className="font-mono text-[11px] font-medium text-slate-500">
                          {currentStep.operation}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <StateMatrix
                title={
                  currentStep.operation === 'Input'
                    ? 'Initial 4 × 4 State Matrix'
                    : 'Output State (After)'
                }
                subtitle={
                  currentStep.operation === 'Input'
                    ? 'Ready for Initial Round AddRoundKey (K0)'
                    : 'Highlighted cells changed in this step'
                }
                bytes={currentStep.afterState}
                changedIndices={currentStep.changedIndices}
                selectedCell={selectedCell}
                selectedColumn={
                  currentStep.operation === 'MixColumns' ||
                  currentStep.operation === 'InvMixColumns'
                    ? selectedColumn
                    : null
                }
                onSelectCell={(row, col) => {
                  setSelectedCell({ row, col });
                  setSelectedColumn(col);
                }}
                tone={stateTone}
              />

              {currentStep.operation === 'Input' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-sm font-semibold text-slate-900">
                    What happens in this step?
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {currentStep.explanation}
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-xs font-mono text-slate-600">
                    Next step: {simulation.steps[1]?.title}
                  </div>
                </div>
              )}
            </div>

            {/* Beginner-Friendly Current Step Explanation */}
            {currentStep.operation !== 'Input' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">Step Explanation: </span>
                {currentStep.explanation}
              </div>
            )}
          </div>

          {/* Operation-Specific Interactive Breakdown */}
          <OperationVisualizer
            step={currentStep}
            selectedCell={selectedCell}
            selectedColumn={selectedColumn}
            onSelectCell={(row, col) => {
              setSelectedCell({ row, col });
              setSelectedColumn(col);
            }}
            onSelectColumn={setSelectedColumn}
          />
        </section>

        {/* Key Expansion Schedule (All 11 Round Keys K0-K10) */}
        <KeyExpansionPanel
          roundKeys={simulation.roundKeys}
          activeRoundKeyIndex={currentStep.roundKeyIndex}
        />

        {/* Section 5: Educational Hub (How AES Works, Viva Prep, Self-Tests) */}
        <EducationalHub />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>AES-128 Encryption &amp; Decryption Simulator · FIPS 197 Academic Reference</span>
          <span>128-bit Block · 128-bit Key · 10 Rounds · GF(2⁸) Arithmetic</span>
        </div>
      </footer>
    </div>
  );
}
