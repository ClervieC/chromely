import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());

// ─── Données en mémoire ──────────────────────────────────────────────────────

let nextId = 100;
const uid = () => String(nextId++);

const users = [
  { id: "1", email: "admin@test.fr", pseudo: "Admin", role: "admin", password_hash: "test" },
  { id: "2", email: "user@test.fr",  pseudo: "Alice",  role: "user",  password_hash: "test" },
];

const feutres = [
  { id: "10", owner_id: "1", marque: "GuangNa",    pack: "Dual Tip 80",  numero: "1",  nom: "Rouge primaire",  hex: "#E2231A", quantite: 2, etat: "fonctionne", date_achat: "2024-01-15", prix: 0.45, notes: null,        created_at: new Date().toISOString() },
  { id: "11", owner_id: "1", marque: "GuangNa",    pack: "Dual Tip 80",  numero: "5",  nom: "Jaune soleil",    hex: "#FFD700", quantite: 1, etat: "fonctionne", date_achat: "2024-01-15", prix: 0.45, notes: null,        created_at: new Date().toISOString() },
  { id: "12", owner_id: "1", marque: "Tooli-Art",  pack: "Set 48",       numero: "12", nom: "Bleu cobalt",     hex: "#0047AB", quantite: 1, etat: "seche",      date_achat: "2023-06-01", prix: 0.80, notes: null, created_at: new Date().toISOString() },
  { id: "13", owner_id: "2", marque: "Nicety",     pack: "Set 24",       numero: "3",  nom: "Vert émeraude",   hex: "#50C878", quantite: 3, etat: "fonctionne", date_achat: "2024-03-10", prix: null, notes: "Cadeau",   created_at: new Date().toISOString() },
];

const wishlist = [
  { id: "20", owner_id: "1", marque: "GuangNa", pack: "Metallic 24", couleur: "Or",        priorite: "haute",   prix: 12.99, lien: null, notes: null,             created_at: new Date().toISOString() },
  { id: "21", owner_id: "2", marque: "Tooli-Art", pack: "Neon 12",   couleur: "Rose néon", priorite: "moyenne", prix: null,  lien: null, notes: "Pour projets",   created_at: new Date().toISOString() },
];

const palette = [
  { id: "30", marque: "GuangNa",   pack: "Dual Tip 80", numero: "1",  nom: "Rouge primaire", hex: "#E2231A" },
  { id: "31", marque: "GuangNa",   pack: "Dual Tip 80", numero: "2",  nom: "Rouge carmin",   hex: "#960018" },
  { id: "32", marque: "GuangNa",   pack: "Dual Tip 80", numero: "5",  nom: "Jaune soleil",   hex: "#FFD700" },
  { id: "33", marque: "Tooli-Art", pack: "Set 48",      numero: "12", nom: "Bleu cobalt",    hex: "#0047AB" },
];

const packs = [
  { id: "40", marque: "GuangNa",   nom: "Dual Tip 80", taille: 80, detail: "Dual tip alcool" },
  { id: "41", marque: "Tooli-Art", nom: "Set 48",      taille: 48, detail: null },
  { id: "42", marque: "Nicety",    nom: "Set 24",      taille: 24, detail: null },
];

const proposals = [];

// ─── Auth en mémoire (cookie simple sans JWT) ─────────────────────────────

const sessions = {};

function currentUser(req) {
  const sid = req.cookies?.sid;
  return sid ? sessions[sid] : null;
}

function requireAuth(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Non authentifié." });
  req.user = u;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Accès réservé à l'admin." });
    next();
  });
}

// ─── Routes Auth ─────────────────────────────────────────────────────────────

