import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = true }) {
    if (!open) return null
    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onCancel}>
            <div className="modal" style={{ maxWidth: 400, padding: '28px 32px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: danger ? '#FEF2F2' : '#FFF7ED',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <AlertTriangle size={20} color={danger ? '#EF4444' : '#F59E0B'} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0A0F1E', marginBottom: 6 }}>
                            {title ?? 'Confirmer l\'action'}
                        </div>
                        <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>
                            {message ?? 'Cette action est irréversible.'}
                        </div>
                    </div>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2, display: 'flex', flexShrink: 0 }}>
                        <X size={16} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onCancel}>Annuler</button>
                    <button
                        className={`btn ${danger ? 'btn-danger' : 'btn-amber'}`}
                        style={danger ? { background: '#EF4444', color: '#fff', border: 'none' } : {}}
                        onClick={() => { onConfirm(); onCancel() }}
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    )
}
