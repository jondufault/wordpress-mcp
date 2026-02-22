import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPostTools } from "./tools/posts.js";
import { registerMediaTools } from "./tools/media.js";
import { registerPageTools } from "./tools/pages.js";
import { registerSettingsTools } from "./tools/settings.js";
import { registerThemeTools } from "./tools/themes.js";
import { registerCategoryTools } from "./tools/categories.js";
import { registerPreviewTools } from "./tools/preview.js";
import { registerNavigationTools } from "./tools/navigation.js";
import { registerTemplatePartTools } from "./tools/template-parts.js";

const server = new McpServer({
  name: "wordpress",
  version: "1.0.0",
});

// Register all tools
registerPostTools(server);
registerMediaTools(server);
registerPageTools(server);
registerSettingsTools(server);
registerThemeTools(server);
registerCategoryTools(server);
registerPreviewTools(server);
registerNavigationTools(server);
registerTemplatePartTools(server);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("WordPress MCP server running");
