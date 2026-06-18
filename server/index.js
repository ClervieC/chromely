import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { initSchema } from "./db.js";
import authRoutes from "./routes/auth.js";
import feutresRoutes from "./routes/feutres.js";
import wishlistRoutes from "./routes/wishlist.js";
import paletteRoutes from "./routes/palette.js";
import packsRoutes from "./routes/packs.js";
import proposalsRoutes from "./routes/proposals.js";
import usersRoutes from "./routes/users.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "12mb" })); // limite relevée pour les photos en base64
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/feutres", feutresRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/palette", paletteRoutes);
app.use("/api/packs", packsRoutes);
app.use("/api/proposals", proposalsRoutes);
app.use("/api/users", usersRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Sert le frontend buildé (client/dist) une fois `npm run build` exécuté.
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send(
      "Le frontend n'est pas encore buildé. Lance `npm run build` puis relance le serveur, ou utilise `npm run dev:client` en développement.",
    );
  });
}

// Gestion d'erreurs générique (évite de planter le process sur une erreur async non gérée).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

const PORT = process.env.PORT || 4000;

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🖊️  Chromely lancé sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "❌ Impossible d'initialiser la base de données :",
      err.message,
    );
    process.exit(1);
  });
