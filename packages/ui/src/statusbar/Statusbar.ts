import {
  EDITOR_COMPONENT,
  EditorComponent,
  EditorMode,
  PageMode,
  PaperDirection
} from '@baohu/canvas-editor'
import { Dialog } from '../components/Dialog'
import { Dropdown, createOptionList, setActiveOption } from '../components/Dropdown'
import type { EditorUI } from '../EditorUI'
import type { IStatusbarItem } from '../types'
import { cls, debounce, h } from '../utils'
import exitFullscreenIcon from '../icons/exit-fullscreen.svg'
import pageModeIcon from '../icons/page-mode.svg'
import pageScaleAddIcon from '../icons/page-scale-add.svg'
import pageScaleMinusIcon from '../icons/page-scale-minus.svg'
import paperDirectionIcon from '../icons/paper-direction.svg'
import paperMarginIcon from '../icons/paper-margin.svg'
import requestFullscreenIcon from '../icons/request-fullscreen.svg'

export const DEFAULT_STATUSBAR: IStatusbarItem[] = [
  'pageNo',
  'wordCount',
  'rowCol',
  'pageMode',
  'scale',
  'paperDirection',
  'paperMargin',
  'fullscreen'
]

// 左侧为信息，右侧为操作
const LEFT_ITEMS: IStatusbarItem[] = ['pageNo', 'wordCount', 'rowCol']

function iconButton(icon: string, title: string, onClick: () => void) {
  const el = h(
    'div',
    { class: cls('statusbar__button'), title },
    h('i', { class: cls('icon'), style: `background-image:url("${icon}")` })
  )
  el.addEventListener('click', onClick)
  return el
}

export class Statusbar {
  public el: HTMLDivElement
  private ui: EditorUI
  private disposeList: (() => void)[] = []
  private updaterList: (() => void)[] = []

  constructor(ui: EditorUI, items: IStatusbarItem[] = DEFAULT_STATUSBAR) {
    this.ui = ui
    const left = h('div', { class: cls('statusbar__left') })
    const right = h('div', { class: cls('statusbar__right') })
    this.el = h('div', { class: cls('statusbar') }, left, right)
    this.el.setAttribute(EDITOR_COMPONENT, EditorComponent.FOOTER)
    this.el.addEventListener('mousedown', evt => evt.preventDefault())
    items.forEach(key => {
      const el = this.createItem(key)
      if (!el) return
      el.classList.add(cls('statusbar__item'))
      ;(LEFT_ITEMS.includes(key) ? left : right).append(el)
    })
  }

  // 订阅编辑器事件，销毁时统一取消
  private on: EditorUI['editor']['eventBus']['on'] = (event, callback) => {
    const { eventBus } = this.ui.editor
    eventBus.on(event, callback)
    this.disposeList.push(() => eventBus.off(event, callback))
  }

