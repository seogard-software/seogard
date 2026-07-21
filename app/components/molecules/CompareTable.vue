<template>
  <div class="compare-table-wrap">
    <table class="compare-table">
      <thead>
        <tr>
          <th>{{ $t('compare.table.criteriaLabel') }}</th>
          <th>Oseox</th>
          <th class="compare-table__us">Seogard</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td class="compare-table__crit">{{ row.criteria }}</td>
          <td>{{ row.oseox }}</td>
          <td class="compare-table__us">{{ row.seogard }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// Tableau comparatif factuel, partagé par les 2 pages Oseox. Les lignes vivent dans compare.json
// (parité FR+EN). tm/rt : même pattern que legal/cookies.vue pour un tableau localisé.
const { tm, rt } = useI18n()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rows = computed(() => (tm('compare.table.rows') as any[]).map(r => ({
  criteria: rt(r.criteria),
  oseox: rt(r.oseox),
  seogard: rt(r.seogard),
})))
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.compare-table-wrap {
  overflow-x: auto;
  border: 1px solid $color-gray-200;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;
  min-width: 560px;

  th {
    text-align: left;
    padding: $spacing-3 $spacing-4;
    background: $color-gray-50;
    border-bottom: 1px solid $color-gray-200;
    font-weight: $font-weight-semibold;
    color: $color-gray-700;
  }

  td {
    padding: $spacing-3 $spacing-4;
    border-bottom: 1px solid $color-gray-100;
    color: $color-gray-600;
    vertical-align: top;
  }

  tr:last-child td { border-bottom: none; }

  &__crit { color: $color-gray-900; font-weight: $font-weight-medium; }

  &__us {
    background: rgba($color-info, 0.04);
    color: $color-gray-900;
    font-weight: $font-weight-medium;
  }
}
</style>
