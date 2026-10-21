import {
  CheckboxMarkType,
  ControlIndentation,
  ControlType,
  EDITOR_COMPONENT,
  EditorComponent,
  ElementType,
  FlexDirection,
  RowFlex
} from '@baohu/canvas-editor'
import type Editor from '@baohu/canvas-editor'
import type { IElement } from '@baohu/canvas-editor'
import type { ILocale } from '../locale'
import { cls, h } from '../utils'

type IControl = NonNullable<IElement['control']>
type IControlValidation = NonNullable<IControl['validation']>

export interface IControlPanelOptions {
  editor: Editor
  locale: ILocale
  // 新增时的默认类型
  type?: ControlType
  // 修改已有控件时传入，此时不可修改控件类型
  controlId?: string
  control?: IControl
}

interface IValueSetRow {
  value: string
  code: string
  checked: boolean
}

type IControlDraft = Omit<IControl, 'value'> & {
  // 文本、日期、数值控件的值
  valueText: string
  // 下拉、复选、单选控件的选项（含选中状态）
  valueSetRows: IValueSetRow[]
}

type FieldKind = 'text' | 'number' | 'switch' | 'color'

type TabKey = 'basic' | 'option' | 'rule' | 'style' | 'advanced'

const OPTION_CONTROL_TYPES: string[] = [
  ControlType.SELECT,
  ControlType.CHECKBOX,
  ControlType.RADIO
]

const DATE_FORMAT_LIST = [
  'yyyy-MM-dd',
  'yyyy-MM-dd HH:mm',
  'yyyy-MM-dd HH:mm:ss',
  'HH:mm:ss',
  'yyyy年MM月dd日',
  'yyyy年MM月dd日 HH时mm分ss秒'
]

const HEX_COLOR_REG = /^#[0-9a-f]{6}$/i

let uid = 0

// 控件面板：新增控件与修改控件属性共用
export class ControlPanel {
  private options: IControlPanelOptions
  private locale: ILocale
  private isEdit: boolean
  private draft: IControlDraft
  private originValue: string
  private originValueSets: string
  private activeTab: TabKey = 'basic'
  private mask: HTMLDivElement
  private container: HTMLDivElement
  private tabs: HTMLDivElement
  private body: HTMLDivElement
  private error: HTMLDivElement
  private keydownHandler: (evt: KeyboardEvent) => void
  private id = `${cls('control-panel')}-${++uid}`

  constructor(options: IControlPanelOptions) {
    this.options = options
    this.locale = options.locale
    this.isEdit = !!(options.controlId && options.control)
    this.draft = this.createDraft()
    this.originValue = this.getValue()
    this.originValueSets = JSON.stringify(this.getValueSets())
    this.mask = h('div', { class: cls('dialog-mask') })
    this.tabs = h('div', { class: cls('control-panel__tabs') })
    this.body = h('div', { class: cls('control-panel__body') })
    this.error = h('div', { class: cls('control-panel__error') })
    this.container = this.render()
    // 标记为编辑器组件，避免点击面板时编辑器失焦清空选区
    this.mask.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    this.container.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    document.body.append(this.mask, this.container)
    this.keydownHandler = evt => {
      if (evt.key === 'Escape') this.close()
    }
    document.addEventListener('keydown', this.keydownHandler)
    this.renderContent()
  }

  private createDraft(): IControlDraft {
    const { editor, control, controlId, type } = this.options
    if (!this.isEdit || !control || !controlId) {
      return {
        type: type || ControlType.TEXT,
        valueText: '',
        valueSetRows: []
      }
    }
    const draft: IControlDraft = {
      ...control,
      validation: control.validation ? { ...control.validation } : undefined,
      valueText: '',
      valueSetRows: []
    }
    Reflect.deleteProperty(draft, 'value')
    // 读取控件当前值
    const result = editor.command.getControlValue({ id: controlId })?.[0]
    if (OPTION_CONTROL_TYPES.includes(control.type)) {
      const code = result ? result.code : control.code
      const codeList = code ? code.split(',') : []
      draft.valueSetRows = (control.valueSets || []).map(valueSet => ({
        ...valueSet,
        checked: codeList.includes(valueSet.code)
      }))
    } else {
      draft.valueText = result?.value || ''
    }
    return draft
  }

