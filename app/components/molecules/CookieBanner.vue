<template>
  <Transition name="cookie-banner">
    <div v-if="visible" class="cookie-banner">
      <div class="cookie-banner__inner">
        <p class="cookie-banner__text">
          Ce site utilise uniquement des cookies essentiels à son fonctionnement (authentification).
          Aucun cookie publicitaire ni tracker tiers.
          <NuxtLink to="/legal/cookies">En savoir plus</NuxtLink>
        </p>
        <button class="cookie-banner__btn" @click="accept">Compris</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const COOKIE_KEY = 'seogard-cookies'
const visible = ref(false)

onMounted(() => {
  if (!localStorage.getItem(COOKIE_KEY)) {
    visible.value = true
  }
})

function accept() {
  localStorage.setItem(COOKIE_KEY, '1')
  visible.value = false
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: $spacing-3 $spacing-4;
  background: $color-white;
  border-top: 1px solid $color-gray-200;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  &__inner {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-4;
  }

  &__text {
    font-size: $font-size-xs;
    color: $color-gray-500;
    margin: 0;
    line-height: $line-height-normal;

    a {
      color: $color-accent;
      text-decoration: underline;
    }
  }

  &__btn {
    flex-shrink: 0;
    padding: $spacing-2 $spacing-5;
    background: $color-accent;
    color: $color-white;
    border: none;
    border-radius: $radius-md;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-accent-light;
    }
  }
}

.cookie-banner-enter-active,
.cookie-banner-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.cookie-banner-enter-from,
.cookie-banner-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
