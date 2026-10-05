// =============================================================================
// IRIS — FUNÇÕES ORGÂNICAS E PONTUAÇÃO (Índice de compatibilidade espectroscópica)
// =============================================================================
// Cada função tem uma lista de critérios. Cada critério olha para uma evidência
// (ids definidos em engine/evidence.js) e soma (ou subtrai) pontos.
//
//   ev       id da evidência
//   when     'present'  → conta quando a evidência foi encontrada
//            'absent'   → conta quando a evidência NÃO foi encontrada
//   points   pontos (negativos = evidência contrária)
//   text     frase usada na explicação do raciocínio
//
// Evidência INCERTA (amarelo) vale metade dos pontos em critérios 'present'
// e não pontua em critérios 'absent'.
//
// requires     a função só é listada se ao menos uma destas evidências estiver
//              presente ou incerta.
// diagnostic   evidências que identificam a função de forma positiva.
//              - nenhuma diagnóstica presente → nível máximo "moderada"
//              - função com diagnósticas, mas nenhuma presente/incerta → "fraca"
//              - função sem diagnósticas (cetona, éter, alcano) → identificada
//                por EXCLUSÃO, no máximo "moderada"
// excludeIf    a função não é listada se alguma destas evidências estiver presente.
//
// Para adicionar uma nova função: copie um bloco, ajuste os critérios e pronto.
// =============================================================================

