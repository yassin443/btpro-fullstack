import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import useToast from '../store/useToast'

const STYLES = {
    success: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', icon: CheckCircle, iconColor: '#10B981' },
    error:   { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: XCircle,     iconColor: '#EF4444' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: AlertCircle, iconColor: '#3B82F6' },
}

export default function Toaster() {
    const { toasts, dismiss } = useToast()
    if (!toasts.length) return null
    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
            {toasts.map(t => {
                const s = STYLES[t.type] || STYLES.success
                const Icon = s.icon
                return (
                    <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: s.bg, border: `1.5px solid ${s.border}`,
                        borderRadius: 12, padding: '12px 16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                        minWidth: 280, maxWidth: 380,
                        animation: 'slideInToast 0.25s ease',
                        pointerEvents: 'all',
                    }}>
                        <Icon size={16} color={s.iconColor} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: s.color, lineHeight: 1.4 }}>{t.message}</span>
                        <button onClick={() => dismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, opacity: 0.5, padding: 2, display: 'flex', flexShrink: 0 }}>
                            <X size={14} />
                        </button>
                    </div>
                )
            })}
            <style>{`@keyframes slideInToast { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
        </div>
    )
}