app.post("/api/auth/register", (req, res) => {
  const { email, password, pseudo } = req.body || {};
  if (!email || !password || !pseudo) return res.status(400).json({ error: "Champs requis." });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: "Email déjà utilisé." });
  const role = users.length === 0 ? "admin" : "user";
  const user = { id: uid(), email, pseudo, role, password_hash: password };
  users.push(user);
  const sid = uid();
  sessions[sid] = user;
  res.cookie("sid", sid, { httpOnly: true });
  res.status(201).json({ user: { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  // En mode mock, n'importe quel mot de passe fonctionne pour les comptes de test
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  const sid = uid();
  sessions[sid] = user;
  res.cookie("sid", sid, { httpOnly: true });
  res.json({ user: { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role } });
});

app.post("/api/auth/logout", (req, res) => {
  const sid = req.cookies?.sid;
  if (sid) delete sessions[sid];
  res.clearCookie("sid");
  res.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u.id, email: u.email, pseudo: u.pseudo, role: u.role } });
});

// ─── Routes Feutres ──────────────────────────────────────────────────────────

function feutreToApi(r) {
  return { id: r.id, marque: r.marque, pack: r.pack, numero: r.numero, nom: r.nom, hex: r.hex, quantite: r.quantite, etat: r.etat, dateAchat: r.date_achat, prix: r.prix, notes: r.notes, createdAt: r.created_at };
}

app.get("/api/feutres", requireAuth, (req, res) => {
  res.json({ feutres: feutres.filter(f => f.owner_id === req.user.id).map(feutreToApi) });
});

app.post("/api/feutres", requireAuth, (req, res) => {
  const f = req.body || {};
  if (!f.marque) return res.status(400).json({ error: "La marque est requise." });
  const etatNormalise = f.etat || "fonctionne";
  const existing = f.numero
    ? feutres.find(x =>
        x.owner_id === req.user.id &&
        x.marque === f.marque &&
        x.pack === f.pack &&
        x.numero === f.numero &&
        x.etat === etatNormalise
      )
    : null;
  if (existing) {
    existing.quantite += Math.max(1, Number(f.quantite) || 1);
    return res.status(201).json({ feutre: feutreToApi(existing) });
  }
  const row = { id: uid(), owner_id: req.user.id, marque: f.marque, pack: f.pack || null, numero: f.numero || null, nom: f.nom || null, hex: f.hex || null, quantite: Math.max(1, Number(f.quantite) || 1), etat: f.etat || "fonctionne", date_achat: f.dateAchat || null, notes: f.notes || null, created_at: new Date().toISOString() };
  feutres.push(row);
  res.status(201).json({ feutre: feutreToApi(row) });
});

app.put("/api/feutres/:id", requireAuth, (req, res) => {
  const idx = feutres.findIndex(f => f.id === req.params.id && f.owner_id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "Feutre introuvable." });
  const f = req.body || {};
  const etatNorm = f.etat || "fonctionne";
  Object.assign(feutres[idx], { marque: f.marque, pack: f.pack || null, numero: f.numero || null, nom: f.nom || null, hex: f.hex || null, quantite: Math.max(1, Number(f.quantite) || 1), etat: etatNorm, date_achat: f.dateAchat || null, prix: f.prix == null || f.prix === "" ? null : Number(f.prix), notes: f.notes || null });
  // Fusionner avec un doublon existant (même marque+pack+numero+etat)
  const current = feutres[idx];
  const dup = feutres.find(g => g.id !== current.id && g.owner_id === req.user.id && g.marque === current.marque && g.pack === current.pack && g.numero === current.numero && g.etat === current.etat);
  if (dup) {
    dup.quantite += current.quantite;
    const deletedId = current.id;
    feutres.splice(idx, 1);
    return res.json({ feutre: feutreToApi(dup), deleted: deletedId });
  }
  res.json({ feutre: feutreToApi(current) });
});

app.delete("/api/feutres/:id", requireAuth, (req, res) => {
  const idx = feutres.findIndex(f => f.id === req.params.id && f.owner_id === req.user.id);
  if (idx !== -1) feutres.splice(idx, 1);
  res.json({ ok: true });
});

