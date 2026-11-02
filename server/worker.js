// Bot + API EDB Assistance — Cloudflare Worker
// Rôle : adhésions au groupe sur abonnement actif, paiements, rappels, retraits,
// message de bienvenue, indexation et transcription des contenus, API de la Mini App.

import { T, FORMULES, fcfa } from './messages.js'

// ---------------------------------------------------------------- utilitaires

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })

export const today = (env) => env.FAKE_TODAY || new Date().toISOString().slice(0, 10)

export function addDays (iso, n) {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export function addMonths (iso, n) {
  const d = new Date(iso + 'T00:00:00Z')
  const jour = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + n)
  const dernier = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(jour, dernier))
  return d.toISOString().slice(0, 10)
}
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5)

// Numéros ivoiriens : on garde 225 + 10 chiffres
export function normalizePhone (raw) {
  let p = String(raw || '').replace(/[^\d]/g, '')
  if (p.startsWith('00')) p = p.slice(2)
  if (p.length === 10) p = '225' + p
  return p
}

const grace = env => Number(env.GRACE_DAYS || 5)
const groupId = env => Number(env.GROUP_ID)
const contentTopics = env => String(env.CONTENT_TOPICS || '').split(',').map(Number).filter(Boolean)

export function statutDe (sub, env) {
  if (!sub) return 'aucun'
  const d = daysBetween(today(env), sub.fin) // jours restants
  if (d >= 0) return 'actif'
  if (-d <= grace(env)) return 'retard'
  return 'expire'
}

// ---------------------------------------------------------------- Telegram

