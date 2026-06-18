import express from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";

const router = express.Router();

function toApi(row) {
  return {
    id: row.id,
    marque: row.marque,
    nom: row.nom,
    taille: row.taille,
    detail: row.detail,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM custom_packs ORDER BY marque, nom",
  );
  res.json({ packs: result.rows.map(toApi) });
});

router.post("/", requireAdmin, async (req, res) => {
  const { marque, nom, taille, detail } = req.body || {};
  if (!marque || !nom)
    return res
      .status(400)
      .json({ error: "Marque et nom du pack sont requis." });
  const result = await pool.query(
    "INSERT INTO custom_packs (marque, nom, taille, detail) VALUES ($1,$2,$3,$4) RETURNING *",
    [marque, nom, taille ? Number(taille) : null, detail || null],
  );
  res.status(201).json({ pack: toApi(result.rows[0]) });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM custom_packs WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
