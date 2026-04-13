function decodeJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(decoded) as { ref?: string; role?: string };
  } catch {
    return null;
  }
}

function getProjectRefFromUrl(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function assertSupabaseEnvPair(url: string | undefined, key: string | undefined, keyName: string) {
  if (!url || !key) {
    throw new Error(`Missing Supabase environment variable: ${!url ? "NEXT_PUBLIC_SUPABASE_URL" : keyName}`);
  }

  const urlRef = getProjectRefFromUrl(url);
  const payload = decodeJwtPayload(key);
  const keyRef = payload?.ref || null;

  if (urlRef && keyRef && urlRef !== keyRef) {
    throw new Error(
      `Supabase env mismatch: NEXT_PUBLIC_SUPABASE_URL points to project "${urlRef}" but ${keyName} belongs to project "${keyRef}".`
    );
  }
}

export function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assertSupabaseEnvPair(url, anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return { url: url as string, anonKey: anonKey as string };
}

export function getSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assertSupabaseEnvPair(url, serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  return { url: url as string, serviceRoleKey: serviceRoleKey as string };
}
