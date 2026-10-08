import { ErrorDiv } from '@components/common/ErrorDiv';
import { SectionEyebrow } from '@components/common/SectionEyebrow';
import { SectionNumber } from '@components/common/SectionNumber';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { InnerHtml } from '@/components/common/InnerHtml';
import { formatLabels } from '@/utils/formatLabels';
import { getSkillsCategories } from '@/utils/getData';
import { sortSkillsByPosition } from '@/utils/skillOrder';

const rowClass =
  'group relative flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-card p-3.5 transition-colors hover:border-accent-violet/50 hover:bg-surface-card-hover';

/**
 * Skills grid (docs/DESIGN.md §6): centred square tiles per category, three per
 * row on mobile and six from `md` up, with the real icon URLs from the DB and
 * no hover zoom — the tile itself is the hover target.
 *
 * Skills render in the canonical order (`utils/skillOrder`), and a skill with a
 * `link` renders its tile as an external anchor; without one the tile is the
 * plain `<div>` it has always been.
 */
export default async function Skills({ locale }: { locale: string }) {
  const skillsCategories = await getSkillsCategories();
  const t = await getTranslations({ locale, namespace: 'skills-section' });

  if (!skillsCategories) return <ErrorDiv>Error loading Skills data</ErrorDiv>;

  return (
    <section className="mx-auto max-w-5xl px-6 py-24" id="skills">
      <div className="mb-16 text-center">
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-baseline">
          <SectionNumber className="justify-self-end pr-2.5" index={2} />
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

      <div className="space-y-12">
        {skillsCategories.map((category, index) => (
          <div className="space-y-4" key={category.id}>
            <SectionEyebrow index={index + 1} label={category.name} />
            <div className="flex flex-wrap justify-center gap-3.5">
              {sortSkillsByPosition(category.skills).map((skill) => {
                const href = skill.link?.trim() ? skill.link.trim() : null;
                const widthClass =
                  'w-full sm:w-[calc(50%-7px)] lg:w-[calc(33.333%-10px)]';
                const body = (
                  <>
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-surface-raised">
                        <Image
                          alt={skill.title}
                          blurDataURL={skill.blurhashURL || undefined}
                          className={`max-h-6 max-w-6 object-contain ${
                            skill.invert ? 'dark:invert' : ''
                          }`}
                          height={48}
                          placeholder={skill.blurhashURL ? 'blur' : 'empty'}
                          sizes="24px"
                          src={skill.icon}
                          width={48}
                        />
                      </span>
                      <span className="font-mono text-sm font-semibold text-text-white transition-colors group-hover:text-accent-violet-light">
                        {skill.title}
                      </span>
                    </span>
                    {href ? (
                      <span
                        aria-hidden="true"
                        className="font-mono text-xs text-text-dim transition-colors group-hover:text-accent-violet"
                      >
                        ↗
                      </span>
                    ) : null}
                  </>
                );

                return href ? (
                  <Link
                    className={`${rowClass} ${widthClass}`}
                    href={href}
                    key={skill.id}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={`${rowClass} ${widthClass}`} key={skill.id}>
                    {body}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
