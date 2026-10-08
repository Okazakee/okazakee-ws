import logo from '@public/title-ws.png';
import logoLight from '@public/title-ws-lightmode.png';
import Image from 'next/image';
import Link from 'next/link';
import NavMenu from './NavMenu';

/**
 * Site header, canon layout (docs/DESIGN.md §4): a three-column grid whose
 * children carry explicit col-start placements, so hiding the desktop nav on
 * mobile cannot shift the controls into the middle column.
 */
export default function Header({
  locale,
  resumeLink,
  logoDarkUrl,
  logoLightUrl,
}: {
  locale: string;
  resumeLink: string | null;
  logoDarkUrl: string | null;
  logoLightUrl: string | null;
}) {
  const darkLogo = logoDarkUrl?.trim() || null;
  const lightLogo = logoLightUrl?.trim() || null;

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-base/70 backdrop-blur-mobile lg:backdrop-blur-surface">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center pl-6 pr-3 lg:pr-6">
        <Link
          className="col-start-1 flex items-center justify-self-start"
          href={`/${locale}`}
        >
          {/* Remote logo dimensions vary: a fixed height and automatic width
              preserve each image's natural aspect ratio. */}
          <Image
            alt="logo"
            className="hidden h-6 w-auto max-w-none shrink-0 object-contain dark:block"
            height={24}
            priority
            sizes={darkLogo ? '256px' : '136px'}
            // next/image checks inline styles for an auto dimension when CSS
            // resizes the image; `w-auto` alone is invisible to that check.
            style={{ width: 'auto' }}
            src={darkLogo ?? logo}
            width={darkLogo ? 256 : 136}
          />
          <Image
            alt="logo"
            className="block h-6 w-auto max-w-none shrink-0 object-contain dark:hidden"
            height={24}
            priority
            sizes={lightLogo ? '256px' : '136px'}
            style={{ width: 'auto' }}
            src={lightLogo ?? logoLight}
            width={lightLogo ? 256 : 136}
          />
        </Link>
        <NavMenu locale={locale} resumeLink={resumeLink} />
      </div>
    </header>
  );
}
