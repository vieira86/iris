// =============================================================================
// "COMO CHEGAMOS A ESSA CONCLUSÃO?" — gera a explicação passo a passo
// =============================================================================

import { STATUS } from './evidence.js'

const ORDER = [
  'CO',
  'CO_PAIR',
  'OH_ACID',
  'OH',
  'NH',
  'CH_ALD',
  'CN_TRIPLE',
  'CC_TRIPLE',
  'CH_SP',
  'CH_SP2',
  'CH_SP3',
  'CC_DOUBLE',
  'AROM',
  'NO2',
  'SH',
  'CO_SINGLE',
  'AROM_OOP'
]

const ABSENCE_LABEL = {
  CO: 'C=O (1650–1820)',
  OH: 'O–H (3200–3600)',
  NH: 'N–H (3300–3500)',
  CN_TRIPLE: 'C≡N (2210–2260)',
  CC_TRIPLE: 'C≡C (2100–2260)',
  CH_ALD: 'C–H de aldeído (2695–2830)',
  CC_DOUBLE: 'C=C (1600–1680)',
  AROM: 'anel aromático'
}

function joinPt(items) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

export function buildReasoning(E, hypotheses, { idh, features = [] } = {}) {
  const steps = []

  if (idh !== undefined && idh !== null) {
    steps.push({
      status: 'info',
      title: `O índice de deficiência de hidrogênio (IDH) é ${idh}.`,
      text:
        idh >= 4
          ? 'IDH ≥ 4 é compatível com a presença de um anel benzênico (1 anel + 3 ligações duplas).'
          : idh === 0
            ? 'IDH = 0: não há anéis nem ligações múltiplas (sem C=O, C=C, C≡C ou C≡N).'
            : `Há ${idh} insaturação(ões) e/ou anel(is) na estrutura (cada C=O, C=C ou anel conta 1; cada tripla conta 2).`
    })
  }

  // 1. Evidências positivas, em ordem didática
  for (const id of ORDER) {
    const e = E[id]
    if (!e || e.status === STATUS.ABSENT || !e.summary) continue
    steps.push({ status: e.status, title: e.summary, text: e.detail, evidence: id })
  }

  // 2. Ausências relevantes
  const absent = Object.keys(ABSENCE_LABEL).filter(id => E[id]?.status === STATUS.ABSENT)
  if (absent.length) {
    const coAbsent = absent.includes('CO')
    steps.push({
      status: 'absent',
      title: `Não foram encontradas bandas de: ${joinPt(absent.map(id => ABSENCE_LABEL[id]))}.`,
      text: `A ausência de uma banda também é informação.${coAbsent ? ' Sem C=O, todas as funções carboniladas (ácido, éster, aldeído, cetona, amida, anidrido, haleto de acila) ficam pouco prováveis.' : ''}`
    })
  }

  // 3. Combinação das evidências
  const [top, second] = hypotheses
  if (top) {
    const why = top.support.map(s => s.text)
    let text = `A combinação: ${joinPt(why)}${why.length ? '' : '—'}.`
    if (top.against.length) text += ` Pesa contra: ${joinPt(top.against.map(a => a.text))}.`
    if (top.byExclusion) text += ` Atenção: ${top.name.toLowerCase()} é identificada por EXCLUSÃO — não há uma banda exclusiva dela; ela fica como opção quando as outras explicações são descartadas.`
    steps.push({
      status: 'conclusion',
      title: `${top.name}: ${top.level.label} (índice ${top.score}).`,
      text
    })

    if (second && top.score - second.score <= 1.5) {
      steps.push({
        status: 'uncertain',
        title: `${top.name} e ${second.name} têm índices muito próximos (${top.score} × ${second.score}).`,
        text: 'Não é possível concluir apenas com essas bandas. Use outras informações: fórmula molecular, comparação da impressão digital com um espectro de referência, RMN ou propriedades físicas.'
      })
    }

    // Funções mistas (ex.: éster + fenol)
    const strongFamilies = new Set(hypotheses.filter(h => h.level.id === 'strong').map(h => h.family))
    if (strongFamilies.size > 1) {
      const names = hypotheses.filter(h => h.level.id === 'strong').map(h => h.name.toLowerCase())
      steps.push({
        status: 'info',
        title: 'Pode haver mais de um grupo funcional.',
        text: `Há evidência forte para ${joinPt(names)}. Uma mesma molécula pode ter função mista (por exemplo, éster + fenol), e as hipóteses não se excluem.`
      })
    }
  }

  // Características do esqueleto (anel aromático)
  for (const f of features) {
    const patterns = E.AROM_OOP?.meta?.patterns || []
    steps.push({
      status: f.level.id === 'strong' ? 'present' : 'uncertain',
      title: `Esqueleto: ${f.name.toLowerCase()} — ${f.level.label}.`,
      text: `O anel aromático não é uma função por si só: ele acompanha a função identificada (ex.: aldeído aromático, fenol, nitrila aromática).${patterns.length ? ` As bandas de deformação fora do plano sugerem anel ${patterns.join(' ou ')} — confirme comparando com referências.` : ''}`
    })
  }

  // 4. Dicas complementares
  const alcHint = E.CO_SINGLE?.meta?.alcoholHint
  if (alcHint?.length && top && top.id === 'alcohol') {
    steps.push({
      status: 'info',
      title: 'Dica: a posição do C–O pode sugerir o tipo de álcool.',
      text: `${alcHint.map(a => `${a.band} cm⁻¹ → mais próximo de álcool ${a.type}`).join('; ')}. (Valores aproximados: 1° ~1050, 2° ~1100, 3° ~1150 cm⁻¹.)`
    })
  }

  steps.push({
    status: 'info',
    title: 'Lembrete: o IV fornece evidências, não uma identificação definitiva.',
    text: 'Nesta etapa identificamos ligações e grupos funcionais. Para chegar à estrutura, combine com a fórmula molecular, o IDH, a comparação da região de impressão digital com espectros de referência e outras técnicas (RMN, massas).'
  })

  return steps
}
