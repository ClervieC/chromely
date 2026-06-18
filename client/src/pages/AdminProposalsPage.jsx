import { useEffect, useState } from "react";
import { ShieldCheck, Check, X } from "lucide-react";
import { api } from "../api.js";
import { useToast } from "../components/Toast.jsx";
import { EmptyState, Spinner } from "../components/ui.jsx";

export default function AdminProposalsPage() {
  const toast = useToast();
  const [proposals, setProposals] = useState(null);
  const [filter, setFilter] = useState("pending");

  async function load() {
    const data = await api.getAllProposals(filter === "all" ? null : filter);
    setProposals(data.proposals);
  }

  useEffect(() => {
    load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApprove(p) {
    try {
      await api.approveProposal(p.id);
      toast.success("Proposition approuvée et appliquée");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleReject(p) {
    try {
      await api.rejectProposal(p.id);
      toast.success("Proposition refusée");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (proposals === null)
    return (
      <div className="full-page-loader">
        <Spinner />
      </div>
    );

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">Validation des propositions</h2>
        <select
          className="input input-compact"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
          <option value="all">Toutes</option>
        </select>
      </div>
      {proposals.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Rien à valider"
          text="Aucune proposition dans cette catégorie pour le moment."
        />
      ) : (
        <div className="proposal-list">
          {proposals.map((p) => (
            <div className="proposal-row" key={p.id}>
              <div>
                <div className="proposal-title">
                  {p.type === "new_pack"
                    ? "Nouveau pack"
                    : "Correction de couleur"}{" "}
                  — {p.marque} {p.pack}
                  {p.numero && ` (n°${p.numero})`}
                </div>
                <div className="proposal-detail">
                  Proposé par {p.authorPseudo}
                </div>
                {p.type === "color_correction" && (
                  <div className="proposal-detail">
                    {p.nomPropose || "—"}{" "}
                    {p.hexPropose && (
                      <span className="mono">
                        ({p.hexPropose}){" "}
                        <span
                          style={{
                            display: "inline-block",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: p.hexPropose,
                            marginLeft: 4,
                            verticalAlign: "middle",
                          }}
                        />
                      </span>
                    )}
                  </div>
                )}
                {p.type === "new_pack" && p.taille && (
                  <div className="proposal-detail">
                    {p.taille} feutres. {p.detail}
                  </div>
                )}
                {p.justification && (
                  <div className="proposal-detail">{p.justification}</div>
                )}
              </div>
              {p.status === "pending" ? (
                <div className="proposal-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => handleApprove(p)}
                  >
                    <Check size={13} /> Approuver
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-small"
                    onClick={() => handleReject(p)}
                  >
                    <X size={13} /> Refuser
                  </button>
                </div>
              ) : (
                <span
                  className={"tag " + (p.status === "approved" ? "" : "")}
                  style={{
                    background: p.status === "approved" ? "#2F8F9D" : "#C1452D",
                    color: "#fff",
                  }}
                >
                  {p.status === "approved" ? "Approuvée" : "Refusée"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
