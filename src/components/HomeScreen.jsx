import { useMemo, useState } from 'react'
import { parseBandInput, bandLabel } from '../input/manualInput'
import { computeIDH } from '../engine/idh'
import { EXAMPLES } from '../data/examples'
import SpectrumView from './SpectrumView'

const HOW = [
  { icon: '⌨️', title: 'Bandas', desc: 'Digite os números de onda observados' },
  { icon: '🔗', title: 'Ligações', desc: 'Cada banda é comparada às faixas típicas' },
  { icon: '🧩', title: 'Grupos funcionais', desc: 'Evidências são combinadas passo a passo' },
  { icon: '🧪', title: 'Classe provável', desc: 'Funções orgânicas mais compatíveis' }
]

const HomeScreen = ({ initialText = '', initialFormula = '', onAnalyze }) => {
  const [text, setText] = useState(initialText)
  const [formula, setFormula] = useState(initialFormula)
  const [showFormula, setShowFormula] = useState(Boolean(initialFormula))
  const [showTips, setShowTips] = useState(false)
  const [revealed, setRevealed] = useState({})

  const parsed = useMemo(() => parseBandInput(text), [text])
  const idh = useMemo(() => (formula.trim() ? computeIDH(formula) : null), [formula])

  const submit = e => {
    e?.preventDefault()
    if (!parsed.bands.length) return
    onAnalyze({ text, formula: idh && !idh.error ? formula.trim() : '' })
  }

  const loadExample = ex => {
    setText(ex.bands)
    setFormula(ex.formula)
    setShowFormula(true)
    document.getElementById('band-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative">
      <div className="hero-blob w-72 h-72 bg-purple-300 dark:bg-purple-800 -top-10 -left-16 animate-blob" aria-hidden="true" />
      <div className="hero-blob w-72 h-72 bg-blue-300 dark:bg-blue-800 top-24 -right-16 animate-blob-delayed" aria-hidden="true" />

      <div className="relative max-w-4xl mx-auto">
        {/* HERO */}
        <div className="text-center pt-2 pb-8 animate-fade-in-up">
          <span className="stat-chip">🔬 Espectroscopia no infravermelho</span>
          <h2 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">IRIS</span>
            <span className="block mt-2 text-lg sm:text-2xl font-semibold text-gray-500 dark:text-gray-400 tracking-normal">
              Infrared Interpretation System
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Descubra a estrutura a partir das bandas do espectro de infravermelho
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form id="band-form" onSubmit={submit} className="glass-morphism rounded-3xl p-5 sm:p-8 scroll-mt-24 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <label htmlFor="bands" className="block text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Digite as bandas observadas no espectro (cm⁻¹):
          </label>
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              id="bands"
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck="false"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Ex.: 3300, 2950, 1715, 1450, 1250"
              className="flex-1 min-w-0 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-lg font-mono tracking-wide text-gray-900 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/15 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
            <button type="submit" className="btn-primary text-base sm:py-0" disabled={!parsed.bands.length}>
              Analisar espectro <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* pré-visualização da normalização */}
          <div className="mt-3 min-h-[1.5rem] text-sm">
            {text.trim() ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={parsed.bands.length ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-rose-600 font-medium'}>
                  {parsed.bands.length
                    ? `${parsed.bands.length} banda${parsed.bands.length > 1 ? 's' : ''} válida${parsed.bands.length > 1 ? 's' : ''}:`
                    : 'Nenhuma banda válida ainda.'}
                </span>
                {parsed.bands.map(b => (
                  <span key={b.id} className="wn text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30">
                    {bandLabel(b, { withQualifiers: true })}
                  </span>
                ))}
                {parsed.ignored.length > 0 && (
                  <span className="text-amber-700 dark:text-amber-400">
                    · desconsiderado: {parsed.ignored.map(i => `"${i.raw}" (${i.reason})`).join('; ')}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">Separe por vírgula, espaço ou ponto e vírgula. Uma banda só também vale: 1715.</span>
            )}
          </div>

          {parsed.bands.length > 0 && (
            <div className="mt-2 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 p-3">
              <SpectrumView bands={parsed.bands} compact />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowFormula(v => !v)} className="text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline">
              {showFormula ? '− Fórmula molecular' : '+ Fórmula molecular (opcional)'}
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button type="button" onClick={() => setShowTips(v => !v)} className="text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline">
              {showTips ? '− Dicas de notação' : '+ Dicas de notação (forte, larga…)'}
            </button>
          </div>

          {showFormula && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 animate-pop">
              <input
                type="text"
                value={formula}
                onChange={e => setFormula(e.target.value)}
                placeholder="Ex.: C7H6O"
                className="sm:w-48 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 font-mono text-gray-900 focus:border-purple-500 focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {idh?.error ? (
                  <span className="text-rose-600">{idh.error}</span>
                ) : idh ? (
                  <>
                    IDH = <b className="wn">{idh.idh}</b>
                    {idh.idh >= 4 ? ' · compatível com anel benzênico' : ''}
                  </>
                ) : (
                  'Usada para calcular o índice de deficiência de hidrogênio (IDH).'
                )}
              </span>
            </div>
          )}

          {showTips && (
            <div className="mt-3 rounded-2xl border border-purple-100 bg-purple-50/70 dark:bg-purple-500/10 dark:border-purple-500/20 p-4 text-sm text-gray-700 dark:text-gray-200 space-y-1.5 animate-pop">
              <p>Os números bastam. Mas, se você souber, pode marcar a banda com a notação das tabelas de correlação:</p>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                <li><code className="wn">1715F</code> → banda <b>forte</b></li>
                <li><code className="wn">2250m</code> → banda <b>média</b></li>
                <li><code className="wn">2120f</code> → banda <b>fraca</b></li>
                <li><code className="wn">3350L</code> → banda <b>larga</b></li>
                <li className="sm:col-span-2"><code className="wn">2500-3300</code> → absorção larga que ocupa toda a faixa</li>
              </ul>
              <p className="text-slate-500 dark:text-slate-400">Sem essas marcações, o IRIS pergunta sobre a forma ou a intensidade quando isso for decisivo.</p>
            </div>
          )}
        </form>

        {/* COMO FUNCIONA */}
        <div className="mt-10">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Como funciona</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {HOW.map((s, i) => (
              <div key={s.title} className="glass-morphism rounded-2xl p-4 text-center animate-fade-in-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
                <div className="text-3xl mb-2">{s.icon}</div>
                <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Passo {i + 1}</p>
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{s.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* EXEMPLOS */}
        <div className="mt-10">
          <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Pratique com exemplos</h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analise os exemplos abaixo. A resposta fica escondida. 
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {EXAMPLES.map(ex => (
              <div key={ex.id} className="card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {ex.title} <span className="wn text-sm text-slate-500 dark:text-slate-400 ml-1">{ex.formula}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{ex.source}</span>
                </div>
                <p className="wn text-sm text-purple-700 dark:text-purple-300 break-words">{ex.bands}</p>
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <button type="button" onClick={() => setRevealed(r => ({ ...r, [ex.id]: !r[ex.id] }))} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    {revealed[ex.id] ? `Resposta: ${ex.answer}` : '👁 Revelar resposta'}
                  </button>
                  <button type="button" onClick={() => loadExample(ex)} className="text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline shrink-0">
                    Usar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeScreen
