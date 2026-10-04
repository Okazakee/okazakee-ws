import { NextResponse } from 'next/server';
import {
  avatarPosterWidths,
  encodeAvatarPoster,
} from '@/libs/media/avatarPoster';
import { getHeroSection } from '@/utils/getData';

const upstreamTimeoutMs = 5000;

/**
 * Static poster for the animated hero avatar: frame 0 of the same file,
 * resized and re-encoded.
 *
 * `next/image` deliberately skips animated sources, so the animated WebP is
 * downloaded whole (the hero avatar is ~185 KB). The poster keeps that payload
 * out of the critical path; the client swaps the animation in afterwards.
 *
 * The source is read from the CMS row, never from the request, so the route
 * cannot be pointed at an arbitrary URL.
 */
export async function GET(request: Request) {
  const width = Number(new URL(request.url).searchParams.get('w'));
  if (!avatarPosterWidths.includes(width)) {
    return NextResponse.json(
      { error: `width must be one of ${avatarPosterWidths.join(', ')}` },
      { status: 400 }
    );
  }

  const heroSection = await getHeroSection();
  if (!heroSection?.propic) {
    return NextResponse.json(
      { error: 'Hero avatar not found' },
      { status: 404 }
    );
  }

  try {
    const upstream = await fetch(heroSection.propic, {
      signal: AbortSignal.timeout(upstreamTimeoutMs),
    });
    if (!upstream.ok) {
      throw new Error(`upstream responded ${upstream.status}`);
    }

    const source = Buffer.from(await upstream.arrayBuffer());
    const poster = await encodeAvatarPoster(source, width);

    return new Response(new Uint8Array(poster), {
      headers: {
        'Content-Type': 'image/webp',
        // Version-keyed by the CMS upload stamp (`v=`), so the browser can hold
        // it for a week without revalidating and the CDN can hold it for a year.
        'Cache-Control':
          'public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[hero-avatar] poster generation failed:', error);
    return NextResponse.json({ error: 'Poster unavailable' }, { status: 502 });
  }
}
