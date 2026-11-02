// Company-name cleaning shared by the Nielsen matching and the sales report
// import. Kept free of data imports so it can also run in the browser.
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

// "Omnicom Media Group SA (Pty) Ltd" -> "OMNICOMMEDIA"; "X t/a McDonalds" -> "MCDONALDS"
export function companyKey(name: string): string {
  const trading = name.match(/\bt\/a\b\s*(.+)$/i);
  return normalizeName(trading ? trading[1] : name).replace(/ /g, "");
}
