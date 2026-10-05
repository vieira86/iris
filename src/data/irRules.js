// =============================================================================
// IRIS — BANCO DE REGRAS ESPECTROSCÓPICAS
// =============================================================================
// Todas as faixas estão em número de onda (cm⁻¹). Para ajustar uma faixa basta
// mudar `min` / `max` aqui — o restante do código lê tudo deste arquivo.
//
// Fontes principais:
//  - Lopes, W. A.; Fascio, M. Quím. Nova 2004, 27 (4), 670-673 (esquema da Fig. 1)
//  - Silverstein, Webster & Kiemle; Pavia et al. (tabelas de correlação usuais)
//
// Campos:
//  id          identificador usado pelo motor de análise (não mudar sem ajustar o motor)
//  name        rótulo curto exibido ao estudante
//  min / max   faixa típica (cm⁻¹)
//  type        functional_group | c_h | multiple_bond | fingerprint
//  vibration   tipo de vibração (ν = estiramento, δ = deformação)
//  expected    intensidade/forma esperada (F forte, m média, f fraca, L larga)
//  description texto curto de atribuição
//  teaching    observação didática mostrada na explicação
// =============================================================================

// Margem de tolerância: uma banda que caia até TOLERANCE cm⁻¹ fora de uma faixa
// é tratada como evidência INCERTA (amarelo), e não como ausência.
export const TOLERANCE = 10

// Faixa aceita na entrada (região do IV médio).
export const VALID_RANGE = { min: 400, max: 4000 }

