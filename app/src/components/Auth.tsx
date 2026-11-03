import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { esAdmin } from '../lib/api'
import { supabase } from '../lib/supabase'

type Ctx = { session: Session | null; admin: boolean; carregant: boolean }
const AuthCtx = createContext<Ctx>({ session: null, admin: false, carregant: true })
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ session: null, admin: false, carregant: true })

  useEffect(() => {
    const update = async (session: Session | null) => {
      const admin = session ? await esAdmin(session.user.id) : false
      setState({ session, admin, carregant: false })
    }
    supabase.auth.getSession().then(({ data }) => update(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => update(session), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviant, setEnviant] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviant(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('No s\'ha pogut entrar. Revisa el correu i la contrasenya.')
    setEnviant(false)
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={entrar}>
        <div className="brand big">VAIC <span>Cessions</span></div>
        <p className="muted">Accés per al personal de botiga. Fes servir el mateix usuari que a l'app VAIC Renting.</p>
        <label>Correu electrònic<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Contrasenya<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error ? <div className="alert error">{error}</div> : null}
        <button className="btn primary" disabled={enviant}>{enviant ? 'Entrant…' : 'Entrar'}</button>
      </form>
    </div>
  )
}

export function RequireStaff({ children }: { children: ReactNode }) {
  const { session, admin, carregant } = useAuth()
  if (carregant) return <div className="center muted">Carregant…</div>
  if (!session) return <Login />
  if (!admin)
    return (
      <div className="login">
        <div className="card login-card">
          <h2>Sense permisos</h2>
          <p>L'usuari {session.user.email} no té rol d'administrador a VAIC Renting.</p>
          <button className="btn" onClick={() => supabase.auth.signOut()}>Sortir</button>
        </div>
      </div>
    )
  return <>{children}</>
}
