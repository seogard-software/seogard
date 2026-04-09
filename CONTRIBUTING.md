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

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type: short description
```

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `docs` | Documentation only |
| `style` | CSS/formatting, no logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependencies, tooling |

Examples:
- `feat: add Jira notification support`
- `fix: crawl status showing failed instead of completed`
- `perf: reduce MongoDB document size from 26KB to 3KB`

## Pull Request Guidelines

- Fork the repo and branch from `main`.
- Write tests for new features and bug fixes.
- One feature or fix per PR.
- Clear description of what and why.
- Follow the commit convention above.

## Code Style

- **TypeScript** strict mode -- no untyped `any` without justification.
- **Vue SFC** with `<script setup lang="ts">` and `<style scoped lang="scss">`.
- **BEM** naming for CSS classes.
- **Atomic Design** for components: `app/components/atoms/`, `molecules/`, `organisms/`.
- No `console.log` or `debugger` in committed code.
- Use `import.meta.client` (never `process.client`) for client-side guards.

## Questions?

Open a discussion on GitHub or reach out at support@seogard.io.