export async function tg (env, method, body = {}) {
  const base = env.TG_API || 'https://api.telegram.org'
  try {
    const r = await fetch(`${base}/bot${env.BOT_TOKEN}/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    })
    const j = await r.json()
    if (!j.ok) console.log('Telegram', method, j.description)
    return j
  } catch (e) {
    console.log('Telegram injoignable', method, e.message)
    return { ok: false }
  }
}

const send = (env, chat_id, text, extra = {}) => tg(env, 'sendMessage', { chat_id, text, ...extra })
const kb = rows => ({ reply_markup: { inline_keyboard: rows } })
const btnApp = (env, text = "📱 Ouvrir l'app", hash = '') => ({ text, web_app: { url: env.APP_URL + (hash ? '#' + hash : '') } })
const btnPayer = { text: '💳 Payer / renouveler', callback_data: 'payer' }
const btnStatut = { text: '📋 Mon abonnement', callback_data: 'statut' }

async function isAdmin (env, userId) {
  const r = await tg(env, 'getChatMember', { chat_id: groupId(env), user_id: userId })
  return r.ok && ['creator', 'administrator'].includes(r.result.status)
}

// ---------------------------------------------------------------- base de données

async function upsertMember (env, u, extra = {}) {
  await env.DB.prepare(
    `INSERT INTO members (tg_id, prenom, username, started) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(tg_id) DO UPDATE SET prenom = ?2, username = ?3, started = MAX(started, ?4)`
  ).bind(u.id, u.first_name || '', u.username || null, extra.started ? 1 : 0).run()
}
const getMember = (env, id) => env.DB.prepare('SELECT * FROM members WHERE tg_id = ?').bind(id).first()
const lastSub = (env, id) => env.DB.prepare('SELECT * FROM subscriptions WHERE tg_id = ? ORDER BY fin DESC LIMIT 1').bind(id).first()

// Ajoute une période d'abonnement à la suite de la précédente si elle est encore active
export async function activer (env, tgId, formuleId, source, montant = 0, moyen = null) {
  const f = FORMULES[formuleId]
  const prev = await lastSub(env, tgId)
  const t = today(env)
  const debut = prev && prev.fin >= t ? addDays(prev.fin, 1) : t
  const fin = addDays(addMonths(debut, f.mois), -1)
  await env.DB.prepare('INSERT INTO subscriptions (tg_id, formule, debut, fin, source, montant) VALUES (?,?,?,?,?,?)')
    .bind(tgId, formuleId, debut, fin, source, montant).run()
  let ref = null
  if (source === 'paiement') {
    ref = 'EDB-' + Date.now().toString(36).toUpperCase()
    await env.DB.prepare("INSERT INTO payments (ref, tg_id, formule, montant, moyen, statut) VALUES (?,?,?,?,?, 'paye')")
      .bind(ref, tgId, formuleId, montant, moyen).run()
  }
  return { ref, debut, fin, formuleNom: f.nom, montant }
}

// ---------------------------------------------------------------- actions métier

async function envoyerInvitation (env, tgId) {
  const r = await tg(env, 'createChatInviteLink', {
    chat_id: groupId(env), name: 'membre-' + tgId, creates_join_request: true,
    expire_date: Math.floor(Date.now() / 1000) + 86400
  })
  if (!r.ok) return
  await send(env, tgId, T.invitation, kb([[{ text: '➡️ Rejoindre le groupe', url: r.result.invite_link }]]))
}

async function envoyerStatut (env, tgId) {
  const sub = await lastSub(env, tgId)
  const st = statutDe(sub, env)
  const m = await getMember(env, tgId)
  const rows = [[btnApp(env)]]
  if (st !== 'actif') rows.unshift([btnPayer])
  else if (!m?.in_group) rows.unshift([{ text: '➡️ Rejoindre le groupe', callback_data: 'rejoindre' }])
  await send(env, tgId, T.statut(st, sub, grace(env)), kb(rows))
}

async function proposerFormules (env, chatId) {
  await send(env, chatId, T.choisirFormule, kb(Object.entries(FORMULES).map(([id, f]) => [{ text: `${f.nom} · ${fcfa(f.prix)}`, callback_data: 'pay:' + id }])))
}

// Paiement. En mode test, le paiement est accepté immédiatement.
// En production, on crée une transaction chez l'agrégateur et on active à la réception de son webhook.
export async function payer (env, tgId, formuleId, moyen = 'test') {
  if (!FORMULES[formuleId]) throw new Error('formule inconnue')
  if (env.PAYMENT_MODE !== 'test') throw new Error("Agrégateur de paiement non configuré (PAYMENT_MODE=test pour la démo)")
  const recu = await activer(env, tgId, formuleId, 'paiement', FORMULES[formuleId].prix, moyen)
  await send(env, tgId, T.recu(recu) + T.modeTest)
  const m = await getMember(env, tgId)
  if (!m?.in_group) await envoyerInvitation(env, tgId)
  return recu
}

async function envoyerBienvenue (env, user, chatId) {
  const sub = await lastSub(env, user.id)
  const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM contents WHERE created_at >= datetime('now', '-30 days')").first()
  await send(env, chatId, T.bienvenue({
    prenom: user.first_name || '', formule: sub?.formule === 'annee' ? 'Année' : 'Trimestre', fin: sub?.fin || today(env),
    nbEtudes: n?.n || 0, prochain: env.PROCHAIN_EVENEMENT || 'dimanche à 17 h'
  }), kb([[btnApp(env)], [btnApp(env, "⏪ Ce que j'ai manqué", 'bienvenue')]]))
}

// ---------------------------------------------------------------- mises à jour Telegram

export async function handleUpdate (u, env, ctx) {
  if (u.message) {
    const m = u.message
    if (m.chat.type === 'private') return onPrivate(m, env)
    if (m.chat.id === groupId(env)) return onGroupMessage(m, env, ctx)
  }
  if (u.callback_query) return onCallback(u.callback_query, env)
  if (u.chat_join_request) return onJoinRequest(u.chat_join_request, env)
  if (u.chat_member && u.chat_member.chat.id === groupId(env)) {
    const cm = u.chat_member
    if (cm.new_chat_member.user.is_bot) return
    const dedans = ['member', 'administrator', 'creator', 'restricted'].includes(cm.new_chat_member.status)
    await upsertMember(env, cm.new_chat_member.user)
    await env.DB.prepare('UPDATE members SET in_group = ? WHERE tg_id = ?').bind(dedans ? 1 : 0, cm.new_chat_member.user.id).run()
  }
}

async function onPrivate (m, env) {
  const u = m.from
  await upsertMember(env, u, { started: true })
  const texte = (m.text || m.caption || '').trim()
  const [cmd, ...reste] = texte.split(/\s+/)

  // Partage du numéro : rapprochement avec la liste importée
  if (m.contact) {
    if (m.contact.user_id !== u.id) return send(env, u.id, T.numeroAutre)
    const phone = normalizePhone(m.contact.phone_number)
    await env.DB.prepare('UPDATE members SET phone = ? WHERE tg_id = ?').bind(phone, u.id).run()
    const imp = await env.DB.prepare('SELECT * FROM imports WHERE phone = ?').bind(phone).first()
    if (!imp) return send(env, u.id, T.numeroInconnu, { reply_markup: { remove_keyboard: true } }).then(() => proposerFormules(env, u.id))
    if (!imp.matched_tg) {
      const formule = imp.formule === 'annee' ? 'annee' : 'trimestre'
      await env.DB.prepare("INSERT INTO subscriptions (tg_id, formule, debut, fin, source) VALUES (?,?,?,?, 'import')").bind(u.id, formule, today(env), imp.fin).run()
      await env.DB.prepare('UPDATE imports SET matched_tg = ? WHERE phone = ?').bind(u.id, phone).run()
    }
    await send(env, u.id, T.numeroTrouve(u.first_name || '', imp.fin), { reply_markup: { remove_keyboard: true } })
    return envoyerStatut(env, u.id)
  }

  switch (cmd.split('@')[0]) {
    case '/start': {
      await send(env, u.id, T.accueil(u.first_name || ''), kb([[btnApp(env)], [btnStatut], [btnPayer]]))
      const sub = await lastSub(env, u.id)
      if (!sub) await send(env, u.id, T.demanderNumero, { reply_markup: { keyboard: [[{ text: '📞 Partager mon numéro', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } })
      return
    }
    case '/statut': return envoyerStatut(env, u.id)
    case '/payer': return proposerFormules(env, u.id)
    case '/app': return send(env, u.id, 'Ouvrez l\'application :', kb([[btnApp(env)]]))
    case '/aide': case '/help': {
      const admin = await isAdmin(env, u.id)
      return send(env, u.id, T.aide + (admin ? T.aideAdmin : ''))
    }
    case '/stats': case '/import': case '/relancer': case '/cron': case '/annonce': {
      if (!(await isAdmin(env, u.id))) return send(env, u.id, T.pasAdmin)
      return onAdmin(cmd.split('@')[0], reste.join(' '), texte, m, env)
    }
    default:
      return send(env, u.id, T.aide, kb([[btnApp(env)], [btnStatut]]))
  }
}

async function onCallback (q, env) {
  const id = q.from.id
  await upsertMember(env, q.from, { started: true })
  await tg(env, 'answerCallbackQuery', { callback_query_id: q.id })
  if (q.data === 'statut') return envoyerStatut(env, id)
  if (q.data === 'payer') return proposerFormules(env, id)
  if (q.data === 'rejoindre') {
    if (statutDe(await lastSub(env, id), env) === 'actif') return envoyerInvitation(env, id)
    return proposerFormules(env, id)
  }
  if (q.data.startsWith('pay:')) {
    try { await payer(env, id, q.data.slice(4), 'bouton bot') } catch (e) { await send(env, id, '⚠️ ' + e.message) }
  }
}

async function onJoinRequest (r, env) {
  if (r.chat.id !== groupId(env)) return
  const u = r.from
  await upsertMember(env, u)
  const st = statutDe(await lastSub(env, u.id), env)
  const chat = r.user_chat_id || u.id
  if (st === 'actif') {
    const ok = await tg(env, 'approveChatJoinRequest', { chat_id: groupId(env), user_id: u.id })
    if (ok.ok) {
      await env.DB.prepare('UPDATE members SET in_group = 1 WHERE tg_id = ?').bind(u.id).run()
      await envoyerBienvenue(env, u, chat)
    }
  } else {
    await tg(env, 'declineChatJoinRequest', { chat_id: groupId(env), user_id: u.id })
    await send(env, chat, T.refusAdhesion(u.first_name || ''), kb([[btnPayer], [{ text: '📞 Je suis déjà abonné', url: `https://t.me/${env.BOT_USERNAME}?start=abonne` }]]))
  }
}

// Contenus postés par les admins dans les salons fermés (Études, Suggestions, Partenaires, Témoignages)
async function onGroupMessage (m, env, ctx) {
  if (!m.is_topic_message || !contentTopics(env).includes(m.message_thread_id)) return
  const media = m.voice || m.audio || m.video || m.document
  const type = m.voice || m.audio ? 'audio' : m.video ? 'video' : m.document ? 'document' : 'texte'
  const texte = m.caption || m.text || ''
  const titre = (texte.split('\n')[0] || (m.audio && m.audio.title) || (m.document && m.document.file_name) || 'Audio du ' + today(env)).slice(0, 140)
  const res = await env.DB.prepare(
    'INSERT OR IGNORE INTO contents (topic_id, message_id, type, titre, file_id, duree, transcript) VALUES (?,?,?,?,?,?,?)'
  ).bind(m.message_thread_id, m.message_id, type, titre, media ? media.file_id : null, media && media.duration ? media.duration : null, type === 'texte' ? texte : null).run()
  if (type === 'audio' && env.AI && media.file_size && media.file_size <= 20e6) {
    const p = transcrire(env, res.meta.last_row_id, media.file_id)
    if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p
  }
}

export async function transcrire (env, contentId, fileId) {
  const f = await tg(env, 'getFile', { file_id: fileId })
  if (!f.ok) return
  const base = env.TG_API || 'https://api.telegram.org'
  const buf = await (await fetch(`${base}/file/bot${env.BOT_TOKEN}/${f.result.file_path}`)).arrayBuffer()
  let texte = ''
  try {
    let bin = ''
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    const r = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: btoa(bin), language: 'fr' })
    texte = r.text || ''
  } catch (e) {
    console.log('Transcription échouée', e.message)
    return
  }
  await env.DB.prepare('UPDATE contents SET transcript = ? WHERE id = ?').bind(texte, contentId).run()
}

