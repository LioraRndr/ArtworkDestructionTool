# API

本地服务默认运行在：

```text
http://localhost:5173
```

所有 JSON 响应使用 UTF-8。静态资源和 API 响应都设置 `cache-control: no-store`，便于本地开发时刷新立即生效。

## 路由

| Method | Path | 用途 |
|---|---|---|
| `GET` | `/api/records` | 读取图片解构资料库 |
| `POST` | `/api/records` | 写入一条图片解构资料 |
| `DELETE` | `/api/records/:id` | 删除一条图片解构资料 |
| `GET` | `/api/generations` | 读取生成历史 |
| `POST` | `/api/generate` | 调用 `gpt-image` CLI 生成图片 |
| `GET` / `HEAD` | `/*` | 读取 `public/` 静态资源 |

## POST /api/records

用于让 Codex 把 `image-deconstruction` skill 的结果写入资料库。

```json
{
  "title": "任务标题",
  "imageName": "source-image.png",
  "imageDataUrl": "data:image/png;base64,...",
  "source": "codex-image-deconstruction-skill",
  "rawReport": "完整中文解构报告",
  "analysis": {
    "overview": "一句话总览",
    "imageInfo": {
      "ratio": "图片比例",
      "type": "图像类型",
      "texture": "清晰度与质感",
      "density": "视觉密度",
      "tone": "整体调性",
      "firstFocus": "第一眼视觉中心"
    },
    "sections": [
      {
        "id": "subject",
        "title": "画面主体",
        "items": [
          {
            "name": "要素短名称",
            "observation": "客观观察",
            "effect": "视觉效果或情绪",
            "promptFragment": "中文可迁移视觉语言"
          }
        ]
      }
    ],
    "styleTags": ["风格标签"],
    "emotionTags": ["情绪标签"],
    "visualFormula": "主体 A + 材质 B + 构图 C + 色彩 D + 字体 E + 纹理 F + 情绪 G",
    "negativeAdvice": ["不要照抄原图", "不要复制可识别细节"]
  }
}
```

`promptFragment` 必须使用中文，不要额外给英文版本，也不要包含“复制原图”“照抄原图”或原图专属身份。

## POST /api/generate

前端组合提示词后调用。服务端通过 `gpt-image` 或 `uv run <skill>/scripts/generate.py` 调用 `gpt-image-2`。

```json
{
  "apiKey": "可选；也可以用 OPENAI_API_KEY",
  "baseUrl": "可选；也可以用 OPENAI_BASE_URL",
  "title": "资料库融合生成",
  "theme": "本次创作主题",
  "template": "模板说明",
  "prompt": "组合后的完整中文提示词",
  "selectedEntries": [],
  "sourceRecordIds": [],
  "referenceImages": [],
  "imageModel": "gpt-image-2",
  "size": "1536x864",
  "sizeLabel": "16:9",
  "quality": "auto"
}
```

### 参考图模式

- `referenceImages: []` 时走 `/v1/images/generations`。
- `referenceImages` 非空时 CLI 会追加 `-i`，走 `/v1/images/edits`。
- 第三方兼容端点经常只支持 generations，不支持 edits；遇到 HTTP 405 时先关闭前端“上传资料库原图作为参考图”。

### 尺寸规则

前端比例预设会转换成像素：

| 预设 | 实际尺寸 |
|---|---|
| `1:1` | `1024x1024` |
| `16:9` | `1536x864` |
| `9:16` | `864x1536` |
| `4:3` | `1536x1152` |
| `3:4` | `1152x1536` |
| `3:2` | `1536x1024` |
| `2:3` | `1024x1536` |
| `21:9` | `1792x768` |

自定义尺寸必须满足：

- 格式为 `宽x高`，例如 `1024x1024`。
- 宽高都是 16 的倍数。
- 最长边不超过 `3840`。
- 宽高比不超过 `3:1`。

## 错误诊断

`POST /api/generate` 失败时，响应会包含：

```json
{
  "error": "错误摘要",
  "backend": "gpt-image 或 uv run gpt-image skill launcher",
  "config": {
    "model": "gpt-image-2",
    "size": "1536x864",
    "quality": "auto",
    "baseUrl": "custom",
    "referenceCount": 0
  },
  "stdout": "...",
  "stderr": "...",
  "primaryError": "..."
}
```

