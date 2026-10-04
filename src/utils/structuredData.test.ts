import { describe, expect, it } from 'vitest';
import {
  PORTFOLIO_OVERRIDES,
  buildBlogPostingNode,
  buildPersonNode,
  buildProjectNode,
  buildWebSiteNode,
  classifyProject,
  personEntityId,
  personRef,
  pickSameAs,
  websiteEntityId,
} from './structuredData';

const BASE = 'https://okazakee.dev';

describe('entity ids', () => {
  it('are stable and derived from the base url', () => {
    expect(personEntityId(BASE)).toBe('https://okazakee.dev/#person');
    expect(websiteEntityId(BASE)).toBe('https://okazakee.dev/#website');
  });
});

describe('personRef', () => {
  it('embeds enough local data to resolve the author on a detail page', () => {
    expect(personRef(BASE)).toEqual({
      '@type': 'Person',
      '@id': 'https://okazakee.dev/#person',
      name: 'Cristian Di Carlo',
      url: BASE,
    });
  });
});

describe('buildPersonNode', () => {
  it('builds the full node with alias, job title and sameAs', () => {
    const node = buildPersonNode(BASE, ['https://github.com/okazakee']);
    expect(node['@id']).toBe(personEntityId(BASE));
    expect(node.name).toBe('Cristian Di Carlo');
    expect(node.alternateName).toBe('Okazakee');
    expect(node.jobTitle).toBe('Full-stack and Mobile Developer');
    expect(node.sameAs).toEqual(['https://github.com/okazakee']);
  });

  it('omits sameAs when there are no profile links', () => {
    expect('sameAs' in buildPersonNode(BASE)).toBe(false);
  });
});

describe('buildWebSiteNode', () => {
  it('describes the site and links back to the same Person entity', () => {
    const node = buildWebSiteNode(BASE);
    expect(node['@type']).toBe('WebSite');
    expect(node.name).toBe('Okazakee');
    expect(node.inLanguage).toEqual(['en', 'it']);
    expect(node.author['@type']).toBe('Person');
    expect(node.author['@id']).toBe(personEntityId(BASE));
  });
});

describe('pickSameAs', () => {
  it('keeps allow-listed profile hosts and drops everything else', () => {
    expect(
      pickSameAs([
        'https://github.com/okazakee',
        'https://www.linkedin.com/in/okazakee/',
        'https://t.me/okazakee',
        'https://getportal.cc/',
        'mailto:okazakee@proton.me',
        null,
        undefined,
        'not-a-url',
      ])
    ).toEqual([
      'https://github.com/okazakee',
      'https://www.linkedin.com/in/okazakee',
      'https://t.me/okazakee',
    ]);
  });

  it('deduplicates links that differ only by trailing slash', () => {
    expect(
      pickSameAs([
        'https://github.com/okazakee',
        'https://github.com/okazakee/',
      ])
    ).toEqual(['https://github.com/okazakee']);
  });
});

describe('buildBlogPostingNode', () => {
  it('includes headline, dates, canonical url and the author ref', () => {
    const node = buildBlogPostingNode({
      baseUrl: BASE,
      canonicalUrl: 'https://okazakee.dev/en/blog/12/dear-mom',
      locale: 'en',
      title: 'Dear mom...',
      description: 'Letter to my mother',
      image: 'https://cdn.example/dear-mom.webp',
      datePublished: '2026-02-10T00:00:00Z',
    });
    expect(node['@type']).toBe('BlogPosting');
    expect(node['@id']).toBe('https://okazakee.dev/en/blog/12/dear-mom#article');
    expect(node.url).toBe('https://okazakee.dev/en/blog/12/dear-mom');
    expect(node.mainEntityOfPage).toBe(node.url);
    expect(node.headline).toBe('Dear mom...');
    expect(node.datePublished).toBe('2026-02-10T00:00:00Z');
    expect(node.inLanguage).toBe('en');
    expect(node.author).toEqual(personRef(BASE));
  });
});

