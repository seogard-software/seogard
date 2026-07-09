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
      <span
        class="nav-dropdown__caret"
        :class="{ 'nav-dropdown__caret--open': open }"
        aria-hidden="true"
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
        <span v-if="item.emoji" class="nav-dropdown__item-ic" aria-hidden="true">{{ item.emoji }}</span>
        <span class="nav-dropdown__item-body">
          <span class="nav-dropdown__item-label">{{ item.label }}</span>
          <span v-if="item.desc" class="nav-dropdown__item-desc">{{ item.desc }}</span>
        </span>
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
  emoji?: string
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

  // Triangle plein (▾), pas un chevron en trait — fidèle à la maquette validée.
  &__caret {
    width: 0;
    height: 0;
    margin-left: $spacing-1;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid $color-gray-400;
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
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-radius: $radius-md;
    text-decoration: none;
    transition: background $transition-fast;

    &:hover {
      background: $color-gray-50;
      text-decoration: none;
    }
  }

  &__item-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: $radius-md;
    background: $color-gray-100;
    font-size: 18px;
    line-height: 1;
  }

  &__item-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
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
