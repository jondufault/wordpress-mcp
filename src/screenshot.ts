import puppeteer from "puppeteer";
import { WP_URL, WP_USER, WP_APP_PASSWORD } from "./wp-client.js";

export interface ScreenshotResult {
  data: string; // base64
  mimeType: "image/jpeg";
}

export async function takeScreenshot(options: {
  url?: string;
  postId?: number;
  width?: number;
}): Promise<ScreenshotResult> {
  const { url, postId, width = 1280 } = options;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900 });

    let targetUrl: string;

    if (postId) {
      // Look up the post to determine if it's published or draft
      const { wpFetch } = await import("./wp-client.js");
      const post = (await wpFetch(`/posts/${postId}`)) as Record<string, unknown>;
      const status = post.status as string;

      if (status === "publish") {
        targetUrl = post.link as string;
      } else {
        // Draft — need to authenticate via wp-login first
        await page.goto(`${WP_URL}/wp-login.php`, { waitUntil: "networkidle2" });
        await page.type("#user_login", WP_USER!);
        await page.type("#user_pass", WP_APP_PASSWORD!);
        await Promise.all([
          page.click("#wp-submit"),
          page.waitForNavigation({ waitUntil: "networkidle2" }),
        ]);
        targetUrl = `${WP_URL}/?p=${postId}&preview=true`;
      }
    } else if (url) {
      targetUrl = url;
    } else {
      throw new Error("Either url or postId must be provided");
    }

    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 30000 });
    // Brief pause to let late-loading assets settle
    await new Promise((r) => setTimeout(r, 1000));

    // Take screenshot with progressive quality reduction if too large
    for (const quality of [75, 60, 45]) {
      const buffer = await page.screenshot({
        type: "jpeg",
        quality,
        fullPage: true,
      });
      const data = Buffer.from(buffer).toString("base64");

      // Check size — MCP image responses should be reasonable
      if (data.length <= 1_400_000) {
        // ~1MB base64 ≈ 1MB decoded
        return { data, mimeType: "image/jpeg" };
      }
    }

    // If still too large at quality 45, just return it
    const buffer = await page.screenshot({
      type: "jpeg",
      quality: 30,
      fullPage: true,
    });
    return {
      data: Buffer.from(buffer).toString("base64"),
      mimeType: "image/jpeg",
    };
  } finally {
    await browser.close();
  }
}
