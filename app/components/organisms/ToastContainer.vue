<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <AppToast
          v-for="toast in toasts"
          :key="toast.id"
          :toast="toast"
          @dismiss="store.remove(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const store = useToastStore()
const toasts = computed(() => store.toasts)
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
}

.toast-enter-active {
  transition: all $transition-slow;
}

.toast-leave-active {
  transition: all $transition-base;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform $transition-slow;
}
</style>
