import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const dataDir = join(__dirname, "data");
const generatedDir = join(dataDir, "generated");
const tempDir = join(dataDir, "tmp");
const archivePath = join(dataDir, "records.json");
const generationsPath = join(dataDir, "generations.json");
const port = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  return JSON.parse(text);
}

async function loadRecords() {
  return loadJsonArray(archivePath);
}

async function saveRecords(records) {
  await saveJsonArray(archivePath, records);
}

async function loadGenerations() {
  return loadJsonArray(generationsPath);
}

async function saveGenerations(generations) {
  await saveJsonArray(generationsPath, generations);
}

async function loadJsonArray(path) {
  try {
    const text = await readFile(path, "utf8");
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function saveJsonArray(path, data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

function normalizeAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    throw new Error("缺少 analysis 对象。");
  }

  return {
    overview: analysis.overview || "已完成视觉解构。",
    imageInfo: analysis.imageInfo || {},
    sections: Array.isArray(analysis.sections) ? analysis.sections : [],
    styleTags: Array.isArray(analysis.styleTags) ? analysis.styleTags : [],
    emotionTags: Array.isArray(analysis.emotionTags) ? analysis.emotionTags : [],
    visualFormula: analysis.visualFormula || "",
    negativeAdvice: Array.isArray(analysis.negativeAdvice) ? analysis.negativeAdvice : []
  };
}

function normalizeRecord(input) {
  const now = new Date().toISOString();
  const title = String(input.title || input.imageName || "未命名解构任务").trim();

  return {
    id: input.id || randomUUID(),
    title,
    imageName: input.imageName || "",
    imageDataUrl: input.imageDataUrl || "",
    source: input.source || "codex",
    rawReport: input.rawReport || "",
    analysis: normalizeAnalysis(input.analysis),
    createdAt: input.createdAt || now,
    updatedAt: now
  };
}

async function handleGetRecords(_req, res) {
  const records = await loadRecords();
  records.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  sendJson(res, 200, { records, archivePath });
}

async function handleCreateRecord(req, res) {
  try {
    const input = await readJsonBody(req);
    const nextRecord = normalizeRecord(input);
    const records = await loadRecords();
    const index = records.findIndex((record) => record.id === nextRecord.id);

    if (index >= 0) {
      records[index] = {
        ...records[index],
        ...nextRecord,
        createdAt: records[index].createdAt || nextRecord.createdAt
      };
    } else {
      records.unshift(nextRecord);
    }

    await saveRecords(records);
    sendJson(res, 201, { record: nextRecord, archivePath });
  } catch (error) {
    sendJson(res, 400, {
      error: error instanceof Error ? error.message : "记录写入失败。"
    });
  }
}

async function handleDeleteRecord(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const id = decodeURIComponent(url.pathname.replace(/^\/api\/records\//, ""));

  if (!id) {
    sendJson(res, 400, { error: "缺少资料 id。" });
    return;
  }

  const records = await loadRecords();
  const nextRecords = records.filter((record) => record.id !== id);

  if (nextRecords.length === records.length) {
    sendJson(res, 404, { error: "未找到要删除的资料。" });
    return;
  }

  await saveRecords(nextRecords);
  sendJson(res, 200, { deletedId: id, records: nextRecords });
}

async function handleGetGenerations(_req, res) {
  const generations = await loadGenerations();
  generations.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  sendJson(res, 200, { generations, generationsPath });
}

function normalizeSelectedEntries(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    recordId: entry.recordId || "",
    recordTitle: entry.recordTitle || "",
    section: entry.section || "",
    name: entry.name || "",
    promptFragment: entry.promptFragment || ""
  })).filter((entry) => entry.promptFragment);
}

function dataUrlToBuffer(dataUrl) {
  const match = String(dataUrl).match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const extension = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return {
    buffer: Buffer.from(match[2], "base64"),
    extension,
    mime
  };
}

function imageFileToDataUrl(path) {
  const extension = extname(path).toLowerCase();
  const mime = extension === ".webp" ? "image/webp" : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  return readFile(path).then((buffer) => `data:${mime};base64,${buffer.toString("base64")}`);
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: __dirname,
      env: options.env || process.env,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ code: -1, stdout, stderr: `${stderr}\n${error.message}`.trim() });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

async function runGptImageCli(args, env) {
  const primary = await runProcess("gpt-image", args, { env });
  if (primary.code === 0) return { ...primary, backend: "gpt-image" };

  const homeDir = process.env.USERPROFILE || process.env.HOME || "";
  const scriptPath = join(homeDir, ".agents", "skills", "gpt-image", "scripts", "generate.py");
  const fallback = await runProcess("uv", ["run", scriptPath, ...args], { env });
  return { ...fallback, backend: "uv run gpt-image skill launcher", primaryError: primary.stderr || primary.stdout };
}

async function writeReferenceImages(referenceImages, generationId) {
  await mkdir(tempDir, { recursive: true });
  const paths = [];

  for (const [index, imageDataUrl] of referenceImages.entries()) {
    const decoded = dataUrlToBuffer(imageDataUrl);
    if (!decoded) continue;
    const path = join(tempDir, `${generationId}-ref-${index + 1}.${decoded.extension}`);
    await writeFile(path, decoded.buffer);
    paths.push(path);
  }

  return paths;
}

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

const sizeShortcuts = new Set(["1k", "2k", "4k", "portrait", "landscape", "square", "wide", "tall"]);