  private isOptionType(): boolean {
    return OPTION_CONTROL_TYPES.includes(this.draft.type)
  }

  private isMultiple(): boolean {
    const { type, isMultiSelect } = this.draft
    return (
      type === ControlType.CHECKBOX ||
      (type === ControlType.SELECT && !!isMultiSelect)
    )
  }

  // 选项编码为空时与显示值相同
  private getValueSets() {
    return this.draft.valueSetRows.map(row => ({
      value: row.value.trim(),
      code: row.code.trim() || row.value.trim()
    }))
  }

  private getValue(): string {
    if (!this.isOptionType()) return this.draft.valueText
    const valueSets = this.getValueSets()
    return this.draft.valueSetRows
      .map((row, index) => (row.checked ? valueSets[index].code : ''))
      .filter(Boolean)
      .join(',')
  }

  // ---------- 渲染 ----------

  private render(): HTMLDivElement {
    const { locale } = this
    const closeBtn = h('i', { class: cls('dialog__close') })
    closeBtn.onclick = () => this.close()
    const cancelBtn = h('button', { type: 'button' }, locale.cancel)
    cancelBtn.onclick = () => this.close()
    const confirmBtn = h(
      'button',
      { type: 'button', class: cls('dialog__confirm') },
      locale.confirm
    )
    confirmBtn.onclick = () => this.confirm()
    const dialog = h(
      'div',
      { class: `${cls('dialog')} ${cls('control-panel')}` },
      h(
        'div',
        { class: cls('dialog__title') },
        h('span', {}, this.isEdit ? locale.controlProperty : locale.controlAdd),
        closeBtn
      ),
      this.tabs,
      this.body,
      this.error,
      h('div', { class: cls('dialog__footer') }, cancelBtn, confirmBtn)
    )
    return h('div', { class: cls('dialog-container') }, dialog)
  }

  private getTabList(): { key: TabKey; label: string }[] {
    const { locale } = this
    const tabList: { key: TabKey; label: string }[] = [
      { key: 'basic', label: locale.controlTabBasic },
      { key: 'option', label: locale.controlTabOption },
      { key: 'rule', label: locale.controlTabRule },
      { key: 'style', label: locale.controlTabStyle },
      { key: 'advanced', label: locale.controlTabAdvanced }
    ]
    // 文本控件没有专属选项
    return tabList.filter(
      tab => tab.key !== 'option' || this.draft.type !== ControlType.TEXT
    )
  }

  private renderContent() {
    const tabList = this.getTabList()
    if (!tabList.some(tab => tab.key === this.activeTab)) {
      this.activeTab = 'basic'
    }
    this.tabs.innerHTML = ''
    tabList.forEach(tab => {
      const el = h(
        'div',
        {
          class: `${cls('control-panel__tab')}${
            tab.key === this.activeTab ? ` ${cls('active')}` : ''
          }`
        },
        tab.label
      )
      el.onclick = () => {
        this.activeTab = tab.key
        this.renderContent()
      }
      this.tabs.append(el)
    })
    const scrollTop = this.body.scrollTop
    this.body.innerHTML = ''
    switch (this.activeTab) {
      case 'basic':
        this.renderBasic()
        break
      case 'option':
        this.renderOption()
        break
      case 'rule':
        this.renderRule()
        break
      case 'style':
        this.renderStyle()
        break
      case 'advanced':
        this.renderAdvanced()
        break
    }
    this.body.scrollTop = scrollTop
  }

