import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { ReportRuleEntry, ZoneReport } from '../../shared/types/zone-report'

// Enregistre les polices Roboto (normal/bold/italique) dans le système de fichiers virtuel.
// API pdfmake 0.3 absente des types publiés (qui couvrent la 0.2) — cast justifié.
;(pdfMake as unknown as { addVirtualFileSystem: (vfs: unknown) => void }).addVirtualFileSystem(pdfFonts)

// Génération du PDF « État de santé SEO » (pdfmake — JS pur, pas de Chromium).
// buildReportDocDefinition est pur ; renderReportPdf produit le Buffer.

const COLORS = {
  critical: '#dc2626',
  warning: '#ea580c',
  info: '#6b7280',
  ok: '#16a34a',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  cardBg: '#f9fafb',
  dangerBg: '#fef2f2',
  okBg: '#f0fdf4',
} as const

// Largeur utile (A4 595pt - marges 40+40) pour les filets pleine largeur.
const CONTENT_WIDTH = 515

const STATUS_LABEL: Record<string, string> = { ok: 'OK', warning: 'À surveiller', critical: 'Action requise' }
const STATUS_COLOR: Record<string, string> = { ok: COLORS.ok, warning: COLORS.warning, critical: COLORS.critical }

function formatDate(iso: string | null): string {
  if (!iso) return 'jamais'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Séparateur de milliers = espace normal. toLocaleString('fr-FR') injecte U+202F
// (espace fine insécable) que la police Roboto du PDF ne rend pas → glyphe parasite.
function fmtNum(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Titre de section + filet coloré pleine largeur dessous.
function sectionHeader(title: string, accent: string): Content[] {
  return [
    { text: title, style: 'h2', tocItem: true, margin: [0, 18, 0, 4] },
    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.5, lineColor: accent }], margin: [0, 0, 0, 8] },
  ]
}

const SEVERITY_LABEL: Record<string, string> = { critical: 'Critique', warning: 'Warning', info: 'Info' }

function scopeLabel(entry: ReportRuleEntry): string {
  if (entry.siteLevel) return 'Site entier'
  return `${fmtNum(entry.pagesCount)} page${entry.pagesCount > 1 ? 's' : ''}`
}

// Tableau compact : une ligne par règle (sévérité · règle · étendue · action focus).
// Remplace les fiches longues — le détail complet vit dans l'export Markdown.
function compactTable(entries: ReportRuleEntry[]): Content {
  const header: TableCell[] = [
    { text: 'Sévérité', style: 'th' },
    { text: 'Règle', style: 'th' },
    { text: 'Étendue', style: 'th' },
    { text: 'Action recommandée', style: 'th' },
  ]
  const rows: TableCell[][] = entries.map(entry => [
    { text: SEVERITY_LABEL[entry.severity] ?? entry.severity, color: COLORS[entry.severity], bold: true, style: 'td' },
    { text: entry.label, style: 'td', bold: true },
    { text: scopeLabel(entry), style: 'td' },
    { text: entry.knowledge?.action ?? '—', style: 'td', color: COLORS.muted },
  ])
  return {
    table: { headerRows: 1, widths: ['auto', '*', 'auto', '*'], body: [header, ...rows] },
    layout: {
      fillColor: (rowIndex: number) => (rowIndex === 0 ? COLORS.cardBg : null),
      hLineWidth: () => 0.5,
      hLineColor: () => COLORS.border,
      vLineWidth: () => 0,
      paddingTop: () => 5,
      paddingBottom: () => 5,
      paddingLeft: () => 6,
      paddingRight: () => 6,
    },
    margin: [0, 2, 0, 0],
  }
}