export const IR_RULES = [
  {
    id: 'OH',
    name: 'O–H',
    min: 3200,
    max: 3600,
    type: 'functional_group',
    vibration: 'ν O–H',
    expected: 'F, L (associada por ligação de H)',
    description: 'Estiramento O–H de álcool ou fenol',
    teaching:
      'Em amostras líquidas/sólidas o O–H forma ligações de hidrogênio e a banda fica larga e intensa (~3200–3400). O–H "livre" (diluído) aparece como banda aguda perto de 3600.'
  },
  {
    id: 'OH_ACID',
    name: 'O–H de ácido',
    min: 2500,
    max: 3300,
    type: 'functional_group',
    vibration: 'ν O–H (dímero)',
    expected: 'L, muito larga',
    description: 'O–H de ácido carboxílico (dímero por ligação de H)',
    teaching:
      'Nos ácidos carboxílicos, o dímero formado por ligações de hidrogênio produz uma absorção muito larga, de ~3300 até ~2500 cm⁻¹, que costuma "engolir" as bandas de C–H.'
  },
  {
    id: 'NH',
    name: 'N–H',
    min: 3300,
    max: 3500,
    type: 'functional_group',
    vibration: 'ν N–H',
    expected: 'f-m (dubleto em NH₂; singleto em NH)',
    description: 'Estiramento N–H de amina ou amida',
    teaching:
      'NH₂ (amina/amida primária) mostra DUAS bandas (estiramentos assimétrico e simétrico); N–H (secundária) mostra UMA. Aminas terciárias não têm N–H. As bandas de N–H costumam ser menos largas e menos intensas que as de O–H.'
  },
  {
    id: 'CH_SP',
    name: '≡C–H',
    min: 3250,
    max: 3340,
    type: 'c_h',
    vibration: 'ν Csp–H',
    expected: 'F, aguda',
    description: 'C–H de alcino terminal',
    teaching: 'Banda aguda e intensa perto de 3300; só tem sentido se houver também C≡C (2100–2260).'
  },
  {
    id: 'CH_SP2',
    name: 'C–H sp²',
    min: 3000,
    max: 3100,
    type: 'c_h',
    vibration: 'ν Csp²–H',
    expected: 'f-m',
    description: 'C–H de carbono sp² (alceno ou aromático)',
    teaching: 'A "linha dos 3000": C–H acima de 3000 cm⁻¹ vem de carbono sp² (ou sp); abaixo de 3000, de carbono sp³.'
  },
  {
    id: 'CH_SP3',
    name: 'C–H sp³',
    min: 2850,
    max: 3000,
    type: 'c_h',
    vibration: 'ν Csp³–H',
    expected: 'm-F',
    description: 'C–H de carbono sp³ (CH₃, CH₂, CH)',
    teaching: 'Aparece em quase todo composto orgânico com parte alifática; por isso, sozinho, diz pouco sobre a função.'
  },
  {
    id: 'CH_ALD',
    name: 'C–H de aldeído',
    min: 2695,
    max: 2830,
    type: 'c_h',
    vibration: 'ν C(=O)–H',
    expected: 'f-m, frequentemente dubleto (~2820 e ~2720)',
    description: 'C–H aldeídico (dubleto de Fermi)',
    teaching:
      'A ressonância de Fermi entre o estiramento C–H e um sobretom de deformação gera frequentemente DUAS bandas fracas (~2820 e ~2720). A de ~2720 é a mais diagnóstica, pois fica isolada.'
  },
  {
    id: 'SH',
    name: 'S–H',
    min: 2550,
    max: 2600,
    type: 'functional_group',
    vibration: 'ν S–H',
    expected: 'f',
    description: 'S–H de tiol (mercaptana) ou tiofenol',
    teaching: 'Banda fraca, mas em região normalmente vazia do espectro.'
  },
  {
    id: 'CN_TRIPLE',
    name: 'C≡N',
    min: 2210,
    max: 2260,
    type: 'multiple_bond',
    vibration: 'ν C≡N',
    expected: 'm-F, aguda',
    description: 'Estiramento C≡N de nitrila',
    teaching: 'Nitrilas dão banda aguda, de intensidade média a forte. Fica na mesma região que C≡C, por isso a intensidade ajuda a decidir.'
  },
  {
    id: 'CC_TRIPLE',
    name: 'C≡C',
    min: 2100,
    max: 2260,
    type: 'multiple_bond',
    vibration: 'ν C≡C',
    expected: 'f-m (fraca ou ausente em alcinos internos simétricos)',
    description: 'Estiramento C≡C de alcino',
    teaching:
      'Alcinos terminais mostram C≡C em ~2100–2140 e ≡C–H em ~3300. Em alcinos internos simétricos a banda pode nem aparecer (não há variação de momento de dipolo).'
  },
  {
    id: 'CO',
    name: 'C=O',
    min: 1650,
    max: 1820,
    type: 'functional_group',
    vibration: 'ν C=O',
    expected: 'F, aguda',
    description: 'Estiramento C=O (carbonila)',
    teaching:
      'A carbonila produz, em geral, uma das bandas mais intensas do espectro. A posição exata depende da função (cloreto de ácido > anidrido > éster > aldeído ≈ cetona ≈ ácido > amida) e diminui com conjugação.'
  },
  {
    id: 'CC_DOUBLE',
    name: 'C=C',
    min: 1600,
    max: 1680,
    type: 'multiple_bond',
    vibration: 'ν C=C',
    expected: 'm-f',
    description: 'Estiramento C=C de alceno',
    teaching: 'Banda média ou fraca (bem menos intensa que C=O). Alcenos simétricos podem nem mostrá-la.'
  },
  {
    id: 'AROM',
    name: 'C=C aromático',
    min: 1450,
    max: 1620,
    type: 'multiple_bond',
    vibration: 'ν C=C (anel)',
    expected: 'm, 2 a 4 bandas (~1600, 1580, 1500, 1450)',
    description: 'Estiramentos C=C do anel aromático',
    teaching: 'O anel benzênico mostra de 2 a 4 bandas entre ~1450 e 1600. Uma banda isolada em 1450 NÃO basta: ela coincide com a deformação de CH₂/CH₃.'
  },
  {
    id: 'NO2',
    name: 'NO₂',
    min: 1300,
    max: 1570,
    type: 'functional_group',
    vibration: 'ν NO₂ (ass. ~1500–1570; sim. ~1300–1380)',
    expected: 'F, F (par)',
    description: 'Grupo nitro: duas bandas fortes',
    teaching: 'O grupo nitro precisa de DUAS bandas fortes, uma em ~1500–1570 e outra em ~1300–1380.'
  },
  {
    id: 'CO_SINGLE',
    name: 'C–O',
    min: 1000,
    max: 1300,
    type: 'fingerprint',
    vibration: 'ν C–O',
    expected: 'F',
    description: 'Estiramento C–O (álcool, éter, éster, ácido)',
    teaching:
      'Bandas FORTES entre 1000 e 1300 sugerem C–O. Atenção: essa faixa já está na região de impressão digital, onde há muitas outras bandas; por isso a intensidade importa.'
  },
  {
    id: 'CH3_SYM',
    name: 'δ CH₃',
    min: 1370,
    max: 1385,
    type: 'fingerprint',
    vibration: 'δ sim. CH₃',
    expected: 'm',
    description: 'Deformação simétrica de metila (~1375)',
    teaching: 'Indica grupo metila. Um dubleto aqui sugere isopropila ou terc-butila.'
  },
  {
    id: 'CH2_BEND',
    name: 'δ CH₂ / CH₃',
    min: 1440,
    max: 1470,
    type: 'fingerprint',
    vibration: 'δ CH₂ (tesoura) / δ ass. CH₃',
    expected: 'm',
    description: 'Deformação de CH₂ (~1465) e CH₃ (~1450)',
    teaching: 'Presente em praticamente todo composto com cadeia alifática.'
  },
  {
    id: 'AROM_OOP',
    name: 'δ C–H fora do plano',
    min: 680,
    max: 900,
    type: 'fingerprint',
    vibration: 'δ C–H fora do plano',
    expected: 'F',
    description: 'Deformação C–H fora do plano (aromáticos/alcenos)',
    teaching: 'Útil para o padrão de substituição do anel, mas só depois de confirmar que há anel aromático.'
  }
]

