import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { resolve } from 'path'

export default defineConfig({
  plugins: [cssInjectedByJsPlugin({ styleId: 'canvas-editor-ui-style' })],
  build: {
    // 兼容 webpack 4（acorn 6）等旧构建工具
    target: 'es2019',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CanvasEditorUI',
      formats: ['es', 'umd'],
      fileName: format => `canvas-editor-ui.${format === 'es' ? 'esm' : 'umd'}.js`
    },
    rollupOptions: {
      external: ['@baohu/canvas-editor'],
      output: {
        exports: 'named',
        // 外部依赖为 ES 模块命名空间（含 __esModule / default），按其默认导出取值
        interop: 'auto',
        // canvas-editor 的 UMD 全局变量名
        globals: { '@baohu/canvas-editor': 'canvas-editor' }
      }
    }
  }
})
