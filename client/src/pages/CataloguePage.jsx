import { useMemo, useRef, useState } from "react";
import { Plus, Trash2, Send, ShoppingCart, Pencil, ChevronDown, ChevronUp, Camera, X as XIcon, Search, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { api } from "../api.js";
import { CATALOGUE, MARQUES, BRAND_COLOR } from "../data.js";
import { IconBtn, Modal } from "../components/ui.jsx";
import { ProposalForm } from "../components/ProposalForm.jsx";

function SwatchStrip({ colors, isAdmin, onEditColor }) {
  if (!colors.length) return null;
  return (
    <div className="cat-swatch-strip">
      {colors.slice(0, 16).map((c) => (
        <div
          key={c.id}
          className={"cat-swatch-dot" + (isAdmin ? " cat-swatch-dot-editable" : "")}
          style={{ background: c.hex }}
          title={isAdmin ? `n°${c.numero} — cliquer pour modifier` : (c.nom ? `n°${c.numero} — ${c.nom}` : `n°${c.numero}`)}
          onClick={isAdmin ? () => onEditColor(c) : undefined}
        />
      ))}
      {colors.length > 16 && (
        <span className="cat-swatch-more">+{colors.length - 16}</span>
      )}
    </div>
  );
}

function PackCard({ pack, paletteColors, isAdmin, onEditLink, onDelete, onEditColor, onUploadImage, onDeleteImage, onToggleAddColor, addColorActive, newNumero, setNewNumero, newNom, setNewNom, newHex, setNewHex, onAddColor, brand }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);
  const hasColors = paletteColors.length > 0;

  return (
    <div className="cat-pack-card" style={{ "--cat-brand": brand }}>
      {/* Zone photo en haut */}
      <div className="cat-pack-photo-top">
        {pack.imageUrl ? (
          <div className="cat-pack-photo-container">
            <img src={pack.imageUrl} alt={pack.nom} className="cat-pack-photo" />
            {isAdmin && (
              <div className="cat-pack-photo-overlay">
                <button type="button" className="cat-photo-btn" onClick={() => fileRef.current?.click()} title="Changer la photo">
                  <Camera size={14} />
                </button>
                <button type="button" className="cat-photo-btn cat-photo-btn-danger" onClick={() => onDeleteImage(pack)} title="Supprimer la photo">
                  <XIcon size={14} />
                </button>
              </div>
            )}
          </div>
        ) : isAdmin ? (
          <button type="button" className="cat-pack-photo-placeholder" onClick={() => fileRef.current?.click()}>
            <Camera size={18} />
            <span>Ajouter une photo</span>
          </button>
        ) : (
          <div className="cat-pack-photo-brand-bg" />
        )}
        {isAdmin && (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { if (e.target.files[0]) onUploadImage(pack, e.target.files[0]); e.target.value = ""; }}
          />
        )}
      </div>

      {/* Contenu */}
      <div className="cat-pack-main">
        <div className="cat-pack-top">
          <span className="cat-pack-name">{pack.nom}</span>
          <div className="cat-pack-top-actions">
            {pack.lienAchat && (
              <a href={pack.lienAchat} target="_blank" rel="noopener noreferrer" className="cat-buy-btn" onClick={(e) => e.stopPropagation()}>
                <ShoppingCart size={11} />
              </a>
            )}
            {isAdmin && (
              <div className="cat-pack-admin-actions">
                <IconBtn icon={Pencil} onClick={() => onEditLink(pack)} title="Modifier le lien" size={13} />
                {pack.id && <IconBtn icon={Trash2} onClick={() => onDelete(pack)} title="Supprimer" danger size={13} />}
              </div>
            )}
          </div>
        </div>
        {pack.detail && <p className="cat-pack-detail">{pack.detail}</p>}
        {hasColors && <SwatchStrip colors={paletteColors} isAdmin={isAdmin} onEditColor={onEditColor} />}
        {!hasColors && <p className="cat-pack-no-colors">Aucune couleur référencée</p>}
      </div>

      {/* Expandable couleurs */}
      {hasColors && (
        <button className="cat-pack-expand" onClick={() => setOpen((v) => !v)}>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {open ? "Masquer" : `${paletteColors.length} couleur${paletteColors.length > 1 ? "s" : ""}`}
        </button>
      )}

      {open && (
        <div className="cat-colors-grid">
          {paletteColors.map((c) => (
            <div
              key={c.id}
              className={"cat-color-item" + (isAdmin ? " cat-color-item-editable" : "")}
              onClick={isAdmin ? () => onEditColor(c) : undefined}
              title={isAdmin ? "Cliquer pour modifier" : undefined}
            >
              <div className="cat-color-swatch" style={{ background: c.hex }} />
              <span className="cat-color-num mono">{c.numero}</span>
              {c.nom && <span className="cat-color-nom">{c.nom}</span>}
              {isAdmin && <span className="cat-color-edit-hint"><Pencil size={9} /></span>}
            </div>
          ))}
        </div>
      )}

      {/* Ajout inline (admin) */}
      {isAdmin && (
        <div className="cat-add-color-bar">
          {!addColorActive ? (
            <button type="button" className="cat-add-color-toggle" onClick={onToggleAddColor}>
              <Plus size={12} /> Couleur
            </button>
          ) : (
            <div className="cat-add-color-form">
              <input className="input mono cat-add-color-num" value={newNumero} onChange={(e) => setNewNumero(e.target.value)} placeholder="N°" onKeyDown={(e) => e.key === "Enter" && onAddColor()} />
              <input className="input cat-add-color-nom" value={newNom} onChange={(e) => setNewNom(e.target.value)} placeholder="Nom (opt.)" onKeyDown={(e) => e.key === "Enter" && onAddColor()} />
              <input type="color" className="color-input" value={newHex} onChange={(e) => setNewHex(e.target.value)} />
              <button type="button" className="btn btn-primary btn-small" onClick={onAddColor}><Plus size={12} /></button>
              <button type="button" className="btn btn-ghost btn-small" onClick={onToggleAddColor}><XIcon size={12} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditColorModal({ entry, onClose, onSave }) {
  const [hex, setHex] = useState(entry.hex || "#cccccc");
  const [nom, setNom] = useState(entry.nom || "");
  return (
    <Modal title={`Couleur n°${entry.numero}`} onClose={onClose} width={400} accent={hex}>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Nom (optionnel)</span>
          <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Rouge vif" />
        </label>
        <label className="field">
          <span className="field-label">Couleur</span>
          <div className="color-row">
            <input type="color" className="color-input" value={hex} onChange={(e) => setHex(e.target.value)} />
            <input
              className="input mono"
              value={hex}
              maxLength={7}
              onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setHex(e.target.value); }}
              placeholder="#RRGGBB"
            />
          </div>
        </label>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-primary" onClick={() => onSave({ hex, nom: nom.trim() || null })}>
          Enregistrer
        </button>
      </div>
    </Modal>
  );
}

function EditLinkModal({ pack, onClose, onSave }) {
  const [lien, setLien] = useState(pack.lienAchat || "");
  return (
    <Modal title={`Lien d'achat — ${pack.nom}`} onClose={onClose} width={440}>
      <label className="field">
        <span className="field-label">URL d'achat (Amazon, AliExpress, etc.)</span>
        <input
          className="input"
          value={lien}
          onChange={(e) => setLien(e.target.value)}
          placeholder="https://..."
          type="url"
        />
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-primary" onClick={() => onSave(lien.trim() || null)}>
          Enregistrer
        </button>
      </div>
    </Modal>
  );
}

function EditPackModal({ pack, customBrands, onClose, onSave }) {
  const [nom, setNom] = useState(pack.nom || "");
  const [taille, setTaille] = useState(pack.taille || "");
  const [detail, setDetail] = useState(pack.detail || "");
  const [lienAchat, setLienAchat] = useState(pack.lienAchat || "");
  return (
    <Modal title={`Modifier — ${pack.nom}`} onClose={onClose} width={500}>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Nom du pack</span>
          <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : 360 couleurs" />
        </label>
        <div className="field-row">
          <label className="field" style={{ flex: 1 }}>
            <span className="field-label">Nb. feutres (opt.)</span>
            <input type="number" min="1" className="input" value={taille} onChange={(e) => setTaille(e.target.value)} />
          </label>
          <label className="field" style={{ flex: 2 }}>
            <span className="field-label">Détail (opt.)</span>
            <input className="input" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ex : nouvelle sortie 2026" />
          </label>
        </div>
        <label className="field">
          <span className="field-label">Lien d'achat (opt.)</span>
          <input className="input" value={lienAchat} onChange={(e) => setLienAchat(e.target.value)} placeholder="https://..." type="url" />
        </label>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button type="button" className="btn btn-primary" disabled={!nom.trim()} onClick={() => onSave({
          nom: nom.trim(),
          taille: taille ? Number(taille) : null,
          detail: detail.trim() || null,
          lienAchat: lienAchat.trim() || null,
        })}>
          Enregistrer
        </button>
      </div>
    </Modal>
  );
}

export default function CataloguePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { customPacks, customBrands, palette, addCustomPack, updateCustomPack, uploadPackImage, deletePackImage, removeCustomPack, addPaletteEntry, addCustomBrand, updateCustomBrand, removeCustomBrand } = useData();
  const toast = useToast();

  // Palette indexée par marque+pack
  const paletteByPackKey = useMemo(() => {
    const map = {};
    palette.forEach((c) => {
      const k = `${c.marque}::${c.pack}`;
      if (!map[k]) map[k] = [];
      map[k].push(c);
    });
    return map;
  }, [palette]);

  function colorsForPack(marque, packNom) {
    return (paletteByPackKey[`${marque}::${packNom}`] || [])
      .sort((a, b) => (a.numero || "").localeCompare(b.numero || "", undefined, { numeric: true }));
  }

  // Formulaire d'ajout (admin)
  const [marque, setMarque] = useState("GuangNa");
  const [marqueAutre, setMarqueAutre] = useState("");
  const [nom, setNom] = useState("");
  const [taille, setTaille] = useState("");
  const [detail, setDetail] = useState("");
  const [lienAchat, setLienAchat] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  // Couleurs à ajouter lors de la création
  const [addColors, setAddColors] = useState([]); // [{ numero, nom, hex }]
  const [addColorNum, setAddColorNum] = useState("");
  const [addColorNom, setAddColorNom] = useState("");
  const [addColorHex, setAddColorHex] = useState("#cccccc");
  // Photo à uploader lors de la création
  const [addPhotoFile, setAddPhotoFile] = useState(null);
  const [addPhotoPreview, setAddPhotoPreview] = useState(null);
  const addPhotoRef = useRef(null);

  const marqueFinale = marque === "Autre" ? marqueAutre || "Autre" : marque;

  function handleAddFormColor() {
    if (!addColorNum.trim()) return;
    setAddColors((prev) => [...prev, { numero: addColorNum.trim(), nom: addColorNom.trim() || null, hex: addColorHex }]);
    setAddColorNum(""); setAddColorNom(""); setAddColorHex("#cccccc");
  }

  function handleAddFormPhoto(file) {
    setAddPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAddPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  }

  function resetAddForm() {
    setNom(""); setTaille(""); setDetail(""); setLienAchat("");
    setAddColors([]); setAddColorNum(""); setAddColorNom(""); setAddColorHex("#cccccc");
    setAddPhotoFile(null); setAddPhotoPreview(null);
    setAddOpen(false);
  }

  async function handleAdd() {
    if (!nom.trim()) return;
    try {
      const pack = await addCustomPack({
        marque: marqueFinale,
        nom: nom.trim(),
        taille: taille ? Number(taille) : null,
        detail: detail.trim(),
        lienAchat: lienAchat.trim() || null,
      });
      // Upload photo si fournie
      if (addPhotoFile && pack.id) {
        await uploadPackImage(pack.id, addPhotoFile);
      }
      // Ajout des couleurs
      for (const c of addColors) {
        await addPaletteEntry({ marque: marqueFinale, pack: nom.trim(), numero: c.numero, nom: c.nom, hex: c.hex });
      }
      toast.success(`Pack ajouté${addColors.length ? ` · ${addColors.length} couleur(s)` : ""}${addPhotoFile ? " · photo ajoutée" : ""}`);
      resetAddForm();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleDelete(p) {
    try {
      await removeCustomPack(p.id);
      toast.success("Pack supprimé");
    } catch (e) {
      toast.error(e.message);
    }
  }

  // Édition lien (packs builtin) / édition complète (packs custom)
  const [catalogueLiens, setCatalogueLiens] = useState({});
  const [editLinkModal, setEditLinkModal] = useState(null);
  const [editPackModal, setEditPackModal] = useState(null);

  // Édition couleur
  const [editColorModal, setEditColorModal] = useState(null);

  async function handleSaveColor({ hex, nom }) {
    const entry = editColorModal;
    try {
      await addPaletteEntry({ marque: entry.marque, pack: entry.pack, numero: entry.numero, nom, hex });
      toast.success("Couleur mise à jour");
      setEditColorModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  // Ajout couleur inline
  const [addColorTarget, setAddColorTarget] = useState(null);
  const [newNumero, setNewNumero] = useState("");
  const [newNom, setNewNom] = useState("");
  const [newHex, setNewHex] = useState("#cccccc");

  async function handleAddColorInline() {
    if (!newNumero.trim() || !addColorTarget) return;
    try {
      await addPaletteEntry({ marque: addColorTarget.marque, pack: addColorTarget.packNom, numero: newNumero.trim(), nom: newNom.trim() || null, hex: newHex });
      toast.success(`Couleur n°${newNumero} ajoutée`);
      setNewNumero(""); setNewNom(""); setNewHex("#cccccc");
    } catch (e) {
      toast.error(e.message);
    }
  }

  // Photo
  async function handleUploadImage(pack, file) {
    try { await uploadPackImage(pack.id, file); toast.success("Photo ajoutée"); }
    catch (e) { toast.error(e.message); }
  }
  async function handleDeleteImage(pack) {
    try { await deletePackImage(pack.id); toast.success("Photo supprimée"); }
    catch (e) { toast.error(e.message); }
  }

  async function handleSaveLink(lien) {
    const { pack } = editLinkModal;
    try {
      setCatalogueLiens((prev) => ({ ...prev, [`${pack.marque}::${pack.nom}`]: lien }));
      toast.success("Lien mis à jour (session uniquement)");
      setEditLinkModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleSavePack(values) {
    const pack = editPackModal;
    try {
      await updateCustomPack(pack.id, { ...pack, ...values });
      toast.success("Pack mis à jour");
      setEditPackModal(null);
    } catch (e) {
      toast.error(e.message);
    }
  }

  // Proposition
  const [proposeOpen, setProposeOpen] = useState(false);
  async function handleSubmitProposal(values) {
    try {
      await api.createProposal(values);
      toast.success("Proposition envoyée à l'admin pour validation");
      setProposeOpen(false);
    } catch (e) { toast.error(e.message); }
  }

  // Modal ajout/édition marque
  const [brandModal, setBrandModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', brand }
  const [brandNom, setBrandNom] = useState("");
  const [brandIntro, setBrandIntro] = useState("");
  const [brandNote, setBrandNote] = useState("");

  function openAddBrand() { setBrandNom(""); setBrandIntro(""); setBrandNote(""); setBrandModal({ mode: "add" }); }
  function openEditBrand(brand) { setBrandNom(brand.nom); setBrandIntro(brand.intro || ""); setBrandNote(brand.note || ""); setBrandModal({ mode: "edit", brand }); }

  async function handleSaveBrand() {
    if (!brandNom.trim()) return;
    try {
      if (brandModal.mode === "add") {
        await addCustomBrand({ nom: brandNom.trim(), intro: brandIntro.trim() || null, note: brandNote.trim() || null });
        toast.success("Marque ajoutée au catalogue");
      } else {
        await updateCustomBrand(brandModal.brand.id, { nom: brandNom.trim(), intro: brandIntro.trim() || null, note: brandNote.trim() || null });
        toast.success("Marque mise à jour");
      }
      setBrandModal(null);
    } catch (e) { toast.error(e.message); }
  }

  async function handleDeleteBrand(brand) {
    try {
      await removeCustomBrand(brand.id);
      toast.success("Marque supprimée");
    } catch (e) { toast.error(e.message); }
  }

  // Sections repliables — forcées ouvertes si une recherche est active
  const [openSections, setOpenSections] = useState({});
  function isSectionOpen(m) { return search.trim() ? true : openSections[m] !== false; }
  function toggleSection(m) {
    if (search.trim()) return; // pas de repli quand filtré
    setOpenSections((prev) => ({ ...prev, [m]: !isSectionOpen(m) }));
  }

  // Recherche
  const [search, setSearch] = useState("");

  const customByMarque = useMemo(() => {
    const map = {};
    customPacks.forEach((p) => {
      if (!map[p.marque]) map[p.marque] = [];
      map[p.marque].push(p);
    });
    return map;
  }, [customPacks]);

  // Index des marques custom par nom pour retrouver intro/note
  const customBrandIndex = useMemo(() => {
    const idx = {};
    customBrands.forEach((b) => { idx[b.nom] = b; });
    return idx;
  }, [customBrands]);

  const allMarques = useMemo(() => {
    const set = new Set([
      ...Object.keys(CATALOGUE),
      ...customBrands.map((b) => b.nom),
      ...Object.keys(customByMarque),
    ]);
    return [...set];
  }, [customByMarque, customBrands]);

  // Filtre par recherche
  const filteredMarques = useMemo(() => {
    if (!search.trim()) return allMarques;
    const q = search.toLowerCase();
    return allMarques.filter((m) => {
      if (m.toLowerCase().includes(q)) return true;
      const builtinPacks = CATALOGUE[m]?.packs || [];
      const cPacks = customByMarque[m] || [];
      return [...builtinPacks, ...cPacks].some((p) => p.nom.toLowerCase().includes(q));
    });
  }, [allMarques, customByMarque, search]);

  // Total de packs pour l'affichage
  const totalPacks = useMemo(() => {
    let n = 0;
    allMarques.forEach((m) => {
      n += (CATALOGUE[m]?.packs?.length || 0) + (customByMarque[m]?.length || 0);
    });
    return n;
  }, [allMarques, customByMarque]);

  return (
    <div className="view catalogue-view">

      {/* ── Hero ── */}
      <div className="cat-hero">
        <div className="cat-hero-bg" />
        <div className="cat-hero-content">
          <div>
            <h1 className="display cat-hero-title">Catalogue</h1>
            <p className="cat-hero-sub">{totalPacks} pack{totalPacks > 1 ? "s" : ""} · {allMarques.length} marque{allMarques.length > 1 ? "s" : ""}</p>
          </div>
          <div className="cat-hero-actions">
            {!isAdmin && (
              <button type="button" className="btn btn-hero-ghost" onClick={() => setProposeOpen(true)}>
                <Send size={14} /> Proposer un pack
              </button>
            )}
            {isAdmin && (
              <>
                <button type="button" className="btn btn-hero-ghost" onClick={openAddBrand}>
                  <Plus size={14} /> Marque
                </button>
                <button type="button" className="btn btn-hero-primary" onClick={() => setAddOpen(true)}>
                  <Plus size={14} /> Pack
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Barre de recherche ── */}
      <div className="cat-search-bar">
        <Search size={15} className="cat-search-icon" />
        <input
          className="cat-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un pack ou une marque…"
        />
        {search && (
          <button className="cat-search-clear" onClick={() => setSearch("")}>
            <XIcon size={13} />
          </button>
        )}
      </div>

      {/* ── Sections par marque ── */}
      {filteredMarques.map((m) => {
        const brand = BRAND_COLOR[m] || BRAND_COLOR.Autre;
        const data = CATALOGUE[m];
        const customBrand = customBrandIndex[m];
        const intro = data?.intro || customBrand?.intro;
        const note = data?.note || customBrand?.note;
        const isCustomBrand = !!customBrand && !data;

        const builtinPacks = data ? data.packs.map((p) => ({
          ...p,
          lienAchat: catalogueLiens[`${m}::${p.nom}`] ?? p.lienAchat,
          marque: m,
          id: null,
        })) : [];
        const custom = customByMarque[m] || [];
        const allPacks = [...builtinPacks, ...custom];
        const sectionOpen = isSectionOpen(m);

        return (
          <div key={m} className="cat-section">
            {/* En-tête de marque cliquable */}
            <div className="cat-section-toggle-wrap">
              <button
                className="cat-section-toggle"
                style={{ "--cat-brand": brand }}
                onClick={() => toggleSection(m)}
              >
                <div className="cat-section-toggle-left">
                  <span className="cat-brand-dot" style={{ background: brand }} />
                  <span className="cat-brand-name">{m}</span>
                  {note && <span className="cat-brand-alert">⚠</span>}
                </div>
                <div className="cat-section-toggle-right">
                  <span className="cat-pack-count-badge">{allPacks.length} pack{allPacks.length > 1 ? "s" : ""}</span>
                  <ChevronDown size={16} className={"cat-section-chevron" + (sectionOpen ? " open" : "")} />
                </div>
              </button>
              {isAdmin && isCustomBrand && (
                <div className="cat-brand-admin-btns">
                  <IconBtn icon={Pencil} onClick={() => openEditBrand(customBrand)} title="Modifier la marque" />
                  <IconBtn icon={Trash2} onClick={() => handleDeleteBrand(customBrand)} title="Supprimer la marque" danger />
                </div>
              )}
            </div>

            {sectionOpen && (
              <>
                {(intro || note) && (
                  <div className="cat-brand-meta" style={{ borderColor: brand }}>
                    {intro && <p className="cat-brand-intro">{intro}</p>}
                    {note && <p className="cat-brand-note">⚠ {note}</p>}
                  </div>
                )}

                <div className="cat-packs-grid">
                  {allPacks.map((p) => {
                    const key = p.id ? `c::${p.id}` : `b::${m}::${p.nom}`;
                    const isCustomPack = !!p.id;
                    return (
                      <PackCard
                        key={key}
                        pack={p}
                        paletteColors={colorsForPack(m, p.nom)}
                        isAdmin={isAdmin}
                        brand={brand}
                        onEditLink={(pk) => isCustomPack
                          ? setEditPackModal({ ...pk, marque: m })
                          : setEditLinkModal({ pack: { ...pk, marque: m } })
                        }
                        onDelete={handleDelete}
                        onEditColor={(c) => setEditColorModal({ ...c, marque: m, pack: p.nom })}
                        onUploadImage={handleUploadImage}
                        onDeleteImage={handleDeleteImage}
                        onToggleAddColor={() => setAddColorTarget((prev) =>
                          prev?.packNom === p.nom && prev?.marque === m ? null : { marque: m, packNom: p.nom }
                        )}
                        addColorActive={addColorTarget?.marque === m && addColorTarget?.packNom === p.nom}
                        newNumero={newNumero} setNewNumero={setNewNumero}
                        newNom={newNom} setNewNom={setNewNom}
                        newHex={newHex} setNewHex={setNewHex}
                        onAddColor={handleAddColorInline}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}

      {filteredMarques.length === 0 && (
        <div className="cat-empty">
          <Search size={32} />
          <p>Aucun résultat pour « {search} »</p>
        </div>
      )}

      {/* Modals */}
      {addOpen && (
        <Modal title="Ajouter un pack" onClose={resetAddForm} width={600}>
          <div className="add-pack-modal-body">
            {/* Colonne infos */}
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Marque</span>
                <select className="input" value={marque} onChange={(e) => setMarque(e.target.value)}>
                  {MARQUES.filter((m) => m !== "Autre").map((m) => <option key={m} value={m}>{m}</option>)}
                  {customBrands.map((b) => <option key={b.id} value={b.nom}>{b.nom}</option>)}
                  <option value="Autre">Autre…</option>
                </select>
              </label>
              {marque === "Autre" && (
                <label className="field">
                  <span className="field-label">Nom de la marque</span>
                  <input className="input" value={marqueAutre} onChange={(e) => setMarqueAutre(e.target.value)} />
                </label>
              )}
              <label className="field">
                <span className="field-label">Nom du pack</span>
                <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : 360 couleurs" />
              </label>
              <div className="field-row">
                <label className="field" style={{ flex: 1 }}>
                  <span className="field-label">Nb. feutres (opt.)</span>
                  <input type="number" min="1" className="input" value={taille} onChange={(e) => setTaille(e.target.value)} />
                </label>
                <label className="field" style={{ flex: 2 }}>
                  <span className="field-label">Détail (opt.)</span>
                  <input className="input" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Ex : nouvelle sortie 2026" />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Lien d'achat (opt.)</span>
                <input className="input" value={lienAchat} onChange={(e) => setLienAchat(e.target.value)} placeholder="https://..." type="url" />
              </label>

              {/* Photo */}
              <div className="field">
                <span className="field-label">Photo du pack (opt.)</span>
                <div className="add-pack-photo-zone" onClick={() => addPhotoRef.current?.click()}>
                  {addPhotoPreview ? (
                    <div className="add-pack-photo-preview">
                      <img src={addPhotoPreview} alt="preview" />
                      <button type="button" className="add-pack-photo-remove" onClick={(e) => { e.stopPropagation(); setAddPhotoFile(null); setAddPhotoPreview(null); }}>
                        <XIcon size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="add-pack-photo-placeholder">
                      <Upload size={20} />
                      <span>Cliquer pour ajouter une photo</span>
                    </div>
                  )}
                </div>
                <input ref={addPhotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) handleAddFormPhoto(e.target.files[0]); e.target.value = ""; }} />
              </div>
            </div>

            {/* Section couleurs */}
            <div className="add-pack-colors-section">
              <span className="field-label">Couleurs du pack (opt.)</span>
              {addColors.length > 0 && (
                <div className="add-pack-colors-list">
                  {addColors.map((c, i) => (
                    <div key={i} className="add-pack-color-row">
                      <div className="add-pack-color-dot" style={{ background: c.hex }} />
                      <span className="mono" style={{ fontSize: 12 }}>n°{c.numero}</span>
                      {c.nom && <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.nom}</span>}
                      <button type="button" className="add-pack-color-remove" onClick={() => setAddColors((prev) => prev.filter((_, j) => j !== i))}>
                        <XIcon size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="add-pack-color-form">
                <input className="input mono add-color-num" value={addColorNum} onChange={(e) => setAddColorNum(e.target.value)} placeholder="N°" onKeyDown={(e) => e.key === "Enter" && handleAddFormColor()} />
                <input className="input add-color-nom" value={addColorNom} onChange={(e) => setAddColorNom(e.target.value)} placeholder="Nom (opt.)" onKeyDown={(e) => e.key === "Enter" && handleAddFormColor()} />
                <input type="color" className="color-input" value={addColorHex} onChange={(e) => setAddColorHex(e.target.value)} />
                <button type="button" className="btn btn-ghost btn-small" onClick={handleAddFormColor}>
                  <Plus size={13} /> Ajouter
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={resetAddForm}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={handleAdd}>
              <Plus size={13} /> Créer le pack{addColors.length > 0 ? ` · ${addColors.length} couleur(s)` : ""}
            </button>
          </div>
        </Modal>
      )}

      {editLinkModal && (
        <EditLinkModal
          pack={editLinkModal.pack}
          onClose={() => setEditLinkModal(null)}
          onSave={handleSaveLink}
        />
      )}

      {editPackModal && (
        <EditPackModal
          pack={editPackModal}
          customBrands={customBrands}
          onClose={() => setEditPackModal(null)}
          onSave={handleSavePack}
        />
      )}

      {editColorModal && (
        <EditColorModal
          entry={editColorModal}
          onClose={() => setEditColorModal(null)}
          onSave={handleSaveColor}
        />
      )}

      {brandModal && (
        <Modal
          title={brandModal.mode === "add" ? "Ajouter une marque" : `Modifier — ${brandModal.brand.nom}`}
          onClose={() => setBrandModal(null)}
          width={500}
        >
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Nom de la marque</span>
              <input
                className="input"
                value={brandNom}
                onChange={(e) => setBrandNom(e.target.value)}
                placeholder="Ex : Copic, Staedtler…"
              />
            </label>
            <label className="field">
              <span className="field-label">Description (optionnel)</span>
              <textarea
                className="input"
                rows={3}
                value={brandIntro}
                onChange={(e) => setBrandIntro(e.target.value)}
                placeholder="Présentation courte de la marque, type de feutres, etc."
                style={{ resize: "vertical" }}
              />
            </label>
            <label className="field">
              <span className="field-label">Note d'avertissement (optionnel)</span>
              <input
                className="input"
                value={brandNote}
                onChange={(e) => setBrandNote(e.target.value)}
                placeholder="Ex : nuancier non confirmé pour certains packs"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setBrandModal(null)}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={handleSaveBrand}>
              {brandModal.mode === "add" ? <><Plus size={13} /> Ajouter</> : "Enregistrer"}
            </button>
          </div>
        </Modal>
      )}

      {proposeOpen && (
        <Modal title="Proposer un nouveau pack" onClose={() => setProposeOpen(false)} width={560}>
          <ProposalForm
            type="new_pack"
            onCancel={() => setProposeOpen(false)}
            onSubmit={handleSubmitProposal}
            title="Envoyer la proposition"
            customBrands={customBrands}
            customPacks={customPacks}
          />
        </Modal>
      )}
    </div>
  );
}
