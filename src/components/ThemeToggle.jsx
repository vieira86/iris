const ThemeToggle = ({ theme, onToggle }) => {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className="w-11 h-11 flex items-center justify-center rounded-full bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700 shadow-md hover:scale-110 transition-all duration-200 text-xl"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeToggle
