// Outlook (Microsoft 365) integration: connect a mailbox, then log meetings
// and emails with CRM contacts as Activities on their account.
//
// Needs these settings in Vercel (Settings > Environment Variables), from the
// "Tractor CRM" app registration in Microsoft Entra:
//   MS_CLIENT_ID, MS_TENANT_ID, MS_CLIENT_SECRET
// and CRON_SECRET for the nightly sync. Redirect URI to register in Entra:
//   <CRM web address>/api/outlook/callback
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const SCOPES = ["offline_access", "User.Read", "Calendars.Read", "Mail.Read"];
const FIRST_SYNC_DAYS = 30; // how far back the first sync looks
const PREVIEW_CHARS = 160; // how much of an email's text is kept

export function outlookConfigured() {
  return Boolean(process.env.MS_CLIENT_ID && process.env.MS_TENANT_ID && process.env.MS_CLIENT_SECRET);
}

function authority() {
  return `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0`;
}

export function redirectUri(origin: string) {
  const base = (process.env.NEXTAUTH_URL || origin).replace(/\/$/, "");
  return `${base}/api/outlook/callback`;
}

export function authorizeUrl(origin: string, state: string) {
  const p = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri(origin),
    response_mode: "query",
    scope: SCOPES.join(" "),
    state,
    prompt: "select_account",
  });
  return `${authority()}/authorize?${p.toString()}`;
}

// ---- Token storage (AES-256-GCM, key derived from NEXTAUTH_SECRET) ----
function key() {
  return createHash("sha256").update(`${process.env.NEXTAUTH_SECRET ?? ""}:outlook-tokens`).digest();
}
export function encrypt(text: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decrypt(payload: string) {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

// ---- Microsoft identity platform ----
type TokenResponse = { access_token: string; refresh_token?: string; error?: string; error_description?: string };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${authority()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MS_CLIENT_ID!,
      client_secret: process.env.MS_CLIENT_SECRET!,
      scope: SCOPES.join(" "),
      ...params,
    }),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description?.split("\r\n")[0] || data.error || `Microsoft sign-in failed (${res.status})`);
  }
  return data;
}

export function exchangeCode(code: string, origin: string) {
  return tokenRequest({ grant_type: "authorization_code", code, redirect_uri: redirectUri(origin) });
}

async function graph<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url.startsWith("http") ? url : `https://graph.microsoft.com/v1.0${url}`, {
    headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Outlook request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

// Follow @odata.nextLink pages, up to a sensible cap
async function graphAll<T>(token: string, url: string, max = 1000): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined = url;
  while (next && out.length < max) {
    const page: { value: T[]; "@odata.nextLink"?: string } = await graph(token, next);
    out.push(...page.value);
    next = page["@odata.nextLink"];
  }
  return out;
}

export async function getProfile(token: string) {
  return graph<{ mail?: string; userPrincipalName: string }>(token, "/me?$select=mail,userPrincipalName");
}

// ---- Sync ----
type Addr = { emailAddress?: { address?: string; name?: string } };
type GraphEvent = {
  id: string;
  subject?: string;
  start: { dateTime: string };
  isCancelled?: boolean;
  sensitivity?: string;
  attendees?: Addr[];
  organizer?: Addr;
  location?: { displayName?: string };
};
type GraphMessage = {
  id: string;
  subject?: string;
  bodyPreview?: string;
  from?: Addr;
  toRecipients?: Addr[];
  ccRecipients?: Addr[];
  receivedDateTime: string;
  isDraft?: boolean;
};

const lower = (a?: Addr) => a?.emailAddress?.address?.trim().toLowerCase() || "";

export type SyncResult = { logged: number; meetings: number; emails: number };

