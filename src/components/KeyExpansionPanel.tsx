import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { RoundKeyInfo, formatHexByte } from '../crypto/aes128.ts';
import { StateMatrix } from './StateMatrix.tsx';

interface KeyExpansionPanelProps {
  roundKeys: readonly RoundKeyInfo[];
  activeRoundKeyIndex: number | null;
}

export function KeyExpansionPanel({
  roundKeys,
  activeRoundKeyIndex,
}: KeyExpansionPanelProps) {
  const [inspectedRound, setInspectedRound] = useState<number>(0);

  // Follow activeRoundKeyIndex when user steps through AddRoundKey, or let user click any K0..K10
  const displayRound =
    activeRoundKeyIndex !== null && activeRoundKeyIndex >= 0 && activeRoundKeyIndex <= 10
      ? activeRoundKeyIndex
      : inspectedRound;

  const selectedKeyInfo = roundKeys[displayRound] ?? roundKeys[0];

  return (
    <section
      id="key-schedule"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-violet-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900">
              Key Expansion Schedule (11 Round Keys · K0–K10)
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            AES-128 expands the initial 128-bit key into 44 32-bit words (11 round keys of 16 bytes
            each). Select any round key below to inspect its matrix and word derivation.
          </p>
        </div>

        {activeRoundKeyIndex !== null && (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg whitespace-nowrap">
            Active in Simulation: Round Key K{activeRoundKeyIndex}
          </span>
        )}
      </div>

      {/* 11 Round Keys grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {roundKeys.map((rk) => {
          const isSimActive = activeRoundKeyIndex === rk.round;
          const isInspected = displayRound === rk.round;

          return (
            <button
              key={rk.round}
              type="button"
              onClick={() => setInspectedRound(rk.round)}
              className={`text-left p-3 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isSimActive
                  ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                  : isInspected
                  ? 'bg-violet-50 border-violet-500'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">
                  K{rk.round}{' '}
                  <span className="font-normal text-slate-500">
                    {rk.round === 0 ? '(Initial Key)' : `(Round ${rk.round})`}
                  </span>
                </span>
                {isSimActive && (
                  <span className="text-[11px] font-semibold text-emerald-700">In Use</span>
                )}
              </div>
              <div className="mt-1.5 font-mono text-xs text-slate-700 break-all tracking-tight">
                {rk.hex}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Round Key Inspector */}
      {selectedKeyInfo && (
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <StateMatrix
            title={`Round Key K${selectedKeyInfo.round} (4 × 4 Matrix)`}
            subtitle={`Words w[${selectedKeyInfo.round * 4}]..w[${selectedKeyInfo.round * 4 + 3}]`}
            bytes={selectedKeyInfo.bytes}
            tone="violet"
            compact
          />

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-900">
              Word Derivation for Round Key K{selectedKeyInfo.round}
            </h3>
            <div className="space-y-2">
              {selectedKeyInfo.words.map((w) => (
                <div
                  key={w.wordIndex}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">
                      w[{w.wordIndex}] (Column {w.columnInRound})
                    </span>
                    <span className="font-bold text-violet-700 uppercase">
                      {w.resultWord.map(formatHexByte).join(' ')}
                    </span>
                  </div>

                  {w.roundIndex === 0 ? (
                    <div className="text-slate-500">
                      Copied directly from bytes {w.wordIndex * 4}..{w.wordIndex * 4 + 3} of the
                      input 128-bit key.
                    </div>
                  ) : w.isKeyCore ? (
                    <div className="text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-500">RotWord(w[{w.wordIndex - 1}]):</span>{' '}
                        {w.afterRotWord?.map(formatHexByte).join(' ')} →{' '}
                        <span className="text-slate-500">SubWord:</span>{' '}
                        {w.afterSubWord?.map(formatHexByte).join(' ')} →{' '}
                        <span className="text-slate-500">
                          ⊕ Rcon[{w.roundIndex}] ({formatHexByte(w.rconByte ?? 0)} 00 00 00):
                        </span>{' '}
                        {w.afterRcon?.map(formatHexByte).join(' ')}
                      </div>
                      <div>
                        <span className="text-slate-500">w[{w.wordIndex - 4}] ⊕ g(w[{w.wordIndex - 1}]):</span>{' '}
                        {w.prevNkWord.map(formatHexByte).join(' ')} ⊕{' '}
                        {w.afterRcon?.map(formatHexByte).join(' ')} ={' '}
                        <span className="font-semibold text-slate-900">
                          {w.resultWord.map(formatHexByte).join(' ')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600">
                      w[{w.wordIndex - 4}] ({w.prevNkWord.map(formatHexByte).join(' ')}) ⊕ w[
                      {w.wordIndex - 1}] ({w.prevWord.map(formatHexByte).join(' ')}) ={' '}
                      <span className="font-semibold text-slate-900">
                        {w.resultWord.map(formatHexByte).join(' ')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
