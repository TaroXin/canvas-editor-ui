import { DEFAULT_TOOLBAR, createEditorUI } from '@baohu/canvas-editor-ui'
import type { IEditorData } from '@baohu/canvas-editor'

const data = (window as unknown as { SAMPLE_DATA: IEditorData }).SAMPLE_DATA

const ui = createEditorUI('#app', {
  data,
  // 在默认按钮后追加自定义按钮
  toolbar: [
    ...DEFAULT_TOOLBAR,
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
  ]
})

Object.assign(window, { ui, editor: ui.editor })
