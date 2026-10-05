import { useMemo } from 'react'
import { SPECTRUM_REGIONS, FINGERPRINT_LIMIT } from '../data/irRules'
import { bandLabel } from '../input/manualInput'
import { bandStatus } from './status'

// Geometria (unidades do viewBox)
const W = 800
const H = 300
const PAD_L = 14
const PAD_R = 14
const TOP = 70 // espaço para os rótulos das bandas
const PLOT_H = 140
const AXIS_Y = TOP + PLOT_H
const PLOT_W = W - PAD_L - PAD_R
// Escala com mudança em 2000 cm⁻¹ (como nos espectrômetros): 4000→2000 ocupa 42%
const SPLIT = 0.42

function xOf(wn) {
  if (wn >= 2000) return PAD_L + ((4000 - wn) / 2000) * SPLIT * PLOT_W
  return PAD_L + SPLIT * PLOT_W + ((2000 - wn) / 1600) * (1 - SPLIT) * PLOT_W
}

const TICKS = [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]

const DEPTH = { F: 0.85, m: 0.55, f: 0.3 }

const REGION_FILL = {
  sky: 'fill-sky-400/15 dark:fill-sky-400/20',
  violet: 'fill-violet-400/15 dark:fill-violet-400/20',
  fuchsia: 'fill-fuchsia-400/15 dark:fill-fuchsia-400/20',
  rose: 'fill-rose-400/15 dark:fill-rose-400/20',
  emerald: 'fill-emerald-400/15 dark:fill-emerald-400/20',
  slate: 'fill-slate-400/15 dark:fill-slate-400/15'
}
const REGION_TEXT = {
  sky: 'fill-sky-700 dark:fill-sky-300',
  violet: 'fill-violet-700 dark:fill-violet-300',
  fuchsia: 'fill-fuchsia-700 dark:fill-fuchsia-300',
  rose: 'fill-rose-700 dark:fill-rose-300',
  emerald: 'fill-emerald-700 dark:fill-emerald-300',
  slate: 'fill-slate-600 dark:fill-slate-300'
}
const MARK = {
  present: { line: 'stroke-emerald-500', text: 'fill-emerald-700 dark:fill-emerald-300', dot: 'fill-emerald-500' },
  uncertain: { line: 'stroke-amber-500', text: 'fill-amber-700 dark:fill-amber-300', dot: 'fill-amber-500' },
  none: { line: 'stroke-slate-400', text: 'fill-slate-500 dark:fill-slate-400', dot: 'fill-slate-400' }
}

// Curva esquemática de transmitância (soma de lorentzianas)
function buildTrace(bands) {
  const pts = []
  for (let wn = 4000; wn >= 400; wn -= 2) {
    let absorb = 0
    for (const b of bands) {
      const broad = b.width === 'broad'
      const center = b.value
      const hw = b.min !== b.max ? (b.max - b.min) / 2 : broad ? 110 : wn > 2000 ? 14 : 7
      const depth = broad ? (b.intensity ? DEPTH[b.intensity] : 0.6) : DEPTH[b.intensity] ?? 0.6
      const d = (wn - center) / hw
      absorb += depth * (broad ? Math.exp(-0.5 * d * d * 1.4) : 1 / (1 + d * d))
    }
    const T = Math.max(0.04, 0.95 - Math.min(absorb, 0.95))
    pts.push([xOf(wn), TOP + (1 - T) * PLOT_H])
  }
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')
}

// Distribui os rótulos em até 3 linhas para não sobrepor
function layoutLabels(bands) {
  const rows = [[], [], []]
  return bands
    .slice()
    .sort((a, b) => xOf(a.value) - xOf(b.value))
    .map(b => {
      const x = xOf(b.value)
      const width = bandLabel(b).length * 7.4 + 6
      let row = rows.findIndex(r => r.every(([x0, w0]) => Math.abs(x - x0) > (width + w0) / 2 + 2))
      if (row === -1) row = 2
      rows[row].push([x, width])
      return { band: b, x, row }
    })
}

