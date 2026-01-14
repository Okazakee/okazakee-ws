'use client';

import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCurrentViews } from '@/app/actions/getCurrentViews';
import { incrementViews } from '@/app/actions/incrementViews';

interface ViewDisplayProps {
  postId: string;
  postType: 'blog' | 'portfolio';
  initialViews: number | string;
  isCard?: boolean;
}

export default function ViewDisplay({
  postId,
  postType,
  initialViews,
  isCard = false,
}: ViewDisplayProps) {
  const [views, setViews] = useState(initialViews);
  const [hasIncremented, setHasIncremented] = useState(false);

  useEffect(() => {
    if (isCard) {
      setViews(initialViews);
      return;
    }

    console.log('🚀 ViewDisplay useEffect triggered', {
      postId,
      postType,
      hasIncremented,
    });

    // Create a unique key for this post visit with 24-hour expiration
    const visitKey = `viewed_${postType}_${postId}`;

    // Check if we've already incremented for this post in the last 24 hours
    const lastViewed = localStorage.getItem(visitKey);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    let hasViewedRecently = false;
    if (lastViewed) {
      const lastViewedTime = parseInt(lastViewed, 10);
      hasViewedRecently = now - lastViewedTime < twentyFourHours;
    }

    console.log('🔍 24h check:', {
      visitKey,
      lastViewed,
      hasViewedRecently,
      hoursSinceLastView: lastViewed
        ? Math.round((now - parseInt(lastViewed, 10)) / (60 * 60 * 1000))
        : 'never',
      hasIncremented,
    });

    if (!hasViewedRecently && !hasIncremented) {
      console.log('✅ Proceeding with increment (24h window)');
      setHasIncremented(true);

      // Mark as viewed with current timestamp
      localStorage.setItem(visitKey, now.toString());

      // First increment in the database
      incrementViews(postId, postType)
        .then((result) => {
          console.log('🔍 Increment result:', result);
          if (result.success) {
            console.log('✅ Database updated successfully');

            // Then fetch the real current view count from database
            return getCurrentViews(postId, postType);
          }

          console.error('❌ Database update failed:', result.error);
          throw new Error(result.error);
        })
        .then((viewsResult) => {
          if (viewsResult?.success) {
            // Update with the real count from database
            setViews(viewsResult.views);
            console.log('📊 Updated with real view count:', viewsResult.views);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to increment views:', error);
          // Remove the localStorage if increment failed
          localStorage.removeItem(visitKey);
        });
    } else if (hasViewedRecently) {
      console.log('📋 Already viewed in last 24h, fetching current count');
      // If already viewed in this session, just fetch current count
      getCurrentViews(postId, postType).then((viewsResult) => {
        if (viewsResult?.success) {
          setViews(viewsResult.views);
          console.log('📊 Fetched current view count:', viewsResult.views);
        }
      });
    } else {
      console.log('❌ Not incrementing - conditions not met');
    }
  }, [isCard, initialViews, postId, postType, hasIncremented]);

  return (
    <div className="flex items-center text-darktext dark:text-lighttext">
      <Eye size={20} className={isCard ? 'mr-1' : 'mr-2'} />
      <span className="mt-0.5">{views}</span>
    </div>
  );
}
