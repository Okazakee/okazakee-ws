'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface HeroPortraitProps {
  alt: string;
  animatedSrc: string;
  blurDataURL: string;
  posterSrc: string;
  sizes: string;
}

/**
 * Hero portrait: a small static poster paints immediately, then the animated
 * avatar is pulled in once the browser goes idle.
 *
 * The animated WebP is ~185 KB and `next/image` passes animated sources through
 * untouched, so shipping it as the LCP candidate costs the whole payload. The
 * poster is frame 0 of the same file, so the swap is invisible — and if the
 * poster cannot be produced the component falls back to the animated file.
 */
export function HeroPortrait({
  alt,
  animatedSrc,
  blurDataURL,
  posterSrc,
  sizes,
}: HeroPortraitProps) {
  const [swapIn, setSwapIn] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    const swap = () => setSwapIn(true);
    const requestIdle = window.requestIdleCallback;

    if (typeof requestIdle === 'function') {
      const handle = requestIdle(swap, { timeout: 2000 });
      return () => window.cancelIdleCallback(handle);
    }

    const timer = window.setTimeout(swap, 1500);
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
          priority
          sizes={sizes}
          src={posterSrc}
          unoptimized
        />
      )}
      {swapIn && (
        <Image
          alt={animationReady ? alt : ''}
          className={`object-cover ${animationReady ? 'opacity-100' : 'opacity-0'}`}
          fill
          onLoad={() => setAnimationReady(true)}
          src={animatedSrc}
          unoptimized
        />
      )}
    </>
  );
}
