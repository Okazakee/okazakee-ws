import { PortfolioPost } from '@/types/fetchedData.types'
import { getAllPortfolioPosts, getPortfolioPost } from '@/utils/getData'
import { notFound, redirect } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: { post: string; title: string }
}) {
  const postID = params.post
  const post: PortfolioPost | null = await getPortfolioPost(postID)

  if (!post) {
    notFound()
  }

  // If the provided title doesn't match the actual post title, redirect to the correct URL
  const slugifiedTitle = post.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  if (params.title !== slugifiedTitle) {
    redirect(`/portfolio/${postID}/${slugifiedTitle}`)
  }

  return (
    <section className="md:mx-10 mx-5 flex items-center my-32">
      <div>My Post: {post.title}</div>
    </section>
  )
}

export async function generateStaticParams() {
  const posts = await getAllPortfolioPosts()

  return posts!.map((post: PortfolioPost) => ({
    post: post.id.toString(),
    title: post.title.toLowerCase().replace(/\s+/g, '-'),
  }))
}