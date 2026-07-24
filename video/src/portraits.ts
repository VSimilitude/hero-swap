// Build-time manifest of hero portraits available under assets/heroes/.
// Keep AVAILABLE_SLUGS in sync with that directory (regenerate by listing it:
//   ls assets/heroes/*.webp | xargs -n1 basename | sed 's/\.webp$//'
// ). Portraits are same-origin static WebP files served from the repo root, so
// no external hosts are involved.

export const AVAILABLE_SLUGS = [
  "adam",
  "ambolt",
  "blaz",
  "cage",
  "carlie",
  "dva",
  "elsa",
  "farhad",
  "fiona",
  "gump",
  "kane",
  "kimberly",
  "loki",
  "lucius",
  "marshall",
  "mason",
  "maxwell",
  "mcgregor",
  "monica",
  "morrison",
  "murphy",
  "richard",
  "sarah",
  "scarlett",
  "schuyler",
  "stetmann",
  "swift",
  "tesla",
  "venom",
  "violet",
  "williams",
] as const;

const SLUG_SET = new Set<string>(AVAILABLE_SLUGS);

// Common short forms / nicknames the user might type that map to a real slug.
const ALIASES: Record<string, string> = {
  kim: "kimberly",
  kimmy: "kimberly",
  greg: "mcgregor",
  d_v_a: "dva",
};

// Normalize a free-text hero name to a candidate slug: trim, lowercase, and
// drop spaces / dots / apostrophes so "McGregor", "D.V.A", "O'Neil" collapse.
function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/[\s.'’-]+/g, "");
}

// Relative URL for a slug's portrait. Resolves against the page base (repo
// root) when the Player is embedded in index.html.
export function portraitUrl(slug: string): string {
  return `assets/heroes/${slug}.webp`;
}

// Resolve a free-text hero name to a portrait URL, or null when unknown.
// Unknown heroes keep the flat text-only card — user names are free text, so a
// graceful null fallback is essential.
export function portraitFor(heroName: string): string | null {
  if (!heroName) return null;
  const key = normalize(heroName);
  const slug = SLUG_SET.has(key) ? key : ALIASES[key];
  return slug ? portraitUrl(slug) : null;
}
