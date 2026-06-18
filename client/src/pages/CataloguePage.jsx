import { useState } from "react";
import { Plus, Trash2, Send } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../api.js";
import { CATALOGUE, MARQUES, BRAND_COLOR } from "../data.js";
import { IconBtn, Modal } from "../components/ui.jsx";
import { ProposalForm } from "../components/ProposalForm.jsx";

export default function CataloguePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { customPacks, addCustomPack, removeCustomPack } = useData();
  const toast = useToast();

  const [marque, setMarque] = useState("GuangNa");
  const [marqueAutre, setMarqueAutre] = useState("");
  const [nom, setNom] = useState("");
  const [taille, setTaille] = useState("");
  const [detail, setDetail] = useState("");
  const marqueFinale = marque === "Autre" ? marqueAutre || "Autre" : marque;

  async function handleAdd() {
    if (!nom.trim()) return;
    try {
      await addCustomPack({
        marque: marqueFinale,
        nom: nom.trim(),
        taille: taille ? Number(taille) : null,
        detail: detail.trim(),
      });
      toast.success("Pack ajouté au catalogue");
      setNom("");
      setTaille("");
      setDetail("");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete(p) {
    try {
      await removeCustomPack(p.id);
      toast.success("Pack supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const [proposeOpen, setProposeOpen] = useState(false);
  async function handleSubmitProposal(values) {
    try {
      await api.createProposal(values);
      toast.success("Proposition envoyée à l'admin pour validation");
      setProposeOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">Catalogue de référence</h2>
        <p className="view-sub">
          Les packs réellement disponibles pour chaque marque, pour repérer ce
          qui manque.
        </p>
      </div>

      {Object.entries(CATALOGUE).map(([m, data]) => (
        <div className="panel" key={m}>
          <h3 style={{ color: BRAND_COLOR[m] }}>{m}</h3>
          <p className="catalogue-intro">{data.intro}</p>
          <div className="catalogue-packs">
            {data.packs.map((p) => (
              <div className="catalogue-pack" key={p.nom}>
                <span className="catalogue-pack-name mono">{p.nom}</span>
                <span className="catalogue-pack-detail">{p.detail}</span>
              </div>
            ))}
          </div>
          {data.note && <p className="catalogue-note">⚠ {data.note}</p>}
        </div>
      ))}

      <div className="panel">
        <h3>Packs ajoutés par la communauté</h3>
        {!isAdmin && (
          <div
            className="modal-actions"
            style={{ justifyContent: "flex-start", marginBottom: 14 }}
          >
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => setProposeOpen(true)}
            >
              <Send size={13} /> Proposer un nouveau pack
            </button>
          </div>
        )}

        {isAdmin && (
          <>
            <p className="view-sub">
              Une nouvelle référence vient de sortir ? Ajoute-la directement,
              elle apparaîtra partout dans l'appli.
            </p>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Marque</span>
                <select
                  className="input"
                  value={marque}
                  onChange={(e) => setMarque(e.target.value)}
                >
                  {MARQUES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              {marque === "Autre" && (
                <label className="field">
                  <span className="field-label">Nom de la marque</span>
                  <input
                    className="input"
                    value={marqueAutre}
                    onChange={(e) => setMarqueAutre(e.target.value)}
                  />
                </label>
              )}
              <label className="field">
                <span className="field-label">Nom du pack</span>
                <input
                  className="input"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : 360 couleurs"
                />
              </label>
              <label className="field">
                <span className="field-label">
                  Nombre de feutres (optionnel)
                </span>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={taille}
                  onChange={(e) => setTaille(e.target.value)}
                />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Détail (optionnel)</span>
              <input
                className="input"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Ex : nouvelle sortie 2026"
              />
            </label>
            <div
              className="modal-actions"
              style={{ justifyContent: "flex-start", marginTop: 10 }}
            >
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={handleAdd}
              >
                <Plus size={13} /> Ajouter ce pack
              </button>
            </div>
          </>
        )}

        {customPacks.length > 0 && (
          <div className="catalogue-packs" style={{ marginTop: 16 }}>
            {customPacks.map((p) => (
              <div className="catalogue-pack-row" key={p.id}>
                <div>
                  <span className="catalogue-pack-name mono">
                    {p.marque} — {p.nom}
                  </span>
                  <div className="catalogue-pack-detail">
                    {p.taille ? `${p.taille} feutres. ` : ""}
                    {p.detail}
                  </div>
                </div>
                {isAdmin && (
                  <IconBtn
                    icon={Trash2}
                    onClick={() => handleDelete(p)}
                    title="Supprimer"
                    danger
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {proposeOpen && (
        <Modal
          title="Proposer un nouveau pack"
          onClose={() => setProposeOpen(false)}
          width={560}
        >
          <ProposalForm
            type="new_pack"
            onCancel={() => setProposeOpen(false)}
            onSubmit={handleSubmitProposal}
            title="Envoyer la proposition"
          />
        </Modal>
      )}
    </div>
  );
}
