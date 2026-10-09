import requestFormEn from '@/i18n/messages/requestForm.en.json';
import requestFormIt from '@/i18n/messages/requestForm.it.json';
import {
  REQUEST_BUDGET_OPTIONS,
  REQUEST_TIMELINE_OPTIONS,
  REQUEST_TYPE_OPTIONS,
  type RequestBudget,
  type RequestTimeline,
  type RequestType,
} from '@/libs/requests/intake';

/**
 * Per-locale copy for the project-request form.
 *
 * The OPTION VALUES are the wire/storage vocabulary (`Website`, `€1–5k`,
 * `ASAP`, …): they are CHECK-constrained on `project_requests` and rendered
 * back in the CMS inbox, so they are identical in both locales. Only the
 * labels a visitor reads are localized, via `optionLabels` keyed by that same
 * value. Splitting the two is what lets an Italian visitor read "Sito web"
 * while the stored row still says `Website`.
 *
 * This copy lives in the site, not in `i18n_translations`: the form's field
 * labels are site invariants (like the post-button labels), and an editor
 * cannot retitle a required form control or a validation message.
 */

export type RequestFormCopy = typeof requestFormEn;

/** Option values paired with their localized labels, in stored order. */
export type RequestFormOptions = {
  type: { value: RequestType; label: string }[];
  budget: { value: RequestBudget; label: string }[];
  timeline: { value: RequestTimeline; label: string }[];
};

const copy = {
  en: requestFormEn,
  it: requestFormIt,
} as const satisfies Record<string, RequestFormCopy>;

export function requestFormCopy(locale: string): RequestFormCopy {
  return locale === 'it' ? copy.it : copy.en;
}

export function requestFormOptions(locale: string): RequestFormOptions {
  const messages = requestFormCopy(locale);
  return {
    type: REQUEST_TYPE_OPTIONS.map((value) => ({
      value,
      label: messages.optionLabels.type[value],
    })),
    budget: REQUEST_BUDGET_OPTIONS.map((value) => ({
      value,
      label: messages.optionLabels.budget[value],
    })),
    timeline: REQUEST_TIMELINE_OPTIONS.map((value) => ({
      value,
      label: messages.optionLabels.timeline[value],
    })),
  };
}
