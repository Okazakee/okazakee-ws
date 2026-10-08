import { ErrorDiv } from '@components/common/ErrorDiv';
import { Glitch } from '@components/common/Glitch';
import { SectionEyebrow } from '@components/common/SectionEyebrow';
import { SectionNumber } from '@components/common/SectionNumber';
import { ArrowUpRight, type LucideProps } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import React from 'react';
import {
  AppleIcon,
  GithubIcon,
  LinkedinIcon,
} from '@/components/common/BrandIcons';
import { InnerHtml } from '@/components/common/InnerHtml';
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
          className="mx-auto mt-2 w-fit max-w-xl font-mono text-xs text-accent-violet-light sm:text-sm"
          html={formatLabels(t('subtitle'))}
        />
        <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-accent-violet" />
      </div>

      <section aria-label={t('directChannelsLabel')} className="mb-14 w-full">
        <SectionEyebrow index={1} label={t('directChannels')} />

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {contacts.map(({ id, label, icon, link, bg_color }) => {
            const IconComponent = getIconComponent(icon);

            return (
              <Glitch key={id} mode="both">
                <Link
                  className="group relative flex min-h-32 flex-col items-center justify-between rounded-xl border border-border-subtle bg-surface-card p-4 text-center transition-colors hover:border-accent-violet/50 hover:bg-surface-card-hover"
                  data-umami-event={`${label} button`}
                  href={link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="flex w-full justify-end">
                    <ArrowUpRight className="h-3.5 w-3.5 text-text-dim transition-colors group-hover:text-accent-violet-light" />
                  </span>
                  <span
                    className="my-2 flex h-10 w-10 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised transition-colors group-hover:border-accent-violet/50"
                    style={{
                      backgroundColor: `${bg_color}1a`,
                      color: bg_color,
                    }}
                  >
                    {IconComponent ? (
                      <IconComponent className="h-5 w-5" strokeWidth={1.8} />
                    ) : null}
                  </span>
                  <span className="mt-1 font-mono text-xs font-medium text-text-main transition-colors group-hover:text-text-white">
                    {label}
                  </span>
                </Link>
              </Glitch>
            );
          })}
        </div>
      </section>

      <section aria-label={t('projectInquiryLabel')} className="w-full">
        <SectionEyebrow index={2} label={t('projectInquiry')} />
        <RequestForm />
      </section>
    </section>
  );
}
