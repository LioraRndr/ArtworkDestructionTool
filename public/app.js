const state = {
  records: [],
  generations: [],
  recordsSignature: "",
  activeRecordId: "",
  activeSectionKey: "",
  selectedByRecord: loadSelectionState(),
  presets: loadPresetState()
};

const sectionFallbacks = {
  subject: "画面主体",
  supporting: "附属元素",
  composition: "构图与视觉动线",
  color: "色彩系统",
  lighting: "光影",
  material: "材质与纹理",
  typography: "字体与排版",
  symbols: "图形符号与界面元素",
  style: "风格来源",
  emotion: "情绪与意义",
  tension: "矛盾关系",
  layers: "图层结构"
};

const tagTranslations = {
  "glitch art": "故障艺术",
  "cyber editorial": "赛博编辑风",
  "brutalist graphic design": "粗野主义平面设计",
  "data archive aesthetic": "数据档案美学",
  "experimental typography": "实验字体排版",
  "digital collage": "数字拼贴",
  "sci-fi interface": "科幻界面",
  "cyberpunk": "赛博朋克",
  "vaporwave": "蒸汽波",
  "dreamcore": "梦核",
  "magazine editorial": "杂志编辑风",
  "album cover design": "专辑封面设计",
  "Japanese graphic design": "日本平面设计"
};

