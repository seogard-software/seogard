import { resolve } from 'node:path'
import { scanTasks } from 'nitropack/core'
import type { Nitro } from 'nitropack'
import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

it('relie chaque tâche programmée à un handler découvert par Nitro', async () => {
  vi.stubGlobal('defineNuxtConfig', <T>(config: T) => config)
  const { default: config } = await import('../../nuxt.config')
  // Le vrai scanner Nitro déduit le nom du chemin, pas de meta.name.
  const discovered = await scanTasks({
    options: { scanDirs: [resolve('server')], ignore: [] },
    logger: { warn: vi.fn() },
  } as unknown as Nitro)
  const names = new Set(discovered.map(task => task.name))
  const scheduled = Object.values(config.nitro!.scheduledTasks!).flat()
  expect(scheduled.length).toBeGreaterThan(0)
  expect(scheduled.filter(name => !names.has(name))).toEqual([])
})
