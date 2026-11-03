import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, RequireAdmin, RequireStaff } from './components/Auth'
import { Layout } from './components/Layout'
import './index.css'
import { Cessions } from './pages/Cessions'
import { Detall } from './pages/Detall'
import { Inscripcio } from './pages/Inscripcio'
import { Lliurament } from './pages/Lliurament'
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
          <Route path="/botiga/preinscripcions" element={<NomesAdmin><Preinscripcions /></NomesAdmin>} />
          {/* Públic, sense login */}
          <Route path="/inscripcio" element={<Inscripcio />} />
          {/* Pròximament: /c/:token portal d'usuaris */}
          <Route path="*" element={<Navigate to="/botiga" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
