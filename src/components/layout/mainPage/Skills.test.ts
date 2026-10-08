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

const tileClasses =
  'group relative flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-card p-3.5 transition-colors hover:border-accent-violet/50 hover:bg-surface-card-hover w-full sm:w-[calc(50%-7px)] lg:w-[calc(33.333%-10px)]';

describe('Skills tiles', () => {
  it('renders an unlinked tile as a plain div, exactly as before', async () => {
    const markup = await render([skill(1)]);

    expect(markup).toContain(`<div class="${tileClasses}">`);
    expect(markup).not.toContain('<a ');
    expect(markup).toContain('Skill 1');
  });

  it('renders a linked tile as an external anchor with the same tokens', async () => {
    const markup = await render([
      skill(1, { link: 'https://www.typescriptlang.org/' }),
    ]);
    expect(markup).toContain(
      `<a class="${tileClasses}" href="https://www.typescriptlang.org/" rel="noopener noreferrer" target="_blank">`
    );
  });

  it('treats a blank link as no link', async () => {
    const markup = await render([skill(1, { link: '   ' })]);

    expect(markup).not.toContain('<a ');
    expect(markup).toContain(`<div class="${tileClasses}">`);
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
});
