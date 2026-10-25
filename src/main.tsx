import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorDeLaApp } from './components/estado/ErrorDeLaApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorDeLaApp>
      <App />
    </ErrorDeLaApp>
  </StrictMode>,
)