export const HYPOTHESES = [
  {
    id: 'acid',
    name: 'Ácido carboxílico',
    family: 'carbonila',
    requires: ['CO'],
    diagnostic: ['OH_ACID'],
    criteria: [
      { ev: 'CO', when: 'present', points: 3, text: 'há banda de C=O' },
      { ev: 'OH_ACID', when: 'present', points: 4, text: 'há O–H muito largo entre ~2500 e 3300 cm⁻¹' },
      { ev: 'POS_ACID', when: 'present', points: 1, text: 'a posição do C=O (~1680–1725) é típica de ácido' }
    ]
  },
  {
    id: 'aldehyde',
    name: 'Aldeído',
    family: 'carbonila',
    requires: ['CO'],
    diagnostic: ['CH_ALD'],
    criteria: [
      { ev: 'CO', when: 'present', points: 3, text: 'há banda de C=O' },
      { ev: 'CH_ALD', when: 'present', points: 4, text: 'há banda(s) de C–H aldeídico (~2720–2820)' },
      { ev: 'POS_ALD', when: 'present', points: 1, text: 'a posição do C=O (~1685–1740) é típica de aldeído' }
    ]
  },
  {
    id: 'ester',
    name: 'Éster',
    family: 'carbonila',
    requires: ['CO'],
    diagnostic: ['CO_SINGLE'],
    criteria: [
      { ev: 'CO', when: 'present', points: 3, text: 'há banda de C=O' },
      { ev: 'CO_SINGLE', when: 'present', points: 3, text: 'há banda(s) forte(s) de C–O entre 1000 e 1300' },
      { ev: 'POS_ESTER', when: 'present', points: 1, text: 'a posição do C=O (~1715–1750) é típica de éster' },
      { ev: 'OH_ACID', when: 'present', points: -3, text: 'o O–H muito largo aponta para ácido, não éster' }
    ]
  },
  {
    id: 'ketone',
    name: 'Cetona',
    family: 'carbonila',
    requires: ['CO'],
    diagnostic: [],
    criteria: [
      { ev: 'CO', when: 'present', points: 3, text: 'há banda de C=O' },
      { ev: 'CH_SP3', when: 'present', points: 1, text: 'há C–H sp³' },
      { ev: 'POS_KETONE', when: 'present', points: 1, text: 'a posição do C=O (~1680–1725) é típica de cetona' },
      { ev: 'CO_SINGLE', when: 'absent', points: 1, text: 'não há C–O forte (afasta éster)' },
      { ev: 'OH_ACID', when: 'absent', points: 0.5, text: 'não há O–H de ácido' },
      { ev: 'CH_ALD', when: 'absent', points: 0.5, text: 'não há C–H de aldeído' },
      { ev: 'CO_SINGLE', when: 'present', points: -1.5, text: 'C–O forte favorece éster' },
      { ev: 'CH_ALD', when: 'present', points: -2, text: 'C–H aldeídico favorece aldeído' },
      { ev: 'NH', when: 'present', points: -1.5, text: 'N–H junto com C=O favorece amida' }
    ]
  },
  {
    id: 'amide',
    name: 'Amida',
    family: 'carbonila',
    requires: ['CO'],
    diagnostic: ['NH'],
    criteria: [
      { ev: 'CO', when: 'present', points: 3, text: 'há banda de C=O' },
      { ev: 'NH', when: 'present', points: 3, text: 'há banda de N–H' },
      { ev: 'POS_AMIDE', when: 'present', points: 2, text: 'o C=O está em número de onda baixo (~1630–1690), típico de amida' },
      { ev: 'OH_ACID', when: 'present', points: -2, text: 'o O–H muito largo aponta para ácido' }
    ]
  },
  {
    id: 'anhydride',
    name: 'Anidrido',
    family: 'carbonila',
    requires: ['CO_PAIR'],
    diagnostic: ['CO_PAIR'],
    criteria: [
      { ev: 'CO', when: 'present', points: 3, text: 'há banda de C=O' },
      { ev: 'CO_PAIR', when: 'present', points: 4, text: 'há DUAS bandas de C=O (~1815 e ~1750)' },
      { ev: 'CO_SINGLE', when: 'present', points: 1, text: 'há C–O forte' }
    ]
  },
  {
    id: 'acyl_halide',
    name: 'Haleto de acila',
    family: 'carbonila',
    requires: ['POS_ACYL_HALIDE'],
    diagnostic: ['POS_ACYL_HALIDE'],
    criteria: [
      { ev: 'CO', when: 'present', points: 3, text: 'há banda de C=O' },
      { ev: 'POS_ACYL_HALIDE', when: 'present', points: 3, text: 'o C=O está em número de onda muito alto (~1770–1820)' },
      { ev: 'CO_PAIR', when: 'absent', points: 1, text: 'há só uma banda de C=O (afasta anidrido)' }
    ]
  },
  {
    id: 'alcohol',
    name: 'Álcool',
    family: 'hidroxila',
    requires: ['OH'],
    diagnostic: ['OH'],
    criteria: [
      { ev: 'OH', when: 'present', points: 4, text: 'há banda de O–H (3200–3600)' },
      { ev: 'CH_SP3', when: 'present', points: 1, text: 'há C–H sp³' },
      { ev: 'CO_SINGLE', when: 'present', points: 1, text: 'há C–O forte (1000–1300)' },
      { ev: 'CO', when: 'absent', points: 1, text: 'não há C=O' },
      { ev: 'OH_ACID', when: 'present', points: -4, text: 'o O–H pode ser o do ácido carboxílico' },
      { ev: 'AROM', when: 'present', points: -2, text: 'com anel aromático, o O–H pode ser de fenol' }
    ]
  },
  {
    id: 'phenol',
    name: 'Fenol',
    family: 'hidroxila',
    requires: ['OH'],
    diagnostic: ['OH'],
    minEvidence: ['AROM'],
    criteria: [
      { ev: 'OH', when: 'present', points: 4, text: 'há banda de O–H (3200–3600)' },
      { ev: 'AROM', when: 'present', points: 2, text: 'há evidência de anel aromático' },
      { ev: 'CO_SINGLE', when: 'present', points: 1, text: 'há C–O forte (fenóis: ~1200–1260)' },
      { ev: 'OH_ACID', when: 'present', points: -4, text: 'o O–H pode ser o do ácido carboxílico' }
    ]
  },
  {
    id: 'ether',
    name: 'Éter',
    family: 'oxigenada',
    requires: ['CO_SINGLE'],
    excludeIf: ['CO', 'OH_ACID'],
    diagnostic: [],
    criteria: [
      { ev: 'CO_SINGLE', when: 'present', points: 3, text: 'há C–O forte (1000–1300)' },
      { ev: 'OH', when: 'absent', points: 2, text: 'não há O–H (afasta álcool)' },
      { ev: 'CO', when: 'absent', points: 2, text: 'não há C=O (afasta éster)' },
      { ev: 'OH', when: 'present', points: -2, text: 'com O–H, o C–O é mais provavelmente de álcool' }
    ]
  },
  {
    id: 'amine',
    name: 'Amina',
    family: 'nitrogenada',
    requires: ['NH'],
    diagnostic: ['NH'],
    criteria: [
      { ev: 'NH', when: 'present', points: 4, text: 'há banda de N–H (3300–3500)' },
      { ev: 'CO', when: 'absent', points: 2, text: 'não há C=O (afasta amida)' },
      { ev: 'CO', when: 'present', points: -2, text: 'N–H com C=O aponta para amida' }
    ]
  },
  {
    id: 'nitrile',
    name: 'Nitrila',
    family: 'nitrogenada',
    requires: ['CN_TRIPLE'],
    diagnostic: ['CN_TRIPLE'],
    criteria: [
      { ev: 'CN_TRIPLE', when: 'present', points: 5, text: 'há banda em 2210–2260 (C≡N)' },
      { ev: 'CH_SP', when: 'absent', points: 1, text: 'não há ≡C–H (afasta alcino terminal)' }
    ]
  },
  {
    id: 'alkyne',
    name: 'Alcino',
    family: 'hidrocarboneto',
    requires: ['CC_TRIPLE'],
    diagnostic: ['CC_TRIPLE', 'CH_SP'],
    criteria: [
      { ev: 'CC_TRIPLE', when: 'present', points: 4, text: 'há banda em 2100–2260 (C≡C)' },
      { ev: 'CH_SP', when: 'present', points: 3, text: 'há ≡C–H agudo perto de 3300 (alcino terminal)' }
    ]
  },
  {
    id: 'alkene',
    name: 'Alceno',
    family: 'hidrocarboneto',
    requires: ['CC_DOUBLE'],
    diagnostic: ['CC_DOUBLE'],
    criteria: [
      { ev: 'CC_DOUBLE', when: 'present', points: 3, text: 'há banda de C=C (1600–1680)' },
      { ev: 'CH_SP2', when: 'present', points: 2, text: 'há C–H sp² (acima de 3000)' },
      { ev: 'AROM', when: 'absent', points: 1, text: 'não há padrão de anel aromático' },
      { ev: 'AROM', when: 'present', points: -2, text: 'as bandas podem ser do anel aromático' }
    ]
  },
  {
    id: 'aromatic',
    name: 'Anel aromático',
    family: 'esqueleto',
    // 'skeleton': característica do esqueleto, listada à parte das funções
    // (uma benzonitrila é nitrila E aromática ao mesmo tempo).
    kind: 'skeleton',
    requires: ['AROM'],
    diagnostic: ['AROM'],
    criteria: [
      { ev: 'AROM', when: 'present', points: 4, text: 'há bandas do anel (~1600 e ~1500/1450)' },
      { ev: 'CH_SP2', when: 'present', points: 2, text: 'há C–H sp² (acima de 3000)' },
      { ev: 'AROM_OOP', when: 'present', points: 1, text: 'há bandas de δ C–H fora do plano (680–900)' },
      { ev: 'IDH4', when: 'present', points: 1, text: 'o IDH ≥ 4 é compatível com anel benzênico' }
    ]
  },
  {
    id: 'nitro',
    name: 'Nitrocomposto',
    family: 'nitrogenada',
    requires: ['NO2'],
    diagnostic: ['NO2'],
    criteria: [{ ev: 'NO2', when: 'present', points: 5, text: 'há o par de bandas fortes de NO₂ (~1530 e ~1350)' }]
  },
  {
    id: 'thiol',
    name: 'Tiol (mercaptana)',
    family: 'sulfurada',
    requires: ['SH'],
    diagnostic: ['SH'],
    criteria: [{ ev: 'SH', when: 'present', points: 5, text: 'há banda fraca em 2550–2600 (S–H)' }]
  },
  {
    id: 'alkane',
    name: 'Alcano / cicloalcano',
    family: 'hidrocarboneto',
    requires: ['CH_SP3'],
    excludeIf: ['CO', 'OH', 'NH', 'CN_TRIPLE', 'CC_TRIPLE', 'OH_ACID'],
    diagnostic: [],
    criteria: [
      { ev: 'CH_SP3', when: 'present', points: 2, text: 'há C–H sp³ (abaixo de 3000)' },
      { ev: 'CO', when: 'absent', points: 1, text: 'não há C=O' },
      { ev: 'OH', when: 'absent', points: 1, text: 'não há O–H' },
      { ev: 'NH', when: 'absent', points: 1, text: 'não há N–H' },
      { ev: 'CO_SINGLE', when: 'absent', points: 1, text: 'não há C–O forte' },
      { ev: 'UNSATURATION', when: 'absent', points: 1, text: 'não há C=C, C≡C, C≡N nem anel aromático' }
    ]
  }
]

// Limiares do nível de compatibilidade (fração da pontuação máxima da função)
export const LEVELS = [
  { id: 'strong', label: 'forte compatibilidade', minRatio: 0.7, minScore: 5 },
  { id: 'moderate', label: 'compatibilidade moderada', minRatio: 0.45, minScore: 3 },
  { id: 'weak', label: 'compatibilidade fraca', minRatio: 0, minScore: 0 }
]
