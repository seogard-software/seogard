<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>Mentions légales</h1>
      <p class="legal-page__updated">Dernière mise à jour : 18 mars 2026</p>

      <h2>1. Éditeur du site</h2>
      <p>
        <strong>SAVEPNP</strong> (nom commercial : Seogard)<br>
        Forme juridique : Société par actions simplifiée (SAS)<br>
        Capital social : 1 000 €<br>
        Immatriculation : RCS Créteil n° 912 784 030 — SIRET 912 784 030 00021<br>
        Code APE : 6201Z — Programmation informatique<br>
        Siège social : 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France<br>
        Numéro de TVA intracommunautaire : FR04912784030<br>
        Directeur de la publication : Aadil TTALBI<br>
        Email : <a href="mailto:legal@seogard.io">legal@seogard.io</a>
      </p>

      <h2>2. Hébergement</h2>
      <p>
        <strong>Application web :</strong> Railway Corporation — 548 Market Street, San Francisco, CA 94104, USA — <a href="https://railway.app" target="_blank" rel="noopener">railway.app</a><br>
        <strong>Serveurs de crawl :</strong> Hetzner Online GmbH — Industriestr. 25, 91710 Gunzenhausen, Allemagne — <a href="https://www.hetzner.com" target="_blank" rel="noopener">hetzner.com</a><br>
        <strong>Base de données :</strong> MongoDB, Inc. — 1633 Broadway, 38th Floor, New York, NY 10019, USA — <a href="https://www.mongodb.com" target="_blank" rel="noopener">mongodb.com</a> (données hébergées en UE)
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>L'ensemble du contenu du site seogard.io (textes, images, graphismes, logo, icônes, logiciels) est la propriété exclusive de SAVEPNP, sauf mention contraire. Le code source de la version self-hosted est distribué sous licence open-source.</p>

      <h2>4. Données personnelles</h2>
      <p>Consultez notre <NuxtLink to="/legal/privacy">Politique de confidentialité</NuxtLink> pour le détail du traitement de vos données personnelles.</p>

      <h2>5. Cookies</h2>
      <p>Consultez notre <NuxtLink to="/legal/cookies">Politique de cookies</NuxtLink>.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })
useHead({ title: 'Mentions légales — Seogard' })
useSeoMeta({
  description: 'Mentions légales du site seogard.io — éditeur, hébergement, propriété intellectuelle.',
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>