app.post("/api/feutres/bulk-pack", requireAuth, (req, res) => {
  const { marque, pack, taille, depart, dateAchat, prixTotal, notes } = req.body || {};
  if (!marque || !pack || !taille) return res.status(400).json({ error: "Marque, pack et taille requis." });
  const n = Math.min(999, Math.max(1, Number(taille)));
  const start = Number(depart) || 1;
  let added = 0, incremented = 0, matched = 0;
  const noteText = notes || (prixTotal ? `Pack acheté ${prixTotal} €` : null);
  for (let i = 0; i < n; i++) {
    const numero = String(start + i);
    const existing = feutres.find(f => f.owner_id === req.user.id && f.marque === marque && f.pack === pack && f.numero === numero);
    if (existing) { existing.quantite++; incremented++; }
    else {
      const match = palette.find(p => p.marque === marque && p.pack === pack && p.numero === numero);
      if (match) matched++;
      feutres.push({ id: uid(), owner_id: req.user.id, marque, pack, numero, nom: match?.nom || null, hex: match?.hex || null, quantite: 1, etat: "fonctionne", date_achat: dateAchat || null, prix: null, notes: noteText, created_at: new Date().toISOString() });
      added++;
    }
  }
  res.status(201).json({ added, incremented, matched });
});

// ─── Routes Wishlist ─────────────────────────────────────────────────────────

function wlToApi(r) {
  return { id: r.id, marque: r.marque, pack: r.pack, couleur: r.couleur, priorite: r.priorite, prix: r.prix, lien: r.lien, notes: r.notes, createdAt: r.created_at };
}

app.get("/api/wishlist", requireAuth, (req, res) => {
  res.json({ wishlist: wishlist.filter(w => w.owner_id === req.user.id).map(wlToApi) });
});

app.post("/api/wishlist", requireAuth, (req, res) => {
  const w = req.body || {};
  if (!w.marque || !w.pack) return res.status(400).json({ error: "Marque et pack requis." });
  const row = { id: uid(), owner_id: req.user.id, marque: w.marque, pack: w.pack, couleur: w.couleur || null, priorite: w.priorite || "moyenne", prix: w.prix == null || w.prix === "" ? null : Number(w.prix), lien: w.lien || null, notes: w.notes || null, created_at: new Date().toISOString() };
  wishlist.push(row);
  res.status(201).json({ item: wlToApi(row) });
});

app.put("/api/wishlist/:id", requireAuth, (req, res) => {
  const idx = wishlist.findIndex(w => w.id === req.params.id && w.owner_id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "Élément introuvable." });
  const w = req.body || {};
  Object.assign(wishlist[idx], { marque: w.marque, pack: w.pack, couleur: w.couleur || null, priorite: w.priorite || "moyenne", prix: w.prix == null || w.prix === "" ? null : Number(w.prix), lien: w.lien || null, notes: w.notes || null });
  res.json({ item: wlToApi(wishlist[idx]) });
});

app.delete("/api/wishlist/:id", requireAuth, (req, res) => {
  const idx = wishlist.findIndex(w => w.id === req.params.id && w.owner_id === req.user.id);
  if (idx !== -1) wishlist.splice(idx, 1);
  res.json({ ok: true });
});

// ─── Routes Palette ──────────────────────────────────────────────────────────

function palToApi(r) {
  return { id: r.id, marque: r.marque, pack: r.pack, numero: r.numero, nom: r.nom, hex: r.hex };
}

app.get("/api/palette", requireAuth, (req, res) => {
  res.json({ palette: palette.map(palToApi) });
});

app.post("/api/palette", requireAdmin, (req, res) => {
  const { marque, pack, numero, nom, hex } = req.body || {};
  if (!marque || !pack || !numero) return res.status(400).json({ error: "Marque, pack et numéro requis." });
  const existing = palette.find(p => p.marque === marque && p.pack === pack && p.numero === numero);
  if (existing) { existing.nom = nom || existing.nom; existing.hex = hex || existing.hex; return res.status(201).json({ entry: palToApi(existing) }); }
  const row = { id: uid(), marque, pack, numero, nom: nom || null, hex: hex || null };
  palette.push(row);
  res.status(201).json({ entry: palToApi(row) });
});

