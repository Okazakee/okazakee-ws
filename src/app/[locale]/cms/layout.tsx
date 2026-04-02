import type { Metadata } from 'next';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'it' }];
}

export const metadata: Metadata = {
  title: 'CMS - Dashboard',
  description: 'Content Management System Dashboard',
};

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  return children;
}
