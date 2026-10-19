import {
  ControlType,
  ElementType,
  ListStyle,
  ListType,
  RowFlex,
  TitleLevel,
  splitText
} from '@baohu/canvas-editor'
import type { IElement } from '@baohu/canvas-editor'
import { Dialog } from '../components/Dialog'
import {
  Dropdown,
  IDropdownOption,
  createOptionList,
  setActiveOption
} from '../components/Dropdown'
import type { ILocale } from '../locale'
import type { IToolbarButton, IToolbarContext } from '../types'
import {
  cls,
  downloadBlob,
  formatDate,
  h,
  loadImage,
  readFileAsDataURL
} from '../utils'
import alignmentIcon from '../icons/alignment.svg'
import boldIcon from '../icons/bold.svg'
import centerIcon from '../icons/center.svg'
import checkboxIcon from '../icons/checkbox.svg'
import colorIcon from '../icons/color.svg'
import controlIcon from '../icons/control.svg'
import dateIcon from '../icons/date.svg'
import formatIcon from '../icons/format.svg'
import highlightIcon from '../icons/highlight.svg'
import hyperlinkIcon from '../icons/hyperlink.svg'
import imageIcon from '../icons/image.svg'
import italicIcon from '../icons/italic.svg'
import justifyIcon from '../icons/justify.svg'
import leftIcon from '../icons/left.svg'
import listIcon from '../icons/list.svg'
import pageBreakIcon from '../icons/page-break.svg'
import painterIcon from '../icons/painter.svg'
import pdfIcon from '../icons/pdf.svg'
import printIcon from '../icons/print.svg'
import redoIcon from '../icons/redo.svg'
import rightIcon from '../icons/right.svg'
import rowMarginIcon from '../icons/row-margin.svg'
import searchIcon from '../icons/search.svg'
import separatorIcon from '../icons/separator.svg'
import sizeAddIcon from '../icons/size-add.svg'
import sizeMinusIcon from '../icons/size-minus.svg'
import strikeoutIcon from '../icons/strikeout.svg'
import subscriptIcon from '../icons/subscript.svg'
import superscriptIcon from '../icons/superscript.svg'
import tableIcon from '../icons/table.svg'
import titleIcon from '../icons/title.svg'
import underlineIcon from '../icons/underline.svg'
import undoIcon from '../icons/undo.svg'

export const FONT_LIST: IDropdownOption[] = [
  'Microsoft YaHei',
  '宋体',
  '黑体',
  '仿宋',
  '楷体',
  '华文宋体',
  '华文黑体',
  '华文仿宋',
  '华文楷体',
  '华文隶书',
  '华文行楷',
  'Arial',
  'Segoe UI',
  'Times New Roman'
].map(font => ({
  label: font === 'Microsoft YaHei' ? '微软雅黑' : font,
  value: font,
  style: `font-family:'${font}'`
}))

export const SIZE_LIST: IDropdownOption[] = [
  ['初号', 56],
  ['小初', 48],
  ['一号', 34],
  ['小一', 32],
  ['二号', 29],
  ['小二', 24],
  ['三号', 21],
  ['小三', 20],
  ['四号', 18],
  ['小四', 16],
  ['五号', 14],
  ['小五', 12],
  ['六号', 10],
  ['小六', 8],
  ['七号', 7],
  ['八号', 6]
].map(([label, value]) => ({ label: String(label), value: String(value) }))

const ROW_MARGIN_LIST = ['1', '1.25', '1.5', '1.75', '2', '2.5', '3']

// 分割线虚线样式
const SEPARATOR_LIST: { label: string; dashArray: number[] }[] = [
  { label: '———— 实线', dashArray: [] },
  { label: '··········· 点线', dashArray: [1, 1] },
  { label: '- - - - - 短虚线', dashArray: [3, 1] },
  { label: '— — — 长虚线', dashArray: [4, 4] },
  { label: '—·—·— 点划线', dashArray: [7, 3, 3, 3] },
  { label: '—··—·· 双点划线', dashArray: [6, 2, 2, 2, 2, 2] }
]

// 简单按钮
function button(
  key: string,
  title: string,
  icon: string,
  onClick: (ctx: IToolbarContext, el: HTMLElement) => void,
  extra: Partial<IToolbarButton> = {}
): IToolbarButton {
  return { key, title, icon, onClick, ...extra }
}

