import { useEffect, useMemo, useRef, useState } from 'react'
import { analyzeSpectrum } from '../engine'
import { STEPS } from '../data/steps'
import { bandLabel } from '../input/manualInput'
import { bandStatus } from './status'
import SpectrumView from './SpectrumView'
import StepCard from './StepCard'
import DecisionTree from './DecisionTree'
import ResultPanel from './ResultPanel'

const RESULT = STEPS.length // índice da tela de resultado
const LABELS = [...STEPS.map(s => s.short), 'Resultado']

const ProgressBar = ({ current, onGo, pending }) => (
  <nav aria-label="Etapas da análise" className="card px-3 py-3 sm:px-5">
    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
      <span>{current === RESULT ? 'Análise concluída' : `Etapa ${current + 1} de ${STEPS.length}`}</span>
      <span>{Math.round((current / RESULT) * 100)}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500" style={{ width: `${(current / RESULT) * 100}%` }} />
    </div>
    <ol className="mt-3 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {LABELS.map((label, i) => {
        const done = i < current
        const active = i === current
        const hasQ = pending.has(i)
        return (
          <li key={label} className="shrink-0">
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-current={active ? 'step' : undefined}
              className={`relative px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                active
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent'
                  : done
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30'
                    : 'bg-white text-gray-500 border-slate-200 dark:bg-slate-900 dark:text-gray-400 dark:border-slate-700'
              }`}
            >
              {done && !active ? '✓ ' : ''}
              {label}
              {hasQ && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" title="pergunta em aberto" />}
            </button>
          </li>
        )
      })}
    </ol>
  </nav>
)

const AnalysisScreen = ({ bands, ignored, formula, onEdit, onRestart }) => {
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const topRef = useRef(null)

  const analysis = useMemo(() => analyzeSpectrum(bands, answers, { formula }), [bands, answers, formula])

  const pending = useMemo(() => {
    const set = new Set()
    for (const q of analysis.questions) {
      if (!answers[q.key]) set.add(STEPS.findIndex(s => s.id === q.step))
    }
    return set
  }, [analysis.questions, answers])

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [current])

  const onAnswer = (key, value) => setAnswers(a => ({ ...a, [key]: value }))
  const step = STEPS[current]
  const highlight = step?.highlight || []

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* bandas normalizadas */}
      <section className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              ✓ Foram identificadas {bands.length} banda{bands.length > 1 ? 's' : ''} válida{bands.length > 1 ? 's' : ''}.
            </p>
            {ignored.length > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                Desconsiderado: {ignored.map(i => `"${i.raw}" (${i.reason})`).join('; ')}
              </p>
            )}
          </div>
          <button type="button" onClick={onEdit} className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline">
            ✎ Editar bandas
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {bands.map(b => {
            const st = bandStatus(analysis.assignments[b.id])
            return (
              <span
                key={b.id}
                className={`wn text-sm px-2.5 py-1 rounded-lg border ${
                  st === 'present'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                    : st === 'uncertain'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {bandLabel(b, { withQualifiers: true })}
              </span>
            )
          })}
          {formula && <span className="text-sm px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 wn">{formula}</span>}
        </div>
        <div className="mt-3">
          <SpectrumView bands={bands} assignments={analysis.assignments} highlight={highlight} />
        </div>
      </section>

      <div ref={topRef} className="scroll-mt-20" />
      <ProgressBar current={current} onGo={setCurrent} pending={pending} />

      {current < STEPS.length - 1 && (
        <StepCard step={step} index={current} total={STEPS.length} analysis={analysis} answers={answers} onAnswer={onAnswer} />
      )}
      {current === STEPS.length - 1 && (
        <DecisionTree analysis={analysis} answers={answers} onAnswer={onAnswer} index={current} total={STEPS.length} />
      )}
      {current === RESULT && (
        <ResultPanel analysis={analysis} bands={bands} onRestart={onRestart} onReview={() => setCurrent(0)} />
      )}

      {current < RESULT && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button type="button" className="btn-ghost" onClick={() => (current === 0 ? onEdit() : setCurrent(c => c - 1))}>
            ← {current === 0 ? 'Bandas' : 'Anterior'}
          </button>
          <div className="flex gap-2">
            {current < STEPS.length - 1 && (
              <button type="button" onClick={() => setCurrent(RESULT)} className="hidden sm:inline-flex btn-ghost">
                Ir ao resultado
              </button>
            )}
            <button type="button" className="btn-primary" onClick={() => setCurrent(c => c + 1)}>
              {current === STEPS.length - 1 ? 'Ver resultado' : 'Próxima etapa'} →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalysisScreen
