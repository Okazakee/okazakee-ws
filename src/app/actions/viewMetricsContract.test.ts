import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function source(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), {
    encoding: 'utf8',
  });
}

const INVALIDATION_PATTERN =
  /revalidateTag|updateTag|invalidatePublicContent|content-revalidate/;

describe('view metrics stay out of content-cache invalidation', () => {
  it('no view action references invalidation', () => {
    for (const file of [
      './incrementViews.ts',
      './getPostViewsBatch.ts',
      './getCurrentViews.ts',
    ]) {
      expect(source(file)).not.toMatch(INVALIDATION_PATTERN);
    }
  });

  it('no view component references invalidation', () => {
    expect(
      source('../../components/common/ViewDisplay.tsx')
    ).not.toMatch(INVALIDATION_PATTERN);
    expect(source('../../components/common/PostViews.tsx')).not.toMatch(
      INVALIDATION_PATTERN
    );
  });
});

describe('view counts are never rendered from ISR snapshots', () => {
  it('cards do not display the baked post.views column', () => {
    expect(source('../../components/common/PostCard.tsx')).not.toContain(
      'post.views'
    );
  });

  it('the detail counter does not consume an initialViews snapshot', () => {
    expect(source('../../components/common/ViewDisplay.tsx')).not.toContain(
      'initialViews'
    );
  });
});
