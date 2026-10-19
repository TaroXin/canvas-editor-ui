import { EDITOR_COMPONENT, EditorComponent } from '@baohu/canvas-editor'
import { cls, h } from '../utils'

export interface IDialogField {
  type: 'text' | 'number' | 'textarea' | 'select' | 'color'
  name: string
  label?: string
  value?: string
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  height?: number
}

export type IDialogResult = Record<string, string>

export interface IDialogOptions {
  title: string
  fields: IDialogField[]
  confirmText?: string
  cancelText?: string
  // 返回 false 阻止关闭
  onConfirm?: (result: IDialogResult) => void | boolean
  onClose?: () => void
}

type FieldInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

export class Dialog {
  private options: IDialogOptions
  private mask: HTMLDivElement
  private container: HTMLDivElement
  private inputList: FieldInput[] = []
  private keydownHandler: (evt: KeyboardEvent) => void

  constructor(options: IDialogOptions) {
    this.options = options
    this.mask = h('div', { class: cls('dialog-mask') })
    this.container = this.render()
    // 标记为编辑器组件，避免点击弹窗时编辑器失焦清空选区
    this.mask.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    this.container.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    document.body.append(this.mask, this.container)
    this.keydownHandler = evt => {
      if (evt.key === 'Escape') this.close()
    }
    document.addEventListener('keydown', this.keydownHandler)
    this.inputList[0]?.focus()
  }

  private render(): HTMLDivElement {
    const { title, fields, confirmText = '确定', cancelText = '取消' } =
      this.options
    const closeBtn = h('i', { class: cls('dialog__close') })
    closeBtn.onclick = () => this.close()
    const body = h('div', { class: cls('dialog__body') })
    fields.forEach(field => {
      const input = this.createInput(field)
      this.inputList.push(input)
      const label = field.label
        ? h(
            'span',
            {
              class: `${cls('dialog__label')}${
                field.required ? ` ${cls('dialog__label--required')}` : ''
              }`
            },
            field.label
          )
        : null
      body.append(h('label', { class: cls('dialog__field') }, label, input))
    })
    const cancelBtn = h('button', { type: 'button' }, cancelText)
    cancelBtn.onclick = () => this.close()
    const confirmBtn = h(
      'button',
      { type: 'button', class: cls('dialog__confirm') },
      confirmText
    )
    confirmBtn.onclick = () => this.confirm()
    const dialog = h(
      'div',
      { class: cls('dialog') },
      h('div', { class: cls('dialog__title') }, h('span', {}, title), closeBtn),
      body,
      h('div', { class: cls('dialog__footer') }, cancelBtn, confirmBtn)
    )
    // 单行输入框回车确认
    dialog.addEventListener('keydown', evt => {
      const target = evt.target as HTMLElement
      if (evt.key === 'Enter' && target.tagName === 'INPUT') {
        evt.preventDefault()
        this.confirm()
      }
    })
    return h('div', { class: cls('dialog-container') }, dialog)
  }

  private createInput(field: IDialogField): FieldInput {
    let input: FieldInput
    if (field.type === 'select') {
      input = h('select', { name: field.name })
      field.options?.forEach(option => {
        input.append(h('option', { value: option.value }, option.label))
      })
    } else if (field.type === 'textarea') {
      input = h('textarea', { name: field.name })
      if (field.height) input.style.height = `${field.height}px`
    } else {
      input = h('input', { name: field.name, type: field.type })
    }
    if (field.value !== undefined) input.value = field.value
    if (field.placeholder && !(input instanceof HTMLSelectElement)) {
      input.placeholder = field.placeholder
    }
    return input
  }

  private confirm() {
    const { fields, onConfirm } = this.options
    const result: IDialogResult = {}
    let isValid = true
    this.inputList.forEach((input, index) => {
      result[input.name] = input.value
      const isEmpty = fields[index].required && !input.value.trim()
      input.classList.toggle(cls('dialog__input--error'), !!isEmpty)
      if (isEmpty) isValid = false
    })
    if (!isValid) return
    if (onConfirm && onConfirm(result) === false) return
    this.dispose()
  }

  public close() {
    this.options.onClose?.()
    this.dispose()
  }

  private dispose() {
    document.removeEventListener('keydown', this.keydownHandler)
    this.mask.remove()
    this.container.remove()
  }
}
