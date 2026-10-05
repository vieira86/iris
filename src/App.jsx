import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import AnalysisScreen from './components/AnalysisScreen'
import ThemeToggle from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import { parseBandInput } from './input/manualInput'
import './index.css'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [view, setView] = useState('home') // 'home' | 'analysis'
  const [input, setInput] = useState({ text: '', formula: '' })
  const [parsed, setParsed] = useState({ bands: [], ignored: [] })
  const [runId, setRunId] = useState(0)

  const handleAnalyze = ({ text, formula }) => {
    setInput({ text, formula })
    setParsed(parseBandInput(text))
    setRunId(n => n + 1) // nova análise zera as respostas
    setView('analysis')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = (clear = false) => {
    if (clear) setInput({ text: '', formula: '' })
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md shadow-sm border-b border-white/40 dark:bg-slate-900/75 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center gap-4">
            <button type="button" onClick={() => goHome()} className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                <svg viewBox="0 0 64 64" className="w-7 h-7" aria-hidden="true">
                  <path d="M4 18 H13 L16 40 L19 18 H27 L30 30 L33 18 H40 L43 50 L46 18 H60" fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent leading-none">IRIS</h1>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-1">Infrared Interpretation System</p>
              </div>
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {view === 'home' && <HomeScreen key={input.text + input.formula} initialText={input.text} initialFormula={input.formula} onAnalyze={handleAnalyze} />}
        {view === 'analysis' && (
          <AnalysisScreen
            key={runId}
            bands={parsed.bands}
            ignored={parsed.ignored}
            formula={input.formula}
            onEdit={() => goHome()}
            onRestart={() => goHome(true)}
          />
        )}
      </main>

      <footer className="bg-gray-900 text-white py-10 px-4 mt-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">IRIS</h3>
            <p className="text-gray-400 text-sm">
              Ferramenta didática para interpretação de espectros de infravermelho: das bandas às ligações, dos grupos funcionais à classe provável do composto.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3">Referência</h4>
            <p className="text-gray-400 text-sm">
              Lopes, W. A.; Fascio, M. Esquema para interpretação de espectros de substâncias orgânicas na região do infravermelho. <i>Quím. Nova</i> 2004, 27, 670–673.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-3">Sobre o autor</h4>
            <div className="flex items-center space-x-4">
              <img src="https://github.com/vieira86.png" alt="Rafael Vieira" className="w-14 h-14 rounded-full border-2 border-purple-500 shadow-lg" />
              <div>
                <p className="font-semibold text-white">Prof. Rafael Vieira</p>
                <p className="text-sm text-gray-400">Química · IFRO</p>
                <p className="text-sm text-gray-400">rafael.vieira@ifro.edu.br</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">© 2026 IRIS — O IV fornece evidências, não identificações definitivas.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