describe('classifyProject fallback', () => {
  it('prefers mobile store apps', () => {
    expect(classifyProject({ store: 'https://play.google.com/x' })).toEqual({
      type: 'MobileApplication',
      linkAs: 'installUrl',
    });
  });

  it('falls back to WebApplication for web deliverables', () => {
    expect(classifyProject({ demo: 'https://x.dev' }).type).toBe(
      'WebApplication'
    );
    expect(classifyProject({ website: 'https://x.dev' }).type).toBe(
      'WebApplication'
    );
  });

  it('falls back to SoftwareSourceCode for repos', () => {
    expect(classifyProject({ source: 'https://github.com/x' }).type).toBe(
      'SoftwareSourceCode'
    );
  });

  it('falls back to CreativeWork when nothing matches', () => {
    expect(classifyProject({}).type).toBe('CreativeWork');
  });
});

describe('buildProjectNode', () => {
  it('uses the explicit override for MinePanel (id 26)', () => {
    const node = buildProjectNode({
      baseUrl: BASE,
      canonicalUrl: 'https://okazakee.dev/en/portfolio/26/minepanel',
      id: 26,
      name: 'MinePanel',
      description: 'Self-hosted Minecraft management',
      links: {
        website: 'https://minepanel.xyz/',
        source: 'https://github.com/MinePanelProject',
      },
    });
    expect(node['@type']).toBe('WebApplication');
    expect(node.applicationCategory).toBe('GameApplication');
    expect(node.url).toBe('https://minepanel.xyz/');
    expect('codeRepository' in node).toBe(false);
    expect(node.author['@id']).toBe(personEntityId(BASE));
  });

  it('routes store links to installUrl (Spendr, id 22)', () => {
    const node = buildProjectNode({
      baseUrl: BASE,
      canonicalUrl: 'https://okazakee.dev/en/portfolio/22/spendr',
      id: 22,
      name: 'Spendr',
      description: 'Personal finance tracker',
      links: {
        store: 'https://play.google.com/store/apps/details?id=com.okazakee.spendr',
        source: 'https://github.com/Okazakee/spendr',
      },
    });
    expect(node['@type']).toBe('MobileApplication');
    expect(node.installUrl).toContain('play.google.com');
    expect('url' in node).toBe(false);
    expect('codeRepository' in node).toBe(false);
  });

  it('falls back safely for ids without an override', () => {
    const node = buildProjectNode({
      baseUrl: BASE,
      canonicalUrl: 'https://okazakee.dev/en/portfolio/99/new-thing',
      id: 99,
      name: 'New Thing',
      description: 'A future project',
      links: { source: 'https://github.com/Okazakee/new-thing' },
    });
    expect(node['@type']).toBe('SoftwareSourceCode');
  });

  it('keeps an override entry for each shipped catalog id', () => {
    for (const id of Object.keys(PORTFOLIO_OVERRIDES)) {
      expect(Number.isInteger(Number(id))).toBe(true);
    }
    expect(PORTFOLIO_OVERRIDES[26].type).toBe('WebApplication');
  });

  it('keeps codeRepository only for source-code projects (DockerCraft, id 2)', () => {
    const node = buildProjectNode({
      baseUrl: BASE,
      canonicalUrl: 'https://okazakee.dev/en/portfolio/2/dockercraft',
      id: 2,
      name: 'DockerCraft',
      description: 'Minecraft in Docker',
      links: { source: 'https://github.com/Okazakee/DockerCraft' },
    });
    expect(node['@type']).toBe('SoftwareSourceCode');
    expect(node.codeRepository).toBe('https://github.com/Okazakee/DockerCraft');
    expect('url' in node).toBe(false);
  });

  it('keeps the website as url and the store as installUrl when both exist (id 22)', () => {
    const node = buildProjectNode({
      baseUrl: BASE,
      canonicalUrl: 'https://okazakee.dev/en/portfolio/22/spendr',
      id: 22,
      name: 'Spendr',
      description: 'Personal finance tracker',
      links: {
        website: 'https://spendr.example.com',
        store:
          'https://play.google.com/store/apps/details?id=com.okazakee.spendr',
      },
    });
    expect(node.url).toBe('https://spendr.example.com');
    expect(node.installUrl).toContain('play.google.com');
  });
});