  private createItem(key: IStatusbarItem): HTMLElement | null {
    const { editor, locale } = this.ui
    switch (key) {
      case 'pageNo': {
        const pageNo = h('span', {}, '1')
        const pageSize = h('span', {}, String(this.ui.getPageSize()))
        this.on('intersectionPageNoChange', (payload: number) => {
          pageNo.innerText = String(payload + 1)
        })
        this.on('pageSizeChange', (payload: number) => {
          pageSize.innerText = String(payload)
        })
        return h('span', {}, `${locale.pageNo}：`, pageNo, '/', pageSize)
      }
      case 'wordCount': {
        const count = h('span', {}, '0')
        const refresh = debounce(async () => {
          count.innerText = String(await editor.command.getWordCount())
        }, 300)
        this.on('contentChange', refresh)
        this.disposeList.push(refresh.cancel)
        refresh()
        return h('span', {}, `${locale.wordCount}：`, count)
      }
      case 'rowCol': {
        const text = h('span', {}, '1:1')
        this.on('rangeStyleChange', () => {
          const context = editor.command.getRangeContext()
          if (context) {
            text.innerText = `${context.startRowNo + 1}:${context.startColNo + 1}`
          }
        })
        return h('span', {}, `${locale.rowCol}：`, text)
      }
      case 'pageMode': {
        const trigger = iconButton(pageModeIcon, '', () => undefined)
        const list = createOptionList(
          [
            { label: locale.pageModePaging, value: PageMode.PAGING },
            { label: locale.pageModeContinuity, value: PageMode.CONTINUITY }
          ],
          value => {
            dropdown.close()
            editor.command.executePageMode(<PageMode>value)
          }
        )
        const dropdown = new Dropdown(trigger, list, 'top')
        const sync = (mode: PageMode) => {
          setActiveOption(list, mode)
          trigger.title =
            mode === PageMode.CONTINUITY
              ? locale.pageModeContinuity
              : locale.pageModePaging
        }
        sync(editor.command.getOptions().pageMode)
        this.on('pageModeChange', sync)
        return dropdown.el
      }
      case 'scale': {
        const percentage = h('span', {
          class: cls('statusbar__scale'),
          title: locale.scaleRecovery
        })
        const sync = (scale: number) => {
          percentage.innerText = `${Math.round(scale * 100)}%`
        }
        sync(editor.command.getOptions().scale)
        this.on('pageScaleChange', sync)
        percentage.addEventListener('click', () =>
          editor.command.executePageScaleRecovery()
        )
        return h(
          'div',
          { class: cls('statusbar__group') },
          iconButton(pageScaleMinusIcon, locale.scaleMinus, () =>
            editor.command.executePageScaleMinus()
          ),
          percentage,
          iconButton(pageScaleAddIcon, locale.scaleAdd, () =>
            editor.command.executePageScaleAdd()
          )
        )
      }
      case 'paperDirection':
        return iconButton(paperDirectionIcon, locale.paperDirection, () => {
          const { paperDirection } = editor.command.getOptions()
          editor.command.executePaperDirection(
            paperDirection === PaperDirection.HORIZONTAL
              ? PaperDirection.VERTICAL
              : PaperDirection.HORIZONTAL
          )
        })
      case 'paperMargin':
        return iconButton(paperMarginIcon, locale.paperMargin, () =>
          this.openPaperMarginDialog()
        )
      case 'mode': {
        const modeList = [
          { label: locale.modeEdit, value: EditorMode.EDIT },
          { label: locale.modeClean, value: EditorMode.CLEAN },
          { label: locale.modeReadonly, value: EditorMode.READONLY },
          { label: locale.modeForm, value: EditorMode.FORM },
          { label: locale.modePrint, value: EditorMode.PRINT },
          { label: locale.modeDesign, value: EditorMode.DESIGN },
          { label: locale.modeGraffiti, value: EditorMode.GRAFFITI },
          { label: locale.modeTrace, value: EditorMode.TRACE }
        ]
        const label = h('span', { class: cls('statusbar__mode') })
        const list = createOptionList(modeList, value => {
          dropdown.close()
          this.ui.setMode(<EditorMode>value)
        })
        const dropdown = new Dropdown(label, list, 'top')
        const sync = () => {
          const mode = editor.command.getOptions().mode
          label.innerText =
            modeList.find(item => item.value === mode)?.label || mode
          setActiveOption(list, mode)
        }
        sync()
        this.updaterList.push(sync)
        return dropdown.el
      }
      case 'fullscreen': {
        const button = iconButton(requestFullscreenIcon, locale.fullscreen, () => {
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            this.ui.root.requestFullscreen()
          }
        })
        const onChange = () => {
          const icon = document.fullscreenElement
            ? exitFullscreenIcon
            : requestFullscreenIcon
          button.querySelector<HTMLElement>('i')!.style.backgroundImage =
            `url("${icon}")`
        }
        document.addEventListener('fullscreenchange', onChange)
        this.disposeList.push(() =>
          document.removeEventListener('fullscreenchange', onChange)
        )
        return button
      }
      default:
        console.warn(`[canvas-editor-ui] unknown statusbar item: ${key}`)
        return null
    }
  }

  private openPaperMarginDialog() {
    const { editor, locale } = this.ui
    // 顺序：上、右、下、左
    const nameList = ['top', 'right', 'bottom', 'left']
    const labelList = [
      locale.marginTop,
      locale.marginRight,
      locale.marginBottom,
      locale.marginLeft
    ]
    const marginList = editor.command.getPaperMargin()
    new Dialog({
      title: locale.paperMargin,
      confirmText: locale.confirm,
      cancelText: locale.cancel,
      fields: nameList.map((name, index) => ({
        type: 'number',
        name,
        label: labelList[index],
        required: true,
        value: String(marginList[index])
      })),
      onConfirm: result => {
        const [top, right, bottom, left] = nameList.map(name =>
          Number(result[name])
        )
        const margins: [number, number, number, number] = [top, right, bottom, left]
        if (margins.some(margin => isNaN(margin) || margin < 0)) return false
        editor.command.executeSetPaperMargin(margins)
      }
    })
  }

  // 外部状态（如编辑模式）变化后刷新
  public update() {
    this.updaterList.forEach(update => update())
  }

  public destroy() {
    this.disposeList.forEach(dispose => dispose())
    this.el.remove()
  }
}
