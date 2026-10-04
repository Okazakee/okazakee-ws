/**
 * Structured data (JSON-LD) builders for okazakee.dev.
 *
 * Entity model
 * ------------
 * - `Person` (#person) is the single canonical entity for Cristian. It is
 *   defined in full on the home page; every other page embeds a local stub
 *   (same @id, with name/url) so crawlers landing directly on a detail page
 *   still resolve the author locally.
 * - `WebSite` (#website) describes this site and links back to the Person.
 *
 * Portfolio project types
 * -----------------------
 * - PORTFOLIO_OVERRIDES holds explicit, hand-picked types for the current
 *   catalog (keyed by DB id). Anything not listed there falls back to
 *   classifyProject() so future projects still get a sensible type without
 *   touching this file. When adding a project: rely on the fallback, or add
 *   an override entry with a comment explaining the choice.
 */

export const SITE_NAME = 'Okazakee';

export const PERSON_NAME = 'Cristian Di Carlo';
export const PERSON_ALTERNATE_NAME = 'Okazakee';
export const PERSON_JOB_TITLE = 'Full-stack and Mobile Developer';

/**
 * Site-wide Open Graph image (the file-based `opengraph-image.png` route).
 * Declared explicitly because a page-level `openGraph` object replaces the
 * auto-injected file metadata wholesale — pages that add `openGraph` fields
 * must re-declare the image to keep social previews intact.
 * If the image file changes, update width/height here.
 */
export const SITE_OG_IMAGE = {
  url: '/opengraph-image.png',
  type: 'image/png',
  width: 1731,
  height: 909,
};

export function personEntityId(baseUrl: string): string {
  return `${baseUrl}/#person`;
}

export function websiteEntityId(baseUrl: string): string {
  return `${baseUrl}/#website`;
}

export type PersonRef = {
  '@type': 'Person';
  '@id': string;
  name: string;
  url: string;
};

export type PersonJsonLd = PersonRef & {
  alternateName: string;
  jobTitle: string;
  sameAs?: string[];
};

/**
 * Minimal Person stub for detail pages — same stable @id as the full node
 * defined on the home page, plus enough local data (name, url) to stand
 * alone for a crawler that only sees this page.
 */
export function personRef(baseUrl: string): PersonRef {
  return {
    '@type': 'Person',
    '@id': personEntityId(baseUrl),
    name: PERSON_NAME,
    url: baseUrl,
  };
}

/** Full Person node (home page). `sameAs` is derived from the contacts data. */
export function buildPersonNode(
  baseUrl: string,
  sameAs: string[] = []
): PersonJsonLd {
  const node: PersonJsonLd = {
    '@type': 'Person',
    '@id': personEntityId(baseUrl),
    name: PERSON_NAME,
    alternateName: PERSON_ALTERNATE_NAME,
    url: baseUrl,
    jobTitle: PERSON_JOB_TITLE,
  };
  if (sameAs.length > 0) {
    node.sameAs = sameAs;
  }
  return node;
}

export type WebSiteJsonLd = {
  '@type': 'WebSite';
  '@id': string;
  url: string;
  name: string;
  inLanguage: string[];
  author: PersonRef;
};

export function buildWebSiteNode(baseUrl: string): WebSiteJsonLd {
  return {
    '@type': 'WebSite',
    '@id': websiteEntityId(baseUrl),
    url: baseUrl,
    name: SITE_NAME,
    inLanguage: ['en', 'it'],
    author: personRef(baseUrl),
  };
}

/** Hostnames recognised as personal profile links (for Person.sameAs). */
const PROFILE_HOSTS = [
  'github.com',
  'linkedin.com',
  't.me',
  'x.com',
  'twitter.com',
  'bsky.app',
  'mastodon.social',
];

/**
 * Filter arbitrary contact links down to personal profile URLs suitable for
 * `Person.sameAs` (allow-listed hosts only, deduplicated, trailing slash
 * removed).
 */
export function pickSameAs(links: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const raw of links) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./, '');
      if (PROFILE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
        out.add(`${url.origin}${url.pathname.replace(/\/+$/, '')}`);
      }
    } catch {
      // Not a valid absolute URL — skip.
    }
  }
  return [...out];
}

export interface BlogPostingData {
  baseUrl: string;
  canonicalUrl: string;
  locale: string;
  title: string;
  description: string;
  image: string;
  datePublished: string;
}

