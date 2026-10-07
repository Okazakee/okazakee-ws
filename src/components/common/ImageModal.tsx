import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useZoom } from '@/app/hooks/useZoom';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-quality viewer for post body images. The asset loads without a blur
 * placeholder: a centered spinner covers the wait and fades out as the image
 * fades in, so the modal never shows a low-quality stand-in.
 */
export const ImageModal: React.FC<ImageModalProps> = ({
  src,
  alt,
  onClose,
}) => {
  const {
    scale,
    position,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    blockScroll,
  } = useZoom();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unblock = blockScroll();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      unblock();
      window.removeEventListener('keydown', handleEscape);
    };
  }, [blockScroll, onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-surface -top-4">
        <div className="relative w-full h-full max-w-(--breakpoint-2xl)">
          <div
            className="w-full h-full overflow-hidden"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Load feedback: same spinner as the CMS surfaces. Kept outside
              the zoom transform so it stays centered however the image is
              panned or scaled. pointer-events-none: gestures pass through. */}
            <div
              className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                loaded ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-accent-violet" />
            </div>
            <div
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transition: 'transform 0.1s ease-out',
              }}
              className="w-full h-full flex items-center justify-center"
            >
              <Image
                src={src}
                alt={alt}
                quality={100}
                fill
                sizes="100vw"
                style={{ objectFit: 'contain' }}
                onLoad={() => setLoaded(true)}
                className={`pointer-events-none transition-opacity duration-500 ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Close affordance: a sibling of the overlay, not a child, so `fixed`
          anchors to the viewport (the overlay's backdrop-filter makes it a
          containing block, and its `-top-4` offset would skew the inset) and
          the insets stay true on every breakpoint. Floating-control idiom
          from ScrollTop: inverted fill, `text-on-accent` ink, accent hover;
          h-11 w-11 satisfies the 44px tap target (docs/DESIGN.md §9). */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        className="fixed top-4 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-lg bg-text-main text-text-on-accent shadow-lg transition-colors hover:bg-accent-violet md:top-6 md:right-8"
      >
        <X className="h-5 w-5" />
      </button>
    </>,
    document.body
  );
};