  private renderBasic() {
    const { locale, draft } = this
    const typeSelect = this.appendSelect(
      locale.controlType,
      [
        { label: locale.controlText, value: ControlType.TEXT },
        { label: locale.controlSelect, value: ControlType.SELECT },
        { label: locale.controlCheckbox, value: ControlType.CHECKBOX },
        { label: locale.controlRadio, value: ControlType.RADIO },
        { label: locale.controlDate, value: ControlType.DATE },
        { label: locale.controlNumber, value: ControlType.NUMBER }
      ],
      draft.type,
      value => {
        draft.type = <ControlType>value
        draft.valueText = ''
        draft.valueSetRows.forEach(row => (row.checked = false))
        this.renderContent()
      }
    )
    if (this.isEdit) {
      typeSelect.disabled = true
      typeSelect.title = locale.controlTypeDisabled
    }
    // 下拉、复选、单选的值在「选项」中勾选
    if (!this.isOptionType()) {
      const placeholder =
        draft.type === ControlType.DATE
          ? draft.dateFormat || 'yyyy-MM-dd HH:mm:ss'
          : ''
      this.appendInput(
        this.isEdit ? locale.controlValue : locale.controlDefaultValue,
        draft.type === ControlType.NUMBER ? 'number' : 'text',
        draft.valueText,
        value => (draft.valueText = value),
        placeholder
      )
    }
    // 复选框、单选框不显示占位符
    if (
      draft.type !== ControlType.CHECKBOX &&
      draft.type !== ControlType.RADIO
    ) {
      this.appendDraftField('placeholder', locale.controlPlaceholder, 'text')
    }
    this.appendDraftField('conceptId', locale.controlConceptId, 'text')
    this.appendDraftField('groupId', locale.controlGroupId, 'text')

    this.appendGroup(locale.controlGroupText)
    this.appendDraftField('preText', locale.controlPreText, 'text')
    this.appendDraftField('postText', locale.controlPostText, 'text')
    this.appendDraftField('prefix', locale.controlPrefix, 'text', '{')
    this.appendDraftField('postfix', locale.controlPostfix, 'text', '}')

    this.appendGroup(locale.controlGroupLayout)
    this.appendDraftField('minWidth', locale.controlMinWidth, 'number')
    this.appendSelect(
      locale.controlRowFlex,
      [
        { label: locale.controlDefault, value: '' },
        { label: locale.left, value: RowFlex.LEFT },
        { label: locale.center, value: RowFlex.CENTER },
        { label: locale.right, value: RowFlex.RIGHT },
        { label: locale.alignment, value: RowFlex.ALIGNMENT },
        { label: locale.justify, value: RowFlex.JUSTIFY }
      ],
      draft.rowFlex || '',
      value => (draft.rowFlex = <RowFlex>value || undefined)
    )
    this.appendSelect(
      locale.controlIndentation,
      [
        { label: locale.controlDefault, value: '' },
        {
          label: locale.controlIndentationRowStart,
          value: ControlIndentation.ROW_START
        },
        {
          label: locale.controlIndentationValueStart,
          value: ControlIndentation.VALUE_START
        }
      ],
      draft.indentation || '',
      value => (draft.indentation = <ControlIndentation>value || undefined)
    )
    this.appendDraftField('underline', locale.underline, 'switch')
    this.appendDraftField('border', locale.controlBorder, 'switch')
  }