function normalizeImageSize(size) {
  const rawSize = String(size || "auto").trim().toLowerCase();
  if (!rawSize || rawSize === "auto") return { size: "auto", label: "默认 1024x1024" };
  if (ratioSizeMap[rawSize]) return { size: ratioSizeMap[rawSize], label: rawSize };
  if (sizeShortcuts.has(rawSize)) return { size: rawSize, label: rawSize };

  const match = rawSize.match(/^(\d{2,4})x(\d{2,4})$/);
  if (!match) {
    return { error: "尺寸必须是比例预设、CLI 快捷词，或 1024x1024 这种像素格式。" };
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width % 16 !== 0 || height % 16 !== 0) {
    return { error: "自定义尺寸的宽高都必须是 16 的倍数。" };
  }
  if (Math.max(width, height) > 3840) {
    return { error: "自定义尺寸最长边不能超过 3840。" };
  }
  if (Math.max(width, height) / Math.min(width, height) > 3) {
    return { error: "自定义尺寸宽高比不能超过 3:1。" };
  }

  return { size: `${width}x${height}`, label: `${width}x${height}` };
}

async function handleGenerate(req, res) {
  try {
    const input = await readJsonBody(req);
    const apiKey = input.apiKey || process.env.OPENAI_API_KEY;
    const baseUrl = String(input.baseUrl || process.env.OPENAI_BASE_URL || "").trim();

    if (!apiKey) {
      return sendJson(res, 400, {
        error: "缺少 API Key。可以在前端临时输入，或在启动服务前设置 OPENAI_API_KEY。"
      });
    }

    const prompt = String(input.prompt || "").trim();
    if (!prompt) {
      return sendJson(res, 400, { error: "缺少生成提示词。" });
    }

    const normalizedSize = normalizeImageSize(input.size);
    if (normalizedSize.error) {
      return sendJson(res, 400, { error: normalizedSize.error });
    }

    const generationId = randomUUID();
    const referenceImages = Array.isArray(input.referenceImages)
      ? input.referenceImages.filter((image) => typeof image === "string" && /^data:image\/(png|jpe?g|webp);/i.test(image)).slice(0, 8)
      : [];
    const referencePaths = await writeReferenceImages(referenceImages, generationId);
    await mkdir(generatedDir, { recursive: true });
    const outputFormat = input.outputFormat || "png";
    const outputPath = join(generatedDir, `${generationId}.${outputFormat}`);

    const imageModel = "gpt-image-2";
    const cliArgs = ["-p", prompt, "-f", outputPath, "--model", imageModel, "--format", outputFormat];
    if (normalizedSize.size && normalizedSize.size !== "auto") cliArgs.push("--size", normalizedSize.size);
    if (input.quality) cliArgs.push("--quality", input.quality);
    for (const referencePath of referencePaths) cliArgs.push("-i", referencePath);

    const cliEnv = { ...process.env, OPENAI_API_KEY: apiKey };
    if (baseUrl) cliEnv.OPENAI_BASE_URL = baseUrl;
    const cliResult = await runGptImageCli(cliArgs, cliEnv);

    if (cliResult.code !== 0) {
      const rawCliError = `${cliResult.stderr || ""}\n${cliResult.stdout || ""}\n${cliResult.primaryError || ""}`;
      const statusHint = /405/.test(rawCliError)
        ? (referencePaths.length
          ? "HTTP 405 通常表示当前 Base URL 不支持 images edits。请关闭“上传资料库原图作为参考图”，让请求改走 images generations；同时确认 Base URL 以 /v1 结尾。"
          : "HTTP 405 通常表示当前 Base URL 不支持 images generations，或 Base URL 路径不正确。请确认供应商支持 gpt-image-2 生图，并且 Base URL 以 /v1 结尾。")
        : "";
      return sendJson(res, 500, {
        error: statusHint || "gpt-image CLI 生成失败。",
        backend: cliResult.backend,
        config: {
          model: imageModel,
          size: normalizedSize.size || "auto",
          quality: input.quality || "auto",
          baseUrl: baseUrl ? "custom" : "default",
          referenceCount: referencePaths.length
        },
        stdout: cliResult.stdout,
        stderr: cliResult.stderr,
        primaryError: cliResult.primaryError
      });
    }

    const imageDataUrl = await imageFileToDataUrl(outputPath);
    const now = new Date().toISOString();
    const generation = {
      id: generationId,
      title: input.title || input.theme || "未命名生成任务",
      theme: input.theme || "",
      template: input.template || "",
      prompt,
      selectedEntries: normalizeSelectedEntries(input.selectedEntries),
      sourceRecordIds: Array.isArray(input.sourceRecordIds) ? input.sourceRecordIds : [],
      model: imageModel,
      size: normalizedSize.size || "auto",
      sizeLabel: input.sizeLabel || normalizedSize.label || normalizedSize.size || "auto",
      quality: input.quality || "auto",
      baseUrl: baseUrl ? "custom" : "default",
      backend: cliResult.backend,
      outputPath,
      imageDataUrl,
      revisedPrompt: "",
      imageId: "",
      createdAt: now
    };

    const generations = await loadGenerations();
    generations.unshift(generation);
    await saveGenerations(generations);

    sendJson(res, 201, { generation, generationsPath });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "图片生成失败。",
      stderr: error instanceof Error ? error.stack : ""
    });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/api/records") {
    await handleGetRecords(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/records") {
    await handleCreateRecord(req, res);
    return;
  }

  if (req.method === "DELETE" && req.url?.startsWith("/api/records/")) {
    await handleDeleteRecord(req, res);
    return;
  }

  if (req.method === "GET" && req.url === "/api/generations") {
    await handleGetGenerations(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/generate") {
    await handleGenerate(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    await serveStatic(req, res);
    return;
  }

  res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Artwork Destruction Tool running at http://localhost:${port}`);
});
