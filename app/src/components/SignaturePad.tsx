import { useEffect, useRef, useState } from 'react'
import SignaturePadLib from 'signature_pad'

type Props = { label: string; sublabel?: string; value: string | null; onChange: (v: string | null) => void }

/** Zona per signar amb el dit (o el ratolí). Retorna un PNG en base64. */
export function SignaturePad({ label, sublabel, value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [buida, setBuida] = useState(!value)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const canvas = canvasRef.current!
    const pad = new SignaturePadLib(canvas, { penColor: '#13224f', minWidth: 1.2, maxWidth: 3, backgroundColor: 'rgba(0,0,0,0)' })
    padRef.current = pad
    const resize = () => {
      const data = pad.isEmpty() ? null : pad.toData()
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')!.scale(ratio, ratio)
      pad.clear()
      if (data) pad.fromData(data)
      else if (value) pad.fromDataURL(value, { width: canvas.offsetWidth, height: canvas.offsetHeight })
    }
    resize()
    window.addEventListener('resize', resize)
    pad.addEventListener('endStroke', () => {
      setBuida(false)
      onChangeRef.current(pad.toDataURL('image/png'))
    })
    return () => {
      window.removeEventListener('resize', resize)
      pad.off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const esborrar = () => {
    padRef.current?.clear()
    setBuida(true)
    onChange(null)
  }

  return (
    <div className="sig">
      <div className="sig-head">
        <div>
          <strong>{label}</strong>
          {sublabel ? <div className="muted">{sublabel}</div> : null}
        </div>
        <button type="button" className="btn ghost small" onClick={esborrar} disabled={buida}>Esborrar</button>
      </div>
      <canvas ref={canvasRef} className="sig-canvas" />
      {buida ? <div className="sig-hint">Signeu aquí amb el dit</div> : null}
    </div>
  )
}
