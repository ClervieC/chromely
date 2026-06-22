import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
  ExternalLink,
  Heart,
} from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { PRIORITES, BRAND_COLOR } from "../data.js";
import { EmptyState, Modal, IconBtn, Tag } from "../components/ui.jsx";
import { WishForm } from "../components/WishForm.jsx";
import { FeutreForm } from "../components/FeutreForm.jsx";

function WishCard({ item, onEdit, onDelete, onConvert }) {
  const brand = BRAND_COLOR[item.marque] || BRAND_COLOR.Autre;
  const prio = PRIORITES[item.priorite] || PRIORITES.moyenne;
  return (
    <div className="wish-card">
      <div className="wish-head">
        <span className="wish-marque" style={{ color: brand }}>
          {item.marque}
        </span>
        <Tag color={prio.color}>{prio.label}</Tag>
      </div>
      <div className="wish-pack">{item.pack}</div>
      {item.couleur && (
        <div className="wish-couleur">Couleur visée : {item.couleur}</div>
      )}
      {item.prix != null && item.prix !== "" && (
        <div className="wish-prix">≈ {item.prix} €</div>
      )}
      {item.notes && <p className="wish-notes">{item.notes}</p>}
      {item.lien && (
        <a
          className="wish-link"
          href={item.lien}
          target="_blank"
          rel="noreferrer"
        >
          Voir le lien <ExternalLink size={12} />
        </a>
      )}
      <div className="wish-actions">
        <button
          type="button"
          className="btn btn-small btn-primary"
          onClick={() => onConvert(item)}
        >
          <ShoppingCart size={13} /> Acheté → stock
        </button>
        <IconBtn icon={Pencil} onClick={() => onEdit(item)} title="Modifier" />
        <IconBtn
          icon={Trash2}
          onClick={() => onDelete(item)}
          title="Supprimer"
          danger
        />
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const {
    wishlist,
    palette,
    customPacks,
    addWish,
    editWish,
    removeWish,
    addFeutre,
  } = useData();
  const toast = useToast();
  const [wishModal, setWishModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [convertModal, setConvertModal] = useState(null); // { item, prefill }

  async function handleSubmitWish(values) {
    try {
      if (wishModal.initial) {
        await editWish(wishModal.initial.id, values);
        toast.success("Envie mise à jour");
      } else {
        await addWish(values);
        toast.success("Envie ajoutée");
      }
      setWishModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete() {
    try {
      await removeWish(confirmDelete.id);
      toast.success("Envie supprimée");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleConvert(entries) {
    try {
      await addFeutre(Array.isArray(entries) ? entries[0] : entries);
      await removeWish(convertModal.item.id);
      toast.success("Ajouté au stock, envie retirée de la liste");
      setConvertModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">Envies d'achat</h2>
        <button
          className="btn btn-primary"
          onClick={() => setWishModal({ initial: null })}
        >
          <Plus size={15} /> Ajouter une envie
        </button>
      </div>
      {wishlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucune envie pour l'instant"
          text="Note ici les packs ou couleurs que tu repères en attendant de les acheter."
          actionLabel="Ajouter une envie"
          onAction={() => setWishModal({ initial: null })}
        />
      ) : (
        <div className="wish-grid">
          {wishlist.map((item) => (
            <WishCard
              key={item.id}
              item={item}
              onEdit={(i) => setWishModal({ initial: i })}
              onDelete={(i) => setConfirmDelete(i)}
              onConvert={(i) => setConvertModal({ item: i })}
            />
          ))}
        </div>
      )}

      {wishModal && (
        <Modal
          title={wishModal.initial ? "Modifier l'envie" : "Ajouter une envie"}
          onClose={() => setWishModal(null)}
          width={560}
        >
          <WishForm
            initial={wishModal.initial}
            onCancel={() => setWishModal(null)}
            onSubmit={handleSubmitWish}
            title={wishModal.initial ? "Enregistrer" : "Ajouter"}
            customPacks={customPacks}
          />
        </Modal>
      )}
      {convertModal && (
        <Modal
          title="Ajouter ce feutre à ton stock"
          onClose={() => setConvertModal(null)}
          width={640}
        >
          <FeutreForm
            initial={{
              marque: convertModal.item.marque,
              pack: convertModal.item.pack,
              nom: convertModal.item.couleur,
              prix: convertModal.item.prix,
            }}
            onCancel={() => setConvertModal(null)}
            onSubmit={handleConvert}
            title="Ajouter au stock"
            palette={palette}
            customPacks={customPacks}
          />
        </Modal>
      )}
      {confirmDelete && (
        <Modal
          title="Confirmer la suppression"
          onClose={() => setConfirmDelete(null)}
          width={420}
        >
          <p className="confirm-text">Supprimer définitivement cette envie ?</p>
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
