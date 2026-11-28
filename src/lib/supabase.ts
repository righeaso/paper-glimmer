import {createClient, type SupabaseClient} from '@supabase/supabase-js';

const rawViteUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const rawNextUrl = (import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || '').trim();

const rawViteAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();
const rawVitePubKey = (
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || ''
).trim();
const rawNextAnonKey = (
  import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
).trim();
const rawNextPubKey = (
  import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
).trim();

const supabaseUrl = rawViteUrl || rawNextUrl;
const supabaseKey =
  rawViteAnonKey || rawVitePubKey || rawNextAnonKey || rawNextPubKey;

export const supabaseEnvStatus = {
  VITE_SUPABASE_URL: Boolean(rawViteUrl),
  VITE_SUPABASE_ANON_KEY: Boolean(rawViteAnonKey),
  VITE_SUPABASE_PUBLISHABLE_KEY: Boolean(rawVitePubKey),
  NEXT_PUBLIC_SUPABASE_URL: Boolean(rawNextUrl),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(rawNextAnonKey),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(rawNextPubKey),
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && isValidHttpUrl(supabaseUrl),
);

export function getSupabaseEnvDiagnostic(): string {
  const urlItems = [
    `VITE_SUPABASE_URL: ${supabaseEnvStatus.VITE_SUPABASE_URL ? '已偵測' : '未偵測'}`,
    `VITE_SUPABASE_ANON_KEY: ${supabaseEnvStatus.VITE_SUPABASE_ANON_KEY ? '已偵測' : '未偵測'}`,
  ];
  const fallbackItems: string[] = [];
  if (supabaseEnvStatus.NEXT_PUBLIC_SUPABASE_URL) {
    fallbackItems.push('NEXT_PUBLIC_SUPABASE_URL: 已偵測');
  }
  if (supabaseEnvStatus.VITE_SUPABASE_PUBLISHABLE_KEY) {
    fallbackItems.push('VITE_SUPABASE_PUBLISHABLE_KEY: 已偵測');
  }
  if (supabaseEnvStatus.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    fallbackItems.push('NEXT_PUBLIC_SUPABASE_ANON_KEY: 已偵測');
  }
  if (supabaseEnvStatus.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    fallbackItems.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 已偵測');
  }

  const invalidUrlHint =
    supabaseUrl && !isValidHttpUrl(supabaseUrl)
      ? '；偵測到的 URL 格式無效（需為 https:// 開頭）'
      : '';

  return [...urlItems, ...fallbackItems].join(' · ') + invalidUrlHint;
}

function createSafeSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  } catch {
    return null;
  }
}

export const supabase: SupabaseClient | null = createSafeSupabaseClient();
