import { useState } from 'react'
import { SUMMARY_EVIDENCE } from '../engine'
import { STATUS_UI, LEVEL_UI, bandStatus } from './status'
import { bandLabel } from '../input/manualInput'
import { FINGERPRINT_TEXT } from '../data/steps'
import { FINGERPRINT_LIMIT } from '../data/irRules'

const fmt = n => String(n).replace('.', ',')

const HypothesisCard = ({ h, rank }) => {
  const [open, setOpen] = useState(rank === 1)
  const ui = LEVEL_UI[h.level.id]
  const pct = Math.round(Math.min(1, h.ratio) * 100)
  return (
    <li className={`rounded-2xl border p-4 ${rank === 1 ? 'border-purple-300 bg-purple-50/50 dark:bg-purple-500/10 dark:border-purple-500/40' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-center gap-3">
        <span
          className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-extrabold text-white ${
            rank === 1 ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-slate-400 dark:bg-slate-600'
          }`}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{h.name}</h4>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ui.badge}`}>{h.level.label}</span>
            {h.byExclusion && <span className="text-[11px] text-slate-500 dark:text-slate-400">identificada por exclusão</span>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${ui.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="wn text-sm text-gray-700 dark:text-gray-200 shrink-0">
              {fmt(h.score)}/{fmt(h.max)}
            </span>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => setOpen(o => !o)} className="mt-2 ml-12 text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline">
        {open ? '− Ocultar evidências' : '+ Ver evidências'}
      </button>
      {open && (
        <ul className="mt-2 ml-12 space-y-1 text-sm animate-pop">
          {h.support.map((s, i) => (
            <li key={`s${i}`} className="flex gap-2">
              <span className={`wn shrink-0 w-10 text-right ${s.status === 'uncertain' ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`}>+{fmt(s.pts)}</span>
              <span className="text-gray-700 dark:text-gray-200">
                {s.text}
                {s.status === 'uncertain' && <span className="text-amber-600"> (incerto: metade dos pontos)</span>}
              </span>
            </li>
          ))}
          {h.against.map((s, i) => (
            <li key={`a${i}`} className="flex gap-2">
              <span className="wn shrink-0 w-10 text-right text-rose-600">{fmt(s.pts)}</span>
              <span className="text-gray-700 dark:text-gray-200">{s.text}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

const ResultPanel = ({ analysis, bands, onRestart, onReview }) => {
  const { evidence, hypotheses, features, reasoning, assignments, idh } = analysis
  const [showAll, setShowAll] = useState(false)
  const main = hypotheses.filter(h => h.level.id !== 'weak')
  const shown = showAll ? hypotheses : main.length ? main.slice(0, 5) : hypotheses.slice(0, 3)
  const hidden = hypotheses.length - shown.length

  return (
    <div className="space-y-5 animate-pop">
      {/* RESULTADO */}
      <section className="card p-5 sm:p-7">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🔬 Resultado da análise</h3>

        <h4 className="mt-5 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Principais evidências encontradas</h4>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {SUMMARY_EVIDENCE.map(id => {
            const e = evidence[id]
            const ui = STATUS_UI[e.status]
            return (
              <div key={id} className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${ui.soft}`} title={e.summary}>
                <span className={`font-extrabold ${ui.text}`}>{ui.icon}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{e.name}</span>
              </div>
            )
          })}
        </div>

        <h4 className="mt-7 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Funções orgânicas mais compatíveis</h4>
        {hypotheses.length === 0 ? (
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Não é possível sugerir uma função apenas com essas bandas. Verifique se as bandas principais (acima de 1500 cm⁻¹) foram informadas.
          </p>
        ) : (
          <>
            <ol className="mt-3 space-y-3">
              {shown.map((h, i) => (
                <HypothesisCard key={h.id} h={h} rank={i + 1} />
              ))}
            </ol>
            {hidden > 0 && (
              <button type="button" onClick={() => setShowAll(true)} className="mt-3 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline">
                + Mostrar outras {hidden} hipótese{hidden > 1 ? 's' : ''} com compatibilidade fraca
              </button>
            )}
          </>
        )}

        {features.length > 0 && (
          <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 dark:bg-indigo-500/10 dark:border-indigo-500/30 p-4 text-sm">
            <p className="font-semibold text-indigo-900 dark:text-indigo-200">
              ⬡ Esqueleto: {features.map(f => `${f.name.toLowerCase()} (${f.level.label})`).join(', ')}
            </p>
            <p className="mt-1 text-indigo-900/80 dark:text-indigo-200/80">
              O anel aromático acompanha a função — por exemplo, aldeído aromático, fenol ou nitrila aromática.
              {evidence.AROM_OOP.meta.patterns?.length ? ` Padrão de substituição sugerido: ${evidence.AROM_OOP.meta.patterns.join(' ou ')}.` : ''}
            </p>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Os números são o <b>índice de compatibilidade espectroscópica</b>: pontos das evidências compatíveis com cada função em relação ao máximo possível.
          Não é uma probabilidade estatística.{idh && !idh.error ? ` Fórmula ${idh.formula}: IDH = ${idh.idh}.` : ''}
        </p>
      </section>

      {/* ATRIBUIÇÃO DAS BANDAS */}
      <section className="card p-5 sm:p-7">
        <h3 className="section-title">📍 Atribuição de cada banda</h3>
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {bands.map(b => {
            const list = assignments[b.id] || []
            const st = bandStatus(list)
            return (
              <div key={b.id} className="py-2.5 flex items-start gap-3">
                <span
                  className={`wn w-28 shrink-0 text-right ${
                    st === 'present' ? 'text-emerald-700 dark:text-emerald-300' : st === 'uncertain' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {bandLabel(b)}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {list.length
                    ? list.map(a => `${a.name}${a.status === 'uncertain' ? ' (?)' : ''}`).join(' · ')
                    : b.value < FINGERPRINT_LIMIT
                      ? 'região de impressão digital — sem atribuição simples'
                      : 'sem atribuição simples'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* RACIOCÍNIO */}
      <section className="card p-5 sm:p-7">
        <h3 className="section-title">🧠 Como chegamos a essa conclusão?</h3>
        <ol className="mt-4 space-y-4">
          {reasoning.map((s, i) => {
            const tone =
              s.status === 'conclusion'
                ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                : s.status === 'present'
                  ? 'bg-emerald-500 text-white'
                  : s.status === 'uncertain'
                    ? 'bg-amber-400 text-amber-950'
                    : s.status === 'absent'
                      ? 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
            return (
              <li key={i} className="flex gap-3">
                <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${tone}`}>{i + 1}</span>
                <div className="pt-0.5">
                  <p className={`font-semibold ${s.status === 'conclusion' ? 'text-purple-800 dark:text-purple-200' : 'text-gray-900 dark:text-white'}`}>{s.title}</p>
                  {s.text && <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{s.text}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-gray-700 dark:bg-slate-900/60 dark:border-slate-800 dark:text-gray-200">
        <p className="font-semibold mb-1">🖐️ Região de impressão digital</p>
        <p>{FINGERPRINT_TEXT}</p>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <button type="button" onClick={onReview} className="btn-ghost">
          ← Revisar etapas
        </button>
        <button type="button" onClick={onRestart} className="btn-primary">
          Nova análise
        </button>
      </div>
    </div>
  )
}

export default ResultPanel