// Bloc « ce que ça signifie » — cadrage métier QUALITATIF (jamais de chiffre inventé).
function businessMeaning(report: ZoneReport): Content[] {
  const { verdict } = report
  const points: Content[] = []
  if (verdict.critical > 0) {
    points.push({ text: `${fmtNum(verdict.critical)} régression(s) critique(s) : des pages risquent de sortir de l'index Google ou de perdre leur position. À traiter en priorité.`, style: 'body', color: COLORS.critical })
  }
  if (verdict.warning > 0) {
    points.push({ text: `${fmtNum(verdict.warning)} régression(s) warning : des signaux se sont dégradés — à vérifier avant qu'ils ne pèsent.`, style: 'body', color: COLORS.warning })
  }
  if (verdict.signaturePagesCount > 0) {
    points.push({ text: `${fmtNum(verdict.signaturePagesCount)} page(s) au contenu différent pour les machines : Google ne les voit pas complètement au premier passage, et les IA (ChatGPT, Perplexity, Claude) ne les voient quasiment pas.`, style: 'body' })
  }
  if (points.length === 0) {
    points.push({ text: 'Aucune régression ouverte : ce que voient vos visiteurs, Google et les IA est cohérent. Le monitoring continue à chaque crawl.', style: 'body', color: COLORS.ok })
  }
  return [
    { text: 'Ce que ça signifie pour vous', style: 'h3', margin: [0, 4, 0, 4] },
    { ul: points, margin: [0, 0, 0, 4] },
  ]
}

