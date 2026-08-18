import logo from '@public/title-ws.png';
import Link from 'next/link';
import NavMenu from './NavMenu';

export default function Header({ locale }: { locale: string }) {
  return (
    <header className="max-w-(--breakpoint-2xl) mx-auto pt-4">
      <div className="flex justify-between items-center h-[clamp(63.6px,6.8vw_+_9.7px,80px)] mx-5">
        <Link
          href={'/'}
          className="block xl:mr-auto xl:mx-0 xl:static"
        >
          <span className="block w-[clamp(191px,20.4vw_+_29px,240px)]">
            {/* biome-ignore lint/performance/noImgElement: static logo asset does not benefit from next/image and avoids a Next 16 runtime warning */}
            <img
              src={logo.src}
              width={2172}
              height={724}
              className="block h-auto w-full relative -left-3"
              alt="logo"
            />
          </span>
        </Link>

        <NavMenu locale={locale} />
      </div>
    </header>
  );
}
