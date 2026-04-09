<template>
  <div class="layout-auth">
    <div class="layout-auth__brand">
      <div class="layout-auth__brand-content">
        <NuxtLink to="/" class="layout-auth__logo-link">
          <AppLogo size="lg" />
        </NuxtLink>
        <p class="layout-auth__tagline">
          Votre gardien SEO technique.<br>
          Détecte les régressions avant qu'elles ne coûtent cher.
        </p>
      </div>
      <div class="layout-auth__arcs">
        <div class="layout-auth__arc layout-auth__arc--1" />
        <div class="layout-auth__arc layout-auth__arc--2" />
        <div class="layout-auth__arc layout-auth__arc--3" />
      </div>
    </div>
    <div class="layout-auth__form">
      <div class="layout-auth__form-inner">
        <slot />
      </div>
    </div>
    <CookieBanner />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.layout-auth {
  display: flex;
  min-height: 100vh;

  &__brand {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 45%;
    background: $color-gray-50;
    overflow: hidden;
  }

  &__brand-content {
    position: relative;
    z-index: 1;
    padding: $spacing-10;
  }

  &__logo-link {
    text-decoration: none;
  }

  &__tagline {
    margin-top: $spacing-6;
    font-size: $font-size-lg;
    color: $color-gray-500;
    line-height: $line-height-normal;
    max-width: 340px;
  }

  &__arcs {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &__arc {
    position: absolute;
    border-radius: $radius-full;
    border: 1px solid $color-gray-200;

    &--1 {
      width: 200px;
      height: 200px;
    }

    &--2 {
      width: 360px;
      height: 360px;
    }

    &--3 {
      width: 520px;
      height: 520px;
    }
  }

  &__form {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $surface-card;
    padding: $spacing-8;
  }

  &__form-inner {
    width: 100%;
    max-width: 420px;
  }

  @media (max-width: $breakpoint-md) {
    flex-direction: column;

    &__brand {
      width: 100%;
      padding: $spacing-10 $spacing-6;
      min-height: auto;
    }

    &__brand-content {
      padding: 0;
      text-align: center;
    }

    &__tagline {
      margin-left: auto;
      margin-right: auto;
    }

    &__arcs {
      display: none;
    }

    &__form {
      padding: $spacing-8 $spacing-6;
    }
  }
}
</style>