  private renderOption() {
    const { locale, draft } = this
    switch (draft.type) {
      case ControlType.SELECT:
        this.appendDraftField(
          'isMultiSelect',
          locale.controlMultiSelect,
          'switch',
          '',
          () => {
            // 切换为单选时只保留第一个选中项
            if (!draft.isMultiSelect) {
              let isFound = false
              draft.valueSetRows.forEach(row => {
                if (row.checked && isFound) row.checked = false
                if (row.checked) isFound = true
              })
            }
            this.renderContent()
          }
        )
        if (draft.isMultiSelect) {
          this.appendDraftField(
            'multiSelectDelimiter',
            locale.controlMultiSelectDelimiter,
            'text',
            ','
          )
        }
        this.appendSwitch(
          locale.controlInputAble,
          !!draft.selectExclusiveOptions?.inputAble,
          checked => {
            draft.selectExclusiveOptions = checked
              ? { inputAble: true }
              : undefined
          }
        )
        this.appendValueSets()
        break
      case ControlType.CHECKBOX:
        this.appendFlexDirection()
        this.appendSelect(
          locale.controlMarkType,
          [
            { label: locale.checkboxCross, value: CheckboxMarkType.CROSS },
            { label: locale.checkboxCheck, value: CheckboxMarkType.CHECK }
          ],
          draft.markType || CheckboxMarkType.CHECK,
          value => (draft.markType = <CheckboxMarkType>value)
        )
        this.appendDraftField('min', locale.controlCheckboxMin, 'number')
        this.appendDraftField('max', locale.controlCheckboxMax, 'number')
        this.appendValueSets()
        break
      case ControlType.RADIO:
        this.appendFlexDirection()
        this.appendValueSets()
        break
      case ControlType.DATE: {
        const input = this.appendInput(
          locale.controlDateFormat,
          'text',
          draft.dateFormat || '',
          value => (draft.dateFormat = value || undefined),
          'yyyy-MM-dd HH:mm:ss'
        )
        const datalist = h('datalist', { id: `${this.id}-date-format` })
        DATE_FORMAT_LIST.forEach(format => {
          datalist.append(h('option', { value: format }))
        })
        input.setAttribute('list', datalist.id)
        input.after(datalist)
        this.appendTip(locale.controlDateFormatTip)
        break
      }
      case ControlType.NUMBER:
        this.appendSwitch(
          locale.controlCalculatorDisabled,
          !!draft.numberExclusiveOptions?.calculatorDisabled,
          checked => {
            draft.numberExclusiveOptions = checked
              ? { calculatorDisabled: true }
              : undefined
          }
        )
        break
    }
  }

  private renderRule() {
    const { locale, draft } = this
    this.appendGroup(locale.controlGroupRule)
    this.appendSwitch(
      locale.controlDeletable,
      draft.deletable !== false,
      checked => (draft.deletable = checked)
    )
    this.appendDraftField('disabled', locale.controlDisabled, 'switch')
    this.appendDraftField('pasteDisabled', locale.controlPasteDisabled, 'switch')
    this.appendDraftField('hide', locale.controlHide, 'switch')
    this.appendDraftField('required', locale.controlRequired, 'switch')

    this.appendGroup(locale.controlGroupValidation)
    switch (draft.type) {
      case ControlType.TEXT:
        this.appendValidationField('minLength', locale.controlMinLength, 'number')
        this.appendValidationField('maxLength', locale.controlMaxLength, 'number')
        this.appendValidationField('pattern', locale.controlPattern, 'text', '^\\d{11}$')
        break
      case ControlType.NUMBER:
        this.appendValidationField('min', locale.controlMin, 'number')
        this.appendValidationField('max', locale.controlMax, 'number')
        this.appendValidationField('integer', locale.controlInteger, 'switch')
        this.appendValidationField('precision', locale.controlPrecision, 'number')
        break
      case ControlType.DATE:
        this.appendValidationField('minDate', locale.controlMinDate, 'text', 'YYYY-MM-DD / today')
        this.appendValidationField('maxDate', locale.controlMaxDate, 'text', 'YYYY-MM-DD / today')
        break
      case ControlType.CHECKBOX:
        this.appendValidationField('minChecked', locale.controlMinChecked, 'number')
        this.appendValidationField('maxChecked', locale.controlMaxChecked, 'number')
        break
    }
    this.appendValidationField('message', locale.controlValidationMessage, 'text')
  }

  private renderStyle() {
    const { locale } = this
    this.appendGroup(locale.controlGroupValueStyle)
    this.appendDraftField('font', locale.font, 'text')
    this.appendDraftField('size', locale.size, 'number')
    this.appendDraftField('bold', locale.bold, 'switch')
    this.appendDraftField('italic', locale.italic, 'switch')
    this.appendDraftField('strikeout', locale.strikeout, 'switch')
    this.appendDraftField('highlight', locale.highlight, 'color')

    this.appendGroup(locale.controlGroupBackground)
    this.appendDraftField('activeBackgroundColor', locale.controlActiveBackground, 'color')
    this.appendDraftField('disabledBackgroundColor', locale.controlDisabledBackground, 'color')
    this.appendDraftField('existValueBackgroundColor', locale.controlExistValueBackground, 'color')
    this.appendDraftField('noValueBackgroundColor', locale.controlNoValueBackground, 'color')
  }

