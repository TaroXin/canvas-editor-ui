# @baohu/canvas-editor-ui

[`@baohu/canvas-editor`](https://www.npmjs.com/package/@baohu/canvas-editor) 的工具栏、状态栏和弹窗，不依赖任何框架。

## 安装

```bash
npm i @baohu/canvas-editor @baohu/canvas-editor-ui
```

## 使用

编辑器会撑满容器，容器需要有确定的高度。

```js
import { createEditorUI } from '@baohu/canvas-editor-ui'

const ui = createEditorUI('#app', {
  data: { main: [{ value: 'Hello' }] }, // 文档数据
  options: { defaultSize: 16 }          // canvas-editor 配置
})

ui.editor.command.getValue()  // 编辑器实例
ui.destroy()                  // 销毁
```

### script 直接引入

```html
<div id="app" style="height: 600px"></div>
<script src="https://unpkg.com/@baohu/canvas-editor/dist/canvas-editor.umd.cjs"></script>
<script src="https://unpkg.com/@baohu/canvas-editor-ui"></script>
<script>
  var ui = CanvasEditorUI.createEditorUI('#app', { data: { main: [] } })
</script>
```

先引入编辑器核心（全局变量 `window['canvas-editor']`），再引入本包（全局变量 `CanvasEditorUI`）。编辑器核心的 UMD 文件后缀是 `.cjs`，jsDelivr 返回的 Content-Type 不是 JavaScript，浏览器会拒绝执行，请使用 unpkg 或自行部署。

## 配置

| 参数 | 类型 | 说明 |
|---|---|---|
| `data` | `IEditorData \| IElement[]` | 文档数据 |
| `options` | `IEditorOption` | canvas-editor 配置 |
| `toolbar` | `IToolbarItem[] \| false` | 工具栏按钮，`false` 隐藏；默认 `DEFAULT_TOOLBAR` |
| `statusbar` | `IStatusbarItem[] \| false` | 状态栏项目，`false` 隐藏；默认 `DEFAULT_STATUSBAR` |
| `locale` | `Partial<ILocale>` | 覆盖界面文案 |

### 工具栏

数组元素可以是内置按钮的 key、分隔线 `'|'`，或自定义按钮对象。

默认显示的按钮（`DEFAULT_TOOLBAR`）：`undo` `redo` `painter` `format` `font` `size` `sizeAdd` `sizeMinus` `bold` `italic` `underline` `strikeout` `superscript` `subscript` `color` `highlight` `title` `left` `center` `right` `alignment` `justify` `rowMargin` `list` `table` `image` `hyperlink` `separator` `pageBreak` `checkbox` `date` `search`

内置但默认不显示、需要时自行加入的按钮：`print`（打印）`pdf`（导出 PDF）

```js
createEditorUI('#app', {
  toolbar: [...DEFAULT_TOOLBAR, '|', 'print', 'pdf']
})
```

```js
import { DEFAULT_TOOLBAR, createEditorUI } from '@baohu/canvas-editor-ui'

createEditorUI('#app', {
  toolbar: [
    'undo', 'redo', '|', 'bold', 'italic', '|',
    {
      key: 'save',
      text: '保存',            // 或 icon: 图片地址
      title: '保存文档',
      keepEnabledInReadonly: true,
      onClick: ({ editor }) => save(editor.command.getValue().data),
      isActive: ({ style }) => false,     // 可选：高亮状态
      isDisabled: ({ style }) => false    // 可选：禁用状态
    }
  ]
})
```

### 状态栏

默认显示（`DEFAULT_STATUSBAR`）：`pageNo`（页码）`wordCount`（字数）`rowCol`（行列）`pageMode`（分页/连页）`scale`（缩放）`paperDirection`（纸张方向）`paperMargin`（页边距）`fullscreen`（全屏）

内置但默认不显示：`mode`（编辑模式切换，含编辑、清洁、只读、表单、打印、设计、涂鸦、留痕）。实际接入时一般不开放给用户，通过代码 `ui.setMode(mode)` 切换模式。

```js
createEditorUI('#app', {
  statusbar: [...DEFAULT_STATUSBAR, 'mode']
})
```

## 实例方法

| 方法 | 说明 |
|---|---|
| `ui.editor` | canvas-editor 实例 |
| `ui.setMode(mode)` | 切换编辑模式（直接调用 `editor.command.executeMode` 也会同步界面） |
| `ui.destroy()` | 销毁编辑器和界面 |

## 控件

右键菜单：

- 删除控件：`deletable: false` 的控件不显示该菜单，设计模式除外
- 控件属性：仅设计模式下，右键控件时显示，打开控件面板修改属性（不可修改控件类型）

控件面板按控件类型排版，分为基础、选项、规则校验、样式、高级几页，覆盖控件支持的全部属性（值集、多选、日期格式、可删除/禁用/必填、校验规则、背景色、计算表达式、级联规则、扩展数据等）。

工具栏不提供插入控件的按钮。面板已导出，可以接入自己的新增入口，例如设计模式下右键插入控件：

```js
import { ControlPanel } from '@baohu/canvas-editor-ui'

ui.editor.register.contextMenuList([
  {
    name: '新增控件',
    when: payload => payload.options.mode === 'design' && payload.editorTextFocus,
    callback: () => new ControlPanel({ editor: ui.editor, locale: ui.locale })
  }
])
```

`ControlPanel` 参数：`editor`、`locale`，新增时可传 `type` 指定默认类型；修改时传 `controlId` 和 `control`。

另外导出了 `Dialog`，可以用来做和内置弹窗风格一致的自定义弹窗。
