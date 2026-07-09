<template>
  <div class="zone-members">
    <div v-if="!canManage" class="zone-members__denied" data-testid="zone-denied">
      <AppIcon name="shield-check" size="sm" />
      <span>{{ $t('dashboard.members.denied') }}</span>
    </div>

    <template v-else>
      <DashboardHeader :title="$t('dashboard.members.title', { zone: zoneName })" :subtitle="$t('dashboard.members.subtitle')">
        <button class="zone-members__help-btn" @click="showPermissionsModal = true">
          <AppIcon name="help-circle" size="sm" />
        </button>
        <AppButton size="sm" @click="showInviteModal = true">{{ $t('dashboard.members.invite') }}</AppButton>
      </DashboardHeader>

      <AppCard :bordered="false" class="zone-members__card">
        <div v-if="loading" class="zone-members__loading">
          <AppSpinner />
        </div>

        <template v-else>
          <div v-for="member in members" :key="member._id" class="zone-members__item" data-testid="member-list">
            <div class="zone-members__avatar">
              {{ getMemberInitial(member) }}
            </div>
            <div class="zone-members__info">
              <span class="zone-members__name">{{ getMemberName(member) }}</span>
              <span class="zone-members__email">{{ member.user?.email ?? '' }}</span>
            </div>
            <span class="zone-members__org-role" :class="`zone-members__org-role--${member.orgRole}`">
              {{ $t(`dashboard.roles.${member.orgRole}`) }}
            </span>
            <template v-if="member.orgRole !== 'owner'">
              <select
                :value="member.zoneRole"
                class="zone-members__role-select"
                :disabled="cannotEditMember(member)"
                @change="handleRoleChange(member._id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="admin">{{ $t('dashboard.roles.admin') }}</option>
                <option value="member">{{ $t('dashboard.roles.member') }}</option>
                <option value="viewer">{{ $t('dashboard.roles.viewer') }}</option>
              </select>
            </template>
            <span v-else class="zone-members__owner-label">{{ $t('dashboard.members.ownerAccess') }}</span>
          </div>

          <!-- Pending invites -->
          <div v-if="invites.length > 0" class="zone-members__section">
            <span class="zone-members__section-title">{{ $t('dashboard.members.pendingInvites') }}</span>
            <div v-for="invite in invites" :key="invite._id" class="zone-members__item zone-members__item--pending">
              <div class="zone-members__avatar zone-members__avatar--pending">?</div>
              <div class="zone-members__info">
                <span class="zone-members__email">{{ invite.email }}</span>
              </div>
              <span class="zone-members__org-role">{{ $t(`dashboard.roles.${invite.role}`) }}</span>
            </div>
          </div>

          <div v-if="members.length === 0 && invites.length === 0" class="zone-members__empty">
            {{ $t('dashboard.members.empty') }}
          </div>
        </template>
      </AppCard>

      <!-- Invite modal -->
      <Teleport to="body">
        <div v-if="showInviteModal" class="zone-members__modal-overlay" @click.self="showInviteModal = false">
          <div class="zone-members__modal">
            <h2 class="zone-members__modal-title">{{ $t('dashboard.members.modalTitle') }}</h2>
            <p class="zone-members__modal-desc">{{ $t('dashboard.members.modalZone', { zone: zoneName }) }}</p>

            <!-- Existing org members -->
            <div v-if="available.length > 0" class="zone-members__modal-section">
              <span class="zone-members__modal-section-title">{{ $t('dashboard.members.orgMembers') }}</span>
              <div v-for="a in available" :key="a._id" class="zone-members__modal-available">
                <div class="zone-members__avatar zone-members__avatar--sm">
                  {{ (a.user?.name || a.user?.email || '?').charAt(0).toUpperCase() }}
                </div>
                <span class="zone-members__modal-available-email">{{ a.user?.name || a.user?.email }}</span>
                <select v-model="addRoles[a._id]" class="zone-members__role-select">
                  <option value="admin">{{ $t('dashboard.roles.admin') }}</option>
                  <option value="member">{{ $t('dashboard.roles.member') }}</option>
                  <option value="viewer">{{ $t('dashboard.roles.viewer') }}</option>
                </select>
                <AppButton size="sm" :loading="addingMemberId === a._id" @click="handleAddExisting(a._id, a.userId)">
                  {{ $t('dashboard.members.add') }}
                </AppButton>
              </div>
            </div>

            <!-- Invite by email -->
            <div class="zone-members__modal-section">
              <span class="zone-members__modal-section-title">{{ $t('dashboard.members.inviteByEmail') }}</span>
              <form @submit.prevent="handleInvite">
                <AppInput v-model="inviteEmail" label="" type="email" :placeholder="$t('dashboard.members.emailPlaceholder')" />
                <div class="zone-members__modal-field">
                  <label class="zone-members__modal-label">{{ $t('dashboard.members.roleLabel') }}</label>
                  <select v-model="inviteRole" class="zone-members__role-select zone-members__role-select--full">
                    <option value="admin">{{ $t('dashboard.roles.admin') }}</option>
                    <option value="member">{{ $t('dashboard.roles.member') }}</option>
                    <option value="viewer">{{ $t('dashboard.roles.viewer') }}</option>
                  </select>
                </div>
                <AppAlert v-if="inviteError" variant="danger">{{ inviteError }}</AppAlert>
                <AppButton type="submit" :loading="inviteLoading" size="md">{{ $t('dashboard.members.sendInvite') }}</AppButton>
              </form>
            </div>
          </div>
        </div>
      </Teleport>

      <PermissionsModal v-model="showPermissionsModal" />
    </template>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'default' })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const { t, locale } = useI18n()