  private renderAdvanced() {
    const { locale } = this
    const compute = h('textarea', {
      placeholder: "round(getValue('weight') / getValue('height'), 1)"
    })
    compute.value = this.draft.compute || ''
    compute.oninput = () => {
      this.draft.compute = compute.value.trim() || undefined
    }
    const computeItem = this.appendItem(
      locale.controlCompute,
      compute,
      h('div', { class: cls('control-panel__tip') }, locale.controlComputeTip)
    )
    computeItem.classList.add(cls('control-panel__field--block'))
    this.appendJsonField('cascade', locale.controlCascade, '[{ "expression": "", "actions": [] }]')
    this.appendJsonField('extension', locale.controlExtension, '{ "key": "value" }')
  }

  // ---------- 表单项 ----------

  private appendItem(label: string, ...children: Node[]): HTMLDivElement {
    const item = h(
      'div',
      { class: cls('control-panel__field') },
      h('span', { class: cls('control-panel__label') }, label),
      ...children
    )
    this.body.append(item)
    return item
  }

  private appendGroup(title: string) {
    this.body.append(h('div', { class: cls('control-panel__group') }, title))
  }

  private appendTip(tip: string) {
    this.body.append(h('div', { class: cls('control-panel__tip') }, tip))
  }

  private appendInput(
    label: string,
    type: 'text' | 'number',
    value: string,
    onInput: (value: string) => void,
    placeholder = ''
  ): HTMLInputElement {
    const input = h('input', { type, placeholder })
    input.value = value
    input.oninput = () => onInput(input.value)
    this.appendItem(label, input)
    return input
  }

  private appendSelect(
    label: string,
    optionList: { label: string; value: string }[],
    value: string,
    onChange: (value: string) => void
  ): HTMLSelectElement {
    const select = h('select')
    optionList.forEach(option => {
      select.append(h('option', { value: option.value }, option.label))
    })
    select.value = value
    select.onchange = () => onChange(select.value)
    this.appendItem(label, select)
    return select
  }

  private appendSwitch(
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void
  ) {
    const input = h('input', { type: 'checkbox' })
    input.checked = checked
    input.onchange = () => onChange(input.checked)
    this.appendItem(label, input)
  }

  // 颜色可为空（未设置时使用全局配置），因此额外提供文本框与清除按钮
  private appendColor(
    label: string,
    value: string | undefined,
    onChange: (value: string | undefined) => void
  ) {
    const colorInput = h('input', { type: 'color' })
    const textInput = h('input', { type: 'text', placeholder: this.locale.controlUnset })
    const clearBtn = h('span', { class: cls('control-panel__link') }, this.locale.controlClear)
    const wrap = h('div', { class: cls('control-panel__color') }, colorInput, textInput, clearBtn)
    const sync = (color: string | undefined) => {
      textInput.value = color || ''
      colorInput.value = color && HEX_COLOR_REG.test(color) ? color : '#ffffff'
      wrap.classList.toggle(cls('control-panel__color--empty'), !color)
    }
    sync(value)
    colorInput.oninput = () => {
      sync(colorInput.value)
      onChange(colorInput.value)
    }
    textInput.oninput = () => {
      const color = textInput.value.trim() || undefined
      if (color && HEX_COLOR_REG.test(color)) colorInput.value = color
      wrap.classList.toggle(cls('control-panel__color--empty'), !color)
      onChange(color)
    }
    clearBtn.onclick = () => {
      sync(undefined)
      onChange(undefined)
    }
    this.appendItem(label, wrap)
  }

  private appendField(
    label: string,
    kind: FieldKind,
    value: unknown,
    onChange: (value: unknown) => void,
    placeholder = ''
  ) {
    if (kind === 'switch') {
      this.appendSwitch(label, !!value, checked => onChange(checked || undefined))
    } else if (kind === 'color') {
      this.appendColor(label, <string | undefined>value, onChange)
    } else {
      this.appendInput(
        label,
        kind,
        value === undefined || value === null ? '' : String(value),
        text => {
          if (kind === 'number') {
            onChange(text === '' ? undefined : Number(text))
          } else {
            onChange(text || undefined)
          }
        },
        placeholder
      )
    }
  }

