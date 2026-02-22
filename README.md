# WordPress MCP Server

An MCP server that connects Claude to the WordPress REST API, giving it the ability to manage posts, pages, media, themes, navigation, and more.

## Prerequisites

- Node.js 18+
- A WordPress site with REST API enabled (most modern WordPress sites)
- A WordPress [Application Password](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/)

## Creating a WordPress Application Password

1. Log into your WordPress admin dashboard
2. Go to **Users → Profile**
3. Scroll down to **Application Passwords**
4. Enter a name (e.g. "Claude MCP") and click **Add New Application Password**
5. Copy the generated password — you won't be able to see it again

## Setup

```bash
git clone <repo-url>
cd wordpress-mcp
npm install
npm run build
```

## Adding to Claude Code

```bash
claude mcp add wordpress \
  -e WP_URL=https://your-site.com \
  -e WP_USER=your-username \
  -e WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx" \
  -- node /path/to/wordpress-mcp/build/index.js
```

This stores the server config (including credentials) in your user-scoped `~/.claude.json`, which is never committed to any repo.

### Verify it's working

Restart Claude Code, then ask it something like "list my WordPress posts". You should see the `wordpress` MCP tools available.

## Available Tools

| Tool | Description |
|------|-------------|
| `wp_list_posts` | List posts with optional filters (status, search, pagination) |
| `wp_get_post` | Get a single post by ID |
| `wp_create_post` | Create a new post |
| `wp_update_post` | Update an existing post |
| `wp_delete_post` | Delete a post |
| `wp_list_pages` | List pages |
| `wp_get_page` | Get a single page by ID |
| `wp_update_page` | Update a page |
| `wp_list_media` | List media library items |
| `wp_upload_media` | Upload a file to the media library |
| `wp_get_settings` | Get site settings (title, tagline, etc.) |
| `wp_update_settings` | Update site settings |
| `wp_get_theme` | Get current theme and global styles |
| `wp_update_styles` | Update theme global styles (colors, fonts, spacing) |
| `wp_list_categories` | List categories |
| `wp_create_category` | Create a new category |
| `wp_list_navigation` | List navigation menus |
| `wp_update_navigation` | Update a navigation menu |
| `wp_list_template_parts` | List template parts (header, footer, sidebar, etc.) |
| `wp_update_template_part` | Update a template part |
| `wp_screenshot` | Take a screenshot of the site or a specific post/page |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `WP_URL` | Your WordPress site URL (e.g. `https://example.com`) |
| `WP_USER` | WordPress username |
| `WP_APP_PASSWORD` | Application password (spaces included) |

## Development

```bash
npm run dev    # watch mode — recompiles on changes
npm run build  # one-time build
```
