import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch } from "../wp-client.js";

export function registerSettingsTools(server: McpServer) {
  server.tool(
    "wp_get_settings",
    "Get WordPress site settings",
    {},
    async () => {
      const result = await wpFetch("/settings");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_update_settings",
    "Update WordPress site settings",
    {
      title: z.string().optional().describe("Site title"),
      description: z.string().optional().describe("Site tagline/description"),
      show_on_front: z
        .enum(["posts", "page"])
        .optional()
        .describe("What the front page displays"),
      page_on_front: z.number().optional().describe("Page ID for static front page"),
      page_for_posts: z.number().optional().describe("Page ID for blog posts page"),
      posts_per_page: z.number().optional().describe("Number of posts per page"),
    },
    async ({ title, description, show_on_front, page_on_front, page_for_posts, posts_per_page }) => {
      const body: Record<string, unknown> = {};
      if (title !== undefined) body.title = title;
      if (description !== undefined) body.description = description;
      if (show_on_front !== undefined) body.show_on_front = show_on_front;
      if (page_on_front !== undefined) body.page_on_front = page_on_front;
      if (page_for_posts !== undefined) body.page_for_posts = page_for_posts;
      if (posts_per_page !== undefined) body.posts_per_page = posts_per_page;

      const result = await wpFetch("/settings", { method: "POST", body });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
