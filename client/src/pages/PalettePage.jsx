import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Upload,
  Trash2,
  Palette as PaletteIcon,
  Loader2,
  Check,
  X,
  Send,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../api.js";
import { mergedPackNames } from "../data.js";
import { EmptyState, IconBtn, FeutreCap, Modal } from "../components/ui.jsx";
import { BRAND_COLOR } from "../data.js";
import { ProposalForm } from "../components/ProposalForm.jsx";

function PhotoImportPanel({ marque, pack, onImport }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResults(null);
    setError("");
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleAnalyze() {
    if (!file) {
      setError("Choisis d'abord une photo.");
      return;
    }
    if (!pack.trim()) {
      setError("Choisis d'abord un pack ci-dessus.");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.split(",")[1]);
        r.onerror = () => reject(new Error("Lecture impossible"));
        r.readAsDataURL(file);
      });
      const { results } = await api.analyzePhoto({
        base64,
        mediaType: file.type || "image/jpeg",
      });
      setResults(results);
    } catch (e) {
      setError(e.message || "Impossible d'analyser cette photo.");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateResult(i, field, value) {
    setResults((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }
  function removeResult(i) {
    setResults((prev) => prev.filter((_, idx) => idx !== i));
  }
  function handleValidate() {
    onImport(results.filter((r) => r.numero));
    setResults(null);
    setFile(null);
    setPreviewUrl("");
  }

  return (
    <div className="panel">
      <h3 style={{ marginTop: 0 }}>Importer depuis une photo</h3>
      <p className="view-sub">
        Prends une photo nette de tes feutres alignés ou d'un nuancier, pour le
        pack {pack ? <strong>{pack}</strong> : "sélectionné ci-dessus"}.
        L'estimation est approximative : vérifie et ajuste avant d'enregistrer.
      </p>
      <div className="palette-add-row">
        <label className="btn btn-ghost btn-small">
          <Upload size={13} /> Choisir une photo
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </label>
        {file && <span className="field-hint">{file.name}</span>}
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={handleAnalyze}
          disabled={!file || analyzing}
        >
          {analyzing ? (
            <Loader2 size={13} className="spin" />
          ) : (
            <PaletteIcon size={13} />
          )}{" "}
          {analyzing ? "Analyse..." : "Analyser la photo"}
        </button>
      </div>
      {previewUrl && (
        <img src={previewUrl} alt="aperçu" className="photo-preview" />
      )}
      {error && <p className="form-error">{error}</p>}
      {results && results.length > 0 && (
        <>
          <h4>Résultat détecté — vérifie avant d'enregistrer</h4>
          <div className="palette-preview-list">
            {results.map((r, i) => (
              <div className="palette-preview-row" key={i}>
                <input
                  className="input mono"
                  style={{ width: 64 }}
                  value={r.numero}
                  onChange={(e) => updateResult(i, "numero", e.target.value)}
                  placeholder="N°"
                />
                <input
                  className="input"
                  value={r.nom}
                  onChange={(e) => updateResult(i, "nom", e.target.value)}
                  placeholder="Nom"
                />
                <input
                  type="color"
                  className="color-input"
                  value={r.hex || "#cccccc"}
                  onChange={(e) => updateResult(i, "hex", e.target.value)}
                />
                <IconBtn
                  icon={X}
                  onClick={() => removeResult(i)}
                  title="Retirer"
                />
              </div>
            ))}
          </div>
          <div
            className="modal-actions"
            style={{ justifyContent: "flex-start" }}
          >
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={handleValidate}
            >
              <Check size={13} /> Enregistrer ces {results.length} couleur(s)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PalettePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const {
    feutres,
    palette,
    customPacks,
    addPaletteEntry,
    bulkImportPalette,
    removePaletteEntry,
    refreshAll,
  } = useData();
  const toast = useToast();

  const allMarques = useMemo(() => {
    const set = new Set(["GuangNa", "Tooli-Art", "Nicety"]);
    feutres.forEach((f) => set.add(f.marque));
    palette.forEach((p) => set.add(p.marque));
    return [...set];
  }, [feutres, palette]);

  const [marque, setMarque] = useState(allMarques[0] || "GuangNa");
  const packsForMarque = useMemo(() => {
    const set = new Set(mergedPackNames(marque, customPacks));
    feutres.forEach((f) => {
      if (f.marque === marque && f.pack) set.add(f.pack);
    });
    palette.forEach((p) => {
      if (p.marque === marque && p.pack) set.add(p.pack);
    });
    return [...set];
  }, [marque, feutres, palette, customPacks]);
  const [pack, setPack] = useState(packsForMarque[0] || "");

  useEffect(() => {
    setPack((current) => current || packsForMarque[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marque]);

  const entries = useMemo(
    () =>
      palette
        .filter((p) => p.marque === marque && p.pack === pack)
        .sort((a, b) =>
          (a.numero || "").localeCompare(b.numero || "", undefined, {
            numeric: true,
          }),
        ),
    [palette, marque, pack],
  );

  // --- Admin : ajout manuel + import en masse ---
  const [numero, setNumero] = useState("");
  const [nom, setNom] = useState("");
  const [hex, setHex] = useState("#cccccc");
  async function handleAdd() {
    if (!numero.trim() || !pack.trim()) return;
    try {
      await addPaletteEntry({
        marque,
        pack: pack.trim(),
        numero: numero.trim(),
        nom: nom.trim(),
        hex,
      });
      toast.success("Couleur enregistrée");
      setNumero("");
      setNom("");
      setHex("#cccccc");
    } catch (e) {
      toast.error(e.message);
    }
  }

  const [bulkText, setBulkText] = useState("");
  async function handleBulk() {
    if (!pack.trim()) return;
    try {
      const { count } = await bulkImportPalette({
        marque,
        pack: pack.trim(),
        text: bulkText,
      });
      toast.success(`${count} couleur(s) enregistrée(s)`);
      setBulkText("");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handlePhotoImport(entries) {
    if (entries.length === 0) {
      toast.error("Aucune couleur valide détectée");
      return;
    }
    try {
      const lines = entries
        .map((e) => `${e.numero}, ${e.nom || ""}, ${e.hex || ""}`)
        .join("\n");
      const { count } = await bulkImportPalette({
        marque,
        pack: pack.trim(),
        text: lines,
      });
      toast.success(`${count} couleur(s) importée(s) depuis la photo`);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDeleteEntry(entry) {
    try {
      await removePaletteEntry(entry.id);
      toast.success("Couleur supprimée");
    } catch (e) {
      toast.error(e.message);
    }
  }

  // --- Non-admin : proposer une correction ---
  const [proposeModal, setProposeModal] = useState(null); // { initial }
  async function handleSubmitProposal(values) {
    try {
      await api.createProposal(values);
      toast.success("Proposition envoyée à l'admin pour validation");
      setProposeModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="view">
      <div className="view-head">
        <h2 className="display">Palette de couleurs</h2>
        <p className="view-sub">
          {isAdmin
            ? "La couleur réelle de chaque numéro, partagée avec tous les utilisateurs. Tu peux la modifier directement."
            : "La couleur réelle de chaque numéro, partagée avec tous les utilisateurs. Tu peux proposer une correction si une couleur est manquante ou inexacte."}
        </p>
      </div>

      <div className="panel">
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Marque</span>
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
          </label>
          <label className="field">
            <span className="field-label">Pack</span>
            <input
              className="input"
              list="palette-pack-suggestions"
              value={pack}
              onChange={(e) => setPack(e.target.value)}
              placeholder="Ex : 240 couleurs"
            />
            <datalist id="palette-pack-suggestions">
              {packsForMarque.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
        </div>
      </div>

      {isAdmin && (
        <PhotoImportPanel
          marque={marque}
          pack={pack}
          onImport={handlePhotoImport}
        />
      )}

      {isAdmin && (
        <div className="panel">
          <h4 style={{ marginTop: 0 }}>Ajouter une couleur manuellement</h4>
          <div className="palette-add-row">
            <input
              className="input mono"
              style={{ width: 90 }}
              placeholder="N°"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
            <input
              className="input"
              placeholder="Nom (optionnel)"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
            <input
              type="color"
              className="color-input"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={handleAdd}
            >
              <Plus size={13} /> Ajouter
            </button>
          </div>
          <h4>Importer en masse (texte)</h4>
          <p className="field-hint">
            Une ligne par couleur : numéro, nom (optionnel), couleur. Exemple :
            "1, Rouge vif, #E2231A".
          </p>
          <textarea
            className="input textarea"
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"1, Rouge vif, #E2231A\n2, Orange, #F2811D"}
          />
          <div
            className="modal-actions"
            style={{ justifyContent: "flex-start", marginTop: 8 }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={handleBulk}
            >
              <Upload size={13} /> Analyser et enregistrer
            </button>
          </div>
        </div>
      )}

      {!isAdmin && pack && (
        <div className="panel">
          <p className="view-sub" style={{ margin: 0 }}>
            Une couleur manque ou est inexacte pour ce pack ?
          </p>
          <div
            className="modal-actions"
            style={{ justifyContent: "flex-start", marginTop: 10 }}
          >
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => setProposeModal({ initial: { marque, pack } })}
            >
              <Send size={13} /> Proposer une couleur
            </button>
          </div>
        </div>
      )}

      {pack ? (
        entries.length === 0 ? (
          <EmptyState
            icon={PaletteIcon}
            title="Aucune couleur enregistrée pour ce pack"
            text={
              isAdmin
                ? "Ajoute tes couleurs ci-dessus."
                : "Tu peux proposer la première couleur de ce pack."
            }
          />
        ) : (
          <div className="feutre-grid">
            {entries.map((p) => (
              <div className="feutre-card" key={p.id}>
                <FeutreCap
                  hex={p.hex}
                  brand={BRAND_COLOR[p.marque] || BRAND_COLOR.Autre}
                />
                <div className="feutre-num mono">{p.numero}</div>
                <div className="feutre-info">
                  {p.nom && <div className="feutre-nom">{p.nom}</div>}
                </div>
                <div className="feutre-actions">
                  {isAdmin ? (
                    <IconBtn
                      icon={Trash2}
                      onClick={() => handleDeleteEntry(p)}
                      title="Supprimer"
                      danger
                    />
                  ) : (
                    <IconBtn
                      icon={Send}
                      onClick={() =>
                        setProposeModal({
                          initial: {
                            marque,
                            pack,
                            numero: p.numero,
                            nomPropose: p.nom,
                            hexPropose: p.hex,
                          },
                        })
                      }
                      title="Proposer une correction"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={PaletteIcon}
          title="Choisis ou écris un pack"
          text="Indique le pack pour lequel afficher les couleurs."
        />
      )}

      {proposeModal && (
        <Modal
          title="Proposer une couleur"
          onClose={() => setProposeModal(null)}
          width={620}
        >
          <ProposalForm
            type="color_correction"
            initial={proposeModal.initial}
            onCancel={() => setProposeModal(null)}
            onSubmit={handleSubmitProposal}
            title="Envoyer la proposition"
          />
        </Modal>
      )}
    </div>
  );
}
