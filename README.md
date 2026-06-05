# Artwork Destruction Tool

这是一个本地图片解构资料库和提示词组合工具，使用模型gpt-image-2。

> 🚀 **第一次用？先看 [快速上手（新手指南）](docs/快速上手.md)，从零一步步走通安装、入库、选词和生成。**


第一阶段由 Codex、Claude Code 或其他任何 agent 使用仓库里的 artwork-destruction-tool skill 分析图片并写入本地资料库；

第二阶段在前端跨图片勾选词条，组合中文提示词，并可调用 `gpt-image` CLI 生成新图。

## 依赖说明

本项目的一键安装脚本会安装本地 Web 应用、随包 `artwork-destruction-tool` skill 和可选的 `gpt-image` CLI。`gpt-image` CLI 来自 [wuyoscar/gpt_image_2_skill](https://github.com/wuyoscar/gpt_image_2_skill)，用于第二阶段调用 `gpt-image-2` 生成图片。

安装脚本不会安装 Codex、Claude Code 或其他 agent 客户端。

阶段划分：

- 阶段一，资料库入库：需要用户自备 Codex、Claude Code 或其他 agent。这个 agent 主要功能就是读取并分析图片、按 skill 生成结构化中文解构报告，并把 JSON POST 到本地 `http://localhost:5173/api/records`。
- 阶段二，选词与生成：可以脱离 agent，直接在本地前端里选择词条、组合提示词，并通过 API Key / Base URL 调用图片生成。

## 一键安装

Windows:

```powershell
irm https://raw.githubusercontent.com/LioraRndr/ArtworkDestructionTool/main/install.ps1 | iex
```

macOS / Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/LioraRndr/ArtworkDestructionTool/main/install.sh | bash
```

安装脚本会：

- 下载或更新本地应用。
- 初始化 `data/` 数据目录。
- 安装 `skills/artwork-destruction-tool` 到 `~/.agents/skills/artwork-destruction-tool`。
- 检测并尽量安装来自 [wuyoscar/gpt_image_2_skill](https://github.com/wuyoscar/gpt_image_2_skill) 的 `gpt-image` CLI。
- Windows 上创建桌面快捷方式。

## 本地启动

```powershell
npm start
```

默认地址：

```text
http://localhost:5173/
```

Windows 桌面快捷方式会创建在当前用户桌面：

```text
%USERPROFILE%\Desktop\Artwork Destruction Tool.lnk
```

快捷方式执行安装目录下的 `Start-ArtworkDestructionTool.ps1`。

## 主要能力

- 资料库：接收 Codex、Claude Code 或其他 agent POST 的图片解构报告，保存到 `data/records.json`。
- 词条选择：按资料图、分类、词条多选，并把选择状态保存到浏览器 `localStorage`。
- 预置：把一组跨图片词条选择保存为本地预置。
- 提示词组合：把选中词条组合成中文生成提示词，并明确要求不仿照、不照抄原图。
- 图片生成：通过 `gpt-image` CLI 调用 `gpt-image-2`，生成历史保存到 `data/generations.json`。

## 生成设置

- 模型固定为 `gpt-image-2`。
- API Key 可以在前端填写，也可以通过 `OPENAI_API_KEY` 环境变量提供。
- Base URL 可以在前端填写，也可以通过 `OPENAI_BASE_URL` 环境变量提供；第三方兼容端点通常需要以 `/v1` 结尾。
- 默认不上传资料库原图作为参考图。保持关闭时走 `/v1/images/generations`；开启后会携带参考图并走 `/v1/images/edits`。
- 尺寸支持比例预设和自定义像素。自定义像素必须是 `宽x高`，宽高均为 16 的倍数，最长边不超过 3840，宽高比不超过 3:1。

## 数据文件

```text
data/records.json       图片解构资料库
data/generations.json   图片生成历史
data/generated/         生成图片文件
data/tmp/               参考图临时文件
```

## 文档

- [快速上手](docs/快速上手.md)：新手从零走通安装、入库、选词和生成。
- [Codex Bridge](CODEX_BRIDGE.md)：Codex 传输 payload 约定。
- [API](docs/API.md)：本地接口、生成参数和尺寸规则。
- [Runbook](docs/RUNBOOK.md)：启动、环境变量、排错。

## 随包 Skill

仓库内置 skill：

```text
skills/artwork-destruction-tool/SKILL.md
```

安装后可在 Codex、Claude Code 或其他 agent 中使用它把图片解构结果 POST 到本地资料库。helper 脚本支持从 JSON 文件或 stdin 推送：

```bash
node skills/artwork-destruction-tool/scripts/post-record.mjs record.json
```
