import { describe, expect, it } from 'vitest';
import {
  isLegacyCmsRoute,
  stripLegacyCmsSegment,
} from '@/utils/legacyCmsRoute';

describe('isLegacyCmsRoute', () => {
  it('matches /{locale}/cms and /{locale}/cms/<path>', () => {
    expect(isLegacyCmsRoute('/en/cms')).toBe(true);
    expect(isLegacyCmsRoute('/en/cms/')).toBe(true);
    expect(isLegacyCmsRoute('/en/cms/login')).toBe(true);
    expect(isLegacyCmsRoute('/en/cms/auth/github/start')).toBe(true);
    expect(isLegacyCmsRoute('/it/cms')).toBe(true);
  });

  it('does NOT match look-alike paths', () => {
    expect(isLegacyCmsRoute('/en/something-cms-whatever')).toBe(false);
    expect(isLegacyCmsRoute('/en/cmslogin')).toBe(false);
    expect(isLegacyCmsRoute('/en/mycms')).toBe(false);
    expect(isLegacyCmsRoute('/en/cmsx')).toBe(false);
    expect(isLegacyCmsRoute('/cms')).toBe(false);
    expect(isLegacyCmsRoute('/cms/login')).toBe(false);
    expect(isLegacyCmsRoute('/EN/cms')).toBe(false);
    expect(isLegacyCmsRoute('/en')).toBe(false);
    expect(isLegacyCmsRoute('/en/login')).toBe(false);
  });
});

describe('stripLegacyCmsSegment', () => {
  it('removes the /cms segment, preserving the rest of the path', () => {
    expect(stripLegacyCmsSegment('/en/cms')).toBe('/en');
    expect(stripLegacyCmsSegment('/en/cms/login')).toBe('/en/login');
    expect(stripLegacyCmsSegment('/en/cms/auth/github/start')).toBe(
      '/en/auth/github/start'
    );
  });

  it('leaves non-legacy paths unchanged', () => {
    expect(stripLegacyCmsSegment('/en/login')).toBe('/en/login');
  });
});
