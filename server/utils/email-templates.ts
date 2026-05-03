const APP_URL = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'

// Design tokens — alignés sur variables.scss
const C = {
  // Brand
  accent: '#111827',      // $color-accent — charcoal (CTA, header, liens)
  accentLight: '#374151', // $color-accent-light

  // Grays
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',

  // Semantic
  success: '#16a34a',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  warning: '#ea580c',
  warningBg: '#fff7ed',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  info: '#4338ca',
  infoBg: '#eef2ff',

  // Surfaces
  page: '#f4f4f4',    // $surface-page
  card: '#ffffff',
  elevated: '#f9fafb',

  white: '#ffffff',
  black: '#000000',
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.page};">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${C.card};border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

        <!-- Header — blanc, wordmark noir, bordure basse -->
        <tr><td style="background-color:${C.card};padding:24px 32px;border-bottom:1px solid ${C.gray200};">
          <span style="color:${C.gray900};font-size:20px;font-weight:600;letter-spacing:-0.03em;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;line-height:1;">Seogard<span style="color:${C.gray900};">.io</span></span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;color:${C.gray900};font-size:15px;line-height:1.65;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background-color:${C.gray50};border-top:1px solid ${C.gray200};text-align:center;font-size:12px;color:${C.gray500};font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">
          <a href="${APP_URL}" style="color:${C.gray700};text-decoration:none;font-weight:500;">seogard.io</a>
          &nbsp;·&nbsp;
          <a href="mailto:support@seogard.io" style="color:${C.gray700};text-decoration:none;font-weight:500;">Support</a>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background-color:${C.accent};border-radius:8px;">
      <a href="${href}" style="color:${C.white};text-decoration:none;font-weight:600;font-size:14px;display:inline-block;padding:13px 28px;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;">${label}</a>
    </td></tr>
  </table>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${C.gray200};margin:24px 0;">`
}

function infoBox(content: string, color = C.gray700, bg = C.gray100, border = C.gray200): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid ${border};border-radius:8px;background-color:${bg};">
    <tr><td style="padding:16px 20px;font-size:14px;color:${color};line-height:1.6;">${content}</td></tr>
  </table>`
}

// --- Templates ---

export function welcomeTemplate(): { subject: string; html: string } {
  return {
    subject: 'Votre essai Seogard est actif — commencez votre premier crawl',
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:${C.gray900};line-height:1.3;">Bienvenue sur Seogard</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">Votre essai gratuit de <strong>14 jours</strong> est actif — sans carte bancaire.</p>

      <p style="margin:0 0 8px;color:${C.gray900};">Pour commencer :</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${C.gray100};">
          <span style="font-size:13px;color:${C.gray500};font-weight:600;">ÉTAPE 1</span><br>
          <span style="font-size:14px;color:${C.gray900};font-weight:500;">Ajoutez votre site</span><br>
          <span style="font-size:13px;color:${C.gray700};">L'URL suffit — Seogard découvre vos pages via le sitemap.</span>
        </td></tr>
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${C.gray100};">
          <span style="font-size:13px;color:${C.gray500};font-weight:600;">ÉTAPE 2</span><br>
          <span style="font-size:14px;color:${C.gray900};font-weight:500;">Lancez un crawl</span><br>
          <span style="font-size:13px;color:${C.gray700};">Metas, canonicals, H1, SSR/CSR, noindex — analysés sur chaque page.</span>
        </td></tr>
        <tr><td style="padding:12px 16px;">
          <span style="font-size:13px;color:${C.gray500};font-weight:600;">ÉTAPE 3</span><br>
          <span style="font-size:14px;color:${C.gray900};font-weight:500;">Activez les alertes</span><br>
          <span style="font-size:13px;color:${C.gray700};">Recevez un email ou Slack dès qu'une régression est détectée.</span>
        </td></tr>
      </table>

      ${button(`${APP_URL}/dashboard/sites`, 'Ajouter mon premier site →')}

      <p style="margin:0;color:${C.gray500};font-size:13px;">Une question ? Répondez directement à cet email.</p>
    `),
  }
}

export interface AlertCriticalData {
  siteName: string
  siteId: string
  zoneName?: string | null
  zoneId?: string | null
  criticalCount: number
  warningCount: number
  alerts: { pageUrl: string; type: string; severity: string; message: string }[]
}