app.post("/api/palette/bulk-import", requireAdmin, (req, res) => {
  const { marque, pack, text } = req.body || {};
  if (!marque || !pack || !text) return res.status(400).json({ error: "Marque, pack et texte requis." });
  let count = 0;
  for (const line of String(text).split(/\n+/).map(l => l.trim()).filter(Boolean)) {
    const parts = line.split(/[,;\t]+/).map(p => p.trim()).filter(Boolean);
    let numero = "", nom = "", hex = "";
    for (const p of parts) {
      if (/^#?[0-9a-f]{6}$/i.test(p)) hex = p.startsWith("#") ? p : "#" + p;
      else if (/^\d+$/.test(p) && !numero) numero = p;
      else if (!nom) nom = p;
    }
    if (!numero) continue;
    const existing = palette.find(p => p.marque === marque && p.pack === pack && p.numero === numero);
    if (existing) { existing.nom = nom || existing.nom; existing.hex = hex || existing.hex; }
    else palette.push({ id: uid(), marque, pack, numero, nom: nom || null, hex: hex || null });
    count++;
  }
  res.status(201).json({ count });
});

app.post("/api/palette/analyze-photo", requireAdmin, async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(501).json({ error: "Fonctionnalité non configurée : ajoute OPENROUTER_API_KEY dans ton .env. Clé gratuite sur https://openrouter.ai" });
  }
  const { base64, mediaType } = req.body || {};
  if (!base64) return res.status(400).json({ error: "Image manquante." });
  const prompt = 'Tu vois une photo de feutres/marqueurs acryliques ou d\'un nuancier de couleurs. Pour chaque feutre ou case de couleur visible, identifie : le numéro ou code écrit s\'il y en a un, le nom de la couleur s\'il y en a un, et une estimation du code couleur hexadécimal d\'après ce que tu vois sur la photo. Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte autour, sans balises markdown, au format exact : [{"numero":"1","nom":"","hex":"#RRGGBB"}]. Si un champ est inconnu, laisse une chaîne vide. Ne réponds rien d\'autre que ce tableau JSON.';
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
    if (!response.ok) { console.error("Erreur OpenRouter :", data); return res.status(502).json({ error: "Erreur de l'API d'analyse d'image." }); }
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) throw new Error("Format inattendu");
    const results = parsed.map(p => ({
      numero: String(p.numero || "").trim(),
      nom: (p.nom || "").trim(),
      hex: /^#?[0-9a-f]{6}$/i.test(p.hex || "") ? (p.hex.startsWith("#") ? p.hex : "#" + p.hex) : "",
    }));
    res.json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Impossible d'analyser cette photo. Essaie une photo plus nette et bien éclairée." });
  }
});

app.delete("/api/palette/:id", requireAdmin, (req, res) => {
  const idx = palette.findIndex(p => p.id === req.params.id);
  if (idx !== -1) palette.splice(idx, 1);
  res.json({ ok: true });
});

// ─── Routes Packs ────────────────────────────────────────────────────────────

function packToApi(r) {
  return { id: r.id, marque: r.marque, nom: r.nom, taille: r.taille, detail: r.detail };
}

app.get("/api/packs", requireAuth, (req, res) => {
  res.json({ packs: packs.map(packToApi) });
});

app.post("/api/packs", requireAdmin, (req, res) => {
  const { marque, nom, taille, detail } = req.body || {};
  if (!marque || !nom) return res.status(400).json({ error: "Marque et nom requis." });
  const row = { id: uid(), marque, nom, taille: taille ? Number(taille) : null, detail: detail || null };
  packs.push(row);
  res.status(201).json({ pack: packToApi(row) });
});

