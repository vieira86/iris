// =============================================================================
// ENTRADA MANUAL DE BANDAS
// =============================================================================
// Toda fonte de dados do IRIS deve produzir a mesma estrutura de banda:
//
//   { value, min, max, width, intensity, raw }
//     value      número de onda central (cm⁻¹)
//     min / max  extensão da banda (igual a value para bandas pontuais)
//     width      'broad' (larga) ou null
//     intensity  'F' (forte) | 'm' (média) | 'f' (fraca) | null (não informada)
//
// Hoje só existe esta entrada manual. No futuro, outros adaptadores (leitura de
// CSV, detecção automática de picos em um espectro enviado) devem viver nesta
// pasta (src/input/) e devolver o MESMO formato, de modo que o motor de análise
// (src/engine/) não precise mudar.
// =============================================================================

import { VALID_RANGE } from '../data/irRules.js'

const NUMBER = '(\\d{3,4}(?:\\.\\d+)?)'
const TOKEN_RE = new RegExp(`^${NUMBER}(?:-${NUMBER})?([A-Za-z]*)$`)

// Letras aceitas após o número (notação usada em tabelas de correlação)
const SUFFIXES = {
  F: { intensity: 'F' },
  m: { intensity: 'm' },
  f: { intensity: 'f' },
  L: { width: 'broad' },
  l: { width: 'broad' }
}

const INTENSITY_LABEL = { F: 'forte', m: 'média', f: 'fraca' }

/**
 * Converte o texto digitado pelo estudante em uma lista de bandas normalizada.
 * Aceita separadores vírgula, espaço e ponto e vírgula; faixas "2500-3300"
 * (interpretadas como banda larga) e sufixos F/m/f/L.
 */
export function parseBandInput(text) {
  const ignored = []
  const bands = []
  if (!text || !text.trim()) return { bands, ignored }

  const cleaned = text
    .replace(/cm\s*[-⁻]?\s*[1¹]/gi, ' ') // remove "cm-1" / "cm⁻¹"
    .replace(/\s*[–—-]\s*/g, '-') // une faixas "2500 - 3300"
    .replace(/(\d)\s+([FmfLl])\b/g, '$1$2') // "1715 F" → "1715F"

  const tokens = cleaned.split(/[,;\s]+/).filter(Boolean)
  const seen = new Set()

  for (const raw of tokens) {
    const match = raw.match(TOKEN_RE)
    if (!match) {
      ignored.push({ raw, reason: 'não é um número de onda válido' })
      continue
    }

    const [, a, b, letters] = match
    const extra = {}
    let badSuffix = false
    for (const letter of letters) {
      if (!SUFFIXES[letter]) badSuffix = true
      else Object.assign(extra, SUFFIXES[letter])
    }
    if (badSuffix) {
      ignored.push({ raw, reason: `sufixo "${letters}" não reconhecido (use F, m, f ou L)` })
      continue
    }

    let min = Number(a)
    let max = b !== undefined ? Number(b) : min
    if (min > max) [min, max] = [max, min]
    const isRange = max - min > 0

    if (min < VALID_RANGE.min || max > VALID_RANGE.max) {
      ignored.push({ raw, reason: `fora da faixa ${VALID_RANGE.min}–${VALID_RANGE.max} cm⁻¹` })
      continue
    }

    const value = Math.round((min + max) / 2)
    const key = isRange ? `${Math.round(min)}-${Math.round(max)}` : String(Math.round(value))
    if (seen.has(key)) {
      ignored.push({ raw, reason: 'valor repetido' })
      continue
    }
    seen.add(key)

    bands.push({
      value,
      min: Math.round(min),
      max: Math.round(max),
      width: isRange ? 'broad' : extra.width || null,
      intensity: extra.intensity || null,
      raw
    })
  }

  bands.sort((x, y) => y.value - x.value)
  bands.forEach((band, i) => {
    band.id = `b${i}`
  })
  return { bands, ignored }
}

/** Rótulo curto de uma banda: "1715", "2500–3300", "1250 (forte)" */
export function bandLabel(band, { withQualifiers = false } = {}) {
  const base = band.min !== band.max ? `${band.min}–${band.max}` : String(band.value)
  if (!withQualifiers) return base
  const quals = []
  if (band.width === 'broad') quals.push('larga')
  if (band.intensity) quals.push(INTENSITY_LABEL[band.intensity])
  return quals.length ? `${base} (${quals.join(', ')})` : base
}
