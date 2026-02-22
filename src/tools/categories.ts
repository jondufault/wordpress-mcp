import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch } from "../wp-client.js";

export function registerCategoryTools(server: McpServer) {
  server.tool(
    "wp_list_categories",
    "List categories or tags",
    {
      type: z
        .enum(["category", "tag"])
        .optional()
        .describe("Taxonomy type (default: category)"),
    },
    async ({ type }) => {
      const endpoint = type === "tag" ? "/tags" : "/categories";
      const result = await wpFetch(endpoint, {
        params: { per_page: "100" },
      });
      const items = result as Array<Record<string, unknown>>;
      const summary = items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        count: item.count,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_create_category",
    "Create a new category or tag",
    {
      name: z.string().describe("Category/tag name"),
      type: z
        .enum(["category", "tag"])
        .optional()
        .describe("Taxonomy type (default: category)"),
      description: z.string().optional().describe("Description"),
    },
    async ({ name, type, description }) => {
      const endpoint = type === "tag" ? "/tags" : "/categories";
      const body: Record<string, unknown> = { name };
      if (description) body.description = description;

      const result = (await wpFetch(endpoint, { method: "POST", body })) as Record<string, unknown>;
      const taxType = type === "tag" ? "tag" : "category";
      return {
        content: [
          {
            type: "text" as const,
            text: `Created ${taxType} #${result.id}: "${result.name}"`,
          },
        ],
      };
    }
  );
}
