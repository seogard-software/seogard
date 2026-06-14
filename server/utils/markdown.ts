import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki from '@shikijs/rehype'

function buildProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, { theme: 'github-dark' })
    .use(rehypeStringify)
}

let processor: ReturnType<typeof buildProcessor> | null = null

function getProcessor(): ReturnType<typeof buildProcessor> {
  if (!processor) processor = buildProcessor()
  return processor
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await getProcessor().process(markdown)
  return String(result)
}
