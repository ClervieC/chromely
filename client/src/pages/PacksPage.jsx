import { useMemo, useState } from "react";
import { Search, Layers, Package, ShoppingCart, ChevronRight, X as XIcon } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { BRAND_COLOR, MARQUES_NUMERO_UNIVERSEL } from "../data.js";
import { FeutreCard, FeutreGroupCard, GroupModal, EmptyState, Modal } from "../components/ui.jsx";
import { FeutreForm } from "../components/FeutreForm.jsx";

function PackCard({ pack, onClick }) {
  const brand = BRAND_COLOR[pack.marque] || BRAND_COLOR.Autre;
  const hexColors = pack.feutres.filter((f) => f.hex).slice(0, 14);

  return (
    <button className="pack-card" style={{ "--pack-brand": brand }} onClick={onClick}>
      <div className="pack-card-photo">
        {pack.imageUrl ? (
          <img src={pack.imageUrl} alt={pack.nom} className="pack-card-img" />
        ) : (
          <div className="pack-card-photo-bg" />
        )}
        {hexColors.length > 0 && (
          <div className="pack-card-color-strip">
            {hexColors.map((f, i) => (
              <div key={f.id ?? i} className="pack-card-color-dot" style={{ background: f.hex }} />
            ))}
            {pack.feutres.filter((f) => f.hex).length > 14 && (
              <span className="pack-card-color-more">+{pack.feutres.filter((f) => f.hex).length - 14}</span>
            )}
          </div>
        )}
      </div>

      <div className="pack-card-body">
        <div className="pack-card-top">
          <span className="pack-card-brand-dot" style={{ background: brand }} />
          <span className="pack-card-marque" style={{ color: brand }}>{pack.marque}</span>
          {pack.lienAchat && (
            <a
              href={pack.lienAchat}
              target="_blank"
              rel="noopener noreferrer"
              className="pack-card-buy"
              onClick={(e) => e.stopPropagation()}
              title="Acheter"
            >
              <ShoppingCart size={11} />
            </a>
          )}
        </div>
        <div className="pack-card-nom">{pack.nom}</div>
        <div className="pack-card-count">
          <Package size={12} />
          {pack.totalUnites} feutre{pack.totalUnites > 1 ? "s" : ""}
          <span className="pack-card-refs">· {pack.feutres.length} réf.</span>
        </div>
      </div>

      <ChevronRight size={14} className="pack-card-arrow" />
    </button>
  );
}

