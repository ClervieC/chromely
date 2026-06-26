import { useEffect, useState } from "react";
import { ClipboardList, Clock, CheckCircle, XCircle } from "lucide-react";
import { api } from "../api.js";
import { EmptyState, Tag, Spinner } from "../components/ui.jsx";

const STATUS = {
  pending:  { label: "En attente", color: "#E8B339", icon: Clock },
  approved: { label: "Approuvée",  color: "#2F8F9D", icon: CheckCircle },
  rejected: { label: "Refusée",    color: "#C1452D", icon: XCircle },
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState(null);

  useEffect(() => {
    api.getMyProposals().then((data) => setProposals(data.proposals));
  }, []);

  if (proposals === null)
    return <div className="full-page-loader"><Spinner /></div>;

  return (
    <div className="view">
      <div className="page-header" style={{ "--page-color": "#0F766E" }}>
        <div className="page-header-inner">
          <div className="page-header-text">
            <h1 className="display page-header-title">Mes propositions</h1>
            <p className="page-header-sub">
              Propose une couleur depuis la page Palette, ou un nouveau pack depuis le Catalogue.
            </p>
          </div>
          {proposals.length > 0 && (
            <span className="page-header-count">{proposals.length}</span>
          )}
        </div>
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
            const s = STATUS[p.status] || STATUS.pending;
            const Icon = s.icon;
            return (
              <div className="proposal-card" key={p.id}>
                <div className="proposal-card-icon" style={{ color: s.color, background: `${s.color}18` }}>
                  <Icon size={16} />
                </div>
                <div className="proposal-card-body">
                  <div className="proposal-card-title">
                    {p.type === "new_pack" ? "Nouveau pack" : "Correction de couleur"}
                    {" — "}
                    <span className="mono">{p.marque} {p.pack}{p.numero ? ` n°${p.numero}` : ""}</span>
                  </div>
                  {p.type === "color_correction" && (p.nomPropose || p.hexPropose) && (
                    <div className="proposal-card-detail">
                      {p.hexPropose && (
                        <span className="proposal-hex-dot" style={{ background: p.hexPropose }} />
                      )}
                      Proposé : {p.nomPropose || "—"}{p.hexPropose && <span className="mono"> ({p.hexPropose})</span>}
                    </div>
                  )}
                  {p.justification && <div className="proposal-card-detail">{p.justification}</div>}
                  {p.reviewNote && (
                    <div className="proposal-card-detail proposal-review-note">Note admin : {p.reviewNote}</div>
                  )}
                </div>
                <Tag color={s.color}>{s.label}</Tag>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