const els = {
  previewFrame: document.querySelector("#previewFrame"),
  previewImage: document.querySelector("#previewImage"),
  previewCaption: document.querySelector("#previewCaption"),
  copyHandoffBtn: document.querySelector("#copyHandoffBtn"),
  handoffPrompt: document.querySelector("#handoffPrompt"),
  refreshBtn: document.querySelector("#refreshBtn"),
  sideSwitch: document.querySelector(".side-switch"),
  sideSwitchBtns: document.querySelectorAll(".side-switch-btn"),
  sidePanels: document.querySelectorAll(".side-panel"),
  libraryGrid: document.querySelector("#libraryGrid"),
  savePresetBtn: document.querySelector("#savePresetBtn"),
  presetName: document.querySelector("#presetName"),
  presetList: document.querySelector("#presetList"),
  statusLine: document.querySelector("#statusLine"),
  categoryPills: document.querySelector("#categoryPills"),
  overviewCard: document.querySelector("#overviewCard"),
  elementsList: document.querySelector("#elementsList"),
  selectAllBtn: document.querySelector("#selectAllBtn"),
  clearAllBtn: document.querySelector("#clearAllBtn"),
  selectedSummary: document.querySelector("#selectedSummary"),
  targetTheme: document.querySelector("#targetTheme"),
  outputUse: document.querySelector("#outputUse"),
  promptOutput: document.querySelector("#promptOutput"),
  composeBtn: document.querySelector("#composeBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  generationApiKey: document.querySelector("#generationApiKey"),
  generationBaseUrl: document.querySelector("#generationBaseUrl"),
  imageSizePreset: document.querySelector("#imageSizePreset"),
  customImageSize: document.querySelector("#customImageSize"),
  imageQuality: document.querySelector("#imageQuality"),
  includeReferenceImages: document.querySelector("#includeReferenceImages"),
  generateBtn: document.querySelector("#generateBtn"),
  generatedPreview: document.querySelector("#generatedPreview"),
  generationHistory: document.querySelector("#generationHistory")
};

const handoffPrompt = `请使用 image-deconstruction skill 批量或单张分析我接下来提供的图片，并把每张图片的结果传入 Artwork Destruction Tool 本地资料库。

要求：
1. 先按 image-deconstruction 的视觉解构流程分析图片。
2. 每张图片都整理成机器可读 JSON，字段必须包含：
   title, imageName, imageDataUrl, source, rawReport, analysis。
3. analysis 必须包含：
   overview, imageInfo, sections, styleTags, emotionTags, visualFormula, negativeAdvice。
4. sections 里的每个 item 必须包含：
   name, observation, effect, promptFragment。
5. promptFragment 必须使用中文，写成可迁移的视觉语言，不要额外给英文版本，不要包含“复制原图”“照抄原图”或原图专属身份。
6. 每张图片分别 POST 到：
   http://localhost:5173/api/records
7. POST 成功后告诉我任务标题和是否已进入前端资料库。

传入页面的核心限制：
- 只迁移视觉语言、审美机制、色彩关系、材质气质、构图逻辑和情绪方向。
- 不要仿照原图，不要照抄原图，不要复制原图中的具体人物、物体、文字、商标、版式排列或可识别细节。`;

els.handoffPrompt.value = handoffPrompt;

const ratioSizeMap = {
  "1:1": "1024x1024",
  "16:9": "1536x864",
  "9:16": "864x1536",
  "4:3": "1536x1152",
  "3:4": "1152x1536",
  "3:2": "1536x1024",
  "2:3": "1024x1536",
  "21:9": "1792x768"
};

const formStorageKeys = {
  targetTheme: "adt.targetTheme",
  outputUse: "adt.outputUse",
  promptOutput: "adt.promptOutput",
  generationApiKey: "adt.generationApiKey",
  generationBaseUrl: "adt.generationBaseUrl",
  imageSizePreset: "adt.imageSizePreset",
  customImageSize: "adt.customImageSize",
  imageQuality: "adt.imageQuality",
  includeReferenceImages: "adt.includeReferenceImages"
};

function setStatus(message, isError = false) {
  els.statusLine.textContent = message;
  els.statusLine.style.color = isError ? "#9f2e16" : "#1f5f74";
}

function saveStoredValue(key, value) {
  const text = String(value || "");
  if (text) localStorage.setItem(key, text);
  else localStorage.removeItem(key);
}

function restoreTextInput(element, key) {
  const value = localStorage.getItem(key);
  if (value !== null) element.value = value;
}

function restoreSelectInput(element, key) {
  const value = localStorage.getItem(key);
  if (value !== null && [...element.options].some((option) => option.value === value)) {
    element.value = value;
  }
}

function restoreCheckboxInput(element, key) {
  element.checked = localStorage.getItem(key) === "true";
}

function restoreGenerationForm() {
  restoreTextInput(els.targetTheme, formStorageKeys.targetTheme);
  restoreSelectInput(els.outputUse, formStorageKeys.outputUse);
  restoreTextInput(els.promptOutput, formStorageKeys.promptOutput);
  restoreTextInput(els.generationApiKey, formStorageKeys.generationApiKey);
  restoreTextInput(els.generationBaseUrl, formStorageKeys.generationBaseUrl);
  restoreSelectInput(els.imageSizePreset, formStorageKeys.imageSizePreset);
  restoreTextInput(els.customImageSize, formStorageKeys.customImageSize);
  restoreSelectInput(els.imageQuality, formStorageKeys.imageQuality);
  restoreCheckboxInput(els.includeReferenceImages, formStorageKeys.includeReferenceImages);
  updateCustomSizeControl();
}

function saveGenerationForm() {
  saveStoredValue(formStorageKeys.targetTheme, els.targetTheme.value);
  saveStoredValue(formStorageKeys.outputUse, els.outputUse.value);
  saveStoredValue(formStorageKeys.promptOutput, els.promptOutput.value);
  saveStoredValue(formStorageKeys.generationApiKey, els.generationApiKey.value);
  saveStoredValue(formStorageKeys.generationBaseUrl, els.generationBaseUrl.value);
  saveStoredValue(formStorageKeys.imageSizePreset, els.imageSizePreset.value);
  saveStoredValue(formStorageKeys.customImageSize, els.customImageSize.value);
  saveStoredValue(formStorageKeys.imageQuality, els.imageQuality.value);
  localStorage.setItem(formStorageKeys.includeReferenceImages, String(els.includeReferenceImages.checked));
}

function updateCustomSizeControl() {
  const isCustom = els.imageSizePreset.value === "custom";
  els.customImageSize.disabled = !isCustom;
}

function resolveImageSizeInput() {
  const preset = els.imageSizePreset.value;
  if (!preset || preset === "auto") return { size: "auto", label: "默认 1024x1024" };
  if (preset === "custom") {
    const customSize = els.customImageSize.value.trim().toLowerCase();
    const validation = validateLiteralSize(customSize);
    if (!validation.valid) return { error: validation.error };
    return { size: customSize, label: customSize };
  }
  return { size: ratioSizeMap[preset] || preset, label: preset };
}

function validateLiteralSize(value) {
  const match = String(value || "").match(/^(\d{2,4})x(\d{2,4})$/i);
  if (!match) return { valid: false, error: "自定义尺寸需写成 1024x1024 这种格式。" };

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width % 16 !== 0 || height % 16 !== 0) {
    return { valid: false, error: "自定义尺寸的宽高都必须是 16 的倍数。" };
  }
  if (Math.max(width, height) > 3840) {
    return { valid: false, error: "自定义尺寸最长边不能超过 3840。" };
  }
  if (Math.max(width, height) / Math.min(width, height) > 3) {
    return { valid: false, error: "自定义尺寸宽高比不能超过 3:1。" };
  }
  return { valid: true };
}