// ---------------------------------------------------------------- administration

async function onAdmin (cmd, args, texte, m, env) {
  const me = m.from.id
  if (cmd === '/stats') {
    const rows = await abonnesCourants(env)
    const c = { actif: 0, retard: 0, expire: 0 }
    rows.forEach(r => { c[statutDe(r, env)]++ })
    const mois = today(env).slice(0, 7)
    const enc = await env.DB.prepare("SELECT COALESCE(SUM(montant),0) AS s, COUNT(*) AS n FROM payments WHERE statut='paye' AND substr(created_at,1,7) = ?").bind(mois).first()
    const nc = await env.DB.prepare('SELECT COUNT(*) AS n, SUM(transcript IS NOT NULL) AS t FROM contents').first()
    const ni = await env.DB.prepare('SELECT COUNT(*) AS n, SUM(matched_tg IS NOT NULL) AS m FROM imports').first()
    return send(env, me, `📊 EDB Assistance — ${today(env)}\n\n✅ À jour : ${c.actif}\n⏳ En retard (grâce) : ${c.retard}\n❌ Expirés : ${c.expire}\n\n💸 Encaissé ce mois : ${fcfa(enc.s)} (${enc.n} paiements)\n📥 Liste importée : ${ni.n || 0} payeurs, dont ${ni.m || 0} reliés à Telegram\n📚 Contenus indexés : ${nc.n || 0} (${nc.t || 0} transcrits)`)
  }

  if (cmd === '/import') {
    let contenu = texte.replace(/^\/import(@\w+)?/, '')
    if (m.document) {
      const f = await tg(env, 'getFile', { file_id: m.document.file_id })
      if (f.ok) contenu = await (await fetch(`${env.TG_API || 'https://api.telegram.org'}/file/bot${env.BOT_TOKEN}/${f.result.file_path}`)).text()
    }
    const lignes = contenu.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    let ok = 0; const erreurs = []
    for (const l of lignes) {
      const [tel, nom, formule, fin] = l.split(/[;,\t]/).map(s => (s || '').trim())
      const phone = normalizePhone(tel)
      if (!/^\d{11,15}$/.test(phone) || !/^\d{4}-\d{2}-\d{2}$/.test(fin || '')) { if (!/t[ée]l[ée]phone/i.test(l)) erreurs.push(l); continue }
      await env.DB.prepare(
        'INSERT INTO imports (phone, nom, formule, fin) VALUES (?,?,?,?) ON CONFLICT(phone) DO UPDATE SET nom = excluded.nom, formule = excluded.formule, fin = excluded.fin'
      ).bind(phone, nom, /ann/i.test(formule) ? 'annee' : 'trimestre', fin).run()
      ok++
    }
    return send(env, me, `📥 Import terminé : ${ok} payeur(s) enregistré(s).` + (erreurs.length ? `\n⚠️ ${erreurs.length} ligne(s) ignorée(s), par exemple :\n${erreurs.slice(0, 3).join('\n')}\n\nFormat attendu : téléphone;nom;formule;AAAA-MM-JJ` : '') + '\n\nChaque membre reçoit son abonnement dès qu\'il partage son numéro avec le bot.')
  }

  if (cmd === '/relancer') {
    const rows = await abonnesCourants(env)
    let n = 0
    for (const r of rows) {
      if (statutDe(r, env) !== 'retard' || !r.started) continue
      await send(env, r.tg_id, T.relanceManuelle(r.prenom || ''), kb([[btnPayer]]))
      n++
    }
    return send(env, me, `📨 ${n} relance(s) envoyée(s).`)
  }

  if (cmd === '/cron') {
    if (args && /^\d{4}-\d{2}-\d{2}$/.test(args)) env = { ...env, FAKE_TODAY: args }
    const r = await runCron(env)
    return send(env, me, `⏱ Traitement du ${today(env)} :\nRappels J-7 : ${r['j-7']}\nRappels J-1 : ${r['j-1']}\nAvis d'expiration : ${r.expire}\nRetraits du groupe : ${r.retrait}`)
  }

  if (cmd === '/annonce') {
    if (!args) return send(env, me, 'Écrivez le texte après /annonce.')
    await send(env, groupId(env), '📣 ' + args)
    const rows = await abonnesCourants(env)
    let n = 0
    for (const r of rows) { if (r.started && statutDe(r, env) === 'actif' && r.tg_id !== me) { await send(env, r.tg_id, '📣 ' + args); n++ } }
    return send(env, me, `📣 Annonce publiée dans La Cour familiale et envoyée en privé à ${n} abonné(s).`)
  }
}

