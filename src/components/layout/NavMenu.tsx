'use client';

import { ExternalLink, FileUser, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  createMenuItems,
  navItemHref,
  type NavMenuItem,
} from '@/utils/navAnchors';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

/**
 * Navigation (docs/DESIGN.md §4): centred desktop nav from `lg` up, plus the
 * header controls and the mobile drawer. On the home page every item is an
 * in-page anchor and the active one follows the scroll position (the mock's
 * scroll-spy); on other pages the section items navigate back to their home
 * anchor while portfolio and blog highlight by route.
 *
 * The anchor each item points at is CMS-editable; the section id it scrolls
 * to is not. The scroll-spy and the click handler keep reading `item.section`,
 * so an edited anchor moves the href without breaking in-page navigation or
 * the drawer.
 */
export default function NavMenu({
  anchors,
  locale,
  resumeLink,
}: {
  /** Per-item anchors from `site_settings`; computed defaults when absent. */
  anchors: readonly string[];
  locale: string;
  resumeLink: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');

  // The drawer portals to <body>, outside the header's backdrop root —
  // backdrop-filter blurs the backdrop, so it must not nest under another
  // backdrop-filter. Gate it on mount so SSR markup matches hydration.
  useEffect(() => {
    setMounted(true);
  }, []);
  const menuItems = useMemo(
    () => createMenuItems(locale, anchors),
    [locale, anchors]
  );
  const t = useTranslations('header');
  const resumeLabel = t('resume');
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
  const isAnchor = (item: NavMenuItem) => !item.page || isHomePage;

  const getHref = (item: NavMenuItem) => navItemHref(item, locale, isHomePage);

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: NavMenuItem
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

  const label = (index: number) => t(`buttons.${index}`);

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

  const isActive = (item: NavMenuItem) => {
    if (isHomePage) return activeSection === item.section;
    if (!item.page) return false;
    return pathname === item.route || pathname.startsWith(`${item.route}/`);
  };

  const desktopIdle = 'transition-colors hover:text-accent-violet';
  const desktopActive =
    'font-semibold text-accent-violet-light border-b border-accent-violet pb-0.5';
  const rowBase =
    'flex items-baseline gap-3.5 border-b border-border-subtle/50 px-1 py-3.5 transition-[opacity,translate] duration-200 ease-out';
  const rowIdle = `${rowBase} text-text-white`;
  const rowActive = `${rowBase} font-semibold text-accent-violet-light`;
  const rowHidden = 'translate-y-2 opacity-0';
  const rowShown = 'translate-y-0 opacity-100';
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
              <span className="mr-1 text-[10px] text-text-dim">
                {String(index + 1).padStart(2, '0')}
              </span>
              {label(index)}
            </Link>
          );
        })}
      </nav>

      <div className="col-start-3 flex items-center gap-2 justify-self-end lg:gap-3">
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageToggle />
          <ThemeToggle ariaLabel={t('theme')} />
          {resumeLink && (
            <Link
              className={`${resumeClass} px-3 py-1.5 text-xs`}
              data-umami-event="Resume button"
              href={resumeLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FileUser className="h-[15px] w-[15px]" />
              {resumeLabel}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle ariaLabel={t('theme')} />
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

      {mounted &&
        createPortal(
          <div
            aria-hidden={!isOpen}
            className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-surface-base/70 backdrop-blur-md transition-[opacity,translate,visibility] duration-200 ease-out lg:hidden ${
              isOpen
                ? 'visible translate-y-0 opacity-100'
                : 'invisible -translate-y-2 opacity-0'
            }`}
            id="mobile-nav"
          >
            <div className="flex min-h-full flex-col px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <nav className="flex flex-col">
                {menuItems.map((item, index) => {
                  const active = isActive(item);

                  return (
                    <Link
                      aria-current={active ? 'page' : undefined}
                      className={`${active ? rowActive : rowIdle} ${isOpen ? rowShown : rowHidden}`}
                      href={getHref(item)}
                      key={item.id}
                      onClick={(event) => {
                        handleClick(event, item);
                        setIsOpen(false);
                      }}
                      style={{
                        transitionDelay: isOpen ? `${index * 40}ms` : '0ms',
                      }}
                      tabIndex={isOpen ? 0 : -1}
                    >
                      <span className="min-w-6 font-mono text-[11px] tracking-[0.2em] text-text-dim">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-heading text-3xl tracking-tight">
                        {label(index)}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div
                className={`mt-auto flex flex-col gap-3 pt-6 transition-[opacity,translate] duration-200 ease-out ${isOpen ? rowShown : rowHidden}`}
                style={{ transitionDelay: isOpen ? '240ms' : '0ms' }}
              >
                <div className="flex items-center justify-between px-1 py-1 font-mono text-sm text-text-muted">
                  <span>{t('language')}</span>
                  <LanguageToggle />
                </div>

                {resumeLink && (
                  <Link
                    className={`${resumeClass} min-h-[52px] items-center justify-center px-3 py-3 text-sm`}
                    data-umami-event="Resume button"
                    href={resumeLink}
                    onClick={() => setIsOpen(false)}
                    rel="noopener noreferrer"
                    tabIndex={isOpen ? 0 : -1}
                    target="_blank"
                  >
                    <FileUser className="h-4 w-4 shrink-0" />
                    {resumeLabel}
                    <ExternalLink className="ml-auto h-4 w-4 text-text-dim" />
                  </Link>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
