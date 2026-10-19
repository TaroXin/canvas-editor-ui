import { cls, h } from '../utils'

export interface IDropdownOption {
  label: string
  value: string
  // 选项自身样式（如字体预览）
  style?: string
  icon?: string
}

const openedDropdownSet = new Set<Dropdown>()

// 点击下拉框以外区域时关闭
function onDocumentMousedown(evt: MouseEvent) {
  openedDropdownSet.forEach(dropdown => {
    if (!dropdown.el.contains(evt.target as Node)) dropdown.close()
  })
}

export class Dropdown {
  public el: HTMLDivElement
  public panel: HTMLDivElement

  constructor(trigger: HTMLElement, panel: HTMLElement, placement = 'bottom') {
    this.panel = h(
      'div',
      { class: `${cls('dropdown__panel')} ${cls(`dropdown__panel--${placement}`)}` },
      panel
    )
    this.el = h('div', { class: cls('dropdown') }, trigger, this.panel)
    trigger.addEventListener('click', () => this.toggle())
  }

  public toggle() {
    if (openedDropdownSet.has(this)) {
      this.close()
    } else {
      this.open()
    }
  }

  public open() {
    openedDropdownSet.forEach(dropdown => dropdown.close())
    this.panel.classList.add(cls('dropdown__panel--visible'))
    // 超出视口右侧时改为右对齐
    this.panel.style.left = ''
    this.panel.style.right = ''
    const rect = this.panel.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      this.panel.style.left = 'auto'
      this.panel.style.right = '0'
    }
    if (!openedDropdownSet.size) {
      document.addEventListener('mousedown', onDocumentMousedown)
    }
    openedDropdownSet.add(this)
  }

  public close() {
    this.panel.classList.remove(cls('dropdown__panel--visible'))
    openedDropdownSet.delete(this)
    if (!openedDropdownSet.size) {
      document.removeEventListener('mousedown', onDocumentMousedown)
    }
  }
}

// 选项列表面板
export function createOptionList(
  options: IDropdownOption[],
  onSelect: (value: string) => void
): HTMLUListElement {
  const list = h('ul', { class: cls('option-list') })
  options.forEach(option => {
    const item = h(
      'li',
      { 'data-value': option.value, style: option.style },
      option.icon
        ? h('i', {
            class: cls('icon'),
            style: `background-image:url("${option.icon}")`
          })
        : null,
      option.label
    )
    // mousedown 阻止默认行为，保持编辑器选区
    item.addEventListener('mousedown', evt => evt.preventDefault())
    item.addEventListener('click', () => onSelect(option.value))
    list.append(item)
  })
  return list
}

export function setActiveOption(list: HTMLElement, value: string | null) {
  list.querySelectorAll('li').forEach(item => {
    item.classList.toggle(cls('active'), item.dataset.value === value)
  })
}
