import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { takeScreenshot } from "../screenshot.js";

export function registerPreviewTools(server: McpServer) {
  server.tool(
    "wp_screenshot",
    "Take a screenshot of a URL or WordPress post (handles draft authentication)",
    {
      url: z.string().optional().describe("URL to screenshot (for published pages, external sites)"),
      post_id: z.number().optional().describe("WordPress post ID to screenshot (handles draft auth)"),
      width: z.number().min(320).max(3840).optional().describe("Viewport width in pixels (default 1280)"),
    },
    async ({ url, post_id, width }) => {
      if (!url && !post_id) {
        return {
          content: [{ type: "text" as const, text: "Error: Provide either url or post_id" }],
        };
      }

      const result = await takeScreenshot({
        url: url ?? undefined,
        postId: post_id ?? undefined,
        width: width ?? undefined,
      });

      return {
        content: [
          {
            type: "image" as const,
            data: result.data,
            mimeType: result.mimeType,
          },
        ],
      };
    }
  );
}
