'use client';

import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { publicConfig } from '@/config/public';

/**
 * Project request form (docs/DESIGN.md §5.4) as a 3-step wizard, so the
 * mobile card stays one calm screen instead of a tall rectangle:
 * 1) contact (name, email), 2) project (company, website, type, budget,
 * timeline), 3) details + consent and the fake submit.
 *
 * UI only for now — the submit will be wired to PreCall (a library where the
 * consumer owns the form and each field carries its own policy, e.g. email
 * never being sent to the model). The "coming soon" overlay only renders on
 * production builds, so testers can click through the steps elsewhere.
 */
export function RequestForm() {
  const tFooter = useTranslations('footer');
  const currentLocale = useLocale();
  const [step, setStep] = useState(0);

  // Fake wizard copy for now — lives here, not in the CMS, until the CMS
  // starts storing requests and owns the strings.
  const copy = {
    eyebrow: 'Project request',
    title: 'Send me a request',
    subtitle:
      'Three quick steps: who you are, what you are building, and the details.',
    steps: ['Contact', 'Project', 'Details'],
    back: 'Back',
    next: 'Next',
    submit: 'Send request',
    comingSoon: 'Coming soon',
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@company.com',
    company: 'Company',
    companyPlaceholder: 'Company or organisation',
    website: 'Website',
    websitePlaceholder: 'https://example.com',
    type: 'Project type',
    typeOptions: ['Website', 'Web app', 'Mobile app', 'Other'],
    budget: 'Budget',
    budgetOptions: ['< €1k', '€1–5k', '€5–15k', '€15k+'],
    timeline: 'Timeline',
    timelineOptions: ['ASAP', '1–2 months', '3–6 months', 'Flexible'],
    request: 'Project details',
    requestPlaceholder: 'What are you building? Goals, scope, links…',
    consent: 'I agree to the processing of my data as described in the',
  };

  const fieldClass =
    'w-full rounded-lg border border-border-subtle bg-surface-base px-3 py-2.5 font-mono text-xs text-text-main placeholder:text-text-dim focus:border-accent-violet/60 focus:outline-none';
  // Mock's select: native appearance off, a chevron 8px from the right edge
  // and a 16px line box (see .request-select in globals.css).
  const selectClass = `${fieldClass} request-select`;
  const labelClass =
    'mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim';

  const field = (
    id: string,
    label: string,
    control: React.ReactNode,
    span?: boolean
  ) => (
    <div className={span ? 'sm:col-span-2' : undefined} key={id}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {control}
    </div>
  );

  const pages = [
    [
      field(
        'request-name',
        copy.name,
        <input
          className={fieldClass}
          id="request-name"
          name="name"
          placeholder={copy.namePlaceholder}
          type="text"
        />
      ),
      field(
        'request-email',
        copy.email,
        <input
          className={fieldClass}
          id="request-email"
          name="email"
          placeholder={copy.emailPlaceholder}
          type="email"
        />
      ),
      field(
        'request-company',
        copy.company,
        <input
          className={fieldClass}
          id="request-company"
          name="company"
          placeholder={copy.companyPlaceholder}
          type="text"
        />
      ),
      field(
        'request-website',
        copy.website,
        <input
          className={fieldClass}
          id="request-website"
          name="website"
          placeholder={copy.websitePlaceholder}
          type="url"
        />
      ),
    ],
    [
      field(
        'request-type',
        copy.type,
        <select className={selectClass} id="request-type" name="type">
          {copy.typeOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ),
      field(
        'request-budget',
        copy.budget,
        <select className={selectClass} id="request-budget" name="budget">
          {copy.budgetOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ),
      field(
        'request-timeline',
        copy.timeline,
        <select className={selectClass} id="request-timeline" name="timeline">
          {copy.timelineOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>,
        true
      ),
    ],
    [
      field(
        'request-body',
        copy.request,
        <textarea
          className={`${fieldClass} leading-relaxed`}
          id="request-body"
          name="request"
          placeholder={copy.requestPlaceholder}
          rows={5}
        />,
        true
      ),
      <div className="flex justify-center sm:col-span-2" key="consent">
        <label className="flex max-w-md items-start gap-2 text-xs leading-relaxed text-text-dim">
          <input
            className="request-consent mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border-subtle bg-surface-base"
            name="consent"
            type="checkbox"
          />
          <span>
            {copy.consent}{' '}
            <Link
              className="text-accent-violet-light underline underline-offset-2"
              href={`/${currentLocale}/privacy-policy`}
            >
              {tFooter('privacyPolicy')}
            </Link>
            .
          </span>
        </label>
      </div>,
    ],
  ];

  return (
    <div className="relative mt-14 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card p-6 sm:p-8">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-accent-violet">
        {copy.eyebrow}
      </p>
      <h3 className="mt-3 text-center font-heading text-xl font-semibold text-text-white">
        {copy.title}
      </h3>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-text-muted">
        {copy.subtitle}
      </p>

      <ol className="mx-auto mt-6 flex max-w-md items-center gap-2">
        {copy.steps.map((label, index) => (
          <li
            className="flex min-w-0 flex-1 items-center gap-2 last:flex-none"
            key={label}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-colors ${
                index < step
                  ? 'border-accent-violet bg-accent-violet text-text-on-accent'
                  : index === step
                    ? 'border-accent-violet text-accent-violet-light'
                    : 'border-border-subtle text-text-dim'
              }`}
            >
              {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={`hidden truncate font-mono text-[11px] sm:block ${
                index === step ? 'text-text-main' : 'text-text-dim'
              }`}
            >
              {label}
            </span>
            {index < copy.steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px min-w-3 flex-1 ${index < step ? 'bg-accent-violet' : 'bg-border-subtle'}`}
              />
            )}
          </li>
        ))}
      </ol>

      <form
        className="mt-7 flex min-h-[269px] flex-col"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid flex-1 grid-cols-1 content-start gap-5 sm:grid-cols-2">
          {pages[step]}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-7">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-5 py-2.5 font-mono text-xs uppercase tracking-[0.08em] text-text-main transition-colors hover:border-accent-violet/50 hover:text-text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={step === 0}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.back}
          </button>
          {step < pages.length - 1 ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-accent-violet-deep px-6 py-2.5 font-mono text-xs uppercase tracking-[0.08em] text-white transition-colors hover:bg-accent-violet"
              onClick={() =>
                setStep((current) => Math.min(pages.length - 1, current + 1))
              }
              type="button"
            >
              {copy.next}
              <ArrowRight className="h-4 w-4 text-white" />
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-accent-violet-deep px-6 py-2.5 font-mono text-xs uppercase tracking-[0.08em] text-white transition-colors hover:bg-accent-violet"
              type="submit"
            >
              <Send className="h-4 w-4 text-white" />
              {copy.submit}
            </button>
          )}
        </div>
      </form>

      {/* Preview state until PreCall is wired up — prod only, so testers can
          click through the steps on every other environment. */}
      {publicConfig.isProduction && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-surface-base/45 backdrop-blur-[1px]"
        >
          <span className="-rotate-[7deg] w-[150%] border-y border-accent-violet/30 bg-surface-base/80 py-3 text-center font-mono text-sm uppercase tracking-[0.3em] text-accent-violet-light">
            {copy.comingSoon}
          </span>
        </div>
      )}
    </div>
  );
}
