import { ErrorDiv } from '@components/common/ErrorDiv';
import { Glitch } from '@components/common/Glitch';
import { FingerprintPattern, Mouse } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { InnerHtml } from '@/components/common/InnerHtml';
import { formatLabels } from '@/utils/formatLabels';
import { getHeroSection } from '@/utils/getData';
import {
  heroBackdropClass,
  heroPortraitClass,
  normalizeHeroShape,
  resolveHeroRoles,
  squircleClipPath,
} from '@/utils/heroDisplay';
import { HeroMatrix } from './HeroMatrix';
import { RoleTypewriter } from './RoleTypewriter';

const PebbleClipPath = () => (
  <svg width="0" height="0" viewBox="0 0 500 500" className="absolute">
    <title>PebbleClipPath</title>
    <defs>
      <clipPath id="pebble-clip" clipPathUnits="objectBoundingBox">
        <path
          d="M 301.84,388.777 C 221.246,383.98 159.047,350.918 120.738,280.84 89.77,224.195 98.645,160.863 142.883,107.434 176.789,66.477 220.562,42.488 273.078,34.992 c 68.402,-9.765 123.5,20.813 155.106,80.125 21.683,40.692 29.902,84.567 29.117,130.129 -0.477,27.418 -5.43,54.246 -19.746,78.402 -19.985,33.723 -50.903,51.606 -88.25,59.106 -16.184,3.246 -32.817,4.23 -47.465,6.023"
          transform="scale(0.0028174,0.0028123) translate(-102.41,-33.2)"
        />
      </clipPath>
    </defs>
  </svg>
);

const SquircleClipPath = () => (
  <svg width="0" height="0" viewBox="0 0 1 1" className="absolute">
    <title>SquircleClipPath</title>
    <defs>
      <clipPath id="squircle-clip" clipPathUnits="objectBoundingBox">
        <path d={squircleClipPath()} />
      </clipPath>
    </defs>
  </svg>
);

const roleLineClass =
  'mx-auto w-fit rounded-2xl bg-surface-base/40 p-2 font-mono text-xl tracking-normal text-text-muted md:text-2xl';
// Keep the hero's initial type-on reveal, but disable repeated idle cycling.
const roleTypewriterIdleAnimationEnabled = false;

/**
 * Hero and about block (docs/DESIGN.md §6): one full-height band — the portrait
 * beside the name and role(s), then the about card below in the section-header
 * pattern. The portrait shape comes from `hero_section`; localized roles type
 * once, with repeated idle cycling controlled by
 * `roleTypewriterIdleAnimationEnabled`.
 */
export default async function Hero({ locale }: { locale: string }) {
  const heroSection = await getHeroSection();
  const t = await getTranslations({ locale, namespace: 'hero-section' });

  if (!heroSection) return <ErrorDiv>Error loading Hero data</ErrorDiv>;

  const shape = normalizeHeroShape(heroSection.shape);
  const storedRoles: unknown = t.has('top.roles') ? t.raw('top.roles') : null;
  const roles = resolveHeroRoles(storedRoles);

  // The paragraph arrives as separate blocks separated by blank lines
  const paragraphs = t('aboutme.paragraph')
    .split('\n\n')
    .filter((paragraph) => paragraph.trim());

  return (
    <section
      className="relative -mt-16 flex min-h-svh items-center overflow-hidden bg-surface-alt/50 pb-10 pt-24"
      id="home"
    >
      <HeroMatrix />
      <PebbleClipPath />
      {shape === 'squircle' && <SquircleClipPath />}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6">
        <div
          className="pointer-events-none flex flex-col items-center xl:flex-row xl:justify-center xl:gap-16"
          data-hero-zone="identity"
        >
          <div className="relative mb-10 aspect-square w-[190px] shrink-0 md:mb-12 md:w-[240px] xl:mb-0 xl:w-[260px]">
            {/* The whole pebble glitches: the accent plate and the masked photo
                are one glitched element, so the ring tears with the image
                instead of holding still while only the photo moves.

                `absolute inset-0` gives the layer container the portrait's own
                square — the layers inside are absolutely positioned, so a
                container in normal flow would collapse to zero height and have
                nothing to hover — and `pointer-events-auto` on it is what makes
                the portrait hoverable at all, since the identity block is
                `pointer-events-none`. Everything inside stays
                `pointer-events-none`, so the image is still neither draggable
                nor selectable and the matrix magnet still sees the move. */}
            <Glitch
              className="pointer-events-auto absolute inset-0"
              mode="hover"
            >
              {/* Positioned, so the ring inset and the image mask resolve
                  against it exactly as they did against the wrapper — and
                  `pointer-events-none` because the property inherits: without
                  it, the container's `auto` would reach the image and make it
                  draggable and selectable again. */}
              <span className="pointer-events-none relative">
                <span aria-hidden="true" className={heroBackdropClass(shape)} />
                <span className={heroPortraitClass(shape)}>
                  <Image
                    alt="Profile picture"
                    blurDataURL={heroSection.blurhashURL}
                    className="object-cover"
                    fill
                    placeholder="blur"
                    priority
                    sizes="(min-width: 1280px) 260px, (min-width: 768px) 240px, 190px"
                    src={heroSection.propic}
                  />
                </span>
              </span>
            </Glitch>
          </div>

          <div
            className={
              roles.length > 1
                ? 'max-w-2xl space-y-1 text-center'
                : 'max-w-2xl text-center'
            }
          >
            <InnerHtml
              as="h1"
              className="mb-3 rounded-2xl bg-surface-base/40 p-2 font-heading text-3xl font-semibold tracking-tight text-text-white sm:text-4xl md:text-5xl"
              html={formatLabels(t('top.name'))}
            />
            <RoleTypewriter
              as="p"
              className={roleLineClass}
              idleAnimationEnabled={roleTypewriterIdleAnimationEnabled}
              roles={roles}
              slot={0}
            />
          </div>
        </div>

        <div
          className="pointer-events-none mx-auto mt-6 max-w-3xl scroll-mt-20 md:mt-12"
          data-hero-zone="about"
          id="about"
        >
          <div className="space-y-4 rounded-2xl bg-surface-base/40 p-2 text-left text-sm leading-relaxed text-text-main/90 md:text-base md:leading-6">
            {paragraphs.map((paragraph) => (
              <InnerHtml
                as="p"
                html={formatLabels(paragraph)}
                key={paragraph.slice(0, 24)}
              />
            ))}
          </div>
        </div>
      </div>
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 font-mono text-xs uppercase tracking-[0.22em] text-text-muted motion-safe:animate-bounce md:text-sm"
      >
        <span className="text-text-white">Scroll!</span>
        <FingerprintPattern
          className="hidden h-4 w-3 text-accent-violet-light pointer-coarse:block"
          preserveAspectRatio="none"
        />
        <Mouse className="h-4 w-4 text-accent-violet-light pointer-coarse:hidden" />
      </span>
    </section>
  );
}