const apiError = useApiError()
const siteId = computed(() => route.params.id as string)
const zoneId = computed(() => route.params.zoneId as string)
const toast = useToast()
const authStore = useAuthStore()

// Zone info from shared state
const { zones, hasMinZoneRole } = useZones()
const orgStore = useOrganizationStore()
const isOrgOwner = computed(() => orgStore.activeOrgRole === 'owner')
const canManage = computed(() => hasMinZoneRole(zoneId.value, 'admin'))
const zone = computed(() => zones.value.find(z => z._id === zoneId.value) ?? null)
const isDefaultZone = computed(() => zone.value?.isDefault ?? false)
const zoneName = computed(() => isDefaultZone.value ? t('dashboard.members.defaultZoneName') : (zone.value?.name ?? t('dashboard.members.zoneFallback')))

useHead({ title: computed(() => t('dashboard.members.tabTitle', { zone: zoneName.value })) })

interface ZoneMember {
  _id: string
  userId: string
  user: { _id: string; email: string; name: string | null; avatarUrl: string | null } | null
  orgRole: string
  zoneRole: string
}

interface OrgInvite {
  _id: string
  email: string
  role: string
}

interface AvailableMember {
  _id: string
  userId: string
  user: { _id: string; email: string; name: string | null } | null
}

const members = ref<ZoneMember[]>([])
const invites = ref<OrgInvite[]>([])
const available = ref<AvailableMember[]>([])
const loading = ref(false)
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('member')
const inviteLoading = ref(false)
const inviteError = ref('')
const addRoles = ref<Record<string, string>>({})
const addingMemberId = ref<string | null>(null)
const showPermissionsModal = ref(false)

function getMemberInitial(member: ZoneMember): string {
  const name = member.user?.name || member.user?.email || ''
  return name.charAt(0).toUpperCase() || '?'
}

function getMemberName(member: ZoneMember): string {
  return member.user?.name || member.user?.email || ''
}

const ROLE_LEVEL: Record<string, number> = { owner: 40, admin: 30, member: 20, viewer: 10 }

const myZoneRole = computed(() => {
  const z = zones.value.find(z => z._id === zoneId.value)
  return z?.userRole ?? null
})

function cannotEditMember(member: ZoneMember): boolean {
  if (isOrgOwner.value) return false
  if (member.userId === authStore.currentUser?._id) return true
  const myLevel = Math.max(
    ROLE_LEVEL[orgStore.activeOrgRole ?? ''] ?? 0,
    ROLE_LEVEL[myZoneRole.value ?? ''] ?? 0,
  )
  const targetLevel = Math.max(
    ROLE_LEVEL[member.orgRole] ?? 0,
    ROLE_LEVEL[member.zoneRole ?? ''] ?? 0,
  )
  return targetLevel >= myLevel
}

