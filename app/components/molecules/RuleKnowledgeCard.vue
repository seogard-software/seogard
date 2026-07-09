<template>
  <div class="rule-knowledge">
    <p class="rule-knowledge__block"><strong>{{ $t('dashboard.c.ruleKnowledge.constat') }}</strong> {{ knowledge.constat }}</p>
    <p class="rule-knowledge__block"><strong>{{ $t('dashboard.c.ruleKnowledge.pourquoi') }}</strong> {{ knowledge.pourquoi }}</p>
    <p class="rule-knowledge__block rule-knowledge__block--action"><strong>{{ $t('dashboard.c.ruleKnowledge.action') }}</strong> {{ knowledge.action }}</p>
    <p class="rule-knowledge__block rule-knowledge__block--gain"><strong>{{ $t('dashboard.c.ruleKnowledge.gain') }}</strong> {{ knowledge.gain }}</p>
  </div>
</template>

<script setup lang="ts">
import type { RuleKnowledge } from '~~/shared/utils/rule-knowledge'

defineProps<{ knowledge: RuleKnowledge }>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.rule-knowledge {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;

  &__block {
    font-size: $font-size-sm;
    color: $color-gray-500;
    line-height: $line-height-normal;

    strong {
      color: $color-gray-800;
      font-weight: $font-weight-semibold;
    }
  }

  &__block--action {
    padding: $spacing-2 $spacing-3;
    background: $color-info-bg;
    border-radius: $radius-md;
    color: $color-gray-700;
  }

  &__block--gain {
    color: $color-gray-600;

    strong {
      color: $color-success;
    }
  }
}
</style>
