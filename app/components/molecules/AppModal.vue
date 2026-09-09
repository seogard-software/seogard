<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="model"
        class="app-modal"
        @mousedown.self="handleBackdropClick"
      >
        <div ref="panel" :class="['app-modal__panel', { 'app-modal__panel--wide': wide }]" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
          <div class="app-modal__header">
            <h2 :id="titleId" class="app-modal__title">{{ title }}</h2>
            <button type="button" class="app-modal__close" :aria-label="$t('common.aria.close')" @click="close">
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

<script lang="ts">
// Only the last opened dialog handles focus and keys, including nested dialogs.
const activeDialogs: HTMLElement[] = []
</script>

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
const titleId = useId()
const panel = ref<HTMLElement | null>(null)
let registeredPanel: HTMLElement | null = null
let previousFocus: HTMLElement | null = null

function focusableElements(): HTMLElement[] {
  return Array.from(panel.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]') ?? [])
    .filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.closest('[inert]'))
}

function releaseFocus() {
  if (!registeredPanel) return
  const wasTop = activeDialogs.at(-1) === registeredPanel
  const index = activeDialogs.indexOf(registeredPanel)
  if (index !== -1) activeDialogs.splice(index, 1)
  registeredPanel = null
  if (wasTop && previousFocus?.isConnected) previousFocus.focus()
  previousFocus = null
}

watch(model, async (isOpen) => {
  if (!import.meta.client) return
  if (!isOpen) {
    releaseFocus()
    return
  }
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  if (!model.value || !panel.value) return
  registeredPanel = panel.value
  activeDialogs.push(registeredPanel)
  ;(focusableElements()[0] ?? registeredPanel).focus()
}, { flush: 'post', immediate: true })

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
  if (!model.value || activeDialogs.at(-1) !== panel.value || e.defaultPrevented) return
  if (e.key === 'Escape' && props.closeOnBackdrop) {
    e.preventDefault()
    close()
  }
  if (e.key === 'Tab') {
    const elements = focusableElements()
    const first = elements[0]
    const last = elements.at(-1)
    if (!first || !last) {
      e.preventDefault()
      panel.value?.focus()
    }
    else if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
      e.preventDefault()
      last.focus()
    }
    else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

function handleFocusIn(e: FocusEvent) {
  if (!model.value || activeDialogs.at(-1) !== panel.value || panel.value?.contains(e.target as Node)) return
  ;(focusableElements()[0] ?? panel.value)?.focus()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('focusin', handleFocusIn)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('focusin', handleFocusIn)
  releaseFocus()
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
