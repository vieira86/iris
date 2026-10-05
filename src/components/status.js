// Aparência dos três estados de evidência (verde / amarelo / cinza-vermelho)
export const STATUS_UI = {
  present: {
    icon: '✓',
    answer: 'SIM',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
    soft: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500'
  },
  uncertain: {
    icon: '?',
    answer: 'TALVEZ',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
    soft: 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500'
  },
  absent: {
    icon: '✗',
    answer: 'NÃO',
    badge: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600',
    soft: 'bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400'
  }
}

export const LEVEL_UI = {
  strong: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'from-emerald-500 to-teal-500' },
  moderate: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', bar: 'from-amber-400 to-orange-400' },
  weak: { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300', bar: 'from-slate-300 to-slate-400' }
}

// Status "dominante" de uma banda, a partir das atribuições
export function bandStatus(assignments = []) {
  if (assignments.some(a => a.status === 'present')) return 'present'
  if (assignments.some(a => a.status === 'uncertain')) return 'uncertain'
  return 'none'
}