// 下拉选择：触发器显示当前值
function selectItem(
  key: string,
  title: string,
  options: IDropdownOption[],
  width: number,
  onSelect: (ctx: IToolbarContext, value: string) => void,
  getValue: (ctx: IToolbarContext) => string | null
): IToolbarButton {
  return {
    key,
    title,
    render: ctx => {
      const label = h('span', { class: cls('select__label') })
      const trigger = h(
        'div',
        { class: cls('select'), title, style: `width:${width}px` },
        label
      )
      const list = createOptionList(options, value => {
        dropdown.close()
        onSelect(ctx, value)
      })
      const dropdown = new Dropdown(trigger, list)
      return dropdown.el
    },
    update: (ctx, el) => {
      const value = getValue(ctx)
      const option = options.find(o => o.value === value)
      el.querySelector<HTMLElement>(`.${cls('select__label')}`)!.innerText =
        option ? option.label : value || ''
      setActiveOption(el, value)
    }
  }
}

// 图标按钮 + 下拉面板
function dropdownItem(
  key: string,
  title: string,
  icon: string,
  createPanel: (ctx: IToolbarContext, close: () => void) => HTMLElement,
  extra: Partial<IToolbarButton> = {}
): IToolbarButton {
  return {
    key,
    title,
    render: ctx => {
      const trigger = h(
        'div',
        { class: `${cls('toolbar__button')} ${cls('toolbar__button--arrow')}`, title },
        h('i', { class: cls('icon'), style: `background-image:url("${icon}")` })
      )
      const panel = h('div')
      const dropdown = new Dropdown(trigger, panel)
      // 每次打开时重新生成面板内容（如当前时间）
      trigger.addEventListener(
        'click',
        () => {
          panel.innerHTML = ''
          panel.append(createPanel(ctx, () => dropdown.close()))
        },
        true
      )
      return dropdown.el
    },
    ...extra
  }
}

// 颜色按钮：图标下方显示当前颜色
function colorItem(
  key: string,
  title: string,
  icon: string,
  execute: (ctx: IToolbarContext, color: string) => void,
  getColor: (ctx: IToolbarContext) => string | null
): IToolbarButton {
  return {
    key,
    title,
    render: ctx => {
      const input = h('input', { type: 'color', class: cls('color__input') })
      input.addEventListener('input', () => execute(ctx, input.value))
      const bar = h('span', { class: cls('color__bar') })
      const trigger = h(
        'div',
        { class: `${cls('toolbar__button')} ${cls('color')}`, title },
        h('i', { class: cls('icon'), style: `background-image:url("${icon}")` }),
        bar,
        input
      )
      trigger.addEventListener('click', () => input.click())
      return trigger
    },
    update: (ctx, el) => {
      const color = getColor(ctx)
      el.querySelector<HTMLElement>(`.${cls('color__bar')}`)!.style.background =
        color || 'transparent'
    }
  }
}

function insertImage(ctx: IToolbarContext) {
  const input = h('input', { type: 'file', accept: 'image/*' })
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return
    const value = await readFileAsDataURL(file)
    const image = await loadImage(value)
    ctx.editor.command.executeImage({
      value,
      width: image.width,
      height: image.height
    })
  })
  input.click()
}

function openHyperlinkDialog({ editor, locale }: IToolbarContext) {
  new Dialog({
    title: locale.hyperlink,
    confirmText: locale.confirm,
    cancelText: locale.cancel,
    fields: [
      {
        type: 'text',
        name: 'text',
        label: locale.hyperlinkText,
        required: true,
        value: editor.command.getRangeText()
      },
      {
        type: 'text',
        name: 'url',
        label: locale.hyperlinkUrl,
        required: true,
        placeholder: 'https://'
      }
    ],
    onConfirm: ({ text, url }) => {
      editor.command.executeHyperlink({
        url,
        valueList: splitText(text).map(value => ({ value }))
      })
    }
  })
}

const OPTION_CONTROL_TYPES: string[] = [
  ControlType.SELECT,
  ControlType.CHECKBOX,
  ControlType.RADIO
]

