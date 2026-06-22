import { X, Pencil as EditIcon, Trash2 as TrashIcon } from "lucide-react";
import { BRAND_COLOR, ETATS } from "../data.js";

export function Tag({ children, color, outline }) {
  return (
    <span
      className="tag"
      style={
        outline
          ? { color, borderColor: color, background: "transparent" }
          : { background: color, color: "#fff" }
      }
    >
      {children}
    </span>
  );
}

export function IconBtn({ icon, onClick, title, danger }) {
  const Icon = icon;
  return (
    <button
      type="button"
      className={"icon-btn" + (danger ? " icon-btn-danger" : "")}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <Icon size={15} />
    </button>
  );
}

export function EmptyState({ icon, title, text, actionLabel, onAction }) {
  const Icon = icon;
  return (
    <div className="empty-state">
      <Icon size={32} strokeWidth={1.5} />
      <h3>{title}</h3>
      <p>{text}</p>
      {actionLabel && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, width }) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-panel"
        style={width ? { maxWidth: width } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <IconBtn icon={X} onClick={onClose} title="Fermer" />
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function FeutreCap({ hex, brand, size }) {
  const s = size || 56;
  return (
    <div className="cap-wrap" style={{ width: s, height: s }}>
      <div
        className="cap-top"
        style={{
          background:
            hex ||
            "repeating-linear-gradient(45deg, #d8dbd9 0 5px, #eceeec 5px 10px)",
        }}
      >
        {!hex && <span className="cap-unknown">?</span>}
        <span className="cap-shine" />
      </div>
      <div className="cap-band" style={{ background: brand }} />
    </div>
  );
}

export function FeutreCard({ f, onEdit, onDelete }) {
  const brand = BRAND_COLOR[f.marque] || BRAND_COLOR.Autre;
  const etat = ETATS[f.etat] || ETATS.fonctionne;
  return (
    <div className="feutre-card">
      <FeutreCap hex={f.hex} brand={brand} />
      <div className="feutre-num mono">{f.numero || "—"}</div>
      <div className="feutre-info">
        <div className="feutre-marque" style={{ color: brand }}>
          {f.marque}
        </div>
        <div className="feutre-pack">{f.pack || "Pack non renseigné"}</div>
        {f.nom && <div className="feutre-nom">{f.nom}</div>}
        <div className="feutre-tags">
          {f.quantite > 1 && <Tag color="#7C5CBF">×{f.quantite}</Tag>}
          {f.etat !== "fonctionne" && (
            <Tag color={etat.color}>{etat.label}</Tag>
          )}
        </div>
      </div>
      {(onEdit || onDelete) && (
        <div className="feutre-actions">
          {onEdit && (
            <IconBtn
              icon={EditIcon}
              onClick={() => onEdit(f)}
              title="Modifier"
            />
          )}
          {onDelete && (
            <IconBtn
              icon={TrashIcon}
              onClick={() => onDelete(f)}
              title="Supprimer"
              danger
            />
          )}
        </div>
      )}
    </div>
  );
}

export function Spinner({ size = 28 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}
