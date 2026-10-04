/**
 * Renders a JSON-LD payload as a `<script type="application/ld+json">` tag.
 * Server component; the payload is built from our own data at render time.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
      type="application/ld+json"
    />
  );
}
