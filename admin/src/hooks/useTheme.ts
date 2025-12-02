import {useEffect} from 'react'

export function useTheme(theme: 'light' | 'dark') {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
}
