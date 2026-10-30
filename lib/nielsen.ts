// Nielsen out-of-home ad spend (market data), bundled with the app as a data
// file so no database changes are needed. To add another year, convert the
// Nielsen export into the same shape and add it alongside this one.
//
// Matching to CRM accounts is automatic, by name: an account matches a
// Nielsen brand whose name is the same, or starts with the account's name
// ("Vodacom" -> VODACOM, VODACOM IPHONE, ...). If no brand matches, the
// account can match a Nielsen advertiser (the parent company) instead.
// Names that need a manual link go in MANUAL_MATCHES below.
import raw from "@/lib/data/nielsen-2025.json";

type Raw = {
  source: string;
  period: string;
  year: number;
  media: string[];
  digital: number[];
  advertisers: string[];
  rows: [number, string, number[]][];
};
const data = raw as Raw;

export const NIELSEN_SOURCE = data.source;
export const NIELSEN_PERIOD = data.period;
export const NIELSEN_YEAR = data.year;
export const MEDIA = data.media;
export const DIGITAL_MEDIA = new Set(data.digital);
export const MEDIA_COLORS = ["#4C22F2", "#000000", "#04CA95", "#9CA3AF", "#FF005B", "#F7D849", "#D1D5DB"];

// CRM account name -> Nielsen brand or advertiser names (exactly as Nielsen
// writes them), for names the automatic matching can't work out.
// Example: "Castle Lager": ["CASTLE LITE"],
export const MANUAL_MATCHES: Record<string, string[]> = {};

export type BrandRow = { advertiser: string; advertiserIdx: number; brand: string; byMedia: number[]; total: number };

export const BRANDS: BrandRow[] = data.rows.map(([a, b, m]) => ({
  advertiser: data.advertisers[a],
  advertiserIdx: a,
  brand: b,
  byMedia: m,
  total: m.reduce((s, v) => s + v, 0),
}));

export const MARKET_TOTAL = BRANDS.reduce((s, b) => s + b.total, 0);

export function sumMedia(rows: { byMedia: number[] }[]): number[] {
  const out = MEDIA.map(() => 0);
  for (const r of rows) r.byMedia.forEach((v, i) => (out[i] += v));
  return out;
}

export function spendFor(row: { byMedia: number[]; total: number }, media: number | null): number {
  return media === null ? row.total : row.byMedia[media] ?? 0;
}

const STOP = new Set([
  "PTY", "LTD", "LIMITED", "GROUP", "HOLDINGS", "HOLDING", "SOC", "CO", "CORPORATION", "CORP", "INC", "PLC",
  "SOUTH", "AFRICA", "SA", "THE", "RSA", "COM",
]);

export function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/['’`]/g, "")
    .replace(/\.COM\b/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOP.has(w))
    .join(" ");
}

const brandKeys = BRANDS.map((b) => normalizeName(b.brand));
const advertiserKeys = data.advertisers.map((a) => normalizeName(a));

export type AccountMatch = {
  brands: BrandRow[];
  byMedia: number[];
  total: number;
  via: "brand" | "advertiser" | "manual";
};

export function matchAccountName(name: string): AccountMatch | null {
  const manual = MANUAL_MATCHES[name];
  let brands: BrandRow[] = [];
  let via: AccountMatch["via"] = "brand";
  if (manual?.length) {
    const wanted = new Set(manual.map((m) => m.toUpperCase()));
    brands = BRANDS.filter((b) => wanted.has(b.brand.toUpperCase()) || wanted.has(b.advertiser.toUpperCase()));
    via = "manual";
  } else {
    const key = normalizeName(name);
    if (key.length < 2) return null;
    brands = BRANDS.filter((_, i) => brandKeys[i] === key || (key.length >= 3 && brandKeys[i].startsWith(key + " ")));
    if (brands.length === 0) {
      const advs = new Set(advertiserKeys.map((k, i) => (k === key ? i : -1)).filter((i) => i >= 0));
      brands = BRANDS.filter((b) => advs.has(b.advertiserIdx));
      via = "advertiser";
    }
  }
  if (brands.length === 0) return null;
  const byMedia = sumMedia(brands);
  return { brands: brands.sort((a, b) => b.total - a.total), byMedia, total: byMedia.reduce((s, v) => s + v, 0), via };
}

// Nielsen names are all capitals - make them easier to read.
export function niceName(name: string): string {
  return name
    .toLowerCase()
    .split(/(\s+|-|\/|\()/)
    .map((w) => {
      const letters = w.replace(/[^a-z]/g, "");
      if (!letters) return w;
      if (letters.length <= 3 && !/[aeiou]/.test(letters)) return w.toUpperCase();
      if (["sa", "pty", "ltd", "soc", "kfc", "mtn", "bmw", "dstv", "tv", "fm", "ok", "absa", "fnb"].includes(letters)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join("");
}

// Billboards only (digital + classic) - Tractor's own category, used for the
// billboard share of wallet.
export const BILLBOARD_MEDIA = [0, 1];
export function billboardSpend(row: { byMedia: number[] }): number {
  return BILLBOARD_MEDIA.reduce((s, i) => s + (row.byMedia[i] ?? 0), 0);
}
