import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const WP_URL = process.env.WP_URL;
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

if (!WP_URL || !WP_USER || !WP_APP_PASSWORD) {
  console.error(
    "Missing required env vars: WP_URL, WP_USER, WP_APP_PASSWORD"
  );
  process.exit(1);
}

const BASE_URL = `${WP_URL.replace(/\/+$/, "")}/wp-json/wp/v2`;
const AUTH_HEADER =
  "Basic " + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString("base64");

export { WP_URL, WP_USER, WP_APP_PASSWORD };

export interface WpFetchOptions {
  method?: string;
  body?: Record<string, unknown>;
  params?: Record<string, string | number | undefined>;
}

export async function wpFetch(
  endpoint: string,
  options: WpFetchOptions = {}
): Promise<unknown> {
  const { method = "GET", body, params } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    Authorization: AUTH_HEADER,
  };

  const fetchOptions: RequestInit = { method, headers };

  if (body) {
    headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress API ${method} ${endpoint} → ${response.status}: ${text}`);
  }

  return response.json();
}

export async function wpUpload(
  endpoint: string,
  filePath: string,
  metadata?: Record<string, string>
): Promise<unknown> {
  const url = `${BASE_URL}${endpoint}`;
  const fileBuffer = await readFile(filePath);
  const fileName = basename(filePath);

  // Determine MIME type from extension
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
  };
  const contentType = mimeTypes[ext] ?? "application/octet-stream";

  // Upload the file with Content-Disposition header (WordPress standard approach)
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: AUTH_HEADER,
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress upload ${endpoint} → ${response.status}: ${text}`);
  }

  const result = await response.json();

  // Update metadata (alt_text, caption, title) if provided
  if (metadata && typeof result === "object" && result !== null && "id" in result) {
    const mediaId = (result as { id: number }).id;
    const updateBody: Record<string, unknown> = {};
    if (metadata.alt_text) updateBody.alt_text = metadata.alt_text;
    if (metadata.caption) updateBody.caption = metadata.caption;
    if (metadata.title) updateBody.title = metadata.title;

    if (Object.keys(updateBody).length > 0) {
      return wpFetch(`/media/${mediaId}`, {
        method: "POST",
        body: updateBody,
      });
    }
  }

  return result;
}
