import type { ReactNode } from 'react'
import {
  ANNEX_II_CLAUSULES, ANNEX_I_MANIFESTACIONS, CLAUSULA_DADES_AJUNTAMENT, POLITICA_PRIVACITAT, annexIII, type Seccio,
} from '../lib/textos'

const caixa: React.CSSProperties = {
  maxHeight: 320, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10,
  padding: '.8rem 1rem', background: '#fff', fontSize: '.9rem', lineHeight: 1.45,
}

export function Seccions({ seccions }: { seccions: Seccio[] }) {
  return (
    <>
      {seccions.map((s) => (
        <div key={s.titol} style={{ marginBottom: '.8rem' }}>
          <strong>{s.titol}</strong>
          {s.paras?.map((p, i) => <p key={i} style={{ margin: '.3rem 0' }}>{p}</p>)}
          {s.items?.length ? <ul style={{ margin: '.3rem 0', paddingLeft: '1.2rem' }}>{s.items.map((t, i) => <li key={i}>{t}</li>)}</ul> : null}
          {s.despres?.map((p, i) => <p key={i} style={{ margin: '.3rem 0' }}>{p}</p>)}
        </div>
      ))}
    </>
  )
}

/** Text amb les URL convertides en enllaços. */
export function AmbEnllacos({ text }: { text: string }) {
  return <>{text.split(/(https?:\/\/[^\s,]+)/g).map((t, i) => (i % 2 ? <a key={i} href={t} target="_blank" rel="noreferrer">{t}</a> : t))}</>
}

/** Bloc desplegable amb un text íntegre per llegir. */
export function Text({ titol, obert, children }: { titol: string; obert?: boolean; children: ReactNode }) {
  return (
    <details open={obert} style={{ marginBottom: '.6rem' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '.4rem 0' }}>{titol}</summary>
      <div style={caixa}>{children}</div>
    </details>
  )
}

export const TextPrivacitat = ({ obert }: { obert?: boolean }) => (
  <Text titol="Política de privacitat i protecció de dades" obert={obert}><Seccions seccions={POLITICA_PRIVACITAT} /></Text>
)

export const TextAnnexI = ({ obert }: { obert?: boolean }) => (
  <Text titol="Annex I · Manifestacions de l'acta de lliurament" obert={obert}>
    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
      {ANNEX_I_MANIFESTACIONS.map((m, i) => (
        <li key={i} style={{ marginBottom: '.5rem' }}>
          {m.text}
          {m.detalls?.map((d, j) => <p key={j} style={{ margin: '.3rem 0 0' }}><AmbEnllacos text={d} /></p>)}
        </li>
      ))}
    </ul>
  </Text>
)

export const TextAnnexII = ({ obert }: { obert?: boolean }) => (
  <Text titol="Annex II · Condicions de l'acta de devolució" obert={obert}>
    {ANNEX_II_CLAUSULES.map((t, i) => <p key={i} style={{ margin: i ? '.5rem 0 0' : 0 }}>{t}</p>)}
  </Text>
)

export const TextAnnexIII = ({ obert }: { obert?: boolean }) => (
  <Text titol="Annex III · Protocol operatiu mínim d'incidències i sinistres" obert={obert}><Seccions seccions={annexIII()} /></Text>
)

export const TextDadesAjuntament = ({ obert }: { obert?: boolean }) => (
  <Text titol="Informació sobre protecció de dades de l'Ajuntament" obert={obert}><p style={{ margin: 0 }}>{CLAUSULA_DADES_AJUNTAMENT}</p></Text>
)