// Sync one person's Outlook. Only meetings and emails that involve someone
// in Contacts (matched on email address) are logged, under that person's name.
// Re-running never doubles up: each Outlook item is logged once per person.
export async function syncConnection(connectionId: string): Promise<SyncResult> {
  const conn = await prisma.outlookConnection.findUnique({ where: { id: connectionId } });
  if (!conn) throw new Error("Not connected");

  try {
    // Fresh access token (Microsoft may also hand back a new refresh token)
    const tokens = await tokenRequest({ grant_type: "refresh_token", refresh_token: decrypt(conn.refreshToken) });
    const token = tokens.access_token;
    if (tokens.refresh_token) {
      await prisma.outlookConnection.update({ where: { id: conn.id }, data: { refreshToken: encrypt(tokens.refresh_token) } });
    }

    const now = new Date();
    const since = conn.lastSyncAt
      ? new Date(conn.lastSyncAt.getTime() - 24 * 60 * 60 * 1000) // a day of overlap, in case of late edits
      : new Date(now.getTime() - FIRST_SYNC_DAYS * 24 * 60 * 60 * 1000);

    // Contacts by email address
    const contacts = await prisma.contact.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true, accountId: true },
    });
    const byEmail = new Map(contacts.map((c) => [c.email!.trim().toLowerCase(), c]));
    const me = conn.msEmail.toLowerCase();

    type Item = { ref: string; type: "MEETING" | "EMAIL"; date: Date; description: string; addresses: string[] };
    const items: Item[] = [];

    // Past calendar meetings (not cancelled, not marked private)
    const events = await graphAll<GraphEvent>(
      token,
      `/me/calendarView?startDateTime=${since.toISOString()}&endDateTime=${now.toISOString()}` +
        `&$select=id,subject,start,isCancelled,sensitivity,attendees,organizer,location&$top=100`
    );
    for (const e of events) {
      if (e.isCancelled || e.sensitivity === "private" || e.sensitivity === "confidential") continue;
      const where = e.location?.displayName ? ` (${e.location.displayName})` : "";
      items.push({
        ref: `outlook:${conn.userId}:event:${e.id}`,
        type: "MEETING",
        date: new Date(`${e.start.dateTime.replace(/Z?$/, "Z")}`),
        description: `${e.subject?.trim() || "Meeting"}${where} - from Outlook`.slice(0, 500),
        addresses: [...(e.attendees ?? []).map(lower), lower(e.organizer)],
      });
    }

    // Emails sent and received
    const messages = await graphAll<GraphMessage>(
      token,
      `/me/messages?$filter=receivedDateTime ge ${since.toISOString()}` +
        `&$select=id,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isDraft&$top=100&$orderby=receivedDateTime desc`
    );
    for (const m of messages) {
      if (m.isDraft) continue;
      const from = lower(m.from);
      const sent = from === me;
      const preview = (m.bodyPreview ?? "").replace(/\s+/g, " ").trim().slice(0, PREVIEW_CHARS);
      items.push({
        ref: `outlook:${conn.userId}:mail:${m.id}`,
        type: "EMAIL",
        date: new Date(m.receivedDateTime),
        description: `${sent ? "Sent" : "Received"}: ${m.subject?.trim() || "(no subject)"}${preview ? ` - ${preview}${preview.length >= PREVIEW_CHARS ? "..." : ""}` : ""}`.slice(0, 500),
        addresses: sent ? [...(m.toRecipients ?? []), ...(m.ccRecipients ?? [])].map(lower) : [from],
      });
    }

    // One activity per item per account involved (first matching contact on it)
    const rows: { externalReferenceId: string; accountId: string; contactId: string; type: "MEETING" | "EMAIL"; description: string; activityDate: Date; ownerId: string }[] = [];
    for (const it of items) {
      const seenAccounts = new Set<string>();
      for (const addr of it.addresses) {
        const c = addr && addr !== me ? byEmail.get(addr) : undefined;
        if (!c || seenAccounts.has(c.accountId)) continue;
        seenAccounts.add(c.accountId);
        rows.push({
          externalReferenceId: `${it.ref}:${c.accountId}`,
          accountId: c.accountId,
          contactId: c.id,
          type: it.type,
          description: it.description,
          activityDate: it.date,
          ownerId: conn.userId,
        });
      }
    }

    // Skip anything already logged
    const existing = rows.length
      ? new Set(
          (
            await prisma.activity.findMany({
              where: { externalReferenceId: { in: rows.map((r) => r.externalReferenceId) } },
              select: { externalReferenceId: true },
            })
          ).map((a) => a.externalReferenceId)
        )
      : new Set<string | null>();
    const fresh = rows.filter((r) => !existing.has(r.externalReferenceId));
    if (fresh.length) await prisma.activity.createMany({ data: fresh, skipDuplicates: true });

    await prisma.outlookConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: now, lastError: null, lastLogged: fresh.length },
    });
    return {
      logged: fresh.length,
      meetings: fresh.filter((r) => r.type === "MEETING").length,
      emails: fresh.filter((r) => r.type === "EMAIL").length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.outlookConnection.update({ where: { id: conn.id }, data: { lastError: message.slice(0, 300) } });
    throw err;
  }
}
