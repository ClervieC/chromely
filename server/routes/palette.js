import express from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";

const router = express.Router();

function toApi(row) {
  return {
    id: row.id,
    marque: row.marque,
    pack: row.pack,
    numero: row.numero,
    nom: row.nom,
    hex: row.hex,
  };
}

router.get("/", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM palette ORDER BY marque, pack, numero",
  );
  res.json({ palette: result.rows.map(toApi) });
});

router.post("/", requireAdmin, async (req, res) => {
  const { marque, pack, numero, nom, hex } = req.body || {};
  if (!marque || !pack || !numero) {
    return res
      .status(400)
      .json({ error: "Marque, pack et numéro sont requis." });
  }
  const result = await pool.query(
    `INSERT INTO palette (marque, pack, numero, nom, hex)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (marque, pack, numero) DO UPDATE SET
       nom = COALESCE(EXCLUDED.nom, palette.nom),
       hex = COALESCE(EXCLUDED.hex, palette.hex),
       updated_at = now()
     RETURNING *`,
    [marque, pack, numero, nom || null, hex || null],
  );
  res.status(201).json({ entry: toApi(result.rows[0]) });
});

// Import en masse depuis un texte collé ("1, Rouge vif, #E2231A" par ligne).
router.post("/bulk-import", requireAdmin, async (req, res) => {
  const { marque, pack, text } = req.body || {};
  if (!marque || !pack || !text)
    return res
      .status(400)
      .json({ error: "Marque, pack et texte sont requis." });

  const lines = String(text)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  let count = 0;
  for (const line of lines) {
    const parts = line
      .split(/[,;\t]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) continue;
    let numero = "";
    let nom = "";
    let hex = "";
    for (const p of parts) {
      if (/^#?[0-9a-f]{6}$/i.test(p)) hex = p.startsWith("#") ? p : "#" + p;
      else if (/^\d+$/.test(p) && !numero) numero = p;
      else if (!nom) nom = p;
    }
    if (!numero && parts[0]) numero = parts[0];
    if (!numero) continue;
    await pool.query(
      `INSERT INTO palette (marque, pack, numero, nom, hex)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (marque, pack, numero) DO UPDATE SET
         nom = COALESCE(EXCLUDED.nom, palette.nom),
         hex = COALESCE(EXCLUDED.hex, palette.hex),
         updated_at = now()`,
      [marque, pack, numero, nom || null, hex || null],
    );
    count++;
  }
  res.status(201).json({ count });
});

// Reconnaissance des couleurs depuis une photo, via OpenRouter (nécessite OPENROUTER_API_KEY).
router.post("/analyze-photo", requireAdmin, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(501).json({
      error:
        "Fonctionnalité non configurée : ajoute OPENROUTER_API_KEY dans ton .env. Clé gratuite sur https://openrouter.ai",
    });
  }
  const { base64, mediaType } = req.body || {};
  if (!base64) return res.status(400).json({ error: "Image manquante." });

  const prompt =
    'Tu vois une photo de feutres/marqueurs acryliques ou d\'un nuancier de couleurs. Pour chaque feutre ou case de couleur visible, identifie : le numéro ou code écrit s\'il y en a un, le nom de la couleur s\'il y en a un, et une estimation du code couleur hexadécimal d\'après ce que tu vois sur la photo. Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte autour, sans balises markdown, au format exact : [{"numero":"1","nom":"","hex":"#RRGGBB"}]. Si un champ est inconnu, laisse une chaîne vide. Ne réponds rien d\'autre que ce tableau JSON.';

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen2-vl-7b-instruct:free",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mediaType || "image/jpeg"};base64,${base64}` } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Erreur OpenRouter :", data);
      return res.status(502).json({ error: "Erreur de l'API d'analyse d'image." });
    }
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) throw new Error("Format inattendu");
    const results = parsed.map((p) => ({
      numero: String(p.numero || "").trim(),
      nom: (p.nom || "").trim(),
      hex: /^#?[0-9a-f]{6}$/i.test(p.hex || "")
        ? (p.hex || "").startsWith("#")
          ? p.hex
          : "#" + p.hex
        : "",
    }));
    res.json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: "Impossible d'analyser cette photo. Essaie une photo plus nette et bien éclairée.",
    });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await pool.query("DELETE FROM palette WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
});

export default router;
