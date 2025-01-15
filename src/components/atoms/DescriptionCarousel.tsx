'use client'

import React, { useEffect, useRef, useState } from 'react';

export default function DescriptionCarousel({ children }: { children: React.ReactNode }) {
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (descriptionRef.current && containerRef.current) {
        const isContentOverflowing = descriptionRef.current.offsetWidth > containerRef.current.offsetWidth;
        setIsOverflowing(isContentOverflowing);
        setAnimate(isContentOverflowing);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  const duration = descriptionRef.current ? descriptionRef.current.offsetWidth * 0.02 : 0;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden w-full hover:pause"
      onMouseEnter={() => setAnimate(false)}
      onMouseLeave={() => setIsOverflowing(true)}
    >
      <span 
        ref={descriptionRef}
        className={`inline-block whitespace-nowrap ${
          animate 
            ? 'animate-marquee' 
            : 'transform-none'
        }`}
        style={{
          '--duration': `${duration}s`,
          animation: animate ? `animate-carousel` : 'none'
        } as React.CSSProperties}
      >
        {children}
        {isOverflowing && <span className="pl-4">{children}</span>}
      </span>
    </div>
  );
}