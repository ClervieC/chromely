import { useState } from "react";
import { Plus, Pencil, Trash2, ShoppingCart, ExternalLink, Heart } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { PRIORITES, BRAND_COLOR } from "../data.js";
import { EmptyState, Modal, IconBtn, Tag } from "../components/ui.jsx";
import { WishForm } from "../components/WishForm.jsx";
import { FeutreForm } from "../components/FeutreForm.jsx";

const PRIO_BG = {
  haute: "rgba(193,69,45,0.08)",
  moyenne: "rgba(232,179,57,0.08)",
  basse: "rgba(75,90,96,0.06)",
};

function WishCard({ item, onEdit, onDelete, onConvert }) {
  const brand = BRAND_COLOR[item.marque] || BRAND_COLOR.Autre;
  const prio = PRIORITES[item.priorite] || PRIORITES.moyenne;
  return (
    <div className="wish-card" style={{ "--wish-brand": brand, "--wish-prio-bg": PRIO_BG[item.priorite] || PRIO_BG.moyenne }}>
      <div className="wish-card-top" />
      <div className="wish-card-body">
        <div className="wish-head">
          <span className="wish-marque" style={{ color: brand }}>{item.marque}</span>
          <Tag color={prio.color}>{prio.label}</Tag>
        </div>
        <div className="wish-pack">{item.pack}</div>
        {item.couleur && <div className="wish-meta">Couleur : {item.couleur}</div>}
        {item.prix != null && item.prix !== "" && (
          <div className="wish-meta wish-prix">≈ {item.prix} €</div>
        )}
        {item.notes && <p className="wish-notes">{item.notes}</p>}
        {item.lien && (
          <a className="wish-link" href={item.lien} target="_blank" rel="noreferrer">
            <ExternalLink size={12} /> Voir le lien
          </a>
        )}
      </div>
      <div className="wish-actions">
        <button type="button" className="btn btn-small btn-primary wish-convert-btn" onClick={() => onConvert(item)}>
          <ShoppingCart size={13} /> Acheté
        </button>
        <div className="wish-icon-actions">
          <IconBtn icon={Pencil} onClick={() => onEdit(item)} title="Modifier" />
          <IconBtn icon={Trash2} onClick={() => onDelete(item)} title="Supprimer" danger />
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { wishlist, palette, customPacks, customBrands, addWish, editWish, removeWish, addFeutre } = useData();
  const toast = useToast();
  const [wishModal, setWishModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [convertModal, setConvertModal] = useState(null);

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
      <div className="page-header" style={{ "--page-color": "#E8B339" }}>
        <div className="page-header-inner">
          <div className="page-header-text">
            <h1 className="display page-header-title">Envies d'achat</h1>
            {wishlist.length > 0 && (
              <p className="page-header-sub">{wishlist.length} envie{wishlist.length > 1 ? "s" : ""} en attente</p>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setWishModal({ initial: null })}>
            <Plus size={15} /> Ajouter
          </button>
        </div>
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
            customBrands={customBrands}
          />
        </Modal>
      )}
      {convertModal && (
        <Modal title="Ajouter ce feutre à ton stock" onClose={() => setConvertModal(null)} width={640}>
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
            customBrands={customBrands}
          />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Confirmer la suppression" onClose={() => setConfirmDelete(null)} width={420}>
          <p className="confirm-text">Supprimer définitivement cette envie ?</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
