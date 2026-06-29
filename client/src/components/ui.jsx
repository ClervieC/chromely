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

export function Modal({ title, onClose, children, width, accent }) {
  const headStyle = accent
    ? { background: `linear-gradient(135deg, ${accent} 0%, ${accent}bb 100%)` }
    : undefined;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-panel"
        style={width ? { maxWidth: width } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head" style={headStyle}>
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

export function SkeletonCard() {
  return (
    <div className="feutre-card skeleton-card">
      <div className="skeleton sk-cap" />
      <div className="skeleton sk-num" />
      <div className="skeleton sk-line" style={{ width: "60%", marginTop: 8 }} />
      <div className="skeleton sk-line" style={{ width: "80%", marginTop: 6 }} />
      <div className="skeleton sk-line" style={{ width: "50%", marginTop: 6 }} />
    </div>
  );
}

export function FeutreCard({ f, onEdit, onDelete }) {
  const brand = BRAND_COLOR[f.marque] || BRAND_COLOR.Autre;
  const etat = ETATS[f.etat] || ETATS.fonctionne;
  const hexTint = f.hex ? { "--card-hex-tint": `${f.hex}18` } : {};
  return (
    <div className={"feutre-card" + (f.hex ? " feutre-card-tinted" : "")} style={{ '--card-accent': brand, ...hexTint }}>
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
          <Tag color={etat.color}>{etat.label}</Tag>
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

export function FeutreGroupCard({ group, onOpenGroup }) {
  const f = group[0];
  const brand = BRAND_COLOR[f.marque] || BRAND_COLOR.Autre;
  const visible = group.slice(0, 3);
  const extra = group.length - 3;
  return (
    <div className="feutre-card" style={{ '--card-accent': brand }}>
      <FeutreCap hex={f.hex} brand={brand} />
      <div className="feutre-num mono">{f.numero || "—"}</div>
      <div className="feutre-info">
        <div className="feutre-marque" style={{ color: brand }}>{f.marque}</div>
        {f.nom && <div className="feutre-nom">{f.nom}</div>}
        <div className="feutre-pack-rows">
          {visible.map((item) => {
            const etat = ETATS[item.etat] || ETATS.fonctionne;
            return (
              <div key={item.id} className="feutre-pack-row">
                <span className="feutre-pack-row-name">{item.pack || "?"}</span>
                <div className="feutre-pack-row-right">
                  {item.quantite > 1 && <Tag color="#7C5CBF">×{item.quantite}</Tag>}
                  <Tag color={etat.color}>{etat.label}</Tag>
                </div>
              </div>
            );
          })}
          {extra > 0 && (
            <div className="feutre-pack-row-more">+{extra} autre{extra > 1 ? "s" : ""}…</div>
          )}
        </div>
      </div>
      {onOpenGroup && (
        <div className="feutre-actions">
          <IconBtn icon={EditIcon} onClick={() => onOpenGroup(group)} title="Modifier" />
        </div>
      )}
    </div>
  );
}

export function GroupModal({ group, onClose, onEdit, onDelete }) {
  const f = group[0];
  const brand = BRAND_COLOR[f.marque] || BRAND_COLOR.Autre;
  return (
    <Modal
      title={`n°${f.numero || "?"} — ${f.marque}${f.nom ? ` · ${f.nom}` : ""}`}
      onClose={onClose}
      width={480}
      accent={brand}
    >
      <div className="group-modal-list">
        {group.map((item) => {
          const etat = ETATS[item.etat] || ETATS.fonctionne;
          const itemBrand = BRAND_COLOR[item.marque] || BRAND_COLOR.Autre;
          return (
            <div key={item.id} className="group-modal-row">
              <FeutreCap hex={item.hex} brand={itemBrand} size={40} />
              <div className="group-modal-info">
                <div className="group-modal-pack">{item.pack || "Pack non renseigné"}</div>
                <div className="group-modal-tags">
                  {item.quantite > 1 && <Tag color="#7C5CBF">×{item.quantite}</Tag>}
                  <Tag color={etat.color}>{etat.label}</Tag>
                </div>
              </div>
              <div className="group-modal-actions">
                <IconBtn icon={EditIcon} onClick={() => onEdit(item)} title="Modifier" />
                <IconBtn icon={TrashIcon} onClick={() => onDelete(item)} title="Supprimer" danger />
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export function Spinner({ size = 28 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}
