import { getPosts } from '@utils/getData';
import { getPostHref } from '@utils/postHref';
import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.DOMAIN_URL;

  // Get all posts
  const portfolioPosts = (await getPosts(
    'portfolio',
    undefined,
    undefined,
    100
  )) as PortfolioPost[];
  const blogPosts = (await getPosts(
    'blog',
    undefined,
    undefined,
    100
  )) as BlogPost[];

  // Create sitemap entries for each locale and post
  const portfolioUrls =
    portfolioPosts?.flatMap((post) =>
      locales.map((locale) => ({
        url: `${baseUrl}${getPostHref({
          locale,
          postType: 'portfolio',
          id: post.id,
          title: post.title_en,
        })}`,
        lastModified: post.created_at,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))
    ) || [];

  const blogUrls =
    blogPosts?.flatMap((post) =>
      locales.map((locale) => ({
        url: `${baseUrl}${getPostHref({
          locale,
          postType: 'blog',
          id: post.id,
          title: locale === 'en' ? post.title_en : post.title_it,
        })}`,
        lastModified: post.created_at,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }))
    ) || [];

  // Add static pages for each locale
  const staticPages = locales.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/${locale}/blog`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${locale}/portfolio`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${locale}/privacy-policy`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]);

  return [...staticPages, ...portfolioUrls, ...blogUrls];
}
