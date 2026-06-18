<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="model"
        class="app-modal"
        @mousedown.self="handleBackdropClick"
      >
        <div :class="['app-modal__panel', { 'app-modal__panel--wide': wide }]">
          <div class="app-modal__header">
            <h2 class="app-modal__title">{{ title }}</h2>
            <button class="app-modal__close" @click="close">
              <AppIcon name="x" size="sm" />
            </button>
          </div>

          <div class="app-modal__body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="app-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  title: string
  closeOnBackdrop?: boolean
  wide?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  closeOnBackdrop: true,
  wide: false,
})

const model = defineModel<boolean>({ required: true })
// `close` n'est émis QUE sur fermeture volontaire (backdrop / croix / Échap) — pas quand le parent
// met le v-model à false (navigation « se connecter », succès…). Permet de distinguer un abandon.
const emit = defineEmits<{ close: [] }>()

function close() {
  model.value = false
  emit('close')
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    close()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.closeOnBackdrop) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-modal {
  position: fixed;
  inset: 0;
  z-index: 1000; // au-dessus des headers fixes (landing/docs = 100)
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba($color-black, 0.5);
  padding: $spacing-4;

  &__panel {
    background-color: $surface-card;
    border-radius: $radius-xl;
    box-shadow: $shadow-xl;
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;

    &--wide {
      max-width: 760px;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-6 $spacing-6 0;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: $radius-lg;
    color: $color-gray-400;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background-color: $color-gray-100;
      color: $color-gray-600;
    }
  }

  &__body {
    padding: $spacing-6;
  }

  &__footer {
    padding: 0 $spacing-6 $spacing-6;
    display: flex;
    justify-content: flex-end;
    gap: $spacing-3;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity $transition-base;

  .app-modal__panel {
    transition: transform $transition-base;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .app-modal__panel {
    transform: scale(0.95) translateY(8px);
  }
}
</style>
