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
 * `header.buttons` is index-aligned with `navAnchors` and MUST stay in the same
 * order in both locales. The stored Italian array had Career and Portfolio
 * transposed, which is why `NavMenu` used to carry a hardcoded Italian label
 * list; that workaround is gone, and the pair is only ever edited together here.
 *
 * The merge is LOCAL OVER DATABASE and one namespace deep. The two namespaces
 * that also carry editable keys are `posts-section` (the four headings, edited
 * from the Portfolio and Blog sections) and `privacyPolicy` (the description,
 * edited from the Privacy policy section); everything else comes through from
 * the database untouched. `career-section` is deliberately absent — its date and
 * remote-type vocabulary is already edited from the Career section, which is
 * where it belongs.
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