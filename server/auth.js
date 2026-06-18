import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ La variable d'environnement JWT_SECRET est manquante.");
  console.error(
    "   Génère une longue chaîne aléatoire et mets-la dans ton .env.",
  );
  process.exit(1);
}

const COOKIE_NAME = "token";
const TOKEN_TTL = "30d";

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Non authentifié." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Réservé à l'administrateur." });
    }
    next();
  });
}
