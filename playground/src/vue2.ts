import Vue from 'vue'
import CanvasEditorVue2 from '@baohu/canvas-editor-vue2'
import type Editor from '@baohu/canvas-editor'
import type { IEditorData } from '@baohu/canvas-editor'

Vue.use(CanvasEditorVue2)

const data = (window as unknown as { SAMPLE_DATA: IEditorData }).SAMPLE_DATA

new Vue({
  el: '#app',
  data: () => ({ data, changeCount: 0, readonly: false }),
  methods: {
    onReady(editor: Editor) {
      Object.assign(window, { editor })
    },
    onChange() {
      this.changeCount++
    },
    printJSON() {
      const editor = (this.$refs.editor as unknown as { getValue: () => unknown })
      console.log(JSON.stringify(editor.getValue()))
    },
    toggleReadonly() {
      this.readonly = !this.readonly
      const editor = this.$refs.editor as unknown as {
        getUI: () => { setMode: (mode: string) => void }
      }
      editor.getUI().setMode(this.readonly ? 'readonly' : 'edit')
    }
  },
  mounted() {
    document.querySelectorAll('.nav a').forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === location.pathname)
    )
  },
  template: `
    <div style="height:100%">
      <nav class="nav">
        <strong>canvas-editor-ui</strong>
        <a href="/">首页</a>
        <a href="/vanilla.html">原生 JS（ESM）</a>
        <a href="/script.html">script 引入</a>
        <a href="/vue2.html">Vue 2</a>
        <a href="/vue2-script.html">Vue 2（script 引入）</a>
        <a href="/docx.html">Word 导入</a>
        <span class="actions">
          <span style="font-size:13px;color:#6b7280;align-self:center">内容变更 {{ changeCount }} 次</span>
          <button @click="toggleReadonly">{{ readonly ? '切换为编辑' : '切换为只读' }}</button>
          <button @click="printJSON">打印 JSON</button>
        </span>
      </nav>
      <div class="app">
        <canvas-editor ref="editor" :data="data" @ready="onReady" @change="onChange" />
      </div>
    </div>
  `
})
