<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>Politique de cookies</h1>
      <p class="legal-page__updated">Dernière mise à jour : 18 mars 2026</p>

      <h2>1. Qu'est-ce qu'un cookie ?</h2>
      <p>Un cookie est un petit fichier texte stocké sur votre appareil lors de la visite d'un site web. Il permet au site de mémoriser vos actions et préférences pendant une durée déterminée.</p>

      <h2>2. Cookies utilisés par Seogard</h2>

      <h3>2.1 Cookies strictement nécessaires</h3>
      <p>Ces cookies sont indispensables au fonctionnement du Service. Ils ne nécessitent pas votre consentement.</p>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Finalité</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>seogard-token</code></td>
            <td>Authentification (JWT access token)</td>
            <td>7 jours</td>
          </tr>
          <tr>
            <td><code>seogard-refresh</code></td>
            <td>Renouvellement de session (refresh token)</td>
            <td>30 jours</td>
          </tr>
          <tr>
            <td><code>seogard-cookies</code></td>
            <td>Mémorisation de votre choix de cookies</td>
            <td>12 mois</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Cookies d'analyse</h3>
      <p>Nous utilisons <strong>Umami</strong>, une solution d'analyse web respectueuse de la vie privée, <strong>auto-hébergée sur notre propre serveur en Europe</strong> (Allemagne). Umami :</p>
      <ul>
        <li>Ne dépose <strong>aucun cookie tiers</strong></li>
        <li>Ne collecte <strong>aucune donnée personnelle identifiable</strong></li>
        <li>Ne partage aucune donnée avec des tiers</li>
        <li>Est conforme au RGPD sans nécessiter de consentement (données anonymisées)</li>
      </ul>

      <h2>3. Cookies tiers</h2>
      <p>Seogard <strong>n'utilise aucun cookie tiers</strong> (pas de Google Analytics, pas de Facebook Pixel, pas de cookie publicitaire). Nous n'avons aucune intégration avec des régies publicitaires.</p>

      <h2>4. Gestion des cookies</h2>
      <p>Vous pouvez à tout moment supprimer les cookies via les paramètres de votre navigateur. La suppression des cookies d'authentification entraînera une déconnexion du Service.</p>

      <h2>5. Contact</h2>
      <p>Pour toute question : <a href="mailto:dpo@seogard.io">dpo@seogard.io</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })
useHead({ title: 'Politique de cookies — Seogard' })
useSeoMeta({
  description: 'Politique de cookies de Seogard. Détail des cookies utilisés, aucun cookie tiers, analytics respectueux de la vie privée.',
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>
