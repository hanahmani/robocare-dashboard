import { createContext, useContext, useEffect, useState } from 'react'
import { ConfigProvider, theme as antTheme } from 'antd'

const ThemeCtx = createContext({ dark: false, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('rc-theme') === 'dark')

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('rc-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('rc-theme', 'light')
    }
  }, [dark])

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      <ConfigProvider
        theme={{
          algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#185FA5',
            borderRadius: 8,
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)