export function alertCriticalTemplate(data: AlertCriticalData): { subject: string; html: string } {
  const label = data.zoneName ? `${data.siteName} › ${data.zoneName}` : data.siteName
  const alertsUrl = data.zoneId
    ? `${APP_URL}/dashboard/sites/${data.siteId}/zones/${data.zoneId}/alerts`
    : `${APP_URL}/dashboard/sites/${data.siteId}`

  const criticalBadge = data.criticalCount > 0
    ? `<span style="display:inline-block;padding:3px 10px;background-color:${C.dangerBg};color:${C.danger};border-radius:4px;font-size:12px;font-weight:600;margin-right:6px;">${data.criticalCount} critical</span>`
    : ''
  const warningBadge = data.warningCount > 0
    ? `<span style="display:inline-block;padding:3px 10px;background-color:${C.warningBg};color:${C.warning};border-radius:4px;font-size:12px;font-weight:600;">${data.warningCount} warning</span>`
    : ''

  const alertRows = data.alerts.slice(0, 5).map(a => {
    const isC = a.severity === 'critical'
    const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background-color:${isC ? C.danger : C.warning};margin-right:8px;flex-shrink:0;margin-top:4px;"></span>`
    return `<tr><td style="padding:10px 14px;border-bottom:1px solid ${C.gray100};font-size:13px;">
      <div style="display:flex;align-items:flex-start;">${dot}<div>
        <span style="color:${C.gray900};font-weight:500;">${a.message}</span><br>
        <span style="color:${C.gray500};font-size:12px;">${a.pageUrl}</span>
      </div></div>
    </td></tr>`
  }).join('')

  const more = data.alerts.length > 5
    ? `<tr><td style="padding:10px 14px;font-size:13px;color:${C.gray500};text-align:center;">+${data.alerts.length - 5} autres alertes dans le dashboard</td></tr>`
    : ''

  return {
    subject: `[ALERTE] ${data.criticalCount} critical · ${data.warningCount} warning — ${label}`,
    html: layout(`
      <h2 style="margin:0 0 8px;font-size:19px;font-weight:700;color:${C.gray900};">${label}</h2>
      <p style="margin:0 0 20px;">${criticalBadge}${warningBadge}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;margin:0 0 24px;">
        ${alertRows}${more}
      </table>

      ${button(alertsUrl, 'Voir et résoudre les alertes →')}
    `),
  }
}

export interface DailyDigestData {
  siteName: string
  siteId: string
  totalPages: number
  regressionCount: number
  regressions: { type: string; message: string; pageUrl: string }[]
}

export function dailyDigestTemplate(data: DailyDigestData): { subject: string; html: string } {
  const isAllGood = data.regressionCount === 0

  const body = isAllGood
    ? `${infoBox(`<strong style="color:${C.success};">✓ Aucune régression détectée</strong><br><span style="color:${C.gray700};">${data.totalPages.toLocaleString('fr-FR')} pages analysées sur <strong>${data.siteName}</strong> — tout est en ordre.</span>`, C.success, C.successBg, C.successBorder)}
       <p style="margin:0;font-size:14px;color:${C.gray700};">Le rapport de demain arrivera au même moment. Vous pouvez consulter l'historique complet depuis votre dashboard.</p>`
    : `<p style="margin:0 0 16px;font-size:15px;"><strong>${data.regressionCount} régression(s)</strong> détectée(s) sur <strong>${data.siteName}</strong> depuis le dernier crawl :</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;margin:0 0 24px;">
         ${data.regressions.slice(0, 10).map(r =>
           `<tr><td style="padding:10px 14px;border-bottom:1px solid ${C.gray100};font-size:13px;">
             <span style="color:${C.gray900};font-weight:500;">${r.message}</span><br>
             <span style="color:${C.gray500};font-size:12px;">${r.pageUrl}</span>
           </td></tr>`,
         ).join('')}
       </table>`

  return {
    subject: isAllGood
      ? `✓ Aucune régression — ${data.siteName}`
      : `[DIGEST] ${data.regressionCount} régression(s) — ${data.siteName}`,
    html: layout(`
      <h2 style="margin:0 0 20px;font-size:19px;font-weight:700;color:${C.gray900};">Rapport quotidien</h2>
      ${body}
      ${button(`${APP_URL}/dashboard/sites/${data.siteId}`, 'Voir le dashboard')}
    `),
  }
}

export interface LogDigestData {
  groups: { level: string; module: string; errorCode: string; message: string; count: number; samples: string[] }[]
  totalWarn: number
  totalError: number
  totalFatal: number
}