function openControlDialog({ editor, locale }: IToolbarContext) {
  new Dialog({
    title: locale.control,
    confirmText: locale.confirm,
    cancelText: locale.cancel,
    fields: [
      {
        type: 'select',
        name: 'type',
        label: locale.controlType,
        options: [
          { label: locale.controlText, value: ControlType.TEXT },
          { label: locale.controlSelect, value: ControlType.SELECT },
          { label: locale.controlCheckbox, value: ControlType.CHECKBOX },
          { label: locale.controlRadio, value: ControlType.RADIO },
          { label: locale.controlDate, value: ControlType.DATE },
          { label: locale.controlNumber, value: ControlType.NUMBER }
        ]
      },
      {
        type: 'text',
        name: 'placeholder',
        label: locale.controlPlaceholder
      },
      {
        type: 'textarea',
        name: 'valueSets',
        label: locale.controlValueSets,
        placeholder: locale.controlValueSetsPlaceholder,
        height: 80
      },
      {
        type: 'select',
        name: 'dateFormat',
        label: locale.controlDateFormat,
        options: [
          { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
          { label: 'yyyy-MM-dd HH:mm:ss', value: 'yyyy-MM-dd HH:mm:ss' }
        ]
      }
    ],
    onConfirm: result => {
      const type = <ControlType>result.type
      const valueSets = result.valueSets
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean)
        .map(value => ({ value, code: value }))
      // 下拉、复选、单选必须提供选项
      if (OPTION_CONTROL_TYPES.includes(type) && !valueSets.length) {
        return false
      }
      const control: IElement['control'] = {
        type,
        value: null,
        placeholder: result.placeholder || undefined
      }
      if (OPTION_CONTROL_TYPES.includes(type)) {
        control.code = null
        control.valueSets = valueSets
      }
      if (type === ControlType.DATE) {
        control.dateFormat = result.dateFormat
      }
      editor.command.executeInsertControl({
        type: ElementType.CONTROL,
        value: '',
        control
      })
    }
  })
}

function openSearchDialog({ editor, locale }: IToolbarContext) {
  new Dialog({
    title: locale.search,
    confirmText: locale.confirm,
    cancelText: locale.cancel,
    fields: [
      {
        type: 'text',
        name: 'keyword',
        label: locale.searchKeyword,
        required: true,
        value: editor.command.getRangeText()
      },
      {
        type: 'text',
        name: 'replace',
        label: locale.searchReplace,
        placeholder: locale.searchReplacePlaceholder
      }
    ],
    onConfirm: ({ keyword, replace }) => {
      editor.command.executeSearch(keyword)
      if (replace) {
        editor.command.executeReplace(replace)
      }
    },
    onClose: () => editor.command.executeSearch(null)
  })
}

function createTablePicker(
  ctx: IToolbarContext,
  close: () => void
): HTMLElement {
  const MAX = 10
  const title = h('div', { class: cls('table-picker__title') }, ctx.locale.table)
  const grid = h('div', { class: cls('table-picker__grid') })
  const cellList: HTMLElement[] = []
  for (let r = 1; r <= MAX; r++) {
    for (let c = 1; c <= MAX; c++) {
      const cell = h('span', { 'data-row': r, 'data-col': c })
      cellList.push(cell)
      grid.append(cell)
    }
  }
  grid.addEventListener('mouseover', evt => {
    const target = evt.target as HTMLElement
    const row = Number(target.dataset.row)
    const col = Number(target.dataset.col)
    if (!row || !col) return
    title.innerText = `${row} × ${col}`
    cellList.forEach(cell => {
      cell.classList.toggle(
        cls('active'),
        Number(cell.dataset.row) <= row && Number(cell.dataset.col) <= col
      )
    })
  })
  grid.addEventListener('mousedown', evt => evt.preventDefault())
  grid.addEventListener('click', evt => {
    const target = evt.target as HTMLElement
    const row = Number(target.dataset.row)
    const col = Number(target.dataset.col)
    if (!row || !col) return
    close()
    ctx.editor.command.executeInsertTable(row, col)
  })
  return h('div', { class: cls('table-picker') }, title, grid)
}

const ROW_FLEX_ITEMS: [string, RowFlex, string][] = [
  ['left', RowFlex.LEFT, leftIcon],
  ['center', RowFlex.CENTER, centerIcon],
  ['right', RowFlex.RIGHT, rightIcon],
  ['alignment', RowFlex.ALIGNMENT, alignmentIcon],
  ['justify', RowFlex.JUSTIFY, justifyIcon]
]

