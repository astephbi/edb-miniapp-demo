// Petite couche autour de l'SDK Telegram WebApp.
// Dans Telegram : on utilise les vrais boutons, le retour haptique et le thème.
// Dans un navigateur (démo) : tout est remplacé par des équivalents silencieux.

export const tg = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData
  ? window.Telegram.WebApp
  : null

export const insideTelegram = !!tg

export function initTelegram () {
  if (!tg) return
  tg.ready()
  tg.expand()
  try { tg.setHeaderColor('secondary_bg_color') } catch (e) { /* anciennes versions */ }
}

// Identité du membre. En production, l'API vérifie la signature de tg.initData
// avec le token du bot avant de faire confiance à ces informations.
export function telegramUser () {
  return tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null
}

export function haptic (type = 'light') {
  try {
    if (!tg) return
    if (type === 'success' || type === 'error' || type === 'warning') tg.HapticFeedback.notificationOccurred(type)
    else tg.HapticFeedback.impactOccurred(type)
  } catch (e) { /* ignoré */ }
}

export function setBackButton (visible, onClick) {
  if (!tg) return
  tg.BackButton.offClick(tg.__edbBack || (() => {}))
  if (visible) {
    tg.__edbBack = onClick
    tg.BackButton.onClick(onClick)
    tg.BackButton.show()
  } else {
    tg.BackButton.hide()
  }
}