function setSidePanel(panelName) {
  els.sideSwitchBtns.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panelName);
  });
  els.sidePanels.forEach((panel) => {
    const isActive = panel.id === `${panelName}Panel`;
    panel.classList.toggle("active", isActive);
  });
}

async function loadAll({ silent = false } = {}) {
  await Promise.all([
    loadRecords({ silent }),
    loadGenerations({ silent: true })
  ]);
}

async function loadRecords({ silent = false } = {}) {
  try {
    const res = await fetch("/api/records", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "读取本地资料库失败。");

    const nextRecords = Array.isArray(data.records) ? data.records : [];
    const nextSignature = JSON.stringify(nextRecords.map((record) => ({
      id: record.id,
      updatedAt: record.updatedAt,
      createdAt: record.createdAt,
      title: record.title
    })));

    if (silent && nextSignature === state.recordsSignature) {
      return;
    }

    const previousCount = state.records.length;
    state.records = nextRecords;
    state.recordsSignature = nextSignature;

    if (!state.activeRecordId && state.records.length) {
      state.activeRecordId = state.records[0].id;
    }

    if (state.activeRecordId && !state.records.some((record) => record.id === state.activeRecordId)) {
      state.activeRecordId = state.records[0]?.id || "";
    }

    ensureActiveSection();
    renderApp();

    if (!silent) {
      const entryCount = getAllEntries().length;
      setStatus(state.records.length ? `已载入 ${state.records.length} 张图片、${entryCount} 个词条。` : "暂无资料。请在 Codex 中传入图片解构任务。");
    } else if (state.records.length > previousCount) {
      setStatus(`收到新资料：${state.records[0].title}`);
    }
  } catch (error) {
    setStatus(error.message || "读取资料库失败。", true);
  }
}

async function loadGenerations({ silent = false } = {}) {
  try {
    const res = await fetch("/api/generations", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "读取生成历史失败。");
    state.generations = Array.isArray(data.generations) ? data.generations : [];
    renderGenerations();
  } catch (error) {
    if (!silent) setStatus(error.message || "读取生成历史失败。", true);
  }
}

function getActiveRecord() {
  return state.records.find((record) => record.id === state.activeRecordId) || null;
}

function ensureActiveSection() {
  const record = getActiveRecord();
  if (!record) {
    state.activeSectionKey = "";
    return;
  }

  if (state.activeSectionKey === "__closed__") return;

  const sections = normalizeSections(record.analysis);
  if (!sections.length) {
    state.activeSectionKey = "";
    return;
  }

  if (!sections.some((section) => section.key === state.activeSectionKey)) {
    state.activeSectionKey = sections[0].key;
  }
}

function normalizeSections(analysis) {
  const sections = Array.isArray(analysis?.sections) ? analysis.sections : [];
  return sections.map((section, sectionIndex) => ({
    id: section.id || `section-${sectionIndex}`,
    key: `${section.id || "section"}:${sectionIndex}`,
    title: section.title || sectionFallbacks[section.id] || "未命名分类",
    items: Array.isArray(section.items) ? section.items : []
  }));
}

function makeEntryKey(sectionIndex, itemIndex) {
  return `${sectionIndex}:${itemIndex}`;
}

function getAllEntries() {
  return state.records.flatMap((record) => {
    const sections = normalizeSections(record.analysis);
    return sections.flatMap((section, sectionIndex) => {
      return section.items.map((item, itemIndex) => ({
        recordId: record.id,
        recordTitle: record.title || "未命名资料",
        imageDataUrl: record.imageDataUrl || "",
        key: makeEntryKey(sectionIndex, itemIndex),
        section: section.title,
        name: item.name || "未命名要素",
        observation: item.observation || "",
        effect: item.effect || "",
        promptFragment: getChineseFragment(item)
      }));
    });
  });
}

