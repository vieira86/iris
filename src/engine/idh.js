// Índice de Deficiência de Hidrogênio (IDH) — Lopes & Fascio (2004):
//   IDH = (C − M/2) + T/2 + 1
//   C = carbonos (e outros tetravalentes); M = monovalentes (H, halogênios);
//   T = trivalentes (N, P). Átomos bivalentes (O, S) não entram.

const VALENCE = { C: 4, Si: 4, H: 1, F: 1, Cl: 1, Br: 1, I: 1, N: 3, P: 3, O: 2, S: 2 }

export function parseFormula(text) {
  const clean = (text || '').replace(/\s+/g, '')
  if (!clean) return null
  const re = /([A-Z][a-z]?)(\d*)/g
  const counts = {}
  let consumed = ''
  let m
  while ((m = re.exec(clean)) !== null) {
    if (!m[0]) break
    const [, el, n] = m
    if (!(el in VALENCE)) return { error: `elemento "${el}" não suportado` }
    counts[el] = (counts[el] || 0) + (n ? Number(n) : 1)
    consumed += m[0]
  }
  if (consumed !== clean) return { error: 'fórmula não reconhecida (use, por exemplo, C7H6O)' }
  if (!counts.C) return { error: 'a fórmula precisa conter carbono' }
  return { counts }
}

export function computeIDH(text) {
  const parsed = parseFormula(text)
  if (!parsed) return null
  if (parsed.error) return { error: parsed.error }
  const { counts } = parsed
  let C = 0
  let M = 0
  let T = 0
  for (const [el, n] of Object.entries(counts)) {
    if (VALENCE[el] === 4) C += n
    else if (VALENCE[el] === 1) M += n
    else if (VALENCE[el] === 3) T += n
  }
  const idh = C - M / 2 + T / 2 + 1
  if (idh < 0 || !Number.isInteger(idh * 2)) return { error: 'fórmula incoerente (IDH negativo)' }
  if (!Number.isInteger(idh)) return { error: `IDH = ${idh} não é inteiro: confira a fórmula` }
  return { idh, formula: text.trim() }
}
