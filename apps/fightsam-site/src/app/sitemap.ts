import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';
import { siteUrl } from '@/lib/shared';

// `output: 'export'` — Next emits this as a static /sitemap.xml at build time.
// lastModified is intentionally omitted (like digitalharm.org) so crawlers do
// not see "everything changed" on every deploy.
export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl.replace(/\/+$/, '');

  const roots: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/llms.txt`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/llms-full.txt`, changeFrequency: 'weekly', priority: 0.4 },
  ];

  const pages: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${base}${page.url}`,
    changeFrequency: 'monthly',
    priority: page.url === '/docs' ? 0.9 : 0.7,
  }));

  return [...roots, ...pages];
}
