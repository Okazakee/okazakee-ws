'use client';

import { Eye } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getCurrentViews } from '@/app/actions/getCurrentViews';
import { incrementViews } from '@/app/actions/incrementViews';

const VIEW_TTL_MS = 24 * 60 * 60 * 1000;
const PLACEHOLDER = '—';

// Preview or malformed ids never touch the metric path.
function isCountableId(postId: string): boolean {
  return postId.trim() !== '' && /^\d+$/.test(postId);
}

function readLastViewed(visitKey: string): number | null {
  try {
    const raw = localStorage.getItem(visitKey);
    if (raw === null) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function markViewed(visitKey: string): void {
  try {
    localStorage.setItem(visitKey, Date.now().toString());
  } catch {
    // Private mode etc: counting still proceeds, dedupe just won't stick.
  }
}

function clearViewed(visitKey: string): void {
  try {
    localStorage.removeItem(visitKey);
  } catch {
    // Ignore: best-effort retry marker only.
  }
}

/**
 * Detail-page view counter: volatile metric rendered as a client island,
 * never from ISR (baked numbers go stale and disagree across locales, so
 * the badge shows `—` until the live value resolves and keeps it when
 * the metric request fails). At most one increment per
 * browser/post/24h. Identity tracking (not remount reliance) drives the
 * lifecycle: a new `{postType, postId}` starts exactly one flow while
 * same-identity reruns stay suppressed, and a generation check keeps a
 * late response for a previous post off the screen. Never invalidates
 * content cache.
 */
export default function ViewDisplay({
  postId,
  postType,
}: {
  postId: string;
  postType: 'blog' | 'portfolio';
}) {
  const [views, setViews] = useState<number | null>(null);
  // Metric identity of the running flow; null until the first run.
  const identityRef = useRef<string | null>(null);
  // Monotonic generation: every identity run takes the next value, so a
  // continuation can prove it still belongs to the visible post.
  const generationRef = useRef(0);

  useEffect(() => {
    // Full metric identity — locale-independent by construction.
    const identity = `${postType}:${postId}`;
    // Same identity (rerender, StrictMode rerun): exactly one flow.
    if (identityRef.current === identity) return;
    identityRef.current = identity;
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    const isCurrent = () => generation === generationRef.current;
    // New post: never flash the previous count.
    setViews(null);

    if (!isCountableId(postId)) return;

    // Unique key for this post visit with 24-hour expiration.
    const visitKey = `viewed_${postType}_${postId}`;
    const lastViewed = readLastViewed(visitKey);
    const hasViewedRecently =
      lastViewed !== null && Date.now() - lastViewed < VIEW_TTL_MS;

    if (!hasViewedRecently) {
      // Marked synchronously so a rerun/double-effect cannot re-enter.
      markViewed(visitKey);
      incrementViews(postId, postType)
        .then((result) => {
          if (!isCurrent()) return;
          if (result.success && typeof result.views === 'number') {
            setViews(result.views);
            return;
          }
          if (result.success) {
            // Beta/localhost skip or pre-migration RPC without a count:
            // resolve the live value with a read.
            getCurrentViews(postId, postType)
              .then((current) => {
                if (isCurrent() && current.success) {
                  setViews(current.views);
                }
              })
              .catch(() => undefined);
            return;
          }
          clearViewed(visitKey);
        })
        .catch(() => {
          clearViewed(visitKey);
        });
    } else {
      getCurrentViews(postId, postType)
        .then((current) => {
          if (isCurrent() && current.success) setViews(current.views);
        })
        .catch(() => undefined);
    }
  }, [postId, postType]);

  return (
    <div className="inline-flex items-center gap-2">
      <Eye size={14} />
      <span className="inline-block shrink-0 tabular-nums">
        {views === null ? PLACEHOLDER : views}
      </span>
    </div>
  );
}
