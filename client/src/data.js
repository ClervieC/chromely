export const CATALOGUE = {
  GuangNa: {
    intro:
      "Marque chinoise de feutres acryliques à pointe pinceau souple, très utilisée pour le coloriage mystère. Vendue en grosses boîtes multi-couleurs plutôt qu'en collections thématiques.",
    packs: [
      {
        nom: "12 couleurs",
        detail: "Petit pack double-pointe pour découvrir la marque.",
      },
      { nom: "72 couleurs", detail: "Pointe brush souple." },
      { nom: "120 couleurs", detail: "Pointe brush souple." },
      { nom: "168 couleurs", detail: "Pointe brush souple." },
      { nom: "200 couleurs", detail: "Sortie plus récente, pointe brush." },
      {
        nom: "240 couleurs",
        detail: "Le pack le plus populaire, pointe ultra-souple.",
      },
      {
        nom: "288 couleurs",
        detail: "Le plus grand pack identifié à ce jour.",
      },
    ],
  },
  "Tooli-Art": {
    intro:
      "Marque américaine haut de gamme, double pointe (0,7 mm extra-fine + pinceau ou 3 mm medium). Vendue par collections thématiques — environ 462 feutres sur l'ensemble de la gamme.",
    packs: [
      {
        nom: "Essential+ (30)",
        detail: "28 couleurs assorties + 1 blanc + 1 noir.",
      },
      { nom: "Black & White (21)", detail: "Noirs et blancs, double pointe." },
      { nom: "Metallic (24)", detail: "Teintes métalliques." },
      { nom: "Neon (24)", detail: "Fluorescents." },
      { nom: "Wildflowers (28)", detail: "Tons floraux." },
      { nom: "Skin & Earth Tones (36)", detail: "Teintes peau et terre." },
    ],
    note: "Tailles non confirmées pour certaines collections thématiques — vérifie le nuancier officiel.",
  },
  Nicety: {
    intro:
      "Marque vendue principalement sur Amazon, bon rapport qualité-prix pour débuter.",
    packs: [
      { nom: "84 couleurs", detail: "Pointe brush 1-5 mm." },
      {
        nom: "128 couleurs",
        detail: "Double pointe : fine 1 mm + pinceau 0,5-5 mm.",
      },
      { nom: "136 couleurs", detail: "Pointe extra-fine 0,7 mm." },
      { nom: "180 couleurs", detail: "Pointe brush 1-6 mm." },
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