export function buildReportDocDefinition(report: ZoneReport): TDocumentDefinitions {
  const { meta, verdict } = report
  const content: Content[] = []

  // ── En-tête / verdict ──
  content.push(
    { text: 'État de santé SEO', style: 'h1' },
    { text: `${meta.siteDomain} · ${meta.zoneName}`, style: 'subtitle' },
    { text: 'Comparaison HTML brut (indexé par Google) vs rendu JavaScript', style: 'tagline' },
    { text: `Dernier crawl : ${formatDate(meta.crawlCompletedAt)} · ${fmtNum(meta.pagesScanned)} pages crawlées · Généré le ${formatDate(meta.generatedAt)}`, style: 'meta', margin: [0, 4, 0, 16] },
    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: `${verdict.critical}`, style: 'bigNumber', color: verdict.critical > 0 ? COLORS.critical : COLORS.muted },
            { text: `${verdict.warning}`, style: 'bigNumber', color: verdict.warning > 0 ? COLORS.warning : COLORS.muted },
            { text: `${verdict.recommendations}`, style: 'bigNumber', color: COLORS.muted },
            { text: STATUS_LABEL[verdict.status] ?? verdict.status, style: 'bigNumberLabel', color: STATUS_COLOR[verdict.status] ?? COLORS.text },
          ],
          [
            { text: 'régressions critiques', style: 'numberLabel' },
            { text: 'warnings', style: 'numberLabel' },
            { text: 'recommandations', style: 'numberLabel' },
            { text: 'verdict', style: 'numberLabel' },
          ],
        ] satisfies TableCell[][],
      },
      layout: {
        fillColor: () => COLORS.cardBg,
        hLineWidth: () => 0,
        vLineWidth: (i: number) => (i === 0 || i === 4 ? 0 : 4),
        vLineColor: () => '#ffffff',
        paddingTop: (row: number) => (row === 0 ? 12 : 0),
        paddingBottom: (row: number) => (row === 0 ? 2 : 12),
      },
      margin: [0, 0, 0, 14],
    },
  )

  const signatureText = verdict.signaturePagesCount > 0
    ? `${fmtNum(verdict.signaturePagesCount)} page${verdict.signaturePagesCount > 1 ? 's' : ''} où Google et les IA voient un contenu différent de vos visiteurs (écart HTML brut vs rendu JavaScript).`
    : 'Aucun écart détecté entre ce que voient vos visiteurs et ce que voient Google et les IA.'
  content.push({
    table: { widths: ['*'], body: [[{ text: signatureText, style: 'signature', color: verdict.signaturePagesCount > 0 ? COLORS.critical : COLORS.ok }]] },
    layout: {
      fillColor: () => (verdict.signaturePagesCount > 0 ? COLORS.dangerBg : COLORS.okBg),
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 12,
      paddingBottom: () => 12,
      paddingLeft: () => 14,
      paddingRight: () => 14,
    },
    margin: [0, 0, 0, 16],
  })

  // ── Ce que ça signifie (métier) ──
  content.push(...businessMeaning(report))

  // ── Régressions (tableau compact) ──
  const allRegressions = [...report.regressions.critical, ...report.regressions.warning, ...report.regressions.info]
  content.push(...sectionHeader('Régressions — ce qui fonctionnait et s’est dégradé', COLORS.critical))
  if (allRegressions.length === 0) {
    content.push({ text: 'Aucune régression ouverte sur cette zone. Le monitoring continue à chaque crawl.', style: 'body', color: COLORS.ok })
  }
  else {
    content.push(compactTable(allRegressions))
  }

  // ── Recommandations (tableau compact) ──
  content.push(...sectionHeader('Recommandations d’audit — jamais bloquant', COLORS.info))
  if (report.recommendations.length === 0) {
    content.push({ text: 'Aucune recommandation ouverte.', style: 'body', color: COLORS.muted })
  }
  else {
    content.push(compactTable(report.recommendations))
  }

  // ── Réparé ──
  content.push(...sectionHeader('Réparé depuis le dernier crawl', COLORS.ok))
  if (report.repaired.length === 0) {
    content.push({ text: 'Aucune régression réparée détectée lors du dernier crawl.', style: 'body', color: COLORS.muted })
  }
  else {
    content.push({ ul: report.repaired.map(item => ({ text: `${item.label} — ${fmtNum(item.pagesCount)} page${item.pagesCount > 1 ? 's' : ''}`, style: 'body', color: COLORS.ok })) })
  }

  // ── Renvoi vers l'export exhaustif ──
  content.push({
    table: { widths: ['*'], body: [[{ text: [
      { text: 'Détail complet — ', bold: true },
      { text: 'ce PDF est une synthèse. Pour TOUTES les pages et alertes (URLs comprises), téléchargez l’export Markdown du rapport depuis le dashboard Seogard (bouton « Export pour IA »).' },
    ], style: 'body' }]] },
    layout: {
      fillColor: () => COLORS.cardBg,
      hLineWidth: () => 0, vLineWidth: () => 0,
      paddingTop: () => 10, paddingBottom: () => 10, paddingLeft: () => 12, paddingRight: () => 12,
    },
    margin: [0, 20, 0, 0],
  })

  return {
    pageSize: 'A4',
    pageMargins: [40, 50, 40, 50],
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: 'Généré par Seogard — seogard.io', style: 'footer' },
        { text: `${currentPage} / ${pageCount}`, style: 'footer', alignment: 'right' },
      ],
      margin: [40, 10, 40, 0],
    }),
    header: () => ({
      text: `${meta.siteDomain} · ${meta.zoneName} · ${formatDate(meta.generatedAt)}`,
      style: 'pageHeader',
      margin: [40, 20, 40, 0],
    }),
    content,
    styles: {
      h1: { fontSize: 24, bold: true, color: COLORS.text },
      subtitle: { fontSize: 14, color: COLORS.text, margin: [0, 4, 0, 0] },
      tagline: { fontSize: 10, color: COLORS.muted, italics: true, margin: [0, 2, 0, 0] },
      meta: { fontSize: 9, color: COLORS.muted },
      bigNumber: { fontSize: 26, bold: true, alignment: 'center' },
      bigNumberLabel: { fontSize: 13, bold: true, alignment: 'center', margin: [0, 8, 0, 0] },
      numberLabel: { fontSize: 8, color: COLORS.muted, alignment: 'center' },
      signature: { fontSize: 11, bold: true },
      h2: { fontSize: 15, bold: true, color: COLORS.text },
      h3: { fontSize: 12, bold: true, color: COLORS.text },
      body: { fontSize: 9.5, color: COLORS.text, margin: [0, 1, 0, 1], lineHeight: 1.25 },
      th: { fontSize: 8.5, bold: true, color: COLORS.muted },
      td: { fontSize: 9, color: COLORS.text },
      footer: { fontSize: 8, color: COLORS.muted },
      pageHeader: { fontSize: 8, color: COLORS.muted, alignment: 'right' },
    },
    defaultStyle: { fontSize: 10, color: COLORS.text },
  }
}

export async function renderReportPdf(report: ZoneReport): Promise<Buffer> {
  const doc = pdfMake.createPdf(buildReportDocDefinition(report))
  // pdfmake 0.3 : getBuffer() renvoie une Promise (les types publiés couvrent l'API 0.2 à callback).
  const buffer = await (doc as unknown as { getBuffer: () => Promise<Uint8Array> }).getBuffer()
  return Buffer.from(buffer)
}
