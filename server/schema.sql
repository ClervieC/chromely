-- Schéma de la base de données "Chromely"
-- Exécuté automatiquement au démarrage du serveur (idempotent : IF NOT EXISTS partout)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pseudo TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feutres (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marque TEXT NOT NULL,
  pack TEXT,
  numero TEXT,
  nom TEXT,
  hex TEXT,
  quantite INTEGER NOT NULL DEFAULT 1,
  etat TEXT NOT NULL DEFAULT 'fonctionne', -- 'fonctionne' | 'sec' | 'abime'
  compare_done BOOLEAN NOT NULL DEFAULT false,
  compare_notes TEXT,
  date_achat DATE,
  prix NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  marque TEXT NOT NULL,
  pack TEXT,
  couleur TEXT,
  priorite TEXT NOT NULL DEFAULT 'moyenne', -- 'haute' | 'moyenne' | 'basse'
  prix NUMERIC,
  lien TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Palette partagée : la couleur réelle de chaque numéro, pour chaque marque/pack.
-- Modifiable directement uniquement par l'admin (les autres utilisateurs passent par "proposals").
CREATE TABLE IF NOT EXISTS palette (
  id SERIAL PRIMARY KEY,
  marque TEXT NOT NULL,
  pack TEXT NOT NULL,
  numero TEXT NOT NULL,
  nom TEXT,
  hex TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (marque, pack, numero)
);

-- Catalogue des packs connus, gérable par l'admin (en plus du catalogue statique GuangNa/Tooli-Art/Nicety).
CREATE TABLE IF NOT EXISTS custom_packs (
  id SERIAL PRIMARY KEY,
  marque TEXT NOT NULL,
  nom TEXT NOT NULL,
  taille INTEGER,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- File de propositions des utilisateurs (nouveau pack, ou correction de couleur), validée par l'admin.
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_pack' | 'color_correction'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  marque TEXT,
  pack TEXT,
  numero TEXT,
  nom_propose TEXT,
  hex_propose TEXT,
  taille INTEGER,
  detail TEXT,
  justification TEXT,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);