export function logDigestTemplate(data: LogDigestData): { subject: string; html: string } {
  const total = data.totalWarn + data.totalError + data.totalFatal
  const levelColor: Record<string, string> = { fatal: '#7f1d1d', error: C.danger, warn: C.warning }
  const levelBg: Record<string, string> = { fatal: '#fecaca', error: '#fee2e2', warn: '#fef3c7' }

  const rows = data.groups.map(g => {
    const bg = levelBg[g.level] || C.gray100
    const color = levelColor[g.level] || C.gray700
    const samples = g.samples.length > 0
      ? `<br><span style="color:${C.gray500};font-size:11px;">${g.samples.slice(0, 2).join(' · ')}</span>`
      : ''
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid ${C.gray200};font-size:13px;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:${color};background-color:${bg};margin-right:6px;">${g.level.toUpperCase()}</span>
        <strong>${g.module}</strong>${g.errorCode ? ` · <code style="font-size:11px;background:${C.gray100};padding:1px 5px;border-radius:3px;">${g.errorCode}</code>` : ''}
        <span style="color:${C.gray500};float:right;font-size:12px;">×${g.count}</span>
        <br><span style="color:${C.gray700};font-size:12px;">${g.message}</span>
        ${samples}
      </td>
    </tr>`
  }).join('')

  const summary = [
    data.totalFatal > 0 ? `<span style="color:${levelColor.fatal};font-weight:700;">${data.totalFatal} fatal</span>` : '',
    data.totalError > 0 ? `<span style="color:${levelColor.error};font-weight:700;">${data.totalError} error</span>` : '',
    data.totalWarn > 0 ? `<span style="color:${levelColor.warn};font-weight:700;">${data.totalWarn} warn</span>` : '',
  ].filter(Boolean).join(' &middot; ')

  return {
    subject: `[LOGS WORKERS] ${total} alerte(s) — ${new Date().toLocaleDateString('fr-FR')}`,
    html: layout(`
      <h2 style="margin:0 0 6px;font-size:19px;font-weight:700;color:${C.gray900};">Logs workers — 24h</h2>
      <p style="margin:0 0 20px;font-size:14px;color:${C.gray500};">${summary} — <strong style="color:${C.gray900};">${total} total</strong> en ${data.groups.length} groupe(s)</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;">
        ${rows}
      </table>
      <p style="margin:16px 0 0;color:${C.gray500};font-size:12px;">Ce digest est envoyé automatiquement chaque jour à 8h.</p>
    `),
  }
}

export interface CrawlerBlockedData {
  siteName: string
  pagesBlocked: number
  pagesTotal: number
}

export interface SitemapBlockedData {
  siteName: string
  siteUrl: string
}

export interface SitemapInvalidHostnameData {
  siteName: string
  siteUrl: string
  foreignHostnames: string[]
  foreignUrlCount: number
}

export function sitemapInvalidHostnameTemplate(data: SitemapInvalidHostnameData): { subject: string; html: string } {
  const sample = data.foreignHostnames.slice(0, 3).map(h => `<code style="background:${C.gray100};padding:2px 6px;border-radius:3px;">${h}</code>`).join(', ')
  return {
    subject: `[ACTION REQUISE] Sitemap mal configuré — ${data.siteName}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">Sitemap pointe vers le mauvais hostname</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">Le sitemap de <strong>${data.siteName}</strong> liste <strong>${data.foreignUrlCount} URLs</strong> avec un hostname différent de celui monitoré (<code style="background:${C.gray100};padding:2px 6px;border-radius:4px;font-size:13px;">${data.siteUrl}</code>).</p>

      <p style="margin:0 0 20px;color:${C.gray700};">Hostnames étrangers détectés : ${sample}.</p>

      ${infoBox(`<strong>Conséquence :</strong> ces URLs sont ignorées par le crawl et seule la homepage est analysée — vos régressions SEO sur les autres pages peuvent passer inaperçues.`, C.warning, C.warningBg)}

      <p style="margin:0;color:${C.gray500};font-size:13px;">Une fois votre sitemap corrigé, le prochain crawl détectera vos pages automatiquement.</p>
    `),
  }
}

export function sitemapBlockedTemplate(data: SitemapBlockedData): { subject: string; html: string } {
  return {
    subject: `[ACTION REQUISE] Sitemap bloqué — crawl incomplet sur ${data.siteName}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">Sitemap inaccessible</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">Notre crawler n'a pas pu accéder au sitemap de <strong>${data.siteName}</strong> (<code style="background:${C.gray100};padding:2px 6px;border-radius:4px;font-size:13px;">${data.siteUrl}</code>).</p>

      ${infoBox(`<strong>Conséquence :</strong> seule la homepage a été analysée — pas vos autres pages.`, C.warning, C.warningBg)}

      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${C.gray900};">Comment résoudre</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;margin:0 0 24px;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${C.gray100};">
          <span style="font-size:12px;color:${C.gray500};font-weight:600;text-transform:uppercase;">Option 1 — Whitelist User-Agent</span><br>
          <span style="font-size:13px;color:${C.gray700};">Autorisez les requêtes avec <code style="background:${C.gray100};padding:2px 6px;border-radius:3px;">Seogard-Bot</code> dans le User-Agent</span>
        </td></tr>
        <tr><td style="padding:12px 16px;">
          <span style="font-size:12px;color:${C.gray500};font-weight:600;text-transform:uppercase;">Option 2 — Whitelist IP</span><br>
          <span style="font-size:13px;color:${C.gray700};">Autorisez l'IP <code style="background:${C.gray100};padding:2px 6px;border-radius:3px;">142.132.133.166</code></span>
        </td></tr>
      </table>

      ${button(`${APP_URL}/bot`, 'Voir le guide complet →')}
      <p style="margin:0;color:${C.gray500};font-size:13px;">Besoin d'aide ? Répondez directement à cet email.</p>
    `),
  }
}

export function crawlerBlockedTemplate(data: CrawlerBlockedData): { subject: string; html: string } {
  const percent = Math.round((data.pagesBlocked / data.pagesTotal) * 100)

  return {
    subject: `[ACTION REQUISE] ${percent}% des pages bloquées par WAF — ${data.siteName}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">Crawler bloqué par pare-feu (WAF)</h2>
      <p style="margin:0 0 20px;color:${C.gray700};"><strong>${data.pagesBlocked.toLocaleString('fr-FR')} pages</strong> sur <strong>${data.pagesTotal.toLocaleString('fr-FR')}</strong> (${percent}%) ont été bloquées sur <strong>${data.siteName}</strong>.</p>

      ${infoBox(`<strong>Conséquence :</strong> ces pages ne génèrent <strong>aucune alerte SEO</strong> — une régression peut passer inaperçue.`, C.warning, C.warningBg)}

      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${C.gray900};">Comment résoudre</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;margin:0 0 24px;">
        <tr><td style="padding:12px 16px;border-bottom:1px solid ${C.gray100};">
          <span style="font-size:12px;color:${C.gray500};font-weight:600;text-transform:uppercase;">Option 1 — Whitelist User-Agent</span><br>
          <span style="font-size:13px;color:${C.gray700};">Autorisez les requêtes avec <code style="background:${C.gray100};padding:2px 6px;border-radius:3px;">Seogard-Bot</code> dans le User-Agent</span>
        </td></tr>
        <tr><td style="padding:12px 16px;">
          <span style="font-size:12px;color:${C.gray500};font-weight:600;text-transform:uppercase;">Option 2 — Whitelist IP</span><br>
          <span style="font-size:13px;color:${C.gray700};">Autorisez l'IP <code style="background:${C.gray100};padding:2px 6px;border-radius:3px;">142.132.133.166</code></span>
        </td></tr>
      </table>

      ${button(`${APP_URL}/bot`, 'Voir le guide complet →')}
      <p style="margin:0;color:${C.gray500};font-size:13px;">Besoin d'aide ? Répondez directement à cet email.</p>
    `),
  }
}

export function resetPasswordTemplate(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Réinitialiser votre mot de passe Seogard',
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">Réinitialisation du mot de passe</h2>
      <p style="margin:0 0 24px;color:${C.gray700};">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
      ${button(resetUrl, 'Réinitialiser mon mot de passe')}
      <p style="margin:0;color:${C.gray500};font-size:13px;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe reste inchangé.</p>
    `),
  }
}

