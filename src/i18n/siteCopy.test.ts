import { describe, expect, it } from 'vitest';
import { withSiteCopy } from '@/i18n/siteCopy';

describe('withSiteCopy', () => {
  it.each(['en', 'it'])('keeps structural copy local in %s', (locale) => {
    const local = withSiteCopy({}, locale);
    const merged = withSiteCopy(
      {
        'skills-section': { title: 'stale', subtitle: 'stale' },
        'career-section': { title: 'stale', remote: { full: 'stale' } },
        'posts-section': { title1: 'stale', subtitle2: 'stale' },
        'contacts-section': { title: 'stale', subtitle: 'stale' },
        privacyPolicy: { title: 'stale', description: 'stale' },
      },
      locale
    );
    for (const namespace of [
      'skills-section',
      'career-section',
      'posts-section',
      'contacts-section',
      'privacyPolicy',
    ]) {
      expect(merged[namespace]).toEqual(local[namespace]);
    }
  });

  it('preserves CMS-owned hero and request content', () => {
    const content = {
      'hero-section': { top: { name: 'Edited name', roles: { 0: 'Role' } } },
      'request-form': { title: 'Edited request' },
    };
    expect(withSiteCopy(content, 'en')).toMatchObject(content);
  });

  it('falls back to English for an unsupported locale', () => {
    expect(withSiteCopy(null, 'unknown')).toEqual(withSiteCopy({}, 'en'));
  });
});
