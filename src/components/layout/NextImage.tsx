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

  return (
    <>
      <Image
        alt={alt}
        blurDataURL={blurhash}
        height={720}
        onClick={() => setIsModalOpen(true)}
        placeholder="blur"
        sizes="(min-width: 1024px) 1024px, 100vw"
        src={src}
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        title="Click to view"
        width={1280}
      />
      {alt ? <span className="fig-caption">{alt}</span> : null}
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
