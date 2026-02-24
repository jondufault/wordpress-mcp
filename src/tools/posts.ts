import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch } from "../wp-client.js";

export function registerPostTools(server: McpServer) {
  server.tool(
    "wp_list_posts",
    "List WordPress posts with optional filtering",
    {
      status: z
        .enum(["publish", "draft", "pending", "private", "trash"])
        .optional()
        .describe("Filter by post status"),
      search: z.string().optional().describe("Search term"),
      per_page: z.number().min(1).max(100).optional().describe("Results per page (default 10)"),
      page: z.number().min(1).optional().describe("Page number"),
    },
    async ({ status, search, per_page, page }) => {
      const result = await wpFetch("/posts", {
        params: {
          status: status ?? "any",
          search,
          per_page: per_page ?? 10,
          page,
          _embed: "1",
        },
      });
      const posts = result as Array<Record<string, unknown>>;
      const summary = posts.map((p) => ({
        id: p.id,
        title: (p.title as { rendered: string })?.rendered,
        status: p.status,
        date: p.date,
        link: p.link,
        slug: p.slug,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_get_post",
    "Get a single WordPress post by ID",
    {
      id: z.number().describe("Post ID"),
    },
    async ({ id }) => {
      const result = await wpFetch(`/posts/${id}`, {
        params: { _embed: "1" },
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_create_post",
    "Create a new WordPress post. Content supports Gutenberg block markup for full block editor compatibility.",
    {
      title: z.string().describe("Post title"),
      content: z.string().describe("Post content (HTML or Gutenberg block markup)"),
      status: z
        .enum(["publish", "draft", "pending", "private"])
        .optional()
        .describe("Post status (default: draft)"),
      categories: z.array(z.number()).optional().describe("Category IDs"),
      tags: z.array(z.number()).optional().describe("Tag IDs"),
      featured_media: z.number().optional().describe("Featured image media ID"),
    },
    async ({ title, content, status, categories, tags, featured_media }) => {
      const body: Record<string, unknown> = {
        title,
        content,
        status: status ?? "draft",
      };
      if (categories) body.categories = categories;
      if (tags) body.tags = tags;
      if (featured_media) body.featured_media = featured_media;

      const result = await wpFetch("/posts", { method: "POST", body }) as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: `Created post #${result.id}: "${(result.title as { rendered: string })?.rendered}" (${result.status})\nLink: ${result.link}`,
          },
        ],
      };
    }
  );

  server.tool(
    "wp_update_post",
    "Update an existing WordPress post. Content supports Gutenberg block markup for full block editor compatibility.",
    {
      id: z.number().describe("Post ID"),
      title: z.string().optional().describe("Post title"),
      content: z.string().optional().describe("Post content (HTML or Gutenberg block markup)"),
      status: z
        .enum(["publish", "draft", "pending", "private"])
        .optional()
        .describe("Post status"),
      categories: z.array(z.number()).optional().describe("Category IDs"),
      tags: z.array(z.number()).optional().describe("Tag IDs"),
      featured_media: z.number().optional().describe("Featured image media ID"),
    },
    async ({ id, title, content, status, categories, tags, featured_media }) => {
      const body: Record<string, unknown> = {};
      if (title !== undefined) body.title = title;
      if (content !== undefined) body.content = content;
      if (status !== undefined) body.status = status;
      if (categories !== undefined) body.categories = categories;
      if (tags !== undefined) body.tags = tags;
      if (featured_media !== undefined) body.featured_media = featured_media;

      const result = await wpFetch(`/posts/${id}`, { method: "POST", body }) as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: `Updated post #${result.id}: "${(result.title as { rendered: string })?.rendered}" (${result.status})`,
          },
        ],
      };
    }
  );

  server.tool(
    "wp_delete_post",
    "Move a WordPress post to trash",
    {
      id: z.number().describe("Post ID"),
    },
    async ({ id }) => {
      const result = await wpFetch(`/posts/${id}`, { method: "DELETE" }) as Record<string, unknown>;
      return {
        content: [
          {
            type: "text" as const,
            text: `Trashed post #${result.id}: "${(result.title as { rendered: string })?.rendered}"`,
          },
        ],
      };
    }
  );
}
