/**
 * Ordered buttons on a portfolio post.
 *
 * The CMS owns the ORDER and the URL of every button and nothing else: the
 * label and the icon of a known kind belong to the site (`i18n/postButtons`
 * and the icon map in the page), so an editor cannot retitle "Source code"
 * into something else, while a `custom` button carries its own label.
 *
 * Rows written before `portfolio_posts.buttons` existed only have the six
 * legacy link columns, so `resolvePostButtons` falls back to them — in the
 * order the page has always rendered — whenever `buttons` is missing or empty.
 */

export const postButtonKinds = [
  'website',
  'source',
  'demo',
  'store',
  'fdroid',
  'ios',
  'custom',
] as const;

export type PostButtonKind = (typeof postButtonKinds)[number];

export type PostButton = {
  kind: PostButtonKind;
  url: string;
  /** Required for `custom`, ignored for every preset. */
  label?: string;
};

export const postButtonEvents: Record<PostButtonKind, string> = {
  website: 'Website button',
  source: 'View Source Code button',
  demo: 'View Demo button',
  store: 'Play Store button',
  fdroid: 'F-Droid button',
  ios: 'iOS Store button',
  custom: 'Custom link button',
};

const legacyButtonColumns = [
  ['website', 'website'],
  ['source', 'source_link'],
  ['demo', 'demo_link'],
  ['store', 'store_link'],
  ['fdroid', 'fdroid_link'],
  ['ios', 'ios_store_link'],
] as const satisfies ReadonlyArray<
  readonly [Exclude<PostButtonKind, 'custom'>, string]
>;

type LegacyLinkFields = {
  website?: string | null;
  source_link?: string | null;
  demo_link?: string | null;
  store_link?: string | null;
  fdroid_link?: string | null;
  ios_store_link?: string | null;
};

export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPostButtonKind(value: unknown): value is PostButtonKind {
  return postButtonKinds.includes(value as PostButtonKind);
}

/**
 * Reads the stored `buttons` jsonb into render-ready buttons, dropping
 * anything unusable: an unknown kind, a URL that is not an absolute http(s)
 * URL, or a `custom` button with no label. Order is preserved.
 */
export function parsePostButtons(value: unknown): PostButton[] {
  if (!Array.isArray(value)) return [];

  const buttons: PostButton[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const { kind, url, label } = entry as {
      kind?: unknown;
      url?: unknown;
      label?: unknown;
    };
    if (!isPostButtonKind(kind) || typeof url !== 'string') continue;
    if (!isValidHttpUrl(url)) continue;
    if (kind === 'custom') {
      const trimmed = typeof label === 'string' ? label.trim() : '';
      if (!trimmed) continue;
      buttons.push({ kind, url, label: trimmed });
      continue;
    }
    buttons.push({ kind, url });
  }
  return buttons;
}

/** The six legacy columns in the order the detail page has always shown them. */
export function legacyPostButtons(post: LegacyLinkFields): PostButton[] {
  const buttons: PostButton[] = [];
  for (const [kind, column] of legacyButtonColumns) {
    const url = post[column];
    if (typeof url === 'string' && url) buttons.push({ kind, url });
  }
  return buttons;
}

/**
 * The buttons a portfolio post renders: its own ordered list when it has one,
 * otherwise the legacy columns. Non-portfolio rows have neither.
 */
export function resolvePostButtons(
  post: {
    buttons?: unknown;
  } & LegacyLinkFields
): PostButton[] {
  const stored = parsePostButtons(post.buttons);
  return stored.length > 0 ? stored : legacyPostButtons(post);
}

/** First URL of a given kind, used by JSON-LD and the GitHub stars widget. */
export function postButtonUrl(
  buttons: PostButton[],
  kind: PostButtonKind
): string | null {
  return buttons.find((button) => button.kind === kind)?.url ?? null;
}