// Dernière période d'abonnement de chaque membre
const abonnesCourants = env => env.DB.prepare(
  `SELECT m.tg_id, m.prenom, m.started, m.in_group, s.fin, s.formule
   FROM members m JOIN subscriptions s ON s.tg_id = m.tg_id
   WHERE s.fin = (SELECT MAX(fin) FROM subscriptions WHERE tg_id = m.tg_id)
   GROUP BY m.tg_id`
).all().then(r => r.results)

// ---------------------------------------------------------------- tâche quotidienne

async function dejaEnvoye (env, id, kind, fin) {
  const r = await env.DB.prepare('INSERT OR IGNORE INTO reminders (tg_id, kind, ref_fin) VALUES (?,?,?)').bind(id, kind, fin).run()
  return r.meta.changes === 0
}

export async function runCron (env) {
  const g = grace(env)
  const c = { 'j-7': 0, 'j-1': 0, expire: 0, retrait: 0 }
  for (const r of await abonnesCourants(env)) {
    const d = daysBetween(today(env), r.fin)
    const p = r.prenom || ''
    let kind = null
    if (d >= 2 && d <= 7) kind = 'j-7'
    else if (d >= 0 && d <= 1) kind = 'j-1'
    else if (d < 0 && -d <= g) kind = 'expire'
    else if (-d > g) kind = 'retrait'
    if (!kind || await dejaEnvoye(env, r.tg_id, kind, r.fin)) continue

    if (kind === 'retrait') {
      if (r.in_group) {
        // Retirer = bannir puis débannir aussitôt : le membre sort, mais pourra revenir après paiement
        await tg(env, 'banChatMember', { chat_id: groupId(env), user_id: r.tg_id })
        await tg(env, 'unbanChatMember', { chat_id: groupId(env), user_id: r.tg_id, only_if_banned: true })
        await env.DB.prepare('UPDATE members SET in_group = 0 WHERE tg_id = ?').bind(r.tg_id).run()
        c.retrait++
        if (r.started) await send(env, r.tg_id, T.retrait(p), kb([[btnPayer]]))
      }
      continue
    }
    if (!r.started) continue
    const txt = kind === 'j-7' ? T.rappelJ7(p, r.fin) : kind === 'j-1' ? T.rappelJ1(p, r.fin) : T.expire(p, g)
    await send(env, r.tg_id, txt, kb([[btnPayer]]))
    c[kind]++
  }
  return c
}

