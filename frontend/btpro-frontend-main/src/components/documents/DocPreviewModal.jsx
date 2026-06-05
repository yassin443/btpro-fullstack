import { useRef, useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { getDocHTMLAsync } from './printDoc'

export default function DocPreviewModal({ type, doc, cabinet, client, onClose }) {
    const iframeRef = useRef(null)
    const [html, setHtml] = useState('')

    useEffect(() => {
        getDocHTMLAsync(type, doc, cabinet || {}, client || null).then(setHtml)
    }, [type, doc, cabinet, client])

    const handleDownload = () => {
        const iframe = iframeRef.current
        if (!iframe) return
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 400,
            display: 'flex', flexDirection: 'column',
            background: 'rgba(15,14,12,0.75)',
            backdropFilter: 'blur(4px)',
        }}>
            {/* Toolbar */}
            <div style={{
                flexShrink: 0, height: 56,
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '0 24px',
                background: '#111110',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
                <div style={{ flex: 1, fontFamily: '"Geist Mono", monospace', fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
                    {doc?.numero || '—'}
                    <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.25)' }}>{type?.toUpperCase()}</span>
                </div>
                <button
                    onClick={handleDownload}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        height: 34, padding: '0 16px', borderRadius: 6,
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        fontSize: 13, fontWeight: 600,
                        background: 'oklch(0.55 0.16 252)',
                        color: 'white',
                    }}
                >
                    <Download size={14} /> Télécharger PDF
                </button>
                <button
                    onClick={onClose}
                    style={{
                        width: 34, height: 34, borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.06)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0.6)',
                    }}
                >
                    <X size={15} />
                </button>
            </div>

            {/* Document preview */}
            <div style={{
                flex: 1, overflow: 'auto',
                background: '#ECEAE3',
                display: 'flex', justifyContent: 'center',
                padding: '32px 16px',
            }}>
                <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        border: 'none',
                        display: 'block',
                        background: 'white',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                    }}
                    title={doc?.numero || 'document'}
                />
            </div>
        </div>
    )
}
