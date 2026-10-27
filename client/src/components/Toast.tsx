import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toasts: Toast[];
    remove: (id: string) => void;
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        warning: (message: string) => void;
        info: (message: string) => void;
    };
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const ICONS = {
    success: <CheckCircle2 size={16} />,
    error: <XCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    info: <Info size={16} />,
};

const COLORS = {
    success: { border: 'rgba(18,184,76,0.4)', icon: '#12b84c', glow: 'rgba(18,184,76,0.12)' },
    error:   { border: 'rgba(239,68,68,0.4)',  icon: '#ef4444', glow: 'rgba(239,68,68,0.12)' },
    warning: { border: 'rgba(245,158,11,0.4)', icon: '#f59e0b', glow: 'rgba(245,158,11,0.12)' },
    info:    { border: 'rgba(99,102,241,0.4)', icon: '#818cf8', glow: 'rgba(99,102,241,0.12)' },
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const [visible, setVisible] = useState(false);
    const c = COLORS[toast.type];

    useEffect(() => {
        const show = setTimeout(() => setVisible(true), 10);
        const hide = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
        }, 3500);
        return () => { clearTimeout(show); clearTimeout(hide); };
    }, [toast.id, onRemove]);

    return (
        <div
            onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                background: 'rgba(17,17,17,0.95)',
                border: `1px solid ${c.border}`,
                borderRadius: '0.6rem',
                boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px ${c.glow}`,
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                maxWidth: '340px',
                width: '100%',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                userSelect: 'none',
            }}
        >
            <span style={{ color: c.icon, flexShrink: 0 }}>{ICONS[toast.type]}</span>
            <span style={{ color: '#F3F4F6', fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4, flex: 1 }}>
                {toast.message}
            </span>
            <X size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        </div>
    );
}

// ── Toast Container ──────────────────────────────────────────────────────────

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            alignItems: 'flex-end',
            pointerEvents: 'none',
        }}>
            {toasts.map(t => (
                <div key={t.id} style={{ pointerEvents: 'auto' }}>
                    <ToastItem toast={t} onRemove={onRemove} />
                </div>
            ))}
        </div>
    );
}

// ── useToast hook ────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((message: string, type: ToastType = 'info') => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setToasts(prev => [...prev.slice(-4), { id, type, message }]);
    }, []);

    const toast = {
        success: (msg: string) => show(msg, 'success'),
        error:   (msg: string) => show(msg, 'error'),
        warning: (msg: string) => show(msg, 'warning'),
        info:    (msg: string) => show(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={{ toasts, remove, toast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={remove} />
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

// ── ConfirmDialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(t);
    }, []);

    const confirmColor = danger ? '#ef4444' : '#12b84c';
    const confirmHover = danger ? 'rgba(239,68,68,0.15)' : 'rgba(18,184,76,0.15)';

    return (
        <div
            onClick={onCancel}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9998, padding: '1rem',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.875rem',
                    padding: '1.5rem',
                    maxWidth: '380px',
                    width: '100%',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
                    transform: visible ? 'scale(1)' : 'scale(0.95)',
                    transition: 'transform 0.2s ease',
                }}
            >
                <p style={{
                    color: '#F3F4F6',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    marginBottom: '1.25rem',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: '#9CA3AF',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${confirmColor}`,
                            background: confirmHover,
                            color: confirmColor,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── useConfirm hook ──────────────────────────────────────────────────────────

interface ConfirmOptions {
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

export function useConfirm() {
    const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setDialog({ ...options, resolve });
        });
    }, []);

    const handleConfirm = () => { dialog?.resolve(true);  setDialog(null); };
    const handleCancel  = () => { dialog?.resolve(false); setDialog(null); };

    const ConfirmUI = dialog ? (
        <ConfirmDialog
            message={dialog.message}
            confirmLabel={dialog.confirmLabel}
            cancelLabel={dialog.cancelLabel}
            danger={dialog.danger}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    ) : null;

    return { confirm, ConfirmUI };
}
