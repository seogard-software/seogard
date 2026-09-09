// L'aperçu ajoute seulement une présentation CSS et une CSP à la source mesurée.
// Aucun texte, titre ou élément de contenu n'est remplacé.
export function ssrDemoPreview(source: string): string {
  const presentation = [
    '<meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;; script-src &apos;unsafe-inline&apos;; style-src &apos;unsafe-inline&apos;; base-uri &apos;none&apos;; form-action &apos;none&apos;">',
    '<style>',
    'html{color-scheme:light;background:#fff;color:#334155;font:14px/1.7 system-ui,sans-serif}',
    'body{margin:0;padding:28px}main{max-width:620px;margin:auto}',
    'h1{font:600 30px/1.15 Georgia,serif;letter-spacing:-.03em;color:#111827;margin:0 0 20px;padding-bottom:20px;border-bottom:1px solid #e2e8f0}',
    'p{margin:0 0 18px}p:first-of-type{font-size:15px;color:#1e293b}',
    '@media(max-width:400px){body{padding:20px}h1{font-size:26px}}',
    '</style>',
  ].join('')
  return source.replace('<head>', '<head>' + presentation)
}
