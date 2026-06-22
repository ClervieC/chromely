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
  const [loading, setLoading] = useState(true);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [f, w, p, c] = await Promise.all([
        api.getFeutres(),
        api.getWishlist(),
        api.getPalette(),
        api.getPacks(),
      ]);
      setFeutres(f.feutres);
      setWishlist(w.wishlist);
      setPalette(p.palette);
      setCustomPacks(c.packs);
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
    const { feutre } = await api.updateFeutre(id, values);
    setFeutres((prev) => prev.map((f) => (f.id === id ? feutre : f)));
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

  // --- Catalogue / packs personnalisés (admin uniquement pour l'écriture) ---
  async function addCustomPack(values) {
    const { pack } = await api.createPack(values);
    setCustomPacks((prev) => [...prev, pack]);
    return pack;
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
    addCustomPack,
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
