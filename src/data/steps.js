// =============================================================================
// ETAPAS DA ANÁLISE GUIADA (ordem do esquema de Lopes & Fascio, 2004)
// =============================================================================
// checks     perguntas exibidas em cada etapa; a resposta SIM/NÃO/TALVEZ vem
//            automaticamente do status da evidência (engine/evidence.js)
// highlight  faixas destacadas no espectro esquemático durante a etapa
// =============================================================================

export const STEPS = [
  {
    id: 'co',
    short: 'C=O',
    title: 'Região da carbonila',
    intro:
      'O primeiro passo do esquema é procurar a carbonila. A banda de C=O costuma ser uma das mais intensas do espectro e, se existir, direciona toda a análise para as funções carboniladas.',
    checks: [
      { ev: 'CO', question: 'Existe uma banda entre 1650 e 1820 cm⁻¹?' },
      { ev: 'CO_PAIR', question: 'Há duas bandas de C=O (~1815 e ~1750 cm⁻¹)?', onlyIf: 'CO' }
    ],
    highlight: [{ min: 1650, max: 1820 }]
  },
  {
    id: 'oh',
    short: 'O–H',
    title: 'Hidroxila (O–H)',
    intro:
      'Agora olhamos a região acima de 3200 cm⁻¹ e a absorção muito larga entre 2500 e 3300 cm⁻¹. A forma da banda importa tanto quanto a posição.',
    checks: [
      { ev: 'OH', question: 'Existe banda entre 3200 e 3600 cm⁻¹ compatível com O–H?' },
      { ev: 'OH_ACID', question: 'Existe O–H muito largo entre 2500 e 3300 cm⁻¹ (ácido)?' }
    ],
    highlight: [{ min: 3200, max: 3600 }, { min: 2500, max: 3300, soft: true }]
  },
  {
    id: 'nh',
    short: 'N–H',
    title: 'Ligação N–H',
    intro:
      'N–H absorve na mesma região que O–H. Um pico (NH) ou dois picos (NH₂) ajudam a diferenciar; a presença de C=O indica amida, a ausência, amina.',
    checks: [{ ev: 'NH', question: 'Existe banda entre 3300 e 3500 cm⁻¹ compatível com N–H?' }],
    highlight: [{ min: 3300, max: 3500 }]
  },
  {
    id: 'triple',
    short: 'C≡',
    title: 'Ligações triplas',
    intro:
      'A região entre 2100 e 2260 cm⁻¹ quase não tem outras absorções. Uma banda aqui chama atenção, mas sozinha não identifica a função.',
    checks: [
      { ev: 'CN_TRIPLE', question: 'Existe banda entre 2210 e 2260 cm⁻¹ (C≡N)?' },
      { ev: 'CC_TRIPLE', question: 'Existe banda entre 2100 e 2260 cm⁻¹ (C≡C)?' },
      { ev: 'CH_SP', question: 'Há ≡C–H agudo perto de 3300 cm⁻¹ (alcino terminal)?', onlyIf: 'CC_TRIPLE' }
    ],
    highlight: [{ min: 2100, max: 2260 }]
  },
  {
    id: 'ch',
    short: 'C–H',
    title: 'Estiramentos C–H',
    intro:
      'A linha dos 3000 cm⁻¹ separa C–H de carbono sp² (acima) e sp³ (abaixo). Entre ~2700 e 2830 cm⁻¹ procuramos o C–H de aldeído.',
    checks: [
      { ev: 'CH_SP3', question: 'Existe banda entre 2850 e 3000 cm⁻¹ (C–H sp³)?' },
      { ev: 'CH_SP2', question: 'Existe banda entre 3000 e 3100 cm⁻¹ (C–H sp²)?' },
      { ev: 'CH_ALD', question: 'Existe banda entre ~2700 e 2830 cm⁻¹ (C–H de aldeído)?' }
    ],
    highlight: [{ min: 2850, max: 3100 }, { min: 2695, max: 2830, soft: true }]
  },
  {
    id: 'cc',
    short: 'C=C',
    title: 'C=C e anel aromático',
    intro:
      'Alcenos mostram C=C entre 1600 e 1680 cm⁻¹ (média/fraca). Anéis aromáticos mostram de 2 a 4 bandas entre ~1450 e 1600 cm⁻¹, junto com C–H sp².',
    checks: [
      { ev: 'CC_DOUBLE', question: 'Existe banda entre 1600 e 1680 cm⁻¹ (C=C de alceno)?' },
      { ev: 'AROM', question: 'Há o conjunto de bandas de anel aromático (~1600 e ~1500/1450)?' }
    ],
    highlight: [{ min: 1600, max: 1680 }, { min: 1450, max: 1620, soft: true }]
  },
  {
    id: 'fingerprint',
    short: 'C–O',
    title: 'C–O e impressão digital',
    intro:
      'Abaixo de ~1500 cm⁻¹ está a região de impressão digital. Aqui procuramos principalmente bandas FORTES de C–O (1000–1300 cm⁻¹) e algumas pistas complementares.',
    checks: [
      { ev: 'CO_SINGLE', question: 'Existem bandas fortes entre 1000 e 1300 cm⁻¹ (C–O)?' },
      { ev: 'NO2', question: 'Há o par de bandas fortes de NO₂ (~1530 e ~1350)?' },
      { ev: 'CH3_SYM', question: 'Há banda em ~1375 cm⁻¹ (metila)?' },
      { ev: 'AROM_OOP', question: 'Há bandas de δ C–H fora do plano (680–900)?', onlyIf: 'AROM' }
    ],
    highlight: [{ min: 400, max: 1500, soft: true }, { min: 1000, max: 1300 }],
    fingerprintNote: true
  },
  {
    id: 'tree',
    short: 'Árvore',
    title: 'Árvore de decisão',
    intro:
      'Juntando as evidências: o bloco da carbonila é percorrido pergunta a pergunta; o primeiro "sim" indica a função. Depois verificamos os demais grupos (bloco da esquerda do esquema).',
    checks: [],
    highlight: []
  }
]

export const FINGERPRINT_TEXT =
  'A região abaixo de aproximadamente 1500 cm⁻¹ é conhecida como região de impressão digital. Ela contém muitas bandas e é extremamente útil para comparação com espectros de referência, mas não deve ser interpretada isoladamente como uma simples tabela de "uma banda = uma função".'
