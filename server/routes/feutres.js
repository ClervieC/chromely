import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../auth.js";

const router = express.Router();
router.use(requireAuth);

function toApi(row) {
  return {
    id: row.id,
    marque: row.marque,
    pack: row.pack,
    numero: row.numero,
    nom: row.nom,
    hex: row.hex,
    quantite: row.quantite,
    etat: row.etat,
    dateAchat: row.date_achat,
    prix: row.prix,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM feutres WHERE owner_id = $1 ORDER BY created_at DESC",
    [req.user.id],
  );
  res.json({ feutres: result.rows.map(toApi) });
});

router.post("/", async (req, res) => {
  const f = req.body || {};
  if (!f.marque)
    return res.status(400).json({ error: "La marque est requise." });
  const etatNormalise = f.etat || "fonctionne";
  let existingQuery;
  if (f.pack && f.numero) {
    existingQuery = await pool.query(
      "SELECT * FROM feutres WHERE owner_id=$1 AND marque=$2 AND pack=$3 AND numero=$4 AND etat=$5 LIMIT 1",
      [req.user.id, f.marque, f.pack, f.numero, etatNormalise],
    );
  } else {
    existingQuery = { rows: [] };
  }

  let result;
  if (existingQuery.rows.length > 0) {
    const qty = existingQuery.rows[0].quantite + Math.max(1, Number(f.quantite) || 1);
    result = await pool.query(
      "UPDATE feutres SET quantite=$1 WHERE id=$2 RETURNING *",
      [qty, existingQuery.rows[0].id],
    );
  } else {
    result = await pool.query(
      `INSERT INTO feutres (owner_id, marque, pack, numero, nom, hex, quantite, etat, date_achat, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.user.id,
        f.marque,
        f.pack || null,
        f.numero || null,
        f.nom || null,
        f.hex || null,
        Math.max(1, Number(f.quantite) || 1),
        f.etat || "fonctionne",
        f.dateAchat || null,
        f.notes || null,
      ],
    );
  }

  // Apprentissage automatique de la palette partagée, réservé à l'admin.
  if (req.user.role === "admin" && f.hex && f.numero && f.pack) {
    await pool.query(
      `INSERT INTO palette (marque, pack, numero, nom, hex)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (marque, pack, numero) DO UPDATE SET hex = EXCLUDED.hex, nom = COALESCE(EXCLUDED.nom, palette.nom), updated_at = now()`,
      [f.marque, f.pack, f.numero, f.nom || null, f.hex],
    );
  }

  res.status(201).json({ feutre: toApi(result.rows[0]) });
});

router.put("/:id", async (req, res) => {
  const f = req.body || {};
  const result = await pool.query(
    `UPDATE feutres SET marque=$1, pack=$2, numero=$3, nom=$4, hex=$5, quantite=$6, etat=$7,
       date_achat=$8, prix=$9, notes=$10
     WHERE id=$11 AND owner_id=$12 RETURNING *`,
    [
      f.marque,
      f.pack || null,
      f.numero || null,
      f.nom || null,
      f.hex || null,
      Math.max(1, Number(f.quantite) || 1),
      f.etat || "fonctionne",
      f.dateAchat || null,
      f.prix === "" || f.prix == null ? null : Number(f.prix),
      f.notes || null,
      req.params.id,
      req.user.id,
    ],
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: "Feutre introuvable." });

  if (req.user.role === "admin" && f.hex && f.numero && f.pack) {
    await pool.query(
      `INSERT INTO palette (marque, pack, numero, nom, hex)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (marque, pack, numero) DO UPDATE SET hex = EXCLUDED.hex, nom = COALESCE(EXCLUDED.nom, palette.nom), updated_at = now()`,
      [f.marque, f.pack, f.numero, f.nom || null, f.hex],
    );
  }

  // Fusionner avec un doublon existant (même marque+pack+numero+etat)
  const updated = result.rows[0];
  const dupResult = await pool.query(
    `SELECT * FROM feutres WHERE owner_id=$1 AND marque=$2 AND pack=$3 AND numero=$4 AND etat=$5 AND id != $6 LIMIT 1`,
    [req.user.id, updated.marque, updated.pack, updated.numero, updated.etat, updated.id],
  );
  if (dupResult.rows.length > 0) {
    const dup = dupResult.rows[0];
    const merged = await pool.query(
      `UPDATE feutres SET quantite=$1 WHERE id=$2 RETURNING *`,
      [dup.quantite + updated.quantite, dup.id],
    );
    await pool.query(`DELETE FROM feutres WHERE id=$1`, [updated.id]);
    return res.json({ feutre: toApi(merged.rows[0]), deleted: updated.id });
  }

  res.json({ feutre: toApi(updated) });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM feutres WHERE id = $1 AND owner_id = $2", [
    req.params.id,
    req.user.id,
  ]);
  res.json({ ok: true });
});

// Ajout d'un pack entier : génère toutes les cases numérotées d'un coup.
router.post("/bulk-pack", async (req, res) => {
  const { marque, pack, taille, depart, dateAchat, prixTotal, notes } =
    req.body || {};
  if (!marque || !pack || !taille) {
    return res
      .status(400)
      .json({ error: "Marque, pack et taille sont requis." });
  }
  const n = Math.min(999, Math.max(1, Number(taille)));
  const start = Number(depart) || 1;

  const existingRes = await pool.query(
    "SELECT * FROM feutres WHERE owner_id = $1 AND marque = $2 AND pack = $3",
    [req.user.id, marque, pack],
  );
  const existingByNumero = new Map(existingRes.rows.map((r) => [r.numero, r]));

  const paletteRes = await pool.query(
    "SELECT * FROM palette WHERE marque = $1 AND pack = $2",
    [marque, pack],
  );
  const paletteByNumero = new Map(paletteRes.rows.map((r) => [r.numero, r]));

  let added = 0;
  let incremented = 0;
  let matched = 0;
  const noteText = notes || (prixTotal ? `Pack acheté ${prixTotal} €` : null);

  for (let i = 0; i < n; i++) {
    const numero = String(start + i);
    const existing = existingByNumero.get(numero);
    if (existing) {
      await pool.query(
        "UPDATE feutres SET quantite = quantite + 1 WHERE id = $1",
        [existing.id],
      );
      incremented++;
    } else {
      const match = paletteByNumero.get(numero);
      if (match) matched++;
      await pool.query(
        `INSERT INTO feutres (owner_id, marque, pack, numero, nom, hex, quantite, etat, date_achat, notes)
         VALUES ($1,$2,$3,$4,$5,$6,1,'fonctionne',$7,$8)`,
        [
          req.user.id,
          marque,
          pack,
          numero,
          match?.nom || null,
          match?.hex || null,
          dateAchat || null,
          noteText,
        ],
      );
      added++;
    }
  }

  res.status(201).json({ added, incremented, matched });
});

export default router;
