import { AnswerBadge, QuestionBox } from './StepCard'
import { bandLabel } from '../input/manualInput'

const toStatus = { yes: 'present', maybe: 'uncertain', no: 'absent' }

const Bands = ({ bands }) =>
  bands?.length ? <span className="wn text-xs text-slate-500 dark:text-slate-400 ml-1">({bands.map(b => bandLabel(b)).join(', ')})</span> : null

const Leaf = ({ name, tone = 'present', note }) => (
  <div
    className={`ml-6 sm:ml-10 mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold border ${
      tone === 'present'
        ? 'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-200'
        : 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/40 dark:text-amber-200'
    }`}
  >
    <span aria-hidden="true">↳</span> {name}
    {note && <span className="font-normal text-xs opacity-80">{note}</span>}
  </div>
)

const DecisionTree = ({ analysis, answers, onAnswer, index, total }) => {
  const { tree, questions } = analysis
  const { carbonyl, left, hasCO } = tree
  const open = questions.filter(q => !answers[q.key])

  return (
    <div className="card p-5 sm:p-7 animate-pop">
      <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        Etapa {index + 1} de {total}
      </p>
      <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Árvore de decisão</h3>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Esquema adaptado de Lopes &amp; Fascio (Quím. Nova, 2004). Primeiro o bloco da carbonila; o primeiro <b>SIM</b> indica a função mais
        compatível. Depois, a verificação dos demais grupos.
      </p>

      {open.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            Ainda há {open.length} pergunta{open.length > 1 ? 's' : ''} em aberto — respondê-la{open.length > 1 ? 's' : ''} deixa a árvore mais precisa:
          </p>
          {open.map(q => (
            <QuestionBox key={q.key} q={q} value={answers[q.key]} onAnswer={onAnswer} />
          ))}
        </div>
      )}

      {/* bloco carbonila */}
      <div className="mt-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Bloco 1 · Carbonila</h4>
        <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-gray-900 dark:text-white">
              {carbonyl.root.question}
              <Bands bands={carbonyl.root.bands} />
            </p>
            <AnswerBadge status={toStatus[carbonyl.root.answer]} />
          </div>

          {!hasCO ? (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              ✗ Sem banda de C=O: as funções carboniladas ficam pouco prováveis. Seguimos para o bloco 2.
            </p>
          ) : (
            <ol className="mt-3 border-l-2 border-purple-200 dark:border-purple-500/30 ml-2 pl-4 space-y-3">
              {carbonyl.nodes.map(node => (
                <li key={node.ev} className={node.answer === 'skipped' ? 'opacity-35' : ''}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm sm:text-[15px] text-gray-800 dark:text-gray-100">
                      {node.question}
                      <Bands bands={node.bands} />
                    </p>
                    {node.answer === 'skipped' ? (
                      <span className="text-[11px] text-slate-400 shrink-0">não avaliada</span>
                    ) : (
                      <AnswerBadge status={toStatus[node.answer]} size="sm" />
                    )}
                  </div>
                  {node.answer === 'yes' && <Leaf name={node.leafName} />}
                  {node.answer === 'maybe' && <Leaf name={`possível: ${node.leafName}`} tone="uncertain" />}
                </li>
              ))}
              {carbonyl.byExclusion && (
                <li>
                  <p className="text-sm text-gray-800 dark:text-gray-100">Nenhuma das perguntas anteriores teve SIM:</p>
                  <Leaf name={carbonyl.leaf} tone="uncertain" note="(por exclusão)" />
                </li>
              )}
            </ol>
          )}
        </div>
      </div>

      {/* bloco esquerdo */}
      <div className="mt-6">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Bloco 2 · Outros grupos e esqueleto</h4>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {left.map(item => (
            <div
              key={item.ev}
              className={`rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 ${
                item.answer === 'no' ? 'border-slate-200 dark:border-slate-800 opacity-70' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</p>
                {item.answer !== 'no' && (
                  <p className={`text-xs font-semibold ${item.answer === 'yes' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                    → {item.answer === 'maybe' ? 'possível ' : ''}
                    {item.leaf}
                  </p>
                )}
              </div>
              <AnswerBadge status={toStatus[item.answer]} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DecisionTree
