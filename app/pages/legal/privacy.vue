<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>Politique de confidentialité</h1>
      <p class="legal-page__updated">Dernière mise à jour : 18 mars 2026</p>

      <p>SAVEPNP, SAS immatriculée au RCS de Créteil sous le n° 912 784 030, dont le siège social est situé 25 rue Camille Blanc, 94400 Vitry-sur-Seine (ci-après « nous », « notre »), éditrice de la plateforme Seogard, s'engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée.</p>

      <h2>1. Responsable du traitement</h2>
      <p><strong>SAVEPNP</strong> (nom commercial : Seogard)<br>
      25 rue Camille Blanc, 94400 Vitry-sur-Seine, France<br>
      RCS Créteil 912 784 030 — SIRET 912 784 030 00021<br>
      Email : <a href="mailto:dpo@seogard.io">dpo@seogard.io</a></p>

      <h2>2. Données collectées</h2>

      <h3>2.1 Données d'inscription</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>Donnée</th>
            <th>Finalité</th>
            <th>Base légale</th>
            <th>Durée de conservation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Adresse email</td>
            <td>Authentification, communication, alertes</td>
            <td>Exécution du contrat</td>
            <td>Durée du compte + 3 ans</td>
          </tr>
          <tr>
            <td>Mot de passe (hashé bcrypt)</td>
            <td>Authentification</td>
            <td>Exécution du contrat</td>
            <td>Durée du compte</td>
          </tr>
          <tr>
            <td>Nom de l'organisation</td>
            <td>Identification du compte</td>
            <td>Exécution du contrat</td>
            <td>Durée du compte + 3 ans</td>
          </tr>
          <tr>
            <td>Acceptation des CGU/CGV (date + version)</td>
            <td>Preuve du consentement contractuel</td>
            <td>Obligation légale</td>
            <td>5 ans après la fin du contrat</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Données de facturation</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>Donnée</th>
            <th>Finalité</th>
            <th>Base légale</th>
            <th>Durée de conservation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Identifiant client Stripe</td>
            <td>Facturation et paiement</td>
            <td>Exécution du contrat</td>
            <td>Durée du contrat + 10 ans (obligation comptable)</td>
          </tr>
          <tr>
            <td>Historique des factures</td>
            <td>Facturation, comptabilité</td>
            <td>Obligation légale</td>
            <td>10 ans</td>
          </tr>
        </tbody>
      </table>
      <p><strong>Note :</strong> les données bancaires (numéro de carte, CVV) ne sont jamais stockées sur nos serveurs. Elles sont traitées exclusivement par Stripe (certifié PCI-DSS niveau 1).</p>

      <h3>2.3 Données techniques de crawl</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>Donnée</th>
            <th>Finalité</th>
            <th>Base légale</th>
            <th>Durée de conservation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>URLs des pages crawlées</td>
            <td>Monitoring SEO</td>
            <td>Exécution du contrat</td>
            <td>Durée du compte</td>
          </tr>
          <tr>
            <td>Snapshots HTML (SSR/CSR)</td>
            <td>Détection de régressions</td>
            <td>Exécution du contrat</td>
            <td>12 mois glissants</td>
          </tr>
          <tr>
            <td>Alertes et historique</td>
            <td>Suivi des régressions</td>
            <td>Exécution du contrat</td>
            <td>12 mois glissants</td>
          </tr>
        </tbody>
      </table>

      <h3>2.4 Données de navigation</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>Donnée</th>
            <th>Finalité</th>
            <th>Base légale</th>
            <th>Durée de conservation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cookies d'authentification (JWT)</td>
            <td>Maintien de la session</td>
            <td>Exécution du contrat</td>
            <td>7 jours (access) / 30 jours (refresh)</td>
          </tr>
          <tr>
            <td>Données d'analyse (Umami)</td>
            <td>Statistiques d'usage anonymes</td>
            <td>Intérêt légitime</td>
            <td>24 mois</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Sous-traitants</h2>
      <p>Nous faisons appel aux sous-traitants suivants, tous conformes au RGPD :</p>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>Sous-traitant</th>
            <th>Finalité</th>
            <th>Localisation des données</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>MongoDB Atlas</td>
            <td>Base de données</td>
            <td>UE (Irlande / Belgique)</td>
          </tr>
          <tr>
            <td>Hetzner</td>
            <td>Serveurs de crawl</td>
            <td>UE (Allemagne / Finlande)</td>
          </tr>
          <tr>
            <td>Railway</td>
            <td>Hébergement application</td>
            <td>UE / US</td>
          </tr>
          <tr>
            <td>Stripe</td>
            <td>Paiement et facturation</td>
            <td>UE / US (PCI-DSS)</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Envoi d'emails transactionnels</td>
            <td>US</td>
          </tr>
          <tr>
            <td>Umami</td>
            <td>Analytics (self-hosted, sans cookies tiers)</td>
            <td>UE (Allemagne — notre VPS)</td>
          </tr>
        </tbody>
      </table>
      <p>Pour les transferts hors UE, des Clauses Contractuelles Types (CCT) de la Commission européenne sont en place.</p>

      <h2>4. Droits des utilisateurs</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d'accès</strong> (art. 15) : obtenir une copie de vos données personnelles</li>
        <li><strong>Droit de rectification</strong> (art. 16) : corriger des données inexactes</li>
        <li><strong>Droit à l'effacement</strong> (art. 17) : demander la suppression de vos données</li>
        <li><strong>Droit à la portabilité</strong> (art. 20) : recevoir vos données dans un format structuré</li>
        <li><strong>Droit à la limitation du traitement</strong> (art. 18) : restreindre l'utilisation de vos données</li>
        <li><strong>Droit d'opposition</strong> (art. 21) : vous opposer au traitement de vos données</li>
      </ul>
      <p>Pour exercer vos droits, contactez-nous à : <a href="mailto:dpo@seogard.io">dpo@seogard.io</a>. Nous répondrons dans un délai maximum de <strong>30 jours</strong>.</p>
      <p>En cas de désaccord, vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a></p>

      <h2>5. Sécurité</h2>
      <p>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
      <ul>
        <li>Chiffrement HTTPS (TLS 1.3) pour toutes les communications</li>
        <li>Hashage des mots de passe avec bcrypt (facteur de coût 12)</li>
        <li>Tokens JWT signés avec rotation automatique</li>
        <li>Accès à la base de données restreint par IP et authentification</li>
        <li>Journalisation des accès et des événements de sécurité</li>
        <li>Sauvegardes automatiques quotidiennes</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>Consultez notre <NuxtLink to="/legal/cookies">Politique de cookies</NuxtLink> pour le détail des cookies utilisés.</p>

      <h2>7. Modifications</h2>
      <p>Nous pouvons modifier cette politique à tout moment. Les utilisateurs seront informés par email de toute modification substantielle. La version en vigueur est toujours accessible sur cette page.</p>

      <h2>8. Contact</h2>
      <p>Délégué à la Protection des Données : <a href="mailto:dpo@seogard.io">dpo@seogard.io</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })
useHead({ title: 'Politique de confidentialité — Seogard' })
useSeoMeta({
  description: 'Politique de confidentialité et RGPD de Seogard. Données collectées, finalités, droits des utilisateurs, sous-traitants.',
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>
