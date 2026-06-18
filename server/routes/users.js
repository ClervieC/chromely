import express from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../auth.js";

const router = express.Router();
router.use(requireAdmin);

router.get("/", async (req, res) => {
  const result = await pool.query(
    "SELECT id, email, pseudo, role, created_at FROM users ORDER BY created_at ASC",
  );
  res.json({ users: result.rows });
});

router.put("/:id/role", async (req, res) => {
  const { role } = req.body || {};
  if (!["user", "admin"].includes(role))
    return res.status(400).json({ error: "Rôle invalide." });
  const result = await pool.query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, pseudo, role",
    [role, req.params.id],
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: "Utilisateur introuvable." });
  res.json({ user: result.rows[0] });
});

export default router;
