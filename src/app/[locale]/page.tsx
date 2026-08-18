import Career from '@layout/mainPage/Career';
import Contacts from '@layout/mainPage/Contacts';
import Hero from '@layout/mainPage/Hero';
import PostsSection from '@layout/mainPage/PostsSections';
import Skills from '@layout/mainPage/Skills';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const pageDesc =
    locale === 'en'
      ? 'Personal website with portfolio and blog'
      : 'Sito personale con portfolio e blog';

  return {
    title: 'Home - Okazakee WS',
    description: pageDesc,
  };
}

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'it' }];
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="mx-auto md:max-w-7xl mt-10 md:mt-0">
      <Hero locale={locale} />

      <Skills locale={locale} />

      <Career locale={locale} />

      <PostsSection locale={locale} />

      <Contacts locale={locale} />
    </main>
  );
}
