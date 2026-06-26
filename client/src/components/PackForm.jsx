import { useMemo, useState } from "react";
import { MARQUES, mergedPackNames, extractCountFromPackName } from "../data.js";
import { Field } from "./ui.jsx";

export function PackForm({ onCancel, onSubmit, title, customPacks, customBrands }) {
  const allMarques = useMemo(() => {
    const known = new Set(MARQUES.filter((m) => m !== "Autre"));
    (customBrands || []).forEach((b) => known.add(b.nom));
    (customPacks || []).forEach((p) => { if (p.marque) known.add(p.marque); });
    return [...known, "Autre"];
  }, [customBrands, customPacks]);

  const [marque, setMarque] = useState("GuangNa");
  const [marqueAutre, setMarqueAutre] = useState("");
  const [pack, setPack] = useState("");
  const [dateAchat, setDateAchat] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const marqueFinale = marque === "Autre" ? marqueAutre || "Autre" : marque;
  const suggestions = mergedPackNames(marqueFinale, customPacks);

  const taille = useMemo(() => {
    const customMatch = (customPacks || []).find(
      (p) => p.marque === marqueFinale && p.nom === pack.trim() && p.taille,
    );
    if (customMatch) return customMatch.taille;
    return extractCountFromPackName(pack) || null;
  }, [pack, marqueFinale, customPacks]);

  function handleSubmit() {
    if (!pack.trim()) { setError("Indique le nom du pack à ajouter."); return; }
    if (!taille) { setError("Impossible de détecter le nombre de feutres depuis le nom du pack. Renomme-le avec le nombre dedans (ex : \"72 couleurs\")."); return; }
    onSubmit({
      marque: marqueFinale,
      pack: pack.trim(),
      taille,
      depart: 1,
      dateAchat: dateAchat || null,
      notes: notes.trim(),
    });
  }

  return (
    <>
      <div className="form-grid">
        <Field label="Marque">
          <select className="input" value={marque} onChange={(e) => setMarque(e.target.value)}>
            {allMarques.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        {marque === "Autre" && (
          <Field label="Nom de la marque">
            <input className="input" value={marqueAutre} onChange={(e) => setMarqueAutre(e.target.value)} />
          </Field>
        )}
        <Field label="Pack">
          <select className="input" value={pack} onChange={(e) => setPack(e.target.value)}>
            <option value="">— Choisir un pack —</option>
            {suggestions.map((s) => <option key={s} value={s}>{s}</option>)}
            {pack && !suggestions.includes(pack) && <option value={pack}>{pack}</option>}
          </select>
        </Field>
        <Field label="Date d'achat (optionnel)">
          <input
            type="date"
            className="input"
            value={dateAchat}
            onChange={(e) => setDateAchat(e.target.value)}
          />
        </Field>
      </div>

      {pack.trim() && (
        <div className="palette-match-hint">
          {taille
            ? <span>Ce pack contient <strong>{taille} feutres</strong> (numéros 1 à {taille}).</span>
            : <span style={{ color: "#C1452D" }}>Nombre de feutres non détecté — inclus le nombre dans le nom du pack (ex : "72 couleurs").</span>
          }
        </div>
      )}

      <Field label="Notes (optionnel)">
        <textarea
          className="input textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Toute remarque sur ce pack..."
        />
      </Field>
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>{title}</button>
      </div>
    </>
  );
}
