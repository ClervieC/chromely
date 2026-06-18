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
    couleur: row.couleur,
    priorite: row.priorite,
    prix: row.prix,
    lien: row.lien,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM wishlist WHERE owner_id = $1 ORDER BY created_at DESC",
    [req.user.id],
  );
  res.json({ wishlist: result.rows.map(toApi) });
});

router.post("/", async (req, res) => {
  const w = req.body || {};
  if (!w.marque || !w.pack)
    return res.status(400).json({ error: "Marque et pack sont requis." });
  const result = await pool.query(
    `INSERT INTO wishlist (owner_id, marque, pack, couleur, priorite, prix, lien, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      req.user.id,
      w.marque,
      w.pack,
      w.couleur || null,
      w.priorite || "moyenne",
      w.prix === "" || w.prix == null ? null : Number(w.prix),
      w.lien || null,
      w.notes || null,
    ],
  );
  res.status(201).json({ item: toApi(result.rows[0]) });
});

router.put("/:id", async (req, res) => {
  const w = req.body || {};
  const result = await pool.query(
    `UPDATE wishlist SET marque=$1, pack=$2, couleur=$3, priorite=$4, prix=$5, lien=$6, notes=$7
     WHERE id=$8 AND owner_id=$9 RETURNING *`,
    [
      w.marque,
      w.pack,
      w.couleur || null,
      w.priorite || "moyenne",
      w.prix === "" || w.prix == null ? null : Number(w.prix),
      w.lien || null,
      w.notes || null,
      req.params.id,
      req.user.id,
    ],
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: "Élément introuvable." });
  res.json({ item: toApi(result.rows[0]) });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM wishlist WHERE id = $1 AND owner_id = $2", [
    req.params.id,
    req.user.id,
  ]);
  res.json({ ok: true });
});

export default router;
