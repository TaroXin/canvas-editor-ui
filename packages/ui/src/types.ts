import type Editor from '@baohu/canvas-editor'
import type {
  IEditorData,
  IEditorOption,
  IElement,
  IRangeStyle
} from '@baohu/canvas-editor'
import type { EditorUI } from './EditorUI'
import type { ILocale } from './locale'

export interface IToolbarContext {
  editor: Editor
  ui: EditorUI
  locale: ILocale
  // 当前光标处样式，编辑器尚未回传时为 null
  style: IRangeStyle | null
}

export interface IToolbarButton {
  key: string
  title?: string
  // 图标地址（url / data uri）
  icon?: string
  // 无图标时显示的文字
  text?: string
  onClick?: (ctx: IToolbarContext, el: HTMLElement) => void
  isActive?: (ctx: IToolbarContext) => boolean
  isDisabled?: (ctx: IToolbarContext) => boolean
  // 完全自定义渲染（如下拉框），返回的元素会放入工具栏
  render?: (ctx: IToolbarContext) => HTMLElement
  // 自定义渲染时的状态同步
  update?: (ctx: IToolbarContext, el: HTMLElement) => void
  // 只读等模式下仍可使用（如打印、导出）
  keepEnabledInReadonly?: boolean
}

// 字符串为内置按钮的 key，'|' 为分隔线
export type IToolbarItem = string | IToolbarButton

export type IStatusbarItem =
  | 'pageNo'
  | 'wordCount'
  | 'rowCol'
  | 'pageMode'
  | 'scale'
  | 'paperDirection'
  | 'mode'
  | 'fullscreen'

export interface IEditorUIOptions {
  // 文档数据
  data?: IEditorData | IElement[]
  // 编辑器配置，透传给 canvas-editor
  options?: IEditorOption
  // 工具栏按钮，false 隐藏工具栏
  toolbar?: IToolbarItem[] | false
  // 状态栏项目，false 隐藏状态栏
  statusbar?: IStatusbarItem[] | false
  // 覆盖界面文案
  locale?: Partial<ILocale>
}
