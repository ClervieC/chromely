import { useMemo, useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "./Toast.jsx";
import { FeutreCard, FeutreGroupCard, GroupModal, EmptyState, Modal } from "./ui.jsx";
import { FeutreForm } from "./FeutreForm.jsx";
import { MARQUES_NUMERO_UNIVERSEL } from "../data.js";

export function FilteredFeutresView({
  title,
  subtitle,
  filterFn,
  emptyIcon,
  emptyTitle,
  emptyText,
}) {
  const { feutres, palette, customPacks, addFeutre, editFeutre, removeFeutre } = useData();
  const toast = useToast();
  const [feutreModal, setFeutreModal] = useState(null);
  const [groupModal, setGroupModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const list = useMemo(() => feutres.filter((f) => filterFn(f, feutres)), [feutres, filterFn]);

  const grouped = useMemo(() => {
    const map = new Map();
    list.forEach((f) => {
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
  }, [list]);

  async function handleSubmitFeutre(entries) {
    try {
      await editFeutre(feutreModal.initial.id, entries[0]);
      for (const entry of entries.slice(1)) await addFeutre(entry);
      toast.success("Feutre mis à jour");
      setFeutreModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete() {
    try {
      await removeFeutre(confirmDelete.id);
      toast.success("Feutre supprimé");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">{title}</h2>
        {list.length > 0 && subtitle && (
          <p className="view-sub">{subtitle(list)}</p>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={emptyIcon} title={emptyTitle} text={emptyText} />
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
          title="Modifier le feutre"
          onClose={() => setFeutreModal(null)}
          width={640}
        >
          <FeutreForm
            initial={feutreModal.initial}
            onCancel={() => setFeutreModal(null)}
            onSubmit={handleSubmitFeutre}
            title="Enregistrer"
            palette={palette}
            customPacks={customPacks}
            feutres={feutres}
          />
        </Modal>
      )}
      {confirmDelete && (
        <Modal
          title="Confirmer la suppression"
          onClose={() => setConfirmDelete(null)}
          width={420}
        >
          <p className="confirm-text">Supprimer définitivement ce feutre ?</p>
          <div className="modal-actions">
            <button
              className="btn btn-ghost"
              onClick={() => setConfirmDelete(null)}
            >
              Annuler
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
