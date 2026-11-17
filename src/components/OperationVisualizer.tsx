import { ArrowRight, Grid, Info, Layers, Shuffle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import {
  AesStep,
  INV_MIX_MATRIX,
  INV_SBOX,
  MIX_MATRIX,
  SBOX,
  computeMixColumnBreakdown,
  formatBinaryByte,
  formatHexByte,
  getCell,
  stateIndex,
} from '../crypto/aes128.ts';

interface OperationVisualizerProps {
  step: AesStep;
  selectedCell: { row: number; col: number };
  selectedColumn: number;
  onSelectCell: (row: number, col: number) => void;
  onSelectColumn: (col: number) => void;
}

export function OperationVisualizer({
  step,
  selectedCell,
  selectedColumn,
  onSelectCell,
  onSelectColumn,
}: OperationVisualizerProps) {
  const { operation, beforeState, afterState, roundKeyBytes, roundKeyIndex } = step;

  // 1. SubBytes / InvSubBytes Visualization
  if (operation === 'SubBytes' || operation === 'InvSubBytes') {
    const isInv = operation === 'InvSubBytes';
    const table = isInv ? INV_SBOX : SBOX;
    const inByte = getCell(beforeState, selectedCell.row, selectedCell.col);
    const outByte = getCell(afterState, selectedCell.row, selectedCell.col);
    const sboxRow = (inByte >> 4) & 0x0f;
    const sboxCol = inByte & 0x0f;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              {isInv ? 'Inverse S-Box Byte Substitution' : 'S-Box Byte Substitution'}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any cell in the 4 × 4 matrix above to inspect its S-Box lookup
          </span>
        </div>

        {/* Selected byte summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
          <div>
            <div className="text-xs text-slate-500">Selected State Cell</div>
            <div className="mt-1 font-mono text-sm font-semibold text-slate-900">
              Row {selectedCell.row}, Col {selectedCell.col} (b
              {stateIndex(selectedCell.row, selectedCell.col)})
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Input Byte → Coordinates</div>
            <div className="mt-1 font-mono text-sm font-semibold text-blue-700">
              0x{formatHexByte(inByte).toUpperCase()} → Row {sboxRow.toString(16).toUpperCase()}, Col{' '}
              {sboxCol.toString(16).toUpperCase()}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">
              {isInv ? 'InvS-Box Output' : 'S-Box Output'}
            </div>
            <div className="mt-1 flex items-center gap-2 font-mono text-sm font-semibold text-violet-700">
              <span>0x{formatHexByte(inByte).toUpperCase()}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="px-2 py-0.5 bg-violet-100 rounded text-violet-900">
                0x{formatHexByte(outByte).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive 16x16 S-Box Lookup Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[540px]">
            <div className="grid grid-cols-[28px_repeat(16,minmax(0,1fr))] gap-0.5 mb-0.5">
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-center">
                r\c
              </div>
              {Array.from({ length: 16 }, (_, c) => (
                <div
                  key={c}
                  className={`text-center font-mono text-[10px] py-0.5 rounded ${
                    c === sboxCol
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 font-medium'
                  }`}
                >
                  {c.toString(16).toUpperCase()}
                </div>
              ))}
            </div>

            <div className="space-y-0.5">
              {Array.from({ length: 16 }, (_, r) => (
                <div key={r} className="grid grid-cols-[28px_repeat(16,minmax(0,1fr))] gap-0.5">
                  <div
                    className={`font-mono text-[10px] flex items-center justify-center rounded ${
                      r === sboxRow
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {r.toString(16).toUpperCase()}
                  </div>

                  {Array.from({ length: 16 }, (_, c) => {
                    const val = table[r * 16 + c];
                    const isMatch = r === sboxRow && c === sboxCol;
                    const isCrosshair = r === sboxRow || c === sboxCol;

                    return (
                      <div
                        key={c}
                        className={`text-center font-mono text-[10px] py-1 rounded transition-colors ${
                          isMatch
                            ? 'bg-violet-700 text-white font-bold ring-2 ring-violet-400'
                            : isCrosshair
                            ? 'bg-blue-50 text-blue-900 font-medium'
                            : 'bg-slate-50/70 text-slate-600'
                        }`}
                      >
                        {formatHexByte(val)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ShiftRows / InvShiftRows Visualization
  if (operation === 'ShiftRows' || operation === 'InvShiftRows') {
    const isInv = operation === 'InvShiftRows';

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-sky-600" aria-hidden="true" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              {isInv
                ? 'InvShiftRows · Circular Right Row Permutation'
                : 'ShiftRows · Circular Left Row Permutation'}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Row r shifts {isInv ? 'right' : 'left'} by r positions
          </span>
        </div>

        <div className="space-y-3">
          {[0, 1, 2, 3].map((row) => {
            const beforeRow = [0, 1, 2, 3].map((c) => ({
              col: c,
              val: getCell(beforeState, row, c),
            }));
            const afterRow = [0, 1, 2, 3].map((c) => {
              const sourceCol = isInv ? (c - row + 4) % 4 : (c + row) % 4;
              return {
                destCol: c,
                sourceCol,
                val: getCell(afterState, row, c),
              };
            });

            return (
              <div
                key={row}
                className="grid grid-cols-1 lg:grid-cols-[150px_1fr_auto_1fr] items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">Row {row}</div>
                  <div className="text-xs text-sky-700 font-medium mt-0.5">
                    {row === 0
                      ? 'No shift (0 bytes)'
                      : `Shift ${isInv ? 'right' : 'left'} ${row} byte${row > 1 ? 's' : ''}`}
                  </div>
                </div>

                {/* Before row */}
                <div className="grid grid-cols-4 gap-1.5">
                  {beforeRow.map((cell) => (
                    <div
                      key={cell.col}
                      className="flex flex-col items-center py-1.5 px-1 bg-white border border-slate-200 rounded-md"
                    >
                      <span className="font-mono text-xs font-semibold text-slate-800 uppercase">
                        {formatHexByte(cell.val)}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">from C{cell.col}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-4 h-4 text-sky-600 rotate-90 lg:rotate-0" aria-hidden="true" />
                </div>

                {/* After row */}
                <div className="grid grid-cols-4 gap-1.5">
                  {afterRow.map((cell) => (
                    <motion.div
                      key={`${row}-${cell.destCol}-${cell.val}`}
                      initial={{ opacity: 0.6, x: isInv ? -10 * (row > 0 ? 1 : 0) : 10 * (row > 0 ? 1 : 0) }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col items-center py-1.5 px-1 rounded-md border ${
                        row === 0
                          ? 'bg-white border-slate-200'
                          : 'bg-sky-50 border-sky-300 text-sky-950'
                      }`}
                    >
                      <span className="font-mono text-xs font-semibold uppercase">
                        {formatHexByte(cell.val)}
                      </span>
                      <span className="font-mono text-[10px] text-sky-700">
                        was C{cell.sourceCol}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. MixColumns / InvMixColumns Visualization
  if (operation === 'MixColumns' || operation === 'InvMixColumns') {
    const isInv = operation === 'InvMixColumns';
    const matrix = isInv ? INV_MIX_MATRIX : MIX_MATRIX;
    const breakdown = computeMixColumnBreakdown(beforeState, selectedColumn, isInv);

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-600" aria-hidden="true" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              {isInv
                ? 'InvMixColumns · Galois Field GF(2⁸) Inverse Matrix'
                : 'MixColumns · Galois Field GF(2⁸) Matrix Multiplication'}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Inspect Column:</span>
            {[0, 1, 2, 3].map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onSelectColumn(col)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-colors ${
                  selectedColumn === col
                    ? 'bg-violet-700 border-violet-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                C{col}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Each byte in Column {selectedColumn} is computed via GF(2⁸) polynomial multiplication
          modulo <code className="font-mono text-slate-800">x⁸ + x⁴ + x³ + x + 1 (0x11b)</code>,
          where addition is bitwise XOR (<code className="font-mono">⊕</code>).
        </p>

        {/* Matrix equation overview + row-by-row breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-4 items-start">
          {/* Fixed Matrix x Input Vector = Output Vector */}
          <div className="flex items-center justify-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3.5 overflow-x-auto">
            <div className="grid grid-cols-4 gap-1 p-2 bg-white border border-slate-200 rounded font-mono text-xs text-center">
              {matrix.flatMap((row, r) =>
                row.map((coeff, c) => (
                  <span key={`${r}-${c}`} className="w-6 py-0.5 text-violet-700 font-semibold">
                    {formatHexByte(coeff)}
                  </span>
                ))
              )}
            </div>

            <span className="font-mono text-sm text-slate-500">×</span>

            <div className="grid grid-cols-1 gap-1 p-2 bg-white border border-slate-200 rounded font-mono text-xs text-center">
              {[0, 1, 2, 3].map((r) => (
                <span key={r} className="w-7 py-0.5 text-slate-800 font-semibold uppercase">
                  {formatHexByte(getCell(beforeState, r, selectedColumn))}
                </span>
              ))}
            </div>

            <span className="font-mono text-sm text-slate-500">=</span>

            <div className="grid grid-cols-1 gap-1 p-2 bg-violet-50 border border-violet-300 rounded font-mono text-xs text-center">
              {[0, 1, 2, 3].map((r) => (
                <span key={r} className="w-7 py-0.5 text-violet-900 font-bold uppercase">
                  {formatHexByte(getCell(afterState, r, selectedColumn))}
                </span>
              ))}
            </div>
          </div>

          {/* Per-row exact GF(2^8) XOR expansion */}
          <div className="space-y-2">
            {breakdown.map((rowCalc) => (
              <div
                key={rowCalc.row}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
              >
                <span className="text-slate-500 font-semibold">s&apos;[{rowCalc.row},{selectedColumn}] =</span>
                <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
                  {rowCalc.coefficients.map((coeff, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span className="text-violet-700">
                        ({formatHexByte(coeff)}·{formatHexByte(rowCalc.columnInputs[i])})
                      </span>
                      <span className="text-slate-400">
                        [{formatHexByte(rowCalc.products[i])}]
                      </span>
                      {i < 3 && <span className="text-slate-400">⊕</span>}
                    </span>
                  ))}
                </div>
                <span className="px-2 py-0.5 bg-violet-100 text-violet-900 font-bold rounded uppercase">
                  = {formatHexByte(rowCalc.result)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. AddRoundKey Visualization
  if (operation === 'AddRoundKey' && roundKeyBytes) {
    const stateByte = getCell(beforeState, selectedCell.row, selectedCell.col);
    const keyByte = getCell(roundKeyBytes, selectedCell.row, selectedCell.col);
    const outByte = getCell(afterState, selectedCell.row, selectedCell.col);

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              AddRoundKey · Bitwise XOR with Round Key K{roundKeyIndex}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any cell in the matrices above to inspect its 8-bit XOR
          </span>
        </div>

        {/* Binary XOR Breakdown for selected cell */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-600 mb-3">
            Cell (Row {selectedCell.row}, Col {selectedCell.col}) Bitwise Calculation:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] text-slate-500">Input State Byte</div>
              <div className="text-base font-semibold text-slate-900 mt-1 uppercase">
                0x{formatHexByte(stateByte)}
              </div>
              <div className="text-xs text-slate-500 tracking-wider mt-0.5">
                {formatBinaryByte(stateByte)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="text-[11px] text-slate-500">Round Key K{roundKeyIndex} Byte</div>
              <div className="text-base font-semibold text-violet-700 mt-1 uppercase">
                ⊕ 0x{formatHexByte(keyByte)}
              </div>
              <div className="text-xs text-violet-600 tracking-wider mt-0.5">
                {formatBinaryByte(keyByte)}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3">
              <div className="text-[11px] text-emerald-800 font-medium">XOR Output Byte</div>
              <div className="text-base font-bold text-emerald-950 mt-1 uppercase">
                = 0x{formatHexByte(outByte)}
              </div>
              <div className="text-xs text-emerald-800 font-medium tracking-wider mt-0.5">
                {formatBinaryByte(outByte)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. Initial Input State explanation
  const selIdx = stateIndex(selectedCell.row, selectedCell.col);
  const selByte = getCell(afterState, selectedCell.row, selectedCell.col);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-600" aria-hidden="true" />
        <h3 className="text-sm sm:text-base font-semibold text-slate-900">
          Column-Major State Matrix Initialization
        </h3>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">
        AES maps a linear 16-byte input block <code className="font-mono text-slate-800">b0..b15</code>{' '}
        into the 4 × 4 matrix column by column using{' '}
        <code className="font-mono text-slate-800">state[row, col] = input[row + 4 × col]</code>.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          Selected: Row {selectedCell.row}, Col {selectedCell.col} → Byte index b{selIdx}
        </span>
        <span className="font-semibold text-blue-700 uppercase">
          Value: 0x{formatHexByte(selByte)} ({formatBinaryByte(selByte)})
        </span>
      </div>
    </div>
  );
}
