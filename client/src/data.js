export const CATALOGUE = {
  GuangNa: {
    intro:
      "Marque chinoise de feutres acryliques à pointe pinceau souple, très utilisée pour le coloriage mystère. Vendue en grosses boîtes multi-couleurs plutôt qu'en collections thématiques.",
    packs: [
      { nom: "24 couleurs", detail: "Pointe brush souple.", lienAchat: null },
      { nom: "72 couleurs", detail: "Pointe brush souple.", lienAchat: null },
      { nom: "120 couleurs", detail: "Pointe brush souple.", lienAchat: null },
      { nom: "168 couleurs", detail: "Pointe brush souple.", lienAchat: null },
      {
        nom: "240 couleurs",
        detail: "Le pack le plus populaire, pointe ultra-souple.",
        lienAchat: null,
      },
      {
        nom: "288 couleurs",
        detail: "Un tres grand pack.",
        lienAchat: null,
      },
      {
        nom: "360 couleurs",
        detail: "Le plus grand pack identifié à ce jour.",
        lienAchat: null,
      },
    ],
  },
  "Tooli-Art": {
    intro:
      "Marque américaine haut de gamme, double pointe (0,7 mm extra-fine + pinceau ou 3 mm medium). Vendue par collections thématiques — environ 462 feutres sur l'ensemble de la gamme.",
    packs: [
      {
        nom: "Essential (30)",
        detail: "26 couleurs assorties + 2 blanc + 2 noir.",
        lienAchat: null,
      },
      { nom: "Brown (22)", detail: "Collection de marrons.", lienAchat: null },
      { nom: "Orange (22)", detail: "Collection d'oranges.", lienAchat: null },
      { nom: "Pink (22)", detail: "Collection de roses.", lienAchat: null },
      { nom: "Purple (22)", detail: "Collection de violets.", lienAchat: null },
      {
        nom: "Skin (22)",
        detail: "Collection de teintes chair.",
        lienAchat: null,
      },
      {
        nom: "Confetti (24)",
        detail: "Collection de couleurs vives.",
        lienAchat: null,
      },
      {
        nom: "Earth & Skin Tomes (36)",
        detail: "Collection de teintes terre et chair.",
        lienAchat: null,
      },
      {
        nom: "Jewels (24)",
        detail: "Collection de couleurs précieuses.",
        lienAchat: null,
      },
      {
        nom: "Metallic (36)",
        detail: "Collection de couleurs métalliques.",
        lienAchat: null,
      },
      {
        nom: "Neon (27)",
        detail: "Collection de couleurs néon.",
        lienAchat: null,
      },
      {
        nom: "Pastel (24)",
        detail: "Collection de couleurs pastel.",
        lienAchat: null,
      },
      {
        nom: "Southwestern (28)",
        detail: "Collection de couleurs sud-ouest américain.",
        lienAchat: null,
      },
      {
        nom: "Wildflowers (28)",
        detail: "Collection de couleurs inspirées de fleurs sauvages.",
        lienAchat: null,
      },
      {
        nom: "Nocturnal (28)",
        detail: "Collection de couleurs sombres.",
        lienAchat: null,
      },
    ],
    note: "Tailles non confirmées pour certaines collections thématiques — vérifie le nuancier officiel.",
  },
  Nicety: {
    intro:
      "Marque vendue principalement sur Amazon, bon rapport qualité-prix pour débuter.",
    packs: [
      { nom: "84 couleurs", detail: "Pointe brush 1-5 mm.", lienAchat: null },
      {
        nom: "128 couleurs",
        detail: "Double pointe : fine 1 mm + pinceau 0,5-5 mm.",
        lienAchat: null,
      },
      {
        nom: "136 couleurs",
        detail: "Pointe extra-fine 0,7 mm.",
        lienAchat: null,
      },
      { nom: "180 couleurs", detail: "Pointe brush 1-6 mm.", lienAchat: null },
    ],
  },
};

export const MARQUES = ["GuangNa", "Tooli-Art", "Nicety", "Autre"];

// Marques où le numéro identifie la couleur de façon universelle, tous packs confondus.
// Un GuangNa n°600 du pack 12 et du pack 240 sont le même feutre physique.
export const MARQUES_NUMERO_UNIVERSEL = ["GuangNa"];

export const BRAND_COLOR = {
  GuangNa: "#E1572C",
  "Tooli-Art": "#154B4A",
  Nicety: "#7C5CBF",
  Autre: "#4B5A60",
};

export const ETATS = {
  fonctionne: { label: "Fonctionne", color: "#2F8F9D" },
  sec: { label: "Sec / HS", color: "#C1452D" },
  abime: { label: "Abîmé", color: "#C1452D" },
};

export const PRIORITES = {
  haute: { label: "Haute", color: "#C1452D" },
  moyenne: { label: "Moyenne", color: "#E8B339" },
  basse: { label: "Basse", color: "#4B5A60" },
};

export function packSuggestions(marque) {
  if (CATALOGUE[marque]) return CATALOGUE[marque].packs.map((p) => p.nom);
  return [];
}

export function mergedPackNames(marque, customPacks) {
  const base = packSuggestions(marque);
  const custom = (customPacks || [])
    .filter((p) => p.marque === marque)
    .map((p) => p.nom);
  return [...new Set([...base, ...custom])];
}

export function extractCountFromPackName(name) {
  const match = name.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function paletteKey(marque, pack, numero) {
  return [marque, pack, numero]
    .map((v) => (v || "").trim().toLowerCase())
    .join("__");
}
