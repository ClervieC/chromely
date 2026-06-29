import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Layers, Heart, PenTool, Package, Copy, AlertTriangle, ChevronRight, FolderOpen } from "lucide-react";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { BRAND_COLOR, MARQUES_NUMERO_UNIVERSEL } from "../data.js";
import { FeutreCap, EmptyState, Modal, SkeletonCard } from "../components/ui.jsx";
import { FeutreForm } from "../components/FeutreForm.jsx";
import { PackForm } from "../components/PackForm.jsx";

export default function DashboardPage() {
  const { feutres, wishlist, palette, customPacks, customBrands, loading, addFeutre, bulkPack } = useData();

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
    // Packs distincts possédés, enrichis de l'imageUrl si disponible (matching normalisé)
    const customPackIndex = {};
    customPacks.forEach((cp) => {
      const k = `${cp.marque.trim().toLowerCase()}::${cp.nom.trim().toLowerCase()}`;
      customPackIndex[k] = cp;
    });
    const packsMap = {};
    feutres.forEach((f) => {
      if (f.pack) {
        const key = `${f.marque}::${f.pack}`;
        if (!packsMap[key]) {
          const lookupKey = `${f.marque.trim().toLowerCase()}::${f.pack.trim().toLowerCase()}`;
          const cp = customPackIndex[lookupKey];
          packsMap[key] = { marque: f.marque, nom: f.pack, count: 0, imageUrl: cp?.imageUrl || null };
        }
        packsMap[key].count += f.quantite || 1;
      }
    });
    const packs = Object.values(packsMap).sort((a, b) => b.count - a.count);
    return {
      totalUnites,
      totalRef: feutres.length,
      totalPacks: packs.length,
      packs,
      parMarque,
      doublons: feutres.filter((f) => {
        if (f.quantite > 1) return true;
        const universel = MARQUES_NUMERO_UNIVERSEL.includes(f.marque);
        return feutres.some(
          (g) => g.id !== f.id && g.marque === f.marque && g.pack !== f.pack &&
            (universel ? g.numero === f.numero : g.hex && f.hex && g.hex.toLowerCase() === f.hex.toLowerCase()),
        );
      }).length,
      panne: feutres.filter((f) => f.etat !== "fonctionne").length,
      envies: wishlist.length,
    };
  }, [feutres, wishlist, customPacks]);

  const vitrine = useMemo(() => [...feutres].filter((f) => f.hex).slice(0, 32), [feutres]);
  const maxMarque = Math.max(1, ...Object.values(stats.parMarque));

  if (loading)
    return (
      <div className="view dash-view">
        <div className="skeleton sk-hero" />
        <div className="dash-stat-grid">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton sk-stat-card" />)}
        </div>
        <div className="feutre-grid">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );

  async function handleAddFeutre(entries) {
    try {
      await addFeutre(entries[0]);
      toast.success("Feutre ajouté à ton stock");
      setFeutreModalOpen(false);
    } catch (e) { toast.error(e.message); }
  }

  async function handleAddPack(values) {
    try {
      const { added, incremented, matched } = await bulkPack(values);
      const parts = [];
      if (added) parts.push(`${added} feutre${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}`);
      if (matched && matched === added) parts.push(`couleurs depuis la palette ✓`);
      else if (matched) parts.push(`${matched} couleur${matched > 1 ? "s" : ""} retrouvée${matched > 1 ? "s" : ""}`);
      if (incremented) parts.push(`${incremented} doublon${incremented > 1 ? "s" : ""}`);
      toast.success(parts.join(" · ") || "Pack traité");
      setPackModalOpen(false);
      navigate("/stock");
    } catch (e) { toast.error(e.message); }
  }

  const STAT_CARDS = [
    {
      value: stats.totalUnites,
      sub: `${stats.totalRef} référence${stats.totalRef > 1 ? "s" : ""}`,
      label: "en stock",
      icon: Package,
      color: "#4f46e5",
      bg: "rgba(79,70,229,0.09)",
      route: "/stock",
    },
    {
      value: stats.totalPacks,
      label: stats.totalPacks > 1 ? "packs" : "pack",
      sub: "dans ton inventaire",
      icon: Layers,
      color: "#0F766E",
      bg: "rgba(15,118,110,0.09)",
      route: "/packs",
    },
    {
      value: stats.doublons,
      label: "en double",
      icon: Copy,
      color: "#7C5CBF",
      bg: "rgba(124,92,191,0.09)",
      route: "/doublons",
    },
    {
      value: stats.panne,
      label: "en panne",
      icon: AlertTriangle,
      color: "#C1452D",
      bg: "rgba(193,69,45,0.09)",
      route: "/panne",
    },
    {
      value: stats.envies,
      label: "envies",
      icon: Heart,
      color: "#E8B339",
      bg: "rgba(232,179,57,0.09)",
      route: "/envies",
    },
  ];

  return (
    <div className="view dash-view">

      {/* ── Bannière hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-bg" />
        <div className="dash-hero-content">
          <div className="dash-hero-text">
            <h1 className="display dash-title">Chromely</h1>
            <p className="dash-sub">Ton inventaire de feutres &amp; marqueurs</p>
          </div>
          <div className="dash-hero-actions">
            <button className="btn btn-hero-primary" onClick={() => setFeutreModalOpen(true)}>
              <Plus size={15} /> Feutre
            </button>
            <button className="btn btn-hero-ghost" onClick={() => setPackModalOpen(true)}>
              <Layers size={15} /> Pack
            </button>
            <button className="btn btn-hero-ghost" onClick={() => navigate("/envies")}>
              <Heart size={15} /> Envie
            </button>
          </div>
        </div>

        {/* Vitrine couleurs dans le hero */}
        {vitrine.length > 0 && (
          <div className="dash-vitrine">
            {vitrine.map((f) => (
              <div
                key={f.id}
                className="dash-vitrine-dot"
                style={{ background: f.hex }}
                title={f.nom || f.numero || ""}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="dash-stat-grid">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.label} className="dash-stat-card" onClick={() => navigate(s.route)}>
              <div className="dash-stat-icon" style={{ background: s.bg, color: s.color }}>
                <Icon size={18} />
              </div>
              <div className="dash-stat-body">
                <span className="dash-stat-number" style={{ color: s.color }}>{s.value}</span>
                <span className="dash-stat-label">{s.label}</span>
                {s.sub && <span className="dash-stat-sub">{s.sub}</span>}
              </div>
              <ChevronRight size={16} className="dash-stat-arrow" />
            </button>
          );
        })}
      </div>

      {/* ── Répartition par marque ── */}
      {Object.keys(stats.parMarque).length > 0 && (
        <div className="dash-panel">
          <h3 className="dash-panel-title">Répartition par marque</h3>
          <div className="bar-list">
            {Object.entries(stats.parMarque)
              .sort(([, a], [, b]) => b - a)
              .map(([m, n]) => (
                <div className="bar-row" key={m}>
                  <span className="bar-label" style={{ color: BRAND_COLOR[m] || BRAND_COLOR.Autre }}>
                    {m}
                  </span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(n / maxMarque) * 100}%`, background: BRAND_COLOR[m] || BRAND_COLOR.Autre }}
                    />
                  </div>
                  <span className="bar-value mono">{n}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Mes packs ── */}
      {stats.packs.length > 0 && (
        <div className="dash-panel">
          <h3 className="dash-panel-title">Mes packs</h3>
          <div className="dash-packs-list">
            {stats.packs.map((p) => {
              const brand = BRAND_COLOR[p.marque] || BRAND_COLOR.Autre;
              return (
                <div key={`${p.marque}::${p.nom}`} className="dash-pack-row" onClick={() => navigate("/packs")}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.nom} className="dash-pack-thumb" />
                  ) : (
                    <div className="dash-pack-dot" style={{ background: brand }} />
                  )}
                  <div className="dash-pack-info">
                    <span className="dash-pack-nom">{p.nom}</span>
                    <span className="dash-pack-marque" style={{ color: brand }}>{p.marque}</span>
                  </div>
                  <span className="dash-pack-count">{p.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {feutres.length === 0 && (
        <EmptyState
          icon={PenTool}
          title="Ta vitrine est vide"
          text="Ajoute ton premier feutre pour commencer ton inventaire."
          actionLabel="Ajouter un feutre"
          onAction={() => setFeutreModalOpen(true)}
        />
      )}

      {feutreModalOpen && (
        <Modal title="Ajouter un feutre" onClose={() => setFeutreModalOpen(false)} width={640}>
          <FeutreForm
            onCancel={() => setFeutreModalOpen(false)}
            onSubmit={handleAddFeutre}
            title="Ajouter au stock"
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
    </div>
  );
}
