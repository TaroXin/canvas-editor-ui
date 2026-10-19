import type Editor from '@baohu/canvas-editor'
import type { IEditorData } from '@baohu/canvas-editor'
import { EditorUI } from '@baohu/canvas-editor-ui'
import type { IEditorUIOptions } from '@baohu/canvas-editor-ui'

// 不依赖 vue 运行时（不使用 defineComponent），兼容 Vue 2.6 / 2.7
interface IComponentInstance {
  $el: HTMLElement
  $emit: (event: string, ...args: unknown[]) => void
  $props: Record<string, unknown>
  ui: EditorUI | null
  data: IEditorUIOptions['data']
  options: IEditorUIOptions['options']
  toolbar: IEditorUIOptions['toolbar']
  statusbar: IEditorUIOptions['statusbar']
  locale: IEditorUIOptions['locale']
  height: string | number
}

type CreateElement = (
  tag: string,
  data?: Record<string, unknown>
) => unknown

export const CanvasEditor = {
  name: 'CanvasEditor',
  props: {
    // 初始文档数据（只在创建时读取，之后请通过 setValue 修改）
    data: { type: [Object, Array], default: undefined },
    // canvas-editor 配置
    options: { type: Object, default: undefined },
    // 工具栏按钮，false 隐藏
    toolbar: { type: [Array, Boolean], default: undefined },
    // 状态栏项目，false 隐藏
    statusbar: { type: [Array, Boolean], default: undefined },
    // 界面文案
    locale: { type: Object, default: undefined },
    height: { type: [String, Number], default: '100%' }
  },
  mounted(this: IComponentInstance) {
    // ui 不放在 data 中，避免被 Vue 转为响应式
    const ui = new EditorUI(this.$el, {
      data: this.data,
      options: this.options,
      toolbar: this.toolbar,
      statusbar: this.statusbar,
      locale: this.locale
    })
    this.ui = ui
    const { eventBus } = ui.editor
    eventBus.on('contentChange', () => this.$emit('change'))
    eventBus.on('rangeStyleChange', style => {
      this.$emit('range-style-change', style)
    })
    this.$emit('ready', ui.editor, ui)
  },
  beforeDestroy(this: IComponentInstance) {
    this.ui?.destroy()
    this.ui = null
  },
  methods: {
    getEditor(this: IComponentInstance): Editor | null {
      return this.ui ? this.ui.editor : null
    },
    getUI(this: IComponentInstance): EditorUI | null {
      return this.ui
    },
    getValue(this: IComponentInstance) {
      return this.ui ? this.ui.editor.command.getValue() : null
    },
    setValue(this: IComponentInstance, data: Partial<IEditorData>) {
      this.ui?.editor.command.executeSetValue(data)
    }
  },
  render(this: IComponentInstance, h: CreateElement) {
    const { height } = this
    return h('div', {
      class: 'ceu-vue2',
      style: { height: typeof height === 'number' ? `${height}px` : height }
    })
  }
}

interface IVueConstructor {
  component: (name: string, component: unknown) => void
}

export function install(Vue: IVueConstructor) {
  Vue.component('CanvasEditor', CanvasEditor)
}

const plugin = { install, CanvasEditor }

// <script> 引入时自动注册到全局 Vue
const globalVue = typeof window !== 'undefined' ? (window as unknown as { Vue?: IVueConstructor & { use: (plugin: unknown) => void } }).Vue : undefined
if (globalVue && typeof globalVue.use === 'function') {
  globalVue.use(plugin)
}

export default plugin
