// Renders the full portfolio into dist/index.html as real text, so crawlers and
// no-JS visitors get the content without running the 3D app.
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error'
})

try {
  const { default: PlainContent } = await vite.ssrLoadModule('/src/components/PlainContent.vue')
  const html = await renderToString(createSSRApp(PlainContent))
  const file = 'dist/index.html'
  const page = readFileSync(file, 'utf8')
  if (!page.includes('<!--prerender-->')) throw new Error('Prerender marker missing from dist/index.html')
  writeFileSync(file, page.replace('<!--prerender-->', html))
  console.log(`Prerendered ${html.length} characters into ${file}`)
} finally {
  await vite.close()
}
