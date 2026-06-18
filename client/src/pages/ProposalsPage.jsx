import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { api } from "../api.js";
import { EmptyState, Tag, Spinner } from "../components/ui.jsx";

const STATUS_LABEL = {
  pending: { label: "En attente", color: "#E8B339" },
  approved: { label: "Approuvée", color: "#2F8F9D" },
  rejected: { label: "Refusée", color: "#C1452D" },
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState(null);

  useEffect(() => {
    api.getMyProposals().then((data) => setProposals(data.proposals));
  }, []);

  if (proposals === null)
    return (
      <div className="full-page-loader">
        <Spinner />
      </div>
    );

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">Mes propositions</h2>
        <p className="view-sub">
          Tu peux proposer une couleur depuis la page Palette, ou un nouveau
          pack depuis la page Catalogue.
        </p>
      </div>
      {proposals.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune proposition envoyée"
          text="Quand tu proposes une couleur ou un pack, tu retrouveras ici son statut de validation."
        />
      ) : (
        <div className="proposal-list">
          {proposals.map((p) => {
            const status = STATUS_LABEL[p.status];
            return (
              <div className="proposal-row" key={p.id}>
                <div>
                  <div className="proposal-title">
                    {p.type === "new_pack"
                      ? "Nouveau pack"
                      : "Correction de couleur"}{" "}
                    — {p.marque} {p.pack}
                    {p.numero && ` (n°${p.numero})`}
                  </div>
                  {p.type === "color_correction" &&
                    (p.nomPropose || p.hexPropose) && (
                      <div className="proposal-detail">
                        Proposé : {p.nomPropose || "—"}{" "}
                        {p.hexPropose && (
                          <span className="mono">({p.hexPropose})</span>
                        )}
                      </div>
                    )}
                  {p.justification && (
                    <div className="proposal-detail">{p.justification}</div>
                  )}
                  {p.reviewNote && (
                    <div className="proposal-detail">
                      Note de l'admin : {p.reviewNote}
                    </div>
                  )}
                </div>
                <Tag color={status.color}>{status.label}</Tag>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
