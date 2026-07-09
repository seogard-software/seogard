// Options vue-i18n : toute clé absente d'une locale retombe sur le FR (jamais de clé brute
// à l'écran) — le test de parité fr/en (étape 12) garantit qu'à la publication EN il ne
// reste aucun trou réel.
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'fr',
  missingWarn: false,
  fallbackWarn: false,
}))
