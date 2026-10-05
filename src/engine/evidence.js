// =============================================================================
// DETECÇÃO DE EVIDÊNCIAS
// =============================================================================
// Transforma bandas (números de onda) em evidências de ligações/grupos:
//   bandas → ligações → grupos funcionais
//
// Cada evidência tem status:
//   'present'   (verde)    banda na faixa característica
//   'uncertain' (amarelo)  banda compatível, mas ambígua (sobreposição, borda da
//                          faixa ou informação de forma/intensidade em falta)
//   'absent'    (cinza)    nenhuma banda compatível
//
// Onde só o número de onda não basta (forma ou intensidade da banda), o motor
// gera PERGUNTAS para o estudante — exatamente o que um professor faria olhando
// o espectro junto com ele.
// =============================================================================

import {
  RULES,
  TOLERANCE,
  CARBONYL_SUBTYPES,
  CO_AMBIGUOUS_ZONE,
  BENZENE_PATTERNS,
  ALCOHOL_CO
} from '../data/irRules.js'
import { bandLabel } from '../input/manualInput.js'

export const STATUS = { PRESENT: 'present', UNCERTAIN: 'uncertain', ABSENT: 'absent' }
const { PRESENT, UNCERTAIN, ABSENT } = STATUS

// ---------------------------------------------------------------- utilitários
const isPoint = band => band.width !== 'broad'
const pointIn = (bands, min, max) => bands.filter(b => isPoint(b) && b.value >= min && b.value <= max)
const pointNear = (bands, min, max, tol = TOLERANCE) =>
  bands.filter(
    b =>
      isPoint(b) &&
      ((b.value >= min - tol && b.value < min) || (b.value > max && b.value <= max + tol))
  )
const listLabels = bands => bands.map(b => bandLabel(b)).join(', ')
const cm = bands => `${listLabels(bands)} cm⁻¹`
const isStrong = b => b.intensity === 'F'
// "Banda" / "Bandas", com adjetivo opcional concordando em número
const Bd = (bands, adj = '') => {
  const many = bands.length > 1
  const adjText = adj ? ` ${adj}${many ? (adj.endsWith('l') ? '' : 's') : ''}` : ''
  return `${many ? 'Bandas' : 'Banda'}${adjText.replace(/ls$/, 'is')}`
}
const hasIntensity = b => b.intensity !== null && b.intensity !== undefined

function ev(id, status, bands = [], extra = {}) {
  const rule = RULES[id]
  return {
    id,
    name: extra.name || rule?.name || id,
    status,
    bands,
    rule,
    summary: extra.summary || '',
    detail: extra.detail || '',
    meta: extra.meta || {}
  }
}

// ----------------------------------------------------------- perguntas (UI)
export const QUESTION_OPTIONS = {
  yesNo: [
    { value: 'yes', label: 'Sim' },
    { value: 'no', label: 'Não' },
    { value: 'unknown', label: 'Não sei' }
  ]
}

// =============================================================================
// Função principal
// =============================================================================
/**
 * @param {Array}  bands    bandas normalizadas (ver input/manualInput.js)
 * @param {Object} answers  respostas do estudante às perguntas { chave: valor }
 * @param {Object} context  { idh } — índice de deficiência de hidrogênio, opcional
 * @returns {{ evidence: Object, questions: Array }}
 */
