<template>
  <AppModal v-model="model" title="Rôles & permissions">
    <div class="permissions-modal">
      <p class="permissions-modal__intro">
        Les permissions sont gérées à deux niveaux : <strong>organisation</strong> et <strong>zone</strong>.
      </p>

      <!-- Org roles -->
      <div class="permissions-modal__section">
        <h3 class="permissions-modal__section-title">Organisation</h3>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--owner">owner</span>
          <span class="permissions-modal__desc">Accès total. Gère l'organisation, la facturation, les sites et toutes les zones.</span>
        </div>
      </div>

      <!-- Zone roles -->
      <div class="permissions-modal__section">
        <h3 class="permissions-modal__section-title">Site & Zone</h3>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--admin">admin</span>
          <span class="permissions-modal__desc">Gère la zone : modifier, supprimer, inviter des membres, configurer le webhook, lancer des crawls, désactiver des règles d'alertes.</span>
        </div>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--member">member</span>
          <span class="permissions-modal__desc">Peut lancer des crawls, consulter et résoudre les alertes.</span>
        </div>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--viewer">viewer</span>
          <span class="permissions-modal__desc">Lecture seule. Voit les pages et alertes sans pouvoir agir.</span>
        </div>
      </div>

      <!-- Permissions table -->
      <div class="permissions-modal__section">
        <h3 class="permissions-modal__section-title">Matrice</h3>
        <div class="permissions-modal__table-wrap">
          <table class="permissions-modal__table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Owner</th>
                <th>Admin</th>
                <th>Member</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in matrixRows" :key="row.action">
                <td class="permissions-modal__action">{{ row.action }}</td>
                <td v-for="(val, idx) in row.roles" :key="idx" class="permissions-modal__cell">
                  <span v-if="val" class="permissions-modal__check">
                    <AppIcon name="check" size="sm" />
                  </span>
                  <span v-else class="permissions-modal__no">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="permissions-modal__note">
        Un owner d'organisation a automatiquement tous les droits sur toutes les zones.
      </p>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ required: true })

const matrixRows = [
  { action: 'Voir pages / alertes', roles: [true, true, true, true] },
  { action: 'Lancer un crawl', roles: [true, true, true, false] },
  { action: 'Résoudre des alertes', roles: [true, true, true, false] },
  { action: 'Désactiver / réactiver une règle', roles: [true, true, false, false] },
  { action: 'Configurer webhook / clé API', roles: [true, true, false, false] },
  { action: 'Inviter un membre', roles: [true, true, false, false] },
  { action: 'Gérer les rôles', roles: [true, true, false, false] },
  { action: 'Modifier la zone', roles: [true, true, false, false] },
  { action: 'Supprimer la zone', roles: [true, true, false, false] },
  { action: 'Créer une zone', roles: [true, true, false, false] },
  { action: 'Créer / supprimer un site', roles: [true, false, false, false] },
  { action: 'Paramètres organisation', roles: [true, false, false, false] },
]
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.permissions-modal {
  &__intro {
    font-size: $font-size-sm;
    color: $color-gray-600;
    margin-bottom: $spacing-5;
    line-height: $line-height-normal;

    strong {
      color: $color-gray-800;
    }
  }

  &__section {
    margin-bottom: $spacing-5;
  }

  &__section-title {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-3;
  }

  &__role {
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
    padding: $spacing-2 0;

    &:not(:last-child) {
      border-bottom: 1px solid $color-gray-100;
    }
  }

  &__badge {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    padding: 2px $spacing-2;
    border-radius: $radius-sm;
    background: $color-gray-200;
    color: $color-gray-700;
    flex-shrink: 0;
    min-width: 56px;
    text-align: center;

    &--owner {
      background: rgba($color-warning, 0.15);
      color: $color-warning;
    }

    &--admin {
      background: rgba($color-info, 0.12);
      color: $color-info;
    }

    &--member {
      background: rgba($color-success, 0.12);
      color: $color-success;
    }

    &--viewer {
      background: $color-gray-100;
      color: $color-gray-500;
    }
  }

  &__desc {
    font-size: $font-size-xs;
    color: $color-gray-600;
    line-height: $line-height-normal;
  }

  &__table-wrap {
    overflow-x: auto;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-xs;

    th,
    td {
      padding: $spacing-2 $spacing-3;
      text-align: center;
      border-bottom: 1px solid $color-gray-100;
    }

    th {
      font-weight: $font-weight-semibold;
      color: $color-gray-600;
      background: $color-gray-50;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__action {
    text-align: left !important;
    color: $color-gray-700;
    font-weight: $font-weight-medium;
    white-space: nowrap;
  }

  &__cell {
    width: 60px;
  }

  &__check {
    color: $color-success;
  }

  &__no {
    color: $color-gray-300;
  }

  &__note {
    font-size: $font-size-xs;
    color: $color-gray-400;
    font-style: italic;
    margin: 0;
  }
}
</style>
