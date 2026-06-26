import { useMemo, useState } from "react";
import { Field } from "./ui.jsx";
import { MARQUES } from "../data.js";

export function ProposalForm({ type, initial, onCancel, onSubmit, title, customBrands, customPacks }) {
  const allMarques = useMemo(() => {
    const known = new Set(MARQUES.filter((m) => m !== "Autre"));
    (customBrands || []).forEach((b) => known.add(b.nom));
    (customPacks || []).forEach((p) => { if (p.marque) known.add(p.marque); });
    return [...known, "Autre"];
  }, [customBrands, customPacks]);

  const [marque, setMarque] = useState(initial?.marque || "GuangNa");
  const [marqueAutre, setMarqueAutre] = useState(
    initial && !allMarques.includes(initial.marque) ? initial.marque : "",
  );
  const [pack, setPack] = useState(initial?.pack || "");
  const [numero, setNumero] = useState(initial?.numero || "");
  const [nomPropose, setNomPropose] = useState(initial?.nomPropose || "");
  const [hexPropose, setHexPropose] = useState(initial?.hexPropose || "");
  const [taille, setTaille] = useState(initial?.taille || "");
  const [detail, setDetail] = useState(initial?.detail || "");
  const [justification, setJustification] = useState("");
  const [error, setError] = useState("");

  const marqueFinale = marque === "Autre" ? marqueAutre || "Autre" : marque;

  function handleSubmit() {
    if (!pack.trim()) {
      setError("Le nom du pack est requis.");
      return;
    }
    if (type === "color_correction" && !numero.trim()) {
      setError("Le numéro du feutre est requis.");
      return;
    }
    onSubmit({
      type,
      marque: marqueFinale,
      pack: pack.trim(),
      numero: numero.trim(),
      nomPropose: nomPropose.trim(),
      hexPropose,
      taille: taille ? Number(taille) : null,
      detail: detail.trim(),
      justification: justification.trim(),
    });
  }

  return (
    <>
      <p className="form-intro">
        {type === "new_pack"
          ? "Propose un pack qui n'est pas encore dans le catalogue. L'admin validera avant qu'il apparaisse pour tout le monde."
          : "Propose une couleur (nouvelle ou corrigée) pour ce numéro. L'admin validera avant qu'elle soit appliquée à la palette partagée."}
      </p>
      <div className="form-grid">
        <Field label="Marque">
          <select
            className="input"
            value={marque}
            onChange={(e) => setMarque(e.target.value)}
          >
            {allMarques.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        {marque === "Autre" && (
          <Field label="Nom de la marque">
            <input
              className="input"
              value={marqueAutre}
              onChange={(e) => setMarqueAutre(e.target.value)}
            />
          </Field>
        )}
        <Field label="Pack">
          <input
            className="input"
            value={pack}
            onChange={(e) => setPack(e.target.value)}
            placeholder="Ex : 240 couleurs"
          />
        </Field>
        {type === "new_pack" && (
          <Field label="Nombre de feutres (optionnel)">
            <input
              type="number"
              min="1"
              className="input"
              value={taille}
              onChange={(e) => setTaille(e.target.value)}
            />
          </Field>
        )}
        {type === "color_correction" && (
          <>
            <Field label="Numéro / code">
              <input
                className="input mono"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex : 042"
              />
            </Field>
            <Field label="Nom proposé (optionnel)">
              <input
                className="input"
                value={nomPropose}
                onChange={(e) => setNomPropose(e.target.value)}
                placeholder="Ex : Bleu lagon"
              />
            </Field>
            <Field label="Couleur proposée">
              <div className="color-row">
                <input
                  type="color"
                  className="color-input"
                  value={hexPropose || "#cccccc"}
                  onChange={(e) => setHexPropose(e.target.value)}
                />
                <input
                  className="input mono"
                  value={hexPropose}
                  onChange={(e) => setHexPropose(e.target.value)}
                  placeholder="#RRGGBB"
                />
              </div>
            </Field>
          </>
        )}
      </div>
      {type === "new_pack" && (
        <Field label="Détail (optionnel)">
          <input
            className="input"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Ex : nouvelle sortie 2026"
          />
        </Field>
      )}
      <Field label="Justification (optionnel)">
        <textarea
          className="input textarea"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Pourquoi cette proposition ? (photo, lien, comparaison...)"
        />
      </Field>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annuler
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
        >
          {title}
        </button>
      </div>
    </>
  );
}
