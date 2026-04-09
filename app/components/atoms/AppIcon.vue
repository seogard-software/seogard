<template>
  <svg
    :class="['app-icon', `app-icon--${size}`]"
    :width="sizeMap[size]"
    :height="sizeMap[size]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :d="iconPath" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  name: IconName
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
})

const sizeMap = { sm: 16, md: 20, lg: 24 } as const

const { getIconPath } = useIcons()
const iconPath = computed(() => getIconPath(props.name))
</script>

<style scoped lang="scss">
.app-icon {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}
</style>
