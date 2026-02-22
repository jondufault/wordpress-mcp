import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch } from "../wp-client.js";

export function registerTemplatePartTools(server: McpServer) {
  server.tool(
    "wp_list_template_parts",
    "List WordPress template parts (header, footer, sidebar, etc.)",
    {
      area: z
        .enum(["header", "footer", "sidebar", "uncategorized"])
        .optional()
        .describe("Filter by template part area"),
      per_page: z.number().min(1).max(100).optional().describe("Results per page (default 100)"),
    },
    async ({ area, per_page }) => {
      const params: Record<string, string | number | undefined> = {
        per_page: per_page ?? 100,
      };
      if (area !== undefined) params.area = area;

      const result = await wpFetch("/template-parts", { params });
      const parts = result as Array<Record<string, unknown>>;
      const summary = parts.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: (p.title as { rendered: string })?.rendered,
        area: p.area,
        content: (p.content as { rendered: string })?.rendered,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_update_template_part",
    "Update a WordPress template part (e.g. footer, header)",
    {
      id: z.string().describe("Template part ID (e.g. 'theme-slug//footer')"),
      content: z.string().optional().describe("Template part content (block HTML)"),
      title: z.string().optional().describe("Template part title"),
      area: z
        .enum(["header", "footer", "sidebar", "uncategorized"])
        .optional()
        .describe("Template part area"),
    },
    async ({ id, content, title, area }) => {
      const body: Record<string, unknown> = {};
      if (content !== undefined) body.content = content;
      if (title !== undefined) body.title = title;
      if (area !== undefined) body.area = area;

      const result = await wpFetch(`/template-parts/${id}`, { method: "POST", body }) as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated template part "${(result.title as { rendered: string })?.rendered}" (${result.area})`,
          },
        ],
      };
    }
  );
}
