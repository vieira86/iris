// =============================================================================
// ÁRVORE DE DECISÃO — baseada no esquema de Lopes & Fascio (Quím. Nova, 2004)
// =============================================================================
// Bloco da direita (carbonila): percorrido em sequência; o primeiro "SIM" leva
// à função. Respostas incertas ("talvez") registram uma alternativa e seguem.
// Bloco da esquerda: verificação de presença/ausência de outros grupos.
// =============================================================================

import { STATUS } from './evidence.js'

const answerOf = status => (status === STATUS.PRESENT ? 'yes' : status === STATUS.UNCERTAIN ? 'maybe' : 'no')

const CARBONYL_CHECKS = [
  { ev: 'OH_ACID', question: 'O–H muito largo entre ~3300 e 2500 cm⁻¹?', leaf: () => 'Ácido carboxílico' },
  {
    ev: 'NH',
    question: 'N–H entre ~3070 e 3500 cm⁻¹?',
    leaf: e => (e.meta?.pattern === 'doublet' ? 'Amida primária (dubleto)' : e.meta?.pattern === 'singlet' ? 'Amida secundária (singleto)' : 'Amida')
  },
  { ev: 'CH_ALD', question: 'C–H de aldeído entre ~2830 e 2695 cm⁻¹?', leaf: () => 'Aldeído' },
  { ev: 'CO_PAIR', question: 'Duas bandas de C=O (~1815 e ~1750 cm⁻¹)?', leaf: () => 'Anidrido' },
  { ev: 'CO_SINGLE', question: 'C–O forte entre 1300 e 1000 cm⁻¹?', leaf: () => 'Éster' },
  { ev: 'POS_ACYL_HALIDE', question: 'C=O muito alto, entre 1770 e 1820 cm⁻¹?', leaf: () => 'Haleto de acila' }
]

export function buildDecisionTree(E) {
  const co = E.CO
  const root = {
    ev: 'CO',
    question: 'Existe banda de C=O entre 1650 e 1820 cm⁻¹?',
    answer: answerOf(co.status),
    bands: co.bands
  }

  const carbonyl = { root, nodes: [], leaf: null, alternatives: [] }

  if (co.status !== STATUS.ABSENT) {
    let stopped = false
    for (const check of CARBONYL_CHECKS) {
      const e = E[check.ev]
      if (stopped) {
        carbonyl.nodes.push({ ...check, leafName: check.leaf(e), answer: 'skipped', bands: [] })
        continue
      }
      const answer = answerOf(e.status)
      carbonyl.nodes.push({ ...check, leafName: check.leaf(e), answer, bands: e.bands })
      if (answer === 'yes') {
        carbonyl.leaf = check.leaf(e)
        stopped = true
      } else if (answer === 'maybe') {
        carbonyl.alternatives.push(check.leaf(e))
      }
    }
    if (!stopped) {
      const highest = Math.max(...co.bands.map(b => b.value))
      carbonyl.leaf = highest >= 1700 ? 'Cetona (alquil-cetona, C=O ~1700–1725)' : 'Aril-cetona ou amida terciária (C=O ~1630–1700)'
      carbonyl.byExclusion = true
    }
  }

  // ------------------------------------------------------ bloco esquerdo
  const hasCO = co.status !== STATUS.ABSENT
  const arom = E.AROM.status !== STATUS.ABSENT
  const nh = E.NH
  const left = [
    { ev: 'OH', label: 'O–H (3200–3600)', leaf: arom ? 'Álcool ou fenol' : 'Álcool (ou fenol)', show: true },
    { ev: 'CO_SINGLE', label: 'C–O sem O–H (1300–1000)', leaf: 'Éter', show: !hasCO && E.OH.status === STATUS.ABSENT },
    {
      ev: 'NH',
      label: 'N–H (3300–3500)',
      leaf: nh.meta?.pattern === 'doublet' ? 'Amina primária (dubleto)' : nh.meta?.pattern === 'singlet' ? 'Amina secundária (singleto)' : 'Amina',
      show: !hasCO
    },
    { ev: 'SH', label: 'S–H (2600–2550)', leaf: 'Tiol / tiofenol', show: true },
    { ev: 'CN_TRIPLE', label: 'C≡N (2260–2210)', leaf: 'Nitrila', show: true },
    { ev: 'CC_TRIPLE', label: 'C≡C (2260–2100)', leaf: 'Alcino', show: true },
    { ev: 'CC_DOUBLE', label: 'C=C (1680–1600)', leaf: 'Alceno', show: true },
    { ev: 'NO2', label: 'NO₂ (1570–1500 e 1380–1300)', leaf: 'Nitrocomposto', show: true },
    { ev: 'AROM', label: 'C=C aromático (~1600, 1500, 1450)', leaf: 'Aromático', show: true },
    { ev: 'CH_SP2', label: 'C–H sp² (3100–3000)', leaf: 'Alceno / aromático', show: true },
    { ev: 'CH_SP3', label: 'C–H sp³ (3000–2840)', leaf: 'Porção alifática (CH₃, CH₂, CH)', show: true }
  ]
    .filter(item => item.show)
    .map(item => ({ ...item, answer: answerOf(E[item.ev].status), bands: E[item.ev].bands }))

  return { carbonyl, left, hasCO }
}
