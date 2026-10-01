'use client';

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function GitHubStars({ sourceLink }: { sourceLink: string }) {
  const [stars, setStars] = useState(0);

  useEffect(() => {
    // Only owner/repo links resolve to a repository: some posts store an
    // organisation or profile URL, which would 404 and render a bogus 0.
    const path = sourceLink.replace(/^https?:\/\/github\.com\//, '').replace(/\/+$/, '');
    const [owner, repoName] = path.split('/');
    if (!owner || !repoName) return;

    let cancelled = false;

    fetch(`https://api.github.com/repos/${owner}/${repoName}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setStars(data.stargazers_count ?? 0);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [sourceLink]);

  return (
    <div className="inline-flex items-center gap-2">
      <Star className="text-accent-violet" size={14} />
      <span>{stars}</span>
    </div>
  );
}
