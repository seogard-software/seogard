<template>
  <div class="tree-toolbar">
    <div class="tree-toolbar__search">
      <AppIcon name="search" size="sm" class="tree-toolbar__search-icon" />
      <input
        :value="searchQuery"
        type="text"
        class="tree-toolbar__search-input"
        placeholder="Rechercher..."
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <div class="tree-toolbar__sort">
      <button class="tree-toolbar__sort-btn" @click="cycleSortKey">
        <AppIcon :name="sortDir === 'asc' ? 'sort-asc' : 'sort-desc'" size="sm" />
        <span>{{ sortLabel }}</span>
      </button>
      <button class="tree-toolbar__dir-btn" @click="toggleSortDir">
        <AppIcon :name="sortDir === 'asc' ? 'arrow-up' : 'arrow-down'" size="sm" />
      </button>
    </div>

    <span v-if="childrenCount > 0" class="tree-toolbar__count">
      {{ childrenCount }}<template v-if="totalCount > childrenCount"> / {{ totalCount }}</template> élément{{ (totalCount > 1 || childrenCount > 1) ? 's' : '' }}
    </span>
  </div>
</template>

<script setup lang="ts">
type SortKey = 'issues' | 'pages' | 'name'

interface Props {
  searchQuery: string
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  childrenCount: number
  totalCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:sortKey': [value: SortKey]
  'update:sortDir': [value: 'asc' | 'desc']
  'loadMore': []
}>()

const SORT_LABELS: Record<SortKey, string> = {
  issues: 'Problèmes',
  pages: 'Pages',
  name: 'Nom',
}

const SORT_KEYS: SortKey[] = ['issues', 'pages', 'name']

const sortLabel = computed(() => SORT_LABELS[props.sortKey])

const DEFAULT_DIR: Record<SortKey, 'asc' | 'desc'> = {
  issues: 'desc',
  pages: 'desc',
  name: 'asc',
}

function cycleSortKey() {
  const idx = SORT_KEYS.indexOf(props.sortKey)
  const next = SORT_KEYS[(idx + 1) % SORT_KEYS.length]!
  emit('update:sortKey', next)
  emit('update:sortDir', DEFAULT_DIR[next])
}

function toggleSortDir() {
  emit('update:sortDir', props.sortDir === 'asc' ? 'desc' : 'asc')
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  flex-wrap: wrap;

  &__search {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    padding: $spacing-1 $spacing-3;
    height: 34px;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:focus-within {
      border-color: $color-accent;
      box-shadow: 0 0 0 2px rgba($color-accent, 0.15);
    }
  }

  &__search-icon {
    color: $color-gray-400;
    flex-shrink: 0;
  }

  &__search-input {
    border: none;
    outline: none;
    background: none;
    font-size: $font-size-xs;
    color: $color-gray-800;
    flex: 1;
    min-width: 180px;

    &::placeholder {
      color: $color-gray-400;
    }
  }

  &__sort {
    display: flex;
    align-items: center;
    gap: 2px;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    padding: 2px;
    height: 34px;
  }

  &__sort-btn {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    padding: $spacing-1 $spacing-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
    background: none;
    border: none;
    border-radius: $radius-full;
    cursor: pointer;
    transition: all $transition-fast;
    white-space: nowrap;

    &:hover {
      background: $surface-elevated;
      color: $color-gray-800;
    }
  }

  &__dir-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: $radius-full;
    background: none;
    color: $color-gray-500;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $surface-elevated;
      color: $color-gray-800;
    }
  }

  &__count {
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin-left: auto;
  }
}
</style>
