<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>Conditions Générales de Vente</h1>
      <p class="legal-page__updated">Version 1.0 — En vigueur au 18 mars 2026</p>

      <h2>1. Objet</h2>
      <p>Les présentes Conditions Générales de Vente (ci-après « CGV ») définissent les conditions dans lesquelles SAVEPNP, SAS au capital de 1 000 €, immatriculée au RCS de Créteil sous le n° 912 784 030, dont le siège social est situé 25 rue Camille Blanc, 94400 Vitry-sur-Seine (ci-après « le Prestataire ») fournit le service Cloud Seogard (ci-après « le Service ») à ses clients (ci-après « le Client »). Les informations relatives au Prestataire figurent dans les <NuxtLink to="/legal/mentions">mentions légales</NuxtLink>.</p>
      <p>Toute souscription au Service Cloud implique l'acceptation sans réserve des présentes CGV, des <NuxtLink to="/legal/cgu">CGU</NuxtLink> et de la <NuxtLink to="/legal/privacy">Politique de confidentialité</NuxtLink>.</p>
      <p><strong>Le Service est exclusivement destiné aux professionnels</strong> au sens de l'article liminaire du Code de la consommation. En souscrivant, le Client déclare et garantit agir dans le cadre de son activité professionnelle.</p>

      <h2>2. Description du Service</h2>
      <p>Le Service Cloud Seogard comprend :</p>
      <ul>
        <li>L'hébergement et la maintenance de l'infrastructure de monitoring SEO</li>
        <li>Le crawl et l'analyse automatisée des pages web du Client</li>
        <li>Les alertes instantanées et le dashboard en temps réel</li>
        <li>Les mises à jour et améliorations continues du Service</li>
        <li>Le support technique par email</li>
      </ul>

      <h2>3. Tarification</h2>
      <h3>3.1 Modèle de facturation</h3>
      <p>Le Service Cloud est facturé <strong>à l'usage</strong>, au tarif de <strong>{{ pricePerPage }} € HT par page monitorée par mois</strong>.</p>
      <p>TVA applicable : 20 % (services numériques, France). Le tarif TTC est donc de {{ priceTTC }} € par page monitorée par mois.</p>
      <p>Seule une page <strong>effectivement crawlée</strong> (analysée par le Service) au cours de la période de facturation est comptabilisée. Les pages découvertes mais non crawlées ne sont pas facturées.</p>

      <h3>3.2 Comptage des pages</h3>
      <p>Le nombre de pages facturées correspond au nombre de pages distinctes ayant été analysées au moins une fois pendant la période de facturation mensuelle. <strong>Relancer un crawl sur les mêmes pages au cours du même mois ne génère aucun coût supplémentaire.</strong></p>
      <p>Le comptage est effectué automatiquement par le Service sur la base du champ technique <code>lastCheckedAt</code> de chaque page. Le Client peut consulter le nombre de pages facturées à tout moment dans son espace de facturation.</p>

      <h3>3.3 Exemples de calcul</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>Scénario</th>
            <th>Pages facturées</th>
            <th>Coût mensuel HT</th>
            <th>Coût mensuel TTC</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="example in priceExamples" :key="example.pages">
            <td>{{ example.label }} pages crawlées</td>
            <td>{{ example.label }}</td>
            <td>{{ example.price }} €</td>
            <td>{{ example.priceTTC }} €</td>
          </tr>
        </tbody>
      </table>

      <h3>3.4 Révision tarifaire</h3>
      <p>Le Prestataire se réserve le droit de modifier ses tarifs. Toute modification tarifaire sera notifiée par email au moins <strong>30 jours</strong> avant son entrée en vigueur. Le nouveau tarif s'appliquera à compter de la période de facturation suivant l'expiration de ce délai.</p>
      <p>Si le Client n'accepte pas le nouveau tarif, il peut résilier son abonnement avant l'entrée en vigueur de la modification, sans frais ni pénalité.</p>

      <h3>3.5 Période d'essai</h3>
      <p>Un essai gratuit de <strong>14 jours</strong> est offert à tout nouveau Client, sans engagement et sans carte bancaire. Pendant cette période, le Service est accessible sans limitation de fonctionnalités. À l'issue de la période d'essai, le Client doit activer la facturation pour continuer à utiliser le Service.</p>
      <p>Si le Client active la facturation avant la fin de la période d'essai, les jours d'essai restants sont conservés et la première facture ne sera émise qu'à l'expiration de ces jours restants.</p>
      <p>À l'issue de la période d'essai, en l'absence d'activation de la facturation, l'accès aux crawls est suspendu. Les données du Client sont conservées pendant 90 jours, après quoi elles pourront être supprimées.</p>

      <h2>4. Facturation et paiement</h2>
      <h3>4.1 Modalités</h3>
      <p>La facturation est mensuelle. Le paiement est effectué par carte bancaire via la plateforme de paiement sécurisée Stripe (certifiée PCI-DSS niveau 1). Les factures sont disponibles dans l'espace Client et envoyées par email.</p>

      <h3>4.2 Délai de paiement</h3>
      <p>Le paiement est exigible à réception de la facture. Le prélèvement est automatique à chaque échéance mensuelle.</p>

      <h3>4.3 Retard de paiement</h3>
      <p>En cas de retard de paiement, et conformément aux articles L.441-10 et suivants du Code de commerce :</p>
      <ul>
        <li>Des <strong>pénalités de retard</strong> sont dues de plein droit, sans qu'un rappel soit nécessaire, au taux d'intérêt appliqué par la Banque Centrale Européenne à son opération de refinancement la plus récente, majoré de <strong>10 points de pourcentage</strong>, calculées sur le montant TTC de la somme restant due, à compter du jour suivant la date d'échéance</li>
        <li>Une <strong>indemnité forfaitaire de 40 €</strong> pour frais de recouvrement est due de plein droit (article D.441-5 du Code de commerce)</li>
        <li>Si les frais de recouvrement réels dépassent ce montant forfaitaire, le Prestataire se réserve le droit de demander une indemnisation complémentaire sur justification</li>
      </ul>

      <h3>4.4 Suspension pour impayé</h3>
      <p>En cas d'échec de paiement, et après notification par email :</p>
      <ul>
        <li>Suspension de l'accès aux crawls après un délai de <strong>7 jours</strong> suivant la date d'échéance impayée</li>
        <li>Suspension de l'intégralité du Service après <strong>30 jours</strong> d'impayé</li>
        <li>Résiliation du compte et suppression des données après <strong>90 jours</strong> d'impayé, après mise en demeure par email restée sans effet pendant <strong>15 jours</strong></li>
      </ul>
      <p>Les sommes dues restent exigibles même après la suspension ou la résiliation du compte.</p>

      <h2>5. Durée et résiliation</h2>
      <h3>5.1 Durée</h3>
      <p>L'abonnement est souscrit <strong>sans engagement</strong>, pour une durée indéterminée, avec facturation mensuelle.</p>

      <h3>5.2 Résiliation par le Client</h3>
      <p>Le Client peut résilier son abonnement à tout moment depuis son espace de facturation (portail Stripe) ou en contactant legal@seogard.io. La résiliation prend effet à la fin de la période de facturation en cours. Aucun remboursement au prorata n'est effectué pour la période en cours.</p>

      <h3>5.3 Résiliation par le Prestataire</h3>
      <p>Le Prestataire se réserve le droit de résilier l'abonnement, après mise en demeure par email restée sans effet pendant 15 jours, en cas de :</p>
      <ul>
        <li>Violation des Conditions Générales d'Utilisation</li>
        <li>Utilisation abusive ou frauduleuse du Service</li>
        <li>Impayé persistant (voir article 4.4)</li>
      </ul>

      <h2>6. Données et portabilité</h2>
      <p>En cas de résiliation, le Client dispose d'un délai de <strong>30 jours</strong> pour exporter ses données via l'API du Service. Passé ce délai, les données seront supprimées conformément à la <NuxtLink to="/legal/privacy">Politique de confidentialité</NuxtLink>.</p>

      <h2>7. Garanties et responsabilité</h2>
      <p>Le Prestataire s'engage à mettre en œuvre les moyens nécessaires pour assurer la disponibilité et la qualité du Service (obligation de moyens). Toutefois, le Prestataire ne garantit pas :</p>
      <ul>
        <li>L'exhaustivité ou l'exactitude des analyses SEO produites</li>
        <li>L'amélioration du positionnement SEO du Client</li>
        <li>Une disponibilité ininterrompue du Service</li>
      </ul>
      <p>La responsabilité du Prestataire est limitée au montant total versé par le Client au cours des <strong>12 derniers mois</strong> précédant le fait générateur. Cette limitation ne s'applique pas en cas de faute lourde ou dolosive du Prestataire, ni aux cas où la loi interdit une telle limitation.</p>
      <p>Les dommages indirects (perte de chiffre d'affaires, perte de trafic, perte de données, atteinte à l'image) sont exclus de toute indemnisation, dans les limites autorisées par la loi.</p>

      <h2>8. Force majeure</h2>
      <p>Le Prestataire ne saurait être tenu responsable de l'inexécution de ses obligations en cas de force majeure telle que définie par l'article 1218 du Code civil, incluant notamment : catastrophe naturelle, pandémie, guerre, acte de terrorisme, défaillance de l'hébergeur, cyberattaque majeure, panne électrique généralisée, décision gouvernementale ou judiciaire.</p>

      <h2>9. Droit applicable et juridiction</h2>
      <p>Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable pendant <strong>30 jours</strong>. À défaut, tout litige sera soumis à la <strong>compétence exclusive des tribunaux de Créteil</strong>.</p>

      <h2>10. Divisibilité</h2>
      <p>Si une clause des présentes CGV est déclarée nulle ou inapplicable par une juridiction compétente, les autres clauses conservent leur plein effet.</p>

      <h2>11. Contact</h2>
      <p>Pour toute question relative aux présentes CGV : <a href="mailto:legal@seogard.io">legal@seogard.io</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCloudPrice, getCloudPricePerPage, getPriceExamples } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })
useHead({ title: 'Conditions Générales de Vente — Seogard' })
useSeoMeta({
  description: 'Conditions Générales de Vente de la plateforme Seogard Cloud — facturation à l\'usage, par page monitorée.',
  robots: 'noindex, follow',
})

const pricePerPage = formatCloudPrice()
const priceTTC = (getCloudPricePerPage() * 1.2).toFixed(4).replace('.', ',')

const rawExamples = getPriceExamples()
const priceExamples = rawExamples.map(ex => ({
  ...ex,
  priceTTC: (ex.pages * getCloudPricePerPage() * 1.2).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
}))
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>
