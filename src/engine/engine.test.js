import { describe, it, expect } from 'vitest'
import { parseBandInput } from '../input/manualInput.js'
import { analyzeSpectrum } from './index.js'
import { EXAMPLES } from '../data/examples.js'
import { computeIDH } from './idh.js'

const run = (text, answers = {}, formula) => analyzeSpectrum(parseBandInput(text).bands, answers, { formula })

describe('parseBandInput', () => {
  it('normaliza, ordena, remove duplicatas e ignora inválidos', () => {
    const { bands, ignored } = parseBandInput('3300, 1715, 2950, abc, 1715, 1450')
    expect(bands.map(b => b.value)).toEqual([3300, 2950, 1715, 1450])
    expect(ignored.map(i => i.raw)).toEqual(['abc', '1715'])
  })
  it('aceita espaço, ponto e vírgula, faixas e sufixos', () => {
    const { bands } = parseBandInput('2500 - 3300; 1715F 1250 F')
    expect(bands).toHaveLength(3)
    expect(bands[0]).toMatchObject({ min: 2500, max: 3300, width: 'broad' })
    expect(bands[1].intensity).toBe('F')
    expect(bands[2].intensity).toBe('F')
  })
  it('aceita banda individual', () => {
    expect(parseBandInput('1715').bands).toHaveLength(1)
  })
  it('rejeita valores fora de 400–4000', () => {
    expect(parseBandInput('5000, 200').ignored).toHaveLength(2)
  })
})

describe('IDH', () => {
  it('calcula como no artigo', () => {
    expect(computeIDH('C7H6O').idh).toBe(5)
    expect(computeIDH('C8H9NO').idh).toBe(5)
    expect(computeIDH('C6H5Cl').idh).toBe(4)
    expect(computeIDH('C5H11N').idh).toBe(1)
  })
})

const top = (ex, answers = {}) => {
  const e = EXAMPLES.find(x => x.id === ex)
  return run(e.bands, answers, e.formula)
}

describe('exemplos de Lopes & Fascio', () => {
  it('A → aldeído + aromático', () => {
    const r = top('A', { acid_oh: 'no' })
    expect(r.hypotheses[0].id).toBe('aldehyde')
    expect(r.hypotheses[0].level.id).toBe('strong')
    expect(r.evidence.AROM.status).toBe('present')
    expect(r.tree.carbonyl.leaf).toBe('Aldeído')
  })
  it('B → álcool', () => {
    const r = top('B')
    expect(r.hypotheses[0].id).toBe('alcohol')
    expect(r.evidence.CO.status).toBe('absent')
  })
  it('C → fenol e éster entre as primeiras', () => {
    const r = top('C', { acid_oh: 'no' })
    const ids = r.hypotheses.slice(0, 2).map(h => h.id)
    expect(ids).toContain('phenol')
    expect(ids).toContain('ester')
  })
  it('D → amida secundária após informar banda estreita', () => {
    const r1 = top('D')
    expect(r1.questions.map(q => q.key)).toContain('xh_shape')
    const r = top('D', { xh_shape: 'sharp', acid_oh: 'no' })
    expect(r.hypotheses[0].id).toBe('amide')
    expect(r.tree.carbonyl.leaf).toMatch(/secundária/)
  })
})

describe('exemplos didáticos', () => {
  it('E → ácido carboxílico', () => expect(top('E').hypotheses[0].id).toBe('acid'))
  it('F → éster', () => expect(top('F').hypotheses[0].id).toBe('ester'))
  it('G → cetona por exclusão (moderada)', () => {
    const r = top('G')
    expect(r.hypotheses[0].id).toBe('ketone')
    expect(r.hypotheses[0].level.id).toBe('moderate')
  })
  it('H → alcino terminal', () => expect(top('H', { xh_shape: 'sharp' }).hypotheses[0].id).toBe('alkyne'))
  it('I → nitrila', () => expect(top('I').hypotheses[0].id).toBe('nitrile'))
  it('J → amina (dubleto automático)', () => {
    const r = top('J')
    expect(r.evidence.NH.meta.pattern).toBe('doublet')
    expect(r.hypotheses[0].id).toBe('amine')
  })
  it('exemplo do enunciado com O–H largo de ácido', () => {
    const r = run('3300, 2950, 1715, 1450, 1250', { acid_oh: 'yes', xh_shape: 'broad', co_single_strength: 'yes' })
    expect(r.hypotheses[0].id).toBe('acid')
  })
  it('sem C=O → nenhuma função carbonilada', () => {
    const r = run('2960, 2870, 1465, 1375')
    expect(r.hypotheses.some(h => h.family === 'carbonila')).toBe(false)
    expect(r.hypotheses[0].id).toBe('alkane')
  })
})
