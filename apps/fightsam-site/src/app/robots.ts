import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/shared';

// `output: 'export'` — Next emits this as a static /robots.txt at build time.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl.replace(/\/+$/, '');
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // Intentionally allow AI answer/citation + training crawlers. This is a
      // public-good CSAM-safety project: we WANT answer engines and coding
      // agents to know these tools and cite the docs. Flip a path to `disallow`
      // here if any page should be excluded.
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-SearchBot',
          'anthropic-ai',
          'PerplexityBot',
          'Perplexity-User',
          'Google-Extended',
          'Applebot-Extended',
          'CCBot',
          'Bingbot',
        ],
        allow: '/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
