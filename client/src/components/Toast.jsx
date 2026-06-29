import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "info", { onUndo, duration = 4000 } = {}) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type, onUndo }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  function dismiss(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const toast = {
    success: (msg, opts) => push(msg, "success", opts),
    error: (msg, opts) => push(msg, "error", opts),
    info: (msg, opts) => push(msg, "info", opts),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div className={`toast toast-${t.type}`} key={t.id}>
            {t.type === "success" && <CheckCircle2 size={16} />}
            {t.type === "error" && <XCircle size={16} />}
            {t.type === "info" && <Info size={16} />}
            <span>{t.message}</span>
            {t.onUndo && (
              <button
                className="toast-undo-btn"
                onClick={() => { t.onUndo(); dismiss(t.id); }}
              >
                Annuler
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx)
    throw new Error("useToast doit être utilisé à l'intérieur de ToastProvider");
  return ctx;
}
