<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  auth: false,
  middleware: () => navigateTo('/docs/rules', { replace: true, redirectCode: 301 }),
})
</script>
