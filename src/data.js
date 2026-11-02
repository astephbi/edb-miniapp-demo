// TOUTES LES DONNÉES CI-DESSOUS SONT FICTIVES (démo).
// Aucun contenu, chiffre ou membre réel de la communauté EDB n'est reproduit.

export const NIVEAUX = [
  { id: 'benjamin', nom: 'Benjamins', objectif: '1 million / an', seuil: 1_000_000, couleur: '#3b82f6' },
  { id: 'palier', nom: 'Palier 3M', objectif: '3 millions / an', seuil: 3_000_000, couleur: '#8b5cf6', nouveau: true },
  { id: 'cadet', nom: 'Cadets', objectif: '6 millions / an', seuil: 6_000_000, couleur: '#f59e0b' },
  { id: 'senior', nom: 'Seniors', objectif: '12 millions / an', seuil: 12_000_000, couleur: '#ef4444' }
]

export const FORMULES = [
  { id: 'trimestre', nom: 'Trimestre', prix: 20000, duree: '3 mois', mois: 3 },
  { id: 'annee', nom: 'Année', prix: 70000, duree: '12 mois', mois: 12, badge: '10 000 F économisés' }
]

export const MOYENS = [
  { id: 'wave', nom: 'Wave', couleur: '#1dc4ff' },
  { id: 'orange', nom: 'Orange Money', couleur: '#ff7900' },
  { id: 'moov', nom: 'Moov Money', couleur: '#0066b3' },
  { id: 'djamo', nom: 'Djamo', couleur: '#111827' }
]

// Transcriptions de démonstration : contenu pédagogique générique, sans chiffre ni avis sur un titre.
const methode = (societe) => [
  { t: 0, txt: `Bonsoir à tous. Ce soir, nous étudions ${societe} avec la méthode en quatre étapes de l'école.` },
  { t: 42, txt: "Première étape, la performance. On regarde l'évolution du chiffre d'affaires et du bénéfice sur dix ans, pas sur un seul exercice." },
  { t: 118, txt: "Une entreprise qui gagne plus chaque année, c'est comme un immeuble dont les loyers augmentent régulièrement : c'est bon signe." },
  { t: 190, txt: 'Deuxième étape, les perspectives. Quelles informations nous projettent dans le futur ? Un nouveau marché, un nouveau plan, un nouveau dirigeant.' },
  { t: 265, txt: "Troisième étape, la rémunération. Comment l'entreprise partage-t-elle son bénéfice ? Quel dividende, à quelle date de détachement ?" },
  { t: 340, txt: "Retenez ceci : le jour du détachement, le cours baisse d'environ le montant du dividende. Ce n'est pas une perte, c'est le dividende qui sort de l'action pour aller vers vous." },
  { t: 420, txt: "Quatrième étape, la valorisation. On calcule si le prix actuel est cher ou bon marché par rapport à ce que l'entreprise rapporte." },
  { t: 498, txt: "N'achetez jamais sans savoir pourquoi. Notez votre raison d'achat : rente ou croissance. C'est elle qui vous guidera quand le cours baissera." },
  { t: 560, txt: "Les supports de cette séance sont dans la bibliothèque. Les questions individuelles se posent aux analystes, sur rendez-vous." }
]

const cmp = [
  { t: 0, txt: 'Aujourd\'hui, une question qui revient tout le temps : le CMP, le coût moyen pondéré.' },
  { t: 35, txt: "Imaginez que vous achetez des sacs de riz à des prix différents. Votre prix moyen, c'est tout ce que vous avez payé divisé par le nombre de sacs." },
  { t: 95, txt: "En bourse, c'est pareil : on additionne le coût de tous vos achats d'une action, frais compris, et on divise par le nombre d'actions détenues." },
  { t: 160, txt: "Quand vous renforcez à un prix plus bas, votre CMP baisse. Quand vous renforcez plus haut, il monte. C'est normal." },
  { t: 230, txt: "Plus-value latente : le gain sur le papier, tant que vous n'avez pas vendu. Plus-value réalisée : le gain encaissé après la vente." },
  { t: 300, txt: "Utilisez le calculateur de l'application plutôt que de refaire le calcul à la main." }
]

