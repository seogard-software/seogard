# Contributing to SEOGARD

Thanks for your interest in contributing to SEOGARD!

## Getting Started

1. Follow the [self-hosted guide](https://seogard.io/docs/self-hosted) to set up MongoDB, Redis and the crawler via Docker Compose.

2. For local development with hot-reload:
   ```bash
   yarn install
   cp .env.example .env   # fill in required values (use local MongoDB/Redis from Docker)
   yarn dev               # starts Nuxt dev server with hot-reload
   ```

## Before Submitting

```bash
yarn test && yarn test:e2e && yarn lint && yarn typecheck
```

If all green, you're good to go.

## Pull Request Guidelines

- Branch from `main`.
- Write tests for new features and bug fixes.
- One feature or fix per PR.
- Clear description of what and why.

## Code Style

- **TypeScript** strict mode -- no untyped `any` without justification.
- **Vue SFC** with `<script setup lang="ts">` and `<style scoped lang="scss">`.
- **BEM** naming for CSS classes.
- **Atomic Design** for components: `app/components/atoms/`, `molecules/`, `organisms/`.
- No `console.log` or `debugger` in committed code.
- Use `import.meta.client` (never `process.client`) for client-side guards.

## Questions?

Open a discussion on GitHub or reach out at support@seogard.io.
