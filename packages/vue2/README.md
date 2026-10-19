# @baohu/canvas-editor-vue2

[`@baohu/canvas-editor`](https://www.npmjs.com/package/@baohu/canvas-editor) 的 Vue 2 组件，带工具栏和状态栏。兼容 Vue 2.6 / 2.7。

## 安装

```bash
npm i @baohu/canvas-editor @baohu/canvas-editor-vue2
```

## 使用

```js
import Vue from 'vue'
import CanvasEditorVue2 from '@baohu/canvas-editor-vue2'

Vue.use(CanvasEditorVue2)   // 注册 <canvas-editor>
```

```vue
<template>
  <div style="height: 600px">
    <canvas-editor ref="editor" :data="doc" @ready="onReady" @change="onChange" />
  </div>
</template>

<script>
export default {
  data: () => ({ doc: { main: [{ value: 'Hello' }] } }),
  methods: {
    onReady(editor) {},
    onChange() {
      const { data } = this.$refs.editor.getValue()
    }
  }
}
</script>
```

也可以只在单个组件里注册：`import { CanvasEditor } from '@baohu/canvas-editor-vue2'`。

### script 直接引入

页面已有全局 `Vue` 时，引入后会自动注册 `<canvas-editor>`：

```html
<script src="https://unpkg.com/vue@2.7.16/dist/vue.min.js"></script>
<script src="https://unpkg.com/@baohu/canvas-editor/dist/canvas-editor.umd.cjs"></script>
<script src="https://unpkg.com/@baohu/canvas-editor-ui"></script>
<script src="https://unpkg.com/@baohu/canvas-editor-vue2"></script>
```

## Props

| 名称 | 类型 | 说明 |
|---|---|---|
| `data` | `IEditorData \| IElement[]` | 初始文档数据，只在创建时读取；之后用 `setValue` 修改 |
| `options` | `IEditorOption` | canvas-editor 配置 |
| `toolbar` | `IToolbarItem[] \| false` | 工具栏按钮，见 `@baohu/canvas-editor-ui` |
| `statusbar` | `IStatusbarItem[] \| false` | 状态栏项目 |
| `locale` | `Partial<ILocale>` | 覆盖界面文案 |
| `height` | `string \| number` | 组件高度，默认 `100%` |

## 事件

| 名称 | 参数 | 说明 |
|---|---|---|
| `ready` | `(editor, ui)` | 编辑器创建完成 |
| `change` | — | 文档内容变化 |
| `range-style-change` | `(style)` | 光标处样式变化 |

## 方法（通过 ref 调用）

| 方法 | 说明 |
|---|---|
| `getEditor()` | canvas-editor 实例 |
| `getUI()` | `EditorUI` 实例 |
| `getValue()` | 等同 `editor.command.getValue()` |
| `setValue(data)` | 替换文档内容 |