// ---------------------------------------------------------------- API de la Mini App

// Vérifie la signature Telegram de initData (sinon n'importe qui pourrait se faire passer pour un membre)
export async function verifierInitData (initData, botToken, maxAge = 86400) {
  if (!initData) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n')
  const enc = new TextEncoder()
  const k1 = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const secret = await crypto.subtle.sign('HMAC', k1, enc.encode(botToken))
  const k2 = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k2, enc.encode(check)))
  const hex = [...sig].map(b => b.toString(16).padStart(2, '0')).join('')
  if (hex !== hash) return null
  if (Date.now() / 1000 - Number(params.get('auth_date') || 0) > maxAge) return null
  try { return JSON.parse(params.get('user')) } catch { return null }
}

async function api (req, env, path) {
  const user = await verifierInitData(req.headers.get('x-telegram-init-data'), env.BOT_TOKEN)
  if (!user) return json({ erreur: 'non authentifié' }, 401)
  await upsertMember(env, user)

  if (path === '/api/me') {
    const sub = await lastSub(env, user.id)
    const m = await getMember(env, user.id)
    return json({ prenom: user.first_name, statut: statutDe(sub, env), fin: sub?.fin || null, formule: sub?.formule || null, dansLeGroupe: !!m?.in_group, grace: grace(env), modeTest: env.PAYMENT_MODE === 'test' })
  }
  if (path === '/api/pay' && req.method === 'POST') {
    const b = await req.json().catch(() => ({}))
    try { return json(await payer(env, user.id, b.formule, b.moyen || 'app')) } catch (e) { return json({ erreur: e.message }, 400) }
  }
  if (path === '/api/contenus') {
    const q = new URL(req.url).searchParams.get('q') || ''
    const sub = await lastSub(env, user.id)
    if (statutDe(sub, env) === 'expire' || statutDe(sub, env) === 'aucun') return json({ erreur: 'abonnement requis' }, 403)
    const r = await env.DB.prepare(
      `SELECT id, topic_id, type, titre, duree, created_at, substr(transcript, 1, 400) AS extrait FROM contents
       WHERE ?1 = '' OR titre LIKE ?2 OR transcript LIKE ?2 ORDER BY created_at DESC LIMIT 50`
    ).bind(q, `%${q}%`).all()
    return json(r.results)
  }
  return json({ erreur: 'introuvable' }, 404)
}

