const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5173;
const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, "photos");
const DB_FILE = path.join(ROOT, "photos.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, "[]");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  res.end(JSON.stringify(payload));
}

function readPhotos() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writePhotos(photos) {
  fs.writeFileSync(DB_FILE, JSON.stringify(photos, null, 2));
}

function reorderPhotos(req, res, body) {
  let ids = [];
  try {
    ids = JSON.parse(body.toString("utf8")).ids;
  } catch {
    sendJson(res, 400, { error: "잘못된 정렬 요청입니다." });
    return;
  }

  if (!Array.isArray(ids)) {
    sendJson(res, 400, { error: "ids 배열이 필요합니다." });
    return;
  }

  const photos = readPhotos();
  const photoMap = new Map(photos.map((photo) => [photo.id, photo]));
  const orderedPhotos = ids.map((id) => photoMap.get(id)).filter(Boolean);
  const remainingPhotos = photos.filter((photo) => !ids.includes(photo.id));

  writePhotos([...orderedPhotos, ...remainingPhotos]);
  sendJson(res, 200, { ok: true });
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
  if (!boundaryMatch) return [];

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const parts = [];
  let cursor = 0;

  while (cursor < buffer.length) {
    const boundaryStart = buffer.indexOf(boundary, cursor);
    if (boundaryStart === -1) break;

    const partStart = boundaryStart + boundary.length;
    if (buffer[partStart] === 45 && buffer[partStart + 1] === 45) break;

    const headerStart = partStart + 2;
    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), headerStart);
    if (headerEnd === -1) break;

    const nextBoundary = buffer.indexOf(boundary, headerEnd + 4);
    if (nextBoundary === -1) break;

    const rawHeaders = buffer.slice(headerStart, headerEnd).toString("utf8");
    const body = buffer.slice(headerEnd + 4, nextBoundary - 2);
    const name = rawHeaders.match(/name="([^"]+)"/)?.[1];
    const filename = rawHeaders.match(/filename="([^"]*)"/)?.[1];
    const type = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || "";

    if (name) {
      parts.push({ name, filename, type, body });
    }

    cursor = nextBoundary;
  }

  return parts;
}

function safeExtension(filename, type) {
  const ext = path.extname(filename || "").toLowerCase();
  if (MIME_TYPES[ext]?.startsWith("image/")) return ext;

  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/gif") return ".gif";
  if (type === "image/avif") return ".avif";
  return ".jpg";
}

async function handlePhotoUpload(req, res) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    sendJson(res, 415, { error: "multipart/form-data만 지원합니다." });
    return;
  }

  const body = await collectBody(req);
  const parts = parseMultipart(body, contentType);
  const title = parts.find((part) => part.name === "title")?.body.toString("utf8").trim();
  const note = parts.find((part) => part.name === "note")?.body.toString("utf8").trim();
  const files = parts.filter((part) => part.name === "photos" && part.filename && part.body.length > 0);

  if (files.length === 0) {
    sendJson(res, 400, { error: "업로드할 사진이 없습니다." });
    return;
  }

  const createdAt = new Date().toISOString();
  const newPhotos = files.map((file, index) => {
    const id = crypto.randomUUID();
    const ext = safeExtension(file.filename, file.type);
    const storedName = `${id}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, storedName), file.body);

    return {
      id,
      title: title || path.basename(file.filename, path.extname(file.filename)) || `사진 ${index + 1}`,
      note: note || "",
      createdAt,
      url: `./photos/${storedName}`,
    };
  });

  const photos = [...newPhotos, ...readPhotos()];
  writePhotos(photos);
  sendJson(res, 201, newPhotos);
}

function deletePhoto(req, res, id) {
  const photos = readPhotos();
  const target = photos.find((photo) => photo.id === id);
  if (!target) {
    sendJson(res, 404, { error: "사진을 찾을 수 없습니다." });
    return;
  }

  const filePath = path.join(ROOT, target.url.replace(/^\.\//, ""));
  if (filePath.startsWith(UPLOAD_DIR) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  writePhotos(photos.filter((photo) => photo.id !== id));
  sendJson(res, 200, { ok: true });
}

function deleteAllPhotos(res) {
  readPhotos().forEach((photo) => {
    const filePath = path.join(ROOT, photo.url);
    if (filePath.startsWith(UPLOAD_DIR) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  writePhotos([]);
  sendJson(res, 200, { ok: true });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/photos") {
      sendJson(res, 200, readPhotos());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/photos") {
      await handlePhotoUpload(req, res);
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/photos/order") {
      reorderPhotos(req, res, await collectBody(req));
      return;
    }

    if (req.method === "DELETE" && url.pathname === "/api/photos") {
      deleteAllPhotos(res);
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/photos/")) {
      deletePhoto(req, res, decodeURIComponent(url.pathname.replace("/api/photos/", "")));
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "지원하지 않는 요청입니다." });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Photo gallery server: http://localhost:${PORT}`);
});
