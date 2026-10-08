import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SkillsCategory } from '@/types/fetchedData.types';

const h = vi.hoisted(() => ({ getSkillsCategories: vi.fn() }));

vi.mock('@/utils/getData', () => ({
  getSkillsCategories: h.getSkillsCategories,
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock('next/image', async () => {
  const React = await import('react');
  return {
    default: (props: { src?: string; alt?: string; className?: string }) =>
      React.createElement('img', {
        src: props.src,
        alt: props.alt,
        className: props.className,
      }),
  };
});
vi.mock('next/link', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) =>
      React.createElement('a', props),
  };
});

import Skills from './Skills';

function skill(
  id: number,
  overrides: Partial<SkillsCategory['skills'][number]> = {}
) {
  return {
    id,
    title: `Skill ${id}`,
    icon: `https://cdn.example.com/${id}.svg`,
    invert: false,
    category_id: 1,
    blurhashURL: '',
    link: null,
    position: null,
    ...overrides,
  };
}

function category(skills: SkillsCategory['skills']): SkillsCategory {
  return { id: 1, name: 'Languages', position: 0, skills };
}

async function render(skills: SkillsCategory['skills']) {
  h.getSkillsCategories.mockResolvedValue([category(skills)]);
  const element = await Skills({ locale: 'en' });
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  h.getSkillsCategories.mockReset();
});

describe('Skills tiles', () => {
  it('renders an unlinked skill without an anchor', async () => {
    const markup = await render([skill(1)]);

    expect(markup).not.toContain('<a ');
    expect(markup).toContain('Skill 1');
  });

  it('renders a linked skill as an external anchor', async () => {
    const markup = await render([
      skill(1, { link: 'https://www.typescriptlang.org/' }),
    ]);
    expect(markup).toContain('href="https://www.typescriptlang.org/"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('target="_blank"');
  });

  it('treats a blank link as no link', async () => {
    const markup = await render([skill(1, { link: '   ' })]);

    expect(markup).not.toContain('<a ');
  });

  it('renders skills in the canonical order regardless of row order', async () => {
    const markup = await render([
      skill(3, { position: null }),
      skill(2, { position: 0 }),
      skill(1, { position: 1 }),
    ]);

    expect(markup.indexOf('Skill 2')).toBeLessThan(markup.indexOf('Skill 1'));
    expect(markup.indexOf('Skill 1')).toBeLessThan(markup.indexOf('Skill 3'));
  });

  it('renders renamed CMS categories in position order, not localized names', async () => {
    h.getSkillsCategories.mockResolvedValue([
      { id: 1, name: 'Renamed stack', position: 1, skills: [skill(1)] },
      { id: 2, name: 'First tools', position: 0, skills: [skill(2)] },
    ]);
    const markup = renderToStaticMarkup(await Skills({ locale: 'it' }));
    expect(markup).toContain('Renamed stack');
    expect(markup.indexOf('First tools')).toBeLessThan(
      markup.indexOf('Renamed stack')
    );
    expect(markup).not.toContain('skills.1');
  });
});