  private appendDraftField(
    key: keyof IControlDraft,
    label: string,
    kind: FieldKind,
    placeholder = '',
    afterChange?: () => void
  ) {
    this.appendField(
      label,
      kind,
      this.draft[key],
      value => {
        Reflect.set(this.draft, key, value)
        afterChange?.()
      },
      placeholder
    )
  }

  private appendValidationField(
    key: keyof IControlValidation,
    label: string,
    kind: FieldKind,
    placeholder = ''
  ) {
    this.appendField(
      label,
      kind,
      this.draft.validation?.[key],
      value => {
        this.draft.validation = { ...this.draft.validation, [key]: value }
      },
      placeholder
    )
  }

  private appendJsonField(
    key: 'cascade' | 'extension',
    label: string,
    placeholder: string
  ) {
    const value = this.draft[key]
    const textarea = h('textarea', { placeholder })
    textarea.value =
      value === undefined || value === null ? '' : JSON.stringify(value, null, 2)
    textarea.onchange = () => {
      const text = textarea.value.trim()
      try {
        Reflect.set(this.draft, key, text ? JSON.parse(text) : undefined)
        textarea.classList.remove(cls('dialog__input--error'))
      } catch {
        textarea.classList.add(cls('dialog__input--error'))
      }
    }
    const item = this.appendItem(label, textarea)
    item.classList.add(cls('control-panel__field--block'))
  }

  private appendFlexDirection() {
    const { locale, draft } = this
    this.appendSelect(
      locale.controlFlexDirection,
      [
        { label: locale.controlFlexRow, value: FlexDirection.ROW },
        { label: locale.controlFlexColumn, value: FlexDirection.COLUMN }
      ],
      draft.flexDirection || FlexDirection.ROW,
      value => (draft.flexDirection = <FlexDirection>value)
    )
  }

  private appendValueSets() {
    const { locale, draft } = this
    const rows = draft.valueSetRows
    const isMultiple = this.isMultiple()
    const tbody = h('tbody')
    rows.forEach((row, index) => {
      const check = h('input', { type: isMultiple ? 'checkbox' : 'radio' })
      check.checked = row.checked
      check.onclick = () => {
        // 单选允许再次点击取消选中
        if (!isMultiple) {
          rows.forEach(item => {
            if (item !== row) item.checked = false
          })
        }
        row.checked = !row.checked
        this.renderContent()
      }
      const valueInput = h('input', { type: 'text' })
      valueInput.value = row.value
      valueInput.oninput = () => (row.value = valueInput.value)
      const codeInput = h('input', {
        type: 'text',
        placeholder: locale.controlValueSetCodePlaceholder
      })
      codeInput.value = row.code
      codeInput.oninput = () => (row.code = codeInput.value)
      const removeBtn = h('span', { class: cls('control-panel__link') }, locale.controlRemove)
      removeBtn.onclick = () => {
        rows.splice(index, 1)
        this.renderContent()
      }
      tbody.append(
        h(
          'tr',
          {},
          h('td', {}, check),
          h('td', {}, valueInput),
          h('td', {}, codeInput),
          h('td', {}, removeBtn)
        )
      )
    })
    const table = h(
      'table',
      { class: cls('control-panel__value-sets') },
      h(
        'thead',
        {},
        h(
          'tr',
          {},
          h('th', {}, this.isEdit ? locale.controlChecked : locale.controlDefaultValue),
          h('th', {}, locale.controlValueSetValue),
          h('th', {}, locale.controlValueSetCode),
          h('th')
        )
      ),
      tbody
    )
    const addBtn = h('span', { class: cls('control-panel__link') }, `+ ${locale.controlAddValueSet}`)
    addBtn.onclick = () => {
      rows.push({ value: '', code: '', checked: false })
      this.renderContent()
      // 聚焦新增行
      const inputList = this.body.querySelectorAll<HTMLInputElement>(
        `.${cls('control-panel__value-sets')} tbody tr:last-child input[type='text']`
      )
      inputList[0]?.focus()
    }
    const item = this.appendItem(locale.controlValueSets, table, addBtn)
    item.classList.add(cls('control-panel__field--block'))
  }

