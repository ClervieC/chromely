import express from "express";
import { pool } from "../db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
} from "../auth.js";

const router = express.Router();

function publicUser(u) {
  return { id: u.id, email: u.email, pseudo: u.pseudo, role: u.role };
}

router.post("/register", async (req, res) => {
  const { email, password, pseudo } = req.body || {};
  if (!email || !password || !pseudo) {
    return res
      .status(400)
      .json({ error: "Email, mot de passe et pseudo sont requis." });
  }
  if (String(password).length < 8) {
    return res
      .status(400)
      .json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);
  if (existing.rows.length > 0) {
    return res
      .status(409)
      .json({ error: "Un compte existe déjà avec cet email." });
  }

  // Le premier compte créé sur l'instance devient automatiquement administrateur.
  const countRes = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  const role = countRes.rows[0].count === 0 ? "admin" : "user";

  const passwordHash = await hashPassword(password);
  const insertRes = await pool.query(
    "INSERT INTO users (email, password_hash, pseudo, role) VALUES ($1, $2, $3, $4) RETURNING id, email, pseudo, role",
    [normalizedEmail, passwordHash, String(pseudo).trim(), role],
  );
  const user = insertRes.rows[0];
  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    normalizedEmail,
  ]);
  const user = result.rows[0];
  if (!user)
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok)
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT id, email, pseudo, role FROM users WHERE id = $1",
    [req.user.id],
  );
  if (result.rows.length === 0)
    return res.status(401).json({ error: "Utilisateur introuvable." });
  res.json({ user: result.rows[0] });
});

export default router;
