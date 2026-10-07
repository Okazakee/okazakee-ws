'use client';

import { ArrowUpRight, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChipRow } from '@components/common/ChipRow';
import { ClientMarkdown } from '@components/common/ClientMarkdown';
import { SectionNumber } from '@components/common/SectionNumber';
import { InnerHtml } from '@/components/common/InnerHtml';
import { diffMonths, formatMonthYear } from '@/utils/formatDate';
import { formatLabels } from '@/utils/formatLabels';

const separator = '//';

interface CareerEntry {
  id: string;
  title: string;
  company: string;
  remote: string;
  startDate: string;
  endDate: string | null;
  skills: string;
  logo: string;
  blurhashurl: string;
  website_url: string;
  [key: `location_${string}`]: string;
  [key: `description_${string}`]: string;
}

interface CompanyGroup {
  company: string;
  positions: CareerEntry[];
}

/** Same company means the same job — role upgrades share one card. */
const groupByCompany = (entries: CareerEntry[]): CompanyGroup[] => {
  const groups: CompanyGroup[] = [];

  for (const entry of entries) {
    const group = groups.find((item) => item.company === entry.company);

    if (group) {
      group.positions.push(entry);
    } else {
      groups.push({ company: entry.company, positions: [entry] });
    }
  }

  return groups.map((group) => ({
    ...group,
    positions: [...group.positions].sort((a, b) =>
      a.startDate < b.startDate ? 1 : -1
    ),
  }));
};

const parseSkills = (skills: string): string[] =>
  skills ? Array.from(skills.matchAll(/"([^"]*?)"/g), (match) => match[1]) : [];

/**
 * Career timeline (docs/DESIGN.md §5.3): one card per company, newest role
 * featured with older roles nested beneath it. The line is drawn per entry so
 * it starts at the first dot's centre and ends at the last; only the company
 * name links out to the company site.
 */
export function CareerClient({
  careerEntries,
  locale,
}: {
  careerEntries: CareerEntry[];
  locale: string;
}) {
  const t = useTranslations('career-section');
  const groups = groupByCompany(careerEntries);

  const duration = (startDate: string, endDate: string | null) => {
    const months = diffMonths(endDate ?? new Date(), startDate);

    if (months < 12) {
      return `${months} ${t(months === 1 ? 'month' : 'months')}`;
    }

    const years = Math.floor(months / 12);
    return `${years} ${t(years === 1 ? 'year' : 'years')}`;
  };

  const dates = (entry: CareerEntry) =>
    `${formatMonthYear(entry.startDate)} - ${
      entry.endDate ? formatMonthYear(entry.endDate) : t('present')
    } ${separator} ${duration(entry.startDate, entry.endDate)}`;

  const pill = (entry: CareerEntry) => (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 font-mono text-xs text-text-muted">
      {!entry.endDate && (
        <span className="h-1.5 w-1.5 rounded-full bg-status-active" />
      )}
      {dates(entry)}
    </span>
  );

  const chips = (entry: CareerEntry) => (
    <ChipRow>
      {parseSkills(entry.skills).map((skill) => (
        <span
          className="mr-1.5 inline-flex shrink-0 items-center gap-1 rounded border border-border-subtle bg-surface-raised px-2 py-0.5 font-mono text-xs text-text-muted"
          key={skill}
        >
          <Tag className="mr-0.5 h-3 w-3 shrink-0 text-accent-violet/70" />
          {skill}
        </span>
      ))}
    </ChipRow>
  );

  const position = (entry: CareerEntry, nested: boolean) => (
    <>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <h3
          className={`font-heading font-semibold text-text-white ${
            nested ? 'text-base' : 'text-lg'
          }`}
        >
          {entry.title}
        </h3>
        {nested && pill(entry)}
      </div>

      {nested && (
        <p className="mb-4 w-fit text-xs text-text-dim">
          {entry[`location_${locale}`]} {separator}{' '}
          {t(`remote.${entry.remote}`)}
        </p>
      )}

      {entry[`description_${locale}`] && (
        <ClientMarkdown className="career-list mb-5 text-sm font-light leading-relaxed text-text-main/90 [&_li]:mb-2">
          {entry[`description_${locale}`]}
        </ClientMarkdown>
      )}

      {chips(entry)}
    </>
  );

  return (
    <section
      className="border-t border-border-subtle/50 bg-surface-alt py-24"
      id="career"
    >
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-16 text-center">
          <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-baseline">
            <SectionNumber className="justify-self-end pr-2.5" index={3} />
            <InnerHtml
              as="h2"
              className="font-heading text-2xl font-semibold text-text-white sm:text-3xl"
              html={t('title')}
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

        <div className="relative space-y-12 pl-6 sm:pl-8">
          {groups.map((group, index) => {
            const [latest, ...older] = group.positions;

            return (
              <div className="group relative" key={group.company}>
                {index < groups.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-[61px] left-[-24.5px] top-[13px] w-px bg-accent-violet/30 sm:left-[-32.5px]"
                  />
                )}
                <span className="absolute -left-[32px] top-[5px] flex h-4 w-4 items-center justify-center sm:-left-[40px]">
                  {index === 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-accent-violet/60 motion-safe:[animation:ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`block rounded-full border-4 border-surface-alt bg-accent-violet shadow-lg shadow-accent-violet/40 ${
                      index === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
                    }`}
                  />
                </span>

                <div className="rounded-2xl border border-border-subtle bg-surface-card p-6 sm:p-7">
                  <div className="mb-5 flex flex-wrap items-start gap-3">
                    <span className="flex shrink-0 items-center rounded-lg border border-border-subtle bg-surface-raised p-1.5">
                      {/* biome-ignore lint/performance/noImgElement: brand marks arrive in arbitrary aspect ratios, so the height is capped rather than fixed */}
                      <img
                        alt={group.company}
                        className="max-h-10 w-auto object-contain"
                        loading="lazy"
                        src={latest.logo}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        className="inline-flex items-center gap-1 font-heading text-base font-semibold text-text-white transition-colors hover:text-accent-violet-light hover:underline hover:underline-offset-2"
                        href={latest.website_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {group.company}
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-text-dim" />
                      </a>
                      <p className="mt-1 w-fit text-xs text-text-dim">
                        {latest[`location_${locale}`]} {separator}{' '}
                        {t(`remote.${latest.remote}`)}
                      </p>
                    </div>
                    {pill(latest)}
                  </div>

                  {position(latest, false)}

                  {older.length > 0 && (
                    <div className="mt-6 space-y-5 border-t border-border-subtle pt-5">
                      {older.map((entry) => (
                        <div key={entry.id}>{position(entry, true)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
