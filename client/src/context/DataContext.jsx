import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../api.js";
import { useAuth } from "./AuthContext.jsx";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [feutres, setFeutres] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [palette, setPalette] = useState([]);
  const [customPacks, setCustomPacks] = useState([]);
  const [customBrands, setCustomBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [f, w, p, c, b] = await Promise.all([
        api.getFeutres(),
        api.getWishlist(),
        api.getPalette(),
        api.getPacks(),
        api.getBrands(),
      ]);
      setFeutres(f.feutres);
      setWishlist(w.wishlist);
      setPalette(p.palette);
      setCustomPacks(c.packs);
      setCustomBrands(b.brands);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refreshAll();
  }, [user, refreshAll]);

  // --- Feutres ---
  async function addFeutre(values) {
    const { feutre } = await api.createFeutre(values);
    setFeutres((prev) =>
      prev.some((f) => f.id === feutre.id)
        ? prev.map((f) => (f.id === feutre.id ? feutre : f))
        : [feutre, ...prev]
    );
    return feutre;
  }
  async function editFeutre(id, values) {
    const { feutre, deleted } = await api.updateFeutre(id, values);
    setFeutres((prev) => {
      // Remplace l'entrée modifiée par le feutre retourné (peut avoir un id différent si fusion)
      let next = prev.map((f) => (f.id === feutre.id ? feutre : f));
      // Supprime l'ancienne entrée si elle a été fusionnée dans une autre
      if (deleted) next = next.filter((f) => f.id !== deleted && f.id !== id);
      return next;
    });
    if (values.hex && values.numero && values.pack) refreshPaletteOnly();
    return feutre;
  }
  async function removeFeutre(id) {
    await api.deleteFeutre(id);
    setFeutres((prev) => prev.filter((f) => f.id !== id));
  }
  async function bulkPack(values) {
    const result = await api.bulkPack(values);
    await refreshAll();
    return result;
  }

  // --- Wishlist ---
  async function addWish(values) {
    const { item } = await api.createWish(values);
    setWishlist((prev) => [item, ...prev]);
    return item;
  }
  async function editWish(id, values) {
    const { item } = await api.updateWish(id, values);
    setWishlist((prev) => prev.map((w) => (w.id === id ? item : w)));
    return item;
  }
  async function removeWish(id) {
    await api.deleteWish(id);
    setWishlist((prev) => prev.filter((w) => w.id !== id));
  }

  // --- Palette (admin uniquement pour l'écriture) ---
  async function refreshPaletteOnly() {
    const { palette: p } = await api.getPalette();
    setPalette(p);
  }
  async function addPaletteEntry(values) {
    const { entry } = await api.createPaletteEntry(values);
    await refreshPaletteOnly();
    return entry;
  }
  async function bulkImportPalette(values) {
    const result = await api.bulkImportPalette(values);
    await refreshPaletteOnly();
    return result;
  }
  async function removePaletteEntry(id) {
    await api.deletePaletteEntry(id);
    setPalette((prev) => prev.filter((p) => p.id !== id));
  }

  // --- Marques personnalisées ---
  async function addCustomBrand(values) {
    const { brand } = await api.createBrand(values);
    setCustomBrands((prev) => [...prev, brand]);
    return brand;
  }
  async function updateCustomBrand(id, values) {
    const { brand } = await api.updateBrand(id, values);
    setCustomBrands((prev) => prev.map((b) => (b.id === id ? brand : b)));
    return brand;
  }
  async function removeCustomBrand(id) {
    await api.deleteBrand(id);
    setCustomBrands((prev) => prev.filter((b) => b.id !== id));
  }

  // --- Catalogue / packs personnalisés (admin uniquement pour l'écriture) ---
  async function addCustomPack(values) {
    const { pack } = await api.createPack(values);
    setCustomPacks((prev) => [...prev, pack]);
    return pack;
  }
  async function updateCustomPack(id, values) {
    const { pack } = await api.updatePack(id, values);
    setCustomPacks((prev) => prev.map((p) => (p.id === id ? pack : p)));
    return pack;
  }
  async function uploadPackImage(id, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const { pack } = await api.uploadPackImage(id, e.target.result);
          setCustomPacks((prev) => prev.map((p) => (p.id === id ? pack : p)));
          resolve(pack);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  async function deletePackImage(id) {
    await api.deletePackImage(id);
    setCustomPacks((prev) => prev.map((p) => (p.id === id ? { ...p, imageUrl: null } : p)));
  }
  async function removeCustomPack(id) {
    await api.deletePack(id);
    setCustomPacks((prev) => prev.filter((p) => p.id !== id));
  }

  const value = {
    feutres,
    wishlist,
    palette,
    customPacks,
    customBrands,
    loading,
    refreshAll,
    addFeutre,
    editFeutre,
    removeFeutre,
    bulkPack,
    addWish,
    editWish,
    removeWish,
    addPaletteEntry,
    bulkImportPalette,
    removePaletteEntry,
    addCustomBrand,
    updateCustomBrand,
    removeCustomBrand,
    addCustomPack,
    updateCustomPack,
    uploadPackImage,
    deletePackImage,
    removeCustomPack,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx)
    throw new Error("useData doit être utilisé à l'intérieur de DataProvider");
  return ctx;
}