app.delete("/api/packs/:id", requireAdmin, (req, res) => {
  const idx = packs.findIndex(p => p.id === req.params.id);
  if (idx !== -1) packs.splice(idx, 1);
  res.json({ ok: true });
});

// ─── Routes Proposals ────────────────────────────────────────────────────────

function propToApi(r) {
  return { id: r.id, authorId: r.author_id, authorPseudo: r.author_pseudo, type: r.type, status: r.status, marque: r.marque, pack: r.pack, numero: r.numero, nomPropose: r.nom_propose, hexPropose: r.hex_propose, taille: r.taille, detail: r.detail, justification: r.justification, reviewNote: r.review_note, createdAt: r.created_at, reviewedAt: r.reviewed_at };
}

app.post("/api/proposals", requireAuth, (req, res) => {
  const p = req.body || {};
  if (!["new_pack", "color_correction"].includes(p.type)) return res.status(400).json({ error: "Type invalide." });
  if (!p.marque || !p.pack) return res.status(400).json({ error: "Marque et pack requis." });
  const row = { id: uid(), author_id: req.user.id, author_pseudo: req.user.pseudo, type: p.type, status: "pending", marque: p.marque, pack: p.pack, numero: p.numero || null, nom_propose: p.nomPropose || null, hex_propose: p.hexPropose || null, taille: p.taille ? Number(p.taille) : null, detail: p.detail || null, justification: p.justification || null, review_note: null, created_at: new Date().toISOString(), reviewed_at: null };
  proposals.push(row);
  res.status(201).json({ proposal: propToApi(row) });
});

app.get("/api/proposals/mine", requireAuth, (req, res) => {
  res.json({ proposals: proposals.filter(p => p.author_id === req.user.id).map(propToApi) });
});

app.get("/api/proposals", requireAdmin, (req, res) => {
  const { status } = req.query;
  const filtered = status ? proposals.filter(p => p.status === status) : proposals;
  res.json({ proposals: filtered.map(propToApi) });
});

app.post("/api/proposals/:id/approve", requireAdmin, (req, res) => {
  const prop = proposals.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: "Proposition introuvable." });
  if (prop.status !== "pending") return res.status(400).json({ error: "Déjà traitée." });
  prop.status = "approved";
  prop.review_note = req.body?.reviewNote || null;
  prop.reviewed_at = new Date().toISOString();
  res.json({ proposal: propToApi(prop) });
});

app.post("/api/proposals/:id/reject", requireAdmin, (req, res) => {
  const prop = proposals.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: "Proposition introuvable." });
  prop.status = "rejected";
  prop.review_note = req.body?.reviewNote || null;
  prop.reviewed_at = new Date().toISOString();
  res.json({ proposal: propToApi(prop) });
});

// ─── Routes Users (admin) ────────────────────────────────────────────────────

app.get("/api/users", requireAdmin, (req, res) => {
  res.json({ users: users.map(u => ({ id: u.id, email: u.email, pseudo: u.pseudo, role: u.role, created_at: new Date().toISOString() })) });
});

app.put("/api/users/:id/role", requireAdmin, (req, res) => {
  const { role } = req.body || {};
  if (!["user", "admin"].includes(role)) return res.status(400).json({ error: "Rôle invalide." });
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });
  user.role = role;
  res.json({ user: { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role } });
});

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => res.json({ ok: true, mode: "mock" }));

// ─── Serve frontend si buildé ────────────────────────────────────────────────

const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
  app.get("/", (req, res) => res.send("Mode mock actif. Lance `npm run dev:client` pour le frontend."));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🧪 Chromely MOCK lancé sur http://localhost:${PORT}`);
  console.log(`   Comptes de test :`);
  console.log(`   → admin@test.fr  (rôle : admin)`);
  console.log(`   → user@test.fr   (rôle : user)`);
  console.log(`   Mot de passe : n'importe lequel`);
});
