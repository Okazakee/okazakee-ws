export const ErrorDiv = ({ children }: { children: React.ReactNode }) => (
  <div className="my-24 flex items-center justify-center">
    <p className="rounded-xl border border-border-subtle bg-surface-card px-6 py-8 font-mono text-sm text-text-dim">
      {children}
    </p>
  </div>
);
