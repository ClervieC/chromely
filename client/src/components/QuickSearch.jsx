import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { BRAND_COLOR } from "../data.js";

export function useQuickSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return [open, setOpen];
}

export function QuickSearch({ onClose }) {
  const { feutres } = useData();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = q.trim()
    ? feutres
        .filter((f) => {
          const hay = [f.numero, f.nom, f.pack, f.marque].join(" ").toLowerCase();
          return hay.includes(q.toLowerCase());
        })
        .slice(0, 12)
    : [];

  useEffect(() => { setActive(0); }, [q]);

  function go(f) {
    navigate(`/stock?q=${encodeURIComponent(f.numero || f.nom || "")}&marque=${encodeURIComponent(f.marque)}`);
    onClose();
  }

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) go(results[active]);
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="qs-overlay" onMouseDown={onClose}>
      <div className="qs-panel" onMouseDown={(e) => e.stopPropagation()}>
        <div className="qs-input-row">
          <Search size={17} />
          <input
            ref={inputRef}
            className="qs-input"
            placeholder="Rechercher un feutre, numéro, pack…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
          />
          {q && (
            <button className="icon-btn" onClick={() => setQ("")} title="Effacer">
              <X size={14} />
            </button>
          )}
          <span className="qs-kbd">Esc</span>
        </div>

        <div className="qs-results">
          {q.trim() === "" && (
            <div className="qs-empty">Tape pour chercher dans tes {feutres.length} feutres…</div>
          )}
          {q.trim() !== "" && results.length === 0 && (
            <div className="qs-empty">Aucun résultat pour « {q} »</div>
          )}
          {results.map((f, i) => {
            const brand = BRAND_COLOR[f.marque] || BRAND_COLOR.Autre;
            return (
              <button
                key={f.id}
                className={"qs-result-item" + (i === active ? " qs-active" : "")}
                onClick={() => go(f)}
                onMouseEnter={() => setActive(i)}
              >
                <div
                  className="qs-result-dot"
                  style={{ background: f.hex || "repeating-linear-gradient(45deg,#d8dbd9 0 4px,#eceeec 4px 8px)" }}
                />
                <div className="qs-result-main">
                  <div className="qs-result-num">{f.numero || "—"}{f.nom ? ` · ${f.nom}` : ""}</div>
                  <div className="qs-result-sub">{f.pack || "Sans pack"}</div>
                </div>
                <span className="qs-result-marque" style={{ background: `${brand}18`, color: brand }}>
                  {f.marque}
                </span>
              </button>
            );
          })}
        </div>

        <div className="qs-hint">
          <span><kbd>↑↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> ouvrir</span>
          <span><kbd>Ctrl K</kbd> fermer</span>
        </div>
      </div>
    </div>
  );
}
