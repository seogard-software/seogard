<template>
  <div class="app-input">
    <label v-if="label" :for="inputId" class="app-input__label">
      {{ label }}
    </label>
    <input
      :id="inputId"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${inputId}-error` : undefined"
      class="app-input__field"
      :class="{ 'app-input__field--error': error }"
    >
    <span v-if="error" :id="`${inputId}-error`" class="app-input__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  type: 'text',
  placeholder: undefined,
  disabled: false,
  error: undefined,
  id: undefined,
})

const model = defineModel<string>({ default: '' })
const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-input {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__field {
    padding: $spacing-3 $spacing-4;
    font-size: $font-size-base;
    background-color: $surface-card;
    color: $color-gray-900;
    border: 1px solid $color-gray-300;
    border-radius: $radius-lg;
    outline: none;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:focus {
      border-color: $color-accent;
      box-shadow: 0 0 0 3px rgba($color-accent, 0.12);
    }

    &--error {
      border-color: $color-danger;

      &:focus {
        border-color: $color-danger;
        box-shadow: 0 0 0 3px rgba($color-danger, 0.12);
      }
    }

    &:disabled {
      background-color: $surface-elevated;
      cursor: not-allowed;
    }
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-danger;
  }
}
</style>
