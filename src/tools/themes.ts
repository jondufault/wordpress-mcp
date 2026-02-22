import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { wpFetch } from "../wp-client.js";

export function registerThemeTools(server: McpServer) {
  server.tool(
    "wp_get_theme",
    "Get active theme info and global styles",
    {},
    async () => {
      // Get active theme
      const themes = (await wpFetch("/themes", {
        params: { status: "active" },
      })) as Array<Record<string, unknown>>;
      const activeTheme = themes[0];

      // Get global styles — need the global styles ID
      // WordPress stores it as a custom post type; the ID comes from the theme
      let globalStyles: unknown = null;
      try {
        // The global-styles endpoint uses a specific post ID
        // We can find it via the global-styles rest route
        const gsResult = (await wpFetch("/global-styles/themes/" + (activeTheme?.stylesheet ?? ""))) as Record<string, unknown>;
        globalStyles = {
          id: gsResult.id,
          settings: gsResult.settings,
          styles: gsResult.styles,
        };
      } catch {
        // Try alternate approach: list global-styles posts
        try {
          const gsPosts = (await wpFetch(
            `${process.env.WP_URL}/wp-json/wp/v2/global-styles`
          )) as Array<Record<string, unknown>>;
          if (gsPosts.length > 0) {
            globalStyles = {
              id: gsPosts[0].id,
              settings: gsPosts[0].settings,
              styles: gsPosts[0].styles,
            };
          }
        } catch {
          // Global styles may not be accessible
        }
      }

      const result = {
        theme: {
          name: (activeTheme?.name as { rendered?: string })?.rendered ?? activeTheme?.name,
          stylesheet: activeTheme?.stylesheet,
          version: activeTheme?.version,
          description: (activeTheme?.description as { rendered?: string })?.rendered,
        },
        global_styles: globalStyles,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "wp_update_styles",
    "Update global styles (colors, typography, spacing, layout)",
    {
      styles: z
        .record(z.unknown())
        .optional()
        .describe("Global styles object (CSS properties for blocks, elements, colors, typography)"),
      settings: z
        .record(z.unknown())
        .optional()
        .describe("Global settings object (color palette, font families, layout)"),
    },
    async ({ styles, settings }) => {
      // First, find the global styles ID
      let gsId: number | null = null;
      try {
        const themes = (await wpFetch("/themes", {
          params: { status: "active" },
        })) as Array<Record<string, unknown>>;
        const stylesheet = themes[0]?.stylesheet as string;
        const gs = (await wpFetch("/global-styles/themes/" + stylesheet)) as Record<string, unknown>;
        gsId = gs.id as number;
      } catch {
        try {
          const gsPosts = (await wpFetch(
            `${process.env.WP_URL}/wp-json/wp/v2/global-styles`
          )) as Array<Record<string, unknown>>;
          if (gsPosts.length > 0) gsId = gsPosts[0].id as number;
        } catch {
          // fallback
        }
      }

      if (!gsId) {
        return {
          content: [
            { type: "text" as const, text: "Error: Could not find global styles ID. The active theme may not support global styles." },
          ],
        };
      }

      const body: Record<string, unknown> = {};
      if (styles) body.styles = styles;
      if (settings) body.settings = settings;

      const result = await wpFetch(`/global-styles/${gsId}`, {
        method: "POST",
        body,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