function PackDetailModal({ pack, onClose, onEditFeutre, onDeleteFeutre }) {
  const brand = BRAND_COLOR[pack.marque] || BRAND_COLOR.Autre;
  const [groupModal, setGroupModal] = useState(null);

  const grouped = useMemo(() => {
    const map = new Map();
    pack.feutres.forEach((f) => {
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
  }, [pack.feutres]);

  return (
    <>
      <Modal title={pack.nom} onClose={onClose} width={760} accent={brand}>
        <div className="pack-detail-header">
          {pack.imageUrl && (
            <img src={pack.imageUrl} alt={pack.nom} className="pack-detail-photo" />
          )}
          <div className="pack-detail-meta">
            <span className="pack-detail-marque" style={{ color: brand }}>{pack.marque}</span>
            <span className="pack-detail-stat">
              <Package size={13} />
              {pack.totalUnites} feutre{pack.totalUnites > 1 ? "s" : ""} · {pack.feutres.length} référence{pack.feutres.length > 1 ? "s" : ""}
            </span>
            {pack.lienAchat && (
              <a href={pack.lienAchat} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: "fit-content", textDecoration: "none" }}>
                <ShoppingCart size={13} /> Acheter ce pack
              </a>
            )}
          </div>
        </div>

        <div className="pack-detail-grid">
          {grouped.map((group) =>
            group.length === 1 ? (
              <FeutreCard
                key={group[0].id}
                f={group[0]}
                onEdit={(item) => { onEditFeutre(item); onClose(); }}
                onDelete={(item) => { onDeleteFeutre(item); onClose(); }}
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
      </Modal>

      {groupModal && (
        <GroupModal
          group={groupModal}
          onClose={() => setGroupModal(null)}
          onEdit={(item) => { setGroupModal(null); onEditFeutre(item); onClose(); }}
          onDelete={(item) => { setGroupModal(null); onDeleteFeutre(item); onClose(); }}
        />
      )}
    </>
  );
}

export default function PacksPage() {
  const { feutres, palette, customPacks, customBrands, editFeutre, removeFeutre } = useData();
  const [search, setSearch] = useState("");
  const [marqueFilter, setMarqueFilter] = useState("all");
  const [selectedPack, setSelectedPack] = useState(null);
  const [feutreModal, setFeutreModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Index normalisé (trim + lowercase) pour matching souple
  const customPackIndex = useMemo(() => {
    const idx = {};
    customPacks.forEach((cp) => {
      const key = `${cp.marque.trim().toLowerCase()}::${cp.nom.trim().toLowerCase()}`;
      idx[key] = cp;
    });
    return idx;
  }, [customPacks]);

  function findCustomPack(marque, packNom) {
    const key = `${marque.trim().toLowerCase()}::${packNom.trim().toLowerCase()}`;
    return customPackIndex[key] || null;
  }

  const packs = useMemo(() => {
    const map = {};
    feutres.forEach((f) => {
      if (!f.pack) return;
      const key = `${f.marque}::${f.pack}`;
      if (!map[key]) {
        const cp = findCustomPack(f.marque, f.pack) || {};
        map[key] = {
          marque: f.marque,
          nom: f.pack,
          imageUrl: cp.imageUrl || null,
          lienAchat: cp.lienAchat || null,
          feutres: [],
          totalUnites: 0,
        };
      }
      map[key].feutres.push(f);
      map[key].totalUnites += (f.quantite || 1);
    });
    return Object.values(map).sort((a, b) =>
      a.marque.localeCompare(b.marque) || a.nom.localeCompare(b.nom),
    );
  }, [feutres, customPackIndex]);

  const feutresSansPack = useMemo(() => feutres.filter((f) => !f.pack), [feutres]);

  const marques = useMemo(() => [...new Set(packs.map((p) => p.marque))], [packs]);

  const filtered = useMemo(() => {
    let out = packs;
    if (marqueFilter !== "all") out = out.filter((p) => p.marque === marqueFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((p) => p.nom.toLowerCase().includes(q) || p.marque.toLowerCase().includes(q));
    }
    return out;
  }, [packs, marqueFilter, search]);

  async function handleSubmitFeutre(entries) {
    try {
      await editFeutre(feutreModal.id, entries[0]);
    } catch (e) { /* toast handled upstream */ }
    finally { setFeutreModal(null); }
  }

  async function handleDelete() {
    try { await removeFeutre(confirmDelete.id); }
    catch (e) { /* toast handled upstream */ }
    finally { setConfirmDelete(null); }
  }

  return (
    <div className="view packs-view">
      <div className="page-header" style={{ "--page-color": "#0F766E" }}>
        <div className="page-header-inner">
          <div className="page-header-text">
            <h1 className="display page-header-title">Mes packs</h1>
            <p className="page-header-sub">
              {packs.length} pack{packs.length > 1 ? "s" : ""} · {feutres.length} feutre{feutres.length > 1 ? "s" : ""}
              {feutresSansPack.length > 0 && ` · ${feutresSansPack.length} sans pack`}
            </p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} />
          <input
            className="search-input"
            placeholder="Rechercher un pack…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input input-compact"
          value={marqueFilter}
          onChange={(e) => setMarqueFilter(e.target.value)}
        >
          <option value="all">Toutes les marques</option>
          {marques.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Aucun pack trouvé"
          text={packs.length === 0 ? "Tes feutres n'ont pas encore de pack assigné." : "Essaie d'élargir ta recherche."}
        />
      ) : (
        <div className="packs-grid">
          {filtered.map((p) => (
            <PackCard
              key={`${p.marque}::${p.nom}`}
              pack={p}
              onClick={() => setSelectedPack(p)}
            />
          ))}
        </div>
      )}

      {/* Section feutres sans pack */}
      {feutresSansPack.length > 0 && marqueFilter === "all" && !search && (
        <div className="packs-orphans">
          <h3 className="packs-orphans-title">{feutresSansPack.length} feutre{feutresSansPack.length > 1 ? "s" : ""} sans pack</h3>
          <div className="pack-detail-grid">
            {feutresSansPack.map((f) => (
              <FeutreCard
                key={f.id}
                f={f}
                onEdit={(item) => setFeutreModal(item)}
                onDelete={(item) => setConfirmDelete(item)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedPack && (
        <PackDetailModal
          pack={selectedPack}
          onClose={() => setSelectedPack(null)}
          onEditFeutre={(item) => setFeutreModal(item)}
          onDeleteFeutre={(item) => setConfirmDelete(item)}
        />
      )}

      {feutreModal && (
        <Modal title="Modifier le feutre" onClose={() => setFeutreModal(null)} width={640}>
          <FeutreForm
            initial={feutreModal}
            onCancel={() => setFeutreModal(null)}
            onSubmit={handleSubmitFeutre}
            title="Enregistrer"
            palette={palette}
            customPacks={customPacks}
            customBrands={customBrands}
            feutres={feutres}
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