export interface SitemapEstimateData {
  url: string
  pageCount: number
  price: string
  sitemapUrl: string | null
}

export function sitemapEstimateTemplate(data: SitemapEstimateData): { subject: string; html: string } {
  const zoningEstimate = Math.round(data.pageCount * 0.2)
  const zoningPrice = (zoningEstimate * 0.007).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
  const isLargeSite = data.pageCount > 50_000

  return {
    subject: `Votre estimation — ${data.pageCount.toLocaleString('fr-FR')} pages sur ${data.url}`,
    html: layout(`
      <h2 style="margin:0 0 6px;font-size:19px;font-weight:700;color:${C.gray900};">Votre estimation est prête</h2>
      <p style="margin:0 0 24px;color:${C.gray700};">Sitemap de <strong>${data.url}</strong> analysé.</p>

      <!-- Stats -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;border:1px solid ${C.gray200};border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:20px;text-align:center;border-right:1px solid ${C.gray200};width:50%;">
            <span style="display:block;font-size:30px;font-weight:700;color:${C.gray900};line-height:1;">${data.pageCount.toLocaleString('fr-FR')}</span>
            <span style="font-size:13px;color:${C.gray500};margin-top:4px;display:block;">pages détectées</span>
          </td>
          <td style="padding:20px;text-align:center;width:50%;">
            <span style="display:block;font-size:30px;font-weight:700;color:${C.gray900};line-height:1;">${data.price}</span>
            <span style="font-size:13px;color:${C.gray500};margin-top:4px;display:block;">si vous crawlez tout / mois</span>
          </td>
        </tr>
      </table>

      <!-- Zoning tip -->
      ${infoBox(
        `<strong style="font-size:14px;color:${C.gray900};">La plupart de nos clients crawlent 10–20% de leurs pages.</strong><br>
        <span style="color:${C.gray700};">Avec les <strong>zones</strong>, ciblez vos pages prioritaires — fiches produits, articles récents, catégories — et ignorez le reste.<br>
        Exemple : ${zoningEstimate.toLocaleString('fr-FR')} pages → <strong>${zoningPrice} €/mois</strong> au lieu de ${data.price}.</span>`,
        C.gray700, C.gray50, C.gray200,
      )}

      ${isLargeSite ? `<p style="margin:0 0 20px;font-size:13px;color:${C.gray700};">Pour les très grands sites, notre offre <strong>on-premise</strong> (hébergement chez vous, SLA, account manager) est aussi disponible. <a href="mailto:support@seogard.io" style="color:${C.accent};font-weight:500;">Contactez-nous</a> pour en discuter.</p>` : ''}

      ${divider()}

      <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:${C.gray900};">14 jours d'essai gratuit — sans carte bancaire</p>
      <p style="margin:0 0 20px;font-size:14px;color:${C.gray700};">Détectez vos premières régressions SEO en moins de 10 minutes. Crawls illimités pendant l'essai.</p>

      ${button(`${APP_URL}/register`, 'Commencer gratuitement →')}

      <p style="margin:0;color:${C.gray500};font-size:13px;">Préférez héberger vous-même ? <a href="https://github.com/seogard-software/seogard" style="color:${C.accent};font-weight:500;">Version self-hosted gratuite sur GitHub →</a></p>
    `),
  }
}