export function detectEvidence(bands, answers = {}, context = {}) {
  const E = {}
  const questions = []

  // ---------------------------------------------------------------- C=O
  const r = RULES.CO
  const coAll = pointIn(bands, r.min, r.max)
  const coCore = coAll.filter(b => b.value >= CO_AMBIGUOUS_ZONE.max)
  const coAmb = coAll.filter(b => b.value < CO_AMBIGUOUS_ZONE.max)
  const coNear = pointNear(bands, r.min, r.max)

  let coBands = []
  if (coCore.length) {
    coBands = [...coCore, ...coAmb.filter(isStrong)]
    E.CO = ev('CO', PRESENT, coBands, {
      summary: `${Bd(coCore)} em ${cm(coCore)}: região típica de estiramento C=O.`,
      detail: `Bandas entre ${r.min} e ${r.max} cm⁻¹ são características da ligação C=O (carbonila), normalmente uma das mais intensas do espectro.`
    })
  } else if (coAmb.length) {
    const strongAmb = coAmb.filter(isStrong)
    const allMarkedWeak = coAmb.every(b => hasIntensity(b) && !isStrong(b))
    let answer = answers.co_strength
    if (strongAmb.length) answer = 'yes'
    else if (allMarkedWeak) answer = 'no'
    else {
      questions.push({
        key: 'co_strength',
        step: 'co',
        prompt: `A banda em ${cm(coAmb)} é FORTE — uma das mais intensas do espectro?`,
        why: `Entre ${CO_AMBIGUOUS_ZONE.min} e ${CO_AMBIGUOUS_ZONE.max} cm⁻¹ podem aparecer tanto C=O (amidas, cetonas conjugadas) quanto C=C de alceno (1600–1680). A intensidade decide: C=O é forte; C=C de alceno é média ou fraca.`,
        options: [
          { value: 'yes', label: 'Sim, é forte' },
          { value: 'no', label: 'Não, é média ou fraca' },
          { value: 'unknown', label: 'Não sei' }
        ]
      })
    }
    if (answer === 'yes') {
      coBands = coAmb
      E.CO = ev('CO', PRESENT, coAmb, {
        summary: `${Bd(coAmb, 'forte')} em ${cm(coAmb)}: compatível com C=O em número de onda baixo (amida, aril-cetona ou carbonila conjugada).`,
        detail: 'Carbonilas conjugadas ou de amidas absorvem abaixo de 1700 cm⁻¹. Por ser forte, a banda é atribuída a C=O e não a C=C.'
      })
    } else if (answer === 'no') {
      E.CO = ev('CO', ABSENT, [], {
        summary: `A banda em ${cm(coAmb)} é média/fraca: mais compatível com C=C do que com C=O.`,
        detail: 'Sem uma banda forte entre 1650 e 1820 cm⁻¹, as funções carboniladas ficam pouco prováveis.',
        meta: { reassigned: coAmb }
      })
    } else {
      coBands = coAmb
      E.CO = ev('CO', UNCERTAIN, coAmb, {
        summary: `${Bd(coAmb)} em ${cm(coAmb)}: pode ser C=O (se for forte) ou C=C (se for média/fraca).`,
        detail: 'Região de sobreposição. Observe a intensidade da banda no espectro para decidir.'
      })
    }
  } else if (coNear.length) {
    coBands = coNear
    E.CO = ev('CO', UNCERTAIN, coNear, {
      summary: `${Bd(coNear)} em ${cm(coNear)}, logo na borda da faixa de C=O (${r.min}–${r.max}).`,
      detail: 'Fica a poucos cm⁻¹ da faixa típica; considere C=O como possibilidade, especialmente se a banda for forte.'
    })
  } else {
    E.CO = ev('CO', ABSENT, [], {
      summary: `Não há bandas entre ${r.min} e ${r.max} cm⁻¹.`,
      detail: 'A ausência de absorção na região da carbonila praticamente exclui ácidos, ésteres, aldeídos, cetonas, amidas, anidridos e haletos de acila.'
    })
  }
  const hasCO = E.CO.status !== ABSENT

  // -------------------------------------------------- duas carbonilas (anidrido)
  const coWide = pointIn(bands, r.min, r.max + TOLERANCE)
  const hi = coWide.filter(b => b.value >= 1790 && b.value <= 1830)
  const lo = coWide.filter(b => b.value >= 1730 && b.value < 1790)
  const pair = hi.flatMap(h => lo.filter(l => h.value - l.value >= 30 && h.value - l.value <= 85).map(l => [h, l]))[0]
  E.CO_PAIR = pair
    ? ev('CO_PAIR', PRESENT, pair, {
        name: '2 bandas de C=O',
        summary: `Duas bandas de C=O (${cm(pair)}), separadas por ~${pair[0].value - pair[1].value} cm⁻¹.`,
        detail: 'Anidridos mostram dois estiramentos C=O acoplados (simétrico e assimétrico), em ~1815 e ~1750 cm⁻¹.'
      })
    : ev('CO_PAIR', ABSENT, [], { name: '2 bandas de C=O' })

  // ------------------------------------------------- posição da carbonila
  for (const sub of CARBONYL_SUBTYPES) {
    const hits = hasCO ? coBands.filter(b => b.value >= sub.min && b.value <= sub.max) : []
    let status = hits.length ? (E.CO.status === PRESENT ? PRESENT : UNCERTAIN) : ABSENT
    if (sub.id === 'POS_ACYL_HALIDE' && E.CO_PAIR.status === PRESENT) status = ABSENT
    E[sub.id] = ev(sub.id, status, hits, {
      name: `C=O na faixa de ${sub.name}`,
      summary: hits.length ? `C=O em ${cm(hits)}: dentro da faixa típica de ${sub.name} (${sub.min}–${sub.max}).` : ''
    })
  }

  // ------------------------------------------------------ O–H de ácido
  const ra = RULES.OH_ACID
  const broadAcid = bands.filter(
    b =>
      b.width === 'broad' &&
      ((b.max - b.min >= 300 && b.min <= ra.max && b.max >= ra.min) ||
        (b.value >= ra.min && b.value <= 3200))
  )
  const anyInHighRegion = bands.some(b => b.value >= ra.min && b.value <= 3650)
  if (broadAcid.length) {
    E.OH_ACID = hasCO
      ? ev('OH_ACID', PRESENT, broadAcid, {
          summary: `Absorção muito larga em ${cm(broadAcid)}: compatível com O–H de ácido carboxílico.`,
          detail: ra.teaching
        })
      : ev('OH_ACID', UNCERTAIN, broadAcid, {
          summary: `Absorção muito larga em ${cm(broadAcid)}, mas sem C=O.`,
          detail: 'Sem carbonila não pode ser ácido carboxílico; uma absorção larga aqui é mais compatível com O–H fortemente associado (álcool, fenol) ou N–H.'
        })
  } else if (hasCO && anyInHighRegion) {
    const answer = answers.acid_oh
    questions.push({
      key: 'acid_oh',
      step: 'oh',
      prompt: 'Olhe o espectro entre ~3300 e ~2500 cm⁻¹: existe uma absorção MUITO LARGA que ocupa toda essa região e "engole" as bandas de C–H?',
      why: 'Somente com os números de onda não dá para saber a largura da banda. Uma absorção larguíssima nessa região, junto com C=O, é a marca registrada do ácido carboxílico (dímero por ligação de hidrogênio).',
      options: [
        { value: 'yes', label: 'Sim, muito larga' },
        { value: 'no', label: 'Não, bandas definidas' },
        { value: 'unknown', label: 'Não sei' }
      ]
    })
    if (answer === 'yes') {
      const inside = bands.filter(b => b.value >= ra.min && b.value <= ra.max)
      E.OH_ACID = ev('OH_ACID', PRESENT, inside, {
        summary: 'Você indicou uma absorção muito larga entre ~2500 e 3300 cm⁻¹: compatível com O–H de ácido carboxílico.',
        detail: ra.teaching
      })
    } else if (answer === 'no') {
      E.OH_ACID = ev('OH_ACID', ABSENT, [], {
        summary: 'Não há a absorção muito larga entre 2500 e 3300 cm⁻¹ típica de ácido.',
        detail: 'Sem esse O–H larguíssimo, o ácido carboxílico fica pouco provável.'
      })
    } else {
      E.OH_ACID = ev('OH_ACID', UNCERTAIN, [], {
        summary: 'Não foi possível saber se existe a absorção muito larga de O–H de ácido (2500–3300).',
        detail: 'Confira a forma das bandas nessa região do espectro.'
      })
    }
  } else {
    E.OH_ACID = ev('OH_ACID', ABSENT, [], {
      summary: hasCO ? 'Não há absorções na região de 2500–3300 cm⁻¹.' : 'Sem C=O, não há como ser O–H de ácido carboxílico.'
    })
  }

  // ------------------------------------------ ligações triplas (antes de X–H)
  const tri = pointIn(bands, RULES.CC_TRIPLE.min, RULES.CC_TRIPLE.max)
  const triNear = pointNear(bands, RULES.CC_TRIPLE.min, RULES.CC_TRIPLE.max)
  const inCN = tri.filter(b => b.value >= RULES.CN_TRIPLE.min && b.value <= RULES.CN_TRIPLE.max)
  const onlyCC = tri.filter(b => b.value < RULES.CN_TRIPLE.min)
  let triIntensity = null
  if (inCN.length) {
    if (inCN.some(b => b.intensity === 'F' || b.intensity === 'm')) triIntensity = 'strong'
    else if (inCN.every(b => b.intensity === 'f')) triIntensity = 'weak'
    else {
      questions.push({
        key: 'triple_intensity',
        step: 'triple',
        prompt: `Como é a banda em ${cm(inCN)}?`,
        why: 'Entre 2210 e 2260 cm⁻¹ absorvem tanto C≡N quanto C≡C. Nitrilas dão banda aguda de intensidade média a forte; C≡C costuma ser fraca.',
        options: [
          { value: 'strong', label: 'Média/forte e aguda' },
          { value: 'weak', label: 'Fraca' },
          { value: 'unknown', label: 'Não sei' }
        ]
      })
      triIntensity = answers.triple_intensity || 'unknown'
    }
  }

  if (inCN.length && triIntensity !== 'weak') {
    E.CN_TRIPLE = ev('CN_TRIPLE', PRESENT, inCN, {
      summary: `${Bd(inCN)} em ${cm(inCN)}: possível grupo nitrila (C≡N).`,
      detail: 'A região 2210–2260 cm⁻¹ quase não tem outras absorções, por isso uma banda aqui chama atenção. Ela sugere C≡N, mas sozinha não prova a função: confira as demais evidências.'
    })
  } else if (inCN.length) {
    E.CN_TRIPLE = ev('CN_TRIPLE', UNCERTAIN, inCN, {
      summary: `Banda fraca em ${cm(inCN)}: nitrila é possível, mas C≡C é mais compatível.`
    })
  } else if (triNear.length) {
    E.CN_TRIPLE = ev('CN_TRIPLE', UNCERTAIN, triNear, { summary: `${Bd(triNear)} em ${cm(triNear)}, na borda da região de ligações triplas.` })
  } else {
    E.CN_TRIPLE = ev('CN_TRIPLE', ABSENT, [], { summary: 'Não há bandas entre 2210 e 2260 cm⁻¹: nitrila pouco provável.' })
  }

  if (onlyCC.length || (inCN.length && triIntensity === 'weak')) {
    const ccb = [...onlyCC, ...(triIntensity === 'weak' ? inCN : [])]
    E.CC_TRIPLE = ev('CC_TRIPLE', PRESENT, ccb, {
      summary: `${Bd(ccb)} em ${cm(ccb)}: possível ligação C≡C.`,
      detail: RULES.CC_TRIPLE.teaching
    })
  } else if (inCN.length && triIntensity !== 'strong') {
    E.CC_TRIPLE = ev('CC_TRIPLE', UNCERTAIN, inCN, {
      summary: `A banda em ${cm(inCN)} também cai na faixa de C≡C (2100–2260).`,
      detail: 'As faixas de C≡N e C≡C se sobrepõem; a intensidade e a presença de ≡C–H (~3300) ajudam a decidir.'
    })
  } else if (triNear.length) {
    E.CC_TRIPLE = ev('CC_TRIPLE', UNCERTAIN, triNear, { summary: `${Bd(triNear)} em ${cm(triNear)}, na borda da região de C≡C.` })
  } else {
    E.CC_TRIPLE = ev('CC_TRIPLE', ABSENT, [], {
      summary: inCN.length ? 'A banda forte em 2210–2260 é mais compatível com C≡N do que com C≡C.' : 'Não há bandas entre 2100 e 2260 cm⁻¹: C≡C pouco provável (lembre que alcinos internos simétricos podem não absorver).'
    })
  }
  const hasTriple = E.CC_TRIPLE.status !== ABSENT

  // ------------------------------------------- região O–H / N–H (forma)
  const zone = pointIn(bands, 3150, 3650)
  const broadZone = bands.filter(b => b.width === 'broad' && b.value >= 3150 && b.value <= 3650)
  let shape = null
  let shapeSource = 'none'
  if (broadZone.length) {
    shape = 'broad'
    shapeSource = 'input'
  } else if (zone.length) {
    const nhZone = zone.filter(b => b.value <= 3550)
    const isDoublet = nhZone.some(a => nhZone.some(b => a.value - b.value >= 40 && a.value - b.value <= 200))
    if (isDoublet) {
      shape = 'doublet'
      shapeSource = 'auto'
    } else {
      questions.push({
        key: 'xh_shape',
        step: 'oh',
        prompt: `Como é a banda em ${cm(zone)} no espectro?`,
        why: 'O–H e N–H absorvem na mesma região. A FORMA da banda é o que os diferencia: O–H associado é largo, intenso e arredondado; N–H é mais estreito — um pico (NH) ou dois (NH₂).',
        options: [
          { value: 'broad', label: 'Larga e intensa (arredondada)' },
          { value: 'sharp', label: 'Mais estreita, um pico só' },
          { value: 'doublet', label: 'Dois picos próximos' },
          { value: 'unknown', label: 'Não sei' }
        ]
      })
      shape = answers.xh_shape && answers.xh_shape !== 'unknown' ? answers.xh_shape : null
      shapeSource = shape ? 'answer' : 'none'
    }
  }
  const xhBands = broadZone.length ? broadZone : zone

  // ---------------------------------------------------------------- O–H
  const ro = RULES.OH
  const ohIn = [...pointIn(bands, ro.min, ro.max), ...broadZone]
  const ohNear = pointNear(bands, ro.min, ro.max)
  const ohOutsideNH = ohIn.filter(b => b.value < RULES.NH.min - TOLERANCE || b.value > RULES.NH.max + TOLERANCE)
  if (!ohIn.length) {
    E.OH = ohNear.length
      ? ev('OH', UNCERTAIN, ohNear, { summary: `${Bd(ohNear)} em ${cm(ohNear)}, na borda da faixa de O–H (${ro.min}–${ro.max}).` })
      : ev('OH', ABSENT, [], {
          summary: `Não há bandas entre ${ro.min} e ${ro.max} cm⁻¹: álcool e fenol pouco prováveis.`
        })
  } else if (shape === 'broad' && E.OH_ACID.status === PRESENT && ohIn.every(b => b.value <= 3400)) {
    E.OH = ev('OH', UNCERTAIN, ohIn, {
      summary: `${Bd(ohIn, 'larga')} em ${cm(ohIn)}: provavelmente faz parte da absorção larga do O–H do ácido, e não de um álcool.`,
      detail: 'Quando há o O–H muito largo de ácido carboxílico, bandas de O–H em ~3000–3400 costumam pertencer a ele.'
    })
  } else if (shape === 'broad') {
    E.OH = ev('OH', PRESENT, ohIn, {
      summary: `${Bd(ohIn, 'larga')} em ${cm(ohIn)}: região característica de O–H. Possibilidade: álcool ou fenol.`,
      detail: `${ro.teaching} Ainda não dá para concluir que é álcool: é preciso olhar as outras bandas (C=O, C–O, anel aromático).`
    })
  } else if (shape === 'doublet') {
    E.OH = ev('OH', ABSENT, [], {
      summary: 'As bandas acima de 3150 cm⁻¹ formam um dubleto: padrão típico de NH₂, não de O–H.'
    })
  } else if (shape === 'sharp') {
    const free = ohIn.filter(b => b.value >= 3550)
    if (free.length) {
      E.OH = ev('OH', PRESENT, free, {
        summary: `Banda aguda em ${cm(free)}: compatível com O–H "livre" (não associado).`,
        detail: 'O–H sem ligação de hidrogênio (fase gasosa ou solução diluída) dá banda aguda perto de 3600 cm⁻¹.'
      })
    } else {
      E.OH = ev('OH', UNCERTAIN, ohIn, {
        summary: `Banda estreita em ${cm(ohIn)}: pouco típica de O–H associado; N–H${hasTriple ? ' ou ≡C–H' : ''} é mais compatível.`
      })
    }
  } else if (ohOutsideNH.length) {
    E.OH = ev('OH', PRESENT, ohIn, {
      summary: `${Bd(ohIn)} em ${cm(ohIn)}: região característica de O–H. Possibilidade: álcool ou fenol.`,
      detail: `${ro.teaching} Ainda não dá para concluir que é álcool: é preciso olhar as outras bandas.`
    })
  } else {
    E.OH = ev('OH', UNCERTAIN, ohIn, {
      summary: `${Bd(ohIn)} em ${cm(ohIn)}: pode ser O–H ou N–H (as faixas se sobrepõem).`,
      detail: 'Entre 3300 e 3500 cm⁻¹ absorvem O–H e N–H. Informe a forma da banda para decidir.'
    })
  }

  // ---------------------------------------------------------------- N–H
  const rn = RULES.NH
  const nhIn = pointIn(bands, rn.min - TOLERANCE, rn.max + TOLERANCE)
  const nhStrict = pointIn(bands, rn.min, rn.max)
  if (shape === 'doublet') {
    const d = xhBands.filter(b => b.value <= 3550)
    E.NH = ev('NH', PRESENT, d, {
      summary: `Dubleto em ${cm(d)}: compatível com NH₂ (amina ou amida primária).`,
      detail: RULES.NH.teaching,
      meta: { pattern: 'doublet', auto: shapeSource === 'auto' }
    })
  } else if (shape === 'sharp' && nhIn.length) {
    const terminalAlkyne = hasTriple && nhIn.every(b => b.value >= RULES.CH_SP.min && b.value <= RULES.CH_SP.max)
    E.NH = terminalAlkyne
      ? ev('NH', UNCERTAIN, nhIn, {
          summary: `Banda estreita em ${cm(nhIn)}: com C≡C presente, pode ser ≡C–H (alcino terminal) em vez de N–H.`
        })
      : ev('NH', PRESENT, nhIn, {
          summary: `Banda única e estreita em ${cm(nhIn)}: compatível com N–H (amina ou amida secundária).`,
          detail: RULES.NH.teaching,
          meta: { pattern: 'singlet' }
        })
  } else if (shape === 'broad') {
    E.NH = ev('NH', ABSENT, [], {
      summary: 'A banda nessa região é larga e intensa: mais típica de O–H do que de N–H.'
    })
  } else if (nhStrict.length || nhIn.length) {
    const b = nhStrict.length ? nhStrict : nhIn
    E.NH = ev('NH', UNCERTAIN, b, {
      summary: `${Bd(b)} em ${cm(b)}: possibilidade de ligação N–H.`,
      detail: 'A interpretação deve considerar outras bandas: a forma (um ou dois picos), a presença de C=O (amida) e a ausência de O–H.'
    })
  } else {
    E.NH = ev('NH', ABSENT, [], { summary: `Não há bandas entre ${rn.min} e ${rn.max} cm⁻¹: N–H pouco provável.` })
  }

  // ------------------------------------------------------------- ≡C–H
  const sp = pointIn(bands, RULES.CH_SP.min, RULES.CH_SP.max)
  if (sp.length && hasTriple && shape !== 'broad') {
    E.CH_SP = ev('CH_SP', shape === 'sharp' ? PRESENT : UNCERTAIN, sp, {
      summary: `${Bd(sp)} em ${cm(sp)} junto com C≡C: compatível com ≡C–H de alcino terminal.`,
      detail: RULES.CH_SP.teaching
    })
  } else {
    E.CH_SP = ev('CH_SP', ABSENT, [], { summary: 'Não há evidência de ≡C–H (alcino terminal).' })
  }

  // ---------------------------------------------------------------- C–H
  const edge3000 = pointIn(bands, 3000, 3000)
  const sp2 = pointIn(bands, RULES.CH_SP2.min + 1, RULES.CH_SP2.max)
  const sp3 = pointIn(bands, RULES.CH_SP3.min, RULES.CH_SP3.max - 1)
  E.CH_SP2 = sp2.length
    ? ev('CH_SP2', PRESENT, sp2, {
        summary: `${Bd(sp2)} em ${cm(sp2)} (acima de 3000): possível C–H sp² (alceno ou aromático).`,
        detail: RULES.CH_SP2.teaching
      })
    : edge3000.length
      ? ev('CH_SP2', UNCERTAIN, edge3000, { summary: 'Banda exatamente em 3000 cm⁻¹: fica na fronteira entre C–H sp² e sp³.' })
      : ev('CH_SP2', ABSENT, [], { summary: 'Não há bandas entre 3000 e 3100 cm⁻¹: sem evidência de C–H sp².' })
  E.CH_SP3 = sp3.length
    ? ev('CH_SP3', PRESENT, sp3, {
        summary: `${Bd(sp3)} em ${cm(sp3)} (abaixo de 3000): há evidência de C–H de carbonos sp³.`,
        detail: RULES.CH_SP3.teaching
      })
    : edge3000.length
      ? ev('CH_SP3', UNCERTAIN, edge3000, { summary: 'Banda exatamente em 3000 cm⁻¹: fica na fronteira entre C–H sp² e sp³.' })
      : ev('CH_SP3', ABSENT, [], { summary: 'Não há bandas entre 2850 e 3000 cm⁻¹: sem evidência clara de C–H sp³.' })

  const ald = pointIn(bands, RULES.CH_ALD.min, RULES.CH_ALD.max)
  const aldNear = pointNear(bands, RULES.CH_ALD.min, RULES.CH_ALD.max)
  if (ald.length) {
    const fermi = ald.length >= 2
    E.CH_ALD = ev('CH_ALD', E.CO.status === PRESENT ? PRESENT : UNCERTAIN, ald, {
      summary: hasCO
        ? `Banda${fermi ? 's' : ''} em ${cm(ald)}${fermi ? ' (dubleto de Fermi)' : ''}: C–H aldeídico. Junto com C=O, a combinação é compatível com aldeído.`
        : `${Bd(ald)} em ${cm(ald)} na região de C–H aldeídico, mas sem C=O ela não indica aldeído.`,
      detail: RULES.CH_ALD.teaching,
      meta: { fermi }
    })
  } else if (aldNear.length && hasCO) {
    E.CH_ALD = ev('CH_ALD', UNCERTAIN, aldNear, { summary: `${Bd(aldNear)} em ${cm(aldNear)}, perto da região de C–H aldeídico (2695–2830).` })
  } else {
    E.CH_ALD = ev('CH_ALD', ABSENT, [], { summary: 'Não há bandas entre ~2700 e 2830 cm⁻¹: sem C–H aldeídico.' })
  }

  // ---------------------------------------------------------------- S–H
  const sh = pointIn(bands, RULES.SH.min, RULES.SH.max)
  E.SH = sh.length
    ? ev('SH', E.OH_ACID.status === PRESENT ? UNCERTAIN : PRESENT, sh, {
        summary: `${Bd(sh)} em ${cm(sh)}: possível S–H (tiol).`,
        detail: RULES.SH.teaching
      })
    : ev('SH', ABSENT, [], { summary: 'Não há banda de S–H (2550–2600).' })

  // ---------------------------------------------------------- anel aromático
  const aHi = pointIn(bands, 1575, 1625)
  const aMid = pointIn(bands, 1480, 1525)
  const aLow = pointIn(bands, 1440, 1470)
  const sp2ok = E.CH_SP2.status === PRESENT
  const aromBands = [...aHi, ...aMid, ...aLow]
  let aromStatus = ABSENT
  if (aHi.length && (aMid.length || (aLow.length && sp2ok))) aromStatus = PRESENT
  else if ((aHi.length && (aLow.length || sp2ok)) || (aMid.length && sp2ok)) aromStatus = UNCERTAIN
  if (aromStatus === PRESENT && context.idh !== undefined && context.idh !== null && context.idh < 4) aromStatus = UNCERTAIN
  E.AROM = ev('AROM', aromStatus, aromStatus === ABSENT ? [] : aromBands, {
    summary:
      aromStatus === PRESENT
        ? `Bandas em ${cm(aromBands)}${sp2ok ? ' + C–H sp²' : ''}: padrão compatível com anel aromático.`
        : aromStatus === UNCERTAIN
          ? `Bandas em ${cm(aromBands)}: podem indicar anel aromático, mas o padrão está incompleto.`
          : 'Não há o conjunto de bandas de anel aromático (~1600 e ~1500/1450 cm⁻¹).',
    detail: RULES.AROM.teaching
  })
  const aromBandIds = new Set(aromStatus === ABSENT ? [] : aromBands.map(b => b.id))

  // ---------------------------------------------------------------- C=C
  const coUsed = new Set(E.CO.status === ABSENT ? [] : E.CO.bands.map(b => b.id))
  const ccCand = pointIn(bands, RULES.CC_DOUBLE.min, RULES.CC_DOUBLE.max).filter(b => !coUsed.has(b.id))
  const ccClear = ccCand.filter(b => b.value >= 1620)
  const ccEdge = ccCand.filter(b => b.value < 1620 && !aromBandIds.has(b.id))
  if (ccClear.length) {
    E.CC_DOUBLE = ev('CC_DOUBLE', PRESENT, ccClear, {
      summary: `${Bd(ccClear)} em ${cm(ccClear)}: compatível com estiramento C=C de alceno.`,
      detail: RULES.CC_DOUBLE.teaching
    })
  } else if (ccEdge.length) {
    E.CC_DOUBLE = ev('CC_DOUBLE', UNCERTAIN, ccEdge, {
      summary: `${Bd(ccEdge)} em ${cm(ccEdge)}: pode ser C=C de alceno ou de anel aromático.`
    })
  } else {
    const usedByCO = pointIn(bands, RULES.CC_DOUBLE.min, RULES.CC_DOUBLE.max).filter(b => coUsed.has(b.id))
    E.CC_DOUBLE = ev('CC_DOUBLE', ABSENT, [], {
      summary: usedByCO.length
        ? `A banda em ${cm(usedByCO)} foi atribuída a C=O; não há outra banda de C=C.`
        : aromBandIds.size
          ? 'As bandas perto de 1600 foram atribuídas ao anel aromático; não há C=C de alceno isolado.'
          : 'Não há bandas entre 1600 e 1680 cm⁻¹: sem evidência de C=C de alceno.'
    })
  }

  // ---------------------------------------------------------------- NO₂
  const nAs = pointIn(bands, 1500, 1570)
  const nSy = pointIn(bands, 1300, 1380)
  const strongN = [...nAs, ...nSy].filter(isStrong)
  if (nAs.length && nSy.length && nAs.some(isStrong) && nSy.some(isStrong)) {
    E.NO2 = ev('NO2', PRESENT, strongN, { summary: `Par de bandas fortes em ${cm(strongN)}: compatível com grupo nitro.`, detail: RULES.NO2.teaching })
  } else if (nAs.length && nSy.length && strongN.length) {
    E.NO2 = ev('NO2', UNCERTAIN, [...nAs, ...nSy], { summary: `Bandas em ${cm([...nAs, ...nSy])}: o grupo nitro só se confirma se AMBAS forem fortes.` })
  } else {
    E.NO2 = ev('NO2', ABSENT, [], { summary: 'Sem o par de bandas fortes de NO₂.' })
  }

  // ---------------------------------------------------------------- C–O
  const rc = RULES.CO_SINGLE
  const coS = pointIn(bands, rc.min, rc.max)
  if (!coS.length) {
    E.CO_SINGLE = ev('CO_SINGLE', ABSENT, [], { summary: `Não há bandas entre ${rc.min} e ${rc.max} cm⁻¹: sem evidência de C–O.` })
  } else {
    const strong = coS.filter(isStrong)
    let answer = answers.co_single_strength
    if (strong.length) answer = 'yes'
    else if (coS.every(hasIntensity)) answer = 'no'
    else {
      questions.push({
        key: 'co_single_strength',
        step: 'fingerprint',
        prompt: `Entre 1000 e 1300 cm⁻¹, alguma destas bandas é FORTE (comparável às mais intensas do espectro)? ${cm(coS)}`,
        why: 'Essa faixa já fica na região de impressão digital, cheia de bandas. Só bandas FORTES ali são uma boa evidência de C–O (álcool, éter, éster, ácido).',
        options: [
          { value: 'yes', label: 'Sim, há banda forte' },
          { value: 'no', label: 'Não, são médias/fracas' },
          { value: 'unknown', label: 'Não sei' }
        ]
      })
    }
    const used = strong.length ? strong : coS
    if (answer === 'yes') {
      const alc = used.map(b => {
        const nearest = ALCOHOL_CO.reduce((best, a) => (Math.abs(a.center - b.value) < Math.abs(best.center - b.value) ? a : best))
        return { band: b.value, type: nearest.name }
      })
      E.CO_SINGLE = ev('CO_SINGLE', PRESENT, used, {
        summary: `${Bd(used, 'forte')} em ${cm(used)}: compatível com estiramento C–O.`,
        detail: rc.teaching,
        meta: { alcoholHint: alc }
      })
    } else if (answer === 'no') {
      E.CO_SINGLE = ev('CO_SINGLE', ABSENT, [], {
        summary: `As bandas em ${cm(coS)} não são fortes: C–O pouco provável (podem ser outras vibrações da impressão digital).`
      })
    } else {
      E.CO_SINGLE = ev('CO_SINGLE', UNCERTAIN, coS, {
        summary: `${Bd(coS)} em ${cm(coS)}: ${coS.length > 1 ? 'podem' : 'pode'} ser C–O, se ${coS.length > 1 ? 'forem fortes' : 'for forte'}.`,
        detail: rc.teaching
      })
    }
  }

  // ----------------------------------------------------- impressão digital
  const ch3 = pointIn(bands, RULES.CH3_SYM.min, RULES.CH3_SYM.max)
  E.CH3_SYM = ev('CH3_SYM', ch3.length ? PRESENT : ABSENT, ch3, {
    summary: ch3.length ? `${Bd(ch3)} em ${cm(ch3)}: compatível com deformação de metila (CH₃).` : 'Sem banda em ~1375 cm⁻¹ (metila).'
  })
  const ch2 = pointIn(bands, RULES.CH2_BEND.min, RULES.CH2_BEND.max).filter(b => !aromBandIds.has(b.id))
  E.CH2_BEND = ev('CH2_BEND', ch2.length ? PRESENT : ABSENT, ch2, {
    summary: ch2.length ? `${Bd(ch2)} em ${cm(ch2)}: deformação de CH₂/CH₃.` : ''
  })

  const oop = pointIn(bands, RULES.AROM_OOP.min, RULES.AROM_OOP.max)
  const patterns =
    aromStatus !== ABSENT
      ? BENZENE_PATTERNS.filter(p => p.ranges.every(([lo2, hi2]) => oop.some(b => b.value >= lo2 && b.value <= hi2))).map(p => p.name)
      : []
  E.AROM_OOP = ev('AROM_OOP', oop.length && aromStatus !== ABSENT ? PRESENT : ABSENT, oop, {
    summary: oop.length
      ? `${Bd(oop)} em ${cm(oop)}: deformação C–H fora do plano${patterns.length ? `; padrão compatível com anel ${patterns.join(' ou ')}` : ''}.`
      : '',
    meta: { patterns }
  })

  // ------------------------------------------------------------- derivadas
  const unsat = ['CC_DOUBLE', 'CC_TRIPLE', 'CN_TRIPLE', 'AROM'].filter(id => E[id].status !== ABSENT)
  E.UNSATURATION = ev('UNSATURATION', unsat.length ? PRESENT : ABSENT, [], { name: 'insaturações' })

  const idh = context.idh
  E.IDH4 = ev('IDH4', idh !== undefined && idh !== null && idh >= 4 ? PRESENT : ABSENT, [], {
    name: 'IDH ≥ 4',
    summary: idh !== undefined && idh !== null ? `IDH = ${idh}.` : ''
  })

  return { evidence: E, questions, shape }
}

// Evidências mostradas no painel-resumo
export const SUMMARY_EVIDENCE = [
  'CO',
  'OH',
  'OH_ACID',
  'NH',
  'CN_TRIPLE',
  'CC_TRIPLE',
  'CH_SP3',
  'CH_SP2',
  'CH_ALD',
  'CC_DOUBLE',
  'AROM',
  'CO_SINGLE'
]

/** Para cada banda, lista as evidências às quais ela foi atribuída. */
export function assignBands(bands, evidence) {
  const map = Object.fromEntries(bands.map(b => [b.id, []]))
  const skip = new Set(['UNSATURATION', 'IDH4'])
  for (const e of Object.values(evidence)) {
    if (skip.has(e.id) || e.id.startsWith('POS_') || e.status === ABSENT) continue
    for (const b of e.bands) {
      if (map[b.id] && !map[b.id].some(a => a.id === e.id)) map[b.id].push({ id: e.id, name: e.name, status: e.status })
    }
  }
  return map
}
