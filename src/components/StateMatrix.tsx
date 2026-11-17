import { motion } from 'motion/react';
import { formatHexByte, getCell, stateIndex } from '../crypto/aes128.ts';

interface StateMatrixProps {
  title: string;
  subtitle?: string;
  bytes: readonly number[];
  changedIndices?: readonly number[];
  selectedCell?: { row: number; col: number } | null;
  selectedColumn?: number | null;
  selectedRow?: number | null;
  onSelectCell?: (row: number, col: number) => void;
  tone?: 'neutral' | 'blue' | 'violet' | 'emerald';
  compact?: boolean;
}

const TONE_HIGHLIGHT: Record<NonNullable<StateMatrixProps['tone']>, string> = {
  neutral: 'bg-slate-100 border-slate-400 text-slate-900',
  blue: 'bg-blue-50 border-blue-500 text-blue-950 shadow-sm',
  violet: 'bg-violet-50 border-violet-500 text-violet-950 shadow-sm',
  emerald: 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm',
};

export function StateMatrix({
  title,
  subtitle,
  bytes,
  changedIndices = [],
  selectedCell = null,
  selectedColumn = null,
  selectedRow = null,
  onSelectCell,
  tone = 'blue',
  compact = false,
}: StateMatrixProps) {
  const changedSet = new Set(changedIndices);

  return (
    <div className="flex flex-col">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {changedIndices.length > 0 && (
          <span className="text-xs font-medium text-blue-700 tabular-nums whitespace-nowrap">
            {changedIndices.length} changed
          </span>
        )}
      </div>

      <div className="inline-block bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 sm:p-3">
        {/* Column headers */}
        <div className="grid grid-cols-[24px_repeat(4,minmax(0,1fr))] gap-1.5 mb-1.5">
          <div />
          {[0, 1, 2, 3].map((c) => (
            <div
              key={c}
              className={`text-center font-mono text-[11px] font-medium ${
                selectedColumn === c ? 'text-violet-700 font-semibold' : 'text-slate-400'
              }`}
            >
              C{c}
            </div>
          ))}
        </div>

        {/* 4x4 Grid rows */}
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((r) => (
            <div key={r} className="grid grid-cols-[24px_repeat(4,minmax(0,1fr))] gap-1.5 items-center">
              <div
                className={`font-mono text-[11px] font-medium text-right pr-1 ${
                  selectedRow === r ? 'text-sky-700 font-semibold' : 'text-slate-400'
                }`}
              >
                R{r}
              </div>

              {[0, 1, 2, 3].map((c) => {
                const idx = stateIndex(r, c);
                const byteVal = getCell(bytes, r, c);
                const hex = formatHexByte(byteVal);
                const isChanged = changedSet.has(idx);
                const isSelectedCell =
                  selectedCell !== null && selectedCell.row === r && selectedCell.col === c;
                const isInSelectedCol = selectedColumn === c;
                const isInSelectedRow = selectedRow === r;

                const ascii =
                  byteVal >= 0x20 && byteVal <= 0x7e ? String.fromCharCode(byteVal) : null;

                let cellStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-300';
                if (isChanged) {
                  cellStyle = TONE_HIGHLIGHT[tone];
                } else if (isInSelectedCol) {
                  cellStyle = 'bg-violet-50/70 border-violet-300 text-violet-950';
                } else if (isInSelectedRow) {
                  cellStyle = 'bg-sky-50/70 border-sky-300 text-sky-950';
                }

                return (
                  <motion.button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => onSelectCell?.(r, c)}
                    initial={false}
                    animate={{
                      scale: isChanged ? [0.94, 1.03, 1] : 1,
                    }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    title={`Byte b${idx} (Row ${r}, Col ${c}) · Hex: 0x${hex.toUpperCase()} · Dec: ${byteVal}${
                      ascii ? ` · ASCII: '${ascii}'` : ''
                    }`}
                    className={`relative flex flex-col items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      compact ? 'h-11 px-1' : 'h-13 sm:h-14 px-1.5'
                    } ${cellStyle} ${
                      isSelectedCell ? 'ring-2 ring-blue-600 ring-offset-1 z-10' : ''
                    }`}
                  >
                    <span
                      className={`font-mono font-semibold tracking-tight uppercase ${
                        compact ? 'text-xs' : 'text-sm sm:text-base'
                      }`}
                    >
                      {hex}
                    </span>
                    {!compact && (
                      <span className="font-mono text-[10px] text-slate-400 leading-none mt-0.5">
                        b{idx}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
