import { DEFAULT_TOOLBAR, createEditorUI } from '@baohu/canvas-editor-ui'
import type { IEditorData } from '@baohu/canvas-editor'
import { PLAYGROUND_STATUSBAR, registerInsertControlMenu } from './common'

const data = (window as unknown as { SAMPLE_DATA: IEditorData }).SAMPLE_DATA

const ui = createEditorUI('#app', {
  data,
  // 默认按钮 + 默认不显示的内置按钮（打印、导出 PDF）+ 自定义按钮
  toolbar: [
    ...DEFAULT_TOOLBAR,
    '|',
    'print',
    'pdf',
    '|',
    {
      key: 'save',
      text: '保存',
      title: '打印 JSON 到控制台',
      keepEnabledInReadonly: true,
      onClick: ({ editor }) => {
        console.log(JSON.stringify(editor.command.getValue().data))
      }
    }
  ],
  // 默认状态栏 + 编辑模式切换
  statusbar: PLAYGROUND_STATUSBAR
})
registerInsertControlMenu(ui)

Object.assign(window, { ui, editor: ui.editor })
