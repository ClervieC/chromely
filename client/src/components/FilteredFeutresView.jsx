import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "./Toast.jsx";
import { FeutreCard, EmptyState, Modal, Field } from "./ui.jsx";
import { FeutreForm } from "./FeutreForm.jsx";
import { ETATS } from "../data.js";

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
  const [confirmDelete, setConfirmDelete] = useState(null);

  const list = feutres.filter(filterFn);

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
          {list.map((f) => (
            <FeutreCard
              key={f.id}
              f={f}
              onEdit={(item) => setFeutreModal({ initial: item })}
              onDelete={(item) => setConfirmDelete(item)}
            />
          ))}
        </div>
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
