import { defineConfig, loadEnv, Plugin } from 'vite'
import { createReadStream, existsSync } from 'fs'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'

const require = createRequire(import.meta.url)
const packageDir = (name: string) => dirname(require.resolve(`${name}/package.json`))

// 供 <script> 示例页面加载的 UMD 文件（与发布到 npm 的产物一致）
const umdFileMap: Record<string, () => string> = {
  '/lib/vue.js': () => resolve(packageDir('vue'), 'dist/vue.min.js'),
  '/lib/canvas-editor.umd.js': () =>
    resolve(packageDir('@baohu/canvas-editor'), 'dist/canvas-editor.umd.cjs'),
  '/lib/canvas-editor-ui.umd.js': () =>
    resolve(__dirname, '../packages/ui/dist/canvas-editor-ui.umd.js'),
  '/lib/canvas-editor-vue2.umd.js': () =>
    resolve(__dirname, '../packages/vue2/dist/canvas-editor-vue2.umd.js')
}

function serveUmd(): Plugin {
  return {
    name: 'serve-umd',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const getFile = umdFileMap[(req.url || '').split('?')[0]]
        if (!getFile) return next()
        const file = getFile()
        if (!existsSync(file)) {
          res.statusCode = 404
          res.end(`${file} not found, run "pnpm build" first`)
          return
        }
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        createReadStream(file).pipe(res)
      })
    }
  }
}

// 本地调试编辑器核心或 docx 插件：在 playground/.env.local（不会提交）中设置
// LOCAL_CANVAS_EDITOR=编辑器仓库目录，例如 ../../canvas-editor
// LOCAL_DOCX_PLUGIN=插件包目录，例如 ../../canvas-editor-plugin/packages/docx
// 设置后直接引用源码，修改后热更新，无需发布或改 package.json
const LOCAL_SOURCE_LIST = [
  { env: 'LOCAL_CANVAS_EDITOR', name: '@baohu/canvas-editor', entry: 'src/editor/index.ts' },
  { env: 'LOCAL_DOCX_PLUGIN', name: '@baohu/canvas-editor-plugin-docx', entry: 'src/docx/index.ts' }
]

function localSourceAlias(mode: string): Record<string, string> {
  const env = loadEnv(mode, __dirname, 'LOCAL_')
  const alias: Record<string, string> = {}
  for (const { env: key, name, entry } of LOCAL_SOURCE_LIST) {
    if (!env[key]) continue
    const file = resolve(__dirname, env[key], entry)
    if (!existsSync(file)) throw new Error(`${key}: ${file} not found`)
    console.log(`\n  [playground] ${name} 使用本地源码：${file}\n`)
    alias[name] = file
  }
  return alias
}

export default defineConfig(({ mode }) => ({
  plugins: [serveUmd()],
  resolve: {
    // 本地插件源码也使用 playground 的编辑器核心，避免加载两份
    dedupe: ['@baohu/canvas-editor'],
    alias: {
      ...localSourceAlias(mode),
      // 直接引用源码，修改后热更新
      '@baohu/canvas-editor-ui': resolve(__dirname, '../packages/ui/src/index.ts'),
      '@baohu/canvas-editor-vue2': resolve(__dirname, '../packages/vue2/src/index.ts'),
      // 完整版 Vue 2（含模板编译器）
      vue: 'vue/dist/vue.esm.js'
    }
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        vanilla: resolve(__dirname, 'vanilla.html'),
        script: resolve(__dirname, 'script.html'),
        vue2: resolve(__dirname, 'vue2.html'),
        vue2Script: resolve(__dirname, 'vue2-script.html'),
        docx: resolve(__dirname, 'docx.html'),
        image: resolve(__dirname, 'image.html')
      }
    }
  }
}))