function getSelectedEntries() {
  const entries = getAllEntries();
  return entries.filter((entry) => {
    const selected = state.selectedByRecord[entry.recordId] || [];
    return selected.includes(entry.key);
  });
}

function renderApp() {
  renderLibrary();
  renderActiveRecord();
  renderSelectedSummary();
  renderGenerations();
  renderPresets();
}

function renderLibrary() {
  if (!state.records.length) {
    els.libraryGrid.innerHTML = `<div class="empty-tabs">暂无资料</div>`;
    return;
  }

  els.libraryGrid.innerHTML = state.records.map((record, index) => {
    const selectedCount = (state.selectedByRecord[record.id] || []).length;
    return `
      <article class="library-card ${record.id === state.activeRecordId ? "active" : ""}" role="button" tabindex="0" data-id="${escapeAttribute(record.id)}">
        <span class="library-actions">
          <span></span>
          <button class="delete-record-btn" type="button" data-id="${escapeAttribute(record.id)}" title="删除资料">删除</button>
        </span>
        <span class="library-thumb">
          ${record.imageDataUrl ? `<img src="${escapeAttribute(record.imageDataUrl)}" alt="${escapeAttribute(record.title || `资料 ${index + 1}`)}" />` : "<em>无图</em>"}
        </span>
        <span class="library-title">${escapeHtml(record.title || `资料 ${index + 1}`)}</span>
        <small>${formatTime(record.createdAt)} · 已选 ${selectedCount}</small>
      </article>
    `;
  }).join("");
}

function renderActiveRecord() {
  const record = getActiveRecord();

  if (!record) {
    els.previewFrame.classList.remove("has-image");
    els.previewImage.removeAttribute("src");
    els.previewCaption.textContent = "尚未选择资料";
    els.overviewCard.innerHTML = `<p>Codex 传入资料后，这里会显示图片总览、基础信息、风格标签与情绪标签。</p>`;
    els.elementsList.innerHTML = `
      <div class="placeholder-block">
        <strong>等待资料入库</strong>
        <span>把图片发给 Codex 后，我会把结构化解构结果传入这个资料库。</span>
      </div>
    `;
    return;
  }

  if (record.imageDataUrl) {
    els.previewImage.src = record.imageDataUrl;
    els.previewFrame.classList.add("has-image");
  } else {
    els.previewFrame.classList.remove("has-image");
    els.previewImage.removeAttribute("src");
  }
  els.previewCaption.textContent = record.imageName || record.title || "当前资料原图";

  ensureActiveSection();
  renderOverview(record);
  renderElements(record);
}

function renderOverview(record) {
  const analysis = record.analysis || {};
  const info = analysis.imageInfo || {};
  const styleTags = (analysis.styleTags || []).map((tag) => `<span class="tag">${escapeHtml(translateTag(tag))}</span>`).join("");
  const emotionTags = (analysis.emotionTags || []).map((tag) => `<span class="tag">${escapeHtml(translateTag(tag))}</span>`).join("");

  els.overviewCard.innerHTML = `
    <details class="overview-details" open>
      <summary>
        <strong>资料总览</strong>
        <span>${escapeHtml(record.title || "未命名资料")}</span>
      </summary>
      <p><strong>${escapeHtml(analysis.overview || "已完成视觉解构。")}</strong></p>
      <p>资料：${escapeHtml(record.title || "未命名资料")} ｜ 来源：${escapeHtml(record.source || "codex")} ｜ 时间：${formatTime(record.createdAt)}</p>
      <p>比例：${escapeHtml(info.ratio || "未确认")} ｜ 类型：${escapeHtml(info.type || "未确认")} ｜ 密度：${escapeHtml(info.density || "未确认")} ｜ 调性：${escapeHtml(info.tone || "未确认")}</p>
      <p>第一眼视觉中心：${escapeHtml(info.firstFocus || "未确认")}</p>
      <p>视觉公式：${escapeHtml(analysis.visualFormula || "未生成")}</p>
      <div class="tag-row">${styleTags}${emotionTags}</div>
    </details>
  `;
}

