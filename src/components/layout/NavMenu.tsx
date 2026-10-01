'use client';

import { ExternalLink, FileUser, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

const createMenuItems = (locale: string) => [
  { href: `/${locale}`, isAnchor: false },
  { href: 'skills', isAnchor: true },
  { href: 'career', isAnchor: true },
  { href: `/${locale}/portfolio`, isAnchor: false },
  { href: `/${locale}/blog`, isAnchor: false },
  { href: 'contacts', isAnchor: true },
];

// Italian labels stay hardcoded here, as they were before the redesign
const italianLabels = [
  'Home',
  'Skills',
  'Carriera',
  'Portfolio',
  'Blog',
  'Contatti',
];

/**
 * Navigation (docs/DESIGN.md §4): centred desktop nav from `lg` up, plus the
 * header controls and the mobile drawer. The drawer holds the nav rows, the
 * language switch and the resume action in one list.
 */
export default function NavMenu({
  locale,
  resumeLink,
}: {
  locale: string;
  resumeLink: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const menuItems = useMemo(() => createMenuItems(locale), [locale]);
  const t = useTranslations('header');
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/' || pathname === `/${locale}`;

  // Scroll to an anchor once we are back on the home page
  useEffect(() => {
    if (!isHomePage || !pendingScroll) return;

    const element = document.getElementById(pendingScroll);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setPendingScroll(null);
    }
  }, [isHomePage, pendingScroll]);

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    isAnchor: boolean
  ) => {
    if (!isAnchor) return;

    event.preventDefault();
    setIsOpen(false);

    if (isHomePage) {
      document.getElementById(href)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setPendingScroll(href);
    router.push(`/${locale}`);
  };

  const getHref = (item: { href: string; isAnchor: boolean }) =>
    item.isAnchor ? `/${locale}` : item.href;

  const label = (index: number) =>
    locale === 'it' ? italianLabels[index] : t(`buttons.${index}`);

  // Anchor sections highlight while scrolling the home page
  useEffect(() => {
    if (!isHomePage) {
      setActiveSection(null);
      return;
    }

    const anchors = menuItems.filter((item) => item.isAnchor).map((i) => i.href);
    const onScroll = () => {
      let current: string | null = null;
      for (const id of anchors) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 140) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage, menuItems]);

  // Drawer: lock the page behind it and close on Escape
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const isActive = (item: { href: string; isAnchor: boolean }, index: number) => {
    if (item.isAnchor) return isHomePage && activeSection === item.href;
    if (index === 0) return isHomePage;
    return pathname.startsWith(item.href);
  };

  const desktopIdle = 'transition-colors hover:text-accent-violet';
  const desktopActive =
    'font-semibold text-accent-violet-light border-b border-accent-violet pb-0.5';
  const rowBase =
    'flex items-center gap-3 rounded-lg px-3 py-3 font-mono text-sm transition-colors';
  const rowIdle = `${rowBase} text-text-muted hover:bg-surface-raised hover:text-text-main`;
  const rowActive = `${rowBase} bg-surface-raised text-accent-violet-light`;
  const resumeClass =
    'flex items-center gap-1.5 rounded-lg border border-accent-violet/40 bg-accent-violet/10 font-mono text-accent-violet-light transition-colors hover:border-accent-violet hover:bg-accent-violet/20';

  return (
    <>
      <nav className="col-start-2 hidden items-center gap-6 justify-self-center font-mono text-xs text-text-muted lg:flex">
        {menuItems.map((item, index) => {
          const active = isActive(item, index);

          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={active ? desktopActive : desktopIdle}
              href={getHref(item)}
              key={item.href}
              onClick={(event) => handleClick(event, item.href, item.isAnchor)}
            >
              {label(index)}
            </Link>
          );
        })}
      </nav>

      <div className="col-start-3 flex items-center gap-2 justify-self-end lg:gap-3">
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle segmented />
          <ThemeToggle ariaLabel={t('theme')} icon />
          {resumeLink && (
            <Link
              className={`${resumeClass} px-3 py-1.5 text-xs`}
              data-umami-event="Resume button"
              href={resumeLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FileUser className="h-[15px] w-[15px]" />
              {locale === 'it' ? 'Curriculum' : 'Resume'}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle ariaLabel={t('theme')} icon />
          <button
            aria-controls="mobile-nav"
            aria-expanded={isOpen}
            aria-label="Toggle menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-dim transition-colors hover:border-accent-violet/40 hover:text-accent-violet-light"
            onClick={() => setIsOpen((open) => !open)}
            type="button"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 top-16 z-40 lg:hidden ${isOpen ? '' : 'hidden'}`}
        id="mobile-nav"
      >
        <div className="mx-5 rounded-2xl border border-border-subtle bg-surface-card/95 p-4 shadow-2xl backdrop-blur-xl">
          <nav className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const active = isActive(item, index);

              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={active ? rowActive : rowIdle}
                  href={getHref(item)}
                  key={item.href}
                  onClick={(event) => handleClick(event, item.href, item.isAnchor)}
                >
                  {label(index)}
                </Link>
              );
            })}

            <div className="flex items-center justify-between rounded-lg px-3 py-3 font-mono text-sm text-text-muted">
              <span>{t('language')}</span>
              <LanguageToggle segmented />
            </div>

            {resumeLink && (
              <Link
                className={`${resumeClass} px-3 py-3 text-sm`}
                data-umami-event="Resume button"
                href={resumeLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FileUser className="h-4 w-4 shrink-0" />
                {locale === 'it' ? 'Curriculum' : 'Resume'}
                <ExternalLink className="ml-auto h-4 w-4 text-text-dim" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