// ---------------------------------------------------------------- installation

async function setup (url, env) {
  const origin = url.origin
  const r = {}
  r.webhook = await tg(env, 'setWebhook', {
    url: origin + '/telegram/webhook', secret_token: env.WEBHOOK_SECRET, drop_pending_updates: true,
    allowed_updates: ['message', 'callback_query', 'chat_join_request', 'chat_member']
  })
  r.menu = await tg(env, 'setChatMenuButton', { menu_button: { type: 'web_app', text: "Ouvrir l'app", web_app: { url: env.APP_URL } } })
  r.commandes = await tg(env, 'setMyCommands', { commands: [
    { command: 'statut', description: 'Mon abonnement' }, { command: 'payer', description: "M'abonner ou renouveler" },
    { command: 'app', description: "Ouvrir l'application" }, { command: 'aide', description: 'Aide' }] })
  // Les membres ne peuvent plus ajouter quelqu'un eux-mêmes : seule l'adhésion validée par le bot fait entrer.
  r.permissions = await tg(env, 'setChatPermissions', { chat_id: groupId(env), use_independent_chat_permissions: true, permissions: {
    can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true,
    can_send_video_notes: true, can_send_voice_notes: true, can_send_polls: true, can_send_other_messages: true,
    can_add_web_page_previews: true, can_change_info: false, can_invite_users: false, can_pin_messages: false, can_manage_topics: false } })
  return json(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.ok ? 'ok' : v.description || 'échec'])))
}

// ---------------------------------------------------------------- point d'entrée

export default {
  async fetch (req, env, ctx) {
    const url = new URL(req.url)
    if (url.pathname === '/telegram/webhook' && req.method === 'POST') {
      if (req.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) return new Response('interdit', { status: 403 })
      const update = await req.json()
      try { await handleUpdate(update, env, ctx) } catch (e) { console.log('Erreur', e.stack) }
      return new Response('ok')
    }
    if (url.pathname === '/setup') {
      if (!env.SETUP_KEY || url.searchParams.get('key') !== env.SETUP_KEY) return new Response('interdit', { status: 403 })
      return setup(url, env)
    }
    if (url.pathname.startsWith('/api/')) return api(req, env, url.pathname)
    if (env.ASSETS) return env.ASSETS.fetch(req)
    return new Response('EDB Assistance')
  },
  async scheduled (event, env, ctx) {
    ctx.waitUntil(runCron(env))
  }
}
