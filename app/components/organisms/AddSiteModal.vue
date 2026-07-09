<template>
  <AppModal v-model="model" :title="$t('dashboard.c.addSiteModal.title')" :close-on-backdrop="!loading">
    <form class="add-site-modal" @submit.prevent="handleSubmit">
      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <AppInput
        v-model="name"
        :label="$t('dashboard.c.addSiteModal.nameLabel')"
        :placeholder="$t('dashboard.c.addSiteModal.namePlaceholder')"
        :error="nameError"
      />

      <AppInput
        v-model="url"
        label="URL"
        placeholder="https://example.com"
        :error="urlError"
      />

      <label class="add-site-modal__confirm">
        <input v-model="confirmedOwnership" type="checkbox" class="add-site-modal__checkbox">
        <span>{{ $t('dashboard.c.addSiteModal.ownership') }}</span>
      </label>

      <div class="add-site-modal__actions">
        <AppButton variant="ghost" :disabled="loading" @click="model = false">
          {{ $t('dashboard.c.addSiteModal.cancel') }}
        </AppButton>
        <AppButton variant="accent" type="submit" :loading="loading" :disabled="!confirmedOwnership">
          {{ $t('dashboard.c.addSiteModal.submit') }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  success: [site: Site]
}>()

const model = defineModel<boolean>({ required: true })

const name = ref('')
const url = ref('')
const confirmedOwnership = ref(false)
const nameError = ref<string>()
const urlError = ref<string>()
const error = ref<string>()
const loading = ref(false)

const { createSite } = useSites()
const toast = useToast()
const router = useRouter()
const { t } = useI18n()
const apiError = useApiError()

function validate(): boolean {
  nameError.value = undefined
  urlError.value = undefined

  if (!name.value.trim()) {
    nameError.value = t('dashboard.c.addSiteModal.nameRequired')
  }

  if (!url.value.trim()) {
    urlError.value = t('dashboard.c.addSiteModal.urlRequired')
  }
  else if (!isValidUrl(url.value)) {
    urlError.value = t('dashboard.c.addSiteModal.urlInvalid')
  }

  return !nameError.value && !urlError.value
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  error.value = undefined

  try {
    const site = await createSite({
      name: name.value.trim(),
      url: url.value.trim(),
    })

    if (site) {
      name.value = ''
      url.value = ''
      confirmedOwnership.value = false
      model.value = false
      emit('success', site)
      toast.success(t('dashboard.c.addSiteModal.success'))
      await router.push(`/dashboard/sites/${site._id}`)
    }
  }
  catch (err: unknown) {
    const fetchError = err as { statusCode?: number; data?: { message?: string } }
    if (fetchError.statusCode === 409) {
      error.value = t('dashboard.c.addSiteModal.alreadyExists')
    }
    else {
      error.value = apiError(fetchError, t('dashboard.c.addSiteModal.genericError'))
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.add-site-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__confirm {
    display: flex;
    align-items: flex-start;
    gap: $spacing-2;
    font-size: $font-size-sm;
    color: $color-gray-600;
    cursor: pointer;
  }

  &__checkbox {
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: $color-accent;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-3;
    padding-top: $spacing-2;
  }
}
</style>
