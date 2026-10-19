import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    // 兼容 webpack 4（acorn 6）等旧构建工具
    target: 'es2019',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CanvasEditorVue2',
      formats: ['es', 'umd'],
      fileName: format => `canvas-editor-vue2.${format === 'es' ? 'esm' : 'umd'}.js`
    },
    rollupOptions: {
      external: ['@baohu/canvas-editor', '@baohu/canvas-editor-ui', 'vue'],
      output: {
        exports: 'named',
        // 外部依赖为 ES 模块命名空间（含 __esModule / default），按其默认导出取值
        interop: 'auto',
        globals: {
          '@baohu/canvas-editor': 'canvas-editor',
          '@baohu/canvas-editor-ui': 'CanvasEditorUI',
          vue: 'Vue'
        }
      }
    }
  }
})
