// Base de connaissance par règle — SOURCE UNIQUE consommée par le rapport de zone
// (.md / PDF / page HTML) et le détail d'alerte du dashboard.
// 4 blocs par règle : constat (factuel) / pourquoi (mécanique Google ET LLM) /
// action (UNE action focus) / gain (mécanique, jamais de pourcentage inventé).
// Ton : honnête — si une règle pèse peu, on le dit. Test d'exhaustivité dans
// rule-knowledge.test.ts : chaque règle du catalogue (rules-catalog.ts) a sa fiche.

export interface RuleKnowledge {
  constat: string
  pourquoi: string
  action: string
  gain: string
}

export const RULE_KNOWLEDGE: Record<string, RuleKnowledge> = {
  // ── Désindexation ─────────────────────────────────────────────
  noindex_added: {
    constat: 'Une directive noindex est apparue sur cette page (meta robots ou en-tête X-Robots-Tag).',
    pourquoi: 'Google retire la page de son index sous quelques jours : tout son trafic organique disparaît. Si la directive est accidentelle (config de pré-prod déployée, plugin), la perte passe inaperçue jusqu’à la chute de trafic.',
    action: 'Vérifier si le noindex est volontaire ; sinon, le retirer et redéployer immédiatement.',
    gain: 'La page reste dans l’index Google et conserve son trafic existant.',
  },
  status_code_changed: {
    constat: 'Le code HTTP de la page a changé (ex. 200 → 404, 500 ou redirection).',
    pourquoi: 'Une erreur 4xx/5xx répétée fait sortir la page de l’index et coupe son trafic. Les LLM qui re-visitent la page pour la citer obtiennent une erreur et l’écartent de leurs réponses.',
    action: 'Identifier la cause du nouveau code (déploiement, route supprimée, serveur) et restaurer le 200 — ou poser une redirection 301 vers l’équivalent.',
    gain: 'Google et les IA continuent d’accéder au contenu ; l’autorité accumulée de l’URL est préservée.',
  },
  canonical_missing: {
    constat: 'La balise canonical de cette page a disparu.',
    pourquoi: 'Sans canonical, Google choisit lui-même l’URL à indexer parmi les variantes (paramètres, www, slash final). Sur un site avec tracking ou facettes, le signal se dilue entre doublons et le positionnement devient instable.',
    action: 'Restaurer la balise canonical auto-référente dans le template concerné.',
    gain: 'Google concentre tout le signal sur une seule URL — positionnement stable et prévisible.',
  },
  canonical_changed: {
    constat: 'La canonical pointe vers une URL différente de celle observée au crawl précédent.',
    pourquoi: 'Si le changement est voulu (migration, consolidation), tout va bien. S’il est accidentel, vous dites à Google d’indexer une AUTRE page à la place de celle-ci : la page courante peut être désindexée au profit de la cible.',
    action: 'Confirmer que la nouvelle cible canonical est intentionnelle ; sinon restaurer l’auto-référence.',
    gain: 'Aucune désindexation silencieuse : chaque page indexable garde son signal.',
  },
  meta_title_missing: {
    constat: 'Le meta title de la page a disparu.',
    pourquoi: 'Le title est le signal de pertinence le plus direct pour Google et le texte cliquable dans les résultats. Sans lui, Google génère un titre approximatif — souvent moins pertinent — et le CTR baisse. Les LLM s’appuient aussi sur le title pour comprendre et citer la page.',
    action: 'Restaurer la balise <title> dans le template (vérifier le composant SEO/head du framework).',
    gain: 'Vous contrôlez à nouveau le titre affiché dans Google et lisible par les IA.',
  },
  soft_404: {
    constat: 'La page renvoie un code 200 mais affiche un message « page introuvable ».',
    pourquoi: 'Google détecte ces « soft 404 » et les traite comme des pages supprimées : désindexation, sans que vos outils de monitoring HTTP ne voient rien (le code est 200). C’est l’angle mort classique des SPA.',
    action: 'Renvoyer un vrai code 404/410 pour les contenus disparus, ou restaurer le contenu si la page doit exister.',
    gain: 'L’index Google reflète votre site réel ; le crawl budget n’est plus gaspillé sur des pages mortes.',
  },
  redirect_to_homepage: {
    constat: 'La page redirige vers la page d’accueil.',
    pourquoi: 'Google traite une redirection massive vers la home comme un soft 404 : le contenu, le positionnement et les backlinks de l’URL d’origine sont perdus. C’est un symptôme fréquent de route cassée après refonte.',
    action: 'Restaurer la page, ou rediriger en 301 vers la page équivalente la plus proche (jamais la home).',
    gain: 'L’autorité de l’URL est transmise à un contenu pertinent au lieu d’être perdue.',
  },
  page_redirected: {
    constat: 'Une page qui répondait normalement (200) redirige désormais vers une autre URL.',
    pourquoi: 'Google et les IA suivent la redirection : ils ne lisent plus le contenu de l’URL d’origine mais celui de la cible. Tous les redirects 3xx transmettent les signaux de l’ancienne URL ; mais seul un 301 (permanent) désigne la cible comme nouvelle URL canonique — un 302 (temporaire) laisse l’origine indexée, ce qui crée un état ambigu si le déplacement est en réalité définitif. Surtout, une redirection apparue sans intention trahit souvent une route cassée, une page supprimée par erreur ou une refonte qui a déplacé l’URL. Tant que personne ne l’a vue, l’ancienne adresse continue d’être liée et citée dans le vide.',
    action: 'Vérifier si la redirection est voulue. Si oui, confirmer qu’elle est en 301 (permanent) vers la page équivalente la plus proche. Si elle ne l’est pas, restaurer la page d’origine plutôt que de la rediriger.',
    gain: 'Les signaux de l’ancienne URL convergent vers le bon contenu et la page reste accessible aux humains comme aux machines, au lieu de fuir vers une cible non pertinente ou de disparaître à votre insu.',
  },
  js_redirect_detected: {
    constat: 'La page répond 200 avec du contenu, mais son JavaScript redirige le navigateur vers une autre URL.',
    pourquoi: 'Le serveur ne signale aucune redirection (pas de 3xx) : pour le fetch HTTP et les IA, cette page est un contenu normal — qu’elles lisent et peuvent indexer ou citer — alors que l’humain est envoyé ailleurs. Google sait suivre une redirection JavaScript, mais seulement après avoir rendu la page, dans une seconde vague différée : il peut donc indexer la mauvaise page en attendant, et ne voit jamais la redirection si le rendu échoue. Les IA, qui lisent le HTML brut, ne la suivent pas du tout. Une redirection JavaScript est donc un signal ambigu et fragile, souvent hérité d’un routeur SPA ou d’un `window.location` oublié.',
    action: 'Remplacer la redirection JavaScript par une vraie redirection serveur 301/302, ou rendre le contenu final directement sur l’URL demandée.',
    gain: 'Machines et humains voient la même page : plus d’indexation de la mauvaise URL ni de contenu lu par les IA qui ne correspond pas à la destination.',
  },

  // ── SSR / CSR ─────────────────────────────────────────────────
  ssr_rendering_failed: {
    constat: 'Le HTML renvoyé par votre serveur est quasi vide, alors que la page fonctionne dans le navigateur.',
    pourquoi: 'Google indexe d’abord le HTML brut : il voit une page vide jusqu’au second passage de rendu (de 24 h à plusieurs semaines). Les IA (ChatGPT, Perplexity, Claude) n’exécutent pas ou peu votre JavaScript : pour elles, cette page est quasi vide. C’est la panne SSR typique qui passe inaperçue car le site « marche » visuellement.',
    action: 'Réparer le rendu serveur (erreur SSR, hydratation, timeout) pour que le HTML brut contienne le contenu.',
    gain: 'Google indexe le vrai contenu dès le premier passage et les IA peuvent enfin lire et citer la page.',
  },
  ssr_content_mismatch: {
    constat: 'Le HTML brut contient moins de 10 % du contenu visible dans le navigateur.',
    pourquoi: 'La quasi-totalité du contenu est injectée par JavaScript. Google en voit une version très appauvrie au premier crawl, et les LLM — qui lisent quasi exclusivement le HTML brut — ne captent presque rien. Votre contenu existe pour les humains mais pas pour les machines qui décident de votre visibilité.',
    action: 'Rendre le contenu principal côté serveur (SSR/SSG) au lieu de l’injecter côté client.',
    gain: 'Le contenu complet devient indexable au premier crawl et citable par les IA.',
  },
  ssr_title_mismatch: {
    constat: 'Le title du HTML brut diffère de celui affiché après exécution du JavaScript.',
    pourquoi: 'Google peut indexer le title de la version brute (souvent un titre générique type « App »), pas celui que vous croyez avoir. Les LLM ne voient quasi que le title brut. Vous pilotez votre SEO sur un titre que les machines ne lisent pas.',
    action: 'Définir le title côté serveur (head SSR), pas via un script client.',
    gain: 'Le titre indexé et cité correspond enfin à celui que vous avez rédigé.',
  },
  ssr_meta_description_mismatch: {
    constat: 'La meta description du HTML brut diffère de celle rendue par le JavaScript.',
    pourquoi: 'Google se base souvent sur la version brute pour le snippet des résultats ; les IA ne lisent que celle-là. La description que vous avez optimisée n’est probablement jamais vue par les machines.',
    action: 'Rendre la meta description côté serveur.',
    gain: 'La description lue par Google et les IA est bien celle que vous avez rédigée, pas un texte fantôme (Google reste libre de réécrire le snippet affiché selon la requête).',
  },
  ssr_blocked: {
    constat: 'Votre pare-feu (WAF/anti-bot) a bloqué la requête HTTP de Seogard et renvoyé une page de challenge.',
    pourquoi: 'Si un crawler légitime est bloqué, d’autres le sont peut-être aussi : crawlers IA de citation, outils SEO, parfois même certains fetchs de Google. Au minimum, votre monitoring est aveugle sur ces pages.',
    action: 'Autoriser les crawlers légitimes (dont Seogard) dans la configuration du WAF/CDN.',
    gain: 'Le monitoring reprend, et vous évitez de bloquer silencieusement des robots utiles à votre visibilité.',
  },

  // ── Contenu / structure ───────────────────────────────────────
  h1_missing: {
    constat: 'Le H1 de la page a disparu.',
    pourquoi: 'Le H1 est le signal thématique principal d’une page pour Google, et le point d’ancrage des LLM pour comprendre de quoi elle parle. Sa disparition est presque toujours un bug de template, pas un choix.',
    action: 'Restaurer le H1 dans le template concerné.',
    gain: 'Google et les IA identifient à nouveau le sujet principal de la page.',
  },
  h1_multiple: {
    constat: 'La page contient plusieurs H1.',
    pourquoi: 'Le signal thématique se dilue entre plusieurs titres principaux. Ce n’est pas une pénalité, mais Google et les IA doivent deviner le vrai sujet — et devinent parfois mal. Souvent un composant (logo, bannière) abusivement balisé en H1.',
    action: 'Garder un seul H1 (le titre éditorial) et rétrograder les autres en H2/H3 ou en balises non-titres.',
    gain: 'Un sujet clair et unique par page — interprétation correcte garantie.',
  },
  h1_changed: {
    constat: 'Le texte du H1 a changé depuis le crawl précédent.',
    pourquoi: 'Si c’est une mise à jour éditoriale, parfait. Si c’est un bug de template (variable vide, mauvaise donnée), le positionnement acquis sur l’ancien intitulé peut s’éroder. Seogard signale le changement pour que vous l’acquittiez en connaissance de cause.',
    action: 'Vérifier que le nouveau H1 est intentionnel ; sinon corriger le template.',
    gain: 'Aucun changement de cap thématique ne passe inaperçu.',
  },
  thin_content: {
    constat: 'Le contenu de la page est passé sous 200 mots.',
    pourquoi: 'Un contenu très court donne peu de matière à Google pour positionner la page, et rien d’exploitable aux LLM pour la citer. Si la page était plus fournie avant, c’est probablement un composant de contenu qui ne se rend plus.',
    action: 'Vérifier que la maigreur est normale (page utilitaire) ou restaurer le contenu manquant.',
    gain: 'La page redevient une vraie candidate au positionnement et à la citation.',
  },
  content_removed: {
    constat: 'Plus de 50 % du contenu de la page a disparu.',
    pourquoi: 'Une chute massive du contenu est presque toujours un accident (composant cassé, mauvaise donnée CMS, déploiement). Google recalcule la pertinence de la page sur ce qui reste — généralement à la baisse, et durablement si rien n’est corrigé.',
    action: 'Comparer avec la version précédente et restaurer le contenu disparu.',
    gain: 'La page conserve la profondeur qui justifiait son positionnement.',
  },
  word_count_changed: {
    constat: 'Le volume de texte de la page a sensiblement varié depuis le dernier crawl.',
    pourquoi: 'Une variation notable est souvent volontaire (mise à jour éditoriale) — mais peut signaler un bloc qui ne se rend plus. Impact faible en soi : c’est un signal de surveillance, pas une alerte grave.',
    action: 'Survoler la page pour confirmer que la variation est voulue.',
    gain: 'Vous attrapez tôt un template qui perd des blocs de contenu.',
  },
  heading_hierarchy_broken: {
    constat: 'La hiérarchie des titres saute des niveaux (ex. H1 → H3 sans H2).',
    pourquoi: 'Honnêtement : impact SEO direct faible. Mais une structure de titres propre aide Google à découper la page en sections, les LLM à extraire des réponses, et les lecteurs d’écran à naviguer. C’est de l’hygiène à coût quasi nul.',
    action: 'Rétablir l’ordre logique des niveaux de titres dans le template.',
    gain: 'Extraction propre par les machines et meilleure accessibilité, pour quelques minutes de travail.',
  },

  // ── Meta / SERP ───────────────────────────────────────────────
  meta_title_changed: {
    constat: 'Le meta title a changé depuis le crawl précédent.',
    pourquoi: 'Volontaire ? Très bien. Accidentel (variable vide, fallback générique) ? Le CTR et le positionnement acquis sur l’ancien titre peuvent s’éroder sans bruit. Le changement mérite d’être vu et acquitté, pas découvert trois semaines plus tard.',
    action: 'Confirmer que le nouveau title est intentionnel ; sinon corriger.',
    gain: 'Aucune réécriture involontaire de vos titres ne passe en production sans validation.',
  },
  meta_description_missing: {
    constat: 'La meta description a disparu.',
    pourquoi: 'Google génère alors un snippet à partir du contenu — souvent moins vendeur que votre rédaction. Impact sur le CTR plus que sur le positionnement : ce n’est pas critique, mais c’est du clic laissé sur la table.',
    action: 'Restaurer la meta description dans le template.',
    gain: 'Vous proposez à nouveau un texte d’appel à Google, qu’il affiche quand il le juge pertinent (il réécrit fréquemment les snippets selon la requête).',
  },
  meta_description_changed: {
    constat: 'La meta description a changé depuis le crawl précédent.',
    pourquoi: 'Comme pour le title : sain si éditorial, suspect si personne n’a rien modifié. Impact modéré (CTR), mais un fallback générique déployé par erreur sur tout un template mérite d’être attrapé vite.',
    action: 'Vérifier l’intentionnalité du changement.',
    gain: 'Les régressions de snippet sont détectées au crawl suivant, pas au rapport mensuel.',
  },
  og_image_removed: {
    constat: 'L’image Open Graph (og:image) a disparu.',
    pourquoi: 'Aucun impact sur le ranking Google. Mais chaque partage sur LinkedIn, Slack, X ou WhatsApp s’affiche désormais sans visuel — le taux de clic des partages chute. Pour un site qui vit du social, c’est loin d’être cosmétique.',
    action: 'Restaurer la balise og:image (et vérifier que l’URL de l’image répond bien).',
    gain: 'Vos liens partagés redeviennent visuels et cliquables.',
  },
  og_title_removed: {
    constat: 'Le titre Open Graph (og:title) a disparu.',
    pourquoi: 'Sans og:title, les plateformes sociales utilisent le title ou improvisent. Impact limité au rendu des partages — pas au SEO — mais c’est une vitrine dégradée à coût de correction nul.',
    action: 'Restaurer la balise og:title.',
    gain: 'Des partages propres et maîtrisés sur toutes les plateformes.',
  },

  // ── Technique ─────────────────────────────────────────────────
  viewport_missing: {
    constat: 'La balise viewport a disparu.',
    pourquoi: 'Sans viewport, la page n’est plus adaptée au mobile. Google indexe en mobile-first : une page illisible sur mobile est une page mal classée. C’est presque toujours un layout/template qui a perdu sa balise au déploiement.',
    action: 'Restaurer la balise viewport dans le head du layout.',
    gain: 'La page reste éligible à un bon classement mobile-first.',
  },
  charset_missing: {
    constat: 'La déclaration d’encodage (charset) a disparu.',
    pourquoi: 'Risque concret : accents et caractères spéciaux mal affichés selon le navigateur, et contenu potentiellement mal interprété par les parseurs. Impact SEO direct faible, mais le bug d’affichage est immédiat pour les visiteurs.',
    action: 'Restaurer la balise meta charset (UTF-8) en tout début de head.',
    gain: 'Affichage fiable du texte pour tous les navigateurs et parseurs.',
  },
  https_mixed_content: {
    constat: 'Des ressources (images, scripts, styles) sont chargées en HTTP sur une page HTTPS.',
    pourquoi: 'Les navigateurs bloquent ou signalent ces ressources : cadenas cassé, éléments manquants, confiance utilisateur entamée. Google préfère les pages totalement sécurisées. Souvent une URL absolue oubliée dans un contenu ou un template.',
    action: 'Passer les URLs concernées en HTTPS (ou en URLs relatives).',
    gain: 'Le cadenas revient, plus aucune ressource bloquée par le navigateur.',
  },
  meta_refresh_detected: {
    constat: 'Une redirection par meta refresh a été détectée.',
    pourquoi: 'C’est la pire façon de rediriger : plus lente qu’une 301, moins bien transmise par Google, et invisible pour beaucoup d’outils. Elle signale souvent un vieux mécanisme ou un hack de template.',
    action: 'Remplacer le meta refresh par une vraie redirection HTTP 301 côté serveur.',
    gain: 'La redirection transmet proprement le signal SEO et s’exécute instantanément.',
  },
  robots_txt_changed: {
    constat: 'Le fichier robots.txt du site a changé.',
    pourquoi: 'Une ligne de robots.txt peut couper le crawl de sections entières. La plupart des catastrophes SEO de déploiement (« Disallow: / » de pré-prod poussé en prod) passent par ce fichier. Tout changement mérite une relecture immédiate.',
    action: 'Relire le diff du robots.txt et confirmer chaque règle modifiée.',
    gain: 'Aucun blocage de crawl accidentel ne survit plus d’un crawl.',
  },

  // ── i18n ──────────────────────────────────────────────────────
  hreflang_removed: {
    constat: 'Toutes les balises hreflang ont disparu.',
    pourquoi: 'Le ciblage international est cassé : Google peut servir la version française à un visiteur espagnol, ou faire concurrencer vos versions entre elles. Sur un site multilingue, c’est une régression majeure et silencieuse.',
    action: 'Restaurer le bloc hreflang (générateur ou template) et vérifier la réciprocité des annotations.',
    gain: 'Chaque marché reçoit la bonne version linguistique dans ses résultats.',
  },
  hreflang_changed: {
    constat: 'Les langues déclarées dans les hreflang ont changé.',
    pourquoi: 'Normal si vous ajoutez/retirez une langue. Accidentel, cela peut dérouter le ciblage d’un marché entier. Le changement doit être vu et validé.',
    action: 'Confirmer que la nouvelle liste de langues correspond à votre stratégie.',
    gain: 'Le ciblage international reste sous contrôle explicite.',
  },
  lang_attribute_missing: {
    constat: 'L’attribut lang de la balise html a disparu.',
    pourquoi: 'Impact modéré : Google détecte la langue par le contenu, mais l’attribut aide les lecteurs d’écran (prononciation) et certains parseurs. C’est une régression d’hygiène plus que de ranking.',
    action: 'Restaurer l’attribut lang sur la balise html du layout.',
    gain: 'Accessibilité propre et signal de langue explicite pour tous les outils.',
  },
  lang_attribute_changed: {
    constat: 'L’attribut lang a changé de valeur.',
    pourquoi: 'Un lang qui passe de fr à en sur un site français est presque toujours un template par défaut déployé par erreur. Faible impact direct, mais symptôme d’un layout modifié sans relecture.',
    action: 'Vérifier l’intentionnalité ; restaurer la bonne langue sinon.',
    gain: 'Cohérence linguistique préservée sur tout le site.',
  },

  // ── Données structurées ───────────────────────────────────────
  structured_data_removed: {
    constat: 'Les données structurées (JSON-LD) de la page ont disparu.',
    pourquoi: 'Vous perdez l’éligibilité aux rich snippets (étoiles, FAQ, produits) dans Google — un CTR supérieur acquis qui s’évapore. Les IA exploitent aussi ces données pour attribuer et citer les contenus : leur disparition vous rend moins lisible pour les deux moteurs.',
    action: 'Restaurer le bloc JSON-LD supprimé (souvent un composant retiré par erreur).',
    gain: 'Rich snippets de retour et contenus à nouveau attribuables par les IA.',
  },
  structured_data_error: {
    constat: 'Le JSON-LD de la page est présent mais invalide (erreur de syntaxe).',
    pourquoi: 'Un JSON invalide est simplement ignoré par Google et les IA : tous les bénéfices des données structurées disparaissent alors que le code semble en place. L’erreur vient souvent d’une valeur non échappée injectée dynamiquement.',
    action: 'Corriger la syntaxe (tester avec le validateur Schema.org) et échapper les valeurs dynamiques.',
    gain: 'Les données structurées redeviennent réellement exploitées, pas juste présentes.',
  },
  structured_data_author_removed: {
    constat: 'Le champ author a disparu des données structurées.',
    pourquoi: 'L’attribution (qui a écrit) est un signal de fiabilité dans la logique E-E-A-T de Google et un repère pour les IA quand elles décident quoi citer. Rien ne garantit qu’un champ author seul déclenche une citation, mais un contenu attribué part avec un signal de plus qu’un contenu anonyme. Impact modéré sur la citabilité, faible sur le ranking classique.',
    action: 'Restaurer le champ author dans le JSON-LD.',
    gain: 'Vos contenus restent attribuables — un critère que les moteurs génératifs valorisent.',
  },
  faq_schema_removed: {
    constat: 'Le schema FAQPage de la page a disparu.',
    pourquoi: 'Google n’affiche plus de rich result FAQ dans ses résultats : le schema FAQPage n’apporte donc plus d’affichage enrichi en SERP, et sa disparition n’a pas d’impact sur le ranking. Le contenu question/réponse visible, lui, reste lisible par Google et les LLM — qui lisent le texte de la page, pas le balisage. On signale la suppression car c’est souvent le symptôme d’un composant retiré par erreur.',
    action: 'Vérifier que la suppression est intentionnelle ; restaurer le composant si elle ne l’est pas.',
    gain: 'Confirmation que la suppression est voulue, pas un effet de bord d’un déploiement — le schema seul ne portait pas de trafic.',
  },

  // ── GEO — monitoring ──────────────────────────────────────────
  llms_txt_removed: {
    constat: 'Le fichier /llms.txt a été supprimé du site.',
    pourquoi: 'Honnêtement : impact faible à ce jour — llms.txt est une convention que les grands LLM ne confirment pas consommer. On vous signale la suppression parce que vous l’aviez mis en place volontairement : si elle est accidentelle, c’est le symptôme d’un déploiement qui a pu emporter d’autres fichiers statiques.',
    action: 'Vérifier que la suppression est volontaire ; sinon restaurer le fichier et auditer le déploiement.',
    gain: 'Cohérence avec votre intention initiale, et confirmation que le déploiement n’a rien emporté d’autre.',
  },
  ai_crawlers_blocked_changed: {
    constat: 'Le robots.txt bloque désormais des crawlers IA de citation qui étaient autorisés.',
    pourquoi: 'Les crawlers de citation (OAI-SearchBot et ChatGPT-User côté OpenAI, PerplexityBot et Perplexity-User côté Perplexity, Claude-SearchBot et Claude-User côté Anthropic) sont ceux qui permettent à ChatGPT search, Perplexity ou Claude de consulter et CITER vos pages. Les bloquer vous retire des réponses IA. À distinguer des crawlers d’entraînement (GPTBot, ClaudeBot, Google-Extended) dont le blocage n’affecte pas la citation.',
    action: 'Retirer les crawlers de citation des règles Disallow du robots.txt (garder le blocage des bots d’entraînement si c’est votre politique).',
    gain: 'Vos contenus redeviennent consultables et citables par les moteurs de réponse IA.',
  },
  robots_blocks_googlebot: {
    constat: 'Le robots.txt bloque Googlebot sur une partie du site.',
    pourquoi: 'C’est l’incident le plus radical possible : les sections bloquées ne seront plus crawlées, donc plus mises à jour dans l’index, puis dégradées. Le « Disallow » de pré-prod poussé en production est un grand classique des pertes de trafic massives.',
    action: 'Retirer immédiatement la règle qui bloque Googlebot (sauf blocage volontaire et documenté).',
    gain: 'Google conserve l’accès à tout ce qui doit être indexé.',
  },

  // ── Recommandations — audit on-page ───────────────────────────
  rec_img_alt_audit: {
    constat: 'Des images de la page n’ont pas d’attribut alt.',
    pourquoi: 'Google Image ne peut pas comprendre ces images, et les lecteurs d’écran non plus. Impact modeste sur le SEO global, réel sur le trafic Image et l’accessibilité.',
    action: 'Ajouter un alt descriptif aux images de contenu (les images décoratives peuvent rester en alt vide).',
    gain: 'Trafic Google Image possible et page accessible.',
  },
  rec_title_length_audit: {
    constat: 'Le title est trop court ou trop long pour s’afficher entièrement dans Google.',
    pourquoi: 'Un title tronqué perd son appel au clic ; un title trop court sous-exploite l’espace. C’est de l’optimisation de CTR, pas du ranking — utile, jamais urgent.',
    action: 'Viser un title de 30 à 60 caractères qui contient l’intention principale.',
    gain: 'Un titre entièrement visible et plus cliquable dans les résultats.',
  },
  rec_description_length_audit: {
    constat: 'La meta description est trop courte ou trop longue.',
    pourquoi: 'Trop longue, elle est tronquée ; trop courte, Google la remplace souvent par un extrait de son choix. Pur enjeu de CTR.',
    action: 'Viser 70 à 155 caractères avec une promesse claire.',
    gain: 'Une description calibrée pour s’afficher entièrement quand Google choisit de l’utiliser — sachant qu’il réécrit fréquemment les snippets selon la requête.',
  },
  rec_h1_missing_audit: {
    constat: 'Aucun H1 détecté sur la page (même après rendu JavaScript).',
    pourquoi: 'Sans titre principal, Google et les IA doivent déduire le sujet de la page d’autres signaux — moins fiable. Différent d’une régression : ici la page n’a jamais eu de H1.',
    action: 'Ajouter un H1 éditorial décrivant le sujet de la page.',
    gain: 'Sujet explicite pour tous les moteurs, humains compris.',
  },
  rec_favicon_missing_audit: {
    constat: 'Pas de favicon détecté.',
    pourquoi: 'Impact mineur : le favicon apparaît dans les onglets et à côté de votre nom dans les résultats mobiles Google. Son absence fait « site inachevé », rien de plus.',
    action: 'Ajouter un favicon aux formats standards.',
    gain: 'Une présence visuelle propre dans les onglets et les SERP mobiles.',
  },
  rec_semantic_structure_audit: {
    constat: 'Balises sémantiques (main, header, footer) absentes de la page.',
    pourquoi: 'Ces balises aident les moteurs et les lecteurs d’écran à séparer le contenu principal de l’habillage. Impact léger, hygiène structurelle.',
    action: 'Structurer le layout avec main, header et footer.',
    gain: 'Les machines isolent mieux votre contenu principal du reste.',
  },
  rec_structured_data_missing_audit: {
    constat: 'Aucune donnée structurée (JSON-LD) sur la page.',
    pourquoi: 'Sans schema, pas de rich snippets possibles et moins de prises pour les IA (attribution, type de contenu). Vous laissez un avantage SERP aux concurrents qui en ont.',
    action: 'Ajouter le JSON-LD correspondant au type de page (Article, Product, FAQ…).',
    gain: 'Éligibilité aux rich snippets et meilleure lisibilité machine.',
  },
  rec_og_missing_audit: {
    constat: 'Balises Open Graph manquantes (og:title, og:description ou og:image).',
    pourquoi: 'Chaque partage social s’affiche dégradé (sans visuel ou sans titre maîtrisé). Zéro impact ranking, vrai impact sur le clic social.',
    action: 'Compléter le trio og:title / og:description / og:image.',
    gain: 'Des partages attractifs sur toutes les plateformes.',
  },
  rec_internal_links_audit: {
    constat: 'La page contient très peu de liens internes sortants (voire aucun).',
    pourquoi: 'Une page qui ne pointe vers rien est un cul-de-sac : elle ne distribue aucun signal aux autres pages et n’aide pas Google à poursuivre son crawl. Cette règle porte sur les liens SORTANTS de la page (ceux qu’elle émet vers le reste du site).',
    action: 'Ajouter des liens contextuels vers les pages thématiquement proches.',
    gain: 'La page redistribue du signal interne et fluidifie le crawl du site.',
  },

  // ── Recommandations — écart SSR/CSR ───────────────────────────
  rec_h1_missing_in_ssr: {
    constat: 'Le H1 est absent du HTML brut envoyé par votre serveur, mais présent après chargement JavaScript.',
    pourquoi: 'Google indexe d’abord le HTML brut : votre titre principal n’est vu qu’au second passage de rendu, avec un délai de 24 h à plusieurs semaines. Les moteurs génératifs (ChatGPT, Perplexity, Claude) lisent quasi exclusivement le HTML brut — pour eux, cette page n’a pas de titre.',
    action: 'Rendre le H1 côté serveur (SSR), pas via un composant hydraté côté client.',
    gain: 'Google capte votre signal de titre dès le premier crawl, et les LLM disposent d’un titre pour comprendre et citer la page.',
  },
  rec_title_missing_in_ssr: {
    constat: 'La balise title est absente du HTML brut mais remplie après exécution du JavaScript.',
    pourquoi: 'Au premier passage, Google voit une page sans titre ; les IA ne verront jamais le vôtre. Le title est pourtant le signal le moins cher à servir en SSR.',
    action: 'Définir le title dans le head côté serveur.',
    gain: 'Titre visible par toutes les machines dès la première requête.',
  },
  rec_description_missing_in_ssr: {
    constat: 'La meta description n’existe que dans le rendu JavaScript, pas dans le HTML brut.',
    pourquoi: 'Le snippet Google et la lecture IA se basent surtout sur le HTML brut : votre description optimisée y est invisible. Impact CTR plus que ranking.',
    action: 'Rendre la meta description côté serveur.',
    gain: 'Votre description est présente dès le HTML brut, donc réellement lue par Google et les IA.',
  },
  rec_content_missing_in_ssr: {
    constat: 'Une part importante du texte de la page n’existe que dans le rendu JavaScript.',
    pourquoi: 'Google finit par le voir (second passage, avec délai) ; les LLM, jamais. Plus la part injectée en JS est grande, plus votre contenu est invisible pour les moteurs de réponse IA — le canal qui monte.',
    action: 'Rendre le contenu principal côté serveur ; réserver le JS aux éléments interactifs.',
    gain: 'Contenu intégralement indexable sans délai et citable par les IA.',
  },
  rec_internal_links_missing_in_ssr: {
    constat: 'Les liens internes de la page sont injectés par JavaScript, absents du HTML brut.',
    pourquoi: 'Le maillage interne guide le crawl de Google : des liens invisibles au premier passage ralentissent la découverte des pages. Les IA qui suivent les liens du HTML brut ne navigueront pas dans votre site.',
    action: 'Rendre la navigation et les liens contextuels en SSR (vraies balises a href dans le HTML brut).',
    gain: 'Crawl fluide et découverte complète du site par toutes les machines.',
  },
  rec_structured_data_missing_in_ssr: {
    constat: 'Le JSON-LD est injecté par JavaScript, absent du HTML brut.',
    pourquoi: 'Google le lit généralement au second passage, mais les IA et de nombreux parseurs ne voient que le HTML brut : vos données structurées leur sont invisibles. Le bénéfice attribution/citation est perdu là où il compte le plus.',
    action: 'Inclure le JSON-LD dans le HTML serveur.',
    gain: 'Données structurées lisibles par 100 % des machines, pas seulement Google.',
  },
  rec_img_alt_missing_in_ssr: {
    constat: 'Des images ajoutées par JavaScript n’ont pas d’attribut alt.',
    pourquoi: 'Cumul de deux faiblesses : images invisibles dans le HTML brut ET sans description. Google Image les ignorera probablement ; impact accessibilité identique.',
    action: 'Ajouter les alt et, si possible, rendre ces images côté serveur.',
    gain: 'Images indexables et accessibles.',
  },
  rec_semantic_structure_missing_in_ssr: {
    constat: 'Les balises sémantiques (main, header, footer) n’apparaissent qu’après exécution du JavaScript.',
    pourquoi: 'Le HTML brut — celui que lisent les IA et le premier passage de Google — n’a aucune structure. Impact léger, mais symptomatique d’un layout entièrement client-side.',
    action: 'Rendre la structure du layout côté serveur.',
    gain: 'Une page structurée pour toutes les machines dès le premier octet.',
  },

  // ── Recommandations — GEO ─────────────────────────────────────
  rec_llms_txt_missing: {
    constat: 'Pas de fichier /llms.txt sur le site.',
    pourquoi: 'Honnêtement : convention spéculative, non confirmée par les grands LLM (ni Google ni OpenAI ne l’ont adoptée). Sa valeur actuelle est documentaire — guider agents et outils vers vos contenus clés. À traiter comme un bonus, pas une priorité.',
    action: 'Si le coût est nul pour vous : publier un llms.txt listant vos pages de référence. Sinon, ignorer sans remords.',
    gain: 'Un point d’entrée propre pour les agents IA — au pire inutile, jamais nuisible.',
  },
  rec_ai_crawlers_blocked: {
    constat: 'Le robots.txt bloque des crawlers IA de citation (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User).',
    pourquoi: 'Ces crawlers permettent aux moteurs de réponse (ChatGPT search, Perplexity, Claude) de consulter et citer vos pages : les bloquer vous retire de leurs réponses. Nuance importante : bloquer les crawlers d’ENTRAÎNEMENT (GPTBot, Google-Extended) n’affecte pas la citation — beaucoup d’outils confondent les deux, pas Seogard.',
    action: 'Autoriser les crawlers de citation dans le robots.txt (votre politique sur les bots d’entraînement peut rester inchangée).',
    gain: 'Présence possible dans les réponses des moteurs IA — un canal de trafic en croissance.',
  },
  rec_structured_data_incomplete: {
    constat: 'Les données structurées existent mais sont incomplètes (auteur, date ou éditeur manquant).',
    pourquoi: 'Les IA s’appuient sur ces champs pour juger la fiabilité et attribuer une citation (qui a écrit, quand, pour qui). Un schema squelettique rapporte peu.',
    action: 'Compléter author, datePublished et publisher dans le JSON-LD.',
    gain: 'Contenus datés et attribués — le profil que les moteurs génératifs préfèrent citer.',
  },
  rec_faq_schema_missing: {
    constat: 'Page de contenu substantiel (plus de 300 mots) sans schema FAQPage.',
    pourquoi: 'Quand un contenu traite des questions récurrentes, l’organiser en questions/réponses explicites le rend plus facilement extrait par les moteurs de réponse IA, qui repèrent les passages répondant à une intention. C’est la STRUCTURE éditoriale visible (question en titre, réponse dessous) qui porte ce bénéfice, pas le balisage FAQPage — Google n’affiche plus de rich result FAQ en SERP. Sur une page qui ne traite pas de questions, cette recommandation ne s’applique pas.',
    action: 'Si votre contenu répond à des questions récurrentes, les structurer en sections claires (question en H2/H3, réponse concise). Le schema FAQPage reste optionnel et sans risque, mais ne déclenche plus d’affichage enrichi.',
    gain: 'Des passages que les moteurs de réponse peuvent isoler et reprendre — et un contenu plus scannable pour vos visiteurs.',
  },
  rec_citation_signals_missing: {
    constat: 'Plusieurs signaux de citation manquent (auteur, date, sources externes).',
    pourquoi: 'Pour citer un contenu, un moteur génératif cherche qui parle, quand, et sur quelles bases. Un contenu anonyme, non daté et sans références part avec un handicap face à un concurrent attribué.',
    action: 'Afficher auteur et date, et sourcer les affirmations clés par des liens.',
    gain: 'Un contenu vérifiable (qui parle, quand, sur quelles bases) — les éléments qu’un moteur génératif peut utiliser pour évaluer une source. Pas une garantie de citation, mais un handicap en moins.',
  },
  rec_content_structure_audit: {
    constat: 'Le contenu n’a ni sous-titres (H2) ni listes.',
    pourquoi: 'Les IA extraient des passages : un pavé de texte sans structure est difficile à découper, donc moins cité. Les humains scannent aussi mieux un contenu structuré — double gain.',
    action: 'Découper le contenu en sections H2 et convertir les énumérations en listes.',
    gain: 'Contenu extractible par les IA et plus lisible pour vos visiteurs.',
  },

  // ── Performance ───────────────────────────────────────────────
  perf_page_weight_explosion: {
    constat: 'Le poids total de la page a fortement augmenté depuis le crawl précédent.',
    pourquoi: 'Une page brutalement plus lourde charge plus lentement, surtout sur mobile — expérience dégradée et Core Web Vitals sous pression. La cause typique : une image non compressée ou une dépendance JS ajoutée sans contrôle.',
    action: 'Identifier la ressource responsable (image, script) dans la répartition du poids et la compresser ou la retirer.',
    gain: 'Temps de chargement maîtrisé — le poids est l’un des leviers directs du LCP, surtout sur mobile.',
  },
  rec_perf_page_heavy: {
    constat: 'La page dépasse 1,6 MB (seuil Lighthouse), excessif au-delà de 5 MB.',
    pourquoi: 'Le poids pèse d’abord sur vos visiteurs mobiles et votre taux de rebond ; l’effet SEO passe par l’expérience (Core Web Vitals), pas par une pénalité directe. À traiter comme un chantier de fond, pas une urgence.',
    action: 'Compresser les images (formats modernes) et alléger le JavaScript embarqué.',
    gain: 'Pages plus rapides pour les visiteurs réels — la métrique qui précède toutes les autres.',
  },
}

/** Fiche d'une règle, ou null si inconnue (le rapport doit tolérer une règle sans fiche). */
export function getRuleKnowledge(ruleId: string): RuleKnowledge | null {
  return RULE_KNOWLEDGE[ruleId] ?? null
}
