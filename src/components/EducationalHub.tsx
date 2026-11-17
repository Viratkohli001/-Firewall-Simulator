import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  HelpCircle,
  Play,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AesTestCaseResult, runAes128TestSuite } from '../crypto/aes128.test.ts';
import { AES_SPECS, OPERATION_CONCEPTS, VIVA_QUESTIONS } from '../data/education.ts';

export function EducationalHub() {
  const [openVivaIds, setOpenVivaIds] = useState<number[]>([1, 2, 9]);
  const [vivaQuery, setVivaQuery] = useState('');
  const [testResults, setTestResults] = useState<AesTestCaseResult[]>(() => runAes128TestSuite());

  const toggleViva = (id: number) => {
    setOpenVivaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredViva = VIVA_QUESTIONS.filter(
    (q) =>
      q.question.toLowerCase().includes(vivaQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(vivaQuery.toLowerCase())
  );

  const handleRunTests = () => {
    setTestResults(runAes128TestSuite());
  };

  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="space-y-8">
      {/* Section: How AES-128 Works */}
      <section
        id="how-aes-works"
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-6"
      >
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">How AES-128 Works</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              The Advanced Encryption Standard (AES, FIPS 197) is a symmetric-key block cipher that
              transforms 128-bit plaintext blocks into 128-bit ciphertext using a shared 128-bit
              secret key across 10 structured rounds on a 4 × 4 byte state matrix.
            </p>
          </div>
        </div>

        {/* Core Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {AES_SPECS.map((spec) => (
            <div
              key={spec.label}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3"
            >
              <div className="text-xs text-slate-500">{spec.label}</div>
              <div className="text-sm font-semibold text-slate-900 mt-1">{spec.value}</div>
            </div>
          ))}
        </div>

        {/* Encryption vs Decryption Workflow Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-blue-950">
              Encryption Workflow (Forward Cipher · K0 → K10)
            </h3>
            <ol className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
              <li>
                <span className="font-semibold text-slate-900">Initial Round (R0):</span>{' '}
                AddRoundKey(K0) — initial key whitening.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Rounds 1–9:</span> SubBytes →
                ShiftRows → MixColumns → AddRoundKey(Kr).
              </li>
              <li>
                <span className="font-semibold text-slate-900">Final Round (R10):</span> SubBytes →
                ShiftRows → AddRoundKey(K10).{' '}
                <span className="font-medium text-blue-800">(MixColumns is omitted.)</span>
              </li>
            </ol>
          </div>

          <div className="bg-violet-50/50 border border-violet-200 rounded-xl p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-violet-950">
              Decryption Workflow (Inverse Cipher · K10 → K0)
            </h3>
            <ol className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-decimal list-inside">
              <li>
                <span className="font-semibold text-slate-900">Initial Step (R0):</span>{' '}
                AddRoundKey(K10) — reverses final encryption XOR.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Rounds 1–9:</span> InvShiftRows →
                InvSubBytes → AddRoundKey(K10−r) → InvMixColumns.
              </li>
              <li>
                <span className="font-semibold text-slate-900">Final Round (R10):</span>{' '}
                InvShiftRows → InvSubBytes → AddRoundKey(K0).{' '}
                <span className="font-medium text-violet-800">(InvMixColumns is omitted.)</span>
              </li>
            </ol>
          </div>
        </div>

        {/* 5 Core Operations */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">
            Five Core AES-128 Transformations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPERATION_CONCEPTS.map((op) => (
              <article
                key={op.id}
                className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-blue-700">{op.role}</div>
                  <h4 className="text-base font-semibold text-slate-900">{op.name}</h4>
                  <p className="text-xs font-medium text-slate-700">{op.shortSummary}</p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{op.details}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Inverse:</span> {op.inverseName}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Viva Preparation (10 Required Questions) */}
      <section
        id="viva-prep"
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-violet-700 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Viva Preparation · Top 10 Questions
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Concise, technically accurate answers for practical evaluation and oral defense.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={vivaQuery}
              onChange={(e) => setVivaQuery(e.target.value)}
              placeholder="Filter questions..."
              aria-label="Filter Viva questions"
              className="px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setOpenVivaIds(VIVA_QUESTIONS.map((q) => q.id))}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => setOpenVivaIds([])}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredViva.map((item) => {
            const isOpen = openVivaIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/40"
              >
                <button
                  type="button"
                  onClick={() => toggleViva(item.id)}
                  aria-expanded={isOpen}
                  className="w-full px-4 py-3 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-xs font-semibold text-blue-700 tabular-nums">
                      Q{item.id.toString().padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{item.question}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 pt-1 border-t border-slate-200/70 bg-white space-y-2">
                    <p className="text-sm text-slate-700 leading-relaxed">{item.answer}</p>
                    <p className="text-xs font-medium text-violet-700">
                      Key takeaway: {item.keyTakeaway}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Automated AES-128 Verification Test Suite */}
      <section
        id="self-test"
        className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <FlaskConical className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                FIPS 197 &amp; NIST Automated Self-Test Suite
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Live cryptographic verification against official NIST test vectors ({passedCount}/
                {testResults.length} passing).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunTests}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>Re-Run AES-128 Tests</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testResults.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-lg border space-y-1.5 ${
                t.passed
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-red-50/60 border-red-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                  )}
                  <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-800 whitespace-nowrap">
                  {t.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {t.standard} · {t.details}
              </div>
              <div className="font-mono text-[11px] text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 break-all">
                Output: {t.actual}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
