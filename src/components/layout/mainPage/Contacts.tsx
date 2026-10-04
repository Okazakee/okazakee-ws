import { ErrorDiv } from '@components/common/ErrorDiv';
import type { LucideProps } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import React from 'react';
import {
  AppleIcon,
  GithubIcon,
  LinkedinIcon,
} from '@/components/common/BrandIcons';
import { InnerHtml } from '@/components/common/InnerHtml';
import { SectionNumber } from '@components/common/SectionNumber';
import { formatLabels } from '@/utils/formatLabels';
import { getContacts } from '@/utils/getData';
import { RequestForm } from './RequestForm';

export default async function Contacts({ locale }: { locale: string }) {
  const contacts = (await getContacts())?.sort(
    (a, b) => a.position - b.position
  );

  if (!contacts) return <ErrorDiv>Error loading Contacts data</ErrorDiv>;

  const t = await getTranslations({ locale, namespace: 'contacts-section' });

  const brandIcons: Record<string, React.ComponentType<LucideProps>> = {
    Github: GithubIcon,
    Linkedin: LinkedinIcon,
    Apple: AppleIcon,
  };

  const getIconComponent = (iconName: string) => {
    const capitalized = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    const BrandIcon = brandIcons[capitalized];
    if (BrandIcon) return BrandIcon;

    return React.lazy(() =>
      import('lucide-react').then((module) => {
        const Icon = module[capitalized] as React.ComponentType<LucideProps>;
        return { default: Icon ?? (() => null) };
      })
    );
  };

  return (
    <section
      className="mx-auto max-w-4xl px-6 py-24 text-center lg:mb-32"
      id="contacts"
    >
      <div className="mb-14 text-center">
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-baseline">
          <SectionNumber className="justify-self-end pr-2.5" index={6} />
          <InnerHtml
            as="h2"
            className="font-heading text-2xl font-semibold text-text-white sm:text-3xl"
            html={formatLabels(t('title'))}
          />
          <span aria-hidden="true" />
        </div>
        <InnerHtml
          as="p"
          className="mt-2 font-mono text-xs text-accent-violet-light sm:text-sm"
          html={formatLabels(t('subtitle'))}
        />
        <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-accent-violet" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {contacts.map(({ id, label, icon, link, bg_color }) => {
          const IconComponent = getIconComponent(icon);

          return (
            <Link
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-surface-card p-5 text-center transition-colors hover:border-accent-violet hover:bg-surface-raised"
              data-umami-event={`${label} button`}
              href={link}
              key={id}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${bg_color}1a`, color: bg_color }}
              >
                {IconComponent ? (
                  <IconComponent className="h-6 w-6" strokeWidth={1.8} />
                ) : null}
              </span>
              <span className="text-sm font-medium text-text-white">
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      <RequestForm />
    </section>
  );
}
