import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, RequireAdmin, RequireStaff } from './components/Auth'
import { Layout } from './components/Layout'
import { Peu } from './components/Peu'
import './index.css'
import { Cessions } from './pages/Cessions'
import { Detall } from './pages/Detall'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/botiga" replace />} />
          <Route path="/botiga" element={<Botiga><Cessions /></Botiga>} />
          <Route path="/botiga/nova" element={<NomesAdmin><Lliurament /></NomesAdmin>} />
          <Route path="/botiga/retorn/:id" element={<NomesAdmin><Retorn /></NomesAdmin>} />
          <Route path="/botiga/cessio/:id" element={<Botiga><Detall /></Botiga>} />
          <Route path="/botiga/preinscripcions" element={<Botiga><Preinscripcions /></Botiga>} />
          {/* Públic, sense login */}
          <Route path="/inscripcio" element={<Inscripcio />} />
          <Route path="/portal" element={<Portal />} />
          {/* Pròximament: /c/:token portal d'usuaris */}
          <Route path="*" element={<Navigate to="/botiga" replace />} />
        </Routes>
        <Peu />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
