# EDB Assistance — Mini App Telegram (démo)

Démo cliquable de l'application Telegram pour la communauté EDB Assistance.
Toutes les données sont **fictives** et les paiements sont **simulés**.

## Ce que montre la démo

| Écran | Douleurs traitées (voir le document de roadmap) |
| --- | --- |
| Accueil : statut d'abonnement, niveau, reprise d'écoute, agenda | 1, 2, 15, 16, 24 |
| Abonnement : formule, Wave / Orange / Moov / Djamo, reçu | 1, 2, 3 |
| Bibliothèque : recherche **dans le contenu des audios**, filtres par société, accès réservé aux abonnés | 5, 14 |
| Lecteur : transcription horodatée, vitesse, position mémorisée | 15 |
| Assistant : réponses sourcées, refus du conseil personnalisé, renvoi vers un analyste | 10, 20 |
| Rendez-vous analyste | 11 |
| Parcours nouveau membre | 25, 26, 27 |
| Espace coach : file de questions, fiche du membre, réponse écrite ou vocale, FAQ, rendez-vous, tâches de suivi | 9 à 13 |
| Espace Brice : pilotage, relances, membres, annonce unique, qualité du coaching | 1, 3, 4, 6, 9 |

Astuce de démo n°1 : en vue **Membre**, posez une question inconnue à l'assistant et transmettez-la ; en vue **Coach**, répondez (texte + vocal) ; revenez en vue **Membre** : la réponse est sur l'accueil.

Astuce de démo n°2 : en vue **Membre**, payez l'abonnement, puis passez en vue **Brice** :
le paiement apparaît dans « Derniers paiements » et les compteurs bougent.

## Lancer en local

```bash
npm install
npm run dev          # http://localhost:5173
```

## Mettre la démo dans Telegram (15 minutes)

1. **Héberger en HTTPS** (obligatoire pour Telegram). Le plus simple :
   `npm run build`, puis glisser le dossier `dist/` sur Netlify Drop (app.netlify.com/drop)
   ou déployer sur Vercel. On obtient une adresse du type `https://edb-demo.netlify.app`.
2. **Créer un bot de test** : dans Telegram, ouvrir @BotFather → `/newbot` → choisir un nom.
3. **Créer la Mini App** : toujours dans BotFather → `/newapp` → choisir le bot → coller l'adresse HTTPS.
   BotFather donne un lien `t.me/<bot>/<app>` qui ouvre l'app en plein écran.
4. **Bouton menu** (optionnel) : BotFather → `/mybots` → le bot → *Bot Settings* → *Menu Button* → coller l'adresse.
5. Ouvrir le lien sur le téléphone : l'app prend automatiquement le thème clair ou sombre de Telegram,
   le prénom du compte Telegram, le bouton retour natif et les vibrations.

`npm run build:single` produit aussi un fichier unique `dist-single/index.html` à partager tel quel.

## Ce qui manque pour la vraie version (phase Pilote)

- **API Symfony** : abonnés, paiements, contenus, droits d'accès.
- **Vérification de `initData`** côté serveur avec le token du bot (sinon n'importe qui peut se faire passer pour un abonné).
- **Agrégateur de paiement** mobile money avec confirmation automatique (webhook).
- **Bot administrateur du groupe** pour retirer / réintégrer les membres (nomination par Brice).
- **Transcription** des vrais audios et **assistant IA** limité aux contenus EDB.

## Structure

```
src/
  App.vue            navigation, bascule Membre / Brice
  telegram.js        intégration SDK Telegram (thème, bouton retour, vibrations)
  store.js           état partagé (abonnement, lecture, reçus)
  data.js            données fictives
  views/             Accueil, Abonnement, Bibliotheque, Lecteur, Assistant, Rdv, Parcours, Admin
```
