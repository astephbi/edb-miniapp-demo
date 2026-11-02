// Textes envoyés par le bot. Modifiables sans toucher à la logique.

export const FORMULES = {
  trimestre: { nom: 'Trimestre', prix: 20000, mois: 3 },
  annee: { nom: 'Année', prix: 70000, mois: 12 }
}

export const fcfa = n => new Intl.NumberFormat('fr-FR').format(n).replace(/ | /g, ' ') + ' F'

export const dateFr = iso => {
  const [y, m, d] = iso.split('-').map(Number)
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  return `${d} ${mois[m - 1]} ${y}`
}

export const T = {
  accueil: p => `Bonjour ${p} 👋\n\nJe suis l'assistant d'EDB Assistance. Avec moi, vous pouvez :\n• voir et renouveler votre abonnement ;\n• rejoindre le groupe ;\n• ouvrir l'application (bibliothèque, assistant, rendez-vous avec un analyste).`,

  demanderNumero: 'Déjà abonné ? Partagez votre numéro de téléphone avec le bouton ci-dessous : je retrouve votre abonnement automatiquement.',

  numeroAutre: "Merci de partager votre propre numéro, avec le bouton « Partager mon numéro ».",

  numeroTrouve: (p, fin) => `✅ Merci ${p}, votre abonnement est retrouvé. Il est actif jusqu'au ${dateFr(fin)}.`,

  numeroInconnu: "Je ne retrouve pas ce numéro dans la liste des abonnés. Si vous avez déjà payé, contactez l'administration avec votre reçu. Sinon, vous pouvez vous abonner ici :",

  statut: (st, sub, grace) => {
    if (st === 'aucun') return "Vous n'avez pas encore d'abonnement."
    if (st === 'actif') return `✅ Abonnement actif (${sub.formule === 'annee' ? 'Année' : 'Trimestre'}) jusqu'au ${dateFr(sub.fin)}.`
    if (st === 'retard') return `⏳ Votre abonnement a expiré le ${dateFr(sub.fin)}. Il vous reste un délai de grâce de ${grace} jours avant le retrait du groupe.`
    return `❌ Votre abonnement a expiré le ${dateFr(sub.fin)}. Renouvelez-le pour retrouver l'accès au groupe.`
  },

  choisirFormule: 'Choisissez votre formule :',

  recu: (r) => `🧾 Paiement reçu, merci !\n\nReçu n° ${r.ref}\nFormule : ${r.formuleNom}\nMontant : ${fcfa(r.montant)}\nValable jusqu'au : ${dateFr(r.fin)}`,

  modeTest: '\n\n(Mode test : aucun argent n\'a été débité.)',

  invitation: "Voici votre lien pour rejoindre le groupe. Il est personnel et valable 24 h : votre demande sera acceptée automatiquement.",

  refusAdhesion: p => `Bonjour ${p}. Votre demande pour rejoindre EDB Assistance n'a pas pu être acceptée : je ne trouve pas d'abonnement actif à votre nom.\n\nDéjà abonné ? Ouvrez ce chat et partagez votre numéro. Sinon, abonnez-vous ici :`,

  bienvenue: v => `Bonjour ${v.prenom} 👋 Bienvenue dans EDB Assistance.\n\nVotre abonnement ${v.formule} est actif jusqu'au ${dateFr(v.fin)}.\n\nPour bien démarrer, ouvrez l'application. Elle vous montre en 5 minutes :\n• ce que vous avez manqué ce mois-ci (${v.nbEtudes} contenus publiés) ;\n• le salon qui correspond à votre objectif ;\n• la prochaine étude en direct : ${v.prochain}.\n\nUne question personnelle ? Ne la postez pas dans les salons : réservez un créneau avec un analyste depuis l'application.`,

  rappelJ7: (p, fin) => `Bonjour ${p}, votre abonnement EDB Assistance se termine le ${dateFr(fin)}, dans 7 jours. Vous pouvez le renouveler dès maintenant, sans perdre un seul jour :`,

  rappelJ1: (p, fin) => `${p}, votre abonnement se termine demain (${dateFr(fin)}). Renouvelez-le en une minute pour garder votre accès :`,

  expire: (p, grace) => `${p}, votre abonnement a expiré. Vous gardez l'accès au groupe pendant encore ${grace} jours. Après ce délai, le retrait est automatique. Pour renouveler :`,

  retrait: p => `${p}, votre délai de grâce est terminé : vous avez été retiré du groupe EDB Assistance. Dès que vous renouvelez, vous recevez un lien pour revenir immédiatement.`,

  relanceManuelle: p => `${p}, petit rappel : votre abonnement EDB Assistance est arrivé à échéance. Renouvelez-le ici :`,

  pasAdmin: "Cette commande est réservée aux administrateurs du groupe.",

  aide: "Commandes :\n/statut — mon abonnement\n/payer — m'abonner ou renouveler\n/app — ouvrir l'application",

  aideAdmin: "\n\nAdministrateurs :\n/stats — tableau de bord\n/import — importer la liste des payeurs (une ligne par membre : téléphone;nom;formule;date de fin AAAA-MM-JJ), ou envoyer un fichier .csv avec la légende /import\n/relancer — relancer maintenant tous les membres en retard\n/annonce <texte> — publier dans La Cour familiale et envoyer en privé aux abonnés actifs\n/cron [AAAA-MM-JJ] — lancer les rappels et retraits maintenant (date facultative pour une démonstration)"
}
