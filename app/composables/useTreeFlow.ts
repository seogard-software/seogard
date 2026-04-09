interface TreeFlowOptions {
  siteId: Ref<string>
  zoneId: Ref<string>
}

type SortKey = 'issues' | 'pages' | 'name'

export function useTreeFlow({ siteId, zoneId }: TreeFlowOptions) {
  const route = useRoute()
  const router = useRouter()

  // ── Hydrate from URL query params ──
  const qSort = route.query.sort as string | undefined
  const qDir = route.query.dir as string | undefined
  const qSearch = route.query.q as string | undefined
  const qPath = route.query.path as string | undefined

  const VALID_SORTS: SortKey[] = ['issues', 'pages', 'name']
  const VALID_DIRS = ['asc', 'desc'] as const

  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const selectedNodeId = ref<string | null>(null)
  const selectedNode = ref<TreeNode | null>(null)
  const treeData = ref<TreeResponse | null>(null)

  // Drill-down navigation
  const currentPath = ref<string>(qPath && qPath.startsWith('/') ? qPath : '/')
  const navigationStack = ref<string[]>(buildStackFromPath(currentPath.value))

  // Search + sort
  const searchQuery = ref(qSearch ?? '')
  const sortKey = ref<SortKey>(VALID_SORTS.includes(qSort as SortKey) ? qSort as SortKey : 'issues')
  const sortDir = ref<'asc' | 'desc'>(VALID_DIRS.includes(qDir as 'asc' | 'desc') ? qDir as 'asc' | 'desc' : 'desc')

  // ── Build navigation stack from a path ──
  function buildStackFromPath(path: string): string[] {
    if (path === '/') return []
    const parts = path.split('/').filter(Boolean)
    const stack: string[] = ['/']
    let accumulated = ''
    for (let i = 0; i < parts.length - 1; i++) {
      accumulated += `/${parts[i]}`
      stack.push(accumulated)
    }
    return stack
  }

  // ── Sync state → URL query params ──
  function syncQueryParams() {
    if (import.meta.server) return
    const query: Record<string, string> = {}
    if (sortKey.value !== 'issues') query.sort = sortKey.value
    if (sortDir.value !== 'desc') query.dir = sortDir.value
    if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
    if (currentPath.value !== '/') query.path = currentPath.value
    router.replace({ query })
  }

  // Data from the last API response
  const allChildren = ref<TreeNode[]>([])
  const centerNode = ref<TreeNode | null>(null)
  const totalChildren = ref(0)
  const displayLimit = ref(50)

  const filteredChildren = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return allChildren.value
    return allChildren.value.filter(c =>
      c.label.toLowerCase().includes(q) || c.path.toLowerCase().includes(q),
    )
  })

  const sortedChildren = computed(() => {
    const list = [...filteredChildren.value]
    const key = sortKey.value
    const dir = sortDir.value === 'asc' ? 1 : -1

    list.sort((a, b) => {
      if (key === 'issues') {
        const hasRegA = a.regressionCount > 0
        const hasRegB = b.regressionCount > 0
        // Régressions d'abord (desc = plus de problèmes en haut)
        if (hasRegA !== hasRegB) return hasRegA ? 1 * dir : -1 * dir
        // Les deux ont des régressions → plus de régressions en premier
        if (hasRegA && hasRegB) {
          if (a.regressionCount !== b.regressionCount) return (a.regressionCount - b.regressionCount) * dir
          return (a.recommendationCount - b.recommendationCount) * dir
        }
        // Aucun n'a de régressions → trier par recos
        if (a.recommendationCount !== b.recommendationCount) return (a.recommendationCount - b.recommendationCount) * dir
        return (a.totalPageCount - b.totalPageCount) * dir
      }
      if (key === 'pages') return (a.totalPageCount - b.totalPageCount) * dir
      return a.label.localeCompare(b.label) * dir
    })

    return list
  })

  const breadcrumbSegments = computed(() => {
    if (currentPath.value === '/') return []
    const parts = currentPath.value.split('/').filter(Boolean)
    const segments: { label: string, path: string }[] = []
    let accumulated = ''
    for (const part of parts) {
      accumulated += `/${part}`
      segments.push({ label: part, path: accumulated })
    }
    return segments
  })

  function applyData(data: TreeResponse) {
    totalChildren.value = data.totalChildren
    if (data.nodes.length === 0) {
      centerNode.value = null
      allChildren.value = []
      return
    }

    centerNode.value = data.nodes[0]!
    allChildren.value = data.nodes.slice(1)
  }

  async function fetchTree(drillPath?: string, opts?: { silent?: boolean }) {
    if (!opts?.silent) loading.value = true
    error.value = null
    try {
      const targetPath = drillPath ?? currentPath.value
      const params: Record<string, string> = {
        drill: targetPath,
        limit: String(displayLimit.value),
      }
      const data = await $fetch<TreeResponse>(`/api/sites/${siteId.value}/zones/${zoneId.value}/tree`, { query: params })
      treeData.value = data
      if (!opts?.silent) searchQuery.value = ''
      applyData(data)
      if (!opts?.silent) syncQueryParams()
    }
    catch (err) {
      if (!opts?.silent) error.value = (err as Error).message ?? 'Erreur chargement arbre'
    }
    finally {
      if (!opts?.silent) loading.value = false
    }
  }

  async function loadMore() {
    loadingMore.value = true
    try {
      displayLimit.value += 50
      const targetPath = currentPath.value
      const params: Record<string, string> = {
        drill: targetPath,
        limit: String(displayLimit.value),
      }
      const data = await $fetch<TreeResponse>(`/api/sites/${siteId.value}/zones/${zoneId.value}/tree`, { query: params })
      treeData.value = data
      applyData(data)
    }
    catch (err) {
      error.value = (err as Error).message ?? 'Erreur chargement arbre'
    }
    finally {
      loadingMore.value = false
    }
  }

  async function drillInto(id: string) {
    navigationStack.value.push(currentPath.value)
    currentPath.value = id
    displayLimit.value = 50
    await fetchTree(id)
  }

  async function goBack() {
    const prev = navigationStack.value.pop()
    if (prev !== undefined) {
      currentPath.value = prev
      displayLimit.value = 50
      await fetchTree(prev)
    }
  }

  async function goToPath(path: string) {
    const idx = navigationStack.value.indexOf(path)
    if (idx !== -1) {
      navigationStack.value = navigationStack.value.slice(0, idx)
    }
    else {
      navigationStack.value = []
    }
    currentPath.value = path
    displayLimit.value = 50
    await fetchTree(path)
  }

  async function goToRoot() {
    navigationStack.value = []
    currentPath.value = '/'
    displayLimit.value = 50
    await fetchTree('/')
  }

  function selectNode(id: string, preferLeaf = false) {
    selectedNodeId.value = id
    const nodes = treeData.value?.nodes ?? []
    const nodeData = preferLeaf
      ? (nodes.find(n => n.id === id && n.isLeaf) ?? nodes.find(n => n.id === id))
      : nodes.find(n => n.id === id)
    selectedNode.value = nodeData ?? null
  }

  function clearSelection() {
    selectedNodeId.value = null
    selectedNode.value = null
  }

  // Sync client-side filters to URL
  watch([searchQuery, sortKey, sortDir], () => {
    syncQueryParams()
  })

  return {
    loading,
    loadingMore,
    error,
    selectedNodeId,
    selectedNode,
    treeData,
    currentPath,
    navigationStack,
    breadcrumbSegments,
    searchQuery,
    sortKey,
    sortDir,
    centerNode,
    allChildren,
    filteredChildren,
    sortedChildren,
    totalChildren,
    fetchTree,
    loadMore,
    drillInto,
    goBack,
    goToPath,
    goToRoot,
    selectNode,
    clearSelection,
  }
}
