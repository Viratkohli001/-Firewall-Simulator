import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { AesStep } from '../crypto/aes128.ts';

interface SimulationControlsProps {
  steps: readonly AesStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speedMs: number;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSelectStep: (stepIndex: number) => void;
  onChangeSpeed: (ms: number) => void;
}

const SPEED_OPTIONS = [
  { label: '0.5×', ms: 1600 },
  { label: '1×', ms: 900 },
  { label: '2×', ms: 450 },
  { label: '4×', ms: 200 },
];

export function SimulationControls({
  steps,
  currentStepIndex,
  isPlaying,
  speedMs,
  onPrev,
  onNext,
  onTogglePlay,
  onRestart,
  onSelectStep,
  onChangeSpeed,
}: SimulationControlsProps) {
  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const activeRound = currentStep?.round ?? 0;

  // Group steps by round 0..10 for Round Selector
  const rounds = Array.from({ length: 11 }, (_, r) => {
    const roundSteps = steps.filter((s) => s.round === r);
    return {
      round: r,
      steps: roundSteps,
      firstStepIndex: roundSteps[0]?.stepIndex ?? 0,
    };
  });

  const activeRoundSteps = rounds[activeRound]?.steps ?? [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Row: Playback buttons + Speed control + Step readout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRestart}
            disabled={currentStepIndex === 0 && !isPlaying}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-45 disabled:pointer-events-none rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            title="Restart Simulation"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Restart</span>
          </button>

          <button
            type="button"
            onClick={onPrev}
            disabled={currentStepIndex <= 0}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>{currentStepIndex >= totalSteps - 1 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={currentStepIndex >= totalSteps - 1}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Speed Control & Step Progress */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Speed:</span>
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              {SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onChangeSpeed(opt.ms)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    speedMs === opt.ms
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-mono font-medium text-slate-600 tabular-nums whitespace-nowrap">
            Step {currentStepIndex + 1} / {totalSteps}
          </div>
        </div>
      </div>

      {/* Round Progress Selector (R0 .. R10) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-700">Round Selector</span>
          <span className="hidden sm:inline">
            Initial (R0) · Standard Rounds (R1–R9) · Final Round without MixColumns (R10)
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
          {rounds.map((r) => {
            const isCurrent = activeRound === r.round;
            const isCompleted = activeRound > r.round;
            return (
              <button
                key={r.round}
                type="button"
                onClick={() => onSelectStep(r.firstStepIndex)}
                className={`py-2 px-1.5 rounded-lg border text-xs font-mono font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : isCompleted
                    ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                R{r.round}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operations inside the active round */}
      <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">
            Round {activeRound} Steps:
          </span>
          {activeRoundSteps.map((step) => {
            const isActive = step.stepIndex === currentStepIndex;
            return (
              <button
                key={step.stepIndex}
                type="button"
                onClick={() => onSelectStep(step.stepIndex)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? 'bg-violet-700 border-violet-700 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {step.operation}
              </button>
            );
          })}

          {activeRound === 10 && (
            <span className="text-xs text-violet-700 font-medium ml-1 whitespace-nowrap">
              · {currentStep?.mode === 'decrypt' ? 'InvMixColumns omitted' : 'MixColumns omitted'}
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-400 hidden lg:inline">
          Shortcuts: ← / → to step · Space to play/pause
        </span>
      </div>
    </div>
  );
}
