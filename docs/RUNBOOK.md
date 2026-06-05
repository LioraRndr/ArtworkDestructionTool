# Runbook

## 安装

Windows:

```powershell
irm https://raw.githubusercontent.com/LioraRndr/ArtworkDestructionTool/main/install.ps1 | iex
```

macOS / Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/LioraRndr/ArtworkDestructionTool/main/install.sh | bash
```

安装脚本会安装本地应用、初始化 `data/`、安装 `artwork-destruction-tool` skill，并检测 `gpt-image` CLI。

安装脚本不会安装 Codex、Claude Code 或其他 agent 客户端。资料库入库阶段需要用户自备一个能读取图片、使用本地 skill、并访问 `http://localhost:5173/api/records` 的 agent。Codex、Claude Code 或其他具备同等能力的 agent 都可以。

第二阶段的词条选择、提示词组合和图片生成可以直接在本地前端完成，不依赖 agent。

## 启动

```powershell
npm start
```

或双击桌面快捷方式：

```text
%USERPROFILE%\Desktop\Artwork Destruction Tool.lnk
```

快捷方式会执行：

```powershell
<install-dir>\Start-ArtworkDestructionTool.ps1
```

## 自动更新

通过启动脚本启动时（Windows 的 `Start-ArtworkDestructionTool.ps1`、macOS/Linux 的 `start.sh`），会在 `npm start` 之前自动执行一次 `git pull --ff-only`，把本地代码更新到 GitHub 最新版。

- 仅当安装目录是 git 仓库、且系统装了 git 时才会拉取；否则跳过。
- 拉取失败（离线、无法快进、有本地改动等）会被忽略，不影响正常启动，只在控制台打印一行提示。
- `data/` 是 gitignored 的，更新不会动你的资料库和生成历史。
- 直接用 `npm start` 启动**不会**触发自动更新；只有走启动脚本/桌面快捷方式才会。
- 服务已经在运行时再点快捷方式，只会打开浏览器、不会拉取；要让更新生效需要先关掉服务再重新启动。

## 环境变量

| 变量 | 用途 |
|---|---|
| `PORT` | 覆盖默认端口 `5173` |
| `OPENAI_API_KEY` | 图片生成 API Key；前端也可临时填写 |
| `OPENAI_BASE_URL` | 自定义 OpenAI 兼容端点；前端也可临时填写 |

Base URL 使用第三方供应商时通常需要以 `/v1` 结尾。

## 冒烟检查

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5173/
Invoke-WebRequest -UseBasicParsing http://localhost:5173/api/records
Invoke-WebRequest -UseBasicParsing http://localhost:5173/api/generations
npm run check
```

## 常见问题

### 前端刷新后表单内容消失

前端表单状态保存在浏览器 `localStorage`，key 以 `adt.` 开头。若清空浏览器站点数据，主题、Base URL、API Key、尺寸、质量、组合提示词和预置都会被清除。

### API Key 的存储与安全提示

为了免去每次重填，前端会把你在“API Key”输入框里填的内容**明文保存在浏览器 `localStorage`（key 为 `adt.generationApiKey`）**。这意味着：

- 任何能打开这个浏览器、或读取该站点 `localStorage` 的人都能看到这把 Key。
- 不要在公用电脑或共享浏览器里长期保存 Key。
- 更安全的做法是**不在前端填 Key**，改用环境变量 `OPENAI_API_KEY`（见上方环境变量表）；前端留空时会自动回退到环境变量。
- 想清掉已保存的 Key：清空输入框内容并触发一次保存，或在浏览器开发者工具里删除 `adt.generationApiKey`，或清空该站点数据。

此外，本地服务默认不做鉴权。如果你在不可信网络（如公共 WiFi）下运行，建议只在本机访问，不要把端口暴露到外网。

### 资料库图片显示“无图 / 暂无原图”

前端预览只显示记录里的 `imageDataUrl` 字段，这个字段要靠入库阶段的 agent 把原图转成 base64 一并 POST 进来。是否带得上，取决于你怎么把图给 agent：

- **拖拽图片文件**给 agent：agent 拿到的是本地文件，能读出来转成 base64，入库后前端正常显示原图。
- **直接粘贴图片**给 agent：图片只贴在对话里、没有落地成文件，agent 的文件工具读不到它，于是 `imageDataUrl` 为空，前端就显示“无图”。这不是 bug，是粘贴这种输入方式的固有限制。

两种补救方式，任选其一：

1. 入库时尽量**用拖拽文件**，不要用粘贴。
2. 入库后在前端**手动补传原图**：先在资料库里点选那张资料，然后在“当前原图”区域点“上传 / 替换原图”，或直接把图片**拖拽到左侧预览框**，或在页面空白处**粘贴**（光标不在输入框时）。补传只更新这条记录的原图，不影响已解构的词条。

### 生成失败并返回 HTTP 405

优先检查：

1. 前端“上传资料库原图作为参考图”是否关闭。
2. Base URL 是否以 `/v1` 结尾。
3. 供应商是否支持 `gpt-image-2` 的 images generations。
4. 若必须上传参考图，供应商还必须支持 images edits。

原因：`gpt-image` CLI 一旦带参考图 `-i`，会从 `/v1/images/generations` 切换到 `/v1/images/edits`。

### 生成失败但原因不清楚

右侧生成预览区会显示后端诊断信息，包括 `stderr`、`stdout`、`primaryError` 和运行配置摘要。不要只看顶部状态栏。

### 页面没更新

服务端对静态资源设置了 `cache-control: no-store`。如果浏览器仍显示旧页面，使用 `Ctrl+F5` 强制刷新。

### 改了 server.js 后没有生效

需要重启本地服务。前端代码和样式刷新即可生效，服务端代码必须重启进程。
