---
name: artwork-destruction-tool
description: >
  Analyze user-provided images into structured visual deconstruction reports and
  send them to a local Artwork Destruction Tool instance at http://localhost:5173.
  Use this skill when the user wants to build the local visual element library,
  batch import images, or connect Codex image analysis to Artwork Destruction Tool.
---

# Artwork Destruction Tool Bridge

This skill turns one or more user-provided images into records for Artwork Destruction Tool.

## Workflow

1. Analyze each image as a reusable visual system, not as a simple caption.
2. Produce a Chinese visual deconstruction report.
3. Convert the report into the JSON schema below.
4. Send each record to:

```text
POST http://localhost:5173/api/records
Content-Type: application/json
```

Use `scripts/post-record.mjs` when a JSON file is available:

```bash
node scripts/post-record.mjs record.json
```

The script also accepts stdin:

```bash
node scripts/post-record.mjs < record.json
```

## JSON Schema

```json
{
  "title": "中文任务标题",
  "imageName": "source-image.png",
  "imageDataUrl": "data:image/png;base64,...",
  "source": "artwork-destruction-tool-skill",
  "rawReport": "完整中文视觉解构报告",
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
            "effect": "视觉效果或情绪意义",
            "promptFragment": "中文可迁移视觉语言"
          }
        ]
      }
    ],
    "styleTags": ["中文风格标签"],
    "emotionTags": ["中文情绪标签"],
    "visualFormula": "主体 A + 材质 B + 构图 C + 色彩 D + 字体 E + 纹理 F + 情绪 G",
    "negativeAdvice": ["不要照抄原图", "不要复制可识别细节"]
  }
}
```

## Section IDs

Prefer these stable section ids:

- `subject` - 画面主体
- `supporting` - 附属元素
- `composition` - 构图与视觉动线
- `color` - 色彩系统
- `lighting` - 光影
- `material` - 材质与纹理
- `typography` - 字体与排版
- `symbols` - 图形符号与界面元素
- `style` - 风格来源
- `emotion` - 情绪与意义
- `tension` - 矛盾关系
- `layers` - 图层结构

## Rules

- `promptFragment` must be Chinese only.
- Do not add a separate English version.
- Do not write prompts that ask to copy, imitate, or reproduce the original image.
- Extract transferable visual language: composition, color, texture, material, typography, symbol systems, atmosphere, and emotional mechanism.
- Do not preserve identifiable people, characters, brands, exact text, or proprietary layout details from the original.
- If the local server is not running, tell the user to start Artwork Destruction Tool and retry the POST.

