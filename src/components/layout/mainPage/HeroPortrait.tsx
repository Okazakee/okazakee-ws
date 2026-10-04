'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

/** Matches Tailwind's `lg`, where the desktop nav and its bandwidth appear. */
const desktopMedia = '(min-width: 1024px)';

const idleTimeoutMs = 1500;

interface HeroPortraitProps {
  alt: string;
  animatedSrc: string;
  blurDataURL: string;
  posterSrc: string;
  sizes: string;
}

/**
 * Hero portrait. Desktop loads the animated avatar straight away — the poster
 * dance only pays off on a metered connection, and there is nothing to defer
 * behind: a `<picture>` source keyed on the `lg` media query makes the browser
 * pick the animated file before it fetches anything, so the poster is never
 * even requested at that width.
 *
 * Below `lg` the poster paints immediately and the animation is pulled in once
 * the browser goes idle. The animated WebP is ~185 KB and `next/image` passes
 * animated sources through untouched, so shipping it as the LCP candidate costs
 * the whole payload; the poster is frame 0 of the same file, so the swap is
 * invisible. If the poster cannot be produced, the component falls back to the
 * animated file.
 */
export function HeroPortrait({
  alt,
  animatedSrc,
  blurDataURL,
  posterSrc,
  sizes,
}: HeroPortraitProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [swapIn, setSwapIn] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    if (window.matchMedia(desktopMedia).matches) {
      setIsDesktop(true);
      return;
    }

    const swap = () => setSwapIn(true);
    const requestIdle = window.requestIdleCallback;

    if (typeof requestIdle === 'function') {
      const handle = requestIdle(swap, { timeout: idleTimeoutMs });
      return () => window.cancelIdleCallback(handle);
    }

    const timer = window.setTimeout(swap, idleTimeoutMs);
    return () => window.clearTimeout(timer);
  }, []);

  if (posterFailed) {
    return (
      <Image
        alt={alt}
        className="object-cover"
        fill
        src={animatedSrc}
        unoptimized
      />
    );
  }

  // Desktop stays in the `<picture>` below: the browser is already showing the
  // animated file there and the poster node is never fetched.
  if (!swapIn || isDesktop) {
    return (
      <picture>
        <source media={desktopMedia} srcSet={animatedSrc} />
        <Image
          alt={alt}
          blurDataURL={blurDataURL}
          className="object-cover"
          fetchPriority="high"
          fill
          onError={() => setPosterFailed(true)}
          placeholder="blur"
          // No preload link: it would fetch the poster on desktop too, where
          // the media query above means it is never displayed.
          preload={false}
          sizes={sizes}
          src={posterSrc}
          unoptimized
        />
      </picture>
    );
  }

  // Small screens: keep the poster painted until the animation has decoded.
  return (
    <>
      {!animationReady && (
        <Image
          alt={alt}
          blurDataURL={blurDataURL}
          className="object-cover"
          fill
          onError={() => setPosterFailed(true)}
          placeholder="blur"
          preload={false}
          sizes={sizes}
          src={posterSrc}
          unoptimized
        />
      )}
      <Image
        alt={animationReady ? alt : ''}
        className={`object-cover ${animationReady ? 'opacity-100' : 'opacity-0'}`}
        fill
        onLoad={() => setAnimationReady(true)}
        src={animatedSrc}
        unoptimized
      />
    </>
  );
}