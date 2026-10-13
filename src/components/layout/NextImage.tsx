'use client';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { resolveBlurDataURL } from '@/utils/blurPlaceholder';
import { ImageModal } from '@components/common/ImageModal';

interface NextImageProps {
  src: string;
  alt: string;
  blurhash: string;
}

// Sizing is owned entirely by `.post .post-figure img` in globals.css:
// the natural aspect ratio, capped by the figure width
// (landscape/square) or 80vh (portrait) — never cropped, so there is no
// client-side orientation measurement. The width/height props below are
// optimizer hints that also reserve pre-load space; they never fix the
// rendered ratio.
const NextImage = ({ src, alt, blurhash }: NextImageProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const blurDataURL = resolveBlurDataURL(blurhash);
  // Stable identity: the modal effect depends on it, so an inline
  // closure would re-run the keydown/lock setup on every parent render.
  const handleClose = useCallback(() => setIsModalOpen(false), []);

  return (
    <>
      <Image
        alt={alt}
        blurDataURL={blurDataURL}
        className="cursor-pointer rounded-xl border border-border-subtle"
        height={720}
        onClick={() => setIsModalOpen(true)}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        sizes="(min-width: 1024px) 960px, 100vw"
        src={src}
        title="Click to view"
        width={1280}
      />
      {alt ? (
        <span className="fig-caption block text-center">{alt}</span>
      ) : null}
      {isModalOpen && (
        <ImageModal alt={alt} onClose={handleClose} src={src} />
      )}
    </>
  );
};

export default NextImage;
