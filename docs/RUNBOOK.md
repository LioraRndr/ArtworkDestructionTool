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
