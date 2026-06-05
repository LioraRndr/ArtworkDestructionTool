# AGENTS.md

## 编码前置检查

1. 修改任何已有文件前，必须先确认该文件当前编码。
2. 编码未确认时禁止写入；只能读取并提示确认编码。
3. 写回时保持原文件编码，不要擅自转换。
4. 禁止对未知编码文件做高风险整文件重写。
5. 若发现常见 mojibake 乱码特征，立即停止修改并先处理编码问题。

## 项目结构

```text
server.js                         本地 HTTP 服务和 API
public/index.html                 前端结构
public/app.js                     前端状态、资料库、提示词和生成逻辑
public/styles.css                 前端样式
CODEX_BRIDGE.md                   Codex 入库 payload 约定
docs/API.md                       本地 API 文档
docs/RUNBOOK.md                   运行和故障排查
skills/artwork-destruction-tool/  随包 Codex/Agent skill
install.ps1 / install.sh          GitHub 一键安装入口
Start-ArtworkDestructionTool.ps1  Windows 快捷方式启动脚本
data/                             本地资料库和生成历史
```

## 运行

```powershell
npm start
npm run check
```

默认端口是 `5173`，可用 `PORT` 环境变量覆盖。

## 生成链路注意事项

- 图片生成固定使用 `gpt-image-2`，不要重新引入前端模型输入框。
- `OPENAI_API_KEY` 和 `OPENAI_BASE_URL` 可以来自环境变量，也可以从前端临时输入。
- 前端的 Base URL 只传给后端运行时环境，不写入项目文件。
- 默认不要上传资料库原图作为参考图；第三方兼容端点经常不支持 `/v1/images/edits`。
- 若用户遇到 HTTP 405，先确认“上传资料库原图作为参考图”是否关闭，再检查 Base URL 是否以 `/v1` 结尾。

## 持久化

- 服务端资料库在 `data/records.json`。
- 服务端生成历史在 `data/generations.json` 和 `data/generated/`。
- 前端表单、选择状态和预置使用浏览器 `localStorage`，相关 key 统一以 `adt.` 开头。

## 发布注意事项

- 不要提交 `data/`、`.env`、生成图片或用户上传图片。
- 随包 skill 的公开入口是 `skills/artwork-destruction-tool/SKILL.md`。
- 安装脚本中的 GitHub 仓库 URL 和 README 一键安装命令必须保持一致。
