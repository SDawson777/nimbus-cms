import React from 'react'
import {BrowserRouter} from 'react-router-dom'
import {ThemeProvider} from './theme/ThemeProvider'
import RootLayout from './layout/RootLayout'
import RoutesView from './routes'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <RootLayout>
          <RoutesView />
        </RootLayout>
      </BrowserRouter>
    </ThemeProvider>
  )
}