// Acesso rápido por id
export const RULES = Object.fromEntries(IR_RULES.map(rule => [rule.id, rule]))

// -----------------------------------------------------------------------------
// Subfaixas de C=O: onde cada função costuma absorver (valores aproximados,
// substância não conjugada; conjugação desloca ~20–30 cm⁻¹ para menos).
// -----------------------------------------------------------------------------
export const CARBONYL_SUBTYPES = [
  { id: 'POS_ACYL_HALIDE', name: 'haleto de acila', min: 1770, max: 1820 },
  { id: 'POS_ANHYDRIDE_HIGH', name: 'anidrido (banda alta)', min: 1790, max: 1830 },
  { id: 'POS_ANHYDRIDE_LOW', name: 'anidrido (banda baixa)', min: 1730, max: 1790 },
  { id: 'POS_ESTER', name: 'éster', min: 1715, max: 1750 },
  { id: 'POS_ALD', name: 'aldeído', min: 1685, max: 1740 },
  { id: 'POS_KETONE', name: 'cetona', min: 1680, max: 1725 },
  { id: 'POS_ACID', name: 'ácido carboxílico', min: 1680, max: 1725 },
  { id: 'POS_AMIDE', name: 'amida', min: 1630, max: 1690 }
]

// Zona de sobreposição C=O × C=C: uma banda aqui só é tratada como C=O
// quando for forte (o motor pergunta ao estudante).
export const CO_AMBIGUOUS_ZONE = { min: 1650, max: 1690 }

// Padrões de substituição do benzeno (δ C–H fora do plano) — Lopes & Fascio, Fig. 1
export const BENZENE_PATTERNS = [
  { name: 'monossubstituído', ranges: [[730, 770], [690, 710]] },
  { name: '1,2-dissubstituído (orto)', ranges: [[735, 770]] },
  { name: '1,3-dissubstituído (meta)', ranges: [[750, 810], [680, 735]] },
  { name: '1,4-dissubstituído (para)', ranges: [[800, 860]] }
]

// C–O de álcoois (nota * do esquema de Lopes & Fascio)
export const ALCOHOL_CO = [
  { name: 'primário', center: 1050 },
  { name: 'secundário', center: 1100 },
  { name: 'terciário', center: 1150 }
]

// -----------------------------------------------------------------------------
// Regiões para a visualização do espectro (duas linhas, para não sobrepor).
// -----------------------------------------------------------------------------
export const SPECTRUM_REGIONS = [
  { label: 'O–H / N–H', min: 3200, max: 3650, row: 0, color: 'sky' },
  { label: 'C–H', min: 2700, max: 3100, row: 1, color: 'violet' },
  { label: 'C≡C / C≡N', min: 2100, max: 2270, row: 0, color: 'fuchsia' },
  { label: 'C=O', min: 1650, max: 1820, row: 0, color: 'rose' },
  { label: 'C=C', min: 1600, max: 1680, row: 1, color: 'emerald' },
  { label: 'Fingerprint', min: 400, max: 1500, row: 0, color: 'slate' }
]

export const FINGERPRINT_LIMIT = 1500
