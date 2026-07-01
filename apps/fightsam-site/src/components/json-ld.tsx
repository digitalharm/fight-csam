type Json = Record<string, unknown>;

/**
 * Renders a schema.org JSON-LD block. Data is static, build-time content — safe
 * to inline via dangerouslySetInnerHTML.
 */
export function JsonLd({ data }: { data: Json | Json[] }) {
  // Escape `<` so a stray "</script>" in any string can't break out of the tag.
  // The data is our own build-time content; this is the standard JSON-LD
  // hardening and leaves the JSON valid (< === "<").
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
