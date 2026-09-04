/**
 * Long date ("Talaado, 25 Agoosto 2026") in the active language. The browser's
 * Intl data has no Somali locale, so the Somali names are supplied here.
 */
const SO_DAYS = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimco', 'Sabti'];
const SO_MONTHS = ['Janaayo', 'Febraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun',
  'Luuliyo', 'Agoosto', 'Sebtembar', 'Oktoobar', 'Nofembar', 'Desembar'];

export function formatLongDate(date, language) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  if (language === 'so') {
    return `${SO_DAYS[d.getDay()]}, ${d.getDate()} ${SO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatShortDate(date, language) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  if (language === 'so') {
    return `${d.getDate()} ${SO_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
