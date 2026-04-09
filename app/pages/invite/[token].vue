<template>
  <div class="page-invite">
    <!-- Loading -->
    <div v-if="loading" class="page-invite__loading">
      Chargement de l'invitation...
    </div>

    <!-- Error: invalid/expired token -->
    <div v-else-if="error" class="page-invite__error">
      <h1>Invitation invalide</h1>
      <p>{{ error }}</p>
      <NuxtLink to="/login">Se connecter</NuxtLink>
    </div>

    <!-- Invite loaded -->
    <template v-else-if="invite">
      <!-- Case 1: Already logged in -->
      <div v-if="authStore.isAuthenticated" class="page-invite__content">
        <h1 class="page-invite__title">Rejoindre {{ invite.orgName }}</h1>
        <p class="page-invite__info">
          Vous avez été invité en tant que <strong>{{ roleLabel(invite.role) }}</strong>.
        </p>
        <AppButton :loading="accepting" size="lg" @click="handleAccept">
          Accepter l'invitation
        </AppButton>
      </div>

      <!-- Case 2: Account exists → auto-login -->
      <div v-else-if="invite.hasAccount" class="page-invite__content">
        <h1 class="page-invite__title">Rejoindre {{ invite.orgName }}</h1>
        <p class="page-invite__email">{{ invite.email }}</p>
        <p class="page-invite__info">
          Vous avez été invité en tant que <strong>{{ roleLabel(invite.role) }}</strong>.
        </p>
        <AppAlert v-if="acceptError" variant="danger">
          {{ acceptError }}
        </AppAlert>
        <AppButton :loading="accepting" size="lg" @click="handleAccept">
          Accepter et continuer
        </AppButton>
      </div>

      <!-- Case 3: No account → register -->
      <form v-else class="page-invite__content" @submit.prevent="handleAccept">
        <h1 class="page-invite__title">Créez votre compte</h1>
        <p class="page-invite__info">
          Pour rejoindre <strong>{{ invite.orgName }}</strong> en tant que <strong>{{ roleLabel(invite.role) }}</strong>.
        </p>
        <p class="page-invite__email">{{ invite.email }}</p>
        <AppInput
          v-model="password"
          label="Mot de passe"
          type="password"
          placeholder="Minimum 8 caractères"
          :error="errors.password"
        />
        <AppAlert v-if="acceptError" variant="danger">
          {{ acceptError }}
        </AppAlert>
        <AppButton type="submit" :loading="accepting" size="lg">
          Créer mon compte
        </AppButton>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false })
useHead({ title: 'Invitation' })

const route = useRoute()
const authStore = useAuthStore()

const token = computed(() => route.params.token as string)

const loading = ref(true)
const error = ref('')
const accepting = ref(false)
const acceptError = ref('')
const password = ref('')
const errors = ref<Record<string, string>>({})

interface InviteDetails {
  email: string
  orgName: string
  role: string
  hasAccount: boolean
}

const invite = ref<InviteDetails | null>(null)

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrateur',
    member: 'Membre',
    viewer: 'Lecteur',
  }
  return labels[role] ?? role
}

// Fetch invite details on mount
onMounted(async () => {
  try {
    const data = await $fetch<InviteDetails>(`/api/auth/invite/${token.value}`)
    invite.value = data
  } catch (err: unknown) {
    const fetchError = err as { statusCode?: number; data?: { message?: string } }
    if (fetchError.statusCode === 410) {
      error.value = 'Cette invitation a expiré. Demandez une nouvelle invitation.'
    } else {
      error.value = fetchError?.data?.message || 'Invitation non trouvée'
    }
  } finally {
    loading.value = false
  }
})

async function handleAccept() {
  acceptError.value = ''
  errors.value = {}

  // Validate password for new accounts
  if (invite.value && !invite.value.hasAccount && !authStore.isAuthenticated) {
    if (!password.value) {
      errors.value.password = 'Mot de passe requis'
      return
    }
    if (password.value.length < 8) {
      errors.value.password = 'Minimum 8 caractères'
      return
    }
  }

  accepting.value = true
  try {
    const body: { password?: string } = {}
    if (password.value) {
      body.password = password.value
    }

    const result = await $fetch<{ success: boolean; orgId?: string }>(`/api/auth/invite/${token.value}`, {
      method: 'POST',
      body,
    })

    // Refresh auth state (new cookies may have been set)
    await authStore.fetchMe()

    if (result.orgId) {
      const orgStore = useOrganizationStore()
      orgStore.setActiveOrg(result.orgId.toString())
    }

    const sitesStore = useSitesStore()
    const { resetZones } = useZones()
    sitesStore.setActiveSiteId(null)
    resetZones()
    await sitesStore.fetchSites()
    navigateTo('/dashboard/sites')
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    acceptError.value = fetchError?.data?.message || 'Erreur lors de l\'acceptation'
  } finally {
    accepting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-invite {
  text-align: center;
  padding: $spacing-8;

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-2;
  }

  &__info {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-bottom: $spacing-4;
    line-height: $line-height-normal;

    strong {
      color: $color-gray-800;
    }
  }

  &__email {
    font-size: $font-size-sm;
    color: $color-gray-600;
    padding: $spacing-2 $spacing-4;
    background: $color-gray-100;
    border-radius: $radius-md;
    display: inline-block;
    margin-bottom: $spacing-4;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-2;

    // Full width for form inputs and buttons
    .app-input,
    .app-button,
    .app-alert {
      width: 100%;
    }
  }

  &__loading {
    color: $color-gray-500;
    font-size: $font-size-sm;
  }

  &__error {
    h1 {
      font-size: $font-size-xl;
      color: $color-gray-900;
      margin-bottom: $spacing-2;
    }

    p {
      color: $color-gray-500;
      margin-bottom: $spacing-4;
    }
  }
}
</style>
