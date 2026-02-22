import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch } from "../wp-client.js";

export function registerNavigationTools(server: McpServer) {
  server.tool(
    "wp_list_navigation",
    "List WordPress navigation menus",
    {
      per_page: z.number().min(1).max(100).optional().describe("Results per page (default 10)"),
    },
    async ({ per_page }) => {
      const result = await wpFetch("/navigation", {
        params: {
          per_page: per_page ?? 10,
          status: "publish",
        },
      });
      const navs = result as Array<Record<string, unknown>>;
      const summary = navs.map((n) => ({
        id: n.id,
        title: (n.title as { rendered: string })?.rendered,
        slug: n.slug,
        status: n.status,
        content: (n.content as { rendered: string })?.rendered,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_update_navigation",
    "Update a WordPress navigation menu",
    {
      id: z.number().describe("Navigation menu ID"),
      title: z.string().optional().describe("Navigation menu title"),
      content: z.string().optional().describe("Navigation menu content (block HTML)"),
      status: z
        .enum(["publish", "draft", "pending", "private"])
        .optional()
        .describe("Navigation status"),
    },
    async ({ id, title, content, status }) => {
      const body: Record<string, unknown> = {};
      if (title !== undefined) body.title = title;
      if (content !== undefined) body.content = content;
      if (status !== undefined) body.status = status;

      const result = await wpFetch(`/navigation/${id}`, { method: "POST", body }) as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated navigation #${result.id}: "${(result.title as { rendered: string })?.rendered}"`,
          },
        ],
      };
    }
  );
}
