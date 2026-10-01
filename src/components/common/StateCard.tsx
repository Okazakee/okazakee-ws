import type React from 'react';

/**
 * Full-page state card (docs/DESIGN.md §6): the terminal-window frame used by
 * the 404 and error screens, centred between the header and the footer.
 */
export function StateCard({
  label,
  hint,
  code,
  title,
  text,
  children,
}: {
  label: string;
  hint: string;
  code: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto my-auto w-full max-w-5xl px-6 py-24">
      <div className="mx-auto w-full max-w-xl">
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card">
          <div className="flex items-center gap-1.5 border-b border-border-subtle bg-surface-alt/60 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[11px] text-text-dim">
              {label}
            </span>
          </div>

          <div className="px-6 py-12 text-center sm:px-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent-violet">
              {hint}
            </p>
            <p className="mt-6 font-mono text-5xl font-semibold tracking-tight text-text-white sm:text-6xl">
              {code}
            </p>
            <h1 className="mt-6 font-heading text-xl font-semibold text-text-white sm:text-2xl">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-muted">
              {text}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
