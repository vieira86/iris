import { useState } from 'react'
import { STATUS_UI } from './status'
import { FINGERPRINT_TEXT } from '../data/steps'
import { RULES } from '../data/irRules'

export const AnswerBadge = ({ status, size = 'md' }) => {
  const ui = STATUS_UI[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-bold shrink-0 ${ui.badge} ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}>
      <span aria-hidden="true">{ui.icon}</span> {ui.answer}
    </span>
  )
}

export const QuestionBox = ({ q, value, onAnswer }) => (
  <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/70 p-4 dark:bg-purple-500/10 dark:border-purple-500/40 animate-pop">
    <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">👀 Olhe o espectro</p>
    <p className="mt-1 font-semibold text-gray-900 dark:text-white">{q.prompt}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {q.options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAnswer(q.key, opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
              active
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-transparent shadow-md'
                : 'bg-white text-gray-700 border-slate-200 hover:border-purple-400 dark:bg-slate-900 dark:text-gray-200 dark:border-slate-700'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
      <b>Por que isso importa?</b> {q.why}
    </p>
  </div>
)

const CheckRow = ({ check, e }) => {
  const [open, setOpen] = useState(false)
  const ui = STATUS_UI[e.status]
  const rule = RULES[check.ev]
  const prefix = e.status === 'present' ? '✓' : e.status === 'uncertain' ? '⚠️' : '✗'
  return (
    <div className={`rounded-2xl border p-4 ${ui.soft}`}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-gray-900 dark:text-white leading-snug">{check.question}</h4>
        <AnswerBadge status={e.status} />
      </div>
      {e.summary && (
        <p className="mt-2 text-[15px] text-gray-800 dark:text-gray-100">
          <span className={`font-bold mr-1 ${ui.text}`}>{prefix}</span>
          {e.summary}
        </p>
      )}
      {(e.detail || rule) && (
        <>
          <button type="button" onClick={() => setOpen(o => !o)} className="mt-2 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline">
            {open ? '− Menos detalhes' : '+ Entender melhor'}
          </button>
          {open && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1.5 animate-pop">
              {e.detail && <p>{e.detail}</p>}
              {rule && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Faixa de referência: <span className="wn">{rule.min}–{rule.max} cm⁻¹</span> · {rule.vibration} · intensidade/forma típica: {rule.expected}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

const StepCard = ({ step, index, total, analysis, answers, onAnswer }) => {
  const { evidence, questions } = analysis
  const stepQuestions = questions.filter(q => q.step === step.id)
  const checks = step.checks.filter(c => !c.onlyIf || evidence[c.onlyIf]?.status !== 'absent')

  return (
    <div className="card p-5 sm:p-7 animate-pop" key={step.id}>
      <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        Etapa {index + 1} de {total}
      </p>
      <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-300">{step.intro}</p>

      <div className="mt-5 space-y-3">
        {stepQuestions.map(q => (
          <QuestionBox key={q.key} q={q} value={answers[q.key]} onAnswer={onAnswer} />
        ))}
        {checks.map(c => (
          <CheckRow key={c.ev} check={c} e={evidence[c.ev]} />
        ))}
      </div>

      {step.id === 'oh' && evidence.CO.status !== 'absent' && evidence.OH_ACID.status === 'present' && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/40 dark:text-amber-200">
          ⚠️ A combinação entre C=O e uma banda muito larga de O–H entre aproximadamente 2500–3300 cm⁻¹ é característica de <b>ácido carboxílico</b>.
        </div>
      )}
      {step.id === 'ch' && evidence.CH_ALD.status === 'present' && (
        <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-200">
          A combinação de C–H aldeídico com uma banda forte de C=O é compatível com <b>aldeído</b>.
        </div>
      )}

      {step.fingerprintNote && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-gray-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-gray-200">
          <p className="font-semibold mb-1">🖐️ Sobre a região de impressão digital</p>
          <p>{FINGERPRINT_TEXT}</p>
        </div>
      )}
    </div>
  )
}

export default StepCard
