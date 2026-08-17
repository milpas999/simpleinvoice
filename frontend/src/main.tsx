import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext'
import { InvoiceProvider } from '@/context/InvoiceContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <InvoiceProvider>
          <App />
          <Toaster position="top-right" />
        </InvoiceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
