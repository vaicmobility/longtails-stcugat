import { useEffect, useRef } from 'react'
import { netejarHtml } from '../lib/documents'

/** Editor de text amb format bàsic (negreta, cursiva, títols, llistes, enllaços). Desa HTML net. */
export function EditorText({ valor, onChange }: { valor: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = netejarHtml(valor) // mai s'injecta HTML sense netejar
    // només en carregar un altre text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const actualitzar = () => onChange(ref.current?.innerHTML ?? '')
  const ordre = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    actualitzar()
  }
  const enllac = () => {
    const url = window.prompt('Adreça de l\'enllaç (https://…, mailto:… o tel:…)')
    if (url && /^(https?:|mailto:|tel:)/i.test(url.trim())) ordre('createLink', url.trim())
  }

  const B = ({ t, title, on, st }: { t: string; title: string; on: () => void; st?: React.CSSProperties }) => (
    <button type="button" className="btn ghost small" title={title} style={st} onMouseDown={(e) => { e.preventDefault(); on() }}>{t}</button>
  )

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, background: '#fff' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.15rem', padding: '.3rem', borderBottom: '1px solid var(--line)' }}>
        <B t="B" title="Negreta" st={{ fontWeight: 800 }} on={() => ordre('bold')} />
        <B t="I" title="Cursiva" st={{ fontStyle: 'italic', fontFamily: 'Georgia, serif' }} on={() => ordre('italic')} />
        <B t="U" title="Subratllat" st={{ textDecoration: 'underline' }} on={() => ordre('underline')} />
        <B t="Títol" title="Títol de secció" on={() => ordre('formatBlock', 'h3')} />
        <B t="Subtítol" title="Subtítol" on={() => ordre('formatBlock', 'h4')} />
        <B t="Paràgraf" title="Text normal" on={() => ordre('formatBlock', 'p')} />
        <B t="• Llista" title="Llista de punts" on={() => ordre('insertUnorderedList')} />
        <B t="1. Llista" title="Llista numerada" on={() => ordre('insertOrderedList')} />
        <B t="Enllaç" title="Afegir enllaç" on={enllac} />
        <B t="Treure format" title="Treure el format del text seleccionat" on={() => ordre('removeFormat')} />
      </div>
      <div
        ref={ref}
        className="text-doc"
        contentEditable
        suppressContentEditableWarning
        onInput={actualitzar}
        onBlur={actualitzar}
        onPaste={(e) => {
          e.preventDefault()
          const html = e.clipboardData.getData('text/html')
          const text = e.clipboardData.getData('text/plain')
          const net = html ? netejarHtml(html) : text.split(/\n{2,}/).map((p) => `<p>${p.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!)).replace(/\n/g, '<br>')}</p>`).join('')
          document.execCommand('insertHTML', false, net)
          actualitzar()
        }}
        style={{ minHeight: 260, maxHeight: '60vh', overflow: 'auto', padding: '.8rem 1rem', outline: 'none' }}
      />
    </div>
  )
}
