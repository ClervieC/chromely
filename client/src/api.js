async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(data?.error || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // Stock
  getFeutres: () => request("/feutres"),
  createFeutre: (body) => request("/feutres", { method: "POST", body }),
  updateFeutre: (id, body) =>
    request(`/feutres/${id}`, { method: "PUT", body }),
  deleteFeutre: (id) => request(`/feutres/${id}`, { method: "DELETE" }),
  bulkPack: (body) => request("/feutres/bulk-pack", { method: "POST", body }),

  // Wishlist
  getWishlist: () => request("/wishlist"),
  createWish: (body) => request("/wishlist", { method: "POST", body }),
  updateWish: (id, body) => request(`/wishlist/${id}`, { method: "PUT", body }),
  deleteWish: (id) => request(`/wishlist/${id}`, { method: "DELETE" }),

  // Palette (partagée)
  getPalette: () => request("/palette"),
  createPaletteEntry: (body) => request("/palette", { method: "POST", body }),
  bulkImportPalette: (body) =>
    request("/palette/bulk-import", { method: "POST", body }),
  analyzePhoto: (body) =>
    request("/palette/analyze-photo", { method: "POST", body }),
  deletePaletteEntry: (id) => request(`/palette/${id}`, { method: "DELETE" }),

  // Marques personnalisées
  getBrands: () => request("/brands"),
  createBrand: (body) => request("/brands", { method: "POST", body }),
  updateBrand: (id, body) => request(`/brands/${id}`, { method: "PUT", body }),
  deleteBrand: (id) => request(`/brands/${id}`, { method: "DELETE" }),

  // Catalogue / packs personnalisés (partagé)
  getPacks: () => request("/packs"),
  createPack: (body) => request("/packs", { method: "POST", body }),
  updatePack: (id, body) => request(`/packs/${id}`, { method: "PUT", body }),
  uploadPackImage: (id, imageDataUrl) => request(`/packs/${id}/image`, { method: "POST", body: { imageDataUrl } }),
  deletePackImage: (id) => request(`/packs/${id}/image`, { method: "DELETE" }),
  deletePack: (id) => request(`/packs/${id}`, { method: "DELETE" }),

  // Propositions
  createProposal: (body) => request("/proposals", { method: "POST", body }),
  getMyProposals: () => request("/proposals/mine"),
  getAllProposals: (status) =>
    request(`/proposals${status ? `?status=${status}` : ""}`),
  approveProposal: (id, reviewNote) =>
    request(`/proposals/${id}/approve`, {
      method: "POST",
      body: { reviewNote },
    }),
  rejectProposal: (id, reviewNote) =>
    request(`/proposals/${id}/reject`, {
      method: "POST",
      body: { reviewNote },
    }),

  // Utilisateurs (admin)
  getUsers: () => request("/users"),
  setUserRole: (id, role) =>
    request(`/users/${id}/role`, { method: "PUT", body: { role } }),
};