function renderElements(record) {
  const sections = normalizeSections(record.analysis);
  const selected = new Set(state.selectedByRecord[record.id] || []);
  els.categoryPills.innerHTML = sections.map((section) => `
    <button class="category-pill ${section.key === state.activeSectionKey ? "active" : ""}" type="button" data-key="${escapeAttribute(section.key)}">
      <span>${escapeHtml(section.title)}</span>
      <small>${section.items.length}</small>
    </button>
  `).join("");

  const activeSectionIndex = sections.findIndex((section) => section.key === state.activeSectionKey);
  const activeSection = activeSectionIndex >= 0 ? sections[activeSectionIndex] : null;

  if (!activeSection) {
    els.elementsList.innerHTML = `
      <div class="placeholder-block compact">
        <strong>未展开分类</strong>
        <span>点击上方分类标签查看词条。</span>
      </div>
    `;
    return;
  }

  const cards = activeSection.items.map((item, itemIndex) => {
    const key = makeEntryKey(activeSectionIndex, itemIndex);
    const fragment = getChineseFragment(item);
    return `
      <label class="element-card">
        <input
          type="checkbox"
          class="element-check"
          data-key="${escapeAttribute(key)}"
          data-fragment="${escapeAttribute(fragment)}"
          data-section="${escapeAttribute(activeSection.title)}"
          ${selected.has(key) ? "checked" : ""}
        />
        <span>
          <span class="element-name">${escapeHtml(item.name || "未命名要素")}</span>
          <p class="element-copy">观察：${escapeHtml(item.observation || "未提供")}</p>
          <p class="element-copy">效果：${escapeHtml(item.effect || "未提供")}</p>
          <p class="fragment">${escapeHtml(fragment)}</p>
        </span>
      </label>
    `;
  }).join("");

  els.elementsList.innerHTML = cards || `
    <div class="placeholder-block">
      <strong>没有解析到词条</strong>
      <span>可以让 Codex 重新传入结构化解构结果。</span>
    </div>
  `;
}

function renderSelectedSummary() {
  const selected = getSelectedEntries();
  const sourceCount = new Set(selected.map((entry) => entry.recordId)).size;
  els.selectedSummary.innerHTML = `
    <strong>已选 ${selected.length} 个词条</strong>
    <span>来自 ${sourceCount} 张图片。可跨资料切换继续勾选。</span>
  `;
}

function renderPresets() {
  if (!state.presets.length) {
    els.presetList.innerHTML = `<div class="empty-tabs">暂无预置</div>`;
    return;
  }

  els.presetList.innerHTML = state.presets.map((preset) => {
    const count = Object.values(preset.selectedByRecord || {}).reduce((sum, keys) => sum + (Array.isArray(keys) ? keys.length : 0), 0);
    return `
      <button class="preset-card" type="button" data-id="${escapeAttribute(preset.id)}">
        <strong>${escapeHtml(preset.name)}</strong>
        <small>${count} 个词条 · ${formatTime(preset.createdAt)}</small>
      </button>
    `;
  }).join("");
}

function renderGenerations() {
  if (!state.generations.length) {
    els.generatedPreview.innerHTML = `<span>生成结果会显示在这里</span>`;
    els.generationHistory.innerHTML = `<div class="empty-tabs">暂无生成历史</div>`;
    return;
  }

  const latest = state.generations[0];
  els.generatedPreview.innerHTML = latest.imageDataUrl
    ? `<img src="${escapeAttribute(latest.imageDataUrl)}" alt="${escapeAttribute(latest.title || "生成图片")}" />`
    : `<span>最新记录没有图片数据</span>`;

  els.generationHistory.innerHTML = state.generations.slice(0, 8).map((generation) => `
    <article class="generation-item">
      ${generation.imageDataUrl ? `<img src="${escapeAttribute(generation.imageDataUrl)}" alt="${escapeAttribute(generation.title || "生成图片")}" />` : ""}
      <div>
        <strong>${escapeHtml(generation.title || "未命名生成")}</strong>
        <span>${formatTime(generation.createdAt)} · ${escapeHtml(generation.sizeLabel || generation.size || "auto")}</span>
      </div>
    </article>
  `).join("");
}

