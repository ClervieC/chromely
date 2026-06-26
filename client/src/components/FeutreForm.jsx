import { useMemo, useState } from "react";
import { MARQUES, ETATS, mergedPackNames, paletteKey, MARQUES_NUMERO_UNIVERSEL } from "../data.js";
import { Field } from "./ui.jsx";

export function FeutreForm({ initial, onCancel, onSubmit, title, palette, customPacks, customBrands, feutres }) {
  const isEdit = !!initial?.id;
  const qty = initial?.quantite || 1;

  // Toutes les marques connues : hardcodées + custom brands + marques des customPacks
  const allMarques = useMemo(() => {
    const known = new Set(MARQUES.filter((m) => m !== "Autre"));
    (customBrands || []).forEach((b) => known.add(b.nom));
    (customPacks || []).forEach((p) => { if (p.marque) known.add(p.marque); });
    return [...known, "Autre"];
  }, [customBrands, customPacks]);

  const defaultMarque = initial?.marque || "GuangNa";
  const [marque, setMarque] = useState(
    allMarques.includes(defaultMarque) ? defaultMarque : (defaultMarque || "GuangNa")
  );
  const [marqueAutre, setMarqueAutre] = useState(
    initial && !MARQUES.includes(initial.marque) && !(customBrands || []).some(b => b.nom === initial.marque)
      ? initial.marque : "",
  );
  const [pack, setPack] = useState(initial?.pack || "");
  const [numero, setNumero] = useState(initial?.numero || "");
  const [quantite, setQuantite] = useState(qty);
  const [etat, setEtat] = useState(initial?.etat || "fonctionne");
  // En mode édition avec plusieurs exemplaires : un état par exemplaire
  const [etatsParExemplaire, setEtatsParExemplaire] = useState(
    () => Array.from({ length: qty }, () => initial?.etat || "fonctionne")
  );
  const [dateAchat, setDateAchat] = useState(
    initial?.dateAchat ? initial.dateAchat.slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(initial?.notes || "");
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

  const autoMatch =
    numero.trim() && pack.trim()
      ? paletteMap[paletteKey(marqueFinale, pack.trim(), numero.trim())]
      : null;

  const doublonsAutresPacks = useMemo(() => {
    if (!feutres || !numero.trim()) return [];
    const numeroUniversel = MARQUES_NUMERO_UNIVERSEL.includes(marqueFinale);
    if (numeroUniversel) {
      return feutres.filter(
        (f) =>
          f.marque === marqueFinale &&
          f.numero === numero.trim() &&
          f.pack !== pack.trim() &&
          f.id !== initial?.id,
      );
    } else {
      if (!autoMatch?.hex) return [];
      const hex = autoMatch.hex.toLowerCase();
      return feutres.filter(
        (f) =>
          f.marque === marqueFinale &&
          f.hex?.toLowerCase() === hex &&
          !(f.pack === pack.trim() && f.numero === numero.trim()) &&
          f.id !== initial?.id,
      );
    }
  }, [autoMatch, feutres, marqueFinale, pack, numero, initial]);

  function setEtatExemplaire(i, val) {
    setEtatsParExemplaire((prev) => prev.map((e, idx) => (idx === i ? val : e)));
  }

  function handleSubmit() {
    if (!numero.trim()) {
      setError("Renseigne le numéro du feutre.");
      return;
    }
    const base = {
      marque: marqueFinale,
      pack: pack.trim(),
      numero: numero.trim(),
      nom: autoMatch?.nom || initial?.nom || null,
      hex: autoMatch?.hex || initial?.hex || null,
      dateAchat: dateAchat || null,
      notes: notes.trim(),
    };

    if (isEdit && qty > 1) {
      // Regroupe les exemplaires par état et retourne un tableau d'entrées
      const groups = {};
      etatsParExemplaire.forEach((e) => { groups[e] = (groups[e] || 0) + 1; });
      const entries = Object.entries(groups).map(([e, q]) => ({ ...base, etat: e, quantite: q }));
      onSubmit(entries);
    } else {
      onSubmit([{ ...base, etat, quantite: Math.max(1, Number(quantite) || 1) }]);
    }
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
            <input className="input" value={marqueAutre} onChange={(e) => setMarqueAutre(e.target.value)} placeholder="Ex : Languo" />
          </Field>
        )}
        <Field label="Pack">
          <select className="input" value={pack} onChange={(e) => setPack(e.target.value)}>
            <option value="">— Choisir un pack —</option>
            {suggestions.map((s) => <option key={s} value={s}>{s}</option>)}
            {pack && !suggestions.includes(pack) && <option value={pack}>{pack}</option>}
          </select>
        </Field>
        <Field label="Numéro">
          <input className="input mono" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex : 042" />
        </Field>

        {/* En ajout : champ quantité + un seul état */}
        {!isEdit && (
          <>
            <Field label="Quantité">
              <input type="number" min="1" className="input" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
            </Field>
            <Field label="État">
              <select className="input" value={etat} onChange={(e) => setEtat(e.target.value)}>
                {Object.entries(ETATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
          </>
        )}

        <Field label="Date d'achat (optionnel)">
          <input type="date" className="input" value={dateAchat} onChange={(e) => setDateAchat(e.target.value)} />
        </Field>
      </div>

      {/* En édition avec plusieurs exemplaires : un état par exemplaire */}
      {isEdit && qty > 1 && (
        <div className="field" style={{ marginTop: 12 }}>
          <span className="field-label">État de chaque exemplaire ({qty})</span>
          <div className="exemplaires-list">
            {etatsParExemplaire.map((e, i) => (
              <div key={i} className="exemplaire-row">
                <span className="exemplaire-num">#{i + 1}</span>
                <select className="input" value={e} onChange={(ev) => setEtatExemplaire(i, ev.target.value)}>
                  {Object.entries(ETATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* En édition avec un seul exemplaire : état simple */}
      {isEdit && qty === 1 && (
        <Field label="État">
          <select className="input" value={etat} onChange={(e) => setEtat(e.target.value)}>
            {Object.entries(ETATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
      )}

      {autoMatch && (
        <div className="palette-match-hint">
          <div className="palette-match-swatch" style={{ background: autoMatch.hex || "#ccc" }} />
          <span>Couleur connue{autoMatch.nom ? ` — ${autoMatch.nom}` : ""} ({autoMatch.hex || "sans hex"})</span>
        </div>
      )}

      {doublonsAutresPacks.length > 0 && (
        <div className="doublon-warning">
          <strong>Ce feutre existe déjà dans ton stock{autoMatch?.hex ? ` (${autoMatch.hex})` : ""} :</strong>
          <ul>
            {doublonsAutresPacks.map((f) => (
              <li key={f.id}>{f.pack || "pack inconnu"} — n°{f.numero || "?"}{f.nom ? ` (${f.nom})` : ""} × {f.quantite}</li>
            ))}
          </ul>
          <span>C'est peut-être le même feutre physique.</span>
        </div>
      )}

      <Field label="Notes (optionnel)">
        <textarea className="input textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Toute remarque utile..." />
      </Field>

      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>{title}</button>
      </div>
    </>
  );
}