export function paymentFailedTemplate(orgId: string): { subject: string; html: string } {
  return {
    subject: '[ACTION REQUISE] Échec de paiement — vos crawls seront suspendus',
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">Échec de paiement</h2>
      <p style="margin:0 0 20px;color:${C.gray700};">Votre dernier paiement a échoué. Sans action de votre part, <strong>vos crawls seront suspendus dans 7 jours</strong>.</p>

      ${infoBox(`<strong>Impact :</strong> sans crawl actif, les régressions SEO passent inaperçues — exactement ce que Seogard est censé éviter.`, C.danger, C.dangerBg)}

      ${button(`${APP_URL}/dashboard/organizations/${orgId}/billing`, 'Mettre à jour mon paiement →')}

      <p style="margin:0;color:${C.gray500};font-size:13px;">Vous pensez qu'il s'agit d'une erreur ? Répondez directement à cet email ou écrivez à <a href="mailto:support@seogard.io" style="color:${C.accent};">support@seogard.io</a>.</p>
    `),
  }
}

export function inviteTemplate(orgName: string, role: string, inviteUrl: string): { subject: string; html: string } {
  const roleLabel: Record<string, string> = {
    owner: 'Propriétaire',
    admin: 'Administrateur',
    member: 'Membre',
    viewer: 'Lecteur',
  }
  return {
    subject: `Invitation à rejoindre ${orgName} sur Seogard`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:19px;font-weight:700;color:${C.gray900};">Vous êtes invité</h2>
      <p style="margin:0 0 8px;color:${C.gray700};">Vous avez été invité à rejoindre <strong>${orgName}</strong> sur Seogard.</p>

      ${infoBox(`
        <strong>Rôle :</strong> ${roleLabel[role] || role}<br>
        <strong>Organisation :</strong> ${orgName}
      `)}

      ${button(inviteUrl, 'Accepter l\'invitation')}

      <p style="margin:0;color:${C.gray500};font-size:13px;">Ce lien expire dans <strong>7 jours</strong>. Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
    `),
  }
}
