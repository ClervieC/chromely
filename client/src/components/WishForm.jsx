import { useState } from "react";
import { MARQUES, PRIORITES, mergedPackNames } from "../data.js";
import { Field } from "./ui.jsx";

export function WishForm({ initial, onCancel, onSubmit, title, customPacks }) {
  const [marque, setMarque] = useState(initial?.marque || "GuangNa");
  const [marqueAutre, setMarqueAutre] = useState(
    initial && !MARQUES.includes(initial.marque) ? initial.marque : "",
  );
  const [pack, setPack] = useState(initial?.pack || "");
  const [couleur, setCouleur] = useState(initial?.couleur || "");
  const [priorite, setPriorite] = useState(initial?.priorite || "moyenne");
  const [prix, setPrix] = useState(initial?.prix ?? "");
  const [lien, setLien] = useState(initial?.lien || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");

  const marqueFinale = marque === "Autre" ? marqueAutre || "Autre" : marque;
  const suggestions = mergedPackNames(marqueFinale, customPacks);

  function handleSubmit() {
    if (!pack.trim()) {
      setError("Indique au moins le pack ou la collection que tu souhaites.");
      return;
    }
    onSubmit({
      marque: marqueFinale,
      pack: pack.trim(),
      couleur: couleur.trim(),
      priorite,
      prix: prix === "" ? "" : Number(prix),
      lien: lien.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <>
      <div className="form-grid">
        <Field label="Marque">
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
        <Field label="Pack / collection souhaité">
          <input
            className="input"
            list="wish-pack-suggestions"
            value={pack}
            onChange={(e) => setPack(e.target.value)}
            placeholder="Ex : Tooli-Art Neon (24)"
          />
          <datalist id="wish-pack-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Couleur précise (optionnel)">
          <input
            className="input"
            value={couleur}
            onChange={(e) => setCouleur(e.target.value)}
            placeholder="Ex : juste le rose n°5"
          />
        </Field>
        <Field label="Priorité">
          <select
            className="input"
            value={priorite}
            onChange={(e) => setPriorite(e.target.value)}
          >
            {Object.entries(PRIORITES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prix estimé (optionnel)">
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="€"
          />
        </Field>
        <Field label="Lien (optionnel)">
          <input
            className="input"
            value={lien}
            onChange={(e) => setLien(e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          className="input textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Pourquoi cette envie ?"
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