function updateSelectionFromDom() {
  const record = getActiveRecord();
  if (!record) return;

  const visibleKeys = [...document.querySelectorAll(".element-check")]
    .map((checkbox) => checkbox.dataset.key)
    .filter(Boolean);
  const checkedKeys = [...document.querySelectorAll(".element-check:checked")]
    .map((checkbox) => checkbox.dataset.key)
    .filter(Boolean);
  const existingKeys = state.selectedByRecord[record.id] || [];
  state.selectedByRecord[record.id] = [
    ...existingKeys.filter((key) => !visibleKeys.includes(key)),
    ...checkedKeys
  ];

  saveSelectionState();
  renderLibrary();
  renderSelectedSummary();
}

function selectLibraryRecord(id) {
  if (!id || id === state.activeRecordId) return;

  updateSelectionFromDom();
  state.activeRecordId = id;
  state.activeSectionKey = "";
  renderApp();
}

function composePrompt() {
  const selected = getSelectedEntries();

  if (!selected.length) {
    setStatus("请至少从资料库中选择一个词条。", true);
    return "";
  }

  const theme = els.targetTheme.value.trim();
  const template = els.outputUse.value;
  const grouped = selected.reduce((acc, entry) => {
    const source = entry.recordTitle;
    acc[source] ||= {};
    acc[source][entry.section] ||= [];
    acc[source][entry.section].push(entry.promptFragment);
    return acc;
  }, {});

  const lines = Object.entries(grouped).flatMap(([source, sections]) => {
    const sectionLines = Object.entries(sections).flatMap(([section, fragments]) => [
      `  ${section}：`,
      ...fragments.map((fragment) => `  - ${fragment}`)
    ]);
    return [`来自《${source}》：`, ...sectionLines];
  });

  const negativeAdvice = collectNegativeAdvice();
  const themeLine = theme ? `创作主题：${theme}` : "创作主题：请基于选中视觉要素重新构思一个全新的主题";

  const prompt = [
    "请参考以下来自多张图片资料库的视觉词条，融合生成一张全新的原创图像。",
    themeLine,
    `生成模板：${template}`,
    "",
    "参考词条：",
    ...lines,
    "",
    "融合要求：",
    "- 让不同来源的词条共同作用，而不是机械拼贴。",
    "- 保持统一的画面重心、色彩秩序、材质逻辑和情绪方向。",
    "- 如果词条之间存在冲突，优先保留更能服务创作主题的视觉机制。",
    "",
    "重要限制：",
    "- 只迁移视觉语言、审美机制、色彩关系、材质气质、构图逻辑和情绪方向。",
    "- 不要仿照任何原图，不要照抄任何原图。",
    "- 不要复制原图中的具体人物、物体、文字、商标、版式排列或可识别细节。",
    "- 生成结果必须是一张新的原创画面，而不是任何参考图的变体或近似复刻。",
    "",
    "避免事项：",
    negativeAdvice
  ].join("\n");

  els.promptOutput.value = prompt;
  saveGenerationForm();
  setStatus(`已组合 ${selected.length} 个词条，来自 ${new Set(selected.map((entry) => entry.recordId)).size} 张图片。`);
  return prompt;
}

function collectNegativeAdvice() {
  const selectedRecordIds = new Set(getSelectedEntries().map((entry) => entry.recordId));
  const advice = state.records
    .filter((record) => selectedRecordIds.has(record.id))
    .flatMap((record) => record.analysis?.negativeAdvice || []);

  const uniqueAdvice = [...new Set(advice)].filter(Boolean);
  if (!uniqueAdvice.length) {
    return "- 不要照抄原图构图、主体、文字、具体角色或品牌元素\n- 不要生成与任何参考图高度相似的画面";
  }

  return uniqueAdvice.map((item) => `- ${item}`).join("\n");
}

function getChineseFragment(item) {
  const candidates = [item.promptFragment, item.effect, item.observation, item.name].filter(Boolean);
  return candidates.find((value) => containsCjk(value)) || candidates[0] || "";
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(String(value));
}

function translateTag(tag) {
  return tagTranslations[String(tag)] || tag;
}

async function readApiResponse(res) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function compactDiagnosticText(data) {
  const sections = [
    ["错误", data.error],
    ["后端", data.backend],
    ["配置", data.config],
    ["stderr", data.stderr],
    ["stdout", data.stdout],
    ["primaryError", data.primaryError]
  ].filter(([, value]) => String(value || "").trim());

  return sections
    .map(([label, value]) => {
      const text = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value).trim();
      return `${label}:\n${text}`;
    })
    .join("\n\n")
    .slice(0, 6000);
}