const ordres = [
  { t: 0, txt: "Parlons des ordres, parce que beaucoup d'entre vous me disent : mon ordre n'est pas passé." },
  { t: 40, txt: "Un ordre à cours limité, c'est comme dire au vendeur : je ne paie pas plus que tel prix. S'il n'y a personne à ce prix, rien ne se passe." },
  { t: 110, txt: "Un ordre au marché s'exécute au prix disponible. Il est rapide, mais vous ne maîtrisez pas le prix." },
  { t: 175, txt: "Vérifiez toujours la durée de validité de votre ordre auprès de votre SGI : un jour, une semaine, ou jusqu'à annulation." },
  { t: 240, txt: "Et regardez le carnet d'ordres avant d'acheter une valeur peu échangée." }
]

const diaspora = [
  { t: 0, txt: 'Cette séance est pour nos membres de la diaspora.' },
  { t: 30, txt: "Pour alimenter votre compte depuis l'étranger, demandez à votre SGI la liste exacte des moyens acceptés : virement bancaire, transfert d'argent ou mobile money." },
  { t: 100, txt: "Gardez toujours la preuve de votre virement et envoyez-la à votre SGI par écrit. C'est elle qui débloque les situations." },
  { t: 160, txt: "Pour la fiscalité dans votre pays de résidence, rapprochez-vous d'un professionnel local : les règles changent d'un pays à l'autre." }
]

export const CONTENUS = [
  { id: 'c1', type: 'etude', titre: 'Analyse fondamentale — NSIA Banque & Nestlé CI', societes: ['NSIA BANQUE', 'NESTLE CI'], coach: 'Coach EDB', date: '2026-10-26', duree: '1 h 42', transcript: methode('deux entreprises de la cote') },
  { id: 'c2', type: 'etude', titre: 'Analyse fondamentale — BICICI & Onatel BF', societes: ['BICICI', 'ONATEL BF'], coach: 'Coach EDB', date: '2026-10-18', duree: '1 h 35', transcript: methode('deux valeurs bancaire et télécom') },
  { id: 'c3', type: 'etude', titre: 'Analyse technique — 4 valeurs du week-end', societes: ['NSIA BANQUE', 'NESTLE CI', 'BICICI', 'ONATEL BF'], coach: 'Coach EDB', date: '2026-10-27', duree: '58 min', transcript: methode('quatre valeurs sous l\'angle technique') },
  { id: 'c4', type: 'etude', titre: 'Analyse fondamentale — Total CI, Total SN & SMB', societes: ['TOTAL CI', 'TOTAL SN', 'SMB'], coach: 'Coach EDB', date: '2026-11-01', duree: '1 h 50', transcript: methode('trois valeurs du secteur énergie et mines'), nouveau: true },
  { id: 'c5', type: 'audio', titre: 'Comprendre le CMP sans se tromper', societes: [], coach: 'Brice (voix de démo)', date: '2026-09-14', duree: '6 min', transcript: cmp, tags: ['cmp', 'plus-value'] },
  { id: 'c6', type: 'audio', titre: "Pourquoi mon ordre n'est pas passé ?", societes: [], coach: 'Brice (voix de démo)', date: '2026-08-30', duree: '5 min', transcript: ordres, tags: ['ordre', 'carnet'] },
  { id: 'c7', type: 'audio', titre: 'Spécial diaspora : alimenter son compte', societes: [], coach: 'Brice (voix de démo)', date: '2026-07-12', duree: '4 min', transcript: diaspora, tags: ['diaspora', 'virement'] },
  { id: 'c8', type: 'partenaire', titre: 'Note de recherche partenaire — banques UEMOA', societes: ['SGBCI', 'BOA CI', 'NSIA BANQUE'], coach: 'SGI partenaire', date: '2026-09-14', duree: 'PDF · 12 pages', transcript: [{ t: 0, txt: "Document partenaire. L'EDB ne partage pas nécessairement ses conclusions." }] },
  { id: 'c9', type: 'reco', titre: 'Avis EDB daté — valeurs de rente (archive)', societes: ['SONATEL', 'ORANGE CI', 'SGBCI'], coach: 'EDB Assistance', date: '2026-02-18', duree: 'Fiche', transcript: [{ t: 0, txt: "Fiche d'archive : l'avis est daté et peut ne plus être d'actualité. Ce n'est pas un conseil personnalisé." }] }
]

export const TYPES = {
  etude: { nom: 'Études EDB', icone: '🎥' },
  audio: { nom: 'Audios coach', icone: '🎧' },
  partenaire: { nom: 'Partenaires', icone: '📄' },
  reco: { nom: 'Avis datés', icone: '📌' }
}

