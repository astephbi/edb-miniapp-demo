-- Base de données du bot EDB Assistance (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS members (
  tg_id      INTEGER PRIMARY KEY,
  prenom     TEXT,
  username   TEXT,
  phone      TEXT,
  niveau     TEXT DEFAULT 'benjamin',
  in_group   INTEGER DEFAULT 0,
  started    INTEGER DEFAULT 0,          -- a démarré le bot (peut recevoir des messages privés)
  created_at TEXT DEFAULT (datetime('now'))
);

-- Une ligne par période payée. Le statut se calcule à partir de la date de fin.
CREATE TABLE IF NOT EXISTS subscriptions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_id      INTEGER NOT NULL,
  formule    TEXT NOT NULL,              -- trimestre | annee
  debut      TEXT NOT NULL,              -- YYYY-MM-DD
  fin        TEXT NOT NULL,              -- YYYY-MM-DD (dernier jour couvert)
  source     TEXT NOT NULL,              -- import | paiement
  montant    INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sub_member ON subscriptions(tg_id, fin);

-- Liste des payeurs fournie par Brice (téléphone = clé de rapprochement)
CREATE TABLE IF NOT EXISTS imports (
  phone      TEXT PRIMARY KEY,           -- format 225XXXXXXXXXX
  nom        TEXT,
  formule    TEXT,
  fin        TEXT,
  matched_tg INTEGER
);

CREATE TABLE IF NOT EXISTS payments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ref        TEXT UNIQUE,
  tg_id      INTEGER NOT NULL,
  formule    TEXT NOT NULL,
  montant    INTEGER NOT NULL,
  moyen      TEXT,
  statut     TEXT NOT NULL,              -- en_attente | paye | echec
  created_at TEXT DEFAULT (datetime('now'))
);

-- Évite d'envoyer deux fois le même rappel
CREATE TABLE IF NOT EXISTS reminders (
  tg_id    INTEGER NOT NULL,
  kind     TEXT NOT NULL,                -- j-7 | j-1 | expire | retrait
  ref_fin  TEXT NOT NULL,
  sent_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (tg_id, kind, ref_fin)
);

-- Contenus postés par les admins dans les salons fermés
CREATE TABLE IF NOT EXISTS contents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id    INTEGER,
  message_id  INTEGER,
  type        TEXT,                      -- audio | video | document | texte
  titre       TEXT,
  file_id     TEXT,
  duree       INTEGER,
  transcript  TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  UNIQUE (topic_id, message_id)
);
