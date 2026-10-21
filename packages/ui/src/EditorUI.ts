import Editor, {
  EditorMode,
  INTERNAL_CONTEXT_MENU_KEY
} from '@baohu/canvas-editor'
import { ControlPanel } from './components/ControlPanel'
import { defaultLocale, ILocale } from './locale'
import { DEFAULT_STATUSBAR, Statusbar } from './statusbar/Statusbar'
import { Toolbar } from './toolbar/Toolbar'
import { DEFAULT_TOOLBAR } from './toolbar/items'
import type { IEditorUIOptions } from './types'
import { cls, h } from './utils'
import './style.css'

let uid = 0

export class EditorUI {
  public editor: Editor
  public root: HTMLDivElement
  public locale: ILocale
  private toolbar: Toolbar | null = null
  private statusbar: Statusbar | null = null
  private main: HTMLDivElement
  private mode: EditorMode
  private renderChange: () => void

  constructor(container: HTMLElement, options: IEditorUIOptions = {}) {
    this.locale = { ...defaultLocale, ...options.locale }
    const id = `${cls('root')}-${++uid}`
    const editorContainer = h('div', { class: cls('editor') })
    this.main = h('div', { class: cls('main') }, editorContainer)
    this.root = h('div', { class: cls('root'), id }, this.main)
    container.append(this.root)
    // 滚动容器需在编辑器创建前挂载到文档中
    this.editor = new Editor(editorContainer, options.data || { main: [] }, {
      scrollContainerSelector: `#${id} .${cls('main')}`,
      ...options.options
    })
    if (options.toolbar !== false) {
      this.toolbar = new Toolbar(this, options.toolbar || DEFAULT_TOOLBAR)
      this.root.prepend(this.toolbar.el)
    }
    if (options.statusbar !== false) {
      this.statusbar = new Statusbar(this, options.statusbar || DEFAULT_STATUSBAR)
      this.root.append(this.statusbar.el)
    }
    this.registerControlContextMenu()
    // 编辑器没有模式变化事件：渲染后比对，兼容直接调用 executeMode 的情况
    this.mode = this.editor.command.getOptions().mode
    this.renderChange = () => {
      if (this.editor.command.getOptions().mode !== this.mode) {
        this.syncMode()
      }
    }
    this.editor.eventBus.on('renderChange', this.renderChange)
  }

  private registerControlContextMenu() {
    const { register } = this.editor
    // 不可删除的控件不显示「删除控件」，设计模式不受删除规则限制
    const deleteMenu = register
      .getContextMenuList()
      .find(menu => menu.key === INTERNAL_CONTEXT_MENU_KEY.CONTROL.DELETE)
    const deleteWhen = deleteMenu?.when
    if (deleteMenu && deleteWhen) {
      deleteMenu.when = payload =>
        deleteWhen(payload) &&
        (payload.options.mode === EditorMode.DESIGN ||
          payload.startElement?.control?.deletable !== false)
    }
    // 设计模式下右键控件可修改控件属性
    register.contextMenuList([
      {
        name: this.locale.controlProperty,
        when: payload =>
          payload.options.mode === EditorMode.DESIGN &&
          !payload.editorHasSelection &&
          !!payload.startElement?.controlId,
        callback: (_command, context) => {
          const { controlId, control } = context.startElement!
          new ControlPanel({
            editor: this.editor,
            locale: this.locale,
            controlId,
            control
          })
        }
      }
    ])
  }

  private syncMode() {
    this.mode = this.editor.command.getOptions().mode
    this.toolbar?.update()
    this.statusbar?.update()
  }

  // 当前总页数（编辑器仅在页数变化时通知，初始值从页面画布读取）
  public getPageSize(): number {
    return this.main.querySelectorAll('canvas[data-index]').length || 1
  }

  // 切换编辑模式并刷新工具栏可用状态
  public setMode(mode: EditorMode) {
    this.editor.command.executeMode(mode)
    this.syncMode()
  }

  public destroy() {
    this.editor.eventBus.off('renderChange', this.renderChange)
    this.toolbar?.destroy()
    this.statusbar?.destroy()
    this.editor.destroy()
    this.root.remove()
  }
}

export function createEditorUI(
  container: HTMLElement | string,
  options?: IEditorUIOptions
): EditorUI {
  const el =
    typeof container === 'string'
      ? document.querySelector<HTMLElement>(container)
      : container
  if (!el) {
    throw new Error(`[canvas-editor-ui] container not found: ${container}`)
  }
  return new EditorUI(el, options)
}
