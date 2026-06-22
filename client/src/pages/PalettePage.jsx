import { useEffect, useMemo, useState } from "react";
import { Plus, Upload, Trash2, Palette as PaletteIcon, Send, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../api.js";
import { mergedPackNames } from "../data.js";
import { EmptyState, Modal } from "../components/ui.jsx";
import { ProposalForm } from "../components/ProposalForm.jsx";

function isDarkColor(hex) {
  if (!hex) return false;
  return (
    parseInt(hex.slice(1, 3), 16) * 0.299 +
    parseInt(hex.slice(3, 5), 16) * 0.587 +
    parseInt(hex.slice(5, 7), 16) * 0.114 < 128
  );
}

function ColorSwatch({ entry, onDelete, onPropose, onEdit, isAdmin }) {
  const hex = entry.hex || null;
  const dark = isDarkColor(hex);

  return (
    <div className="swatch-card">
      <div
        className="swatch-color"
        style={{ background: hex || "repeating-linear-gradient(45deg,#d8dbd9 0 5px,#eceeec 5px 10px)" }}
      >
        {!hex && <span className="cap-unknown">?</span>}
        {isAdmin ? (
          <div className="swatch-actions">
            <button type="button" className={"swatch-action" + (dark ? " swatch-action-light" : "")} onClick={() => onEdit(entry)} title="Modifier"><Pencil size={11} /></button>
            <button type="button" className={"swatch-action" + (dark ? " swatch-action-light" : "")} onClick={() => onDelete(entry)} title="Supprimer"><Trash2 size={11} /></button>
          </div>
        ) : (
          <button type="button" className={"swatch-action" + (dark ? " swatch-action-light" : "")} onClick={() => onPropose(entry)} title="Proposer une correction"><Send size={12} /></button>
        )}
      </div>
      <div className="swatch-info">
        <span className="swatch-num mono">{entry.numero}</span>
        {entry.nom && <span className="swatch-nom">{entry.nom}</span>}
      </div>
    </div>
  );
}

function EditSwatchModal({ entry, allMarques, packsForMarque, onClose, onSave }) {
  const [marque, setMarque] = useState(entry.marque);
  const [packs, setPacks] = useState([entry.pack]);
  const [newPack, setNewPack] = useState("");
  const [numero, setNumero] = useState(entry.numero);
  const [nom, setNom] = useState(entry.nom || "");
  const [hex, setHex] = useState(entry.hex || "#cccccc");

  const availablePacks = packsForMarque(marque);

  function togglePack(p) {
    setPacks((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function addNewPack() {
    const p = newPack.trim();
    if (!p || packs.includes(p)) return;
    setPacks((prev) => [...prev, p]);
    setNewPack("");
  }

  return (
    <Modal title="Modifier la couleur" onClose={onClose} width={500}>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Marque</span>
          <select className="input" value={marque} onChange={(e) => { setMarque(e.target.value); setPacks([]); }}>
            {allMarques.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Numéro</span>
          <input className="input mono" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex : 042" />
        </label>
        <label className="field">
          <span className="field-label">Nom (optionnel)</span>
          <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Rouge vif" />
        </label>
        <label className="field">
          <span className="field-label">Couleur</span>
          <div className="color-row">
            <input type="color" className="color-input" value={hex} onChange={(e) => setHex(e.target.value)} />
            <input className="input mono" value={hex} maxLength={7} onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setHex(e.target.value); }} placeholder="#RRGGBB" />
          </div>
        </label>
      </div>

      <div className="field" style={{ marginTop: 12 }}>
        <span className="field-label">Packs concernés</span>
        {availablePacks.length > 0 && (
          <div className="pack-checkbox-list">
            {availablePacks.map((p) => (
              <label key={p} className="checkbox-row">
                <input type="checkbox" checked={packs.includes(p)} onChange={() => togglePack(p)} />
                <span>{p}</span>
              </label>
            ))}
          </div>
        )}
        <div className="palette-add-row" style={{ marginTop: 8 }}>
          <input
            className="input"
            value={newPack}
            onChange={(e) => setNewPack(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNewPack()}
            placeholder="Ajouter un pack non listé…"
          />
          <button type="button" className="btn btn-ghost btn-small" onClick={addNewPack}>
            <Plus size={13} /> Ajouter
          </button>
        </div>
        {packs.length > 0 && (
          <div className="pack-selected-tags">
            {packs.map((p) => (
              <span key={p} className="pack-tag">
                {p}
                <button type="button" onClick={() => togglePack(p)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={packs.length === 0 || !numero.trim()}
          onClick={() => onSave({ marque, packs, numero, nom, hex })}
        >
          Enregistrer{packs.length > 1 ? ` dans ${packs.length} packs` : ""}
        </button>
      </div>
    </Modal>
  );
}

export default function PalettePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { feutres, palette, customPacks, addPaletteEntry, bulkImportPalette, removePaletteEntry } = useData();
  const toast = useToast();

  const allMarques = useMemo(() => {
    const set = new Set(["GuangNa", "Tooli-Art", "Nicety"]);
    feutres.forEach((f) => set.add(f.marque));
    palette.forEach((p) => set.add(p.marque));
    return [...set];
  }, [feutres, palette]);

  const [marque, setMarque] = useState(allMarques[0] || "GuangNa");
  const packsForMarque = useMemo(() => {
    const set = new Set(mergedPackNames(marque, customPacks));
    feutres.forEach((f) => { if (f.marque === marque && f.pack) set.add(f.pack); });
    palette.forEach((p) => { if (p.marque === marque && p.pack) set.add(p.pack); });
    return [...set];
  }, [marque, feutres, palette, customPacks]);
  const [pack, setPack] = useState(packsForMarque[0] || "");

  useEffect(() => {
    setPack((current) => current || packsForMarque[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marque]);

  const entries = useMemo(
    () =>
      palette
        .filter((p) => p.marque === marque && p.pack === pack)
        .sort((a, b) => (a.numero || "").localeCompare(b.numero || "", undefined, { numeric: true })),
    [palette, marque, pack],
  );

  const [numero, setNumero] = useState("");
  const [nom, setNom] = useState("");
  const [hex, setHex] = useState("#cccccc");

  async function handleAdd() {
    if (!numero.trim() || !pack.trim()) return;
    try {
      await addPaletteEntry({ marque, pack: pack.trim(), numero: numero.trim(), nom: nom.trim(), hex });
      toast.success("Couleur enregistrée");
      setNumero("");
      setNom("");
      setHex("#cccccc");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const [bulkText, setBulkText] = useState("");
  async function handleBulk() {
    if (!pack.trim()) return;
    try {
      const { count } = await bulkImportPalette({ marque, pack: pack.trim(), text: bulkText });
      toast.success(`${count} couleur(s) enregistrée(s)`);
      setBulkText("");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDeleteEntry(entry) {
    try {
      await removePaletteEntry(entry.id);
      toast.success("Couleur supprimée");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const [editModal, setEditModal] = useState(null);

  async function handleUpdateEntry({ marque, packs, numero, nom, hex }) {
    try {
      await Promise.all(
        packs.map((pack) => addPaletteEntry({ marque, pack, numero, nom, hex }))
      );
      toast.success(packs.length > 1 ? `Couleur enregistrée dans ${packs.length} packs` : "Couleur mise à jour");
      setEditModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  function packsForMarqueOf(m) {
    const set = new Set(mergedPackNames(m, customPacks));
    feutres.forEach((f) => { if (f.marque === m && f.pack) set.add(f.pack); });
    palette.forEach((p) => { if (p.marque === m && p.pack) set.add(p.pack); });
    return [...set];
  }

  const [proposeModal, setProposeModal] = useState(null);
  async function handleSubmitProposal(values) {
    try {
      await api.createProposal(values);
      toast.success("Proposition envoyée à l'admin pour validation");
      setProposeModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">Palette de couleurs</h2>
        <p className="view-sub">
          {isAdmin
            ? "La couleur réelle de chaque numéro, partagée avec tous les utilisateurs."
            : "La couleur réelle de chaque numéro. Tu peux proposer une correction si une couleur est manquante ou inexacte."}
        </p>
      </div>

      <div className="panel">
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Marque</span>
            <select className="input" value={marque} onChange={(e) => setMarque(e.target.value)}>
              {allMarques.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Pack</span>
            <input
              className="input"
              list="palette-pack-suggestions"
              value={pack}
              onChange={(e) => setPack(e.target.value)}
              placeholder="Ex : 240 couleurs"
            />
            <datalist id="palette-pack-suggestions">
              {packsForMarque.map((p) => <option key={p} value={p} />)}
            </datalist>
          </label>
        </div>
      </div>

      {isAdmin && (
        <div className="panel">
          <h4 style={{ marginTop: 0 }}>Ajouter une couleur</h4>
          <div className="palette-add-row">
            <input
              className="input mono"
              style={{ width: 90 }}
              placeholder="N°"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              className="input"
              placeholder="Nom (optionnel)"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <input
              type="color"
              className="color-input"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />
            <button type="button" className="btn btn-primary btn-small" onClick={handleAdd}>
              <Plus size={13} /> Ajouter
            </button>
          </div>

          <h4 style={{ marginTop: 20 }}>Importer en masse</h4>
          <p className="field-hint">
            Une ligne par couleur : numéro, nom (optionnel), #hex. Ex : "1, Rouge vif, #E2231A"
          </p>
          <textarea
            className="input textarea"
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"1, Rouge vif, #E2231A\n2, Orange, #F2811D"}
          />
          <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: 8 }}>
            <button type="button" className="btn btn-ghost btn-small" onClick={handleBulk}>
              <Upload size={13} /> Importer
            </button>
          </div>
        </div>
      )}

      {!isAdmin && pack && (
        <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p className="view-sub" style={{ margin: 0 }}>Une couleur manque ou est inexacte ?</p>
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={() => setProposeModal({ initial: { marque, pack } })}
          >
            <Send size={13} /> Proposer une couleur
          </button>
        </div>
      )}

      {pack ? (
        entries.length === 0 ? (
          <EmptyState
            icon={PaletteIcon}
            title="Aucune couleur enregistrée pour ce pack"
            text={isAdmin ? "Ajoute tes couleurs ci-dessus." : "Tu peux proposer la première couleur de ce pack."}
          />
        ) : (
          <div className="swatch-grid">
            {entries.map((p) => (
              <ColorSwatch
                key={p.id}
                entry={p}
                isAdmin={isAdmin}
                onEdit={(e) => setEditModal(e)}
                onDelete={handleDeleteEntry}
                onPropose={(e) => setProposeModal({ initial: { marque, pack, numero: e.numero, nomPropose: e.nom, hexPropose: e.hex } })}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={PaletteIcon}
          title="Choisis ou écris un pack"
          text="Indique le pack pour lequel afficher les couleurs."
        />
      )}

      {editModal && (
        <EditSwatchModal
          entry={editModal}
          allMarques={allMarques}
          packsForMarque={packsForMarqueOf}
          onClose={() => setEditModal(null)}
          onSave={handleUpdateEntry}
        />
      )}

      {proposeModal && (
        <Modal title="Proposer une couleur" onClose={() => setProposeModal(null)} width={620}>
          <ProposalForm
            type="color_correction"
            initial={proposeModal.initial}
            onCancel={() => setProposeModal(null)}
            onSubmit={handleSubmitProposal}
            title="Envoyer la proposition"
          />
        </Modal>
      )}
    </div>
  );
}
