"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
    warning: (msg: string) => void
    info: (msg: string) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS = {
  success: <CheckCircle2 size={15} />,
  error: <XCircle size={15} />,
  warning: <AlertTriangle size={15} />,
  info: <Info size={15} />,
}

// Accent colours derived from the app's design tokens
const ACCENTS: Record<ToastType, { border: string; icon: string; bar: string }> = {
  success: { border: "rgba(52,211,153,0.35)", icon: "hsl(158 64% 52%)",  bar: "hsl(158 64% 52%)" },
  error:   { border: "rgba(239,68,68,0.35)",  icon: "#ef4444",            bar: "#ef4444" },
  warning: { border: "rgba(245,158,11,0.35)", icon: "#f59e0b",            bar: "#f59e0b" },
  info:    { border: "rgba(99,102,241,0.35)", icon: "#818cf8",            bar: "#818cf8" },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(100)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const a = ACCENTS[toast.type]
  const DURATION = 3800

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10)

    // shrink the progress bar
    const start = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start
      setWidth(Math.max(0, 100 - (elapsed / DURATION) * 100))
    }, 30)

    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 280)
    }, DURATION)

    return () => {
      clearTimeout(show)
      clearTimeout(hide)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [toast.id, onRemove])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => onRemove(toast.id), 280)
  }

  return (
    <div
      onClick={dismiss}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.7rem 0.9rem",
        background: "hsl(160 25% 10% / 0.97)",
        border: `1px solid ${a.border}`,
        borderRadius: "0.65rem",
        boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
        backdropFilter: "blur(14px)",
        cursor: "pointer",
        maxWidth: "340px",
        width: "100%",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(6px) scale(0.97)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        userSelect: "none",
      }}
    >
      {/* left accent bar */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: a.bar,
          borderRadius: "0.65rem 0 0 0.65rem",
        }}
      />

      <span style={{ color: a.icon, flexShrink: 0, marginLeft: "0.35rem" }}>
        {ICONS[toast.type]}
      </span>

      <span
        style={{
          color: "hsl(150 20% 92%)",
          fontSize: "0.85rem",
          fontWeight: 500,
          lineHeight: 1.45,
          flex: 1,
        }}
      >
        {toast.message}
      </span>

      <X size={12} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />

      {/* progress bar */}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "2px",
          width: `${width}%`,
          background: a.bar,
          opacity: 0.5,
          transition: "width 0.03s linear",
        }}
      />
    </div>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "0.45rem",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((prev) => [...prev.slice(-4), { id, type, message }])
  }, [])

  const toast = {
    success: (msg: string) => show(msg, "success"),
    error:   (msg: string) => show(msg, "error"),
    warning: (msg: string) => show(msg, "warning"),
    info:    (msg: string) => show(msg, "info"),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx.toast
}
