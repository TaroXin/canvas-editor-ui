import { createEditorUI } from '@baohu/canvas-editor-ui'
import {
  ControlType,
  ElementType,
  ImageDisplay,
  TitleLevel,
  VerticalAlign,
  type IEditorData,
  type IElement
} from '@baohu/canvas-editor'
import { PLAYGROUND_STATUSBAR, registerInsertControlMenu } from './common'

const IMAGE_URL = '/image-demo.svg'
const IMAGE_WIDTH = 100
const IMAGE_HEIGHT = 50
const FILL_TEXT = '这是一段用于观察图片排版效果的示例文字，'.repeat(5)

// 浮动类图片（四周型环绕、浮于文字上方、衬于文字下方）需要页面坐标
const FLOAT_DISPLAYS = [
  ImageDisplay.SURROUND,
  ImageDisplay.FLOAT_TOP,
  ImageDisplay.FLOAT_BOTTOM
]

interface IFloatPosition {
  pageNo: number
  x: number
  y: number
}

interface IDemo {
  key: string
  label: string
  display: ImageDisplay
  // 浮动图片相对段落起点的水平偏移
  offsetX?: number
}

const DEMO_LIST: IDemo[] = [
  { key: 'block', label: '嵌入型', display: ImageDisplay.BLOCK },
  { key: 'inline', label: '上下型环绕', display: ImageDisplay.INLINE },
  { key: 'surround', label: '四周型环绕', display: ImageDisplay.SURROUND },
  {
    key: 'floatTop',
    label: '浮于文字上方',
    display: ImageDisplay.FLOAT_TOP,
    offsetX: 80
  },
  {
    key: 'floatBottom',
    label: '衬于文字下方',
    display: ImageDisplay.FLOAT_BOTTOM,
    offsetX: 80
  }
]

function image(
  display: ImageDisplay,
  floatPosition?: IFloatPosition
): IElement | null {
  // 浮动图片拿到坐标前先不放入
  if (FLOAT_DISPLAYS.includes(display) && !floatPosition) return null
  return {
    type: ElementType.IMAGE,
    value: IMAGE_URL,
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    imgDisplay: display,
    ...(floatPosition ? { imgFloatPosition: floatPosition } : {})
  }
}

// 嵌入型图片与同行文字的垂直对齐
const VERTICAL_ALIGN_LIST = [
  { label: '顶端对齐', verticalAlign: VerticalAlign.TOP },
  { label: '居中对齐', verticalAlign: VerticalAlign.MIDDLE },
  { label: '底端对齐（默认）', verticalAlign: VerticalAlign.BOTTOM }
]

function alignedImage(verticalAlign: VerticalAlign): IElement {
  return { ...image(ImageDisplay.BLOCK)!, imgVerticalAlign: verticalAlign }
}

function alignedLaTex(verticalAlign: VerticalAlign): IElement {
  return {
    type: ElementType.LATEX,
    value: '\\frac{a+b}{c}',
    imgVerticalAlign: verticalAlign
  }
}

function title(text: string): IElement {
  return {
    type: ElementType.TITLE,
    value: '',
    level: TitleLevel.SECOND,
    valueList: [{ value: text }]
  }
}

// 段落锚点文字：用于查找浮动图片的页面坐标
function anchorText(demo: IDemo, inControl: boolean) {
  return `${inControl ? '控件' : '正文'}${demo.label}：`
}

function createData(
  floatPositionMap: Record<string, IFloatPosition> = {}
): IEditorData {
  const main: IElement[] = [
    {
      value: `图片尺寸 ${IMAGE_WIDTH} × ${IMAGE_HEIGHT}，分别以五种排版方式放在正文和文本控件中。\n`
    }
  ]
  // 正文
  main.push(title('一、正文中的图片'))
  DEMO_LIST.forEach(demo => {
    const anchor = anchorText(demo, false)
    const img = image(demo.display, floatPositionMap[anchor])
    main.push({ value: `\n${demo.label}（${demo.display}）\n`, bold: true })
    if (FLOAT_DISPLAYS.includes(demo.display)) {
      if (img) main.push(img)
      main.push({ value: `${anchor}${FILL_TEXT}\n` })
    } else {
      main.push({ value: `${anchor}图片前的文字` })
      if (img) main.push(img)
      main.push({ value: `图片后的文字，${FILL_TEXT}\n` })
    }
  })
  // 控件
  main.push(title('二、文本控件中的图片'))
  DEMO_LIST.forEach(demo => {
    const anchor = anchorText(demo, true)
    const img = image(demo.display, floatPositionMap[anchor])
    const isFloat = FLOAT_DISPLAYS.includes(demo.display)
    const value: IElement[] = isFloat
      ? [...(img ? [img] : []), { value: `${anchor}${FILL_TEXT}` }]
      : [
          { value: `${anchor}图片前的文字` },
          ...(img ? [img] : []),
          { value: `图片后的文字，${FILL_TEXT}` }
        ]
    main.push({ value: `\n${demo.label}（${demo.display}）\n`, bold: true })
    main.push({
      type: ElementType.CONTROL,
      value: '',
      control: {
        type: ControlType.TEXT,
        placeholder: '请输入',
        value
      }
    })
    main.push({ value: '\n' })
  })
  // 垂直对齐（也可在图片上右键 → 图片对齐 切换）
  main.push(title('三、嵌入型图片、公式与文字的垂直对齐'))
  main.push({ value: '\n右键嵌入型图片或公式 → 对齐方式，可切换顶端、居中、底端。\n' })
  VERTICAL_ALIGN_LIST.forEach(({ label, verticalAlign }) => {
    main.push({ value: `\n${label}（${verticalAlign}）\n`, bold: true })
    main.push({ value: '正文：图片前的文字' })
    main.push(alignedImage(verticalAlign))
    main.push({ value: '图片后的文字\n' })
    main.push({ value: '公式：公式前的文字' })
    main.push(alignedLaTex(verticalAlign))
    main.push({ value: '公式后的文字\n' })
    main.push({
      type: ElementType.CONTROL,
      value: '',
      control: {
        type: ControlType.TEXT,
        placeholder: '请输入',
        value: [
          { value: '控件：图片前的文字' },
          alignedImage(verticalAlign),
          { value: '图片后的文字' }
        ]
      }
    })
    main.push({ value: '\n' })
  })
  return { main }
}

const ui = createEditorUI('#app', {
  data: createData(),
  statusbar: PLAYGROUND_STATUSBAR
})
registerInsertControlMenu(ui)
const editor = ui.editor

// 先按无浮动图片排版，再取锚点文字的页面坐标放置浮动图片
function getFloatPositionMap() {
  const { scale } = editor.command.getOptions()
  const floatPositionMap: Record<string, IFloatPosition> = {}
  DEMO_LIST.filter(demo => FLOAT_DISPLAYS.includes(demo.display)).forEach(
    demo => {
      ;[false, true].forEach(inControl => {
        const anchor = anchorText(demo, inControl)
        const position = editor.command.getKeywordContext(anchor)?.[0]
          ?.startPosition
        if (!position) return
        const [x, y] = position.coordinate.leftTop
        floatPositionMap[anchor] = {
          pageNo: position.pageNo,
          x: x / scale + (demo.offsetX || 0),
          y: y / scale
        }
      })
    }
  )
  return floatPositionMap
}

editor.command.executeSetValue(createData(getFloatPositionMap()))

Object.assign(window, { ui, editor })
