export function useDiff() {
  return { computeDiff, computeDiffSegments, splitLabel }
}

export interface DiffSegment {
  text: string
  highlight: boolean
}

export function splitLabel(str: string): { label: string; content: string } {
  const match = str.match(/^(?:SSR|CSR): /)
  return match ? { label: match[0], content: str.slice(match[0].length) } : { label: '', content: str }
}

export function computeDiffSegments(a: string, b: string): { aSegments: DiffSegment[]; bSegments: DiffSegment[] } {
  if (a === b) {
    return { aSegments: [{ text: a, highlight: false }], bSegments: [{ text: b, highlight: false }] }
  }

  let prefixLen = 0
  const minLen = Math.min(a.length, b.length)
  while (prefixLen < minLen && a[prefixLen] === b[prefixLen]) prefixLen++

  let suffixLen = 0
  while (suffixLen < minLen - prefixLen && a[a.length - 1 - suffixLen] === b[b.length - 1 - suffixLen]) suffixLen++

  function segments(str: string): DiffSegment[] {
    const result: DiffSegment[] = []
    if (prefixLen > 0) result.push({ text: str.substring(0, prefixLen), highlight: false })
    const endIdx = suffixLen > 0 ? str.length - suffixLen : str.length
    const mid = str.substring(prefixLen, endIdx)
    if (mid) result.push({ text: mid, highlight: true })
    if (suffixLen > 0) result.push({ text: str.substring(str.length - suffixLen), highlight: false })
    return result.length > 0 ? result : [{ text: str, highlight: false }]
  }

  return { aSegments: segments(a), bSegments: segments(b) }
}

export function computeDiff(previousValue: string | null, currentValue: string | null) {
  if (!previousValue || !currentValue) return null

  const old = splitLabel(previousValue)
  const cur = splitLabel(currentValue)
  const { aSegments, bSegments } = computeDiffSegments(old.content, cur.content)

  return { oldLabel: old.label, newLabel: cur.label, oldSegments: aSegments, newSegments: bSegments }
}
