<template>
  <AppModal v-model="model" title="Ajouter un site" :close-on-backdrop="!loading">
    <form class="add-site-modal" @submit.prevent="handleSubmit">
      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <AppInput
        v-model="name"
        label="Nom du site"
        placeholder="Mon site"
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
        <span>Je confirme être propriétaire de ce site ou disposer d'une autorisation explicite pour le crawler.</span>
      </label>

      <div class="add-site-modal__actions">
        <AppButton variant="ghost" :disabled="loading" @click="model = false">
          Annuler
        </AppButton>
        <AppButton variant="accent" type="submit" :loading="loading" :disabled="!confirmedOwnership">
          Ajouter
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

function validate(): boolean {
  nameError.value = undefined
  urlError.value = undefined

  if (!name.value.trim()) {
    nameError.value = 'Le nom est requis'
  }

  if (!url.value.trim()) {
    urlError.value = "L'URL est requise"
  }
  else if (!isValidUrl(url.value)) {
    urlError.value = "L'URL n'est pas valide"
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
      toast.success('Site ajouté avec succès')
      await router.push(`/dashboard/sites/${site._id}`)
    }
  }
  catch (err: unknown) {
    const fetchError = err as { statusCode?: number; data?: { message?: string } }
    if (fetchError.statusCode === 409) {
      error.value = 'Ce site existe déjà'
    }
    else {
      error.value = fetchError.data?.message ?? 'Une erreur est survenue'
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
