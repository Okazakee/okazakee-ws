'use client';

import { ExternalLink, FileUser, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

type MenuItem = {
  id: string;
  /** In-page section id on the home page (`home`, `skills`, ...). */
  section: string;
  /** Route used when the section cannot be reached on the current page. */
  route: string;
  /** True when the item is its own page (portfolio/blog) off the home page. */
  page: boolean;
};

const createMenuItems = (locale: string): MenuItem[] => [
  { id: 'home', section: 'home', route: `/${locale}`, page: false },
  { id: 'skills', section: 'skills', route: `/${locale}#skills`, page: false },
  { id: 'career', section: 'career', route: `/${locale}#career`, page: false },
  {
    id: 'portfolio',
    section: 'portfolio',
    route: `/${locale}/portfolio`,
    page: true,
  },
  { id: 'blog', section: 'blog', route: `/${locale}/blog`, page: true },
  {
    id: 'contacts',
    section: 'contacts',
    route: `/${locale}#contacts`,
    page: false,
  },
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
 * header controls and the mobile drawer. On the home page every item is an
 * in-page anchor and the active one follows the scroll position (the mock's
 * scroll-spy); on other pages the section items navigate back to their home
 * anchor while portfolio and blog highlight by route.
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
  const [activeSection, setActiveSection] = useState<string>('home');
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuItems = useMemo(() => createMenuItems(locale), [locale]);
  const t = useTranslations('header');
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === '/' || pathname === `/${locale}`;
  const lastPath = useRef(pathname);

  // Scroll to an anchor once we are back on the home page
  useEffect(() => {
    if (!isHomePage || !pendingScroll) return;

    if (pendingScroll === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setPendingScroll(null);
      return;
    }

    const element = document.getElementById(pendingScroll);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setPendingScroll(null);
    }
  }, [isHomePage, pendingScroll]);

  // Home: every nav item is an anchor; other pages: only the section items
  // scroll back home, portfolio and blog navigate to their own page.
  const isAnchor = (item: MenuItem) => !item.page || isHomePage;

  const getHref = (item: MenuItem) => {
    if (item.page && !isHomePage) return item.route;
    if (isHomePage) return `#${item.section}`;
    return `/${locale}`;
  };

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: MenuItem
  ) => {
    if (!isAnchor(item)) return;

    event.preventDefault();
    setIsOpen(false);

    if (isHomePage) {
      if (item.section === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      document
        .getElementById(item.section)
        ?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setPendingScroll(item.section);
    router.push(`/${locale}`);
  };

  const label = (index: number) =>
    locale === 'it' ? italianLabels[index] : t(`buttons.${index}`);

  // Scroll-spy over every home section, exactly like the mock: the last
  // section whose top passed the header threshold wins.
  useEffect(() => {
    if (!isHomePage) return;

    const onScroll = () => {
      let current = 'home';
      for (const item of menuItems) {
        const element = document.getElementById(item.section);
        if (element && element.getBoundingClientRect().top <= 140) {
          current = item.section;
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

  // A navigation must not leave the drawer open over the next page
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  // Tapping outside the panel (or on the page behind it) closes the drawer
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !toggleRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const isActive = (item: MenuItem) => {
    if (isHomePage) return activeSection === item.section;
    if (!item.page) return false;
    return pathname === item.route || pathname.startsWith(`${item.route}/`);
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
          const active = isActive(item);

          return (
            <Link
              aria-current={active ? 'page' : undefined}
              className={active ? desktopActive : desktopIdle}
              href={getHref(item)}
              key={item.id}
              onClick={(event) => handleClick(event, item)}
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
            ref={toggleRef}
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
        <div className="mx-5 rounded-2xl border border-border-subtle bg-surface-card/95 p-4 shadow-2xl backdrop-blur-xl" ref={panelRef}>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const active = isActive(item);

              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={active ? rowActive : rowIdle}
                  href={getHref(item)}
                  key={item.id}
                  onClick={(event) => {
                    handleClick(event, item);
                    setIsOpen(false);
                  }}
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
                onClick={() => setIsOpen(false)}
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
