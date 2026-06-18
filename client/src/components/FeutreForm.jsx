import { useEffect, useMemo, useState } from "react";
import { MARQUES, ETATS, mergedPackNames, paletteKey } from "../data.js";
import { Field } from "./ui.jsx";

export function FeutreForm({
  initial,
  onCancel,
  onSubmit,
  title,
  palette,
  customPacks,
}) {
  const [marque, setMarque] = useState(initial?.marque || "GuangNa");
  const [marqueAutre, setMarqueAutre] = useState(
    initial && !MARQUES.includes(initial.marque) ? initial.marque : "",
  );
  const [pack, setPack] = useState(initial?.pack || "");
  const [numero, setNumero] = useState(initial?.numero || "");
  const [nom, setNom] = useState(initial?.nom || "");
  const [hex, setHex] = useState(initial?.hex || "");
  const [quantite, setQuantite] = useState(initial?.quantite || 1);
  const [etat, setEtat] = useState(initial?.etat || "fonctionne");
  const [compare, setCompare] = useState(initial?.compare || false);
  const [compareNotes, setCompareNotes] = useState(initial?.compareNotes || "");
  const [dateAchat, setDateAchat] = useState(
    initial?.dateAchat ? initial.dateAchat.slice(0, 10) : "",
  );
  const [prix, setPrix] = useState(initial?.prix ?? "");
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

  useEffect(() => {
    if (hex) return;
    if (autoMatch && autoMatch.hex) {
      setHex(autoMatch.hex);
      if (!nom && autoMatch.nom) setNom(autoMatch.nom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numero, pack, marqueFinale]);

  function handleSubmit() {
    if (!numero.trim() && !nom.trim()) {
      setError(
        "Renseigne au moins un numéro ou un nom de couleur pour identifier ce feutre.",
      );
      return;
    }
    onSubmit({
      marque: marqueFinale,
      pack: pack.trim(),
      numero: numero.trim(),
      nom: nom.trim(),
      hex,
      quantite: Math.max(1, Number(quantite) || 1),
      etat,
      compare,
      compareNotes: compareNotes.trim(),
      dateAchat: dateAchat || null,
      prix: prix === "" ? "" : Number(prix),
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
              placeholder="Ex : Languo"
            />
          </Field>
        )}
        <Field
          label="Pack"
          hint="Sélectionne dans la liste ou écris ton propre pack"
        >
          <input
            className="input"
            list="pack-suggestions"
            value={pack}
            onChange={(e) => setPack(e.target.value)}
            placeholder="Ex : 240 couleurs"
          />
          <datalist id="pack-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
        <Field label="Numéro / code">
          <input
            className="input mono"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ex : 042"
          />
        </Field>
        <Field label="Nom de la couleur (optionnel)">
          <input
            className="input"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Bleu lagon"
          />
        </Field>
        <Field label="Couleur (regarde ton feutre)">
          <div className="color-row">
            <input
              type="color"
              className="color-input"
              value={hex || "#cccccc"}
              onChange={(e) => setHex(e.target.value)}
            />
            <input
              className="input mono"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#RRGGBB"
            />
          </div>
          {autoMatch?.hex &&
            autoMatch.hex.toLowerCase() !== (hex || "").toLowerCase() && (
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setHex(autoMatch.hex);
                  if (!nom && autoMatch.nom) setNom(autoMatch.nom);
                }}
              >
                🎨 Couleur connue{autoMatch.nom ? ` « ${autoMatch.nom} »` : ""}{" "}
                — cliquer pour l'utiliser
              </button>
            )}
        </Field>
        <Field label="Quantité possédée">
          <input
            type="number"
            min="1"
            className="input"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
          />
        </Field>
        <Field label="État">
          <select
            className="input"
            value={etat}
            onChange={(e) => setEtat(e.target.value)}
          >
            {Object.entries(ETATS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
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
        <Field label="Prix payé (optionnel)">
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
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={compare}
          onChange={(e) => setCompare(e.target.checked)}
        />
        <span>Déjà comparé à d'autres packs / marques</span>
      </label>
      {compare && (
        <Field label="Résultat de la comparaison">
          <textarea
            className="input textarea"
            value={compareNotes}
            onChange={(e) => setCompareNotes(e.target.value)}
            placeholder="Ex : identique au Tooli-Art Earth Tones n°14"
          />
        </Field>
      )}
      <Field label="Notes">
        <textarea
          className="input textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Toute remarque utile..."
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