function buildGenerationErrorMessage(data, status) {
  const base = data.error || `生成请求失败，HTTP ${status}`;
  const detail = data.stderr || data.stdout || data.primaryError;
  if (!detail) return base;
  return `${base}：${String(detail).trim().split("\n").slice(-2).join(" ").slice(0, 220)}`;
}

function renderGenerationError(data, status) {
  const details = compactDiagnosticText(data);
  els.generatedPreview.innerHTML = `
    <div class="generation-error">
      <strong>生成失败</strong>
      <span>HTTP ${status || "unknown"}</span>
      <p>${escapeHtml(data.error || "没有返回错误摘要。")}</p>
      ${details ? `
        <details open>
          <summary>诊断信息</summary>
          <pre>${escapeHtml(details)}</pre>
        </details>
      ` : ""}
    </div>
  `;
}

async function generateImage() {
  let prompt = els.promptOutput.value.trim();
  if (!prompt) prompt = composePrompt();
  if (!prompt) return;

  const selected = getSelectedEntries();
  const referenceImages = els.includeReferenceImages.checked
    ? [...new Map(
      selected
        .filter((entry) => /^data:image\/(png|jpe?g|webp);/i.test(entry.imageDataUrl))
        .map((entry) => [entry.recordId, entry.imageDataUrl])
    ).values()]
    : [];

  const apiKey = els.generationApiKey.value.trim();
  const baseUrl = els.generationBaseUrl.value.trim();
  saveGenerationForm();

  const resolvedSize = resolveImageSizeInput();
  if (resolvedSize.error) {
    setStatus(resolvedSize.error, true);
    return;
  }

  els.generateBtn.disabled = true;
  setStatus(`正在调用图片生成 API，模型 gpt-image-2，尺寸 ${resolvedSize.label}，${referenceImages.length ? `携带 ${referenceImages.length} 张参考图` : "仅使用词条提示词"}。`);

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey,
        title: els.targetTheme.value.trim() || "资料库融合生成",
        baseUrl,
        theme: els.targetTheme.value.trim(),
        template: els.outputUse.value,
        prompt,
        selectedEntries: selected,
        sourceRecordIds: [...new Set(selected.map((entry) => entry.recordId))],
        referenceImages,
        imageModel: "gpt-image-2",
        size: resolvedSize.size,
        sizeLabel: resolvedSize.label,
        quality: els.imageQuality.value
      })
    });

    const data = await readApiResponse(res);
    if (!res.ok) {
      renderGenerationError(data, res.status);
      setStatus(buildGenerationErrorMessage(data, res.status), true);
      return;
    }

    await loadGenerations();
    setStatus(`生成完成：${data.generation.title}`);
  } catch (error) {
    renderGenerationError({ error: error.message || "图片生成失败。" }, "network");
    setStatus(error.message || "图片生成失败。", true);
  } finally {
    els.generateBtn.disabled = false;
  }
}

async function copyPrompt() {
  const text = els.promptOutput.value.trim();
  if (!text) {
    setStatus("没有可复制的提示词。", true);
    return;
  }

  const copied = await copyText(text, els.promptOutput);
  setStatus(copied ? "提示词已复制。" : "复制失败，请手动选中文本复制。", !copied);
}

async function copyHandoffPrompt() {
  const copied = await copyText(els.handoffPrompt.value, els.handoffPrompt);
  setStatus(copied ? "Codex 入库指令已复制。" : "复制失败，请手动选中文本复制。", !copied);
}

async function copyText(text, sourceElement) {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea selection for embedded browser environments.
  }

  try {
    sourceElement.focus();
    sourceElement.select();
    sourceElement.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  }
}

function setAllChecks(checked) {
  document.querySelectorAll(".element-check").forEach((checkbox) => {
    checkbox.checked = checked;
  });
  updateSelectionFromDom();
}

function loadSelectionState() {
  try {
    return JSON.parse(localStorage.getItem("adt.selectedByRecord") || "{}");
  } catch {
    return {};
  }
}

