<template>
  <AppModal v-model="model" :title="isEdit ? 'Modifier la zone' : 'Nouvelle zone'" :close-on-backdrop="!loading" @update:model-value="onModalChange">
    <form class="add-zone-modal" @submit.prevent="handleSubmit">
      <AppAlert v-if="error" variant="danger">{{ error }}</AppAlert>

      <AppInput
        v-model="name"
        label="Nom"
        placeholder="Ex : Blog, Colis, Produits..."
        :error="nameError"
      />

      <div class="add-zone-modal__patterns">
        <label class="add-zone-modal__label">Paths</label>
        <span class="add-zone-modal__hint">Commencez par <code>/</code> — ex : <code>/blog/**</code>, <code>/produits/*</code></span>
        <div
          v-for="(_, index) in patterns"
          :key="index"
          class="add-zone-modal__pattern-row"
        >
          <AppInput
            v-model="patterns[index]"
            :placeholder="index === 0 ? '/blog/**' : '/autre-path/**'"
            class="add-zone-modal__pattern-input"
            @update:model-value="debouncedPreview"
          />
          <button
            v-if="patterns.length > 1"
            type="button"
            class="add-zone-modal__pattern-remove"
            @click="removePattern(index)"
          >
            <AppIcon name="x" size="sm" />
          </button>
        </div>
        <button type="button" class="add-zone-modal__add-pattern" @click="addPattern">
          + Ajouter un path
        </button>
      </div>

      <!-- Preview -->
      <div v-if="previewLoading || previewCount !== null" class="add-zone-modal__preview">
        <div v-if="previewLoading" class="add-zone-modal__preview-loading">
          <AppSpinner size="sm" />
          <span>Calcul...</span>
        </div>
        <div v-else class="add-zone-modal__preview-result">
          {{ previewCount?.toLocaleString('fr-FR') ?? 0 }} pages matchées
        </div>
      </div>

      <div class="add-zone-modal__actions">
        <AppButton v-if="isEdit" variant="danger" :disabled="loading" :loading="deleting" @click="handleDelete">
          Supprimer
        </AppButton>
        <div class="add-zone-modal__actions-right">
          <AppButton variant="ghost" :disabled="loading" @click="model = false">
            Annuler
          </AppButton>
          <AppButton variant="accent" type="submit" :loading="loading">
            {{ isEdit ? 'Enregistrer' : 'Créer' }}
          </AppButton>
        </div>
      </div>
    </form>
  </AppModal>
</template>

<script setup lang="ts">
import type { Zone } from '~~/shared/types/zone'

const props = defineProps<{
  siteId: string
  zone?: Zone | null
}>()

const emit = defineEmits<{
  success: [zone: Zone]
  deleted: []
}>()

const model = defineModel<boolean>({ required: true })

const isEdit = computed(() => !!props.zone)

const name = ref('')
const patterns = ref<string[]>([''])
const nameError = ref<string>()
const error = ref<string>()
const loading = ref(false)
const previewLoading = ref(false)
const previewCount = ref<number | null>(null)

const orgStore = useOrganizationStore()
const toast = useToast()
const deleting = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | undefined

function resetForm() {
  name.value = ''
  patterns.value = ['']
  nameError.value = undefined
  error.value = undefined
  previewCount.value = null
  previewLoading.value = false
  if (debounceTimer) clearTimeout(debounceTimer)
}

function populateFromZone() {
  if (props.zone) {
    name.value = props.zone.name ?? ''
    patterns.value = props.zone.patterns.length > 0 ? [...props.zone.patterns] : ['']
  }
}

function onModalChange(open: boolean) {
  if (!open) resetForm()
}

defineExpose({ populateFromZone })

function debouncedPreview() {
  previewCount.value = null
  if (debounceTimer) clearTimeout(debounceTimer)

  const validPatterns = patterns.value.filter(p => p.trim().length >= 2 && p.startsWith('/'))
  if (validPatterns.length === 0) return

  debounceTimer = setTimeout(async () => {
    previewLoading.value = true
    try {
      const params = new URLSearchParams()
      for (const p of validPatterns) {
        params.append('patterns[]', p.trim())
      }
      const result = await $fetch<{ pageCount: number }>(`/api/sites/${props.siteId}/zones/preview?${params}`, {
        headers: { 'x-org-id': orgStore.activeOrgId! },
      })
      previewCount.value = result.pageCount
    }
    catch {
      previewCount.value = null
    }
    finally {
      previewLoading.value = false
    }
  }, 300)
}

function addPattern() {
  patterns.value.push('')
}

function removePattern(index: number) {
  patterns.value.splice(index, 1)
  debouncedPreview()
}

function validate(): boolean {
  nameError.value = undefined
  error.value = undefined

  if (!name.value.trim()) {
    nameError.value = 'Le nom est requis'
    return false
  }

  const validPatterns = patterns.value.filter(p => p.trim())
  if (validPatterns.length === 0) {
    error.value = 'Au moins un path est requis'
    return false
  }

  for (const p of validPatterns) {
    if (!p.startsWith('/') && p !== '**') {
      error.value = `Pattern invalide : "${p}". Doit commencer par /`
      return false
    }
  }

  return true
}

async function handleDelete() {
  if (!props.zone || !confirm('Supprimer cette zone ? Cette action est irréversible.')) return
  deleting.value = true
  try {
    await $fetch(`/api/sites/${props.siteId}/zones/${props.zone._id}` as string, {
      method: 'DELETE',
      headers: { 'x-org-id': orgStore.activeOrgId! },
    })
    toast.success('Zone supprimée')
    model.value = false
    emit('deleted')
  } catch (err: unknown) {
    error.value = (err as any)?.data?.message ?? 'Erreur lors de la suppression'
  } finally {
    deleting.value = false
  }
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  error.value = undefined

  const body = {
    name: name.value.trim(),
    patterns: patterns.value.filter(p => p.trim()).map(p => p.trim()),
  }

  try {
    let zone: Zone
    if (isEdit.value && props.zone) {
      zone = await $fetch<Zone>(`/api/sites/${props.siteId}/zones/${props.zone._id}`, {
        method: 'PATCH' as const,
        headers: { 'x-org-id': orgStore.activeOrgId! },
        body,
      })
      toast.success('Zone modifiée')
    }
    else {
      zone = await $fetch<Zone>(`/api/sites/${props.siteId}/zones`, {
        method: 'POST',
        headers: { 'x-org-id': orgStore.activeOrgId! },
        body,
      })
      toast.success('Zone créée')
    }

    model.value = false
    emit('success', zone)
  }
  catch (err: unknown) {
    const fetchError = err as { statusCode?: number; data?: { message?: string } }
    if (fetchError.statusCode === 409) {
      error.value = 'Une zone avec ce nom existe déjà'
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

.add-zone-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
    margin-bottom: $spacing-2;
  }

  &__hint {
    display: block;
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin-bottom: $spacing-1;

    code {
      background: $color-gray-100;
      padding: 1px 4px;
      border-radius: $radius-sm;
      font-family: $font-family-mono;
      font-size: $font-size-xs;
    }
  }

  &__patterns {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__pattern-row {
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__pattern-input {
    flex: 1;
  }

  &__pattern-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: $color-gray-400;
    cursor: pointer;
    border-radius: $radius-md;
    flex-shrink: 0;

    &:hover {
      color: $color-danger;
      background: $color-gray-100;
    }
  }

  &__add-pattern {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    padding: $spacing-1 $spacing-2;
    font-size: $font-size-sm;
    color: $color-gray-500;
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: $color-gray-800;
    }
  }

  &__preview {
    font-size: $font-size-sm;
    line-height: 1.5;
  }

  &__preview-loading {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    color: $color-gray-500;

    :deep(.app-spinner) {
      padding: 0;
    }
  }

  &__preview-result {
    color: $color-gray-600;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding-top: $spacing-2;
  }

  &__actions-right {
    display: flex;
    gap: $spacing-3;
    margin-left: auto;
  }
}
</style>
