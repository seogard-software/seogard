// Constantes de cookies — module VOLONTAIREMENT léger (aucun import de rules.json).
// Isolé de constants.ts car auth.global.ts (middleware GLOBAL, chargé sur chaque page) lit
// LOGGED_IN_COOKIE_NAME : le laisser dans constants.ts embarquait tout le wording des règles
// (rules.json, ~130 KB) dans le bundle de TOUTES les pages, landing comprise.
export const LOGGED_IN_COOKIE_NAME = 'seogard_logged_in'
