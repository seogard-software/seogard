<template>
  <Teleport to="body">
    <Transition name="consent">
      <div v-if="visible" class="cookie-consent">
        <div class="cookie-consent__panel">
          <p class="cookie-consent__text">
            {{ $t('dashboard.c.cookieConsent.text') }}
          </p>
          <div class="cookie-consent__actions">
            <AppButton variant="ghost" size="sm" @click="refuse">
              {{ $t('dashboard.c.cookieConsent.refuse') }}
            </AppButton>
            <AppButton variant="accent" size="sm" @click="accept">
              {{ $t('dashboard.c.cookieConsent.accept') }}
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const CONSENT_COOKIE = 'cookie-consent'
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60 // 1 an

const consentCookie = useCookie(CONSENT_COOKIE, {
  maxAge: CONSENT_MAX_AGE,
  path: '/',
  sameSite: 'lax',
})

const visible = ref(false)

function accept() {
  consentCookie.value = 'accepted'
  visible.value = false
}

function refuse() {
  consentCookie.value = 'refused'
  visible.value = false
}

onMounted(() => {
  if (!consentCookie.value) {
    visible.value = true
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.cookie-consent {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  padding: $spacing-4;
  display: flex;
  justify-content: center;

  &__panel {
    background-color: $color-gray-900;
    color: $color-gray-200;
    border-radius: $radius-xl;
    padding: $spacing-4 $spacing-6;
    max-width: 640px;
    width: 100%;
    display: flex;
    align-items: center;
    gap: $spacing-6;
    box-shadow: $shadow-xl;
  }

  &__text {
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    flex: 1;
  }

  &__actions {
    display: flex;
    gap: $spacing-2;
    flex-shrink: 0;
  }
}

.consent-enter-active,
.consent-leave-active {
  transition: transform $transition-base, opacity $transition-base;
}

.consent-enter-from,
.consent-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
