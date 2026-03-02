import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch } from "../wp-client.js";

export function registerPageTools(server: McpServer) {
  server.tool(
    "wp_list_pages",
    "List WordPress pages",
    {
      status: z
        .enum(["publish", "draft", "pending", "private"])
        .optional()
        .describe("Filter by page status"),
      per_page: z.number().min(1).max(100).optional().describe("Results per page (default 10)"),
    },
    async ({ status, per_page }) => {
      const result = await wpFetch("/pages", {
        params: {
          status: status ?? "any",
          per_page: per_page ?? 10,
          _embed: "1",
        },
      });
      const pages = result as Array<Record<string, unknown>>;
      const summary = pages.map((p) => ({
        id: p.id,
        title: (p.title as { rendered: string })?.rendered,
        status: p.status,
        link: p.link,
        slug: p.slug,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_get_page",
    "Get a single WordPress page by ID",
    {
      id: z.number().describe("Page ID"),
    },
    async ({ id }) => {
      const result = await wpFetch(`/pages/${id}`, {
        params: { _embed: "1" },
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_create_page",
    "Create a new WordPress page. Content supports Gutenberg block markup for full block editor compatibility.",
    {
      title: z.string().describe("Page title"),
      content: z.string().describe("Page content (HTML or Gutenberg block markup)"),
      status: z
        .enum(["publish", "draft", "pending", "private"])
        .optional()
        .describe("Page status (default: draft)"),
      slug: z.string().optional().describe("Page URL slug (e.g. 'about' for /about/)"),
      parent: z.number().optional().describe("Parent page ID for hierarchical pages"),
      featured_media: z.number().optional().describe("Featured image media ID"),
    },
    async ({ title, content, status, slug, parent, featured_media }) => {
      const body: Record<string, unknown> = {
        title,
        content,
        status: status ?? "draft",
      };
      if (slug) body.slug = slug;
      if (parent) body.parent = parent;
      if (featured_media) body.featured_media = featured_media;

      const result = await wpFetch("/pages", { method: "POST", body }) as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: `Created page #${result.id}: "${(result.title as { rendered: string })?.rendered}" (${result.status})\nLink: ${result.link}`,
          },
        ],
      };
    }
  );

  server.tool(
    "wp_update_page",
    "Update a WordPress page",
    {
      id: z.number().describe("Page ID"),
      title: z.string().optional().describe("Page title"),
      slug: z.string().optional().describe("Page URL slug (e.g. 'projects' for /projects/)"),
      content: z.string().optional().describe("Page content (HTML)"),
      status: z
        .enum(["publish", "draft", "pending", "private"])
        .optional()
        .describe("Page status"),
      parent: z.number().optional().describe("Parent page ID for hierarchical pages"),
      featured_media: z.number().optional().describe("Featured image media ID"),
    },
    async ({ id, title, slug, content, status, parent, featured_media }) => {
      const body: Record<string, unknown> = {};
      if (title !== undefined) body.title = title;
      if (slug !== undefined) body.slug = slug;
      if (content !== undefined) body.content = content;
      if (status !== undefined) body.status = status;
      if (parent !== undefined) body.parent = parent;
      if (featured_media !== undefined) body.featured_media = featured_media;

      const result = await wpFetch(`/pages/${id}`, { method: "POST", body }) as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated page #${result.id}: "${(result.title as { rendered: string })?.rendered}" (${result.status})`,
          },
        ],
      };
    }
  );
}
