// Locate a citation quote inside raw markdown, tolerating the markdown syntax
// (**bold**, headers) and whitespace differences introduced when the backend
// extracted the quote. Returns the [start, end) range in the RAW string, or
// null if the quote can't be located.

function normalizeWithMap(raw: string): { norm: string; map: number[] } {
  const norm: string[] = [];
  const map: number[] = [];
  let prevSpace = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "*" || ch === "#" || ch === "`" || ch === "|") continue; // markdown noise
    if (/\s/.test(ch)) {
      if (prevSpace) continue;
      norm.push(" ");
      map.push(i);
      prevSpace = true;
    } else {
      norm.push(ch.toLowerCase());
      map.push(i);
      prevSpace = false;
    }
  }
  return { norm: norm.join(""), map };
}

function normalizeQuote(quote: string): string {
  return quote
    .replace(/[*#`|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function findQuoteRange(raw: string, quote: string): [number, number] | null {
  if (!quote) return null;
  const { norm, map } = normalizeWithMap(raw);
  const nq = normalizeQuote(quote);
  if (!nq) return null;

  let idx = norm.indexOf(nq);
  if (idx === -1) {
    // Fall back to the longest leading fragment that still matches uniquely.
    const words = nq.split(" ");
    for (let take = words.length - 1; take >= 4; take--) {
      const frag = words.slice(0, take).join(" ");
      idx = norm.indexOf(frag);
      if (idx !== -1) {
        const endNorm = idx + frag.length - 1;
        return [map[idx], map[endNorm] + 1];
      }
    }
    return null;
  }
  const endNorm = idx + nq.length - 1;
  return [map[idx], map[endNorm] + 1];
}
