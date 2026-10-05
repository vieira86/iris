// =============================================================================
// IRIS — PONTO DE ENTRADA DO MOTOR DE ANÁLISE
// =============================================================================
// Fluxo: bandas → evidências (ligações) → grupos funcionais → classes de compostos
//
// Extensões futuras previstas (NÃO implementadas nesta versão):
//   src/input/      upload de espectro, leitura de CSV, detecção automática de picos
//   src/engine/     comparação com banco de espectros, modelos de machine learning
//   src/structure/  proposição de estruturas, integração com RDKit, banco de moléculas
// Todas devem consumir/produzir o mesmo formato de banda de src/input/manualInput.js
// e o mesmo objeto de evidências retornado aqui.
// =============================================================================

import { detectEvidence, assignBands } from './evidence.js'
import { scoreHypotheses } from './scoring.js'
import { buildDecisionTree } from './decisionTree.js'
import { buildReasoning } from './reasoning.js'
import { computeIDH } from './idh.js'

export function analyzeSpectrum(bands, answers = {}, { formula } = {}) {
  const idhResult = formula ? computeIDH(formula) : null
  const idh = idhResult && !idhResult.error ? idhResult.idh : null

  const { evidence, questions, shape } = detectEvidence(bands, answers, { idh })
  const scored = scoreHypotheses(evidence)
  const hypotheses = scored.filter(h => h.kind === 'function')
  const features = scored.filter(h => h.kind === 'skeleton')
  const tree = buildDecisionTree(evidence)
  const reasoning = buildReasoning(evidence, hypotheses, { idh, features })
  const assignments = assignBands(bands, evidence)

  return { evidence, questions, shape, hypotheses, features, tree, reasoning, assignments, idh: idhResult }
}

export { STATUS, SUMMARY_EVIDENCE } from './evidence.js'
