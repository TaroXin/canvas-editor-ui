import { ControlComponent, EditorMode } from '@baohu/canvas-editor'
import { ControlPanel, DEFAULT_STATUSBAR } from '@baohu/canvas-editor-ui'
import type { EditorUI, IStatusbarItem } from '@baohu/canvas-editor-ui'

// 状态栏开启编辑模式切换，仅用于演示。
// 实际接入时状态栏默认不提供该入口，需通过代码切换：ui.setMode(EditorMode.DESIGN)
export const PLAYGROUND_STATUSBAR: IStatusbarItem[] = [...DEFAULT_STATUSBAR, 'mode']

// 设计模式下右键插入控件，与「控件属性」共用控件面板
export function registerInsertControlMenu(ui: EditorUI) {
  ui.editor.register.contextMenuList([
    {
      name: ui.locale.controlAdd,
      when: payload => {
        const { startElement } = payload
        // 控件内部不允许新增（避免嵌套），光标在控件后缀上时插入到控件之后
        const isInControl =
          !!startElement?.controlId &&
          startElement.controlComponent !== ControlComponent.POSTFIX
        return (
          payload.options.mode === EditorMode.DESIGN &&
          payload.editorTextFocus &&
          !isInControl
        )
      },
      callback: () => {
        new ControlPanel({ editor: ui.editor, locale: ui.locale })
      }
    }
  ])
}
