import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  query: z.string().min(1).max(120),
  limit: z.number().int().min(1).max(25).optional(),
});

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  snippet: string;
};

/**
 * Free Google News RSS feed. No API key required. Cached per-request only;
 * caller should debounce/throttle. Returns clearly-labelled real items.
 */
export const getNews = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ items: NewsItem[]; error: string | null }> => {
    try {
      const q = encodeURIComponent(data.query);
      const url = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AlphaDeskBot/1.0)" },
      });
      if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
      const xml = await res.text();

      const items: NewsItem[] = [];
      const itemRe = /<item>([\s\S]*?)<\/item>/g;
      let m: RegExpExecArray | null;
      const limit = data.limit ?? 12;
      while ((m = itemRe.exec(xml)) && items.length < limit) {
        const block = m[1];
        const pick = (tag: string) => {
          const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(block);
          if (!r) return "";
          return r[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
        };
        const titleRaw = pick("title");
        const link = pick("link");
        const pubDate = pick("pubDate");
        const description = pick("description");
        // Google News title is "Headline - Source"
        const sepIdx = titleRaw.lastIndexOf(" - ");
        const title = sepIdx > 0 ? titleRaw.slice(0, sepIdx) : titleRaw;
        const source = sepIdx > 0 ? titleRaw.slice(sepIdx + 3) : "Google News";
        const snippet = description
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .slice(0, 220);
        items.push({ title, link, source, pubDate, snippet });
      }
      return { items, error: null };
    } catch (err) {
      console.error("getNews failed:", err);
      return { items: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
  });
