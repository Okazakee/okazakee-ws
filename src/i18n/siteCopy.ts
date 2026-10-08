import siteEn from '@/i18n/messages/site.en.json';
import siteIt from '@/i18n/messages/site.it.json';

/**
 * Copy the CMS can no longer edit.
 *
 * These strings live in the site, not in `i18n_translations`: they are chrome,
 * not content. Error pages, the footer, the nav labels and post link labels are
 * structural — an editor retitling "Page not found" or swapping the nav order
 * breaks the product rather than the words. Same rule as
 * `i18n/postButtons.ts` and `i18n/requestForm.ts`.
 *
 * `header.buttons` is index-aligned with the nav's render order
 * (`navItemIds`) and MUST stay in the same order in both locales. The stored Italian array had Career and Portfolio
 * transposed, which is why `NavMenu` used to carry a hardcoded Italian label
 * list; that workaround is gone, and the pair is only ever edited together here.
 *
 * The merge is LOCAL OVER DATABASE and one namespace deep. Structural section
 * headings, career vocabulary, and privacy description belong to the site.
 * Skills category names, hero content, and policy bodies remain CMS-owned.
 *
 * A frozen key can never be overridden by a stale database row.
 */
const frozen = { en: siteEn, it: siteIt } as const;

type MessageTree = Record<string, unknown>;

function isPlainObject(value: unknown): value is MessageTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function withSiteCopy(messages: unknown, locale: string): MessageTree {
  const fromDb = isPlainObject(messages) ? messages : {};
  const local = frozen[locale as keyof typeof frozen] ?? frozen.en;
  const merged: MessageTree = { ...fromDb };

  for (const [namespace, keys] of Object.entries(local)) {
    const existing = fromDb[namespace];
    merged[namespace] =
      isPlainObject(existing) && isPlainObject(keys)
        ? { ...existing, ...keys }
        : keys;
  }

  return merged;
}
