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

预览站点包含以下页面：

- **原生 JS（ESM）**：`import { createEditorUI }`，直接引用源码，修改后热更新
- **script 引入**：加载构建后的 UMD 文件，与发布到 npm 的产物一致
- **Vue 2**：`Vue.use()` 后使用 `<canvas-editor>` 组件
- **Vue 2（script 引入）**：页面已有全局 `Vue` 时，引入后自动注册组件
- **Word 导入**：通过 [`@baohu/canvas-editor-plugin-docx`](https://www.npmjs.com/package/@baohu/canvas-editor-plugin-docx) 导入、导出 .docx，可点击工具栏按钮选择文件，也可以直接把文件拖到页面上

修改 `packages/*/src` 后，ESM 页面会热更新；两个 script 页面需要重新执行 `pnpm build`。

### 调试本地 docx 插件

Word 导入页默认使用 npm 上的 `@baohu/canvas-editor-plugin-docx`。要试未发布的本地修改，在 `playground/.env.local` 中写入插件包目录：

```bash
LOCAL_DOCX_PLUGIN=../../canvas-editor-plugin/packages/docx
```

重启 `pnpm dev` 后直接引用插件源码，修改后热更新。`.env.local` 不会提交，删除该文件即恢复使用 npm 版本，`package.json` 和锁文件都不受影响。

## 常用命令

```bash
pnpm build        # 构建所有包
pnpm type:check   # 类型检查
pnpm lint         # ESLint 检查（规则与 @baohu/canvas-editor 一致）
```

## 发布

版本号只在根目录 `package.json` 维护，`packages/` 下所有包统一版本、统一发布，不需要手动改版本号。包之间的依赖写作 `workspace:*`，发布时替换为相同的版本号。

```bash
pnpm release patch             # 1.1.0 -> 1.1.1，也可以是 minor / major / 具体版本号
pnpm release minor --dry-run   # 试运行：构建并打包，不发布、不提交
```

`pnpm release` 依次执行：

1. 检查工作区干净且在 `main` 分支
2. 递增根目录版本号，同步到所有包
3. lint、类型检查、构建
4. 提示输入 npm 验证码后发布所有包
5. 提交 `chore: release x.y.z`、打 tag `vx.y.z` 并推送

任一步失败都会还原版本号。部分包已发布后失败的，用同一个版本号重跑（如 `pnpm release 1.1.1`），已发布的包会自动跳过。新增的包放在 `packages/` 下即会一起发布。

## 目录结构

```
packages/
  ui/          核心界面（工具栏、状态栏、弹窗、下拉面板）
  vue2/        Vue 2 组件
playground/    预览站点
```

以后要支持其他框架（Vue 3、React 等），在 `packages/` 下新增一个包，基于 `@baohu/canvas-editor-ui` 的 `EditorUI` 做一层封装即可。
