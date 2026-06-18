import { useMemo, useState } from "react";
import {
  MARQUES,
  mergedPackNames,
  extractCountFromPackName,
  paletteKey,
} from "../data.js";
import { Field } from "./ui.jsx";

export function PackForm({ onCancel, onSubmit, title, palette, customPacks }) {
  const [marque, setMarque] = useState("GuangNa");
  const [marqueAutre, setMarqueAutre] = useState("");
  const [pack, setPack] = useState("");
  const [taille, setTaille] = useState(24);
  const [depart, setDepart] = useState(1);
  const [dateAchat, setDateAchat] = useState("");
  const [prixTotal, setPrixTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const marqueFinale = marque === "Autre" ? marqueAutre || "Autre" : marque;
  const suggestions = mergedPackNames(marqueFinale, customPacks);

  const paletteMap = useMemo(() => {
    const map = {};
    (palette || []).forEach((p) => {
      map[paletteKey(p.marque, p.pack, p.numero)] = p;
    });
    return map;
  }, [palette]);

  const matchPreview = useMemo(() => {
    if (!pack.trim()) return 0;
    const n = Number(taille) || 0;
    const start = Number(depart) || 1;
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (paletteMap[paletteKey(marqueFinale, pack.trim(), String(start + i))])
        count++;
    }
    return count;
  }, [pack, taille, depart, marqueFinale, paletteMap]);

  function handlePackChange(value) {
    setPack(value);
    const customMatch = (customPacks || []).find(
      (p) => p.marque === marqueFinale && p.nom === value && p.taille,
    );
    if (customMatch) {
      setTaille(customMatch.taille);
      return;
    }
    const guess = extractCountFromPackName(value);
    if (guess) setTaille(guess);
  }

  function handleSubmit() {
    if (!pack.trim()) {
      setError("Indique le nom du pack à ajouter.");
      return;
    }
    const n = Number(taille);
    if (!n || n < 1 || n > 999) {
      setError("Indique un nombre de feutres valide (entre 1 et 999).");
      return;
    }
    onSubmit({
      marque: marqueFinale,
      pack: pack.trim(),
      taille: n,
      depart: Number.isFinite(Number(depart)) ? Number(depart) : 1,
      dateAchat: dateAchat || null,
      prixTotal: prixTotal === "" ? "" : Number(prixTotal),
      notes: notes.trim(),
    });
  }

  return (
    <>
      <p className="form-intro">
        Génère en une fois toutes les cases du pack. Si une case existe déjà
        (même marque, même pack, même numéro), elle est comptée comme un doublon
        (quantité +1) au lieu d'être recréée.
      </p>
      {matchPreview > 0 && (
        <p className="form-hint-positive">
          🎨 {matchPreview} couleur(s) sur {Number(taille) || 0} seront
          retrouvées automatiquement grâce à la palette.
        </p>
      )}
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
        <Field
          label="Pack"
          hint="Choisis un pack connu pour pré-remplir le nombre de feutres"
        >
          <input
            className="input"
            list="pack-form-suggestions"
            value={pack}
            onChange={(e) => handlePackChange(e.target.value)}
            placeholder="Ex : 240 couleurs"
          />
          <datalist id="pack-form-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Nombre de feutres dans le pack">
          <input
            type="number"
            min="1"
            max="999"
            className="input"
            value={taille}
            onChange={(e) => setTaille(e.target.value)}
          />
        </Field>
        <Field label="Numéro de départ" hint="1 dans la plupart des packs">
          <input
            type="number"
            className="input"
            value={depart}
            onChange={(e) => setDepart(e.target.value)}
          />
        </Field>
        <Field label="Date d'achat (optionnel)">
          <input
            type="date"
            className="input"
            value={dateAchat}
            onChange={(e) => setDateAchat(e.target.value)}
          />
        </Field>
        <Field label="Prix total du pack (optionnel)">
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={prixTotal}
            onChange={(e) => setPrixTotal(e.target.value)}
            placeholder="€"
          />
        </Field>
      </div>
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
