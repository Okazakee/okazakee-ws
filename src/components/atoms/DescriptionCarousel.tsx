'use client'
import React, { useEffect, useRef, useState } from 'react';

export default function DescriptionCarousel({ children }: { children: React.ReactNode }) {
  const descriptionRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (descriptionRef.current) {
        setIsOverflowing(descriptionRef.current.scrollWidth > descriptionRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  return (
    <div className="relative overflow-hidden w-full">
      <div
        className={`whitespace-nowrap ${isOverflowing ? 'animate-marquee' : ''}`}
      >
        <span ref={descriptionRef}>{children}</span>
      </div>
    </div>
  );
}