export function createBuiltinItems(
  locale: ILocale
): Record<string, IToolbarButton> {
  const list: IToolbarButton[] = [
    button('undo', locale.undo, undoIcon, ({ editor }) =>
      editor.command.executeUndo(), {
      isDisabled: ({ style }) => !!style && !style.undo
    }),
    button('redo', locale.redo, redoIcon, ({ editor }) =>
      editor.command.executeRedo(), {
      isDisabled: ({ style }) => !!style && !style.redo
    }),
    {
      key: 'painter',
      title: locale.painter,
      icon: painterIcon,
      isActive: ({ style }) => !!style?.painter,
      render: ({ editor }) => {
        const el = h(
          'div',
          { class: cls('toolbar__button'), title: locale.painter },
          h('i', {
            class: cls('icon'),
            style: `background-image:url("${painterIcon}")`
          })
        )
        // 单击、双击区分处理
        let timer: ReturnType<typeof setTimeout> | null = null
        el.addEventListener('click', () => {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => {
            timer = null
            editor.command.executePainter({ isDblclick: false })
          }, 200)
        })
        el.addEventListener('dblclick', () => {
          if (timer) clearTimeout(timer)
          timer = null
          editor.command.executePainter({ isDblclick: true })
        })
        return el
      }
    },
    button('format', locale.format, formatIcon, ({ editor }) =>
      editor.command.executeFormat()
    ),
    selectItem(
      'font',
      locale.font,
      FONT_LIST,
      90,
      ({ editor }, value) => editor.command.executeFont(value),
      ({ editor, style }) => style?.font || editor.command.getOptions().defaultFont
    ),
    selectItem(
      'size',
      locale.size,
      SIZE_LIST,
      54,
      ({ editor }, value) => editor.command.executeSize(Number(value)),
      ({ editor, style }) =>
        String(style ? style.size : editor.command.getOptions().defaultSize)
    ),
    button('sizeAdd', locale.sizeAdd, sizeAddIcon, ({ editor }) =>
      editor.command.executeSizeAdd()
    ),
    button('sizeMinus', locale.sizeMinus, sizeMinusIcon, ({ editor }) =>
      editor.command.executeSizeMinus()
    ),
    button('bold', locale.bold, boldIcon, ({ editor }) =>
      editor.command.executeBold(), {
      isActive: ({ style }) => !!style?.bold
    }),
    button('italic', locale.italic, italicIcon, ({ editor }) =>
      editor.command.executeItalic(), {
      isActive: ({ style }) => !!style?.italic
    }),
    button('underline', locale.underline, underlineIcon, ({ editor }) =>
      editor.command.executeUnderline(), {
      isActive: ({ style }) => !!style?.underline
    }),
    button('strikeout', locale.strikeout, strikeoutIcon, ({ editor }) =>
      editor.command.executeStrikeout(), {
      isActive: ({ style }) => !!style?.strikeout
    }),
    button('superscript', locale.superscript, superscriptIcon, ({ editor }) =>
      editor.command.executeSuperscript(), {
      isActive: ({ style }) => style?.type === ElementType.SUPERSCRIPT
    }),
    button('subscript', locale.subscript, subscriptIcon, ({ editor }) =>
      editor.command.executeSubscript(), {
      isActive: ({ style }) => style?.type === ElementType.SUBSCRIPT
    }),
    colorItem(
      'color',
      locale.color,
      colorIcon,
      ({ editor }, color) => editor.command.executeColor(color),
      ({ style }) => style?.color || '#000000'
    ),
    colorItem(
      'highlight',
      locale.highlight,
      highlightIcon,
      ({ editor }, color) => editor.command.executeHighlight(color),
      ({ style }) => style?.highlight || null
    ),
    dropdownItem('title', locale.title, titleIcon, ({ editor, style }, close) => {
      const levelList = [
        TitleLevel.FIRST,
        TitleLevel.SECOND,
        TitleLevel.THIRD,
        TitleLevel.FOURTH,
        TitleLevel.FIFTH,
        TitleLevel.SIXTH
      ]
      const options: IDropdownOption[] = [
        { label: locale.text, value: '' },
        ...levelList.map((level, index) => ({
          label: `${locale.title}${index + 1}`,
          value: level,
          style: `font-size:${26 - index * 2}px;font-weight:bold`
        }))
      ]
      const list = createOptionList(options, value => {
        close()
        editor.command.executeTitle(<TitleLevel>value || null)
      })
      setActiveOption(list, style?.level || '')
      return list
    }),
    ...ROW_FLEX_ITEMS.map(([key, rowFlex, icon]) =>
      button(key, locale[<keyof ILocale>key], icon, ({ editor }) =>
        editor.command.executeRowFlex(rowFlex), {
        isActive: ({ style }) =>
          (style?.rowFlex || RowFlex.LEFT) === rowFlex
      })
    ),
    dropdownItem(
      'rowMargin',
      locale.rowMargin,
      rowMarginIcon,
      ({ editor, style }, close) => {
        const list = createOptionList(
          ROW_MARGIN_LIST.map(value => ({ label: value, value })),
          value => {
            close()
            editor.command.executeRowMargin(Number(value))
          }
        )
        setActiveOption(list, style ? String(style.rowMargin) : null)
        return list
      }
    ),
    dropdownItem(
      'list',
      locale.list,
      listIcon,
      ({ editor, style }, close) => {
        const options: IDropdownOption[] = [
          { label: locale.listDecimal, value: `${ListType.OL}|${ListStyle.DECIMAL}` },
          { label: locale.listCheckbox, value: `${ListType.UL}|${ListStyle.CHECKBOX}` },
          { label: locale.listDisc, value: `${ListType.UL}|${ListStyle.DISC}` },
          { label: locale.listCircle, value: `${ListType.UL}|${ListStyle.CIRCLE}` },
          { label: locale.listSquare, value: `${ListType.UL}|${ListStyle.SQUARE}` }
        ]
        const list = createOptionList(options, value => {
          close()
          const [listType, listStyle] = value.split('|')
          editor.command.executeList(<ListType>listType, <ListStyle>listStyle)
        })
        setActiveOption(
          list,
          style?.listType ? `${style.listType}|${style.listStyle}` : null
        )
        return list
      },
      { isActive: ({ style }) => !!style?.listType }
    ),
    dropdownItem('table', locale.table, tableIcon, createTablePicker),
    button('image', locale.image, imageIcon, insertImage),
    button('hyperlink', locale.hyperlink, hyperlinkIcon, openHyperlinkDialog),
    dropdownItem(
      'separator',
      locale.separator,
      separatorIcon,
      ({ editor }, close) =>
        createOptionList(
          SEPARATOR_LIST.map((item, index) => ({
            label: item.label,
            value: String(index)
          })),
          value => {
            close()
            editor.command.executeSeparator(
              SEPARATOR_LIST[Number(value)].dashArray
            )
          }
        )
    ),
    button('pageBreak', locale.pageBreak, pageBreakIcon, ({ editor }) =>
      editor.command.executePageBreak()
    ),
    button('control', locale.control, controlIcon, openControlDialog),
    button('checkbox', locale.checkbox, checkboxIcon, ({ editor }) =>
      editor.command.executeInsertElementList([
        { type: ElementType.CHECKBOX, value: '', checkbox: { value: false } }
      ])
    ),
    dropdownItem('date', locale.date, dateIcon, ({ editor }, close) => {
      const now = new Date()
      const formatList = [
        { format: 'yyyy-MM-dd', text: formatDate(now, false) },
        { format: 'yyyy-MM-dd HH:mm:ss', text: formatDate(now, true) }
      ]
      return createOptionList(
        formatList.map((item, index) => ({
          label: item.text,
          value: String(index)
        })),
        value => {
          close()
          const { format, text } = formatList[Number(value)]
          editor.command.executeInsertElementList([
            {
              type: ElementType.DATE,
              value: '',
              dateFormat: format,
              valueList: [{ value: text }]
            }
          ])
        }
      )
    }),
    button('search', locale.search, searchIcon, openSearchDialog, {
      keepEnabledInReadonly: true
    }),
    button('print', locale.print, printIcon, ({ editor }) =>
      editor.command.executePrint(), {
      keepEnabledInReadonly: true
    }),
    button(
      'pdf',
      locale.pdf,
      pdfIcon,
      async ({ editor }) => {
        const blob = await editor.command.getPdf()
        downloadBlob(blob, `document-${Date.now()}.pdf`)
      },
      { keepEnabledInReadonly: true }
    )
  ]
  const map: Record<string, IToolbarButton> = {}
  list.forEach(item => {
    map[item.key] = item
  })
  return map
}

export const DEFAULT_TOOLBAR: string[] = [
  'undo',
  'redo',
  'painter',
  'format',
  '|',
  'font',
  'size',
  'sizeAdd',
  'sizeMinus',
  'bold',
  'italic',
  'underline',
  'strikeout',
  'superscript',
  'subscript',
  'color',
  'highlight',
  '|',
  'title',
  'left',
  'center',
  'right',
  'alignment',
  'justify',
  'rowMargin',
  'list',
  '|',
  'table',
  'image',
  'hyperlink',
  'separator',
  'pageBreak',
  'checkbox',
  'date',
  '|',
  'search'
]
