import { useMemo, useState } from "react";
import { Plus, Layers, Search, LayoutGrid } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { ETATS, MARQUES_NUMERO_UNIVERSEL } from "../data.js";
import { FeutreCard, FeutreGroupCard, GroupModal, EmptyState, Modal, Field } from "../components/ui.jsx";
import { FeutreForm } from "../components/FeutreForm.jsx";
import { PackForm } from "../components/PackForm.jsx";

export function applyFilters(list, filters) {
  let out = list.filter((f) => {
    if (filters.marque !== "all" && f.marque !== filters.marque) return false;
    if (filters.etat !== "all" && f.etat !== filters.etat) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = [f.numero, f.nom, f.pack, f.notes].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  switch (filters.sort) {
    case "marque":
      out = [...out].sort((a, b) => a.marque.localeCompare(b.marque));
      break;
    case "numero":
      out = [...out].sort((a, b) =>
        (a.numero || "").localeCompare(b.numero || "", undefined, { numeric: true }),
      );
      break;
    case "quantite":
      out = [...out].sort((a, b) => b.quantite - a.quantite);
      break;
    default:
      out = [...out].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return out;
}

export function FilterBar({ filters, setFilters, marquesPresentes }) {
  return (
    <div className="filter-bar">
      <div className="search-box">
        <Search size={15} />
        <input
          className="search-input"
          placeholder="Rechercher un numéro, un nom, un pack..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
      </div>
      <select
        className="input input-compact"
        value={filters.marque}
        onChange={(e) => setFilters({ ...filters, marque: e.target.value })}
      >
        <option value="all">Toutes les marques</option>
        {marquesPresentes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        className="input input-compact"
        value={filters.etat}
        onChange={(e) => setFilters({ ...filters, etat: e.target.value })}
      >
        <option value="all">Tous les états</option>
        {Object.entries(ETATS).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
      <select
        className="input input-compact"
        value={filters.sort}
        onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
      >
        <option value="recent">Plus récent</option>
        <option value="marque">Marque (A-Z)</option>
        <option value="numero">Numéro</option>
        <option value="quantite">Quantité</option>
      </select>
    </div>
  );
}

export default function StockPage() {
  const { feutres, palette, customPacks, customBrands, addFeutre, editFeutre, removeFeutre, bulkPack } = useData();
  const toast = useToast();
  const [filters, setFilters] = useState({ q: "", marque: "all", etat: "all", sort: "recent" });
  const [feutreModal, setFeutreModal] = useState(null);
  const [groupModal, setGroupModal] = useState(null);
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const marquesPresentes = useMemo(
    () => [...new Set(feutres.map((f) => f.marque).filter(Boolean))],
    [feutres],
  );
  const filtered = useMemo(() => applyFilters(feutres, filters), [feutres, filters]);
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((f) => {
      const universel = MARQUES_NUMERO_UNIVERSEL.includes(f.marque);
      const key =
        universel && f.numero
          ? `${f.marque}::num::${f.numero}`
          : f.hex
            ? `${f.marque}::hex::${f.hex.toLowerCase()}`
            : `id::${f.id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(f);
    });
    return [...map.values()];
  }, [filtered]);

  async function handleSubmitFeutre(entries) {
    try {
      if (feutreModal.initial) {
        await editFeutre(feutreModal.initial.id, entries[0]);
        for (const entry of entries.slice(1)) await addFeutre(entry);
        toast.success("Feutre mis à jour");
      } else {
        await addFeutre(entries[0]);
        toast.success("Feutre ajouté");
      }
      setFeutreModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleAddPack(values) {
    try {
      const { added, incremented, matched } = await bulkPack(values);
      const parts = [];
      if (added) parts.push(`${added} feutre${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}`);
      if (matched && matched === added) parts.push(`couleurs depuis la palette ✓`);
      else if (matched) parts.push(`${matched} couleur${matched > 1 ? "s" : ""} retrouvée${matched > 1 ? "s" : ""}`);
      if (incremented) parts.push(`${incremented} doublon${incremented > 1 ? "s" : ""} mis à jour`);
      toast.success(parts.join(" · ") || "Pack traité");
      setPackModalOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete() {
    const target = confirmDelete;
    setConfirmDelete(null);
    const snapshot = { ...target };
    try {
      await removeFeutre(target.id);
      toast.success("Feutre supprimé", {
        onUndo: async () => {
          try {
            const { id, createdAt, ...data } = snapshot;
            await addFeutre(data);
            toast.success("Suppression annulée");
          } catch (e) {
            toast.error("Impossible de restaurer le feutre");
          }
        },
      });
    } catch (e) {
      toast.error(e.message);
    }
  }

  const total = feutres.reduce((s, f) => s + (f.quantite || 1), 0);

  return (
    <div className="view stock-view">
      <div className="page-header" style={{ "--page-color": "#4f46e5" }}>
        <div className="page-header-inner">
          <div className="page-header-text">
            <h1 className="display page-header-title">Mon stock</h1>
            {feutres.length > 0 && (
              <p className="page-header-sub">
                {total} feutre{total > 1 ? "s" : ""} · {feutres.length} référence{feutres.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="page-header-actions">
            <button className="btn btn-ghost" onClick={() => setPackModalOpen(true)}>
              <Layers size={15} /> Pack entier
            </button>
            <button className="btn btn-primary" onClick={() => setFeutreModal({ initial: null })}>
              <Plus size={15} /> Ajouter
            </button>
          </div>
        </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} marquesPresentes={marquesPresentes} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Aucun feutre ne correspond"
          text="Essaie d'élargir tes filtres, ou ajoute un nouveau feutre."
          actionLabel="Ajouter un feutre"
          onAction={() => setFeutreModal({ initial: null })}
        />
      ) : (
        <div className="feutre-grid">
          {grouped.map((group) =>
            group.length === 1 ? (
              <FeutreCard
                key={group[0].id}
                f={group[0]}
                onEdit={(item) => setFeutreModal({ initial: item })}
                onDelete={(item) => setConfirmDelete(item)}
              />
            ) : (
              <FeutreGroupCard
                key={group.map((g) => g.id).join("-")}
                group={group}
                onOpenGroup={(g) => setGroupModal(g)}
              />
            ),
          )}
        </div>
      )}

      {groupModal && (
        <GroupModal
          group={groupModal}
          onClose={() => setGroupModal(null)}
          onEdit={(item) => { setGroupModal(null); setFeutreModal({ initial: item }); }}
          onDelete={(item) => { setGroupModal(null); setConfirmDelete(item); }}
        />
      )}

      {feutreModal && (
        <Modal
          title={feutreModal.initial ? "Modifier le feutre" : "Ajouter un feutre"}
          onClose={() => setFeutreModal(null)}
          width={640}
        >
          <FeutreForm
            initial={feutreModal.initial}
            onCancel={() => setFeutreModal(null)}
            onSubmit={handleSubmitFeutre}
            title={feutreModal.initial ? "Enregistrer" : "Ajouter au stock"}
            palette={palette}
            customPacks={customPacks}
            customBrands={customBrands}
            feutres={feutres}
          />
        </Modal>
      )}
      {packModalOpen && (
        <Modal title="Ajouter un pack entier" onClose={() => setPackModalOpen(false)} width={640}>
          <PackForm
            onCancel={() => setPackModalOpen(false)}
            onSubmit={handleAddPack}
            title="Générer le pack"
            palette={palette}
            customPacks={customPacks}
            customBrands={customBrands}
          />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Confirmer la suppression" onClose={() => setConfirmDelete(null)} width={420}>
          <p className="confirm-text">Supprimer définitivement ce feutre ?</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