export const AGENDA = [
  { id: 'a1', jour: 'Dim. 8 nov.', heure: '17h00', titre: 'Étude en direct — 2 valeurs de la cote', lieu: 'Cour familiale', type: 'etude' },
  { id: 'a2', jour: 'Dim. 8 nov.', heure: '18h00', titre: 'Analyse technique du week-end', lieu: 'Cour familiale', type: 'etude' },
  { id: 'a3', jour: 'Lun. 9 nov.', heure: '09h–17h', titre: 'Permanence analyste n°1', lieu: 'Sur rendez-vous', type: 'coaching' },
  { id: 'a4', jour: 'Jeu. 12 nov.', heure: '09h–17h', titre: 'Permanence analyste n°2', lieu: 'Sur rendez-vous', type: 'coaching' }
]

export const CRENEAUX = ['Lun. 9 nov. · 10h00', 'Lun. 9 nov. · 14h30', 'Jeu. 12 nov. · 09h30', 'Jeu. 12 nov. · 16h00']

export const SGI_COMPARATIF = [
  { nom: 'SGI A (exemple)', ouverture: 'En ligne', mobileMoney: 'Oui', delai: '3 à 5 jours', avis: 4.4 },
  { nom: 'SGI B (exemple)', ouverture: 'En agence', mobileMoney: 'Non', delai: '1 à 2 semaines', avis: 3.6 },
  { nom: 'SGI C (exemple)', ouverture: 'En ligne', mobileMoney: 'Oui', delai: '1 semaine', avis: 4.0 }
]

const prenoms = ['Aminata', 'Koffi', 'Mariam', 'Yao', 'Fatou', 'Serge', 'Aïcha', 'Didier', 'Nadia', 'Ibrahim', 'Clarisse', 'Moussa', 'Esther', 'Jean-Marc', 'Rokia', 'Hervé']
const lettres = 'BKTDNMSGLAOZ'
export const MEMBRES_DEMO = prenoms.map((p, i) => ({
  id: 'm' + i,
  nom: `${p} ${lettres[i % lettres.length]}.`,
  niveau: NIVEAUX[i % 4].id,
  statut: i % 5 === 0 ? 'retard' : i % 7 === 0 ? 'expire' : 'actif',
  fin: i % 5 === 0 ? 'Expiré depuis ' + (2 + i % 9) + ' j' : i % 7 === 0 ? 'Retiré le 3 oct.' : 'Jusqu\'au ' + (5 + i) + ' janv.',
  formule: i % 3 === 0 ? 'Année' : 'Trimestre',
  pays: i % 6 === 0 ? 'France' : i % 8 === 0 ? 'Sénégal' : "Côte d'Ivoire",
  relance: false
}))

// Base de réponses de l'assistant (démo) : chaque réponse cite sa source dans la bibliothèque.
export const FAQ = [
  { cles: ['dividende', 'détach', 'detach', 'coupon'], rep: "Le jour du détachement, le cours baisse à peu près du montant du dividende : ce n'est pas une perte, le dividende quitte l'action pour aller vers vous. Le paiement arrive ensuite sur votre compte-titres, à la date annoncée par l'entreprise.", source: 'c1', moment: 340 },
  { cles: ['cmp', 'prix moyen', 'pru', 'plus-value', 'plus value'], rep: "Votre CMP, c'est tout ce que vous avez payé pour une action (frais compris) divisé par le nombre d'actions détenues. Renforcer plus bas fait baisser le CMP, renforcer plus haut le fait monter.", source: 'c5', moment: 95 },
  { cles: ['ordre', 'exécut', 'execut', 'pas passé', 'carnet'], rep: "Un ordre à cours limité ne passe que s'il y a un vendeur à votre prix. Un ordre au marché passe vite, mais au prix disponible. Vérifiez aussi la durée de validité auprès de votre SGI.", source: 'c6', moment: 40 },
  { cles: ['diaspora', 'étranger', 'etranger', 'france', 'canada', 'virement'], rep: "Depuis l'étranger, demandez à votre SGI la liste des moyens acceptés et gardez toujours la preuve de virement : c'est elle qui débloque les situations.", source: 'c7', moment: 100 },
  { cles: ['sgi', 'compte', 'ouvrir', 'ouverture'], rep: "Le parcours « Nouveau membre » vous guide pas à pas : comparatif des SGI tenu par la communauté, liste des pièces à fournir, puis comment alimenter votre compte.", source: null, action: 'parcours' }
]