  // ---------- 提交 ----------

  private validate(): string | null {
    const { locale, draft } = this
    if (this.body.querySelector(`.${cls('dialog__input--error')}`)) {
      return locale.controlErrorJson
    }
    if (this.isOptionType()) {
      const valueSets = this.getValueSets()
      if (!valueSets.length) return locale.controlErrorValueSetsEmpty
      if (valueSets.some(valueSet => !valueSet.value)) {
        return locale.controlErrorValueSetValue
      }
      const codeSet = new Set(valueSets.map(valueSet => valueSet.code))
      if (codeSet.size !== valueSets.length) {
        return locale.controlErrorValueSetCode
      }
    }
    if (
      draft.type === ControlType.NUMBER &&
      draft.valueText &&
      isNaN(Number(draft.valueText))
    ) {
      return locale.controlErrorNumber
    }
    return null
  }

  private getProperties(): Omit<IControl, 'value'> {
    const { draft } = this
    const { type } = draft
    const properties: Omit<IControl, 'value'> = { ...draft }
    Reflect.deleteProperty(properties, 'valueText')
    Reflect.deleteProperty(properties, 'valueSetRows')
    // 清除与当前类型无关的属性（修改时需显式置空才会覆盖旧值）
    if (this.isOptionType()) {
      properties.valueSets = this.getValueSets()
      properties.code = this.getValue() || null
    } else {
      properties.valueSets = undefined
      properties.code = undefined
    }
    if (type !== ControlType.SELECT) {
      properties.isMultiSelect = undefined
      properties.multiSelectDelimiter = undefined
      properties.selectExclusiveOptions = undefined
    }
    if (type !== ControlType.CHECKBOX) {
      properties.min = undefined
      properties.max = undefined
      properties.markType = undefined
    }
    if (type !== ControlType.CHECKBOX && type !== ControlType.RADIO) {
      properties.flexDirection = undefined
    }
    if (type !== ControlType.DATE) {
      properties.dateFormat = undefined
    }
    if (type !== ControlType.NUMBER) {
      properties.numberExclusiveOptions = undefined
    }
    // 校验规则只保留已填写的项
    const validation: IControlValidation = {}
    Object.entries(draft.validation || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        Reflect.set(validation, key, value)
      }
    })
    properties.validation = Object.keys(validation).length ? validation : undefined
    return properties
  }

  private confirm() {
    const error = this.validate()
    this.error.innerText = error || ''
    if (error) return
    const { editor, controlId } = this.options
    const properties = this.getProperties()
    const value = this.getValue()
    if (this.isEdit && controlId) {
      // 设置属性后编辑器会重新生成 controlId，因此需先按 id 设置值
      if (this.isOptionType()) {
        // 新选中项可能是本次新增的选项，旧选项集无法设置：
        // 先清空值，再随属性写入 code，重新排版时按新选项集与 code 渲染
        const isValueSetsChanged =
          JSON.stringify(this.getValueSets()) !== this.originValueSets
        if (value !== this.originValue || isValueSetsChanged) {
          editor.command.executeSetControlValue({ id: controlId, value: null })
        }
      } else if (value !== this.originValue) {
        editor.command.executeSetControlValue({
          id: controlId,
          value: value || null
        })
      }
      // 类型不可修改
      Reflect.deleteProperty(properties, 'type')
      editor.command.executeSetControlProperties({
        id: controlId,
        properties
      })
    } else {
      editor.command.executeInsertControl({
        type: ElementType.CONTROL,
        value: '',
        control: {
          ...properties,
          value: !this.isOptionType() && value ? [{ value }] : null
        }
      })
    }
    this.dispose()
  }

  public close() {
    this.dispose()
  }

  private dispose() {
    document.removeEventListener('keydown', this.keydownHandler)
    this.mask.remove()
    this.container.remove()
  }
}
