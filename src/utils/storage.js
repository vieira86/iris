// Preferências simples do usuário (tema). Falhas de localStorage são ignoradas.
const THEME_KEY = 'iris-theme'

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignora (modo privado, quota etc.)
  }
}
