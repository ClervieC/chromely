// ─── Palette de couleurs connues ─────────────────────────────────────────────
//
// Format :
//   MARQUE > NOM_DU_PACK > tableau de { numero, nom (optionnel), hex }
//
// Ce fichier est chargé au démarrage du mock et sera utilisé comme données
// initiales quand on passera à une vraie base de données.
//
// Le numéro doit correspondre exactement à ce qui est inscrit sur le feutre.
// Le hex doit être au format #RRGGBB (6 chiffres).

export const SEED_PALETTE = {
  GuangNa: {
    "24 couleurs": [
      { numero: "603", hex: "#fdeb05" },
      { numero: "604", hex: "#fc8d31" },
      { numero: "606", hex: "#d462a8" },
      { numero: "605", hex: "#e2422a" },
      { numero: "614", hex: "#53c150" },
      { numero: "609", hex: "#027d69" },
      { numero: "615", hex: "#fecb02" },
      { numero: "618", hex: "#e29b25" },
      { numero: "655", hex: "#ff8fcd" },
      { numero: "612", hex: "#fd7c98" },
      { numero: "619", hex: "#e06263" },
      { numero: "622", hex: "#539d86" },
      { numero: "601", hex: "#01a7f1" },
      { numero: "608", hex: "#014ba0" },
      { numero: "607", hex: "#5c4b9b" },
      { numero: "620", hex: "#7b4638" },
      { numero: "600", hex: "#ffffff" },
      { numero: "611", hex: "#000000" },
      { numero: "634", hex: "#397832" },
      { numero: "602", hex: "#00b6a7" },
      { numero: "616", hex: "#017db1" },
      { numero: "617", hex: "#024490" },
      { numero: "623", hex: "#a97bc3" },
      { numero: "613", hex: "#602092" },
    ],
    "240 couleurs": [
      { numero: "1", nom: "Rouge primaire", hex: "#E2231A" },
      { numero: "2", nom: "Rouge carmin", hex: "#960018" },
      { numero: "3", nom: "Rouge fraise", hex: "#C0392B" },
      { numero: "4", nom: "Rouge tomate", hex: "#D93025" },
      { numero: "5", nom: "Jaune soleil", hex: "#FFD700" },
      // Ajoute tes couleurs ici...
    ],

    "120 couleurs": [
      { numero: "1", nom: "Rouge primaire", hex: "#E2231A" },
      { numero: "5", nom: "Jaune soleil", hex: "#FFD700" },
      // Ajoute tes couleurs ici...
    ],

    "360 couleurs": [{ numero: "", hex: "" }],

    // Ajoute d'autres packs GuangNa ici...
  },

  "Tooli-Art": {
    "Essential+ (30)": [
      { numero: "1", nom: "Noir", hex: "#1A1A1A" },
      { numero: "2", nom: "Blanc", hex: "#F5F5F5" },
      // Ajoute tes couleurs ici...
    ],

    "Neon (24)": [
      { numero: "1", nom: "Rose néon", hex: "#FF1493" },
      { numero: "2", nom: "Orange fluo", hex: "#FF6600" },
      // Ajoute tes couleurs ici...
    ],

    // Ajoute d'autres packs Tooli-Art ici...
  },

  Nicety: {
    "128 couleurs": [
      // Ajoute tes couleurs ici...
    ],
  },

  // Ajoute d'autres marques ici, par exemple :
  // Copic: {
  //   "Sketch": [
  //     { numero: "BV000", nom: "Iridescent Mauve", hex: "#E8D5E8" },
  //   ],
  // },
};

// ─── Conversion en tableau plat pour le mock ──────────────────────────────────

let _nextSeedId = 1000;

export function buildSeedPalette() {
  const entries = [];
  for (const [marque, packs] of Object.entries(SEED_PALETTE)) {
    for (const [pack, colors] of Object.entries(packs)) {
      for (const color of colors) {
        if (!color.hex || !color.numero) continue;
        entries.push({
          id: String(_nextSeedId++),
          marque,
          pack,
          numero: color.numero,
          nom: color.nom || null,
          hex: color.hex,
        });
      }
    }
  }
  return entries;
}