export type BlogPostingJsonLd = {
  '@type': 'BlogPosting';
  '@id': string;
  mainEntityOfPage: string;
  url: string;
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  inLanguage: string;
  author: PersonRef;
};

export function buildBlogPostingNode({
  baseUrl,
  canonicalUrl,
  locale,
  title,
  description,
  image,
  datePublished,
}: BlogPostingData): BlogPostingJsonLd {
  return {
    '@type': 'BlogPosting',
    '@id': `${canonicalUrl}#article`,
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
    headline: title,
    description,
    image: [image],
    datePublished,
    inLanguage: locale,
    author: personRef(baseUrl),
  };
}

export type ProjectSchemaType =
  | 'SoftwareSourceCode'
  | 'SoftwareApplication'
  | 'WebApplication'
  | 'MobileApplication'
  | 'WebSite'
  | 'CreativeWork';

export interface ProjectSchemaOverride {
  type: ProjectSchemaType;
  applicationCategory?: string;
  operatingSystem?: string;
  programmingLanguage?: string;
  /** Where the primary link goes: `url` (default) or `installUrl` (stores). */
  linkAs?: 'url' | 'installUrl';
}

/**
 * Explicit overrides for the current portfolio catalog (by DB id).
 * Anything not listed here falls back to classifyProject().
 */
export const PORTFOLIO_OVERRIDES: Record<number, ProjectSchemaOverride> = {
  // DockerCraft — container image, distributed via its repository.
  2: { type: 'SoftwareSourceCode' },
  // CalypsoPi Website — the deliverable is a live website.
  21: { type: 'WebSite' },
  // Spendr — mobile finance tracker (Play Store).
  22: {
    type: 'MobileApplication',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Android',
    linkAs: 'installUrl',
  },
  // TravelShield — TPM2/LUKS security tool, distributed via Homebrew.
  23: {
    type: 'SoftwareApplication',
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Linux',
  },
  // Blurkit — TypeScript library/package.
  24: { type: 'SoftwareSourceCode', programmingLanguage: 'TypeScript' },
  // PearLift — local-first mobile workout tracker.
  25: {
    type: 'MobileApplication',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Android',
  },
  // MinePanel — self-hosted web management platform.
  26: { type: 'WebApplication', applicationCategory: 'GameApplication' },
};

export interface ProjectLinkData {
  website?: string | null;
  demo?: string | null;
  store?: string | null;
  source?: string | null;
}

/** Safe generic fallback for projects without an explicit override. */
export function classifyProject(
  project: ProjectLinkData
): ProjectSchemaOverride {
  if (project.store) return { type: 'MobileApplication', linkAs: 'installUrl' };
  if (project.website || project.demo) return { type: 'WebApplication' };
  if (project.source) return { type: 'SoftwareSourceCode' };
  return { type: 'CreativeWork' };
}

export interface ProjectNodeData {
  baseUrl: string;
  canonicalUrl: string;
  id: number;
  name: string;
  description: string;
  links: ProjectLinkData;
}

export type ProjectJsonLd = {
  '@type': ProjectSchemaType;
  '@id': string;
  name: string;
  description: string;
  url?: string;
  installUrl?: string;
  codeRepository?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  programmingLanguage?: string;
  author: PersonRef;
};

export function buildProjectNode({
  baseUrl,
  canonicalUrl,
  id,
  name,
  description,
  links,
}: ProjectNodeData): ProjectJsonLd {
  const kind = PORTFOLIO_OVERRIDES[id] ?? classifyProject(links);
  const node: ProjectJsonLd = {
    '@type': kind.type,
    '@id': `${canonicalUrl}#project`,
    name,
    description,
    author: personRef(baseUrl),
  };

  const webLink = links.website || links.demo || null;
  if (webLink) {
    node.url = webLink;
  } else if (links.store && kind.linkAs !== 'installUrl') {
    node.url = links.store;
  }
  if (kind.linkAs === 'installUrl' && links.store) {
    node.installUrl = links.store;
  }
  if (links.source && kind.type === 'SoftwareSourceCode') {
    node.codeRepository = links.source;
  }
  if (kind.applicationCategory) {
    node.applicationCategory = kind.applicationCategory;
  }
  if (kind.operatingSystem) node.operatingSystem = kind.operatingSystem;
  if (kind.programmingLanguage) {
    node.programmingLanguage = kind.programmingLanguage;
  }

  return node;
}
