'use client';

import { ExternalLink, FileUser, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocaleSwitchStore } from '@/store/localeSwitchStore';
import {
  createMenuItems,
  type NavMenuItem,
  navItemHref,
} from '@/utils/navAnchors';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

/**
 * The drawer's open state must survive the locale-switch remount of the whole
 * [locale] shell. Document-scoped like the hero session: restored only while
 * a language switch is in flight (the switcher lives inside the drawer on
 * mobile, so the reader was looking at it), while every ordinary navigation
 * still starts closed. A reload is a new document, so the drawer starts
 * closed as usual.
 */
let drawerOpenBeforeLocaleSwitch = false;

/**
 * Drawer cascade step (docs/DESIGN.md §4): rows enter 40ms apart and the
 * footer lands one step after the last row. Closing replays that same
 * timeline backwards — footer first, rows last-to-first, panel over the tail
 * — so the exit is the entrance mirrored and lasts exactly as long.
 */
const rowStaggerMs = 40;

/**
 * Navigation (docs/DESIGN.md §4): centred desktop nav from `lg` up, plus the
 * header controls and the mobile drawer. On the home page every item is an
 * in-page anchor and the active one follows the scroll position (the mock's
 * scroll-spy); on other pages the section items navigate back to their home
 * anchor while portfolio and blog highlight by route.
 *
 * Every item points at its own section: the anchor is the section id, which is
 * site-side data and not edited anywhere, so the href, the scroll-spy and the
 * click handler can never disagree.
 */
function ResumeLabel({ label }: { label: string }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  // Shrink long labels to the space left inside the fixed-width button. The
  // outer span already excludes padding, icon and gap, so its width is the
  // usable budget — no further subtraction. 1px tolerance avoids sub-pixel
  // shrink on labels that already fit (e.g. "Resume"). Re-measures once the
  // webfont arrives: fallback metrics fit, then the wider font overflows.
  useLayoutEffect(() => {
    const node = textRef.current;
    const outer = node?.parentElement;
    if (!node || !outer) return;
    const measure = () => {
      const usable = outer.clientWidth;
      const needed = node.scrollWidth;
      setScale(usable > 0 && needed > usable + 1 ? usable / needed : 1);
    };
    measure();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [label]);

  return (
    <span className="flex min-w-0 flex-1 justify-center overflow-hidden">
      <span
        ref={textRef}
        className="origin-center whitespace-nowrap"
        style={scale < 1 ? { transform: `scale(${scale})` } : undefined}
      >
        {label}
      </span>
    </span>
  );
}

export default function NavMenu({
  locale,
  resumeLink,
}: {
  locale: string;
  resumeLink: string | null;
}) {
  const [isOpen, setIsOpen] = useState(
    () =>
      drawerOpenBeforeLocaleSwitch &&
      useLocaleSwitchStore.getState().handoff !== null
  );
  const [mounted, setMounted] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('home');

  // The drawer portals to <body>, outside the header's backdrop root —
  // backdrop-filter blurs the backdrop, so it must not nest under another
  // backdrop-filter. Gate it on mount so SSR markup matches hydration.
  useEffect(() => {
    setMounted(true);
  }, []);
  // Mirror the open state for the next mount of this shell (see the module
  // comment): written after every change, read by a locale-switch remount.
  useEffect(() => {
    drawerOpenBeforeLocaleSwitch = isOpen;
  }, [isOpen]);
  const menuItems = useMemo(() => createMenuItems(locale), [locale]);
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

  const desktopIdle =
    'border-b border-transparent pb-0.5 transition-colors hover:text-accent-violet-light hover:border-accent-violet';
  const desktopActive =
    'font-semibold scale-105 text-accent-violet-light border-b border-accent-violet pb-0.5';
  const rowBase =
    'flex items-baseline gap-3.5 border-b border-border-subtle/50 px-1 py-3.5 transition-[opacity,translate] duration-200 ease-out';
  const rowIdle = `${rowBase} text-text-white`;
  const rowActive = `${rowBase} font-semibold text-accent-violet-light`;
  const rowHidden = 'translate-y-2 opacity-0';
  const rowShown = 'translate-y-0 opacity-100';
  const resumeClass =
    'flex items-center gap-1 rounded-lg border border-accent-violet/40 bg-accent-violet/10 font-mono text-accent-violet-light transition-colors hover:border-accent-violet hover:bg-accent-violet/20';

  return (
    <>
      <nav className="col-start-2 hidden items-center gap-5 justify-self-center font-mono text-xs text-text-muted lg:flex">
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

      <div className="col-start-3 flex items-center gap-2 justify-self-end lg:gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <ThemeToggle ariaLabel={t('theme')} />
          {resumeLink && (
            <Link
              className={`${resumeClass} w-[100px] overflow-hidden px-2 py-1.5 text-xs`}
              data-umami-event="Resume button"
              href={resumeLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FileUser className="h-[15px] w-[15px] shrink-0" />
              <ResumeLabel label={resumeLabel} />
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
            className={`fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-surface-base/70 backdrop-blur-surface transition-[opacity,translate,visibility] duration-200 ease-out lg:hidden ${
              isOpen
                ? 'visible translate-y-0 opacity-100'
                : 'invisible -translate-y-2 opacity-0'
            }`}
            id="mobile-nav"
            style={{
              transitionDelay: isOpen
                ? '0ms'
                : `${menuItems.length * rowStaggerMs}ms`,
            }}
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
                        transitionDelay: `${
                          (isOpen ? index : menuItems.length - index) *
                          rowStaggerMs
                        }ms`,
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
                style={{
                  transitionDelay: `${
                    (isOpen ? menuItems.length : 0) * rowStaggerMs
                  }ms`,
                }}
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
