import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, Heart, PenTool } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { BRAND_COLOR } from "../data.js";
import { FeutreCap, EmptyState, Modal, Spinner } from "../components/ui.jsx";
import { FeutreForm } from "../components/FeutreForm.jsx";
import { PackForm } from "../components/PackForm.jsx";

export default function DashboardPage() {
  const {
    feutres,
    wishlist,
    palette,
    customPacks,
    loading,
    addFeutre,
    bulkPack,
  } = useData();
  const navigate = useNavigate();
  const toast = useToast();
  const [feutreModalOpen, setFeutreModalOpen] = useState(false);
  const [packModalOpen, setPackModalOpen] = useState(false);

  const stats = useMemo(() => {
    const totalUnites = feutres.reduce((s, f) => s + (f.quantite || 1), 0);
    const parMarque = {};
    feutres.forEach((f) => {
      parMarque[f.marque] = (parMarque[f.marque] || 0) + (f.quantite || 1);
    });
    return {
      totalUnites,
      totalRef: feutres.length,
      parMarque,
      doublons: feutres.filter((f) => f.quantite > 1).length,
      panne: feutres.filter((f) => f.etat !== "fonctionne").length,
      envies: wishlist.length,
    };
  }, [feutres, wishlist]);

  const recent = useMemo(() => [...feutres].slice(0, 16), [feutres]);
  const maxMarque = Math.max(1, ...Object.values(stats.parMarque));

  if (loading)
    return (
      <div className="full-page-loader">
        <Spinner />
      </div>
    );

  async function handleAddFeutre(entries) {
    try {
      await addFeutre(entries[0]);
      toast.success("Feutre ajouté à ton stock");
      setFeutreModalOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleAddPack(values) {
    try {
      const { added, incremented, matched } = await bulkPack(values);
      const parts = [];
      if (added) parts.push(`${added} feutre(s) ajouté(s)`);
      if (matched) parts.push(`${matched} couleur(s) retrouvée(s)`);
      if (incremented) parts.push(`${incremented} doublon(s) mis à jour`);
      toast.success(parts.join(", ") || "Pack traité");
      setPackModalOpen(false);
      navigate("/stock");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="view">
      <div className="hero">
        <div className="hero-text">
          <h1 className="display">Chromely</h1>
          <p>Suivi de stock pour GuangNa, Tooli-Art, Nicety &amp; co.</p>
        </div>
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            onClick={() => setFeutreModalOpen(true)}
          >
            <Plus size={15} /> Ajouter un feutre
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setPackModalOpen(true)}
          >
            <Layers size={15} /> Ajouter un pack entier
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/envies")}>
            <Heart size={15} /> Ajouter une envie
          </button>
        </div>
      </div>

      {recent.length > 0 ? (
        <div className="rack">
          {recent.map((f) => (
            <FeutreCap
              key={f.id}
              hex={f.hex}
              brand={BRAND_COLOR[f.marque] || BRAND_COLOR.Autre}
              size={44}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={PenTool}
          title="Ta vitrine est vide"
          text="Ajoute ton premier feutre pour commencer ton inventaire."
          actionLabel="Ajouter un feutre"
          onAction={() => setFeutreModalOpen(true)}
        />
      )}

      <div className="stat-grid">
        <button className="stat-card" onClick={() => navigate("/stock")}>
          <span className="stat-number display">{stats.totalUnites}</span>
          <span className="stat-label">
            feutres en stock ({stats.totalRef} références)
          </span>
        </button>
        <button className="stat-card" onClick={() => navigate("/doublons")}>
          <span className="stat-number display" style={{ color: "#7C5CBF" }}>
            {stats.doublons}
          </span>
          <span className="stat-label">en double</span>
        </button>
        <button className="stat-card" onClick={() => navigate("/panne")}>
          <span className="stat-number display" style={{ color: "#C1452D" }}>
            {stats.panne}
          </span>
          <span className="stat-label">en panne</span>
        </button>
        <button className="stat-card" onClick={() => navigate("/envies")}>
          <span className="stat-number display" style={{ color: "#E8B339" }}>
            {stats.envies}
          </span>
          <span className="stat-label">envies d'achat</span>
        </button>
      </div>

      {Object.keys(stats.parMarque).length > 0 && (
        <div className="panel">
          <h3>Répartition par marque</h3>
          <div className="bar-list">
            {Object.entries(stats.parMarque).map(([m, n]) => (
              <div className="bar-row" key={m}>
                <span className="bar-label">{m}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(n / maxMarque) * 100}%`,
                      background: BRAND_COLOR[m] || BRAND_COLOR.Autre,
                    }}
                  />
                </div>
                <span className="bar-value mono">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {feutreModalOpen && (
        <Modal
          title="Ajouter un feutre"
          onClose={() => setFeutreModalOpen(false)}
          width={640}
        >
          <FeutreForm
            onCancel={() => setFeutreModalOpen(false)}
            onSubmit={handleAddFeutre}
            title="Ajouter au stock"
            palette={palette}
            customPacks={customPacks}
            feutres={feutres}
          />
        </Modal>
      )}
      {packModalOpen && (
        <Modal
          title="Ajouter un pack entier"
          onClose={() => setPackModalOpen(false)}
          width={640}
        >
          <PackForm
            onCancel={() => setPackModalOpen(false)}
            onSubmit={handleAddPack}
            title="Générer le pack"
            palette={palette}
            customPacks={customPacks}
          />
        </Modal>
      )}
    </div>
  );
}
