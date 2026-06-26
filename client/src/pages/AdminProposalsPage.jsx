import { useEffect, useState } from "react";
import { ShieldCheck, Check, X, Clock } from "lucide-react";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";
import { EmptyState, Spinner, Tag } from "../components/ui.jsx";

const FILTERS = [
  { value: "pending",  label: "En attente" },
  { value: "approved", label: "Approuvées" },
  { value: "rejected", label: "Refusées" },
  { value: "all",      label: "Toutes" },
];

export default function AdminProposalsPage() {
  const toast = useToast();
  const [proposals, setProposals] = useState(null);
  const [filter, setFilter] = useState("pending");

  async function load() {
    const data = await api.getAllProposals(filter === "all" ? null : filter);
    setProposals(data.proposals);
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApprove(p) {
    try {
      await api.approveProposal(p.id);
      toast.success("Proposition approuvée et appliquée");
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function handleReject(p) {
    try {
      await api.rejectProposal(p.id);
      toast.success("Proposition refusée");
      load();
    } catch (e) { toast.error(e.message); }
  }

  if (proposals === null)
    return <div className="full-page-loader"><Spinner /></div>;

  return (
    <div className="view">
      <div className="page-header" style={{ "--page-color": "#7C5CBF" }}>
        <div className="page-header-inner">
          <div className="page-header-text">
            <h1 className="display page-header-title">Propositions</h1>
            <p className="page-header-sub">Valide ou refuse les contributions de la communauté.</p>
          </div>
          {proposals.length > 0 && filter === "pending" && (
            <span className="page-header-count page-header-count-warning">{proposals.length}</span>
          )}
        </div>
      </div>

      {/* Onglets filtre */}
      <div className="tab-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={"tab-btn" + (filter === f.value ? " active" : "")}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {proposals.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Rien à valider" text="Aucune proposition dans cette catégorie." />
      ) : (
        <div className="proposal-list">
          {proposals.map((p) => (
            <div className="proposal-card" key={p.id}>
              <div className="proposal-card-icon" style={{ color: "#4f46e5", background: "rgba(79,70,229,0.09)" }}>
                <Clock size={16} />
              </div>
              <div className="proposal-card-body">
                <div className="proposal-card-title">
                  {p.type === "new_pack" ? "Nouveau pack" : "Correction de couleur"}
                  {" — "}
                  <span className="mono">{p.marque} {p.pack}{p.numero ? ` n°${p.numero}` : ""}</span>
                </div>
                <div className="proposal-card-detail">Par <strong>{p.authorPseudo}</strong></div>
                {p.type === "color_correction" && (p.nomPropose || p.hexPropose) && (
                  <div className="proposal-card-detail">
                    {p.hexPropose && (
                      <span className="proposal-hex-dot" style={{ background: p.hexPropose }} />
                    )}
                    {p.nomPropose || "—"}{p.hexPropose && <span className="mono"> ({p.hexPropose})</span>}
                  </div>
                )}
                {p.type === "new_pack" && p.taille && (
                  <div className="proposal-card-detail">{p.taille} feutres{p.detail ? ` — ${p.detail}` : ""}</div>
                )}
                {p.justification && <div className="proposal-card-detail">{p.justification}</div>}
              </div>
              {p.status === "pending" ? (
                <div className="proposal-card-actions">
                  <button type="button" className="btn btn-primary btn-small" onClick={() => handleApprove(p)}>
                    <Check size={13} /> Approuver
                  </button>
                  <button type="button" className="btn btn-ghost btn-small" onClick={() => handleReject(p)}>
                    <X size={13} /> Refuser
                  </button>
                </div>
              ) : (
                <Tag color={p.status === "approved" ? "#2F8F9D" : "#C1452D"}>
                  {p.status === "approved" ? "Approuvée" : "Refusée"}
                </Tag>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
