<template>
  <div class="alerts-list">
    <div v-if="groups.length === 0" class="alerts-list__empty">
      <div class="alerts-list__empty-icon">
        <AppIcon name="shield-check" size="lg" />
      </div>
      <p class="alerts-list__empty-title">Tout est sous contrôle</p>
      <p class="alerts-list__empty-text">Aucune alerte détectée. Votre site est en bonne santé.</p>
    </div>
    <AlertGroupCard
      v-for="group in groups"
      :key="group.ruleId"
      :group="group"
      @resolve-all="$emit('resolve-all', $event)"
      @ignore-all="$emit('ignore-all', $event)"
      @resolve="$emit('resolve', $event)"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  groups: AlertGroup[]
}

defineProps<Props>()

defineEmits<{
  'resolve-all': [ruleId: string]
  'ignore-all': [ruleId: string]
  resolve: [id: string]
}>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;

  &__empty {
    text-align: center;
    padding: $spacing-12 $spacing-8;
  }

  &__empty-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto $spacing-4;
    border-radius: $radius-full;
    background-color: rgba($color-accent, 0.1);
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__empty-title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-700;
    margin-bottom: $spacing-1;
  }

  &__empty-text {
    font-size: $font-size-sm;
    color: $color-gray-400;
  }
}
</style>
