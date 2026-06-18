import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ La variable d'environnement DATABASE_URL est manquante.");
  console.error(
    "   Crée un fichier .env (voir .env.example) avec ton URL de connexion Postgres.",
  );
  process.exit(1);
}

// Supabase (et la plupart des hébergeurs Postgres gratuits) exigent SSL,
// mais avec un certificat non reconnu par défaut par Node : on désactive donc
// la vérification stricte (rejectUnauthorized: false). C'est le réglage standard
// recommandé par Supabase pour ce cas précis.
const useSsl = process.env.DATABASE_SSL !== "false";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export async function initSchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schema);
  console.log("✅ Schéma de base de données vérifié/initialisé.");
}

export async function query(text, params) {
  return pool.query(text, params);
}
