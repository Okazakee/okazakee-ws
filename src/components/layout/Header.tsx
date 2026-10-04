import logoLight from '@public/title-ws-lightmode.png';
import logo from '@public/title-ws.png';
import Image from 'next/image';
import Link from 'next/link';
import { parseNavAnchors } from '@/utils/navAnchors';
import NavMenu from './NavMenu';

/**
 * Site header, canon layout (docs/DESIGN.md §4): a three-column grid whose
 * children carry explicit col-start placements, so hiding the desktop nav on
 * mobile cannot shift the controls into the middle column.
 *
 * Both logos are CMS-editable, one per theme, and resolve PER THEME: storing
 * only the dark variant leaves the light one on its bundled asset instead of
 * blanking the logo. With neither stored the markup is byte-identical to the
 * pre-CMS header.
 */
export default function Header({
  locale,
  resumeLink,
  logoDark,
  logoLight: logoLightUrl,
  navAnchors,
}: {
  locale: string;
  resumeLink: string | null;
  /** Stored dark-theme logo URL, or null for the bundled asset. */
  logoDark: string | null;
  /** Stored light-theme logo URL, or null for the bundled asset. */
  logoLight: string | null;
  /** Ordered `[{ id, anchor }]` from `site_settings`; null keeps the defaults. */
  navAnchors: unknown;
}) {
  const darkSrc = logoDark?.trim() ? logoDark : logo.src;
  const lightSrc = logoLightUrl?.trim() ? logoLightUrl : logoLight.src;
  const anchors = parseNavAnchors(navAnchors);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-base/70 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center pl-6 pr-3 lg:pr-6">
        <Link
          className="col-start-1 flex items-center justify-self-start"
          href={`/${locale}`}
        >
          {/* Sized to the rendered 24px box: the source PNGs are 1809x320 and
              1815x325 (59 KB + 72 KB), which shipped whole on every load.
              `max-w-none` keeps next/image from capping the width. */}
          <Image
            alt="logo"
            className="hidden h-6 w-auto max-w-none shrink-0 object-contain dark:block"
            height={24}
            priority
            sizes="136px"
            // next/image checks inline styles for an auto dimension when CSS
            // resizes the image; `w-auto` alone is invisible to that check.
            style={{ width: 'auto' }}
            src={darkSrc}
            width={136}
          />
          <Image
            alt="logo"
            className="block h-6 w-auto max-w-none shrink-0 object-contain dark:hidden"
            height={24}
            priority
            sizes="136px"
            style={{ width: 'auto' }}
            src={lightSrc}
            width={136}
          />
        </Link>
        <NavMenu anchors={anchors} locale={locale} resumeLink={resumeLink} />
      </div>
    </header>
  );
}
