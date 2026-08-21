export function initialPreferredTitles(employmentTitles: string[], storedTitles: string[], limit = 12) {
  const seen = new Set<string>();
  return [...storedTitles, ...employmentTitles].map(title => title.trim()).filter(Boolean).filter(title => {
    const key = title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}

export function addPreferredTitle(currentTitles: string[], title: string, limit = 12) {
  return initialPreferredTitles([], [...currentTitles, title], limit);
}
