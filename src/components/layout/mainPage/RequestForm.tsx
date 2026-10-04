'use client';

import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { publicConfig } from '@/config/public';
import {
  type RequestFormOptions,
  requestFormCopy,
  requestFormOptions,
} from '@/i18n/requestForm';
import { readIntakeErrorCode } from '@/libs/requests/intake';

/**
 * Project request form (docs/DESIGN.md §5.4) as a 3-step wizard, so the
 * mobile card stays one calm screen instead of a tall rectangle:
 * 1) contact (name, email), 2) project (company, website, type, budget,
 * timeline), 3) details + consent, then the real submit.
 *
 * The submit POSTs JSON to /api/requests, which re-validates every field and
 * writes through the service-role client (the browser never holds a key and
 * the table has no anon/authenticated grant). The response carries a stable
 * error code plus the offending field, so a failure renders as a message the
 * visitor can act on in their own locale.
 *
 * While `REQUEST_INTAKE_ENABLED` is off — the fail-safe default on production
 * builds — the form renders the "coming soon" band and the endpoint answers
 * 503, so the two can never disagree about whether a submission is accepted.
 */
type FormValues = {
  name: string;
  email: string;
  company: string;
  website: string;
  type: string;
  budget: string;
  timeline: string;
  request: string;
  consent: boolean;
};

/**
 * The selects always hold a valid stored value: their first option is the
 * pre-selected default, exactly as before the form became controlled.
 */
function initialValues(options: RequestFormOptions): FormValues {
  return {
    name: '',
    email: '',
    company: '',
    website: '',
    request: '',
    consent: false,
    type: options.type[0].value,
    budget: options.budget[0].value,
    timeline: options.timeline[0].value,
  };
}

