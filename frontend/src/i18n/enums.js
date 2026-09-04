/**
 * Database enum codes (campaign types, inventory categories, audit actions, ...)
 * arrive as upper-snake-case strings. `enumLabel` renders them in the active
 * language, falling back to a prettified version of the code itself so a value
 * that has no translation yet still reads correctly instead of showing a key.
 */
export function enumLabel(t, code) {
  if (!code) return '';
  const key = `enums.${String(code).toUpperCase()}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return String(code).replace(/_/g, ' ');
}

export default enumLabel;
