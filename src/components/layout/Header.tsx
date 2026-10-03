import logoLight from '@public/title-ws-lightmode.png';
import logo from '@public/title-ws.png';
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
}: {
  locale: string;
  resumeLink: string | null;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface-base/70 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center pl-6 pr-3 lg:pr-6">
        <Link
          className="col-start-1 flex items-center justify-self-start"
          href={`/${locale}`}
        >
          {/* biome-ignore lint/performance/noImgElement: static logo asset does not benefit from next/image and avoids a Next 16 runtime warning */}
          <img
            alt="logo"
            className="hidden h-6 w-auto max-w-none shrink-0 object-contain dark:block"
            height={320}
            src={logo.src}
            width={1809}
          />
          {/* biome-ignore lint/performance/noImgElement: static logo asset does not benefit from next/image and avoids a Next 16 runtime warning */}
          <img
            alt="logo"
            className="block h-6 w-auto max-w-none shrink-0 object-contain dark:hidden"
            height={325}
            src={logoLight.src}
            width={1815}
          />
        </Link>
        <NavMenu locale={locale} resumeLink={resumeLink} />
      </div>
    </header>
  );
}
