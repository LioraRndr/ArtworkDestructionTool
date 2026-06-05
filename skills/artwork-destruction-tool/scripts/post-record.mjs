#!/usr/bin/env node

const endpoint = process.env.ARTWORK_DESTRUCTION_TOOL_URL || "http://localhost:5173/api/records";
const inputPath = process.argv[2];

async function readInput() {
  if (inputPath) {
    const { readFile } = await import("node:fs/promises");
    return readFile(inputPath, "utf8");
  }

  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function validateRecord(record) {
  const missing = [];
  for (const key of ["title", "analysis"]) {
    if (!record[key]) missing.push(key);
  }
  if (missing.length) {
    throw new Error(`Missing required field(s): ${missing.join(", ")}`);
  }
}

const text = await readInput();
const record = JSON.parse(text);
validateRecord(record);

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(record)
});

const responseText = await response.text();
let payload;
try {
  payload = JSON.parse(responseText);
} catch {
  payload = { error: responseText };
}

if (!response.ok) {
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  endpoint,
  id: payload.record?.id,
  title: payload.record?.title
}, null, 2));

