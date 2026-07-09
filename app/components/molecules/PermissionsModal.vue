<template>
  <AppModal v-model="model" :title="$t('dashboard.c.permissionsModal.title')">
    <div class="permissions-modal">
      <i18n-t keypath="dashboard.c.permissionsModal.intro" tag="p" class="permissions-modal__intro">
        <template #org><strong>{{ $t('dashboard.c.permissionsModal.introOrg') }}</strong></template>
        <template #zone><strong>{{ $t('dashboard.c.permissionsModal.introZone') }}</strong></template>
      </i18n-t>

      <!-- Org roles -->
      <div class="permissions-modal__section">
        <h3 class="permissions-modal__section-title">{{ $t('dashboard.c.permissionsModal.orgSection') }}</h3>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--owner">{{ $t('dashboard.roles.owner') }}</span>
          <span class="permissions-modal__desc">{{ $t('dashboard.c.permissionsModal.ownerDesc') }}</span>
        </div>
      </div>

      <!-- Zone roles -->
      <div class="permissions-modal__section">
        <h3 class="permissions-modal__section-title">{{ $t('dashboard.c.permissionsModal.zoneSection') }}</h3>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--admin">{{ $t('dashboard.roles.admin') }}</span>
          <span class="permissions-modal__desc">{{ $t('dashboard.c.permissionsModal.adminDesc') }}</span>
        </div>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--member">{{ $t('dashboard.roles.member') }}</span>
          <span class="permissions-modal__desc">{{ $t('dashboard.c.permissionsModal.memberDesc') }}</span>
        </div>
        <div class="permissions-modal__role">
          <span class="permissions-modal__badge permissions-modal__badge--viewer">{{ $t('dashboard.roles.viewer') }}</span>
          <span class="permissions-modal__desc">{{ $t('dashboard.c.permissionsModal.viewerDesc') }}</span>
        </div>
      </div>

      <!-- Permissions table -->
      <div class="permissions-modal__section">
        <h3 class="permissions-modal__section-title">{{ $t('dashboard.c.permissionsModal.matrixSection') }}</h3>
        <div class="permissions-modal__table-wrap">
          <table class="permissions-modal__table">
            <thead>
              <tr>
                <th>{{ $t('dashboard.c.permissionsModal.colAction') }}</th>
                <th>{{ $t('dashboard.roles.owner') }}</th>
                <th>{{ $t('dashboard.roles.admin') }}</th>
                <th>{{ $t('dashboard.roles.member') }}</th>
                <th>{{ $t('dashboard.roles.viewer') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in matrixRows" :key="row.actionKey">
                <td class="permissions-modal__action">{{ $t(row.actionKey) }}</td>
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
        {{ $t('dashboard.c.permissionsModal.note') }}
      </p>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ required: true })

const matrixRows = [
  { actionKey: 'dashboard.c.permissionsModal.rows.viewPagesAlerts', roles: [true, true, true, true] },
  { actionKey: 'dashboard.c.permissionsModal.rows.viewReport', roles: [true, true, true, true] },
  { actionKey: 'dashboard.c.permissionsModal.rows.runCrawl', roles: [true, true, true, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.resolveAlerts', roles: [true, true, true, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.toggleRule', roles: [true, true, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.configureWebhook', roles: [true, true, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.inviteMember', roles: [true, true, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.manageRoles', roles: [true, true, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.editZone', roles: [true, true, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.deleteZone', roles: [true, true, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.createZone', roles: [true, true, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.createDeleteSite', roles: [true, false, false, false] },
  { actionKey: 'dashboard.c.permissionsModal.rows.orgSettings', roles: [true, false, false, false] },
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
