<template>
  <div ref="root" class="nav-dropdown">
    <button
      type="button"
      class="nav-dropdown__trigger"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      {{ label }}
      <AppIcon
        name="chevron-down"
        size="sm"
        :class="['nav-dropdown__chevron', { 'nav-dropdown__chevron--open': open }]"
      />
    </button>

    <div v-if="open" class="nav-dropdown__panel" role="menu">
      <NuxtLink
        v-for="item in items"
        :key="item.name"
        :to="localePath({ name: item.name })"
        class="nav-dropdown__item"
        role="menuitem"
        @click="close"
      >
        <span class="nav-dropdown__item-label">{{ item.label }}</span>
        <span v-if="item.desc" class="nav-dropdown__item-desc">{{ item.desc }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
interface NavDropdownItem {
  name: string
  label: string
  desc?: string
}

defineProps<{ label: string, items: NavDropdownItem[] }>()
const emit = defineEmits<{ navigate: [] }>()

const root = ref<HTMLElement | null>(null)
const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
  emit('navigate')
}

function onDocClick(event: MouseEvent) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.nav-dropdown {
  position: relative;

  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: $spacing-1;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: $color-gray-600;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    font-family: inherit;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-900;
    }
  }

  &__chevron {
    transition: transform $transition-fast;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__panel {
    position: absolute;
    top: calc(100% + #{$spacing-3});
    left: 50%;
    transform: translateX(-50%);
    min-width: 240px;
    padding: $spacing-2;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-xl;
    box-shadow: $shadow-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    z-index: 50;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: $spacing-3 $spacing-4;
    border-radius: $radius-md;
    text-decoration: none;
    transition: background $transition-fast;

    &:hover {
      background: $color-gray-50;
      text-decoration: none;
    }
  }

  &__item-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__item-desc {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }
}
</style>
