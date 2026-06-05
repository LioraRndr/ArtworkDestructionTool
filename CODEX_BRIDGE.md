# Codex Bridge

这个页面分为两个阶段：

1. 资料库阶段：图片分析由 Codex 完成，然后把结构化结果推送到本地服务。
2. 生成阶段：前端从资料库里跨图片勾选词条，组合 prompt，再由本地服务直接调用 OpenAI 图片生成 API。

## 推送地址

```text
POST http://localhost:5173/api/records
Content-Type: application/json
```

## Payload

```json
{
  "title": "任务标题",
  "imageName": "source-image.png",
  "imageDataUrl": "data:image/png;base64,...",
  "source": "codex-image-deconstruction-skill",
  "rawReport": "可选：完整中文解构报告",
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
            "promptFragment": "中文词条：可迁移到提示词的视觉语言，不要额外给英文版本"
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

## Workflow

1. 用户在 Codex 对话里上传图片。
2. Codex 使用 `image-deconstruction` skill 对图片做视觉解构。
3. Codex 将解构结果整理成上面的 JSON。
4. Codex POST 到 `/api/records`。
5. 前端每 3 秒自动刷新，收到新任务后显示在资料库列表中。
6. 服务端把所有记录保存到 `data/records.json`，下次打开页面仍可查看。

## Generation Workflow

1. 用户在前端从多张资料图中勾选词条。
2. 前端按主题、模板、词条、限制语组合完整 prompt。
3. 前端 POST 到 `/api/generate`。
4. 服务端调用 `gpt-image` CLI，固定使用 `gpt-image-2` 生成图片。
5. 服务端将生成结果保存到 `data/generations.json`。
6. 前端展示最新生成图和生成历史。

默认只发送组合后的提示词，不上传资料库原图。只有前端勾选“上传资料库原图作为参考图”时，`referenceImages` 才会非空，CLI 才会走 images edits。

## Generate Payload

```json
{
  "apiKey": "可选；也可以用环境变量 OPENAI_API_KEY",
  "baseUrl": "可选；也可以用环境变量 OPENAI_BASE_URL",
  "title": "资料库融合生成",
  "theme": "本次创作主题",
  "template": "模板说明",
  "prompt": "组合后的完整生成提示词",
  "selectedEntries": [
    {
      "recordId": "资料图 id",
      "recordTitle": "资料图标题",
      "section": "色彩系统",
      "name": "低饱和冷色",
      "promptFragment": "使用低饱和冷色背景配合局部高亮"
    }
  ],
  "sourceRecordIds": ["资料图 id"],
  "referenceImages": [],
  "imageModel": "gpt-image-2",
  "size": "1536x864",
  "sizeLabel": "16:9",
  "quality": "auto"
}
```

## Generation Notes

- 模型固定为 `gpt-image-2`；前端不提供模型输入框。
- `baseUrl` 用于自定义 OpenAI 兼容端点，通常需要以 `/v1` 结尾。
- `referenceImages: []` 时走 `/v1/images/generations`。
- `referenceImages` 非空时走 `/v1/images/edits`；很多第三方端点不支持该接口，可能返回 HTTP 405。
- 自定义尺寸必须是 `宽x高`，宽高均为 16 的倍数，最长边不超过 3840，宽高比不超过 3:1。