function saveSelectionState() {
  localStorage.setItem("adt.selectedByRecord", JSON.stringify(state.selectedByRecord));
}

function loadPresetState() {
  try {
    const presets = JSON.parse(localStorage.getItem("adt.presets") || "[]");
    return Array.isArray(presets) ? presets : [];
  } catch {
    return [];
  }
}

function savePresetState() {
  localStorage.setItem("adt.presets", JSON.stringify(state.presets));
}

function saveCurrentPreset() {
  const selected = getSelectedEntries();
  if (!selected.length) {
    setStatus("请先选择词条，再保存预置。", true);
    return;
  }

  const name = els.presetName.value.trim() || `预置 ${state.presets.length + 1}`;
  state.presets.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    name,
    selectedByRecord: structuredClone(state.selectedByRecord),
    createdAt: new Date().toISOString()
  });
  els.presetName.value = "";
  savePresetState();
  renderPresets();
  setStatus(`已保存预置：${name}`);
}

function applyPreset(id) {
  const preset = state.presets.find((item) => item.id === id);
  if (!preset) return;
  state.selectedByRecord = structuredClone(preset.selectedByRecord || {});
  saveSelectionState();
  renderApp();
  setStatus(`已载入预置：${preset.name}`);
}

async function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  const confirmed = window.confirm(`确定删除资料「${record.title || "未命名资料"}」吗？`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/records/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "删除失败。");

    delete state.selectedByRecord[id];
    saveSelectionState();
    state.records = state.records.filter((item) => item.id !== id);
    state.recordsSignature = "";
    if (state.activeRecordId === id) {
      state.activeRecordId = state.records[0]?.id || "";
      state.activeSectionKey = "";
    }
    renderApp();
    setStatus(`已删除资料：${record.title || id}`);
  } catch (error) {
    setStatus(error.message || "删除失败。", true);
  }
}

function formatTime(value) {
  if (!value) return "未知时间";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

els.refreshBtn.addEventListener("click", () => loadAll());
els.copyHandoffBtn.addEventListener("click", copyHandoffPrompt);
els.savePresetBtn.addEventListener("click", saveCurrentPreset);
els.composeBtn.addEventListener("click", composePrompt);
els.copyBtn.addEventListener("click", copyPrompt);
els.generateBtn.addEventListener("click", generateImage);
els.imageSizePreset.addEventListener("change", () => {
  updateCustomSizeControl();
  saveGenerationForm();
});
[
  els.targetTheme,
  els.outputUse,
  els.promptOutput,
  els.generationApiKey,
  els.generationBaseUrl,
  els.customImageSize,
  els.imageQuality,
  els.includeReferenceImages
].forEach((element) => {
  element.addEventListener("input", saveGenerationForm);
  element.addEventListener("change", saveGenerationForm);
});
els.selectAllBtn.addEventListener("click", () => setAllChecks(true));
els.clearAllBtn.addEventListener("click", () => setAllChecks(false));

els.sideSwitch.addEventListener("click", (event) => {
  const button = event.target.closest(".side-switch-btn");
  if (!button) return;
  setSidePanel(button.dataset.panel);
});

els.libraryGrid.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-record-btn");
  if (deleteButton) {
    event.stopPropagation();
    deleteRecord(deleteButton.dataset.id);
    return;
  }

  const card = event.target.closest(".library-card");
  if (!card) return;
  selectLibraryRecord(card.dataset.id);
});

els.libraryGrid.addEventListener("keydown", (event) => {
  if (event.target.closest(".delete-record-btn")) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".library-card");
  if (!card) return;
  event.preventDefault();
  card.click();
});

els.categoryPills.addEventListener("click", (event) => {
  const pill = event.target.closest(".category-pill");
  if (!pill) return;
  state.activeSectionKey = state.activeSectionKey === pill.dataset.key ? "__closed__" : pill.dataset.key;
  renderActiveRecord();
});

els.presetList.addEventListener("click", (event) => {
  const card = event.target.closest(".preset-card");
  if (!card) return;
  applyPreset(card.dataset.id);
});

els.elementsList.addEventListener("change", (event) => {
  if (event.target.matches(".element-check")) {
    updateSelectionFromDom();
  }
});

restoreGenerationForm();
loadAll();
setInterval(() => loadRecords({ silent: true }), 3000);