async function fetchMembers() {
  loading.value = true
  try {
    const data = await $fetch<{ members: ZoneMember[]; available: AvailableMember[]; invites: OrgInvite[] }>(
      `/api/sites/${siteId.value}/zones/${zoneId.value}/members`,
    )
    members.value = data.members
    invites.value = data.invites
    available.value = data.available
    // Default role for each available member
    for (const a of data.available) {
      if (!addRoles.value[a._id]) addRoles.value[a._id] = 'member'
    }
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(memberId: string, role: string) {
  try {
    await $fetch(`/api/sites/${siteId.value}/zones/${zoneId.value}/members`, {
      method: 'PUT',
      body: { memberId, role },
    })
    const member = members.value.find(m => m._id === memberId)
    if (member) member.zoneRole = role
    toast.success(t('dashboard.members.roleUpdated'))
  } catch {
    toast.error(t('dashboard.members.roleUpdateError'))
  }
}

async function handleAddExisting(memberId: string, _userId: string) {
  const role = addRoles.value[memberId] || 'member'
  addingMemberId.value = memberId
  try {
    await $fetch(`/api/sites/${siteId.value}/zones/${zoneId.value}/members`, {
      method: 'PUT',
      body: { memberId, role },
    })
    toast.success(t('dashboard.members.memberAdded'))
    await fetchMembers()
  } catch {
    toast.error(t('dashboard.members.addError'))
  } finally {
    addingMemberId.value = null
  }
}

async function handleInvite() {
  inviteError.value = ''
  if (!inviteEmail.value) return
  inviteLoading.value = true
  try {
    const result = await $fetch(`/api/sites/${siteId.value}/zones/${zoneId.value}/members/invite`, {
      method: 'POST',
      body: { email: inviteEmail.value, role: inviteRole.value, locale: locale.value },
    }) as any
    showInviteModal.value = false
    inviteEmail.value = ''
    inviteRole.value = 'member'
    toast.success(result.directAdd ? t('dashboard.members.memberAdded') : t('dashboard.members.inviteSent'))
    await fetchMembers()
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    inviteError.value = apiError(fetchError, t('dashboard.members.inviteError'))
  } finally {
    inviteLoading.value = false
  }
}

if (import.meta.client) {
  fetchMembers()
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.zone-members {
  &__denied {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-3;
    min-height: 300px;
    color: $color-gray-500;
    font-size: $font-size-sm;
  }

  &__help-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    background: none;
    color: $color-gray-400;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-600;
      border-color: $color-gray-300;
    }
  }

  &__card {
    padding: $spacing-4;
    max-width: 720px;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: $spacing-8;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3;
    border-radius: $radius-md;

    &:hover {
      background: $color-gray-50;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: $radius-full;
    background: $color-gray-200;
    color: $color-gray-800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
  }

  &__email {
    display: block;
    font-size: $font-size-xs;
    color: $color-gray-500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__org-role {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    padding: 2px $spacing-2;
    border-radius: $radius-sm;
    background: $color-gray-200;
    color: $color-gray-700;
    flex-shrink: 0;

    &--owner {
      background: rgba($color-warning, 0.15);
      color: $color-warning;
    }
  }

  &__role-select {
    font-size: $font-size-xs;
    padding: 2px $spacing-2;
    border: 1px solid $color-gray-200;
    border-radius: $radius-sm;
    background: $surface-card;
    color: $color-gray-700;
    flex-shrink: 0;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__owner-label {
    font-size: $font-size-xs;
    color: $color-gray-400;
    font-style: italic;
    flex-shrink: 0;
  }

  &__empty {
    padding: $spacing-6;
    text-align: center;
    color: $color-gray-400;
    font-size: $font-size-sm;
  }

  &__section {
    margin-top: $spacing-6;
  }

  &__section-title {
    display: block;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
    margin-bottom: $spacing-2;
    padding: 0 $spacing-3;
  }

  &__item--pending {
    opacity: 0.6;
  }

  &__avatar--pending {
    background: $color-gray-300;
  }

  /* ── Modal ── */
  &__modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  &__modal {
    background: $surface-card;
    border-radius: $radius-lg;
    padding: $spacing-6;
    width: 480px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;

    form {
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
      margin-top: $spacing-4;
    }
  }

  &__modal-section {
    margin-top: $spacing-5;
  }

  &__modal-section-title {
    display: block;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-3;
  }

  &__modal-available {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2;
    border-radius: $radius-md;

    &:hover {
      background: $color-gray-50;
    }
  }

  &__modal-available-email {
    flex: 1;
    font-size: $font-size-sm;
    color: $color-gray-700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__avatar--sm {
    width: 26px;
    height: 26px;
    font-size: 10px;
  }

  &__modal-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__modal-desc {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-top: $spacing-1;
  }

  &__modal-field {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__modal-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
  }

  &__role-select--full {
    width: 100%;
    padding: $spacing-2;
    font-size: $font-size-sm;
  }
}
</style>
