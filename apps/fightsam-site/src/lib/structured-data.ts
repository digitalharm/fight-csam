import { siteUrl } from './shared';

// One shared Organization entity across both properties (digitalharm.org is the
// canonical org home; FightCSAM is its developer brand). Consistent @id + sameAs
// is what lets search + AI engines treat the two sites as one corroborated
// entity — see docs/gtm/seo-geo-strategy.md §2D.
const DHP_ORG_ID = 'https://digitalharm.org/#organization';
const WEBSITE_ID = `${siteUrl}/#website`;

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': DHP_ORG_ID,
    name: 'The Digital Harm Project',
    url: 'https://digitalharm.org',
    sameAs: [siteUrl, 'https://github.com/digitalharm'],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'FightCSAM',
    url: siteUrl,
    description:
      'Free, open-source software that helps any online platform detect, report, and prevent child sexual abuse material (CSAM) — and meet the legal duties that now require it.',
    inLanguage: 'en',
    publisher: { '@id': DHP_ORG_ID },
  };
}

// The 11 tools + their primary implementation languages (dual-language packages
// list both). Non-tool docs pages (index, skill, ecosystem/*) return null.
const TOOL_LANGUAGES: Record<string, string[]> = {
  hashkit: ['Rust'],
  'hashkit-match': ['Rust'],
  'c2pa-lite': ['Rust'],
  safemod: ['Rust'],
  'detectkit-test': ['Python'],
  promptshield: ['Python'],
  trainguard: ['Python'],
  'csam-shield': ['Python', 'TypeScript'],
  'cybertip-cli': ['Python', 'TypeScript'],
  hashstream: ['Go', 'TypeScript'],
  evidencevault: ['Go'],
};

export function toolSchema(
  slug: string | undefined,
  title: string,
  description: string | undefined,
  pageUrl: string,
) {
  if (!slug || !(slug in TOOL_LANGUAGES)) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: title,
    ...(description ? { description } : {}),
    url: `${siteUrl}${pageUrl}`,
    codeRepository: 'https://github.com/digitalharm/fight-csam',
    programmingLanguage: TOOL_LANGUAGES[slug],
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': DHP_ORG_ID },
  };
}
