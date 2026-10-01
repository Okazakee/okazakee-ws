'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

/**
 * Project request form (docs/DESIGN.md §5.4). UI only for now: the fields,
 * centred rows and the "coming soon" band are in place, and the submit will be
 * wired to PreCall (a library where the consumer owns the form and each field
 * carries its own policy, e.g. email never being sent to the model).
 */
export function RequestForm() {
  const t = useTranslations('request-form');
  const tFooter = useTranslations('footer');
  const currentLocale = useLocale();

  const fieldClass =
    'w-full rounded-lg border border-border-subtle bg-surface-base px-3 py-2.5 font-mono text-xs text-text-main placeholder:text-text-dim focus:border-accent-violet/60 focus:outline-none';
  // Mock's select: native appearance off, a chevron 8px from the right edge
  // and a 16px line box (see .request-select in globals.css).
  const selectClass = `${fieldClass} request-select`;
  const labelClass =
    'mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim';

  return (
    <div className="relative mt-14 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card p-6 sm:p-8">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-accent-violet">
        {t('eyebrow')}
      </p>
      <h3 className="mt-3 text-center font-heading text-xl font-semibold text-text-white">
        {t('title')}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-text-muted">
        {t('subtitle')}
      </p>

      <form className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="request-name">
            {t('name')}
          </label>
          <input
            className={fieldClass}
            id="request-name"
            name="name"
            placeholder={t('namePlaceholder')}
            type="text"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="request-email">
            {t('email')}
          </label>
          <input
            className={fieldClass}
            id="request-email"
            name="email"
            placeholder={t('emailPlaceholder')}
            type="email"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="request-company">
            {t('company')}
          </label>
          <input
            className={fieldClass}
            id="request-company"
            name="company"
            placeholder={t('companyPlaceholder')}
            type="text"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="request-website">
            {t('website')}
          </label>
          <input
            className={fieldClass}
            id="request-website"
            name="website"
            placeholder={t('websitePlaceholder')}
            type="url"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="request-type">
            {t('type')}
          </label>
          <select className={selectClass} id="request-type" name="type">
            {(t.raw('typeOptions') as string[]).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="request-budget">
            {t('budget')}
          </label>
          <select className={selectClass} id="request-budget" name="budget">
            {(t.raw('budgetOptions') as string[]).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="request-timeline">
            {t('timeline')}
          </label>
          <select className={selectClass} id="request-timeline" name="timeline">
            {(t.raw('timelineOptions') as string[]).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="request-body">
            {t('request')}
          </label>
          <textarea
            className={`${fieldClass} leading-relaxed`}
            id="request-body"
            name="request"
            placeholder={t('requestPlaceholder')}
            rows={5}
          />
        </div>

        <div className="flex justify-center sm:col-span-2">
          <label className="flex max-w-md items-start gap-2 text-xs leading-relaxed text-text-dim">
            <input
              className="request-consent mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border-subtle bg-surface-base"
              name="consent"
              type="checkbox"
            />
            <span>
              {t('consent')}{' '}
              <Link
                className="text-accent-violet-light underline underline-offset-2"
                href={`/${currentLocale}/privacy-policy`}
              >
                {tFooter('privacyPolicy')}
              </Link>
              .
            </span>
          </label>
        </div>

        <div className="flex justify-center sm:col-span-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-accent-violet px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] text-surface-base transition-colors hover:bg-accent-violet-light"
            type="submit"
          >
            {t('submit')}
          </button>
        </div>
      </form>

      {/* Preview state until PreCall is wired up */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-surface-base/45 backdrop-blur-[1px]"
      >
        <span className="-rotate-[7deg] w-[150%] border-y border-accent-violet/30 bg-surface-base/80 py-3 text-center font-mono text-sm uppercase tracking-[0.3em] text-accent-violet-light">
          {t('comingSoon')}
        </span>
      </div>
    </div>
  );
}
