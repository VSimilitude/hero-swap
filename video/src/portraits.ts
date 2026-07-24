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

// Resolve a free-text hero name to its roster slug, or null when unknown.
export function resolveSlug(heroName: string): string | null {
  if (!heroName) return null;
  const key = normalize(heroName);
  if (SLUG_SET.has(key)) return key;
  return ALIASES[key] ?? null;
}

// Resolve a free-text hero name to a portrait URL, or null when unknown.
// Unknown heroes keep the flat text-only card — user names are free text, so a
// graceful null fallback is essential.
export function portraitFor(heroName: string): string | null {
  const slug = resolveSlug(heroName);
  return slug ? portraitUrl(slug) : null;
}

// Display names for the roster. Most are just the slug title-cased; the few
// that don't title-case cleanly are overridden here.
const DISPLAY_OVERRIDES: Record<string, string> = {
  dva: "DVA",
  mcgregor: "McGregor",
};

function displayName(slug: string): string {
  return DISPLAY_OVERRIDES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

export type RosterHero = { slug: string; name: string };

// The selectable roster for the page's hero pickers: every portrait-backed hero
// EXCEPT Sarah, who is the fixed start of every chain and never a swap target.
// Order is alphabetical by display name for a tidy dropdown.
export const ROSTER: RosterHero[] = AVAILABLE_SLUGS.filter((s) => s !== "sarah")
  .map((slug) => ({ slug, name: displayName(slug) }))
  .sort((a, b) => a.name.localeCompare(b.name));

// The alias map, exposed read-only so the page's typeahead can match nicknames
// ("kim" → Kimberly) without re-implementing the list.
export const ROSTER_ALIASES: Readonly<Record<string, string>> = ALIASES;
