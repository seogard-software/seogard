/**
 * Traduction des erreurs API par code.
 *
 * Le serveur lève `createError({ statusCode, message: '<EN technique>', data: { errorCode: 'SNAKE_CASE' } })`.
 * Côté client ($fetch/ofetch et useFetch), le body JSON H3 est exposé sur `err.data` :
 * `{ url, statusCode, statusMessage, message, data: { errorCode, ...params } }`
 * → le code est donc sur `err.data.data.errorCode` (preuve dans login.vue qui lit
 * `err.data.data.samlUrl`). Les éventuels params (provider, orgName, pattern, minutes…)
 * voyagent dans le même objet `data` et servent à l'interpolation i18n.
 *
 * Ordre de résolution :
 * 1. `errors.<CODE>` si le code existe dans la locale (message utilisateur traduit)
 * 2. le message brut de l'erreur (endpoints pas encore migrés, messages déjà localisés
 *    comme validateSchedule)
 * 3. le fallback contextuel fourni par l'appelant
 * 4. `errors.GENERIC`
 */
export function useApiError() {
  const { t, te } = useI18n()

  return (err: unknown, fallback?: string): string => {
    const e = err as { data?: { message?: string, errorCode?: string, data?: Record<string, unknown> }, message?: string } | null
    const payload = e?.data?.data ?? e?.data
    const code = (payload as { errorCode?: string } | undefined)?.errorCode
    if (code && te(`errors.${code}`)) {
      return t(`errors.${code}`, (payload ?? {}) as Record<string, unknown>)
    }
    const msg = e?.data?.message ?? e?.message
    return msg || fallback || t('errors.GENERIC')
  }
}

/** Extrait le errorCode d'une erreur API ($fetch/useFetch), ou null. */
export function getApiErrorCode(err: unknown): string | null {
  const e = err as { data?: { errorCode?: string, data?: { errorCode?: string } } } | null
  return e?.data?.data?.errorCode ?? e?.data?.errorCode ?? null
}
