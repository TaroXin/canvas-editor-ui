import { EDITOR_COMPONENT, EditorComponent, EditorMode } from '@baohu/canvas-editor'
import type { IRangeStyle } from '@baohu/canvas-editor'
import type { EditorUI } from '../EditorUI'
import type { IToolbarButton, IToolbarContext, IToolbarItem } from '../types'
import { cls, h } from '../utils'
import { DEFAULT_TOOLBAR, createBuiltinItems } from './items'

interface IRenderedItem {
  item: IToolbarButton
  el: HTMLElement
}

// 只读类模式下禁用编辑按钮
const READONLY_MODES: string[] = [EditorMode.READONLY, EditorMode.PRINT]

export class Toolbar {
  public el: HTMLDivElement
  private ui: EditorUI
  private style: IRangeStyle | null = null
  private renderedList: IRenderedItem[] = []
  private rangeStyleChange: (style: IRangeStyle) => void

  constructor(ui: EditorUI, items: IToolbarItem[] = DEFAULT_TOOLBAR) {
    this.ui = ui
    this.el = h('div', { class: cls('toolbar') })
    this.el.setAttribute(EDITOR_COMPONENT, EditorComponent.MENU)
    // 阻止点击工具栏时编辑器失去焦点（输入框除外）
    this.el.addEventListener('mousedown', evt => {
      const tag = (evt.target as HTMLElement).tagName
      if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
        evt.preventDefault()
      }
    })
    this.render(items)
    this.rangeStyleChange = style => {
      this.style = style
      this.update()
    }
    ui.editor.eventBus.on('rangeStyleChange', this.rangeStyleChange)
    this.update()
  }

  private getContext(): IToolbarContext {
    return {
      editor: this.ui.editor,
      ui: this.ui,
      locale: this.ui.locale,
      style: this.style
    }
  }

  private render(items: IToolbarItem[]) {
    const builtinMap = createBuiltinItems(this.ui.locale)
    const ctx = this.getContext()
    items.forEach(entry => {
      if (entry === '|') {
        this.el.append(h('span', { class: cls('toolbar__divider') }))
        return
      }
      const item = typeof entry === 'string' ? builtinMap[entry] : entry
      if (!item) {
        console.warn(`[canvas-editor-ui] unknown toolbar item: ${entry}`)
        return
      }
      const el = item.render ? item.render(ctx) : this.renderButton(item)
      el.classList.add(cls('toolbar__item'))
      el.dataset.key = item.key
      this.el.append(el)
      this.renderedList.push({ item, el })
    })
  }

  private renderButton(item: IToolbarButton): HTMLElement {
    const el = h(
      'div',
      { class: cls('toolbar__button'), title: item.title },
      item.icon
        ? h('i', {
            class: cls('icon'),
            style: `background-image:url("${item.icon}")`
          })
        : null,
      item.text ? h('span', { class: cls('toolbar__text') }, item.text) : null
    )
    el.addEventListener('click', () => {
      if (el.classList.contains(cls('disabled'))) return
      item.onClick?.(this.getContext(), el)
    })
    return el
  }

  // 根据光标样式与编辑模式刷新按钮状态
  public update() {
    const ctx = this.getContext()
    const mode = this.ui.editor.command.getOptions().mode
    const isReadonly = READONLY_MODES.includes(mode)
    this.renderedList.forEach(({ item, el }) => {
      const disabled =
        (isReadonly && !item.keepEnabledInReadonly) ||
        !!item.isDisabled?.(ctx)
      el.classList.toggle(cls('disabled'), disabled)
      el.classList.toggle(cls('active'), !!item.isActive?.(ctx))
      item.update?.(ctx, el)
    })
  }

  public destroy() {
    this.ui.editor.eventBus.off('rangeStyleChange', this.rangeStyleChange)
    this.el.remove()
  }
}
