import { DEFAULT_TOOLBAR, createEditorUI } from '@baohu/canvas-editor-ui'
import docxPlugin from '@baohu/canvas-editor-plugin-docx'

const ui = createEditorUI('#app', {
  data: { main: [{ value: '点击工具栏右侧的「导入 Word」，或把 .docx 文件拖到页面上。' }] },
  toolbar: [
    ...DEFAULT_TOOLBAR,
    '|',
    { key: 'importDocx', text: '导入 Word', title: '导入 .docx 文件', onClick: () => fileInput.click() },
    {
      key: 'exportDocx',
      text: '导出 Word',
      title: '导出为 .docx 文件',
      keepEnabledInReadonly: true,
      onClick: ({ editor }) => editor.command.executeExportDocx({ fileName: 'canvas-editor' })
    }
  ]
})
const editor = ui.editor
editor.use(docxPlugin)

const message = document.querySelector<HTMLElement>('#message')!
function showMessage(text: string, isError = false) {
  message.textContent = text
  message.className = isError ? 'message error' : 'message'
  message.hidden = !text
}

async function importDocx(file: File) {
  showMessage(`正在导入 ${file.name}…`)
  try {
    // 返回 Promise，解析失败时 reject
    await editor.command.executeImportDocx({ arrayBuffer: await file.arrayBuffer() })
    showMessage('')
  } catch (error) {
    console.error(error)
    showMessage(`导入失败：${(error as Error).message}`, true)
  }
}

const fileInput = document.createElement('input')
fileInput.type = 'file'
fileInput.accept = '.docx'
fileInput.onchange = () => {
  const file = fileInput.files?.[0]
  fileInput.value = ''
  if (file) importDocx(file)
}

// 拖拽导入
document.addEventListener('dragover', evt => evt.preventDefault())
document.addEventListener('drop', evt => {
  const file = evt.dataTransfer?.files[0]
  if (!file || !/\.docx$/i.test(file.name)) return
  evt.preventDefault()
  importDocx(file)
})

Object.assign(window, { ui, editor })