export function RequestForm() {
  const tFooter = useTranslations('footer');
  const currentLocale = useLocale();
  const copy = requestFormCopy(currentLocale);
  const options = requestFormOptions(currentLocale);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(() =>
    initialValues(options)
  );
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const fieldClass =
    'w-full rounded-lg border border-border-subtle bg-surface-base px-3 py-2.5 font-mono text-xs text-text-main placeholder:text-text-dim focus:border-accent-violet/60 focus:outline-none';
  // Mock's select: native appearance off, a chevron 8px from the right edge
  // and a 16px line box (see .request-select in globals.css).
  const selectClass = `${fieldClass} request-select`;
  const labelClass =
    'mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim';

  const update = (key: keyof FormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  };

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

  const optionItems = (items: { value: string; label: string }[]) =>
    items.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ));

  const pages = [
    [
      field(
        'request-name',
        copy.name,
        <input
          className={fieldClass}
          id="request-name"
          name="name"
          onChange={(event) => update('name', event.target.value)}
          placeholder={copy.namePlaceholder}
          type="text"
          value={values.name}
        />
      ),
      field(
        'request-email',
        copy.email,
        <input
          className={fieldClass}
          id="request-email"
          name="email"
          onChange={(event) => update('email', event.target.value)}
          placeholder={copy.emailPlaceholder}
          type="email"
          value={values.email}
        />
      ),
      field(
        'request-company',
        copy.company,
        <input
          className={fieldClass}
          id="request-company"
          name="company"
          onChange={(event) => update('company', event.target.value)}
          placeholder={copy.companyPlaceholder}
          type="text"
          value={values.company}
        />
      ),
      field(
        'request-website',
        copy.website,
        <input
          className={fieldClass}
          id="request-website"
          name="website"
          onChange={(event) => update('website', event.target.value)}
          placeholder={copy.websitePlaceholder}
          type="url"
          value={values.website}
        />
      ),
    ],
    [
      field(
        'request-type',
        copy.type,
        <select
          className={selectClass}
          id="request-type"
          name="type"
          onChange={(event) => update('type', event.target.value)}
          value={values.type}
        >
          {optionItems(options.type)}
        </select>
      ),
      field(
        'request-budget',
        copy.budget,
        <select
          className={selectClass}
          id="request-budget"
          name="budget"
          onChange={(event) => update('budget', event.target.value)}
          value={values.budget}
        >
          {optionItems(options.budget)}
        </select>
      ),
      field(
        'request-timeline',
        copy.timeline,
        <select
          className={selectClass}
          id="request-timeline"
          name="timeline"
          onChange={(event) => update('timeline', event.target.value)}
          value={values.timeline}
        >
          {optionItems(options.timeline)}
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
          onChange={(event) => update('request', event.target.value)}
          placeholder={copy.requestPlaceholder}
          rows={5}
          value={values.request}
        />,
        true
      ),
      <div className="flex justify-center sm:col-span-2" key="consent">
        <label className="flex max-w-md items-start gap-2 text-xs leading-relaxed text-text-dim">
          <input
            checked={values.consent}
            className="request-consent mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border-subtle bg-surface-base"
            name="consent"
            onChange={(event) => update('consent', event.target.checked)}
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setError(null);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locale: currentLocale === 'it' ? 'it' : 'en',
          name: values.name,
          email: values.email,
          company: values.company,
          website: values.website,
          type: values.type,
          budget: values.budget,
          timeline: values.timeline,
          request: values.request,
          consent: values.consent,
        }),
      });

      if (response.ok) {
        setStatus('sent');
        return;
      }

      const body: unknown = await response.json().catch(() => null);
      const code = readIntakeErrorCode(body);
      setStatus('idle');
      setError(
        code && code in copy.errors
          ? copy.errors[code as keyof typeof copy.errors]
          : copy.errors.generic
      );
    } catch {
      setStatus('idle');
      setError(copy.errors.network);
    }
  }

  if (status === 'sent') {
    return (
      <div className="relative mt-14 overflow-hidden rounded-2xl border border-border-subtle bg-surface-card p-6 sm:p-8">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-accent-violet">
          {copy.eyebrow}
        </p>
        <h3 className="mt-3 text-center font-heading text-xl font-semibold text-text-white">
          {copy.successTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-relaxed text-text-muted">
          {copy.successBody}
        </p>
        <div className="mt-7 flex justify-center">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-5 py-2.5 font-mono text-xs uppercase tracking-[0.08em] text-text-main transition-colors hover:border-accent-violet/50 hover:text-text-white"
            onClick={() => {
              setValues(initialValues(options));
              setStatus('idle');
              setStep(0);
            }}
            type="button"
          >
            {copy.sendAnother}
          </button>
        </div>
      </div>
    );
  }

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
        onSubmit={handleSubmit}
      >
        <div className="grid flex-1 grid-cols-1 content-start gap-5 sm:grid-cols-2">
          {pages[step]}
        </div>

        {error && (
          <p
            className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-xs leading-relaxed text-red-300"
            role="alert"
          >
            {error}
          </p>
        )}

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
              className="inline-flex items-center gap-2 rounded-lg bg-accent-violet px-6 py-2.5 font-mono text-xs uppercase tracking-[0.08em] text-text-on-accent transition-colors hover:bg-accent-violet-light"
              onClick={() =>
                setStep((current) => Math.min(pages.length - 1, current + 1))
              }
              type="button"
            >
              {copy.next}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-accent-violet px-6 py-2.5 font-mono text-xs uppercase tracking-[0.08em] text-text-on-accent transition-colors hover:bg-accent-violet-light disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status === 'sending'}
              type="submit"
            >
              <Send className="h-4 w-4" />
              {status === 'sending' ? copy.sending : copy.submit}
            </button>
          )}
        </div>
      </form>

      {/* Intake is closed (the fail-safe default on production builds): the
          band says so, and POST /api/requests answers 503 for the same flag,
          so a visitor can never believe a request was taken. */}
      {!publicConfig.requestIntakeEnabled && (
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
