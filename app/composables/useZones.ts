import type { Zone, ZoneRole } from '~~/shared/types/zone'

interface ZoneStatsData {
  zoneId: string
  pageCount: number
  alerts: { critical: number; warning: number; info: number }
}

const zones = ref<Zone[]>([])
const zoneStats = ref<ZoneStatsData[]>([])
const loading = ref(false)

export function useZones() {
  const orgStore = useOrganizationStore()

  const customZones = computed(() => zones.value.filter(z => !z.isDefault))
  const defaultZone = computed(() => zones.value.find(z => z.isDefault) ?? null)
  const defaultZoneId = computed(() => defaultZone.value?._id ?? null)

  function zoneAlertCount(zoneId: string): number {
    const stats = zoneStats.value.find(s => s.zoneId === zoneId)
    if (!stats) return 0
    return stats.alerts.critical + stats.alerts.warning
  }

  async function fetchZones(siteId: string) {
    if (!orgStore.activeOrgId) return
    loading.value = true
    try {
      const [zoneList, stats] = await Promise.all([
        $fetch<Zone[]>(`/api/sites/${siteId}/zones`, {
          headers: { 'x-org-id': orgStore.activeOrgId },
        }),
        $fetch<ZoneStatsData[]>(`/api/sites/${siteId}/zones/stats`, {
          headers: { 'x-org-id': orgStore.activeOrgId },
        }),
      ])
      zones.value = zoneList
      zoneStats.value = stats
    }
    catch {
      zones.value = []
      zoneStats.value = []
    }
    finally {
      loading.value = false
    }
  }

  function updateZone(updated: Zone) {
    const index = zones.value.findIndex(z => z._id === updated._id)
    if (index !== -1) {
      const existing = zones.value[index]!
      zones.value.splice(index, 1, { ...updated, userRole: updated.userRole ?? existing.userRole })
    }
  }

  function resetZones() {
    zones.value = []
    zoneStats.value = []
  }

  function getUserZoneRole(zoneId: string): ZoneRole | null {
    const zone = zones.value.find(z => z._id === zoneId)
    return zone?.userRole ?? null
  }

  function hasMinZoneRole(zoneId: string, minRole: ZoneRole): boolean {
    const role = getUserZoneRole(zoneId)
    if (!role) return false
    const hierarchy: Record<ZoneRole, number> = { owner: 40, admin: 30, member: 20, viewer: 10 }
    return hierarchy[role] >= hierarchy[minRole]
  }

  return {
    zones,
    zoneStats,
    customZones,
    defaultZone,
    defaultZoneId,
    loading,
    zoneAlertCount,
    getUserZoneRole,
    hasMinZoneRole,
    fetchZones,
    updateZone,
    resetZones,
  }
}
