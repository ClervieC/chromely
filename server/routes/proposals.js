import express from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";

const router = express.Router();
router.use(requireAuth);

function toApi(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    authorPseudo: row.author_pseudo,
    type: row.type,
    status: row.status,
    marque: row.marque,
    pack: row.pack,
    numero: row.numero,
    nomPropose: row.nom_propose,
    hexPropose: row.hex_propose,
    taille: row.taille,
    detail: row.detail,
    justification: row.justification,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

// Créer une proposition (n'importe quel utilisateur connecté).
router.post("/", async (req, res) => {
  const p = req.body || {};
  if (!["new_pack", "color_correction"].includes(p.type)) {
    return res.status(400).json({ error: "Type de proposition invalide." });
  }
  if (!p.marque || !p.pack) {
    return res.status(400).json({ error: "Marque et pack sont requis." });
  }
  if (p.type === "color_correction" && !p.numero) {
    return res
      .status(400)
      .json({
        error: "Le numéro du feutre est requis pour une correction de couleur.",
      });
  }

  const result = await pool.query(
    `INSERT INTO proposals (author_id, type, marque, pack, numero, nom_propose, hex_propose, taille, detail, justification)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      req.user.id,
      p.type,
      p.marque,
      p.pack,
      p.numero || null,
      p.nomPropose || null,
      p.hexPropose || null,
      p.taille ? Number(p.taille) : null,
      p.detail || null,
      p.justification || null,
    ],
  );
  res
    .status(201)
    .json({
      proposal: toApi({ ...result.rows[0], author_pseudo: req.user.pseudo }),
    });
});

// Mes propositions et leur statut.
router.get("/mine", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM proposals WHERE author_id = $1 ORDER BY created_at DESC",
    [req.user.id],
  );
  res.json({
    proposals: result.rows.map((r) =>
      toApi({ ...r, author_pseudo: req.user.pseudo }),
    ),
  });
});

// Toutes les propositions, réservé à l'admin.
router.get("/", requireAdmin, async (req, res) => {
  const status = req.query.status;
  const result = await pool.query(
    `SELECT p.*, u.pseudo AS author_pseudo FROM proposals p
     JOIN users u ON u.id = p.author_id
     ${status ? "WHERE p.status = $1" : ""}
     ORDER BY p.created_at DESC`,
    status ? [status] : [],
  );
  res.json({ proposals: result.rows.map(toApi) });
});

// Approuver une proposition : applique le changement dans la palette ou le catalogue partagé.
router.post("/:id/approve", requireAdmin, async (req, res) => {
  const result = await pool.query("SELECT * FROM proposals WHERE id = $1", [
    req.params.id,
  ]);
  const proposal = result.rows[0];
  if (!proposal)
    return res.status(404).json({ error: "Proposition introuvable." });
  if (proposal.status !== "pending")
    return res.status(400).json({ error: "Proposition déjà traitée." });

  if (proposal.type === "new_pack") {
    await pool.query(
      "INSERT INTO custom_packs (marque, nom, taille, detail) VALUES ($1,$2,$3,$4)",
      [proposal.marque, proposal.pack, proposal.taille, proposal.detail],
    );
  } else if (proposal.type === "color_correction") {
    await pool.query(
      `INSERT INTO palette (marque, pack, numero, nom, hex)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (marque, pack, numero) DO UPDATE SET
         nom = COALESCE(EXCLUDED.nom, palette.nom),
         hex = COALESCE(EXCLUDED.hex, palette.hex),
         updated_at = now()`,
      [
        proposal.marque,
        proposal.pack,
        proposal.numero,
        proposal.nom_propose,
        proposal.hex_propose,
      ],
    );
  }

  const updated = await pool.query(
    "UPDATE proposals SET status = 'approved', review_note = $1, reviewed_at = now() WHERE id = $2 RETURNING *",
    [req.body?.reviewNote || null, req.params.id],
  );
  res.json({ proposal: toApi(updated.rows[0]) });
});

router.post("/:id/reject", requireAdmin, async (req, res) => {
  const updated = await pool.query(
    "UPDATE proposals SET status = 'rejected', review_note = $1, reviewed_at = now() WHERE id = $2 RETURNING *",
    [req.body?.reviewNote || null, req.params.id],
  );
  if (updated.rows.length === 0)
    return res.status(404).json({ error: "Proposition introuvable." });
  res.json({ proposal: toApi(updated.rows[0]) });
});

export default router;
