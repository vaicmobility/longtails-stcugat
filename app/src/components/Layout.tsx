import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './Auth'
import { TitolPrograma } from './Marca'

export function Layout({ children }: { children: ReactNode }) {
  const { session, admin } = useAuth()
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/botiga" style={{ textDecoration: 'none', maxWidth: 360 }}><TitolPrograma /></Link>
        <nav>
          <NavLink to="/botiga" end>Cessions</NavLink>
          <NavLink to="/botiga/preinscripcions">Preinscripcions</NavLink>
          {admin ? <NavLink to="/botiga/nova" className="btn primary small">+ Nou lliurament</NavLink> : <span className="pill">Mode consulta</span>}
        </nav>
        <div className="user">
          <span className="muted">{session?.user.email}</span>
          <button className="btn ghost small" onClick={() => supabase.auth.signOut()}>Sortir</button>
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  )
}

export function Steps({ steps, actual, onGo }: { steps: string[]; actual: number; onGo: (i: number) => void }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s} className={i === actual ? 'on' : i < actual ? 'done' : ''}>
          <button type="button" onClick={() => i < actual && onGo(i)} disabled={i > actual}>
            <span className="num">{i < actual ? '✓' : i + 1}</span>
            <span className="txt">{s}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

export function Fotos({ fotos, onChange }: { fotos: File[]; onChange: (f: File[]) => void }) {
  return (
    <div className="fotos">
      <div className="fotos-grid">
        {fotos.map((f, i) => (
          <div className="foto" key={i}>
            <img src={URL.createObjectURL(f)} alt={`Foto ${i + 1}`} />
            <button type="button" className="x" aria-label="Treure foto" onClick={() => onChange(fotos.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <label className="foto add">
          <input type="file" accept="image/*" capture="environment" multiple hidden
            onChange={(e) => { onChange([...fotos, ...Array.from(e.target.files ?? [])]); e.target.value = '' }} />
          <span>+ Foto</span>
        </label>
      </div>
    </div>
  )
}
