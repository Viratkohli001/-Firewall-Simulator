import { Play, Square } from 'lucide-react';

interface HeaderProps {
  demoActive: boolean;
  onToggleDemo: () => void;
}

export function Header({ demoActive, onToggleDemo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#top"
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          AES-128 Simulator
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#simulator-workspace"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Simulator
          </a>
          <a
            href="#key-schedule"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Key Schedule
          </a>
          <a
            href="#how-aes-works"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            How AES Works
          </a>
          <a
            href="#viva-prep"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Viva Prep
          </a>
          <a
            href="#self-test"
            className="hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Self-Test
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleDemo}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              demoActive
                ? 'bg-violet-700 text-white hover:bg-violet-800 focus-visible:ring-violet-600'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600'
            }`}
          >
            {demoActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>Stop Demo</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>Demo Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
