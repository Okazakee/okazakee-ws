'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ImageModal } from '../common/ImageModal';

interface NextImageProps {
  src: string;
  alt: string;
  blurhash: string;
}

const NextImage = ({ src, alt, blurhash }: NextImageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Vertical shots stay capped so they don't become towering strips;
  // horizontal ones fill the figure width. Measured from the loaded asset,
  // defaulting to capped until it resolves.
  const [isVertical, setIsVertical] = useState(true);

  return (
    <>
      <Image
        alt={alt}
        blurDataURL={blurhash}
        className={`mx-auto block cursor-pointer rounded-xl border border-border-subtle ${
          isVertical ? 'w-full max-w-3xl' : 'w-full'
        }`}
        height={720}
        onClick={() => setIsModalOpen(true)}
        onLoad={(event) => {
          const target = event.currentTarget;
          setIsVertical(target.naturalHeight >= target.naturalWidth);
        }}
        placeholder="blur"
        sizes="(min-width: 1024px) 960px, 100vw"
        src={src}
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        title="Click to view"
        width={1280}
      />
      {alt ? (
        <span className="fig-caption block text-center">{alt}</span>
      ) : null}
      {isModalOpen && (
        <ImageModal
          alt={alt}
          blurDataURL={blurhash}
          onClose={() => setIsModalOpen(false)}
          src={src}
        />
      )}
    </>
  );
};

export default NextImage;
