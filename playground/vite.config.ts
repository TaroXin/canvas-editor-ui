import { defineConfig, Plugin } from 'vite'
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

export default defineConfig({
  plugins: [serveUmd()],
  resolve: {
    alias: {
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
        vue2Script: resolve(__dirname, 'vue2-script.html')
      }
    }
  }
})
