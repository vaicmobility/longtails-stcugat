import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, RequireAdmin, RequireStaff } from './components/Auth'
import { Layout } from './components/Layout'
import { Peu } from './components/Peu'
import './index.css'
import { Cessions } from './pages/Cessions'
import { Detall } from './pages/Detall'
import { DocumentsPrograma } from './pages/DocumentsPrograma'
import { Inscripcio } from './pages/Inscripcio'
import { Lliurament } from './pages/Lliurament'
import { Portal } from './pages/Portal'
import { Preinscripcions } from './pages/Preinscripcions'
import { Retorn } from './pages/Retorn'

const Botiga = ({ children }: { children: React.ReactNode }) => (
  <RequireStaff><Layout>{children}</Layout></RequireStaff>
)
const NomesAdmin = ({ children }: { children: React.ReactNode }) => (
  <Botiga><RequireAdmin>{children}</RequireAdmin></Botiga>
)

/** Enllaços antics a /portal: porten a l'arrel conservant ?query i #hash (enllaços d'accés per correu). */
const AntigaPortal = () => {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: '/', search, hash }} replace />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Routes>
          {/* Portal de les persones usuàries: és la pàgina principal */}
          <Route path="/" element={<Portal />} />
          <Route path="/botiga" element={<Botiga><Cessions /></Botiga>} />
          <Route path="/botiga/nova" element={<NomesAdmin><Lliurament /></NomesAdmin>} />
          <Route path="/botiga/retorn/:id" element={<NomesAdmin><Retorn /></NomesAdmin>} />
          <Route path="/botiga/cessio/:id" element={<Botiga><Detall /></Botiga>} />
          <Route path="/botiga/preinscripcions" element={<Botiga><Preinscripcions /></Botiga>} />
          <Route path="/botiga/documentacio" element={<NomesAdmin><DocumentsPrograma /></NomesAdmin>} />
          {/* Públic, sense login */}
          <Route path="/inscripcio" element={<Inscripcio />} />
          <Route path="/portal" element={<AntigaPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Peu />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
