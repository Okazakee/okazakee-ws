import sharp from 'sharp';

/** Widths the poster route will serve; keeps the cache key space small. */
export const avatarPosterWidths: readonly number[] = [256, 384, 512];

export const avatarPosterQuality = 80;

/**
 * Poster URL for the animated hero avatar. The poster is the first frame of the
 * very same file, so swapping the animation in later is visually seamless.
 *
 * The CMS stamps uploads with `?t=<updated_at>`; it is carried over as the
 * poster's cache-busting version so a re-uploaded avatar yields a new poster
 * URL instead of a stale one.
 */
export function avatarPosterUrl(propicUrl: string, width: number): string {
  const params = new URLSearchParams({ w: String(width) });
  const version = new URL(propicUrl).searchParams.get('t');
  if (version) params.set('v', version);

  return `/api/hero-avatar?${params.toString()}`;
}

/**
 * Encode the first frame of an animated image as a static WebP. `next/image`
 * refuses to optimise animated sources (they pass through untouched at full
 * size), and Supabase image transformations are a paid feature, so the resize
 * happens here instead. sharp reads page 0 unless told otherwise.
 */
export async function encodeAvatarPoster(
  source: Buffer,
  width: number
): Promise<Buffer> {
  return sharp(source, { page: 0 })
    .resize({ width })
    .webp({ quality: avatarPosterQuality })
    .toBuffer();
}
