# canvas-editor-ui

[`@baohu/canvas-editor`](https://www.npmjs.com/package/@baohu/canvas-editor) 的界面层：工具栏、状态栏、弹窗，以及各框架的封装组件。

| 包 | 说明 |
|---|---|
| [`@baohu/canvas-editor-ui`](./packages/ui) | 核心界面，不依赖任何框架；支持 ESM 和 `<script>` 直接引入 |
| [`@baohu/canvas-editor-vue2`](./packages/vue2) | Vue 2 组件（兼容 2.6 / 2.7） |

所有产物都以 ES2019 为目标构建，webpack 4（acorn 6）可以直接解析，无需 babel 转译。

## 本地预览

```bash
pnpm install
pnpm dev        # 先构建各个包，再启动预览站点 http://localhost:5180
```

预览站点包含四个页面：

- **原生 JS（ESM）**：`import { createEditorUI }`，直接引用源码，修改后热更新
- **script 引入**：加载构建后的 UMD 文件，与发布到 npm 的产物一致
- **Vue 2**：`Vue.use()` 后使用 `<canvas-editor>` 组件
- **Vue 2（script 引入）**：页面已有全局 `Vue` 时，引入后自动注册组件

修改 `packages/*/src` 后，ESM 页面会热更新；两个 script 页面需要重新执行 `pnpm build`。

## 常用命令

```bash
pnpm build        # 构建所有包
pnpm type:check   # 类型检查
```

## 目录结构

```
packages/
  ui/          核心界面（工具栏、状态栏、弹窗、下拉面板）
  vue2/        Vue 2 组件
playground/    预览站点
```

以后要支持其他框架（Vue 3、React 等），在 `packages/` 下新增一个包，基于 `@baohu/canvas-editor-ui` 的 `EditorUI` 做一层封装即可。
