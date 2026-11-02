# Mettre le bot EDB Assistance en ligne (Cloudflare, gratuit)

Durée : environ 20 minutes. Tout se fait dans le navigateur, sans terminal.
Le bot, l'API et la Mini App tournent ensemble sur un seul « Worker » Cloudflare.

## 1. Créer le compte et la base de données

1. Créez un compte gratuit sur **dash.cloudflare.com**.
2. Menu **Storage & Databases → D1 SQL Database → Create**. Nom : `edb-assistance`.
3. Copiez l'**ID de la base** (une suite de chiffres et de lettres). Ce n'est pas un secret.
4. Ouvrez l'onglet **Console** de la base, collez tout le contenu de `server/schema.sql`, puis cliquez sur **Execute**.

## 2. Mettre l'ID dans le projet

Dans `wrangler.toml`, remplacez `A_REMPLACER_PAR_L_ID_DE_LA_BASE_D1` par l'ID copié
(sur GitHub : ouvrir le fichier → icône crayon → Commit changes). Ou envoyez l'ID à Claude.

## 3. Déployer depuis GitHub

1. Menu **Workers & Pages → Create → Import a repository** → choisissez `astephbi/edb-miniapp-demo`.
2. Build command : `npm run build` — Deploy command : `npx wrangler deploy`.
3. Lancez le déploiement. Cloudflare affiche l'adresse du Worker, par exemple
   `https://edb-assistance.votre-nom.workers.dev`.
4. Dans `wrangler.toml`, mettez cette adresse dans `APP_URL`, puis redéployez (chaque commit sur GitHub redéploie tout seul).

## 4. Ajouter les secrets (jamais dans GitHub)

Worker → **Settings → Variables and Secrets → Add**, type **Secret** :

| Nom | Valeur |
| --- | --- |
| `BOT_TOKEN` | le token donné par @BotFather |
| `WEBHOOK_SECRET` | une longue phrase au hasard, sans espace |
| `SETUP_KEY` | une autre phrase au hasard, sans espace |

## 5. Brancher le bot

Ouvrez dans le navigateur : `https://VOTRE-ADRESSE.workers.dev/setup?key=VOTRE_SETUP_KEY`
Tout doit afficher `ok` : webhook, menu, commandes, permissions du groupe.

Puis dans @BotFather : `/myapps` → votre app → **Edit Web App URL** → collez l'adresse du Worker.

## 6. Vérifier

- Dans le bot : `/start`, puis `/aide` (vous voyez les commandes administrateur si vous êtes admin du groupe).
- `/import` suivi de quelques lignes `téléphone;nom;formule;AAAA-MM-JJ`.
- Un proche ouvre le bot, partage son numéro, rejoint le groupe : sa demande est acceptée automatiquement.
- `/cron 2026-12-01` simule une date future pour montrer rappels et retraits en direct.

## Ce qui reste en mode test

- **Paiement** : `PAYMENT_MODE = "test"`, aucun argent n'est débité. Pour le vrai paiement, il faut un compte
  chez un agrégateur mobile money ; on remplace alors la fonction `payer()` de `server/worker.js`.
- **Transcription** : Workers AI (inclus dans le compte Cloudflare) transcrit les audios jusqu'à 20 Mo.
  Les longs replays d'une heure devront être découpés (phase suivante).

## Tester sans Telegram (développeurs)

```bash
npm install && npm run build
npx wrangler d1 execute edb-assistance --local --file=server/schema.sql -c wrangler.test.toml
printf 'BOT_TOKEN=123:TESTTOKEN\nWEBHOOK_SECRET=secret-test\nSETUP_KEY=setup-test\n' > .dev.vars
python3 server/test/mock_telegram.py &          # faux Telegram sur le port 8789
npx wrangler dev -c wrangler.test.toml --local &  # bot sur le port 8787
node server/test/scenario.mjs                    # 40 vérifications
```
