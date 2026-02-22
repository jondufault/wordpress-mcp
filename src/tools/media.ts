import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch, wpUpload, wpUploadBuffer } from "../wp-client.js";

export function registerMediaTools(server: McpServer) {
  server.tool(
    "wp_list_media",
    "List media library items",
    {
      search: z.string().optional().describe("Search term"),
      per_page: z.number().min(1).max(100).optional().describe("Results per page (default 10)"),
      page: z.number().min(1).optional().describe("Page number"),
    },
    async ({ search, per_page, page }) => {
      const result = await wpFetch("/media", {
        params: {
          search,
          per_page: per_page ?? 10,
          page,
        },
      });
      const media = result as Array<Record<string, unknown>>;
      const summary = media.map((m) => ({
        id: m.id,
        title: (m.title as { rendered: string })?.rendered,
        source_url: m.source_url,
        mime_type: m.mime_type,
        alt_text: m.alt_text,
        date: m.date,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_upload_media",
    "Upload media to WordPress. Provide either file_path (local file) or data (base64-encoded content) with filename.",
    {
      file_path: z.string().optional().describe("Absolute path to a local file to upload"),
      data: z.string().optional().describe("Base64-encoded file content (use instead of file_path)"),
      filename: z.string().optional().describe("Filename including extension, e.g. 'photo.jpg' (required when using data)"),
      alt_text: z.string().optional().describe("Alt text for the image"),
      caption: z.string().optional().describe("Caption for the media item"),
      title: z.string().optional().describe("Title for the media item"),
    },
    async ({ file_path, data, filename, alt_text, caption, title }) => {
      if (!file_path && !data) {
        return {
          content: [{ type: "text" as const, text: "Error: provide either file_path or data" }],
          isError: true,
        };
      }
      if (data && !filename) {
        return {
          content: [{ type: "text" as const, text: "Error: filename is required when using data" }],
          isError: true,
        };
      }

      const metadata: Record<string, string> = {};
      if (alt_text) metadata.alt_text = alt_text;
      if (caption) metadata.caption = caption;
      if (title) metadata.title = title;

      let result: Record<string, unknown>;
      if (data) {
        const buffer = Buffer.from(data, "base64");
        result = (await wpUploadBuffer("/media", buffer, filename!, metadata)) as Record<string, unknown>;
      } else {
        result = (await wpUpload("/media", file_path!, metadata)) as Record<string, unknown>;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Uploaded media #${result.id}: ${result.source_url}\nMIME: ${result.mime_type}`,
          },
        ],
      };
    }
  );
}