const SpectrumView = ({ bands, assignments = {}, highlight = [], compact = false }) => {
  const trace = useMemo(() => buildTrace(bands), [bands])
  const labels = useMemo(() => layoutLabels(bands), [bands])

  return (
    <div className="relative">
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={`w-full ${compact ? 'min-w-[560px]' : 'min-w-[620px]'} h-auto select-none`}
          role="img"
          aria-label={`Representação esquemática das bandas: ${bands.map(b => bandLabel(b)).join(', ')} cm⁻¹`}
        >
          {/* destaque da etapa atual */}
          {highlight.map((h, i) => (
            <rect
              key={`hl${i}`}
              x={xOf(h.max)}
              y={TOP - 6}
              width={Math.max(2, xOf(h.min) - xOf(h.max))}
              height={PLOT_H + 6}
              rx="4"
              className={h.soft ? 'fill-purple-400/10 dark:fill-purple-400/10' : 'fill-purple-500/15 dark:fill-purple-400/20'}
            />
          ))}

          {/* grade */}
          {TICKS.map(t => (
            <line key={`g${t}`} x1={xOf(t)} x2={xOf(t)} y1={TOP} y2={AXIS_Y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
          ))}
          <line x1={xOf(FINGERPRINT_LIMIT)} x2={xOf(FINGERPRINT_LIMIT)} y1={TOP - 6} y2={AXIS_Y} className="stroke-slate-400 dark:stroke-slate-600" strokeDasharray="4 4" />

          {/* espectro esquemático */}
          <path d={trace} fill="none" className="stroke-indigo-600 dark:stroke-indigo-400" strokeWidth="1.8" strokeLinejoin="round" />

          {/* marcadores das bandas */}
          {labels.map(({ band, x, row }) => {
            const st = bandStatus(assignments[band.id])
            const m = MARK[st]
            const ly = 18 + row * 17
            const names = (assignments[band.id] || []).map(a => a.name).join(', ')
            return (
              <g key={band.id}>
                <title>{`${bandLabel(band, { withQualifiers: true })} cm⁻¹ — ${names || (band.value < FINGERPRINT_LIMIT ? 'região de impressão digital' : 'sem atribuição simples')}`}</title>
                {band.min !== band.max && (
                  <rect x={xOf(band.max)} y={TOP - 4} width={xOf(band.min) - xOf(band.max)} height="4" rx="2" className={m.dot} opacity="0.7" />
                )}
                <line x1={x} x2={x} y1={ly + 4} y2={AXIS_Y} className={m.line} strokeWidth="1.3" strokeDasharray="3 3" opacity="0.8" />
                <text x={x} y={ly} textAnchor="middle" className={`${m.text} font-mono`} fontSize="12.5" fontWeight="700">
                  {bandLabel(band)}
                </text>
              </g>
            )
          })}

          {/* eixo */}
          <line x1={PAD_L} x2={W - PAD_R} y1={AXIS_Y} y2={AXIS_Y} className="stroke-slate-500 dark:stroke-slate-400" strokeWidth="1.2" />
          {TICKS.map(t => (
            <g key={`t${t}`}>
              <line x1={xOf(t)} x2={xOf(t)} y1={AXIS_Y} y2={AXIS_Y + 5} className="stroke-slate-500 dark:stroke-slate-400" />
              <text x={Math.min(Math.max(xOf(t), PAD_L + 14), W - PAD_R - 10)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11.5" className="fill-slate-600 dark:fill-slate-400 font-mono">
                {t}
              </text>
            </g>
          ))}

          {/* regiões */}
          {SPECTRUM_REGIONS.map(r => {
            const x1 = xOf(r.max)
            const x2 = xOf(r.min)
            const y = AXIS_Y + 28 + r.row * 22
            return (
              <g key={r.label}>
                <rect x={x1} y={y} width={x2 - x1} height="18" rx="5" className={REGION_FILL[r.color]} />
                <text x={(x1 + x2) / 2} y={y + 13} textAnchor="middle" fontSize="11" fontWeight="600" className={REGION_TEXT[r.color]}>
                  {r.label}
                </text>
              </g>
            )
          })}
          <text x={W - PAD_R} y={H - 2} textAnchor="end" fontSize="10.5" className="fill-slate-400">
            número de onda (cm⁻¹)
          </text>
        </svg>
      </div>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
        <span>Representação esquemática — não é o espectro real.</span>
        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-emerald-500" /> atribuída</span>
        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-500" /> incerta</span>
        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-slate-400" /> sem atribuição simples</span>
        <span className="sm:hidden">Deslize para os lados →</span>
      </p>
    </div>
  )
}

export default SpectrumView
