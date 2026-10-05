// =============================================================================
// ÍNDICE DE COMPATIBILIDADE ESPECTROSCÓPICA
// =============================================================================
// Pontuação simples baseada em regras (ver data/hypotheses.js). NÃO é uma
// probabilidade estatística: indica apenas quantas evidências do espectro são
// compatíveis com cada função orgânica.
// =============================================================================

import { HYPOTHESES, LEVELS } from '../data/hypotheses.js'
import { STATUS } from './evidence.js'

const round = x => Math.round(x * 2) / 2

export function scoreHypotheses(evidence) {
  const statusOf = id => evidence[id]?.status ?? STATUS.ABSENT
  const notAbsent = id => statusOf(id) !== STATUS.ABSENT

  const results = []
  for (const h of HYPOTHESES) {
    if (!h.requires.some(notAbsent)) continue
    if (h.minEvidence && !h.minEvidence.some(notAbsent)) continue
    if (h.excludeIf && h.excludeIf.some(id => statusOf(id) === STATUS.PRESENT)) continue

    let score = 0
    let max = 0
    const support = []
    const against = []

    for (const c of h.criteria) {
      if (c.points > 0) max += c.points
      const st = statusOf(c.ev)
      let pts = 0
      if (c.when === 'present') {
        if (st === STATUS.PRESENT) pts = c.points
        else if (st === STATUS.UNCERTAIN) pts = c.points / 2
      } else if (st === STATUS.ABSENT) {
        pts = c.points
      }
      if (pts > 0) support.push({ ...c, pts, status: st })
      if (pts < 0) against.push({ ...c, pts, status: st })
      score += pts
    }

    score = Math.max(0, round(score))
    if (score <= 0) continue
    const ratio = max ? score / max : 0
    const hasDiagnostic = h.diagnostic.some(id => statusOf(id) === STATUS.PRESENT)
    const hasAnyDiagnostic = h.diagnostic.some(notAbsent)
    const byLevel = id => LEVELS.find(l => l.id === id)
    let level = LEVELS.find(l => ratio >= l.minRatio && score >= l.minScore) || LEVELS[LEVELS.length - 1]
    const byExclusion = !h.diagnostic.length
    if (h.diagnostic.length && !hasAnyDiagnostic) level = byLevel('weak')
    else if (level.id === 'strong' && !hasDiagnostic) level = byLevel('moderate')

    results.push({ id: h.id, name: h.name, family: h.family, kind: h.kind || 'function', score, max, ratio, level, support, against, byExclusion })
  }

  // Ordena pelo nível (forte → moderada → fraca) e, dentro do nível, pelo índice
  const rank = id => LEVELS.findIndex(l => l.id === id)
  results.sort((a, b) => rank(a.level.id) - rank(b.level.id) || b.score - a.score || b.ratio - a.ratio)
  return results
}
