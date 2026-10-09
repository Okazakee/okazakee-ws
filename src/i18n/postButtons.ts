import postButtonsEn from '@/i18n/messages/postButtons.en.json';
import postButtonsIt from '@/i18n/messages/postButtons.it.json';
import type { PostButtonKind } from '@/utils/postButtons';

/**
 * Static labels for the known post button kinds. The CMS owns the ORDER and
 * the URL of every button; the label and the icon of a preset belong to the
 * site, so they live here (and only here) instead of in the CMS-editable
 * `posts-section` translations.
 *
 * `website` is absent on purpose: the globe button has always rendered as an
 * icon with no text, and `custom` is only the fallback for a button whose
 * editor-supplied label is blank.
 */
const presetLabels = {
  en: postButtonsEn,
  it: postButtonsIt,
} as const satisfies Record<
  string,
  Record<Exclude<PostButtonKind, 'website'>, string>
>;

export function postButtonLabel(
  kind: PostButtonKind,
  locale: string
): string | null {
  if (kind === 'website') return null;
  const messages = locale === 'it' ? presetLabels.it : presetLabels.en;
  return messages[kind];
}
