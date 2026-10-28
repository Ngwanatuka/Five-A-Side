import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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

const ACCENTS = {
    success: { border: 'rgba(52,211,153,0.35)', icon: 'hsl(158 64% 52%)', bar: 'hsl(158 64% 52%)' },
    error:   { border: 'rgba(239,68,68,0.35)', icon: '#ef4444', bar: '#ef4444' },
    warning: { border: 'rgba(245,158,11,0.35)', icon: '#f59e0b', bar: '#f59e0b' },
    info:    { border: 'rgba(99,102,241,0.35)', icon: '#818cf8', bar: '#818cf8' },
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const [visible, setVisible] = useState(false);
    const [width, setWidth] = useState(100);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const accent = ACCENTS[toast.type];
    const duration = 3800;

    useEffect(() => {
        const show = setTimeout(() => setVisible(true), 10);
        const start = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            setWidth(Math.max(0, 100 - (elapsed / duration) * 100));
        }, 30);
        const hide = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(toast.id), 280);
        }, duration);
        return () => {
            clearTimeout(show);
            clearTimeout(hide);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [toast.id, onRemove]);

    const dismiss = () => {
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 280);
    };

    return (
        <div
            onClick={dismiss}
            style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.7rem 0.9rem',
                background: 'hsl(160 25% 10% / 0.97)',
                border: `1px solid ${accent.border}`,
                borderRadius: '0.65rem',
                boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
                backdropFilter: 'blur(14px)',
                cursor: 'pointer',
                maxWidth: '340px',
                width: '100%',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                userSelect: 'none',
            }}
        >
            <span style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                background: accent.bar,
                borderRadius: '0.65rem 0 0 0.65rem',
            }} />
            <span style={{ color: accent.icon, flexShrink: 0, marginLeft: '0.35rem' }}>{ICONS[toast.type]}</span>
            <span style={{ color: 'hsl(150 20% 92%)', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.45, flex: 1 }}>
                {toast.message}
            </span>
            <X size={12} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            <span style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                width: `${width}%`,
                background: accent.bar,
                opacity: 0.5,
                transition: 'width 0.03s linear',
            }} />
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
            gap: '0.45rem',
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
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(t);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onCancel]);

    const accent = danger
        ? { border: 'rgba(239,68,68,0.35)', icon: '#ef4444', bar: '#ef4444' }
        : { border: 'rgba(245,158,11,0.35)', icon: '#f59e0b', bar: '#f59e0b' };
    const confirmColor = danger ? '#ef4444' : 'hsl(158 64% 52%)';
    const confirmBackground = danger ? 'rgba(239,68,68,0.12)' : 'rgba(52,211,153,0.12)';

    return (
        <div
            onClick={onCancel}
            role="presentation"
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9998, padding: '1rem',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.2s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Confirmation"
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'hsl(160 25% 10% / 0.97)',
                    border: `1px solid ${accent.border}`,
                    borderRadius: '0.75rem',
                    padding: '1.25rem 1.35rem 1rem',
                    maxWidth: '380px',
                    width: '100%',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(14px)',
                    transform: visible ? 'scale(1)' : 'scale(0.95)',
                    transition: 'transform 0.2s ease',
                }}
            >
                <span style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    background: accent.bar,
                }} />
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    color: 'hsl(150 20% 92%)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    margin: '0 0 1.25rem',
                    paddingLeft: '0.35rem',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    <AlertTriangle size={17} style={{ color: accent.icon, flexShrink: 0, marginTop: '0.1rem' }} />
                    {message}
                </div>
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '0.5rem 0.85rem',
                            borderRadius: '0.55rem',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'hsl(150 20% 82%)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        autoFocus
                        style={{
                            padding: '0.5rem 0.85rem',
                            borderRadius: '0.55rem',
                            border: `1px solid ${accent.border}`,
                            background: confirmBackground,
                            color: confirmColor,
                            fontSize: '0.85rem',
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

    const handleConfirm = useCallback(() => {
        setDialog(current => {
            current?.resolve(true);
            return null;
        });
    }, []);
    const handleCancel = useCallback(() => {
        setDialog(current => {
            current?.resolve(false);
            return null;
        });
    }, []);

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
